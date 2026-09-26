import { useConfirmation } from "@/components/app/confirmation";
import { useModelSave } from "@/lib/models";
import { downloadText, toast } from "@ledger/design-system";

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
