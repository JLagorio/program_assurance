import { Box } from "@ledger/design-system";
import { PageHeader, Section, Stack } from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { WorkTable } from "@/components/prototype/work-table";
import { EmptyState, QueryState } from "@/components/prototype/work-common";
import { displayDate } from "@/components/prototype/work-format";
import { useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor } from "@/lib/records";

export const Route = createFileRoute("/work")({
  component: MyWork,
  head: () => ({ meta: [{ title: "My work — Equinox" }] }),
});
function MyWork() {
  const workspace = useWorkspace();
  const parties = useRows("parties", { auth_user_id: workspace.userId });
  const activity = useRows("activity_events");
  const mine = (activity.data ?? [])
    .filter((event) => parties.data?.some((party) => party.id === event.actor_party_id))
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 10);
  return (
    <Stack space="space.400" className="animate-rise">
      <PageHeader>
        <Box className="min-w-0">
          <PageHeader.Title>My work</PageHeader.Title>
        </Box>
      </PageHeader>
      <Section title="Tasks">
        <WorkTable mineOnly />
      </Section>
      <Section title="Your recent activity">
        <QueryState queries={[parties, activity]}>
          {mine.length ? (
            <Stack space="space.150">
              {mine.map((event) => (
                <Box className="border-b border-default py-150" key={event.id}>
                  <p>{event.description ?? labelFor(event.event_type)}</p>
                  <p className="font-body-small text-subtle">{displayDate(event.occurred_at)}</p>
                </Box>
              ))}
            </Stack>
          ) : (
            <EmptyState
              illustration="inbox"
              title="Nothing logged yet"
              description="Recorded activity attributed to your workspace identity appears here."
            />
          )}
        </QueryState>
      </Section>
    </Stack>
  );
}
