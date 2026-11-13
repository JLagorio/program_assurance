import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { deriveSavedBaseline, type BaselineDerivation } from "./baseline-stack";
import { idSet, useRows, type Row } from "./models";
import { resolutionChain, type ChainHop } from "./profile-chain";
import type { DraftOverlay } from "./program-wizard-reference";

type Query = UseQueryResult<unknown, Error>;

export type BaselineControl = Pick<
  Row<"controls">,
  | "id"
  | "source_id"
  | "code"
  | "title"
  | "catalog_revision_id"
  | "group_id"
  | "parent_control_id"
  | "status"
>;
/** One control baseline a program adopted, read as a stack. */
export type ProgramBaseline = {
  choiceId: string;
  /** The program profile's revision: a change to its stack is made at it. */
  revision: number;
  /** The adopted resolution: the top of the stack. */
  resolutionId: string;
  catalog: { id: string; title: string; version: string } | null;
  /** The reference baseline the stack starts from, and the profile the program adopted. */
  reference: ChainHop | null;
  adopted: ChainHop | null;
  derivation: BaselineDerivation;
  /** The profile chain the stack is read from: the adopted resolution first, the reference last. */
  hops: readonly ChainHop[];
  /** Why each overlay in the stack exists, by the overlay's id: its own description. */
  overlayDescriptions: ReadonlyMap<string, string | null>;
  /** The catalog's controls by id, for the codes and titles the stack names. */
  controls: ReadonlyMap<string, BaselineControl>;
  errors: string[];
};

/**
 * A program's control baselines, each derived from its saved profile chain: the reference
 * baseline, one layer per overlay applied, then the program's own tailoring. Small reference
 * collections are read whole; the rules, the reference selection and the catalog's controls are
 * read for the chains this program adopted alone.
 */
