import {
  Attachment,
  Avatar,
  AvatarFallback,
  AvatarGroupCount,
  avatarInitials,
  AvatarGroup,
  avatarHue,
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Count,
  Dot,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Item,
  Person,
  Progress,
  ScrollArea,
  ScrollBar,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  TextLink,
  Timeline,
  TimelineGroup,
  TimelineItem,
  tones,
} from "../../components";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  MoreHorizontal,
  Paperclip,
  Play,
  Plus,
  X,
} from "lucide-react";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { createRef, useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Box, HeadingLevelProvider, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Timeline",
  component: Timeline,
  subcomponents: { TimelineItem, TimelineGroup },
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

/** A file on an event: the kit's Attachment with its name and size, the download beside it. */
function EventFile({ name, size }: { name: string; size: string }) {
  return (
    <Attachment size="small" style={{ maxWidth: 320 }}>
      <Attachment.Media aria-hidden="true">
        <Paperclip />
      </Attachment.Media>
      <Attachment.Content>
        <Attachment.Title>{name}</Attachment.Title>
        <Attachment.Description>{size}</Attachment.Description>
      </Attachment.Content>
      <Attachment.Actions>
        <Attachment.Action label={`Download ${name}`} icon={<Download />} />
      </Attachment.Actions>
    </Attachment>
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
  <DropdownMenu>
    <DropdownMenuTrigger
      render={<IconButton variant="subtle" label="More actions" icon={<MoreHorizontal />} />}
    />
    <DropdownMenuContent align="end" style={{ width: 200 }}>
      <DropdownMenuItem onClick={() => {}}>Open record</DropdownMenuItem>
      <DropdownMenuItem onClick={() => {}}>Copy link</DropdownMenuItem>
      <DropdownMenuItem onClick={() => {}}>Add follow-up</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="danger" onClick={() => {}}>
        Archive
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const person = (name: string, size: "xsmall" | "small" = "small") => (
  <Avatar size={size} variant="tinted" aria-hidden="true" hue={avatarHue(name)} title={name}>
    <AvatarFallback>{avatarInitials(name, size === "xsmall" ? 1 : 2)}</AvatarFallback>
  </Avatar>
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
              title="A new comment"
              meta="isUnread: medium weight, and read as unread"
              isUnread
              trailing={<Count value={1} appearance="primary" />}
            />
            <Timeline.Item
              title="Custom marker"
              marker={
                <Avatar
                  size="xsmall"
                  aria-hidden="true"
                  hue={avatarHue("Dana Whitlock")}
                  title={"Dana Whitlock"}
                >
                  <AvatarFallback>{avatarInitials("Dana Whitlock", 1)}</AvatarFallback>
                </Avatar>
              }
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
                  <Badge variant="secondary" size="xsmall" tone="warning">
                    Due date
                  </Badge>
                  <Badge variant="secondary" tone="neutral" size="xsmall">
                    Milestone
                  </Badge>
                </>
              }
            >
              <EventFile name="Quarter-close.pdf" size="220 KB" />
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
                  <Badge variant="secondary" size="xsmall" tone="success">
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
        <Box className="w-full" style={{ maxWidth: 520 }}>
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
                  <Badge variant="secondary" tone="information" size="xsmall">
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
        <Box className="w-full" style={{ maxWidth: 520 }}>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const activity = canvas.getByRole("list", { name: "Activity" });
    // A list whose markers are removed says it is a list, its groups' lists too.
    await expect(activity).toHaveAttribute("role", "list");
    const states = within(activity).getByRole("list", { name: "States" });
    await expect(states).toHaveAttribute("role", "list");
    // A group's label is a heading at the contextual level: an h3 outside every provider.
    const heading = canvas.getByRole("heading", { name: "States" });
    await expect(heading.tagName).toBe("H3");
    // The sticky label paints over the rail and the markers that pass under it.
    const sticky = heading.closest("div")!;
    const markerColumn = within(states).getAllByRole("listitem")[0]!.children[1]!;
    await expect(Number(getComputedStyle(sticky).zIndex)).toBeGreaterThan(
      Number(getComputedStyle(markerColumn).zIndex),
    );
    // The open event says so on its control; an unread one is read as unread.
    await expect(within(states).getByRole("button", { name: "Active" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    const unread = within(states).getByText("A new comment").closest("li")!;
    await expect(unread).toHaveTextContent("Unread: A new comment");
    // The full stamp is read after the words, and is their tooltip.
    const tones = within(activity).getByRole("list", { name: "Tones" });
    const stamp = within(tones).getAllByText("2h ago")[0]!.closest('[data-slot="truncate"]')!;
    await expect(stamp).toHaveTextContent("2h ago, 2026-09-02 14:10");
    await expect(stamp).toHaveAttribute("title", "2026-09-02 14:10");
  },
};

/** A feed of people: a small Avatar as the marker, the title a sentence, the time in the footer with the kind, a menu on every row, and what each event carries under it. */
function Feed() {
  return (
    <Timeline label="Finance activity" size="large" timePosition="below">
      <Timeline.Item
        marker={person("Nadia Flores")}
        title={
          <Did who="Nadia Flores" what="approved payout batch">
            <TextLink href="#ach-4182">ACH-4182</TextLink>
          </Did>
        }
        description="$142,800 routed to 38 merchant accounts."
        time="5 minutes ago"
        dateTime="2026-09-04T14:05"
        timeTitle="2026-09-04 14:05"
        footer={
          <>
            <Badge variant="secondary" tone="neutral" size="xsmall" icon={<Dot tone="success" />}>
              Payout
            </Badge>
            <Badge variant="secondary" size="xsmall" tone="success">
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
            <TextLink href="#tx-9041">TX-9041</TextLink>
          </Did>
        }
        description="Velocity threshold exceeded for a new payee."
        time="18 minutes ago"
        dateTime="2026-09-04T13:52"
        footer={
          <>
            <Badge variant="secondary" tone="neutral" size="xsmall" icon={<Dot tone="warning" />}>
              Risk
            </Badge>
            <Badge variant="secondary" size="xsmall" tone="warning">
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
            <TextLink href="#ldg-7749">LDG-7749</TextLink>
          </Did>
        }
        description="Subscription invoice matched to the bank settlement."
        time="42 minutes ago"
        dateTime="2026-09-04T13:28"
        footer={
          <Badge variant="secondary" tone="neutral" size="xsmall" icon={<Dot tone="information" />}>
            Ledger
          </Badge>
        }
        trailing={menu()}
      >
        <EventFile name="settlement-match.csv" size="48 KB" />
      </Timeline.Item>
      <Timeline.Item
        marker={person("Marcus Bell")}
        title={<Did who="Marcus Bell" what="raised the limit for Northstar workspace" />}
        description="Monthly card volume increased to $850K."
        time="1 hour ago"
        dateTime="2026-09-04T13:10"
        footer={
          <Badge variant="secondary" tone="neutral" size="xsmall">
            Limit raised
          </Badge>
        }
        trailing={menu()}
      >
        <AvatarGroup role="group" aria-label="Reviewers">
          {["Priya Natarajan", "Dana Whitfield", "Owen Fox", "Sam Lee"].slice(0, 2).map((name) => (
            <Avatar key={name} role="img" aria-label={name}>
              <AvatarFallback>{avatarInitials(name)}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>+2</AvatarGroupCount>
        </AvatarGroup>
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
            <Badge variant="secondary" size="xsmall" tone="warning">
              3 tasks in progress
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Sprint 18
            </Badge>
          </>
        }
        trailing={menu()}
      >
        <Box className="max-w-[240px]">
          <Progress value={62} tone="success" size="small" aria-label="Sprint progress"></Progress>
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
        footer={
          <Badge variant="secondary" tone="neutral" size="xsmall">
            Thread open
          </Badge>
        }
        trailing={menu()}
      >
        <Text size="small" color="color.text.subtle">
          "@Alex, can you update the partner guidelines?"{" "}
          <TextLink href="#thread" size="small">
            View
          </TextLink>
        </Text>
      </Timeline.Item>
    </Timeline>
  );
}

/** A record's activity: newest first, grouped by period, the unread rows in medium weight and read as unread, each row opening the event, the open one marked current. */
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
          isUnread
          onSelect={() => undefined}
        />
        <Timeline.Item
          tone="information"
          title="Evidence linked"
          meta="Bank reconciliation, July"
          time="Yesterday"
          dateTime="2026-09-03"
          isUnread
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
          marker={
            <Avatar
              size="xsmall"
              aria-hidden="true"
              hue={avatarHue("Dana Whitfield")}
              title={"Dana Whitfield"}
            >
              <AvatarFallback>{avatarInitials("Dana Whitfield", 1)}</AvatarFallback>
            </Avatar>
          }
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Unread: Verified by Priya Natarajan" }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Due date moved" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Control created" })).not.toHaveAttribute(
      "aria-current",
    );
    // In forced colours the open event keeps a fill of its own: Highlight, where the rest are Canvas.
    if (matchMedia("(forced-colors: active)").matches) {
      const open = canvas.getByRole("button", { name: "Due date moved" }).closest("li")!;
      const plain = canvas.getByRole("button", { name: "Control created" }).closest("li")!;
      await expect(open).toHaveAttribute("data-active");
      await expect(getComputedStyle(open).backgroundColor).not.toBe(
        getComputedStyle(plain).backgroundColor,
      );
    }
    // A given `time` beside `dateTime` is a <time>; the full stamp follows it for a screen reader.
    const stamp = canvas.getByText("2h ago").closest("time")!;
    await expect(stamp).toHaveAttribute("datetime", "2026-09-04T12:10");
    await expect(stamp).toHaveTextContent("2h ago, 2026-09-04 12:10");
  },
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
            <Badge variant="secondary" size="xsmall" tone="success">
              Done
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall" icon={<Dot tone="success" />}>
              Healthy
            </Badge>
          </>
        }
      >
        <EventFile name="Handoff.pdf" size="1.8 MB" />
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
            <Badge variant="secondary" size="xsmall" tone="information">
              Auth
            </Badge>
            <Badge
              variant="secondary"
              tone="neutral"
              size="xsmall"
              icon={<Dot tone="information" />}
            >
              Low risk
            </Badge>
          </>
        }
      >
        <EventFile name="SSO-map.csv" size="84 KB" />
      </Timeline.Item>
      <Timeline.Item
        time="28 Apr 2026"
        dateTime="2026-04-28"
        title={<Did what="Approved">Usage-based billing limits</Did>}
        description="Finance confirmed seat buffers and usage caps for the renewal workspace."
        footer={
          <>
            Theo Grant
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Limit
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall" icon={<Dot />}>
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
            <Badge variant="secondary" size="xsmall" tone="warning">
              Data
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall" icon={<Dot tone="warning" />}>
              18.4k rows
            </Badge>
          </>
        }
      >
        <EventFile name="Import-log.txt" size="26 KB" />
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
            <Badge variant="secondary" size="xsmall" tone="information">
              New
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Team rollout
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Channel permissions
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Scheduled publishing
            </Badge>
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
            <Badge variant="secondary" size="xsmall" tone="information">
              New
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Faster reviews
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Prompt library
            </Badge>
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
            <Badge variant="secondary" size="xsmall" tone="success">
              Improved
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Design systems
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              CSS export
            </Badge>
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
            <Badge variant="secondary" size="xsmall" tone="success">
              Improved
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Collaboration
            </Badge>
            <Badge variant="secondary" tone="neutral" size="xsmall">
              Draft recovery
            </Badge>
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
      <ScrollArea className="max-w-[640px]">
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
              <EventFile name="intake.json" size="2 KB" />
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
              <EventFile name="crm-match.csv" size="18 KB" />
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
              <EventFile name="policy.pdf" size="140 KB" />
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
              <EventFile name="signoff.docx" size="32 KB" />
            </Timeline.Item>
          </Timeline>
        </Box>
        <ScrollBar orientation="horizontal" />
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
          <Collapsible className="border-t border-default border-t-0">
            <h3>
              <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
                Alex Johnson
                <ChevronDown
                  aria-hidden="true"
                  className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
                />
              </CollapsibleTrigger>
            </h3>
            <CollapsibleContent>
              <div className="pb-200">
                <Text size="small" color="color.text.subtle">
                  Fetched the latest changes from main.
                </Text>
              </div>
            </CollapsibleContent>
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
          <Collapsible defaultOpen className="border-t border-default border-t-0">
            <h3>
              <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
                Michael Rodriguez
                <ChevronDown
                  aria-hidden="true"
                  className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
                />
              </CollapsibleTrigger>
            </h3>
            <CollapsibleContent>
              <div className="pb-200">
                <Text size="small" color="color.text.subtle">
                  Running 142 suites across the codebase.
                </Text>
              </div>
            </CollapsibleContent>
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
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
          }
        }}
      >
        <SheetContent side="end" style={{ maxWidth: 560 }}>
          <SheetHeader>
            <div className="flex items-start gap-100">
              <div className="flex min-w-0 flex-1 flex-col gap-025">
                <SheetTitle>
                  <Inline space="space.100" alignBlock="center">
                    Finance activity
                    <Count value={12} appearance="primary" />
                  </Inline>
                </SheetTitle>
                <SheetDescription>Payouts, risk, invoices and ledger updates</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
            <Feed />
          </div>
        </SheetContent>
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

