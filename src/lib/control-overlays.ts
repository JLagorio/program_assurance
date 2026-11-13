import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { SupportedTechnique } from "./frameworks";
import type { ReadContext, Row } from "./models";

type Client = Pick<SupabaseClient, "rpc">;

/**
 * A control overlay: a named, reusable set of control decisions a program stacks on a baseline.
 * It is written through three commands, each safe to send again: the overlay's id is chosen once,
 * and a save that already landed returns the saved overlay.
 */
export type ControlOverlay = Row<"control_overlays">;
export type OverlayDetails = {
  code: string;
  title: string;
  description: string;
  catalogRevisionId: string;
};
export type OverlayDecision = {
  controlId: string;
  /** `include` adds the control to a baseline that lacks it; `exclude` removes it from one that selects it. */
  action: "include" | "exclude";
  rationale: string;
};

export const OVERLAY_CHANGED_ELSEWHERE =
  "This overlay changed in another session. Your entries are kept; reload the overlay, then save again.";
export const OVERLAY_CODE_TAKEN =
  "Another overlay already uses this code. Enter a code no other overlay has.";
export const OVERLAY_CHANGED_BEFORE_DELETE =
  "This overlay changed in another session. Reload it, then delete it again.";

/** The table a rationale taken from it cites, as the publication is named. */
export const RESILIENCY_TABLE = "NIST SP 800-160 Vol. 2 Rev. 1, Table E-1";

/** "A", "A and B", "A, B and C": a record's text is written one way, whatever the reader's locale. */
function listed(items: readonly string[]): string {
  const last = items.at(-1);
  if (last === undefined) return "";
  return items.length === 1 ? last : `${items.slice(0, -1).join(", ")} and ${last}`;
}

/**
 * The rationale Table E-1 gives for adding a control: the cyber resiliency techniques the control
 * supports, in the table's order (the strongest first), each with the approaches the table prints
 * with it, and the table as its source. `null` for a control the table does not name.
 */
export function resiliencyRationale(
  supported: readonly SupportedTechnique[] | undefined,
): string | null {
  if (!supported?.length) return null;
  // A technique the table gives no place comes after those it orders; the order given holds otherwise.
  const place = (entry: SupportedTechnique) => entry.ordinal ?? Number.MAX_SAFE_INTEGER;
  const techniques = [...supported]
    .sort((a, b) => place(a) - place(b))
    .map(({ technique, approaches }) =>
      approaches.length
        ? `${technique.title} [${approaches.map((approach) => approach.title).join(", ")}]`
        : technique.title,
    );
  return `Supports ${listed(techniques)} (${RESILIENCY_TABLE}).`;
}

/**
 * The decisions that add the chosen controls on Table E-1's word, each with the rationale the
 * table gives it. `supported` is what each control supports, by control id (`resiliencyByControl`).
 * A chosen control the table does not name takes no rationale from it and is returned in
 * `unnamed`: the reader clears it from the choice, or writes one rationale for every decision.
 */
export function resiliencyDecisions(
  controlIds: readonly string[],
  supported: ReadonlyMap<string, readonly SupportedTechnique[]>,
): { decisions: OverlayDecision[]; unnamed: string[] } {
  const decisions: OverlayDecision[] = [];
  const unnamed: string[] = [];
  for (const controlId of controlIds) {
    const rationale = resiliencyRationale(supported.get(controlId));
    if (rationale === null) unnamed.push(controlId);
    else decisions.push({ controlId, action: "include", rationale });
  }
  return { decisions, unnamed };
}

function failure(error: { code?: string; message: string }): Error {
  if (error.code === "PT409") return new Error(OVERLAY_CHANGED_ELSEWHERE);
  if (error.code === "23505") return new Error(OVERLAY_CODE_TAKEN);
  return new Error(error.message);
}

/** Create a draft overlay (`expectedRevision` null) or edit its code, name and description. */
export async function saveControlOverlay(
  client: Client,
  { tenantId, token }: ReadContext,
  request: { id: string; expectedRevision: number | null; details: OverlayDetails },
): Promise<ControlOverlay> {
  const { data, error } = await client
    .rpc("save_control_overlay", {
      p_tenant_id: tenantId,
      p_id: request.id,
      p_expected_revision: request.expectedRevision,
      p_overlay: {
        code: request.details.code.trim(),
        title: request.details.title.trim(),
        description: request.details.description.trim(),
        catalogRevisionId: request.details.catalogRevisionId,
      },
    })
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error);
  return data as ControlOverlay;
}

