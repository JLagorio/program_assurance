import { type Meta, type StoryObj } from "@storybook/react-vite";
import { ExternalLink, MoreHorizontal, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { PreviewSheet, Related } from "../..";
import {
  Avatar,
  AvatarFallback,
  avatarHue,
  avatarInitials,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dot,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Indicator,
  Item,
  Table,
  TextLink,
  Timeline,
} from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/Related",
  component: Related,
  parameters: { layout: "padded" },
  args: { title: "Linked findings", count: 2 },
} satisfies Meta<typeof Related>;
export default meta;
type Story = StoryObj<typeof meta>;

const findings = (
  <>
    <Item
      id="FND-2231"
      title="Router management plane accepts unencrypted telnet"
      trailing="CAT I"
      link={<a href="#fnd-2231" />}
    />
    <Item
      id="FND-2214"
      title="SSH permits GSSAPI authentication"
      trailing="CAT II"
      link={<a href="#fnd-2214" />}
    />
  </>
);

const risks = (
  <>
    <Item
      leading={<Dot tone="danger" label="High" />}
      title="Unencrypted management traffic"
      trailing="12 Aug"
      link={<a href="#rsk-0021" />}
    />
    <Item
      leading={<Dot tone="warning" label="Medium" />}
      title="Stale privileged access review"
      trailing="30 Jun"
      link={<a href="#rsk-0018" />}
    />
  </>
);

const people = (
  <>
    <Item
      leading={
        <Avatar
          size="xsmall"
          aria-hidden="true"
          hue={avatarHue("Dana Whitfield")}
          title={"Dana Whitfield"}
        >
          <AvatarFallback>{avatarInitials("Dana Whitfield", 1)}</AvatarFallback>
        </Avatar>
      }
      title="Dana Whitfield"
      meta="Assessor"
      link={<a href="#dana" />}
    />
    <Item
      leading={
        <Avatar
          size="xsmall"
          aria-hidden="true"
          hue={avatarHue("Marcus Ryde")}
          title={"Marcus Ryde"}
        >
          <AvatarFallback>{avatarInitials("Marcus Ryde", 1)}</AvatarFallback>
        </Avatar>
      }
      title="Marcus Ryde"
      meta="ISSO"
      link={<a href="#marcus" />}
    />
  </>
);

const titles = [
  "Router management plane accepts unencrypted telnet",
  "SSH permits GSSAPI authentication",
  "Audit log retention below one year",
  "Default SNMP community string in use",
  "NTP unauthenticated on the core switch",
];
const many = Array.from({ length: 14 }, (_, i) => (
  <Item
    key={i}
    id={`FND-${2231 - i}`}
    title={titles[i % titles.length]}
    trailing={i % 3 ? "CAT II" : "CAT I"}
    link={<a href={`#f${i}`} />}
  />
));

/** The actions a card shows on hover: open in a new tab, and a menu with the rest. */
function cardActions(name: string) {
  return (
    <>
      <IconButton
        label={`Open ${name} in a new tab`}
        variant="subtle"
        size="small"
        icon={<ExternalLink />}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              label={`More for ${name}`}
              variant="subtle"
              size="small"
              icon={<MoreHorizontal />}
            />
          }
        />
        <DropdownMenuContent align="end" style={{ width: 200 }}>
          <DropdownMenuItem onClick={() => {}}>Edit the link</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => {}}>
            Unlink
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

const systems = [
  {
    name: "Ground segment",
    meta: "System · 4 subsystems",
    state: "In assessment",
    tone: "information" as const,
    owner: "Dana Whitfield",
    criticality: "High",
    controls: "287",
    requirements: "42 · 3 open",
  },
  {
    name: "Telemetry gateway",
    meta: "Component · Ground segment / Mission control",
    state: "Verified",
    tone: "success" as const,
    owner: "Marcus Ryde",
    criticality: "High",
    controls: "64",
    requirements: "11",
  },
  {
    name: "Range safety",
    meta: "Subsystem · Flight segment",
    state: "Not started",
    tone: "neutral" as const,
    owner: "Priya Natarajan",
    criticality: "Moderate",
    controls: "112",
    requirements: "18 · 6 open",
  },
];

