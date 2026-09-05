import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Check,
  ChevronRight,
  Download,
  MoreHorizontal,
  Paperclip,
  Play,
  Plus,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Collapsible,
  Count,
  Dot,
  DropdownMenu,
  IconButton,
  Item,
  Person,
  Progress,
  ScrollArea,
  Sheet,
  TextLink,
  Timeline,
  tones,
} from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Timeline",
  component: Timeline,
  parameters: { layout: "padded" },
  args: {
    label: "Activity",
    children: [
      <Timeline.Item
        key="1"
        tone="success"
        title="Verified by Priya Natarajan"
        meta="All 3 evidence items reviewed"
        time="2h ago"
      />,
      <Timeline.Item
        key="2"
        tone="information"
        title="Evidence linked"
        meta="Bank reconciliation, July"
        time="Yesterday"
      />,
      <Timeline.Item key="3" title="Control created" time="3 Aug" />,
    ],
  },
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A file on an event, from kit parts: the name and size as a button, the download beside it. */
function Attachment({ name, size }: { name: string; size: string }) {
  return (
    <ButtonGroup>
      <Button size="small" iconBefore={<Paperclip />}>
        {name}
        <Text color="color.text.subtle" className="ps-050">
          ({size})
        </Text>
      </Button>
      <IconButton size="small" label={`Download ${name}`} icon={<Download />} />
    </ButtonGroup>
  );
}

/** A title as a sentence: who, in medium weight; what, subtle; the object, as given. */
function Did({ who, what, children }: { who?: string; what: string; children?: ReactNode }) {
  return (
    <>
      {who ? <Text weight="medium">{who} </Text> : null}
      <Text color="color.text.subtle">{what}</Text> {children}
    </>
  );
}

const menu = () => (
  <DropdownMenu
    align="end"
    trigger={<IconButton variant="subtle" label="More actions" icon={<MoreHorizontal />} />}
  >
    <DropdownMenu.Item onSelect={() => {}}>Open record</DropdownMenu.Item>
    <DropdownMenu.Item onSelect={() => {}}>Copy link</DropdownMenu.Item>
    <DropdownMenu.Item onSelect={() => {}}>Add follow-up</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item tone="danger" onSelect={() => {}}>
      Archive
    </DropdownMenu.Item>
  </DropdownMenu>
);

const person = (name: string, size: "xsmall" | "small" = "small") => (
  <Avatar name={name} size={size} variant="tinted" isDecorative />
);

const three = (size?: "small" | "medium" | "large") => (
  <>
    <Timeline.Item
      tone="success"
      title="Verified"
      meta="Priya Natarajan"
      time="2h ago"
      marker={size === "large" ? person("Priya Natarajan") : undefined}
    />
    <Timeline.Item
      tone="information"
      icon={size === "large" ? <Check /> : undefined}
      title="Evidence linked"
      meta="Dana Whitfield"
      time="Yesterday"
    />
    <Timeline.Item title="Control created" time="3 Aug" />
  </>
);

