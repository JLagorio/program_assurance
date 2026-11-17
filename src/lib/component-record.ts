import { useMemo } from "react";
import { idSet, useRows, type Row } from "./models";
import type {
  ComponentConsumers,
  ComponentControl,
  ComponentControlStatusAnswer,
  ProductConsumer,
  SystemConsumer,
} from "./component-reuse";
import type { componentStandings } from "./status";

/*
 * What a library component's record reads beside the typed reads of component-reuse: the record is
 * one component, followed across the versions of its set by its name, and its address names the
 * version shown (a `defined_components` id). These are the derivations its header, Overview,
 * Assessment and Where used draw from those reads, and the one read none of them answers: the
 * versions the component exists in.
 */

/** Where a component version stands on one control: a key of `componentStandings`. */
export type ComponentStanding = keyof typeof componentStandings;

/** A control's standing as the record says it: To review apart from the rest not assessed. */
export const controlStanding = (
  control: Pick<ComponentControl, "status" | "toReview">,
): ComponentStanding => (control.toReview ? "to_review" : control.status);

/** The record's one-line standing: every control the version is judged on or claims, by standing. */
export type StandingLine = {
  /** Every control the version claims, was judged on or an earlier version was judged on. */
  total: number;
  counts: Record<ComponentStanding, number>;
  /** Of the determinations that stand, those carried forward from an earlier version. */
  carried: number;
  /** The one earlier version every carried determination comes from; none where they come from several. */
  carriedFrom: number | null;
};

export function standingLine(
  answer: Pick<ComponentControlStatusAnswer, "total" | "counts" | "carried" | "toReview"> & {
    controls: readonly Pick<ComponentControl, "carriedFrom">[];
  },
): StandingLine {
  const from = new Set(
    answer.controls.flatMap((control) =>
      control.carriedFrom ? [control.carriedFrom.version] : [],
    ),
  );
  return {
    total: answer.total,
    counts: {
      other_than_satisfied: answer.counts.other_than_satisfied,
      partially_satisfied: answer.counts.partially_satisfied,
      to_review: answer.toReview,
      // The server counts a control to review among those not assessed: the line says it apart.
      not_assessed: answer.counts.not_assessed - answer.toReview,
      satisfied: answer.counts.satisfied,
    },
    carried: answer.carried,
    carriedFrom: from.size === 1 ? [...from][0]! : null,
  };
}