export function useProgramBaselines(programId: string): {
  baselines: ProgramBaseline[];
  queries: Query[];
  /** Every read the stacks are drawn from has answered. */
  ready: boolean;
} {
  const choices = useRows(
    "program_reference_choices",
    { program_id: programId },
    { columns: ["id", "catalog_revision_id", "profile_resolution_id", "created_at", "revision"] },
  );
  const resolutions = useRows("profile_resolutions", undefined, {
    columns: ["id", "profile_revision_id", "state", "base_profile_resolution_id"],
  });
  const revisions = useRows("profile_revisions", undefined, {
    columns: ["id", "profile_id", "title", "version", "state"],
  });
  const profiles = useRows("profiles", undefined, { columns: ["id", "title"] });
  const imports = useRows("profile_imports", undefined, {
    columns: [
      "profile_revision_id",
      "catalog_revision_id",
      "imported_profile_revision_id",
      "ordinal",
      "include_all",
    ],
  });
  const catalogRevisions = useRows("catalog_revisions", undefined, {
    columns: ["id", "catalog_id", "title", "version", "state"],
  });
  const catalogs = useRows("catalogs", undefined, { columns: ["id", "title"] });
  const overlays = useRows("control_overlays", undefined, {
    columns: ["id", "title", "description"],
  });

  const chains = useMemo(() => {
    if (
      !choices.data ||
      !resolutions.data ||
      !revisions.data ||
      !profiles.data ||
      !imports.data ||
      !catalogRevisions.data
    )
      return null;
    return choices.data
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
      .map((choice) => ({
        choice,
        chain: resolutionChain(choice.profile_resolution_id, {
          resolutions: resolutions.data,
          profiles: revisions.data,
          profileRecords: profiles.data,
          imports: imports.data,
          catalogs: catalogRevisions.data,
        }),
      }));
  }, [
    choices.data,
    resolutions.data,
    revisions.data,
    profiles.data,
    imports.data,
    catalogRevisions.data,
  ]);
  const scope = useMemo(() => {
    const layers = (chains ?? []).flatMap(({ chain }) => chain.hops.slice(0, -1));
    const unique = (values: (string | null | undefined)[]) =>
      [...new Set(values.filter((value): value is string => !!value))].sort();
    return {
      layerRevisions: unique(layers.map((hop) => hop.profileRevisionId)),
      layerResolutions: unique(layers.map((hop) => hop.resolutionId)),
      references: unique((chains ?? []).map(({ chain }) => chain.hops.at(-1)?.resolutionId)),
      catalogs: unique((chains ?? []).map(({ choice }) => choice.catalog_revision_id)),
    };
  }, [chains]);
  const rules = useRows(
    "profile_rules",
    { profile_revision_id: scope.layerRevisions },
    {
      columns: ["profile_revision_id", "kind", "definition", "rationale"],
      enabled: scope.layerRevisions.length > 0,
    },
  );
  // How many parameters each layer sets values for: an overlay's values, the tailoring's overrides.
  const settings = useRows(
    "profile_parameter_settings",
    { profile_revision_id: scope.layerRevisions },
    { columns: ["profile_revision_id"], enabled: scope.layerRevisions.length > 0 },
  );
  const applications = useRows(
    "profile_overlay_applications",
    { profile_resolution_id: scope.layerResolutions },
    {
      columns: [
        "profile_resolution_id",
        "overlay_id",
        "reaffirmed_control_ids",
        "not_applicable_control_ids",
      ],
      enabled: scope.layerResolutions.length > 0,
    },
  );
  const referenceControls = useRows(
    "selected_controls",
    { profile_resolution_id: scope.references },
    { columns: ["profile_resolution_id", "control_id"], enabled: scope.references.length > 0 },
  );
  const controls = useRows(
    "controls",
    { catalog_revision_id: scope.catalogs },
    {
      columns: [
        "id",
        "source_id",
        "code",
        "title",
        "catalog_revision_id",
        "group_id",
        "parent_control_id",
        "status",
      ],
      enabled: scope.catalogs.length > 0,
    },
  );

  const hasLayers = scope.layerRevisions.length > 0;
  const hasChoices = scope.references.length > 0;
  const ready =
    chains !== null &&
    overlays.data !== undefined &&
    (!hasLayers ||
      (rules.data !== undefined &&
        applications.data !== undefined &&
        settings.data !== undefined)) &&
    (!hasChoices || (referenceControls.data !== undefined && controls.data !== undefined));
  const baselines = useMemo((): ProgramBaseline[] => {
    if (!ready || !chains) return [];
    const byCatalog = new Map<string, Map<string, BaselineControl>>();
    for (const control of controls.data ?? []) {
      const map = byCatalog.get(control.catalog_revision_id) ?? new Map();
      map.set(control.id, control);
      byCatalog.set(control.catalog_revision_id, map);
    }
    return chains.map(({ choice, chain }) => {
      const reference = chain.hops.at(-1) ?? null;
      const catalogRevision = catalogRevisions.data?.find(
        (row) => row.id === choice.catalog_revision_id,
      );
      const catalogControls = byCatalog.get(choice.catalog_revision_id) ?? new Map();
      return {
        choiceId: choice.id,
        revision: choice.revision,
        resolutionId: choice.profile_resolution_id,
        catalog: catalogRevision
          ? {
              id: catalogRevision.id,
              title:
                catalogs.data?.find((row) => row.id === catalogRevision.catalog_id)?.title ??
                catalogRevision.title,
              version: catalogRevision.version,
            }
          : null,
        reference,
        adopted: chain.hops[0] ?? null,
        derivation: deriveSavedBaseline({
          hops: chain.hops,
          rules: rules.data ?? [],
          controls: [...catalogControls.values()],
          baselineControlIds: (referenceControls.data ?? [])
            .filter((row) => row.profile_resolution_id === reference?.resolutionId)
            .map((row) => row.control_id),
          applications: applications.data ?? [],
          overlays: overlays.data ?? [],
          tailoringTitle: "Program tailoring",
          settings: settings.data ?? [],
        }),
        hops: chain.hops,
        overlayDescriptions: new Map((overlays.data ?? []).map((row) => [row.id, row.description])),
        controls: catalogControls,
        errors: chain.errors,
      };
    });
  }, [
    ready,
    chains,
    controls.data,
    catalogRevisions.data,
    catalogs.data,
    rules.data,
    referenceControls.data,
    applications.data,
    overlays.data,
    settings.data,
  ]);
  return {
    baselines,
    ready,
    queries: [
      choices,
      resolutions,
      revisions,
      profiles,
      imports,
      catalogRevisions,
      catalogs,
      overlays,
      ...(hasLayers ? [rules, applications, settings] : []),
      ...(hasChoices ? [referenceControls, controls] : []),
    ],
  };
}