/** A feed already fits Timeline.Item: callers supply markers, sentences and event labels. */
export const FeedComposition: Story = {
  render: () => (
    <Timeline label="Updates" size="large" timePosition="end">
      <Timeline.Item
        marker={
          <Avatar
            size="small"
            aria-hidden="true"
            hue={avatarHue("Sam Rivera")}
            title={"Sam Rivera"}
          >
            <AvatarFallback>{avatarInitials("Sam Rivera", 2)}</AvatarFallback>
          </Avatar>
        }
        title="Sam Rivera shared an update"
        meta="Comment"
        time="10:30"
        dateTime="2026-09-06T10:30:00Z"
      >
        <Text>The draft is ready for review.</Text>
      </Timeline.Item>
      <Timeline.Item
        icon={<Check />}
        tone="success"
        title="Review finished"
        meta="Automation"
        time="10:45"
        dateTime="2026-09-06T10:45:00Z"
      />
    </Timeline>
  ),
};

/** Four releases across a small phone: the strip keeps the width its stages need and scrolls inside its container instead of running past the window. */
export const Narrow: Story = {
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: () => (
    <Timeline label="Releases" orientation="horizontal">
      <Timeline.Item time="Jan 2025" title="v1.0" meta="Initial release" />
      <Timeline.Item time="Mar 2025" title="v1.1" meta="Bulk import" />
      <Timeline.Item time="Jun 2025" title="v1.2" meta="Evidence review" />
      <Timeline.Item time="Sep 2025" title="v2.0" meta="Program setup" />
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const list = within(canvasElement).getByRole("list", { name: "Releases" });
    const viewport = list.parentElement!;
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    await expect(viewport.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    // Nothing in the strip takes focus, so the overflowing strip is the stop: a group named after
    // the list, and the arrow keys scroll it.
    await waitFor(() => expect(viewport).toHaveAttribute("tabindex", "0"));
    await expect(viewport).toHaveAttribute("role", "group");
    await expect(viewport).toHaveAccessibleName("Releases, scrolls");
  },
};

/**
 * A workflow's stages across a record, each at least a rail wide (`itemWidth="rail"`) so its title
 * and date stay readable, the titles wrapping (`wrap`), the strip scrolling past that. The stages
 * open in place, so the strip is no stop of its own; a focused stage's ring is drawn inside it.
 */
export const Stages: Story = {
  render: () => (
    <Box style={{ maxWidth: 480 }}>
      <Timeline
        label="Lifecycle gates"
        orientation="horizontal"
        align="start"
        timePosition="below"
        itemWidth="rail"
        wrap
      >
        <Timeline.Item
          tone="success"
          icon={<Check />}
          time="Passed 12 Feb 2026"
          title="System requirements review"
          onSelect={() => undefined}
        />
        <Timeline.Item
          tone="success"
          icon={<Check />}
          time="Passed 30 Apr 2026"
          title="Preliminary design review"
          onSelect={() => undefined}
        />
        <Timeline.Item
          tone="information"
          icon={<Play />}
          time="Due 10 Oct 2026"
          title="Critical design review"
          emphasis
          isActive
          onSelect={() => undefined}
        />
        <Timeline.Item
          time="Due 18 Jan 2027"
          title="Test readiness review"
          onSelect={() => undefined}
        />
      </Timeline>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Lifecycle gates" });
    const rail = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--ds-dimension-layout-rail"),
    );
    for (const item of within(list).getAllByRole("listitem")) {
      await expect(item.getBoundingClientRect().width).toBeGreaterThanOrEqual(rail - 1);
      // The title wraps instead of being cut.
      await expect(
        within(item).getByRole("button").querySelector('[data-slot="truncate"]'),
      ).toBeNull();
    }
    const viewport = list.parentElement!;
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    await expect(viewport).not.toHaveAttribute("tabindex");
    await expect(canvas.getByRole("button", { name: "Critical design review" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    // A focused stage's ring is drawn inside the strip, which clips.
    const second = canvas.getByRole("button", { name: "Preliminary design review" });
    second.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}{Tab}");
    await expect(second).toHaveFocus();
    await expect(getComputedStyle(second, "::after").outlineOffset).toBe("-2px");
    // At the column's start the ring passes beside the marker and the text, not over them.
    const stage = second.closest('[data-slot="timeline-item"]')!.firstElementChild!;
    const start = stage.getBoundingClientRect().left;
    const marker = stage.querySelector('[data-slot="timeline-marker"]')!;
    await expect(marker.getBoundingClientRect().left - start).toBeGreaterThanOrEqual(4);
    await expect(second.getBoundingClientRect().left - start).toBeGreaterThanOrEqual(4);
  },
};

/**
 * With only `dateTime`, the time is the relative words in the reader's locale ("5 minutes ago",
 * "yesterday"), kept current, and the full moment in the reader's zone is read after them and is
 * their tooltip.
 */
export const RelativeTimes: Story = {
  render: () => {
    const now = Date.now();
    const ago = (ms: number) => new Date(now - ms).toISOString();
    return (
      <Timeline label="History" className="max-w-layout-measure">
        <Timeline.Item
          tone="success"
          title="Verified"
          meta="Priya Natarajan"
          dateTime={ago(5 * 60_000)}
        />
        <Timeline.Item
          tone="information"
          title="Evidence linked"
          meta="Dana Whitfield"
          dateTime={ago(3 * 3_600_000)}
        />
        <Timeline.Item title="Control created" dateTime="2026-08-03" />
      </Timeline>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const words = canvas.getByText("5 minutes ago");
    const time = words.closest("time")!;
    await expect(time).toHaveAttribute("datetime");
    const stamp = words.closest('[data-slot="truncate"]')!;
    const full = stamp.getAttribute("title") ?? "";
    // The full moment has its year and its minutes.
    await expect(full).toMatch(/\d{4}/);
    await expect(full).toMatch(/\d:\d{2}/);
    await expect(stamp).toHaveTextContent(`5 minutes ago, ${full}`);
    const day = canvas.getByText("Control created").closest("li")!;
    await expect(day.querySelector("time")).toHaveAttribute("datetime", "2026-08-03");
  },
};

const longTitle =
  "Verified by Priya Natarajan-Whitfield after the second reviewer signed the evidence";

/**
 * A long title and a long stamp in a narrow list. Beside the title the stamp takes at most half the
 * line and is cut first; a title longer than the rest is cut, and shows whole on hover and while
 * its row has keyboard focus. With `wrap` and the time below, nothing is cut.
 */
export const LongContent: Story = {
  name: "Long content",
  render: () => (
    <Stack space="space.300">
      <Box className="w-full" style={{ maxWidth: 320 }}>
        <Timeline label="Cut">
          <Timeline.Item
            tone="success"
            title={longTitle}
            time="vor 2 Stunden und 14 Minuten"
            dateTime="2026-09-02T14:10"
            timeTitle="2. September 2026, 14:10 MESZ"
            onSelect={() => undefined}
          />
        </Timeline>
      </Box>
      <Box className="w-full" style={{ maxWidth: 320 }}>
        <Timeline label="Wrapped" wrap timePosition="below">
          <Timeline.Item
            tone="success"
            title={longTitle}
            time="vor 2 Stunden und 14 Minuten"
            dateTime="2026-09-02T14:10"
            timeTitle="2. September 2026, 14:10 MESZ"
          />
        </Timeline>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cut = (el: Element) => el.scrollWidth > el.clientWidth + 1;
    const cutList = canvas.getByRole("list", { name: "Cut" });
    const button = within(cutList).getByRole("button");
    const title = button.querySelector('[data-slot="truncate"]')!;
    const stamp = cutList.querySelector("time")!;
    const line = stamp.parentElement!;
    // Beside the title the stamp takes at most half the line, and is cut before the title is.
    await expect(stamp.getBoundingClientRect().width).toBeLessThanOrEqual(
      line.getBoundingClientRect().width / 2 + 1,
    );
    await expect(cut(stamp)).toBe(true);
    await expect(stamp).toHaveAttribute("title", "2. September 2026, 14:10 MESZ");
    await expect(cut(title)).toBe(true);
    // Keyboard focus on the row's title shows the whole title.
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toHaveTextContent(
        longTitle,
      ),
    );
    await userEvent.keyboard("{Escape}");
    // Wrapped, the title takes the lines it needs and the stamp under it is whole.
    const wrapped = canvas.getByRole("list", { name: "Wrapped" });
    const wrappedTitle = within(wrapped).getByText(longTitle);
    await expect(wrappedTitle.closest('[data-slot="truncate"]')).toBeNull();
    const wrappedStamp = wrapped.querySelector("time")!;
    await expect(cut(wrappedStamp)).toBe(false);
    await expect(wrappedTitle.getBoundingClientRect().height).toBeGreaterThan(
      wrappedStamp.getBoundingClientRect().height * 2,
    );
  },
};

/** A group's label is a heading at the level where the timeline sits: inside a Section under an h3, or a HeadingLevelProvider at 4 as here, an h4. */
export const GroupHeadings: Story = {
  render: () => (
    <HeadingLevelProvider level={4}>
      <Timeline label="History" className="max-w-layout-measure">
        <Timeline.Group label="This week" count={1}>
          <Timeline.Item tone="success" title="Verified" time="2h ago" />
        </Timeline.Group>
        <Timeline.Group label="August">
          <Timeline.Item title="Control created" time="3 Aug" />
        </Timeline.Group>
      </Timeline>
    </HeadingLevelProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "This week" }).tagName).toBe("H4");
    await expect(canvas.getByRole("heading", { name: "August" }).tagName).toBe("H4");
  },
};