/** Every tone as a marker; the states; icon markers; the three sizes; the four places the time can sit; and across, centred with the time above and start-aligned with it below. */
export const TimelineMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Box className="max-w-layout-measure">
        <Timeline label="Activity">
          <Timeline.Group label="Tones" count={5}>
            {tones.map((tone) => (
              <Timeline.Item
                key={tone}
                tone={tone}
                title={`A ${tone} event`}
                meta="Dana Whitlock"
                time="2h ago"
                timeTitle="2026-09-02 14:10"
              />
            ))}
          </Timeline.Group>
          <Timeline.Group label="States">
            <Timeline.Item
              title="Selectable"
              meta="onSelect makes the title a button over the row"
              onSelect={() => {}}
            />
            <Timeline.Item
              title="A link row"
              meta="link makes it the router's Link"
              link={<a href="#event" />}
              trailing={<ChevronRight className="size-icon-small icon-subtlest" />}
            />
            <Timeline.Item title="Active" onSelect={() => {}} isActive />
            <Timeline.Item
              title="Emphasised (unread)"
              emphasis
              trailing={<Count value={1} appearance="primary" />}
            />
            <Timeline.Item
              title="Custom marker"
              marker={<Avatar name="Dana Whitlock" size="xsmall" isDecorative />}
              meta="Dana Whitlock"
            />
            <Timeline.Item title="A menu in the trailing slot" trailing={menu()} />
            <Timeline.Item
              title="With a description, a note and a footer"
              meta="Dana Whitfield · 14 Sep → 18 Sep"
              description="Moved to line up with the quarter close, after the assessor asked for two more weeks."
              time="28 Aug"
              dateTime="2026-08-28"
              timeTitle="2026-08-28 09:12"
              footer={
                <>
                  <Badge size="xsmall" tone="warning">
                    Due date
                  </Badge>
                  <Badge size="xsmall">Milestone</Badge>
                </>
              }
            >
              <Attachment name="Quarter-close.pdf" size="220 KB" />
            </Timeline.Item>
          </Timeline.Group>
          <Timeline.Group label="Icon markers">
            <Timeline.Item
              tone="success"
              icon={<Check />}
              title="Deployed to production"
              meta="a1b2c3d · main · 42s"
              time="2m ago"
            />
            <Timeline.Item
              tone="danger"
              icon={<X />}
              title="Preview deploy failed"
              meta="i7j8k9l · feat/auth · 1m 12s"
              time="1h ago"
            />
            <Timeline.Item
              tone="information"
              icon={<Play />}
              title="Unit and integration tests"
              meta="142 suites running"
              time="now"
            />
            <Timeline.Item
              icon={<Plus />}
              title="Control created"
              meta="Dana Whitfield"
              time="3 Aug"
            />
          </Timeline.Group>
        </Timeline>
      </Box>
      <Specimens title="Sizes: small, a bare dot; medium, the ring; large, a small Avatar or a disc">
        {(["small", "medium", "large"] as const).map((size) => (
          <Box key={size} style={{ width: 220 }}>
            <Timeline label={`${size} timeline`} size={size}>
              {three(size)}
            </Timeline>
          </Box>
        ))}
      </Specimens>
      <Specimens title="Where the time sits: end of the title's line, above it, below in the footer, or in a column before the rail">
        {(["end", "above", "below", "start"] as const).map((position) => (
          <Box key={position} style={{ width: 240 }}>
            <Timeline label={`time ${position}`} timePosition={position}>
              <Timeline.Item
                tone="success"
                title="Verified"
                meta="Priya Natarajan"
                time="2h ago"
                footer={
                  <Badge size="xsmall" tone="success">
                    Done
                  </Badge>
                }
              />
              <Timeline.Item
                tone="information"
                title="Evidence linked"
                meta="Dana Whitfield"
                time="Yesterday"
              />
            </Timeline>
          </Box>
        ))}
      </Specimens>
      <Specimens title="Across: centred with the time above, for a line of releases; start-aligned with the time below, for stages with a body">
        <Box style={{ width: 520 }}>
          <Timeline label="Releases" orientation="horizontal">
            <Timeline.Item
              tone="success"
              icon={<Check />}
              time="Jan 2025"
              title="v1.0"
              meta="Initial release"
            />
            <Timeline.Item
              tone="success"
              icon={<Check />}
              time="Mar 2025"
              title="v1.1"
              meta="Bug fixes"
            />
            <Timeline.Item
              tone="information"
              icon={<Play />}
              time="Jun 2025"
              title={
                <span className="inline-flex items-center gap-050">
                  v2.0
                  <Badge tone="information" size="xsmall">
                    Current
                  </Badge>
                </span>
              }
              meta="Major update"
              emphasis
            />
            <Timeline.Item time="Sep 2025" title="v2.1" meta="Improvements" />
          </Timeline>
        </Box>
        <Box style={{ width: 520 }}>
          <Timeline
            label="Approval"
            orientation="horizontal"
            align="start"
            timePosition="below"
            size="large"
          >
            <Timeline.Item
              tone="success"
              icon={<Check />}
              time="09:00"
              title="Trigger captured"
              description="Customer, urgency and routing fields arrived cleanly."
            />
            <Timeline.Item
              tone="success"
              icon={<Check />}
              time="09:14"
              title="Records matched"
              description="CRM and billing records attached before risk review."
            />
            <Timeline.Item
              tone="information"
              icon={<Play />}
              time="09:31"
              title="Lead sign-off"
              description="The recommended decision is with the account lead."
              emphasis
            />
          </Timeline>
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** A feed of people: a small Avatar as the marker, the title a sentence, the time in the footer with the kind, a menu on every row, and what each event carries under it. */
function Feed() {
  return (
    <Timeline label="Finance activity" size="large" timePosition="below">
      <Timeline.Item
        marker={person("Nadia Flores")}
        title={
          <Did who="Nadia Flores" what="approved payout batch">
            <TextLink asChild={false} href="#ach-4182">
              ACH-4182
            </TextLink>
          </Did>
        }
        description="$142,800 routed to 38 merchant accounts."
        time="5 minutes ago"
        dateTime="2026-09-04T14:05"
        timeTitle="2026-09-04 14:05"
        footer={
          <>
            <Badge size="xsmall" icon={<Dot tone="success" />}>
              Payout
            </Badge>
            <Badge size="xsmall" tone="success">
              Same day
            </Badge>
          </>
        }
        trailing={menu()}
      />
      <Timeline.Item
        marker={person("Theo Ramsey")}
        title={
          <Did who="Theo Ramsey" what="flagged review on transfer">
            <TextLink asChild={false} href="#tx-9041">
              TX-9041
            </TextLink>
          </Did>
        }
        description="Velocity threshold exceeded for a new payee."
        time="18 minutes ago"
        dateTime="2026-09-04T13:52"
        footer={
          <>
            <Badge size="xsmall" icon={<Dot tone="warning" />}>
              Risk
            </Badge>
            <Badge size="xsmall" tone="warning">
              High
            </Badge>
          </>
        }
        trailing={menu()}
      >
        <Inline space="space.100">
          <Button size="small" variant="primary">
            Review
          </Button>
          <Button size="small">Clear</Button>
        </Inline>
      </Timeline.Item>
      <Timeline.Item
        marker={person("Iris Chen")}
        title={
          <Did who="Iris Chen" what="reconciled ledger entry">
            <TextLink asChild={false} href="#ldg-7749">
              LDG-7749
            </TextLink>
          </Did>
        }
        description="Subscription invoice matched to the bank settlement."
        time="42 minutes ago"
        dateTime="2026-09-04T13:28"
        footer={
          <Badge size="xsmall" icon={<Dot tone="information" />}>
            Ledger
          </Badge>
        }
        trailing={menu()}
      >
        <Attachment name="settlement-match.csv" size="48 KB" />
      </Timeline.Item>
      <Timeline.Item
        marker={person("Marcus Bell")}
        title={<Did who="Marcus Bell" what="raised the limit for Northstar workspace" />}
        description="Monthly card volume increased to $850K."
        time="1 hour ago"
        dateTime="2026-09-04T13:10"
        footer={<Badge size="xsmall">Limit raised</Badge>}
        trailing={menu()}
      >
        <Avatar.Stack
          names={["Priya Natarajan", "Dana Whitfield", "Owen Fox", "Sam Lee"]}
          max={2}
        />
      </Timeline.Item>
      <Timeline.Item
        title={
          <Did who="Engineering" what="started sprint">
            Backend optimisation
          </Did>
        }
        description="API latency work with schema clean-up and queue tuning."
        time="2 days ago"
        dateTime="2026-09-02"
        footer={
          <>
            <Badge size="xsmall" tone="warning">
              3 tasks in progress
            </Badge>
            <Badge size="xsmall">Sprint 18</Badge>
          </>
        }
        trailing={menu()}
      >
        <Box className="max-w-[240px]">
          <Progress value={62} tone="success" label="Sprint progress" size="small" />
        </Box>
      </Timeline.Item>
      <Timeline.Item
        marker={person("Nora Patel")}
        title={
          <Did who="Nora Patel" what="mentioned you in">
            Partner campaign
          </Did>
        }
        time="1 day ago"
        dateTime="2026-09-03"
        footer={<Badge size="xsmall">Thread open</Badge>}
        trailing={menu()}
      >
        <Text size="small" color="color.text.subtle">
          "@Alex, can you update the partner guidelines?"{" "}
          <TextLink asChild={false} href="#thread" size="small">
            View
          </TextLink>
        </Text>
      </Timeline.Item>
    </Timeline>
  );
}