/** What the component is used in, as its header and its Overview say it: "1 product · 3 programs". */
export function usedInWords(totals: { products: number; programs: number }): string | null {
  const parts = [
    totals.products ? `${totals.products} ${totals.products === 1 ? "product" : "products"}` : null,
    totals.programs ? `${totals.programs} ${totals.programs === 1 ? "program" : "programs"}` : null,
  ].filter((part): part is string => part !== null);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * One line of Where used: a product whose current version pins an element to the component, with
 * the systems created from it under it, or a system that applied the component itself.
 */
export type ConsumerLine = {
  /** The record the line is: the product's element, or the system component (else the variant's left-out element). */
  id: string;
  kind: "product" | "system";
  /** The program the system belongs to, as a record names it; none for a product. */
  program_id: string | null;
  /** The product's name, or the program's. */
  name: string;
  /** The system, by its name; none for a product. */
  detail: string | null;
  /** Where the name leads: the product, or the program's system. */
  productId: string | null;
  programId: string | null;
  systemId: string | null;
  /** The system component built from the component; none for a product, or a variant that left it out. */
  systemComponentId: string | null;
  /** The element the component sits on, by its code; none where a variant left it out. */
  elementCode: string | null;
  /** The version taken, and how many published versions are newer. */
  version: number;
  behind: number;
  change: SystemConsumer["change"];
  /** How many controls the version taken is judged on, and how many of them the element inherits. */
  controlsJudged: number | null;
  controlsInherited: number | null;
  findingsOpen: number;
  /** Whether the program offered a finding it holds on the component, which now stands on it. */
  offered: boolean;
  vulnerabilitiesOpen: number;
  children?: ConsumerLine[] | undefined;
};

const productLine = (product: ProductConsumer): ConsumerLine => ({
  id: product.elementId,
  kind: "product",
  program_id: null,
  name: product.productName,
  detail: null,
  productId: product.productId,
  programId: null,
  systemId: null,
  systemComponentId: null,
  elementCode: product.elementCode,
  version: product.version,
  behind: product.behind,
  change: null,
  controlsJudged: null,
  controlsInherited: null,
  findingsOpen: 0,
  offered: false,
  vulnerabilitiesOpen: product.vulnerabilitiesOpen,
});

const systemLine = (system: SystemConsumer): ConsumerLine => ({
  id: system.key,
  kind: "system",
  program_id: system.programId,
  name: system.programName,
  detail: system.systemName,
  productId: null,
  programId: system.programId,
  systemId: system.systemId,
  systemComponentId: system.systemComponentId,
  elementCode: system.change === "removed" ? null : system.elementCode,
  version: system.version,
  behind: system.behind,
  change: system.change,
  controlsJudged: system.change === "removed" ? null : system.controlsJudged,
  controlsInherited: system.change === "removed" ? null : system.controlsInherited,
  findingsOpen: system.findingsOpen,
  offered: system.findings.some((finding) => finding.source),
  vulnerabilitiesOpen: system.vulnerabilitiesOpen,
});

/**
 * Where used as a tree: each product's current version (the one its variants are read against),
 * with the systems created from any version of it under it, then every system that applied the
 * component itself, in the order the read gives them (by program, system and element).
 */
export function consumerLines(
  consumers: Pick<ComponentConsumers, "products" | "systems">,
): ConsumerLine[] {
  // A variant names the product element it was created from, in whichever version it took.
  const productOfElement = new Map(
    consumers.products.map((product) => [product.elementId, product.productId]),
  );
  const variants = new Map<string, ConsumerLine[]>();
  const own: ConsumerLine[] = [];
  for (const system of consumers.systems) {
    const productId = system.productElementId
      ? productOfElement.get(system.productElementId)
      : undefined;
    if (productId)
      variants.set(productId, [...(variants.get(productId) ?? []), systemLine(system)]);
    else own.push(systemLine(system));
  }
  const products = consumers.products
    .filter((product) => product.current)
    .map((product) => {
      const children = variants.get(product.productId);
      variants.delete(product.productId);
      return { ...productLine(product), ...(children?.length ? { children } : {}) };
    });
  // A variant of a product whose current version no longer pins the component stands on its own.
  return [...products, ...[...variants.values()].flat(), ...own];
}

/** A version of the component's set the component is part of: its own id in it, and the version. */
export type ComponentVersionChoice = {
  /** The component in that version (`defined_components.id`): the record's address names it. */
  id: string;
  version: number;
  state: Row<"component_definition_revisions">["state"];
  publishedAt: string | null;
};

/**
 * Each version of the set that holds a component of this name, the newest first: the record's
 * version menu. A component is followed across versions by its name, as every read of its
 * standing follows it.
 */
export function componentVersions(
  revisions: readonly Pick<
    Row<"component_definition_revisions">,
    "id" | "version_number" | "state" | "published_at"
  >[],
  components: readonly Pick<Row<"defined_components">, "id" | "component_definition_revision_id">[],
): ComponentVersionChoice[] {
  const byRevision = new Map(
    components.map((component) => [component.component_definition_revision_id, component.id]),
  );
  return revisions
    .flatMap((revision) => {
      const id = byRevision.get(revision.id);
      return id
        ? [
            {
              id,
              version: revision.version_number,
              state: revision.state,
              publishedAt: revision.published_at,
            },
          ]
        : [];
    })
    .sort((a, b) => b.version - a.version);
}

/** The versions of a component's set that hold it, read as the record opens. */
export function useComponentVersions(
  definitionId: string | null | undefined,
  name: string | null | undefined,
) {
  const revisions = useRows(
    "component_definition_revisions",
    { component_definition_id: definitionId ?? "" },
    {
      columns: ["id", "version_number", "state", "published_at"],
      enabled: !!definitionId,
    },
  );
  const components = useRows(
    "defined_components",
    {
      component_definition_revision_id: idSet(revisions.data?.map((revision) => revision.id)),
      name: name ?? "",
    },
    {
      columns: ["id", "component_definition_revision_id"],
      enabled: !!name && revisions.isSuccess,
    },
  );
  const versions = useMemo(
    () =>
      revisions.data && components.data
        ? componentVersions(revisions.data, components.data)
        : undefined,
    [revisions.data, components.data],
  );
  return { versions, queries: [revisions, components] };
}
