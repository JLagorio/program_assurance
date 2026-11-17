import { registerViews } from "@/lib/register-views";
import { questionSearch } from "./collection-question";

/*
 * The links into the Frameworks page's Controls: a count of an edition's controls by family, or of
 * those a baseline selects, opens the register asked for exactly those controls. The register's
 * question lives in the address under its view, so the link is the question; its columns' ids are
 * the register's (`family`, `status`, `selectedBy` in catalog.tsx).
 */

/** The status the catalog's own count keeps: a withdrawn control is not one of an edition's. */
const ACTIVE = "active";

/**
 * The search that opens the Controls register of an edition on a question: a family's controls in
 * force, or those a published profile revision selects (`selectedBy`), in a family or in all.
 */
export function catalogControlsSearch(question: {
  edition: string;
  family?: string | undefined;
  selectedBy?: string | undefined;
}): Record<string, unknown> {
  return {
    edition: question.edition,
    ...questionSearch(registerViews.catalogControls, {
      search: "",
      filters: [
        ...(question.family ? [{ id: "family", value: [question.family] }] : []),
        ...(question.selectedBy
          ? [{ id: "selectedBy", value: [question.selectedBy] }]
          : [{ id: "status", value: [ACTIVE] }]),
      ],
    }),
  };
}