/** A record's activity: newest first, grouped by period, the unread rows emphasised, each row opening the event. */
export const Activity: Story = {
  render: () => (
    <Timeline label="Activity" className="max-w-[480px]">
      <Timeline.Group label="This week" count={2}>
        <Timeline.Item
          tone="success"
          title="Verified by Priya Natarajan"
          meta="All 3 evidence items reviewed"
          time="2h ago"
          dateTime="2026-09-04T12:10"
          timeTitle="2026-09-04 12:10"
          emphasis
          onSelect={() => undefined}
        />
        <Timeline.Item
          tone="information"
          title="Evidence linked"
          meta="Bank reconciliation, July"
          time="Yesterday"
          dateTime="2026-09-03"
          trailing={<Count value={1} appearance="primary" />}
          onSelect={() => undefined}
        />
      </Timeline.Group>
      <Timeline.Group label="August">
        <Timeline.Item
          tone="warning"
          title="Due date moved"
          meta="14 Sep → 18 Sep"
          time="28 Aug"
          dateTime="2026-08-28"
          isActive
          onSelect={() => undefined}
        >
          Moved to line up with the quarter close.
        </Timeline.Item>
        <Timeline.Item
          marker={<Avatar name="Dana Whitfield" size="xsmall" isDecorative />}
          title="Dana Whitfield took ownership"
          meta="Dana Whitfield"
          time="20 Aug"
          dateTime="2026-08-20"
          onSelect={() => undefined}
        />
        <Timeline.Item
          title="Control created"
          time="3 Aug"
          dateTime="2026-08-03"
          onSelect={() => undefined}
        />
      </Timeline.Group>
    </Timeline>
  ),
};