const nativeRefs = {
  list: createRef<HTMLOListElement>(),
  group: createRef<HTMLLIElement>(),
  item: createRef<HTMLLIElement>(),
};

/** Native attributes, a class and a ref reach each part's own element: the list, the group's row and the event's row, so a product can give an event a test id, a tooltip or a focus ref. */
export const NativeAttributes: Story = {
  render: () => (
    <Timeline
      label="History"
      ref={nativeRefs.list}
      data-testid="history"
      className="max-w-layout-measure"
    >
      <Timeline.Group label="This week" ref={nativeRefs.group} data-testid="this-week">
        <Timeline.Item
          ref={nativeRefs.item}
          data-testid="published"
          className="text-default"
          tone="success"
          title="Version 3 published"
          time="2h ago"
        />
      </Timeline.Group>
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByTestId("history");
    await expect(nativeRefs.list.current).toBe(list);
    await expect(list).toHaveAttribute("data-slot", "timeline");
    await expect(list).toHaveAccessibleName("History");
    await expect(list).toHaveClass("max-w-layout-measure");
    const group = canvas.getByTestId("this-week");
    await expect(nativeRefs.group.current).toBe(group);
    await expect(group).toHaveAttribute("data-slot", "timeline-group");
    const item = canvas.getByTestId("published");
    await expect(nativeRefs.item.current).toBe(item);
    await expect(item).toHaveAttribute("data-slot", "timeline-item");
    await expect(item).toHaveClass("text-default");
    await expect(item.tagName).toBe("LI");
  },
};
