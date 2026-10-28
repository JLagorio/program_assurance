import { reviewTargetSchema } from "@/lib/assurance-review";
import { readerLocationSchema } from "@/lib/evidence-reader";
import { PageHeader } from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/app/shell";
import { EvidenceBrowser } from "@/components/prototype/evidence-browser";

function searchObject(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export const Route = createFileRoute("/evidence")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    artifact?: string | undefined;
    version?: string | undefined;
    citation?: string | undefined;
    savedView?: string | undefined;
    reader?: boolean | undefined;
    sha256?: string | undefined;
    page?: number | undefined;
    rectangle?: string | undefined;
    target?: string | undefined;
  } => {
    const ids = Object.fromEntries(
      ["artifact", "version", "citation", "savedView"].flatMap((key) =>
        typeof search[key] === "string" && /^[0-9a-f-]{36}$/i.test(search[key])
          ? [[key, search[key]]]
          : [],
      ),
    );
    let location;
    let target;
    try {
      const parsed = readerLocationSchema.safeParse({
        page: Number(search["page"]),
        rectangle: searchObject(search["rectangle"]),
      });
      if (parsed.success) location = parsed.data;
    } catch {
      /* Ignore malformed optional deep-link location. */
    }
    try {
      const parsed = reviewTargetSchema.safeParse(searchObject(search["target"]));
      if (parsed.success) target = JSON.stringify(parsed.data);
    } catch {
      /* Ignore malformed optional deep-link location. */
    }
    return {
      ...ids,
      ...(typeof search["sha256"] === "string" && /^[0-9a-f]{64}$/.test(search["sha256"])
        ? { sha256: search["sha256"] }
        : {}),
      ...(search["reader"] === true || search["reader"] === "true" ? { reader: true } : {}),
      ...(location ? { page: location.page, rectangle: JSON.stringify(location.rectangle) } : {}),
      ...(target ? { target } : {}),
    };
  },
  component: EvidencePage,
  head: () => ({ meta: [{ title: "Evidence — Program Assurance" }] }),
});
function EvidencePage() {
  const search = Route.useSearch();
  const location = readerLocationSchema.safeParse({
    page: Number(search.page),
    rectangle: searchObject(search.rectangle),
  });
  const target = reviewTargetSchema.safeParse(searchObject(search.target));
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Evidence</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <EvidenceBrowser
        key={`${search.artifact ?? ""}:${search.version ?? ""}`}
        initialArtifactId={search.artifact}
        initialVersionId={search.version}
        reader={search.reader}
        citationId={search.citation}
        sourceSha={search.sha256}
        initialLocation={location.success ? location.data : undefined}
        citationTarget={target.success ? target.data : undefined}
      />
    </Page>
  );
}