/** A feed of people, large: who did what as the title, the kind and the time in the footer, a menu on each row, and under the rows an attachment, two buttons, a stack, a progress, a quote. */
export const People: Story = {
  render: () => (
    <Box className="max-w-[560px]">
      <Feed />
    </Box>
  ),
};

/** A dated log, small: the date above each event, the verb subtle before what it did, a sentence under, the file, and who with the state last. */
export const Log: Story = {
  render: () => (
    <Timeline label="Rollout log" size="small" timePosition="above" className="max-w-[480px]">
      <Timeline.Item
        tone="success"
        time="6 May 2026"
        dateTime="2026-05-06"
        title={<Did what="Completed">Renewal workspace handoff</Did>}
        description="Success plan, contract notes and expansion risks are ready for the account team."
        footer={
          <>
            Maya Brooks
            <Badge size="xsmall" tone="success">
              Done
            </Badge>
            <Badge size="xsmall" icon={<Dot tone="success" />}>
              Healthy
            </Badge>
          </>
        }
      >
        <Attachment name="Handoff.pdf" size="1.8 MB" />
      </Timeline.Item>
      <Timeline.Item
        tone="information"
        time="2 May 2026"
        dateTime="2026-05-02"
        title={<Did what="Verified">SSO and SCIM sync</Did>}
        description="Directory groups match workspace roles before admin invitations are released."
        footer={
          <>
            Nina Patel
            <Badge size="xsmall" tone="information">
              Auth
            </Badge>
            <Badge size="xsmall" icon={<Dot tone="information" />}>
              Low risk
            </Badge>
          </>
        }
      >
        <Attachment name="SSO-map.csv" size="84 KB" />
      </Timeline.Item>
      <Timeline.Item
        time="28 Apr 2026"
        dateTime="2026-04-28"
        title={<Did what="Approved">Usage-based billing limits</Did>}
        description="Finance confirmed seat buffers and usage caps for the renewal workspace."
        footer={
          <>
            Theo Grant
            <Badge size="xsmall">Limit</Badge>
            <Badge size="xsmall" icon={<Dot />}>
              125% cap
            </Badge>
          </>
        }
      />
      <Timeline.Item
        tone="warning"
        time="22 Apr 2026"
        dateTime="2026-04-22"
        title={<Did what="Imported">Production customer records</Did>}
        description="Customer contacts, renewal dates and usage snapshots cleared validation."
        footer={
          <>
            Leah Stone
            <Badge size="xsmall" tone="warning">
              Data
            </Badge>
            <Badge size="xsmall" icon={<Dot tone="warning" />}>
              18.4k rows
            </Badge>
          </>
        }
      >
        <Attachment name="Import-log.txt" size="26 KB" />
      </Timeline.Item>
    </Timeline>
  ),
};

