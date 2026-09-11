import { RequirementRecord } from "@/features/requirements/requirement-record";
import { requirementTabs, type RequirementTab } from "@/features/requirements/tabs";
import { programs } from "@/lib/grc-data";
import { resolveProgramElement } from "@/lib/program-scope";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Id,
  PageHeader,
  Shell,
} from "@ledger/design-system";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/programs/$programId_/requirements/$requirementId")({
  // `tab` is emitted unconditionally — the validated object is merged over the
  // raw search, so returning `{}` on a miss keeps `?tab=Bogus` in the URL and
  // renders a tab strip over an empty body.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: RequirementTab | undefined; element?: string | undefined } => {
    const raw = String(search["tab"] ?? "");
    return {
      tab: requirementTabs.find((t) => t.toLowerCase() === raw.toLowerCase()),
      element: typeof search["element"] === "string" ? search["element"] : undefined,
    };
  },
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.requirementId} — Equinox` },
      {
        name: "description",
        content: `Security requirement ${params.requirementId} in program ${params.programId}: shall statement, derivation provenance, decomposition and allocation to system elements, providers and processes.`,
      },
      { property: "og:title", content: `${params.requirementId} — Equinox` },
      {
        property: "og:description",
        content: `Security requirement ${params.requirementId} in ${params.programId}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequirementPage,
});

function RequirementPage() {
  const { programId, requirementId } = Route.useParams();
  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const elementId = resolveProgramElement(programId, search.element)?.id;
  const navigate = Route.useNavigate();
  return (
    <RequirementRecord
      key={`${programId}/${requirementId}`}
      programId={program.id}
      requirementId={requirementId}
      elementId={elementId}
      tab={(search.tab ?? "Overview") as RequirementTab}
      onTabChange={(tab) =>
        navigate({ search: (previous) => ({ ...previous, tab }), resetScroll: false })
      }
      header={({ title, actions }) => (
        <PageHeader>
          <Breadcrumb className="col-span-full">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={
                    <Link
                      to="/programs/$programId"
                      params={{ programId }}
                      search={{ tab: "Requirements", element: elementId }}
                    />
                  }
                >
                  {program.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <Id>{requirementId}</Id>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <PageHeader.Title>{title}</PageHeader.Title>
          <PageHeader.Actions>{actions}</PageHeader.Actions>
        </PageHeader>
      )}
      properties={(content) =>
        content ? <Shell.Aside label="Record properties">{content}</Shell.Aside> : null
      }
    />
  );
}
