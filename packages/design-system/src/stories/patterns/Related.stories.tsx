import { type Meta, type StoryObj } from "@storybook/react-vite";
import { ExternalLink, MoreHorizontal, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LedgerProvider, PreviewSheet, Related } from "../..";
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
import { Box, HeadingLevelProvider, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

/** A real pointer over the element, so CSS `:hover` applies in the browser tests; Storybook itself only dispatches the events. */
async function nativeHover(target: HTMLElement) {
  if (import.meta.env.MODE === "test" && "__vitest_browser__" in globalThis) {
    const browser = await import("vitest/browser");
    await browser.page.elementLocator(target).hover();
    return true;
  }
  await userEvent.hover(target);
  return false;
}

/** Whether the story runs where hover reveals the card actions: a fine pointer that hovers, and no coarse one. */
const revealsOnHover = () =>
  matchMedia("(hover: hover)").matches && !matchMedia("(any-pointer: coarse)").matches;

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
          <Box className="w-layout-rail max-w-full">
            <Related title="Risks" action={addAction} />
          </Box>
        }
        doText="Nothing linked is an empty state: the mark, a statement, and the way to add one in the header."
        dont={
          <Box className="w-layout-rail max-w-full">
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
          <Box className="w-layout-rail max-w-full">
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
          <Box className="w-layout-rail max-w-full">
            <Related title="Linked findings" count={14}>
              {many}
            </Related>
          </Box>
        }
        dontText="Fourteen rows in a rail card. It is longer than the page beside it, and nothing sorts it."
      />
      <Pair
        do={
          <Box className="w-layout-rail max-w-full">
            <Related title="Linked findings" count={2}>
              {findings}
            </Related>
          </Box>
        }
        doText="A noun for the title; an id, a name and the state at the end, per row."
        dont={
          <Box className="w-layout-rail max-w-full">
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
    // The card's title link takes a 24px hit area on a touch screen.
    await expect(link).toHaveClass("touch-target");
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

/** The card's title is a heading at the contextual level and names its list: an h3 when nothing sets one, an h2 in a page's rail that starts its outline at 2. A Related.Card paints the raised surface and records it as the current one, as Card does, so a child that matches its surface (`bg-surface-current`) paints the card's colour, not the page's. */
export const HeadingLevelAndSurface: Story = {
  name: "Heading level and surface",
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Stack space="space.300">
        <Related title="Linked findings" count={1}>
          <Item title="Stale administrator accounts" link={<a href="#finding-12" />} />
        </Related>
        <HeadingLevelProvider level={2}>
          <Related title="Systems" count={1} layout="cards">
            <Related.Card
              title="Telemetry gateway"
              link={<a href="#gateway" />}
              meta="Subsystem · Ground segment"
            >
              <span
                data-testid="surface-match"
                className="block rounded-small bg-surface-current p-050"
              >
                Matches the card
              </span>
            </Related.Card>
          </Related>
        </HeadingLevelProvider>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Linked findings" }).tagName).toBe("H3");
    await expect(canvas.getByRole("heading", { name: "Systems" }).tagName).toBe("H2");
    await expect(canvas.getByRole("list", { name: "Systems" })).toBeVisible();
    const card = canvas.getByRole("link", { name: "Telemetry gateway" }).closest("li")!;
    const match = canvas.getByTestId("surface-match");
    await expect(getComputedStyle(match).backgroundColor).toBe(
      getComputedStyle(card).backgroundColor,
    );
  },
};

