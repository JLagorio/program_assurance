import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { ReadContext, Row } from "./models";
import type { ElementType } from "./program-wizard";
import { saveOnce, type SaveOnceOutcome } from "./save-once";

type Client = Pick<SupabaseClient, "from">;

const productTables = [
  "products",
  "product_revisions",
  "product_configurations",
  "product_elements",
  "product_configuration_elements",
];

function useProductCommand<TRequest, TResult>(
  run: (request: TRequest, tenantId: string, token: string) => Promise<TResult>,
  invalidate = true,
) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<TResult, Error, TRequest>({
    mutationFn: async (request) => {
      const token = await requireIdentity(workspace);
      return run(request, workspace.tenantId, token);
    },
    onSuccess: async () => {
      if (!invalidate) return;
      await Promise.all(
        productTables.flatMap((table) =>
          ["models", "model", "records", "record", "reference-options"].map((key) =>
            cache.invalidateQueries({ queryKey: [key, workspace.tenantId, table] }),
          ),
        ),
      );
    },
  });
}

function failed(error: { code?: string; message: string } | null) {
  if (!error) return null;
  return new Error(
    error.code === "PT409" || error.code === "PGRST116"
      ? "This changed in another session. Reload before trying again."
      : error.message,
  );
}

/**
 * A create refused because another record holds the code the reader chose: the Code field's own
 * issue, since nothing of the draft was written.
 */
export class CodeTaken extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CodeTaken";
  }
}

export const configurationCodeTaken = (code: string) =>
  `Another configuration of this product has the code ${code}. Choose another code.`;
export const elementCodeTaken = (code: string) =>
  `Another element of this version has the code ${code}. Choose another code.`;

/** A new configuration of a product, under the id its form chose once. */
export type NewProductConfiguration = {
  id: string;
  productId: string;
  code: string;
  name: string;
  description: string;
};

/**
 * Create a configuration under the id its form chose, safe to retry (`saveOnce`): a retry after a
 * lost answer finds the first try and writes nothing more, one whose details changed since is a
 * `SaveOnceConflict`, and a code another configuration of the product holds is `CodeTaken`.
 */
export async function createProductConfiguration(
  client: Client,
  context: ReadContext,
  configuration: NewProductConfiguration,
): Promise<{ outcome: SaveOnceOutcome; record: Row<"product_configurations"> }> {
  const code = configuration.code.trim();
  return saveOnce(client, context, {
    table: "product_configurations",
    id: configuration.id,
    values: {
      product_id: configuration.productId,
      code,
      name: configuration.name.trim(),
      description: configuration.description.trim() || null,
    },
    taken: () => new CodeTaken(code, configurationCodeTaken(code)),
  });
}

/** Create a configuration as a mutation; the product's reads refresh once it is saved. */
export function useCreateProductConfiguration() {
  return useProductCommand<
    NewProductConfiguration,
    { outcome: SaveOnceOutcome; record: Row<"product_configurations"> }
  >((request, tenantId, token) =>
    createProductConfiguration(database(), { tenantId, token }, request),
  );
}

/**
 * Add memberships in one statement, parents first; one the configuration holds already is passed
 * over, so adding the same memberships again adds nothing more.
 */
async function addMemberships(
  client: Client,
  context: ReadContext,
  revisionId: string,
  members: readonly { configurationId: string; elementId: string }[],
): Promise<void> {
  if (!members.length) return;
  const result = await client
    .from("product_configuration_elements")
    .upsert(
      members.map((member) => ({
        tenant_id: context.tenantId,
        product_revision_id: revisionId,
        product_configuration_id: member.configurationId,
        product_element_id: member.elementId,
      })),
      {
        onConflict: "tenant_id,product_revision_id,product_configuration_id,product_element_id",
        ignoreDuplicates: true,
      },
    )
    .setHeader("Authorization", `Bearer ${context.token}`);
  const error = failed(result.error);
  if (error) throw error;
}

/** Add elements of a version to a configuration, parents first; one already in it is passed over. */
export function includeElements(
  client: Client,
  context: ReadContext,
  request: { revisionId: string; configurationId: string; elementIds: readonly string[] },
): Promise<void> {
  return addMemberships(
    client,
    context,
    request.revisionId,
    request.elementIds.map((elementId) => ({
      configurationId: request.configurationId,
      elementId,
    })),
  );
}

export type ProductElementInput = {
  /** The element's id: the element an edit changes, or one its form chose once for a create. */
  id: string;
  /** The revision the reader edited; absent when the form creates the element. */
  revision?: number | undefined;
  parentId: string | null;
  code: string;
  name: string;
  description: string;
  elementType: ElementType;
  definedComponentId: string | null;
  position: number;
};

export type ProductElementSave = {
  revisionId: string;
  element: ProductElementInput;
  /** The configurations the element is in once saved. */
  configurationIds: readonly string[];
  /** The elements inside it, which leave a configuration it leaves. */
  descendantIds: readonly string[];
};

