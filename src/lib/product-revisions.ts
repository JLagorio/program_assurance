import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { ElementType } from "./program-wizard";

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

export type ProductElementInput = {
  id?: string | undefined;
  revision?: number | undefined;
  parentId: string | null;
  code: string;
  name: string;
  description: string;
  elementType: ElementType;
  definedComponentId: string | null;
  position: number;
};

/** Save one element and its configuration memberships; removed memberships cascade to descendants. */
export function useSaveProductElement() {
  return useProductCommand<
    {
      revisionId: string;
      element: ProductElementInput;
      configurationIds: string[];
      /** Existing memberships of this element and its descendants, so the diff is exact. */
      existing: { id: string; product_configuration_id: string; product_element_id: string }[];
      descendantIds: string[];
    },
    { id: string }
  >(async (request, tenantId, token) => {
    const client = database();
    const { element } = request;
    const values = {
      product_revision_id: request.revisionId,
      parent_element_id: element.parentId,
      code: element.code.trim(),
      name: element.name.trim(),
      description: element.description.trim() || null,
      element_type: element.elementType,
      defined_component_id: element.definedComponentId,
      position: element.position,
    };
    let id = element.id;
    if (id) {
      if (!Number.isSafeInteger(element.revision))
        throw new Error("Reload the element before saving; its revision is missing.");
      const result = await client
        .from("product_elements")
        .update({ ...values, revision: element.revision! + 1 })
        .eq("id", id)
        .eq("revision", element.revision!)
        .select()
        .setHeader("Authorization", `Bearer ${token}`)
        .single();
      const error = failed(result.error);
      if (error) throw error;
    } else {
      id = crypto.randomUUID();
      const result = await client
        .from("product_elements")
        .insert({ id, tenant_id: tenantId, ...values })
        .setHeader("Authorization", `Bearer ${token}`);
      const error = failed(result.error);
      if (error) throw error;
    }
    const wanted = new Set(request.configurationIds);
    const own = request.existing.filter((row) => row.product_element_id === id);
    const removedConfigurations = new Set(
      own
        .filter((row) => !wanted.has(row.product_configuration_id))
        .map((row) => row.product_configuration_id),
    );
    const removedIds = request.existing
      .filter(
        (row) =>
          removedConfigurations.has(row.product_configuration_id) &&
          (row.product_element_id === id || request.descendantIds.includes(row.product_element_id)),
      )
      .map((row) => row.id);
    const added = [...wanted]
      .filter(
        (configurationId) => !own.some((row) => row.product_configuration_id === configurationId),
      )
      .map((configurationId) => ({
        tenant_id: tenantId,
        product_revision_id: request.revisionId,
        product_configuration_id: configurationId,
        product_element_id: id!,
      }));
    if (removedIds.length) {
      const result = await client
        .from("product_configuration_elements")
        .delete()
        .in("id", removedIds)
        .setHeader("Authorization", `Bearer ${token}`);
      const error = failed(result.error);
      if (error) throw error;
    }
    if (added.length) {
      const result = await client
        .from("product_configuration_elements")
        .insert(added)
        .setHeader("Authorization", `Bearer ${token}`);
      const error = failed(result.error);
      if (error) throw error;
    }
    return { id };
  });
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
  >(async (request, tenantId, token) => {
    if (!request.elementIds.length) return;
    const result = await database()
      .from("product_configuration_elements")
      .insert(
        request.elementIds.map((elementId) => ({
          tenant_id: tenantId,
          product_revision_id: request.revisionId,
          product_configuration_id: request.configurationId,
          product_element_id: elementId,
        })),
      )
      .setHeader("Authorization", `Bearer ${token}`);
    const error = failed(result.error);
    if (error) throw error;
  });
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