/** A card's actions stay shown while their own menu is open, after the pointer has left and focus has moved into the menu, and hovering one card shows its actions alone. */
export const ActionsWhileAMenuIsOpen: Story = {
  name: "Actions while a menu is open",
  render: () => (
    <Stack space="space.300">
      <Text as="p" size="small" data-testid="away">
        Two linked systems.
      </Text>
      <Related title="Systems" count={2} layout="cards">
        {systemCards.slice(0, 2)}
      </Related>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "More for Ground segment" });
    const actions = trigger.parentElement!;
    const otherActions = canvas.getByRole("button", {
      name: "More for Telemetry gateway",
    }).parentElement!;
    const hovers = await nativeHover(canvas.getByRole("link", { name: "Ground segment" }));
    if (hovers && revealsOnHover()) {
      await waitFor(() => expect(getComputedStyle(actions).opacity).toBe("1"));
      // The other card is not hovered, so its actions stay hidden.
      await expect(getComputedStyle(otherActions).opacity).toBe("0");
    }
    // The pointer leaves the card, then the keyboard opens the menu, which takes focus: neither
    // hover nor focus is in the card, so only the open menu keeps the actions shown.
    await nativeHover(canvas.getByTestId("away"));
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await page.findByRole("menu");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(actions.contains(document.activeElement)).toBe(false));
    await waitFor(() => expect(getComputedStyle(actions).opacity).toBe("1"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/** Nothing linked is the compact Empty. Its default title is the locale's `relatedEmpty`, so a provider translates it; lists fed from several sources that are all empty, arrays, `false` and fragments alike, count as nothing linked. */
export const NothingLinked: Story = {
  name: "Nothing linked",
  render: () => {
    const findingsFrom: string[] = [];
    const risksFrom: string[] = [];
    return (
      <Inline space="space.300" alignBlock="start" shouldWrap>
        <Box className="w-layout-rail max-w-full">
          <Related title="Linked findings" action={addAction}>
            {findingsFrom.map((f) => (
              <Item key={f} title={f} />
            ))}
            {risksFrom.length > 0 && risksFrom.map((r) => <Item key={r} title={r} />)}
            <>
              {risksFrom.map((r) => (
                <Item key={r} title={r} />
              ))}
            </>
          </Related>
        </Box>
        <LedgerProvider locale="de-DE" messages={germanMessages}>
          <Box className="w-layout-rail max-w-full">
            <Related title="Verknüpfte Befunde" />
          </Box>
        </LedgerProvider>
      </Inline>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Nothing linked yet")).toBeInTheDocument();
    await expect(canvas.queryByRole("list", { name: "Linked findings" })).toBeNull();
    await expect(canvas.getByText("Noch nichts verknüpft")).toBeInTheDocument();
  },
};

const germanMessages = { relatedEmpty: "Noch nichts verknüpft" };

/** Long names in a rail and on a page: the heading wraps; a row's or a card's name that is cut shows in full on hover and on keyboard focus of its link. A flush row's focus ring is drawn inside the card's edge, so the card's clipping cannot cut its sides. */
export const LongNames: Story = {
  name: "Long names",
  render: () => (
    <Stack space="space.300">
      <Box className="w-layout-rail max-w-full">
        <Related title="Findings linked to the ground segment boundary" count={2}>
          {findings}
        </Related>
      </Box>
      <Box style={{ width: 300, maxWidth: "100%" }}>
        <Related title="Systems" count={1} layout="cards">
          <Related.Card
            title="Telemetry gateway and mission control ground network"
            link={<a href="#gateway" />}
            meta="Component · Ground segment / Mission control / Operations"
          />
        </Related>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole("heading", {
      name: "Findings linked to the ground segment boundary",
    });
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth + 1);
    const revealed = () =>
      waitFor(() => {
        const popup = document.querySelector<HTMLElement>('[data-slot="truncate-full-text"]');
        expect(popup).not.toBeNull();
        return popup!;
      });
    const gone = () =>
      waitFor(() => expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull());
    // A flush row: its ring is inside the card, and a cut name reveals on keyboard focus.
    await userEvent.tab();
    const row = canvas.getByRole("link", {
      name: "Router management plane accepts unencrypted telnet",
    });
    await expect(row).toHaveFocus();
    await expect(parseFloat(getComputedStyle(row, "::after").outlineOffset)).toBeLessThan(0);
    await expect(await revealed()).toHaveTextContent(
      "Router management plane accepts unencrypted telnet",
    );
    // A card's name.
    const card = canvas.getByRole("link", {
      name: "Telemetry gateway and mission control ground network",
    });
    while (document.activeElement !== card) await userEvent.tab();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toHaveTextContent(
        "Telemetry gateway and mission control ground network",
      ),
    );
    await userEvent.tab();
    await gone();
  },
};
