import { AuthorizationSection } from "@/components/app/authorization";
import { programs } from "@/lib/grc-data";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Id,
  PageHeader,
  Stack,
} from "@ledger/design-system";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

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
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <Breadcrumb className="col-span-full">
          <BreadcrumbList>
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
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Id>{program.id}</Id>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="min-w-0">
          <PageHeader.Title>{"Authorization"}</PageHeader.Title>
        </div>
      </PageHeader>
      <Stack space="space.300" className="min-w-0 pt-200">
        <AuthorizationSection programId={program.id} programName={program.name} />
      </Stack>
    </Stack>
  );
}