const systemCards = systems.map((s) => (
  <Related.Card
    key={s.name}
    leading={
      <Avatar
        shape="square"
        variant="tinted"
        size="medium"
        aria-hidden="true"
        hue={avatarHue(s.name)}
        title={s.name}
      >
        <AvatarFallback>{avatarInitials(s.name, 2)}</AvatarFallback>
      </Avatar>
    }
    title={s.name}
    link={<a href={`#${s.name}`} />}
    meta={s.meta}
    status={
      <Badge variant="secondary" size="xsmall" tone={s.tone}>
        {s.state}
      </Badge>
    }
    properties={[
      { label: "Owner", value: s.owner },
      { label: "Criticality", value: s.criticality },
      { label: "Controls", value: s.controls },
      { label: "Requirements", value: s.requirements },
    ]}
    actions={cardActions(s.name)}
  />
));

const teamCards = [
  { name: "Dana Whitfield", role: "Assessor", org: "SCA team", since: "Mar 2026" },
  { name: "Marcus Ryde", role: "ISSO", org: "Program office", since: "Jan 2025" },
  { name: "Priya Natarajan", role: "System owner", org: "Flight software", since: "Aug 2024" },
].map((p) => (
  <Related.Card
    key={p.name}
    leading={
      <Avatar size="medium" aria-hidden="true" hue={avatarHue(p.name)} title={p.name}>
        <AvatarFallback>{avatarInitials(p.name, 2)}</AvatarFallback>
      </Avatar>
    }
    title={p.name}
    link={<a href={`#${p.name}`} />}
    meta={p.role}
    properties={[
      { label: "Organisation", value: p.org },
      { label: "On the program", value: `Since ${p.since}` },
    ]}
    actions={cardActions(p.name)}
  />
));

const addAction = (
  <Button size="xsmall" variant="subtle" iconBefore={<Plus />}>
    Add
  </Button>
);

/** In a rail: rows with an id and the state, a Dot and a date, people; a handful of many with See all; the empty state, plain and with a line and an action. In the body of a page: a grid of cards with a mark, the name as the link, one status, four properties and the actions on hover; people as cards; the empty state at that width. */
export const RelatedMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="In a rail: list">
        <Inline space="space.300" alignBlock="start" shouldWrap>
          <Stack space="space.300" className="w-layout-rail">
            <Related
              title="Linked findings"
              count={2}
              action={
                <Button size="xsmall" variant="subtle">
                  Link
                </Button>
              }
            >
              {findings}
            </Related>
            <Related title="Risks" count={2}>
              {risks}
            </Related>
            <Related title="Team" count={2}>
              {people}
            </Related>
          </Stack>
          <Stack space="space.300" className="w-layout-rail">
            <Related
              title="Linked findings"
              count={14}
              footer={
                <TextLink size="small" href="#all">
                  See all 14
                </TextLink>
              }
            >
              {many.slice(0, 5)}
            </Related>
            <Related title="Observations" />
            <Related
              title="Packages"
              action={addAction}
              empty={{
                title: "Not in a package yet",
                description: "A package gathers the evidence for one authorisation.",
                action: (
                  <Button size="small" variant="link">
                    Add to a package
                  </Button>
                ),
              }}
            />
          </Stack>
        </Inline>
      </Specimens>
      <Stack space="space.100">
        <Text size="xsmall" color="color.text.subtlest">
          In the body of a page: cards
        </Text>
        <Stack space="space.300">
          <Related title="Systems" count={3} layout="cards" action={addAction}>
            {systemCards}
          </Related>
          <Related
            title="Team"
            count={3}
            layout="cards"
            action={addAction}
            footer={
              <TextLink size="small" href="#team">
                See all 9
              </TextLink>
            }
          >
            {teamCards}
          </Related>
          <Related
            title="Packages"
            layout="cards"
            action={addAction}
            empty={{
              title: "Not in a package yet",
              description: "A package gathers the evidence for one authorisation.",
              action: (
                <Button size="small" variant="link">
                  Add to a package
                </Button>
              ),
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  ),
};