/** How many of the program's requirements map each catalog control, by control id. */
export function useControlRequirementCounts(programId: string) {
  const query = useRows(
    "program_control_requirement_counts",
    { program_id: programId },
    { columns: ["control_id", "requirement_count"] },
  );
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of query.data ?? [])
      if (row.control_id) map.set(row.control_id, row.requirement_count ?? 0);
    return map;
  }, [query.data]);
  return { query, counts };
}

export type PublishedOverlay = DraftOverlay & {
  code: string;
  description: string | null;
  catalogRevisionId: string;
};

/**
 * The published overlays a program can stack, each with its decisions. `enabled: false` reads
 * nothing, for a screen that only offers them to a reader who may stack them.
 */
export function usePublishedOverlays({ enabled = true }: { enabled?: boolean | undefined } = {}): {
  overlays: PublishedOverlay[];
  queries: Query[];
} {
  const records = useRows(
    "control_overlays",
    { state: "published" },
    { columns: ["id", "code", "title", "description", "catalog_revision_id"], enabled },
  );
  const ids = useMemo(() => (records.data ?? []).map((row) => row.id).sort(), [records.data]);
  const decisions = useRows(
    "control_overlay_decisions",
    { overlay_id: ids },
    {
      columns: ["overlay_id", "control_id", "action", "rationale"],
      enabled: enabled && ids.length > 0,
    },
  );
  // Their parameter values, and the control each parameter belongs to: a value counts where the
  // stack selects its control.
  const values = useRows(
    "control_overlay_parameters",
    { overlay_id: ids },
    {
      columns: ["overlay_id", "parameter_id", "parameter_values", "rationale"],
      enabled: enabled && ids.length > 0,
    },
  );
  const parameterIds = useMemo(
    () => idSet(values.data?.map((row) => row.parameter_id)),
    [values.data],
  );
  const parameters = useRows(
    "parameters",
    { id: parameterIds },
    { columns: ["id", "control_id"], enabled: enabled && parameterIds.length > 0 },
  );
  const read =
    !!records.data &&
    (!ids.length ||
      (!!decisions.data && !!values.data && (!parameterIds.length || !!parameters.data)));
  const overlays = useMemo(
    (): PublishedOverlay[] =>
      read && records.data
        ? records.data
            .map((row) => ({
              id: row.id,
              code: row.code,
              title: row.title,
              description: row.description,
              catalogRevisionId: row.catalog_revision_id,
              decisions: (decisions.data ?? [])
                .filter((decision) => decision.overlay_id === row.id)
                .map((decision) => ({
                  controlId: decision.control_id,
                  action: decision.action as "include" | "exclude",
                  rationale: decision.rationale,
                })),
              parameters: (values.data ?? [])
                .filter((value) => value.overlay_id === row.id)
                .map((value) => ({
                  parameterId: value.parameter_id,
                  controlId:
                    parameters.data?.find((parameter) => parameter.id === value.parameter_id)
                      ?.control_id ?? null,
                  values: value.parameter_values,
                  rationale: value.rationale,
                })),
            }))
            .sort((a, b) => a.title.localeCompare(b.title))
        : [],
    [read, records.data, decisions.data, values.data, parameters.data],
  );
  return {
    overlays,
    queries: ids.length
      ? [records, decisions, values, ...(parameterIds.length ? [parameters] : [])]
      : [records],
  };
}