/** Releases, the month in a column before the rail: newest first, the current one emphasised, what changed in a sentence, the tags last. */
export const Releases: Story = {
  render: () => (
    <Timeline label="Releases" timePosition="start" className="max-w-[560px]">
      <Timeline.Item
        tone="information"
        emphasis
        time="May 2025"
        dateTime="2025-05"
        title="v2.5 Release channels"
        description="Staged release channels for beta teams, enterprise accounts and internal QA cohorts."
        footer={
          <>
            <Badge size="xsmall" tone="information">
              New
            </Badge>
            <Badge size="xsmall">Team rollout</Badge>
            <Badge size="xsmall">Channel permissions</Badge>
            <Badge size="xsmall">Scheduled publishing</Badge>
          </>
        }
      />
      <Timeline.Item
        time="Apr 2025"
        dateTime="2025-04"
        title="v2.4 AI assist"
        description="Workspace summaries, prompt presets and faster review suggestions."
        footer={
          <>
            <Badge size="xsmall" tone="information">
              New
            </Badge>
            <Badge size="xsmall">Faster reviews</Badge>
            <Badge size="xsmall">Prompt library</Badge>
          </>
        }
      />
      <Timeline.Item
        time="Mar 2025"
        dateTime="2025-03"
        title="v2.3 Theme studio"
        description="Token previews, component states and one-click CSS exports."
        footer={
          <>
            <Badge size="xsmall" tone="success">
              Improved
            </Badge>
            <Badge size="xsmall">Design systems</Badge>
            <Badge size="xsmall">CSS export</Badge>
          </>
        }
      />
      <Timeline.Item
        time="Feb 2025"
        dateTime="2025-02"
        title="v2.2 Live editing"
        description="Shared cursors, presence labels and conflict-safe draft recovery."
        footer={
          <>
            <Badge size="xsmall" tone="success">
              Improved
            </Badge>
            <Badge size="xsmall">Collaboration</Badge>
            <Badge size="xsmall">Draft recovery</Badge>
          </>
        }
      />
    </Timeline>
  ),
};

