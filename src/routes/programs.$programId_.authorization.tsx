import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BreadcrumbItem, BreadcrumbLink, RecordHeader, ShowPage } from "@ledger/design-system";
import { AuthorizationSection } from "@/components/app/authorization";
import { Shell } from "@/components/app/shell";
import { programs } from "@/lib/grc-data";

export const Route = createFileRoute("/programs/$programId_/authorization")({
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  component: Authorization,
});

function Authorization() {
  const program = Route.useLoaderData();
  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            title="Authorization"
            id={program.id}
            crumbs={
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link to="/programs/$programId" params={{ programId: program.id }} />}
                  >
                    {program.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            }
          />
        }
      >
        <AuthorizationSection programId={program.id} programName={program.name} />
      </ShowPage>
    </Shell>
  );
}
