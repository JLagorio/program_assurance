import { PageHeader } from "@ledger/design-system";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Box, buttonVariants, Section, Stack, TextLink } from "@ledger/design-system";

import { ActivityFeed } from "@/components/app/record-activity";
import { myWorkPresets, TaskTable } from "@/components/app/task-table";
import { activityByActor, mentionsOf, useActivityVersion } from "@/lib/activity";
import { currentSession } from "@/lib/control-work";
import {
  openTasks,
  sortTasks,
  tasksAssignedTo,
  tasksWaitingOn,
  useTasksVersion,
} from "@/lib/tasks";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "My work — Equinox" },
      {
        name: "description",
        content: "Your tasks, what you are waiting on, and where you were mentioned.",
      },
    ],
  }),
  component: MyWork,
});

/** One table of what is yours and what you wait on, then the mentions and your own trail. */
function MyWork() {
  useTasksVersion();
  useActivityVersion();
  const me = currentSession().name;
  const mine = tasksAssignedTo(me);
  const waiting = tasksWaitingOn(me);
  const all = sortTasks([...new Map([...mine, ...waiting].map((t) => [t.id, t])).values()]);
  const mentions = mentionsOf(me).slice(0, 20);
  const recent = activityByActor(me).slice(0, 10);

  return (
    <Stack space="space.400" className="animate-rise">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>{"My work"}</PageHeader.Title>
        </div>
        <PageHeader.Actions>
          <Link to="/scope" className={buttonVariants({ size: "small" })}>
            Control set changes
          </Link>
        </PageHeader.Actions>
      </PageHeader>

      <Section title="Tasks" count={openTasks(mine).length || null}>
        <Box paddingBlockStart="space.100">
          <TaskTable
            tasks={all}
            me={me}
            label="My work"
            view="my-work"
            showSubject
            presets={myWorkPresets}
            defaultPreset="mine"
            empty={{
              title: "Nothing here",
              description:
                "Tasks land here when someone asks, and requests until they are answered.",
            }}
          />
        </Box>
      </Section>

      <Section title="Mentions" count={mentions.length || null}>
        <Stack space="space.100" className="pt-100">
          <ActivityFeed
            entries={mentions}
            me={me}
            showSubject
            emptyTitle="Nobody has mentioned you"
          />
        </Stack>
      </Section>

      <Section
        title="Your recent activity"
        action={
          <TextLink
            size="small"
            render={<Link to="/people/$personId" params={{ personId: "PPL-0101" }} />}
          >
            Your record
          </TextLink>
        }
      >
        <Stack space="space.100" className="pt-100">
          <ActivityFeed entries={recent} me={me} showSubject emptyTitle="Nothing logged yet" />
        </Stack>
      </Section>
    </Stack>
  );
}