/** Record or replace a draft overlay's decisions, and remove the decisions for other controls. */
export async function setOverlayDecisions(
  client: Client,
  { tenantId, token }: ReadContext,
  request: {
    overlayId: string;
    expectedRevision: number;
    decisions: readonly OverlayDecision[];
    removedControlIds?: readonly string[] | undefined;
  },
): Promise<ControlOverlay> {
  const { data, error } = await client
    .rpc("set_control_overlay_decisions", {
      p_tenant_id: tenantId,
      p_overlay_id: request.overlayId,
      p_expected_revision: request.expectedRevision,
      p_decisions: request.decisions.map((decision) => ({
        controlId: decision.controlId,
        action: decision.action,
        rationale: decision.rationale.trim(),
      })),
      p_removed: [...(request.removedControlIds ?? [])],
    })
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error);
  return data as ControlOverlay;
}

/** The values an overlay gives one parameter, in order, and why. */
export type OverlayParameterValue = {
  parameterId: string;
  values: readonly string[];
  rationale: string;
};

/**
 * Record or replace a draft overlay's values for the named parameters, and remove the values of
 * others. A save that already landed returns the overlay; a published overlay is refused.
 */
export async function setOverlayParameters(
  client: Client,
  { tenantId, token }: ReadContext,
  request: {
    overlayId: string;
    expectedRevision: number;
    parameters: readonly OverlayParameterValue[];
    removedParameterIds?: readonly string[] | undefined;
  },
): Promise<ControlOverlay> {
  const { data, error } = await client
    .rpc("set_control_overlay_parameters", {
      p_tenant_id: tenantId,
      p_overlay_id: request.overlayId,
      p_expected_revision: request.expectedRevision,
      p_parameters: request.parameters.map((parameter) => ({
        parameterId: parameter.parameterId,
        values: parameter.values.map((value) => value.trim()),
        rationale: parameter.rationale.trim(),
      })),
      p_removed: [...(request.removedParameterIds ?? [])],
    })
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error);
  return data as ControlOverlay;
}

/** Freeze a draft overlay so programs can apply it. */
export async function publishControlOverlay(
  client: Client,
  { tenantId, token }: ReadContext,
  request: { overlayId: string; expectedRevision: number },
): Promise<ControlOverlay> {
  const { data, error } = await client
    .rpc("publish_control_overlay", {
      p_tenant_id: tenantId,
      p_overlay_id: request.overlayId,
      p_expected_revision: request.expectedRevision,
    })
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error);
  return data as ControlOverlay;
}

/**
 * Delete a draft overlay and its decisions, at the revision the reader saw. A published overlay,
 * or one a program's control baseline applies, is refused with the command's words. An overlay
 * already gone answers false, so sending the request again changes nothing.
 */
export async function deleteControlOverlay(
  client: Client,
  { tenantId, token }: ReadContext,
  request: { overlayId: string; expectedRevision: number },
): Promise<boolean> {
  const { data, error } = await client
    .rpc("delete_control_overlay", {
      p_tenant_id: tenantId,
      p_overlay_id: request.overlayId,
      p_expected_revision: request.expectedRevision,
    })
    .setHeader("Authorization", `Bearer ${token}`);
  if (error)
    throw new Error(error.code === "PT409" ? OVERLAY_CHANGED_BEFORE_DELETE : error.message);
  return data === true;
}

/** Each command as a mutation; every overlay reader refreshes once Postgres confirms. */
function useOverlayCommand<Request>(
  command: (client: Client, context: ReadContext, request: Request) => Promise<ControlOverlay>,
) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ControlOverlay, Error, Request>({
    mutationFn: async (request) =>
      command(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSuccess: () =>
      void Promise.all(
        ["models", "model", "records", "record", "reference-options"].map((prefix) =>
          cache.invalidateQueries({ queryKey: [prefix, workspace.tenantId] }),
        ),
      ),
  });
}
export const useSaveControlOverlay = () => useOverlayCommand(saveControlOverlay);
export const useSetOverlayDecisions = () => useOverlayCommand(setOverlayDecisions);
export const useSetOverlayParameters = () => useOverlayCommand(setOverlayParameters);
export const usePublishControlOverlay = () => useOverlayCommand(publishControlOverlay);

/**
 * Delete overlay as a mutation. The collections refresh once Postgres confirms; the deleted
 * overlay's own record read is left as it was, so the page it is shown on can leave for the
 * register without first saying the overlay is gone.
 */
export function useDeleteControlOverlay() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<boolean, Error, { overlayId: string; expectedRevision: number }>({
    mutationFn: async (request) =>
      deleteControlOverlay(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSuccess: () =>
      void Promise.all(
        ["models", "records", "record", "reference-options"].map((prefix) =>
          cache.invalidateQueries({ queryKey: [prefix, workspace.tenantId] }),
        ),
      ),
  });
}