/** A workflow across a header, start-aligned in a scrolling area, each stage with its file and its owner; a project's journey, centred; and a pipeline down a panel with a collapsible detail under a row. */
export const Runs: Story = {
  render: () => (
    <Stack space="space.600">
      <ScrollArea orientation="horizontal" className="max-w-[640px]">
        <Box style={{ width: 960 }}>
          <Timeline
            label="Approval workflow"
            orientation="horizontal"
            align="start"
            timePosition="below"
            size="large"
          >
            <Timeline.Item
              tone="success"
              icon={<Check />}
              time="09:00"
              title="Trigger captured"
              meta="Intake"
              description="Customer, urgency and routing fields arrived cleanly."
              footer={<Person name="Sam Lee" />}
            >
              <Attachment name="intake.json" size="2 KB" />
            </Timeline.Item>
            <Timeline.Item
              tone="success"
              icon={<Check />}
              time="09:14"
              title="Records matched"
              meta="Enrichment"
              description="CRM and billing records attached before risk review."
              footer={<Person name="Ira Wells" />}
            >
              <Attachment name="crm-match.csv" size="18 KB" />
            </Timeline.Item>
            <Timeline.Item
              tone="success"
              icon={<Check />}
              time="09:31"
              title="Policy cleared"
              meta="Review"
              description="Terms, region rules and account flags passed review."
              footer={<Person name="Owen Fox" />}
            >
              <Attachment name="policy.pdf" size="140 KB" />
            </Timeline.Item>
            <Timeline.Item
              tone="information"
              icon={<Play />}
              time="09:48"
              title="Lead sign-off running"
              meta="Approval"
              description="The recommended decision is with the account lead."
              emphasis
              footer={<Person name="Maya Chen" />}
            >
              <Attachment name="signoff.docx" size="32 KB" />
            </Timeline.Item>
          </Timeline>
        </Box>
      </ScrollArea>
      <Timeline label="Journey" orientation="horizontal" className="max-w-[640px]">
        <Timeline.Item
          tone="success"
          icon={<Check />}
          time="Oct 2024"
          title="Kickoff"
          meta="Goals and the core team"
          onSelect={() => undefined}
        />
        <Timeline.Item
          tone="success"
          icon={<Check />}
          time="Nov 2024"
          title="Discovery"
          meta="Research and requirements"
          onSelect={() => undefined}
        />
        <Timeline.Item
          tone="information"
          icon={<Play />}
          time="Dec 2024"
          title="Implementation"
          meta="Sprints under way"
          emphasis
          onSelect={() => undefined}
        />
        <Timeline.Item time="Feb 2025" title="Assessment" meta="Planned" />
      </Timeline>
      <Timeline label="Pipeline" className="max-w-[480px]">
        <Timeline.Item
          tone="success"
          icon={<Check />}
          title="Source checkout"
          meta="12s"
          time="3m ago"
        >
          <Collapsible title="Alex Johnson" className="border-t-0">
            <Text size="small" color="color.text.subtle">
              Fetched the latest changes from main.
            </Text>
          </Collapsible>
        </Timeline.Item>
        <Timeline.Item
          tone="success"
          icon={<Check />}
          title="Dependencies"
          meta="1m 45s"
          time="2m ago"
        />
        <Timeline.Item
          tone="information"
          icon={<Play />}
          title="Tests"
          meta="142 suites"
          time="now"
          emphasis
        >
          <Collapsible title="Michael Rodriguez" defaultOpen className="border-t-0">
            <Text size="small" color="color.text.subtle">
              Running 142 suites across the codebase.
            </Text>
          </Collapsible>
        </Timeline.Item>
        <Timeline.Item title="Production build" meta="Pending" />
      </Timeline>
    </Stack>
  ),
};

function ActivitySheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open activity</Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={
          <Inline space="space.100" alignBlock="center">
            Finance activity
            <Count value={12} appearance="primary" />
          </Inline>
        }
        subtitle="Payouts, risk, invoices and ledger updates"
        width={560}
      >
        <Feed />
      </Sheet>
    </>
  );
}