/** The linked records need columns to compare: a Table in a Card, headed by CardHeader. Not a Related. */
export const RelatedTable: Story = {
  name: "A related table",
  render: () => (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b">
        <CardTitle>
          <h2>{"Linked findings"}</h2>
        </CardTitle>
        <CardDescription>{"14 findings, by severity"}</CardDescription>
        <CardAction>
          <Button size="small" variant="subtle" iconBefore={<Plus />}>
            Link a finding
          </Button>
        </CardAction>
      </CardHeader>
      <Table label="Linked findings">
        <thead>
          <tr>
            <Table.Header width={110}>Finding</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header width={96}>Severity</Table.Header>
            <Table.Header width={120}>Asset</Table.Header>
            <Table.Header width={96}>Found</Table.Header>
          </tr>
        </thead>
        <tbody>
          {titles.map((t, i) => (
            <Table.Row key={t}>
              <Table.Id id={`FND-${2231 - i}`} />
              <Table.Cell className="truncate">{t}</Table.Cell>
              <Table.Cell>
                <Indicator tone={i % 3 ? "warning" : "danger"}>
                  {i % 3 ? "CAT II" : "CAT I"}
                </Indicator>
              </Table.Cell>
              <Table.Cell>edge-sw-a1</Table.Cell>
              <Table.Cell>12 Aug</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Card>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Related title="Systems" count={2} layout="cards">
            {systemCards.slice(0, 2)}
          </Related>
        }
        doText="The name is the link. The actions are icon buttons at the top end that show on hover and on focus, and always on a touch screen."
        dont={
          <Related title="Systems" count={2} layout="cards">
            {systems.slice(0, 2).map((s) => (
              <Related.Card
                key={s.name}
                leading={
                  <Avatar
                    shape="square"
                    variant="tinted"
                    size="medium"
                    aria-hidden="true"
                    hue={avatarHue(s.name)}
                    title={s.name}
                  >
                    <AvatarFallback>{avatarInitials(s.name, 2)}</AvatarFallback>
                  </Avatar>
                }
                title={s.name}
                meta={s.meta}
                properties={[
                  { label: "Owner", value: s.owner },
                  { label: "Criticality", value: s.criticality },
                ]}
              >
                <Inline space="space.100">
                  <Button size="small" variant="primary">
                    Open
                  </Button>
                  <Button size="small">Unlink</Button>
                </Inline>
              </Related.Card>
            ))}
          </Related>
        }
        dontText="A primary Open and an Unlink in every card. The way to a record is a link, and two buttons a card make a page of buttons."
      />
      <Pair
        do={
          <Box className="w-layout-rail">
            <Related title="Risks" action={addAction} />
          </Box>
        }
        doText="Nothing linked is an empty state: the mark, a statement, and the way to add one in the header."
        dont={
          <Box className="w-layout-rail">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>{"Risks"}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Text size="small" color="color.text.subtle">
                  Nothing linked yet.
                </Text>
              </CardContent>
            </Card>
          </Box>
        }
        dontText="A line of grey text where the rows would be. It reads as a row that failed to load, and there is no way out."
      />
      <Pair
        do={
          <Box className="w-layout-rail">
            <Related
              title="Linked findings"
              count={14}
              footer={
                <TextLink size="small" href="#all">
                  See all 14
                </TextLink>
              }
            >
              {many.slice(0, 5)}
            </Related>
          </Box>
        }
        doText="Five rows and See all. The rail shows the handful the reader acts on; the record's tab lists them all."
        dont={
          <Box className="w-layout-rail">
            <Related title="Linked findings" count={14}>
              {many}
            </Related>
          </Box>
        }
        dontText="Fourteen rows in a rail card. It is longer than the page beside it, and nothing sorts it."
      />
      <Pair
        do={
          <Box className="w-layout-rail">
            <Related title="Linked findings" count={2}>
              {findings}
            </Related>
          </Box>
        }
        doText="A noun for the title; an id, a name and the state at the end, per row."
        dont={
          <Box className="w-layout-rail">
            <Related
              title="Findings the assessor linked to this control during the last campaign"
              count={2}
            >
              <Item
                id="FND-2231"
                title="Router management plane accepts unencrypted telnet"
                meta={
                  <Inline space="space.050">
                    <Badge variant="secondary" tone="danger" size="xsmall">
                      CAT I
                    </Badge>
                    <Badge variant="secondary" tone="warning" size="xsmall">
                      Open
                    </Badge>
                    <Badge variant="secondary" tone="neutral" size="xsmall">
                      STIG
                    </Badge>
                  </Inline>
                }
                description="Found by the ACAS scan of 12 August on edge-sw-a1 and confirmed by hand the next day."
                link={<a href="#a" />}
              />
              <Item
                id="FND-2214"
                title="SSH permits GSSAPI authentication"
                meta={
                  <Inline space="space.050">
                    <Badge variant="secondary" tone="warning" size="xsmall">
                      CAT II
                    </Badge>
                    <Badge variant="secondary" tone="warning" size="xsmall">
                      Open
                    </Badge>
                    <Badge variant="secondary" tone="neutral" size="xsmall">
                      STIG
                    </Badge>
                  </Inline>
                }
                description="Found by the ACAS scan of 30 June on edge-sw-a1; the fix is scheduled for the next window."
                link={<a href="#b" />}
              />
            </Related>
          </Box>
        }
        dontText="A sentence for the title, three badges and a paragraph per row. The card has become a page."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Box className={args.layout === "cards" ? undefined : "w-layout-rail"}>
      <Related {...args}>{args.layout === "cards" ? systemCards : findings}</Related>
    </Box>
  ),
};

function RecordPreview() {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("None");
  const cardLink = useRef<HTMLAnchorElement>(null);
  const historyLink = useRef<HTMLAnchorElement>(null);
  const fullRecordLink = useRef<HTMLAnchorElement>(null);
  return (
    <Stack space="space.200">
      <Related title="Linked systems" layout="cards">
        <Related.Card
          title="Telemetry gateway"
          meta="Component · Ground segment"
          link={
            <a
              id="related-gateway"
              ref={cardLink}
              href="#gateway"
              data-record="gateway"
              onClick={(event) => {
                event.preventDefault();
                setDestination("Gateway");
              }}
            />
          }
          actions={
            <Button size="small" onClick={() => setOpen(true)}>
              Preview gateway
            </Button>
          }
        />
      </Related>
      <Button onClick={() => cardLink.current?.focus()}>Focus record link</Button>
      <Text>Last navigation: {destination}</Text>
      <PreviewSheet
        open={open}
        onClose={() => setOpen(false)}
        id="CMP-0113"
        title="Telemetry gateway"
        subtitle="Component history and details"
        openTo={
          <a
            id="preview-gateway"
            ref={fullRecordLink}
            href="#gateway"
            onClick={(event) => {
              event.preventDefault();
              setDestination("Full record");
            }}
          />
        }
        actions={
          <Button onClick={() => fullRecordLink.current?.focus()}>Focus full record link</Button>
        }
      >
        <Timeline label="Recent activity">
          <Timeline.Item
            title="Assessment completed"
            time="Today"
            link={
              <a
                id="gateway-assessment"
                ref={historyLink}
                href="#assessment"
                onClick={(event) => {
                  event.preventDefault();
                  setDestination("Assessment");
                }}
              >
                View assessment result
              </a>
            }
          />
        </Timeline>
        <Button onClick={() => historyLink.current?.focus()}>Focus history link</Button>
      </PreviewSheet>
    </Stack>
  );
}

/** A card's preview action stays separate from navigation; the sheet composes history and a full-record link. */
export const RecordNavigation: Story = {
  render: () => <RecordPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const link = canvas.getByRole("link", { name: "Telemetry gateway" });
    await expect(link).toHaveAttribute("id", "related-gateway");
    await expect(link).toHaveAttribute("data-record", "gateway");
    await expect(link).toHaveAttribute("href", "#gateway");
    await userEvent.click(canvas.getByRole("button", { name: "Focus record link" }));
    await expect(link).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByText("Last navigation: None")).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Last navigation: Gateway")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Preview gateway" }));
    const dialog = await page.findByRole("dialog", { name: "Telemetry gateway" });
    await expect(canvas.getByText("Last navigation: Gateway")).toBeVisible();
    const preview = within(dialog);
    const fullRecord = preview.getByRole("link", { name: "Open the full record" });
    await expect(fullRecord).toHaveAttribute("id", "preview-gateway");
    await userEvent.click(preview.getByRole("button", { name: "Focus full record link" }));
    await expect(fullRecord).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Last navigation: Full record")).toBeVisible();
    const history = preview.getByRole("link", { name: "View assessment result" });
    await expect(history).toHaveAttribute("id", "gateway-assessment");
    await userEvent.click(preview.getByRole("button", { name: "Focus history link" }));
    await expect(history).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Last navigation: Assessment")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Preview gateway" })).toHaveFocus();
  },
};
