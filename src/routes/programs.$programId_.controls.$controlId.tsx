import { ControlRecord } from "@/features/controls/control-record";
import { controlTabs, type ControlTab } from "@/features/controls/tabs";
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

export const Route = createFileRoute("/programs/$programId_/controls/$controlId")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: string | undefined; scope?: string | undefined; element?: string | undefined } => {
    const raw = search["tab"];
    return {
      tab: controlTabs.find((tab) => tab.toLowerCase() === String(raw).toLowerCase()),
      scope: typeof search["scope"] === "string" ? search["scope"] : undefined,
      element: typeof search["element"] === "string" ? search["element"] : undefined,
    };
  },
  loader: async ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    // One control, so one family chunk: `loadControlText` fetches only the
    // family the id belongs to, not all 20. The screens that render the whole
    // catalog (SCTM, ConMon, baseline) import `@/lib/nist-control-text` instead.
    const { loadControlText } = await import("@/lib/nist-control-text/registry");
    return { program, text: await loadControlText(params.controlId) };
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.controlId} — Equinox` },
      {
        name: "description",
        content: `Control ${params.controlId} in program ${params.programId}: implementation statement, requirements, evidence, tasks, determination and activity.`,
      },
      { property: "og:title", content: `${params.controlId} — Equinox` },
      { property: "og:description", content: `Control ${params.controlId}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ControlPage,
});

function ControlPage() {
  const { programId, controlId } = Route.useParams();
  const { program, text } = Route.useLoaderData();
  const search = Route.useSearch();
  const elementId = resolveProgramElement(programId, search.element)?.id;
  const navigate = Route.useNavigate();
  return (
    <ControlRecord
      key={`${programId}/${controlId}`}
      programId={program.id}
      controlId={controlId}
      elementId={elementId}
      tab={(search.tab ?? "Implementation") as ControlTab}
      onTabChange={(tab) =>
        navigate({ search: (previous) => ({ ...previous, tab }), resetScroll: false })
      }
      text={text}
      scopeId={search.scope}
      onScopeChange={(scope) => {
        void navigate({ search: (previous) => ({ ...previous, scope }), resetScroll: false });
      }}
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
                      search={{ tab: "Controls", element: elementId }}
                    />
                  }
                >
                  {program.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <Id>{controlId}</Id>
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
