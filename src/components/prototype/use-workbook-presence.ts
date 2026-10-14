import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "@/lib/database";

/** A location hint, never a document edit, lock or verified user identity. */
export type WorkbookPresenceSelection = {
  sheetId: string;
  rowId?: string | undefined;
  columnId?: string | undefined;
};
export type WorkbookParticipant = {
  id: string;
  label: string;
  sheetId?: string | undefined;
  rowId?: string | undefined;
  columnId?: string | undefined;
};
type Connection = {
  status: "connecting" | "connected" | "disconnected";
  participants: WorkbookParticipant[];
  error?: string | undefined;
};

const safeId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const sessionId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/.test(value);

/** Treat peer payloads as untrusted hints; do not render peer-provided names, styles or content. */
export function workbookParticipants(
  state: Record<string, readonly unknown[]>,
  ownSession: string,
): WorkbookParticipant[] {
  const peers = new Map<string, WorkbookParticipant>();
  for (const [key, entries] of Object.entries(state)) {
    if (!sessionId(key) || key === ownSession) continue;
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      const payload = entry as Record<string, unknown>;
      if (payload["sessionId"] !== key) continue;
      peers.set(key, {
        id: key,
        label: `Reader ${key.slice(0, 6)}`,
        ...(safeId(payload["sheetId"]) ? { sheetId: payload["sheetId"] } : {}),
        ...(safeId(payload["rowId"]) ? { rowId: payload["rowId"] } : {}),
        ...(safeId(payload["columnId"]) ? { columnId: payload["columnId"] } : {}),
      });
    }
    if (peers.size >= 100) break;
  }
  return [...peers.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Private, authenticated Presence; the host can disable it without affecting the workbook.
 * Location hints are throttled and ephemeral. Canonical saves still use revision-checked RPCs.
 */
export function useWorkbookPresence(
  programId: string,
  selection?: WorkbookPresenceSelection,
  enabled = true,
) {
  const workspace = useWorkspace();
  const ownSession = useRef(crypto.randomUUID());
  const latest = useRef(selection);
  latest.current = selection;
  const channel = useRef<RealtimeChannel | null>(null);
  const connected = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [connection, setConnection] = useState<Connection>({
    status: "disconnected",
    participants: [],
  });

  const track = useCallback(async () => {
    const current = channel.current;
    if (!current || !connected.current) return;
    const location = latest.current;
    const result = await current.track({
      sessionId: ownSession.current,
      ...(safeId(location?.sheetId) ? { sheetId: location.sheetId } : {}),
      ...(safeId(location?.rowId) ? { rowId: location.rowId } : {}),
      ...(safeId(location?.columnId) ? { columnId: location.columnId } : {}),
    });
    if (result !== "ok" && channel.current === current) {
      connected.current = false;
      setConnection({
        status: "disconnected",
        participants: [],
        error: "Presence is unavailable. Workbook changes remain available.",
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled || !programId) {
      setConnection({ status: "disconnected", participants: [] });
      return;
    }
    let active = true;
    const client = database();
    let current: RealtimeChannel | undefined;
    setConnection({ status: "connecting", participants: [] });
    const disconnect = (error: string) => {
      if (!active) return;
      connected.current = false;
      setConnection({ status: "disconnected", participants: [], error });
    };
    const auth = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id !== workspace.userId) {
        disconnect("Presence disconnected because your sign-in changed.");
        if (current) void client.removeChannel(current);
      }
    });
    void (async () => {
      const token = await requireIdentity({ userId: workspace.userId });
      if (!active) return;
      await client.realtime.setAuth(token);
      if (!active) return;
      current = client.channel(`assurance-workbook:${workspace.tenantId}:${programId}`, {
        config: { private: true, presence: { key: ownSession.current } },
      });
      channel.current = current;
      current.on("presence", { event: "sync" }, () => {
        if (!active || !current || !connected.current) return;
        setConnection({
          status: "connected",
          participants: workbookParticipants(current.presenceState(), ownSession.current),
        });
      });
      current.subscribe((status) => {
        if (!active) return;
        if (status === "SUBSCRIBED") {
          connected.current = true;
          setConnection({ status: "connected", participants: [] });
          void track().catch(() => disconnect("Presence is unavailable. Retry the connection."));
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          disconnect("Presence is unavailable. Retry the connection.");
        }
      }, 5_000);
    })().catch(() =>
      disconnect("Presence could not connect to this program. Retry the connection."),
    );
    return () => {
      active = false;
      connected.current = false;
      auth.data.subscription.unsubscribe();
      if (channel.current === current) channel.current = null;
      if (current) void client.removeChannel(current);
    };
  }, [enabled, programId, workspace.tenantId, workspace.userId, attempt, track]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void track().catch(() => {
        connected.current = false;
        setConnection({
          status: "disconnected",
          participants: [],
          error: "Presence is unavailable.",
        });
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [selection?.sheetId, selection?.rowId, selection?.columnId, track]);

  return { ...connection, reconnect: () => setAttempt((value) => value + 1) };
}
