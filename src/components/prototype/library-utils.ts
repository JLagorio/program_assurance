import { useConfirmation } from "@/components/app/confirmation";
import { useModelSave } from "@/lib/models";
import { downloadText, toast } from "@ledger/design-system";
import { useEffect, useRef, type RefObject } from "react";

/** Saves the library's recorded rows as a JSON file, through the kit's download helper. */
export function downloadLibraryRecords(name: string, records: unknown) {
  downloadText(JSON.stringify(records, null, 2), name, { type: "application/json" });
}

export function canAuthorLibrary(role: string) {
  return ["owner", "admin", "editor"].includes(role);
}

/** The number the next version of a versioned library record takes. */
export function nextVersionNumber(versions: readonly { version_number: number }[]) {
  return Math.max(0, ...versions.map((version) => version.version_number)) + 1;
}

type PublishableVersion = { id: string; revision: number; version_number: number };

/**
 * Publishing a library version, which cannot be undone: the reader confirms in the shared prompt,
 * which stays open while the write runs and says a failure there, and a toast says it worked.
 * Render `confirmation` beside the Actions menu that asks.
 */
export function usePublishVersion(
  table: "component_definition_revisions" | "requirement_definition_revisions",
  /** What publishing lets programs do: "Programs can adopt it once it is published." */
  consequence: string,
) {
  const save = useModelSave(table);
  const { confirm, confirmation } = useConfirmation();
  async function publish(version: PublishableVersion) {
    const published = await confirm({
      title: `Publish version ${version.version_number}?`,
      description: `A published version cannot be changed or deleted. ${consequence}`,
      confirmLabel: "Publish version",
      variant: "primary",
      failureTitle: "The version was not published",
      action: () =>
        save.mutateAsync({
          id: version.id,
          revision: version.revision,
          values: { state: "published" },
        }),
    });
    if (published)
      toast.add({ title: `Version ${version.version_number} published`, type: "success" });
    return published;
  }
  return { publish, confirmation, isPending: save.isPending };
}

/** The control a version was chosen with: the rail's Version select, or the history's Open. */
export type VersionChoice = "select" | "history";

/**
 * Keeps focus through a version change. Each version's page mounts afresh, so the control that
 * chose the version goes with the old page; once the new one is drawn, focus goes to its twin there:
 * the Version select, or the history's mark on the version now shown. A page that opens on Overview
 * after a choice from the history has only the select. `chosen` lives above the version's page and
 * says where the last choice came from; the new page reads it once and clears it.
 */
export function useVersionFocus(chosen: RefObject<VersionChoice | null>) {
  const select = useRef<HTMLButtonElement>(null);
  const shown = useRef<HTMLElement>(null);
  useEffect(() => {
    const from = chosen.current;
    chosen.current = null;
    if (from === null) return;
    ((from === "history" ? shown.current : null) ?? select.current)?.focus();
  }, [chosen]);
  return { select, shown };
}