/**
 * Save one element and its configuration memberships, safe to retry: the element is written by
 * `saveOnce`'s rule under the id its form chose (created only when absent, edited only at the
 * revision the reader saw, untouched when it already holds the values; a code another element of
 * the version holds is `CodeTaken`), then its memberships are made what the reader chose against
 * those the server holds now, a configuration it leaves taking its descendants with it.
 */
export async function saveProductElement(
  client: Client,
  context: ReadContext,
  request: ProductElementSave,
): Promise<{ id: string; outcome: SaveOnceOutcome }> {
  const { element } = request;
  const code = element.code.trim();
  const { outcome } = await saveOnce(client, context, {
    table: "product_elements",
    id: element.id,
    values: {
      product_revision_id: request.revisionId,
      parent_element_id: element.parentId,
      code,
      name: element.name.trim(),
      description: element.description.trim() || null,
      element_type: element.elementType,
      defined_component_id: element.definedComponentId,
      position: element.position,
    },
    revision: element.revision,
    taken: () => new CodeTaken(code, elementCodeTaken(code)),
  });
  const authorization = `Bearer ${context.token}`;
  const held = await client
    .from("product_configuration_elements")
    .select("id, product_configuration_id, product_element_id")
    .eq("tenant_id", context.tenantId)
    .eq("product_revision_id", request.revisionId)
    .in("product_element_id", [element.id, ...request.descendantIds])
    .setHeader("Authorization", authorization);
  const heldError = failed(held.error);
  if (heldError) throw heldError;
  const memberships = (held.data ?? []) as {
    id: string;
    product_configuration_id: string;
    product_element_id: string;
  }[];
  const wanted = new Set(request.configurationIds);
  const own = memberships.filter((row) => row.product_element_id === element.id);
  const left = new Set(
    own
      .filter((row) => !wanted.has(row.product_configuration_id))
      .map((row) => row.product_configuration_id),
  );
  const removedIds = memberships
    .filter((row) => left.has(row.product_configuration_id))
    .map((row) => row.id);
  if (removedIds.length) {
    const result = await client
      .from("product_configuration_elements")
      .delete()
      .in("id", removedIds)
      .setHeader("Authorization", authorization);
    const error = failed(result.error);
    if (error) throw error;
  }
  await addMemberships(
    client,
    context,
    request.revisionId,
    [...wanted]
      .filter(
        (configurationId) => !own.some((row) => row.product_configuration_id === configurationId),
      )
      .map((configurationId) => ({ configurationId, elementId: element.id })),
  );
  return { id: element.id, outcome };
}

/** Save one element and its configuration memberships as a mutation. */
export function useSaveProductElement() {
  return useProductCommand<ProductElementSave, { id: string; outcome: SaveOnceOutcome }>(
    (request, tenantId, token) => saveProductElement(database(), { tenantId, token }, request),
  );
}

/** Remove an element and everything inside it: memberships first, then the elements in one statement. */
export function useRemoveProductElement() {
  return useProductCommand<{ elementIds: string[] }, void>(async (request, _tenantId, token) => {
    const client = database();
    const memberships = await client
      .from("product_configuration_elements")
      .delete()
      .in("product_element_id", request.elementIds)
      .setHeader("Authorization", `Bearer ${token}`);
    const membershipError = failed(memberships.error);
    if (membershipError) throw membershipError;
    const elements = await client
      .from("product_elements")
      .delete()
      .in("id", request.elementIds)
      .setHeader("Authorization", `Bearer ${token}`);
    const elementError = failed(elements.error);
    if (elementError) throw elementError;
  });
}

/** Add every element of the version to a configuration, parents first. */
export function useIncludeAllElements() {
  return useProductCommand<
    { revisionId: string; configurationId: string; elementIds: string[] },
    void
  >((request, tenantId, token) => includeElements(database(), { tenantId, token }, request));
}

/** New version: the server copies the tree and memberships into the next draft. */
export function useCopyProductRevision() {
  return useProductCommand<{ sourceRevisionId: string }, string>(
    async (request, tenantId, token) => {
      const result = await database()
        .rpc("copy_product_revision", {
          p_tenant_id: tenantId,
          p_source_revision_id: request.sourceRevisionId,
        })
        .setHeader("Authorization", `Bearer ${token}`);
      const error = failed(result.error);
      if (error) throw error;
      return z.string().uuid().parse(result.data);
    },
  );
}

/** The OSCAL component-definition of a published version, built on demand. */
export function useProductComponentDefinition() {
  return useProductCommand<{ revisionId: string }, unknown>(async (request, tenantId, token) => {
    const result = await database()
      .rpc("product_component_definition", {
        p_tenant_id: tenantId,
        p_revision_id: request.revisionId,
      })
      .setHeader("Authorization", `Bearer ${token}`);
    const error = failed(result.error);
    if (error) throw error;
    return result.data;
  }, false);
}
