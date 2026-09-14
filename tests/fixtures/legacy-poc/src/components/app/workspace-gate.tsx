import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { Box, Button, Inline, Input, Stack, toast } from "@ledger/design-system";

import {
  getWorkspaceClient,
  supabaseWorkspaceRepository,
  usesSupabaseWorkspace,
} from "@/lib/supabase-workspace";
import { restoreWorkspaceRecords } from "@/lib/workspace-restore";
import {
  flushWorkspacePersistence,
  getWorkspacePersistenceStatus,
  initializeWorkspaceStorage,
  retryWorkspacePersistence,
  setWorkspaceStoragePending,
  subscribeWorkspacePersistence,
} from "@/lib/workspace-storage";

type BootResult = { phase: "ready"; email: string } | { phase: "login" };
let boot: Promise<BootResult> | undefined = import.meta.hot?.data["workspaceBoot"];
if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    data["workspaceBoot"] = boot;
  });
}

function startWorkspace(): Promise<BootResult> {
  return (boot ??= (async () => {
    let email = "";
    if (usesSupabaseWorkspace) {
      setWorkspaceStoragePending();
      const { data, error } = await getWorkspaceClient().auth.getSession();
      if (error) throw error;
      if (!data.session) return { phase: "login" };
      email = data.session.user.email ?? "Local account";
      await initializeWorkspaceStorage(supabaseWorkspaceRepository(data.session.user.id));
    }
    const errors = restoreWorkspaceRecords();
    if (errors.length) {
      if (usesSupabaseWorkspace)
        throw new Error(`Saved workspace records could not be restored. ${errors.join(" ")}`);
      toast.add({
        title: "Some saved workspace records could not be restored",
        type: "error",
        timeout: 8000,
        description: errors.join(" "),
      });
    }
    return { phase: "ready", email };
  })());
}

function WorkspaceScreen({ children }: { children: ReactNode }) {
  return (
    <Inline className="min-h-screen bg-surface px-300" alignBlock="center" alignInline="center">
      <Stack space="space.200" className="w-full max-w-layout-measure">
        {children}
      </Stack>
    </Inline>
  );
}

function WorkspaceLogin() {
  const [email, setEmail] = useState("developer@program-assurance.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await getWorkspaceClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Domain stores are page singletons; a new session starts with a clean restore.
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
      setBusy(false);
    }
  }
  return (
    <WorkspaceScreen>
      <h1 className="font-heading-large font-semibold">Program Assurance</h1>
      <p>Sign in to your local workspace.</p>
      <form onSubmit={(event) => void signIn(event)}>
        <Stack space="space.200">
          <label htmlFor="workspace-email">Email</label>
          <Input
            id="workspace-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="workspace-password">Password</label>
          <Input
            id="workspace-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p role="alert">{error}</p>}
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </Stack>
      </form>
    </WorkspaceScreen>
  );
}

function WorkspaceSaveStatus({ email }: { email: string }) {
  const status = useSyncExternalStore(
    subscribeWorkspacePersistence,
    getWorkspacePersistenceStatus,
    getWorkspacePersistenceStatus,
  );
  const [sessionError, setSessionError] = useState("");
  const unsaved =
    status.state === "saving" || status.state === "error" || status.state === "conflict";
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      const current = getWorkspacePersistenceStatus().state;
      if (current !== "saving" && current !== "error" && current !== "conflict") return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);
  async function signOut() {
    try {
      await flushWorkspacePersistence();
      const { error } = await getWorkspaceClient().auth.signOut({ scope: "local" });
      if (error) throw error;
      window.location.reload();
    } catch (cause) {
      setSessionError(cause instanceof Error ? cause.message : "Could not sign out.");
    }
  }
  return (
    <Box
      padding="space.150"
      backgroundColor="elevation.surface.overlay"
      className="fixed bottom-200 right-200 z-50 max-w-layout-measure shadow-overlay"
      aria-label="Workspace save status"
    >
      <Inline space="space.150" alignBlock="center" shouldWrap>
        <span role="status">
          {status.state === "saved"
            ? "Saved to local Supabase"
            : status.state === "saving"
              ? "Saving to local Supabase…"
              : "Changes are not saved"}
        </span>
        <span className="text-subtle font-body-small">{email}</span>
        <Button variant="subtle" size="small" disabled={unsaved} onClick={() => void signOut()}>
          Sign out
        </Button>
      </Inline>
      {status.error && (
        <p role="alert" className="pt-100">
          {status.error}
        </p>
      )}
      {status.state === "error" && (
        <Button
          variant="secondary"
          size="small"
          onClick={() => void retryWorkspacePersistence().catch(() => undefined)}
        >
          Retry save
        </Button>
      )}
      {status.state === "conflict" && (
        <p className="pt-100">
          Another tab saved newer changes. Copy your unsaved edits before reloading this tab.
        </p>
      )}
      {sessionError && <p role="alert">{sessionError}</p>}
    </Box>
  );
}

/** Auth and database hydration finish before any domain hook restores its singleton store. */
export function WorkspaceGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<BootResult | { phase: "loading" | "error"; error?: string }>({
    phase: "loading",
  });
  useEffect(() => {
    let active = true;
    void startWorkspace()
      .then(async (result) => {
        if (result.phase === "ready") await router.invalidate();
        if (active) setState(result);
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            phase: "error",
            error: error instanceof Error ? error.message : "Workspace loading failed.",
          });
      });
    return () => {
      active = false;
    };
  }, [router]);
  if (state.phase === "login") return <WorkspaceLogin />;
  if (state.phase === "error")
    return (
      <WorkspaceScreen>
        <h1 className="font-heading-small font-semibold">Workspace unavailable</h1>
        <p role="alert">{state.error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </WorkspaceScreen>
    );
  if (state.phase !== "ready")
    return (
      <WorkspaceScreen>
        <p role="status">Loading workspace…</p>
      </WorkspaceScreen>
    );
  return (
    <>
      {children}
      {usesSupabaseWorkspace && <WorkspaceSaveStatus email={state.email} />}
    </>
  );
}