/** The feed in a Sheet from the end: the count in the title, the rows scrolling under the header. */
export const InASheet: Story = {
  name: "In a sheet",
  render: () => <ActivitySheet />,
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Timeline label="History">
            <Timeline.Item tone="success" title="Verified" meta="Priya Natarajan" time="2h ago" />
            <Timeline.Item
              tone="information"
              title="Evidence linked"
              meta="Dana Whitfield"
              time="Yesterday"
            />
            <Timeline.Item title="Control created" meta="Dana Whitfield" time="3 Aug" />
          </Timeline>
        }
        doText="Newest first: the reader wants what just happened."
        dont={
          <Timeline label="History">
            <Timeline.Item title="Control created" meta="Dana Whitfield" time="3 Aug" />
            <Timeline.Item
              tone="information"
              title="Evidence linked"
              meta="Dana Whitfield"
              time="Yesterday"
            />
            <Timeline.Item tone="success" title="Verified" meta="Priya Natarajan" time="2h ago" />
          </Timeline>
        }
        dontText="Oldest first, down a page. The latest event is at the bottom, under the fold on a long record. Across a header, oldest first is the order."
      />
      <Pair
        do={
          <Timeline label="History">
            <Timeline.Item
              tone="warning"
              title="Due date moved"
              meta="Dana Whitfield · 14 Sep → 18 Sep"
              description="Moved to line up with the quarter close, after the assessor asked for two more weeks."
              time="28 Aug"
            />
          </Timeline>
        }
        doText="The title says what happened; the meta says who and what changed; the description says why."
        dont={
          <Timeline label="History">
            <Timeline.Item
              tone="warning"
              title="Dana Whitfield moved the due date from 14 September to 18 September to line up with the quarter close, after the assessor asked for two more weeks"
              time="28 Aug"
            />
          </Timeline>
        }
        dontText="The whole story in the title. It truncates, and the who and the when are lost in it."
      />
      <Pair
        do={
          <Timeline label="History">
            <Timeline.Item tone="success" title="Verified" meta="Priya Natarajan" time="2h ago" />
            <Timeline.Item title="Evidence linked" meta="Dana Whitfield" time="Yesterday" />
            <Timeline.Item title="Owner changed" meta="Dana Whitfield" time="Monday" />
            <Timeline.Item title="Control created" meta="Dana Whitfield" time="3 Aug" />
          </Timeline>
        }
        doText="A tone where the event has one; neutral where it does not. The green says verified."
        dont={
          <Timeline label="History">
            <Timeline.Item tone="success" title="Verified" meta="Priya Natarajan" time="2h ago" />
            <Timeline.Item
              tone="information"
              title="Evidence linked"
              meta="Dana Whitfield"
              time="Yesterday"
            />
            <Timeline.Item
              tone="warning"
              title="Owner changed"
              meta="Dana Whitfield"
              time="Monday"
            />
            <Timeline.Item
              tone="danger"
              title="Control created"
              meta="Dana Whitfield"
              time="3 Aug"
            />
          </Timeline>
        }
        dontText="A different colour on every marker to tell rows apart. The tones are status; a red dot says something went wrong, and here nothing did."
      />
      <Pair
        do={
          <Item.Group>
            <Item id="EV-2201" title="Bank reconciliation, July" meta="PDF" trailing="12 Aug" />
            <Item id="EV-2202" title="Approval matrix" meta="XLSX" trailing="9 Aug" />
          </Item.Group>
        }
        doText="Things with a date are an Item list."
        dont={
          <Timeline label="Evidence">
            <Timeline.Item title="Bank reconciliation, July" meta="PDF" time="12 Aug" />
            <Timeline.Item title="Approval matrix" meta="XLSX" time="9 Aug" />
          </Timeline>
        }
        dontText="Documents on a rail. A timeline is events, not records; the rail promises a story that is not there."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
