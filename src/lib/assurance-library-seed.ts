import examples from "./assurance-library-examples.json";
import { systemComponents } from "./reusable-components";
import { programs } from "./grc-data";
import type { LibraryEntry, LibraryState } from "./assurance-library-model";

/** Existing provider records keep their public identities and evidence references. */
export function initialLibraryState(): LibraryState {
  const entries: LibraryEntry[] = systemComponents.map((component) => ({
    id: component.id,
    key: component.key,
    kind: component.type === "Policy" ? "Policy" : "Product",
    name: component.name,
    category: component.type,
    owner: component.owner,
    draft: null,
    versions: [
      {
        id: `${component.id}@${component.version}`,
        version: component.version,
        publishedOn: component.updated,
        children: [],
        basePolicy: null,
        conditions: [],
        controls: component.controls.map((control) => ({
          id: control.id,
          title: control.title,
          family: control.family,
          applicability: "Applicable",
          implementation: control.assertion,
          consumerResponsibility:
            control.consumerObligation === "—" ? "" : control.consumerObligation,
          assessment: control.status,
          assessor: control.status === "Not assessed" ? "" : component.owner,
          assessedOn: control.assessedOn,
          requirementIds: [],
          evidenceIds: control.evidence === "—" ? [] : [control.evidence],
        })),
        requirements: [],
        evidence: [
          ...new Map(
            component.controls
              .filter((control) => control.evidence !== "—")
              .map((control) => [
                control.evidence,
                {
                  id: control.evidence,
                  title: control.evidence,
                  kind: "Assessment evidence",
                  date: control.assessedOn,
                  reference: "",
                },
              ]),
          ).values(),
        ],
      },
    ],
  }));
  entries.push(...(structuredClone(examples) as LibraryEntry[]));
  const state: LibraryState = {
    entries,
    uses: [],
    assignments: [],
    decisions: [],
    programEvidence: [],
  };
  // Only a recorded current release can be carried into the new source review.
  // Historical offers remain in legacy inheritance until their release is available.
  for (const component of systemComponents) {
    for (const consumer of component.consumers) {
      if (
        !consumer.accessible ||
        !programs.some((program) => program.id === consumer.programId) ||
        consumer.acceptedVersion !== component.version
      )
        continue;
      const reference = {
        programId: consumer.programId,
        entryId: component.id,
        versionId: `${component.id}@${component.version}`,
      };
      if (component.type === "Policy") {
        state.assignments.push({
          ...reference,
          id: `OLA-${consumer.programId}-${component.id}`,
          targetIds: ["program"],
        });
      } else {
        state.uses.push({
          ...reference,
          id: `USE-${consumer.programId}-${component.id}`,
          name: component.name,
          parentUseId: null,
          targetNodeId: null,
          role: "Product",
          hostUseId: null,
          controlIds: component.controls.map((control) => control.id),
        });
      }
    }
  }
  return state;
}
