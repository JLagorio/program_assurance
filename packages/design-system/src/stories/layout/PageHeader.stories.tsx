import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  Fact,
  getModifierKey,
  HeadingLevelProvider,
  IconButton,
  PageHeader,
  PageHeaderFacts,
  PageHeaderLead,
  PageHeaderSlot,
  PageHeaderStanding,
  PageHeaderTitle,
  type PageHeaderStandingDate,
  Section,
  Stack,
  Toolbar,
} from "../..";
import * as pairLayout from "../_lib/pair";
import * as typeStyle from "../_lib/type-style";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { typeOf, ramp } = typeStyle;
const { Pair } = pairLayout;

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  subcomponents: {
    PageHeaderTitle,
    PageHeaderLead,
    PageHeaderSlot,
    PageHeaderFacts,
    PageHeaderStanding,
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The header in its own frame: a `div` stamped `page-header`, never a landmark. */
const headerOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="page-header"]')!;

/** A register's header is its name and nothing else: the create action is the toolbar's primary, and no sentence sits under the title. */
export const Collection: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Heading>
        <PageHeader.Title>Findings</PageHeader.Title>
      </PageHeader.Heading>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = headerOf(canvasElement);
    await expect(header.tagName).toBe("DIV");
    await expect(canvas.queryByRole("banner")).toBeNull();
    await expect(canvas.getByRole("heading", { level: 1, name: "Findings" })).toBeVisible();
    await expect(header.querySelector('[data-slot="page-header-description"]')).toBeNull();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/** A record: the trail is the Lead, across both columns, with the code as its last level; the name is the Title; one Actions menu sits at the end of the title's row, a default-size Button with a trailing chevron, whose destination (Inspect record, last) is a link item. */
export const Record: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Lead render={<Breadcrumb />}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#requirements">Requirements</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>REQ-104</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageHeader.Lead>
      <PageHeader.Heading>
        <PageHeader.Title>
          Review privileged access across the platform and supporting services
        </PageHeader.Title>
      </PageHeader.Heading>
      <PageHeader.Actions>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />} />}>
            Actions
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Request changes</DropdownMenuItem>
            <DropdownMenuItem>Approve</DropdownMenuItem>
            <DropdownMenuLinkItem href="#schema/requirements/req-104">
              Inspect record
            </DropdownMenuLinkItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader.Actions>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("banner")).toBeNull();
    const header = headerOf(canvasElement).getBoundingClientRect();
    const lead = canvas.getByRole("navigation", { name: "Breadcrumb" }).getBoundingClientRect();
    const heading = canvas.getByRole("heading", { level: 1 });
    // The page and record title is Heading's `page` size: 24/30 semibold, an h1.
    await expect(typeOf(heading)).toEqual({ tag: "H1", ...ramp.page });
    const title = heading.getBoundingClientRect();
    const action = canvas.getByRole("button", { name: "Actions" }).getBoundingClientRect();
    await expect(Math.round(lead.right)).toBe(Math.round(header.right));
    await expect(Math.round(title.left)).toBe(Math.round(lead.left));
    await expect(title.top).toBeGreaterThanOrEqual(lead.bottom);
    // Beside the title while the row holds its measure, else on the next row at the end.
    if (action.top >= title.bottom)
      await expect(Math.round(action.right)).toBe(Math.round(header.right));
    else await expect(action.left).toBeGreaterThan(title.right);
  },
};

/** Outside the register and record shapes, a page that needs one line of orientation (a settings page, a setup step) puts it in Description, under the title. A register or a record page has none: a code belongs in the trail, and counts and states in the page's properties. */
export const WithDescription: Story = {
  name: "With a description",
  render: () => (
    <PageHeader>
      <PageHeader.Heading>
        <PageHeader.Title>Notification settings</PageHeader.Title>
        <PageHeader.Description>
          Choose which changes to your records send you an email.
        </PageHeader.Description>
      </PageHeader.Heading>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const title = within(canvasElement).getByRole("heading", { level: 1 });
    const description = canvasElement.querySelector('[data-slot="page-header-description"]')!;
    await expect(description.tagName).toBe("P");
    await expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      title.getBoundingClientRect().bottom,
    );
  },
};

/** A long title wraps beside a small action, as in a preview's inner header, including in a 320px frame. */
export const Constrained: Story = {
  render: () => (
    <div style={{ width: 320, maxWidth: "100%" }}>
      <PageHeader>
        <PageHeader.Title>
          Executable firmware shall be cryptographically authenticated before execution.
        </PageHeader.Title>
        <PageHeader.Actions>
          <Button size="small">Actions</Button>
        </PageHeader.Actions>
      </PageHeader>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole("heading").getBoundingClientRect();
    const action = canvas.getByRole("button", { name: "Actions" }).getBoundingClientRect();
    await expect(action.top).toBe(title.top);
    await expect(action.left).toBeGreaterThan(title.right);
    await expect(action.right).toBeLessThanOrEqual(canvasElement.getBoundingClientRect().right);
  },
};

/** A full-label primary beside a long title on a phone: the actions take the next row, right-aligned, and the title keeps its measure instead of breaking a word a line. */
export const Stacked: Story = {
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => (
    <PageHeader>
      <PageHeader.Lead render={<Breadcrumb />}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#campaigns">Assessment campaigns</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>CMP-12</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageHeader.Lead>
      <PageHeader.Heading>
        <PageHeader.Title>WS-X90 Expanded Control Set Assessment</PageHeader.Title>
      </PageHeader.Heading>
      <PageHeader.Actions>
        <Button variant="primary">Edit assessment campaign</Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const header = headerOf(canvasElement).getBoundingClientRect();
    const title = canvas.getByRole("heading", { level: 1 }).getBoundingClientRect();
    const action = canvas
      .getByRole("button", { name: "Edit assessment campaign" })
      .getBoundingClientRect();
    await expect(action.top).toBeGreaterThanOrEqual(title.bottom);
    await expect(Math.round(action.right)).toBe(Math.round(header.right));
    await expect(title.width).toBeGreaterThan(200);
    await expect(action.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** The same Title at three levels. On a page it is the h1. In a preview or a panel body, which starts its outline at 2, it takes that level from the context, beside one small primary and a subtle overflow, and the content after it goes one below through a HeadingLevelProvider. `render` sets the element outright, for a surface with its own title part. The type style is the same in all three, so a preview never copies the Title's classes onto a raw heading, and no header is a banner landmark. */
export const TitleLevels: Story = {
  name: "Title levels",
  render: () => (
    <div className="flex flex-col gap-400">
      <PageHeader>
        <PageHeader.Title>Access review</PageHeader.Title>
      </PageHeader>
      <HeadingLevelProvider level={2}>
        <aside aria-label="Preview" className="flex flex-col gap-200">
          <PageHeader>
            <PageHeader.Title>Quarterly access review evidence</PageHeader.Title>
            <PageHeader.Actions>
              <Button size="small" variant="primary">
                Edit artifact
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <IconButton
                      label="More artifact actions"
                      icon={<MoreHorizontal />}
                      size="small"
                      variant="subtle"
                    />
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Replace file</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PageHeader.Actions>
          </PageHeader>
          <HeadingLevelProvider>
            <Section title="Versions">Three versions recorded.</Section>
          </HeadingLevelProvider>
        </aside>
      </HeadingLevelProvider>
      <div role="dialog" aria-label="Version review">
        <PageHeader>
          <PageHeader.Title render={<h2 />}>Recovery exercise evidence</PageHeader.Title>
        </PageHeader>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = canvas.getByRole("heading", { name: "Access review" });
    const preview = canvas.getByRole("heading", { name: "Quarterly access review evidence" });
    const rendered = canvas.getByRole("heading", { name: "Recovery exercise evidence" });
    await expect(page.tagName).toBe("H1");
    await expect(preview.tagName).toBe("H2");
    await expect(rendered.tagName).toBe("H2");
    await expect(canvas.getByRole("heading", { name: "Versions" }).tagName).toBe("H3");
    for (const title of [preview, rendered]) {
      await expect(title).toHaveAttribute("data-slot", "page-header-title");
      await expect(title.className).toBe(page.className);
    }
    // A header inside a dialog (a portalled PreviewSheet) is not a second banner.
    await expect(canvas.queryByRole("banner")).toBeNull();
    const dialog = canvas.getByRole("dialog", { name: "Version review" });
    await expect(dialog.querySelector('[data-slot="page-header"]')?.tagName).toBe("DIV");
  },
};

/** A register's header is its name, and a record's is its trail, its name, its facts line and its actions: the create action is the toolbar's, and the record's other facts are labelled properties in its Details. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <HeadingLevelProvider level={2}>
      <Stack space="space.400">
        <Pair
          do={
            <Stack space="space.200" data-testid="register-do">
              <PageHeader>
                <PageHeader.Heading>
                  <PageHeader.Title>Risks</PageHeader.Title>
                </PageHeader.Heading>
              </PageHeader>
              <Toolbar
                search=""
                onSearch={() => {}}
                placeholder="Find risks"
                actions={
                  <Button size="small" variant="primary">
                    Create risk
                  </Button>
                }
              />
            </Stack>
          }
          doText="The register's name alone; Create risk is the toolbar's small primary, beside the search and the filters it creates into."
          dont={
            <Stack space="space.200" data-testid="register-dont">
              <PageHeader>
                <PageHeader.Heading>
                  <PageHeader.Title>Risks</PageHeader.Title>
                </PageHeader.Heading>
                <PageHeader.Actions>
                  <Button variant="primary">Create risk</Button>
                </PageHeader.Actions>
              </PageHeader>
            </Stack>
          }
          dontText="Create risk in the page header. It sits away from the table it adds to, and a second primary arrives with the toolbar."
        />
        <Pair
          do={
            <div data-testid="record-do">
              <PageHeader>
                <PageHeader.Lead render={<Breadcrumb />}>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#requirements">Requirements</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>REQ-104</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </PageHeader.Lead>
                <PageHeader.Heading>
                  <PageHeader.Title>Review privileged access</PageHeader.Title>
                  <PageHeader.Facts>
                    <PageHeader.Standing label="State" status="Approved" tone="success" />
                    <Fact label="Owner">Dana Whitfield</Fact>
                  </PageHeader.Facts>
                </PageHeader.Heading>
                <PageHeader.Actions>
                  <Button variant="primary">Edit requirement</Button>
                </PageHeader.Actions>
              </PageHeader>
            </div>
          }
          doText="The trail with the code, the name and one primary; under the name, the facts line: the standing and the few facts the reader acts on, each labelled. The rest are properties in the Details rail."
          dont={
            <div data-testid="record-dont">
              <PageHeader>
                <PageHeader.Heading>
                  <PageHeader.Title>REQ-104 Review privileged access</PageHeader.Title>
                  <PageHeader.Description>
                    Owner Dana Whitfield · Due 30 Sept 2026
                  </PageHeader.Description>
                </PageHeader.Heading>
                <PageHeader.Actions>
                  <Badge variant="secondary" tone="success">
                    Approved
                  </Badge>
                  <Button>Request changes</Button>
                  <Button variant="primary">Edit requirement</Button>
                </PageHeader.Actions>
              </PageHeader>
            </div>
          }
          dontText="The code in the name, owner and due as a sentence, the status as a badge among the actions and two buttons. The facts lose their labels, and the row wraps on a phone."
        />
      </Stack>
    </HeadingLevelProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = (id: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>('[data-slot="page-header"]')!;
    const create = (id: string) =>
      within(canvas.getByTestId(id)).getByRole("button", { name: "Create risk" });
    // The register's create action sits in its toolbar, not in the header.
    await expect(header("register-do")).not.toContainElement(create("register-do"));
    await expect(header("register-dont")).toContainElement(create("register-dont"));
    // The record's header holds the trail, the name, its facts line and one action: its facts
    // labelled terms of a list, never a sentence or a badge among the actions.
    const record = header("record-do");
    await expect(within(record).getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
    await expect(within(record).getAllByRole("button")).toHaveLength(1);
    await expect(record.querySelector('[data-slot="badge"]')).toBeNull();
    await expect(record.querySelector('[data-slot="page-header-description"]')).toBeNull();
    await expect(record.querySelectorAll('[data-slot="page-header-facts"] dt')).toHaveLength(2);
    const crowded = header("record-dont");
    await expect(crowded.querySelector('[data-slot="badge"]')).not.toBeNull();
    await expect(within(crowded).getAllByRole("button")).toHaveLength(2);
  },
};

const advanced = fn();
const signed = fn();
const reminded = fn();
/** Eight days before the story opens, so the wait reads "8d ago" whenever it runs. */
const eightDaysAgo = Date.now() - 8 * 86_400_000;

/** The slot of each header in the Action slot story. */
const slotOf = (header: HTMLElement) =>
  header.querySelector<HTMLElement>('[data-slot="page-header-slot"]')!;

/** The slot sits beside the title while the row holds its measure, else on the next row at the end. */
async function expectSlotPlaced(header: HTMLElement) {
  const box = header.querySelector('[data-slot="page-header"]')!.getBoundingClientRect();
  const title = within(header).getByRole("heading").getBoundingClientRect();
  const slot = slotOf(header).getBoundingClientRect();
  if (slot.top >= title.bottom) await expect(Math.round(slot.right)).toBe(Math.round(box.right));
  else await expect(slot.left).toBeGreaterThan(title.right);
  await expect(slot.right).toBeLessThanOrEqual(box.right + 0.5);
}

/**
 * A record's header ends in one slot, in one of four forms and no others. Advance: the reader's own
 * next step, a 36px primary, with why it is next before it, which is its description. Sign: a
 * signature the reader owes, said as the capacity they sign in and a sign Button, which
 * Command+Enter presses. Waiting: who the record waits on, since when, and Remind. None: only the
 * record's other commands. Each form is drawn by the slot, so nothing else fits in it.
 */
export const ActionSlot: Story = {
  name: "Action slot",
  render: () => (
    <HeadingLevelProvider level={2}>
      <Stack space="space.400">
        <div data-testid="advance">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>SI-2 Flaw Remediation</PageHeader.Title>
            </PageHeader.Heading>
            <PageHeader.Slot
              advance={{
                label: "Add evidence",
                reason: "REQ-064 cites none",
                detail: "the only requirement",
                onAction: advanced,
              }}
              more={{
                label: "More control actions",
                items: (
                  <>
                    <DropdownMenuItem>Map a requirement</DropdownMenuItem>
                    <DropdownMenuLinkItem href="#schema/controls/si-2">
                      Inspect record
                    </DropdownMenuLinkItem>
                  </>
                ),
              }}
            />
          </PageHeader>
        </div>
        <div data-testid="sign">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>Customer B security plan approval</PageHeader.Title>
            </PageHeader.Heading>
            <PageHeader.Slot
              sign={{
                label: "Approve security plan",
                signer: "R. Calloway",
                role: "authorizing official",
                onSign: signed,
              }}
            />
          </PageHeader>
        </div>
        <div data-testid="waiting">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>X800 Palletized Integration</PageHeader.Title>
            </PageHeader.Heading>
            <PageHeader.Slot
              waitingOn={{
                name: "R. Calloway",
                role: "authorizing official",
                since: eightDaysAgo,
                onRemind: reminded,
              }}
              more={{
                label: "More decision actions",
                items: <DropdownMenuItem>Withdraw request</DropdownMenuItem>,
              }}
            />
          </PageHeader>
        </div>
        <div data-testid="none">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>WS-X90 Sentinel Mission System</PageHeader.Title>
            </PageHeader.Heading>
            <PageHeader.Slot
              more={{
                label: "More program actions",
                items: <DropdownMenuItem>Edit program</DropdownMenuItem>,
              }}
            />
          </PageHeader>
        </div>
      </Stack>
    </HeadingLevelProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    advanced.mockClear();
    signed.mockClear();
    reminded.mockClear();
    const header = (form: string) => canvas.getByTestId(form);
    for (const [id, form] of [
      ["advance", "advance"],
      ["sign", "sign"],
      ["waiting", "waiting"],
      ["none", "none"],
    ] as const) {
      await expect(slotOf(header(id))).toHaveAttribute("data-form", form);
      await expectSlotPlaced(header(id));
    }

    // Advance: one 36px primary, described by why it is next, and the record's other commands.
    const advance = within(header("advance"));
    const act = advance.getByRole("button", { name: "Add evidence" });
    await expect(act).toHaveAttribute("data-button-variant", "primary");
    await expect(act.getBoundingClientRect().height).toBe(36);
    await expect(act).toHaveAccessibleDescription(/REQ-064 cites none.*the only requirement/);
    const more = advance.getByRole("button", { name: "More control actions" });
    await expect(more.getBoundingClientRect().height).toBe(36);
    // The record's other commands keep the act's line, at any width: never alone on the next.
    await expect(more.getBoundingClientRect().top).toBe(act.getBoundingClientRect().top);
    await expect(advance.getAllByRole("button")).toHaveLength(2);
    await userEvent.click(act);
    await expect(advanced).toHaveBeenCalledTimes(1);

    // Sign: the sign Button alone, described by the capacity the reader signs in.
    const sign = within(header("sign"));
    const signature = sign.getByRole("button", { name: "Approve security plan as R. Calloway" });
    await expect(signature).toHaveAttribute("data-button-variant", "sign");
    await expect(signature.getBoundingClientRect().height).toBe(36);
    await expect(signature).toHaveAccessibleDescription("Signing as authorizing official");
    await expect(sign.getAllByRole("button")).toHaveLength(1);
    // Command+Enter (Control+Enter elsewhere) signs from the page; a bare Enter does not.
    act.focus();
    await userEvent.keyboard("{Enter}");
    await expect(signed).not.toHaveBeenCalled();
    const mod = getModifierKey() === "meta" ? "Meta" : "Control";
    await userEvent.keyboard(`{${mod}>}{Enter}{/${mod}}`);
    await expect(signed).toHaveBeenCalledTimes(1);

    // Waiting: who and since when, then Remind, a 36px secondary described by the wait. No primary.
    const waiting = header("waiting");
    await expect(within(waiting).getByText("Waiting on R. Calloway")).toBeVisible();
    await expect(waiting.querySelector("time")).toHaveAttribute("datetime");
    const remind = within(waiting).getByRole("button", { name: "Remind" });
    await expect(remind).toHaveAttribute("data-button-variant", "secondary");
    await expect(remind.getBoundingClientRect().height).toBe(36);
    await expect(remind).toHaveAccessibleDescription(/Waiting on R\. Calloway/);
    await expect(waiting.querySelector('[data-button-variant="primary"]')).toBeNull();
    await userEvent.click(remind);
    await expect(reminded).toHaveBeenCalledTimes(1);

    // None: the record's other commands alone.
    const none = within(header("none")).getAllByRole("button");
    await expect(none).toHaveLength(1);
    await expect(none[0]).toHaveAccessibleName("More program actions");
  },
};

/** The story's today, noon on Nov 16, 2026 in the provider's zone (UTC), so the dates read alike on every run. */
const NOW = Date.parse("2026-11-16T12:00:00Z");

/** The facts line of the header a story draws: a `dl` under the title. */
const factsOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-slot="page-header-facts"]')!;
/** The facts in a facts line, a Fact or the standing each. */
const factsIn = (facts: HTMLElement) => [...facts.children] as HTMLElement[];

/**
 * Under the name, the facts line: a few labelled facts in the body size, one of them the record's
 * standing, its status in its tone and its most urgent date flagged as DateLabel flags one. The
 * name stays the h1 and the only heading; the standing's label is heard, not drawn, since its
 * words name it. Where the line has the room the facts share it.
 */
export const Facts: Story = {
  name: "Facts and standing",
  render: () => (
    <PageHeader>
      <PageHeader.Lead render={<Breadcrumb />}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>WS-X90</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageHeader.Lead>
      <PageHeader.Heading>
        <PageHeader.Title>WS-X90 Sentinel Mission System</PageHeader.Title>
        <PageHeader.Facts>
          <Fact label="Categorization">High · High · Moderate</Fact>
          <PageHeader.Standing
            label="Authorization"
            status="ATO with conditions"
            tone="warning"
            date={{ value: "2026-10-12", name: "PDR", now: NOW }}
          />
        </PageHeader.Facts>
      </PageHeader.Heading>
      <PageHeader.Actions>
        <Button variant="primary">Edit program</Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The name is the one heading; the facts line holds none.
    await expect(canvas.getAllByRole("heading")).toHaveLength(1);
    const title = canvas.getByRole("heading", { level: 1, name: "WS-X90 Sentinel Mission System" });
    const facts = factsOf(canvasElement);
    await expect(facts.tagName).toBe("DL");
    const [categorization, standing] = factsIn(facts);
    await expect(standing).toHaveAttribute("data-slot", "page-header-standing");
    // A definition list: each fact a term and its value. The standing's term is heard, not drawn.
    const term = standing!.querySelector("dt")!;
    await expect(term).toHaveTextContent("Authorization");
    await expect(term.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    const value = standing!.querySelector("dd")!;
    // The status in its tone, then the date in words: late, flagged by its icon and the danger tone.
    await expect(standing).toHaveAttribute("data-tone", "warning");
    await expect(
      value.querySelector('[data-slot="page-header-standing-status"]'),
    ).toHaveTextContent("ATO with conditions");
    const date = value.querySelector<HTMLElement>('[data-slot="page-header-standing-date"]')!;
    await expect(date).toHaveAttribute("data-state", "overdue");
    await expect(date.querySelector("svg")).toHaveAttribute("aria-hidden");
    await expect(date.querySelector('span[aria-hidden="true"]')).toHaveTextContent("PDR 35d late");
    // A screen reader hears the days in full.
    await expect(date).toHaveTextContent(/PDR 35 days late/);
    // Late is the danger tone, apart from the status's; forced colours keep the icon and words.
    if (!matchMedia("(forced-colors: active)").matches)
      await expect(getComputedStyle(date).color).not.toBe(
        getComputedStyle(value.querySelector('[data-slot="page-header-standing-status"]')!).color,
      );
    // The body size, as every fact's value is, never a headline.
    const factValue = categorization!.querySelector("dd")!;
    await expect(getComputedStyle(value).fontSize).toBe(getComputedStyle(factValue).fontSize);
    await expect(parseFloat(getComputedStyle(value).fontSize)).toBeLessThan(
      parseFloat(getComputedStyle(title).fontSize),
    );
    // Under the name, and on one line where the line has the room.
    await expect(facts.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      title.getBoundingClientRect().bottom - 0.5,
    );
    const line = facts.getBoundingClientRect().width;
    const needed =
      categorization!.getBoundingClientRect().width + standing!.getBoundingClientRect().width;
    if (line > needed + 32)
      await expect(Math.round(standing!.getBoundingClientRect().top)).toBe(
        Math.round(categorization!.getBoundingClientRect().top),
      );
  },
};

/**
 * On a phone the facts line wraps between facts, so each fact keeps its line whole: the standing
 * takes the line under the categorization, at the same start, and nothing scrolls sideways.
 */
export const FactsOnAPhone: Story = {
  name: "Facts on a phone",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => (
    <PageHeader>
      <PageHeader.Heading>
        <PageHeader.Title>WS-X90 Sentinel Mission System</PageHeader.Title>
        <PageHeader.Facts>
          <Fact label="Categorization">High · High · Moderate</Fact>
          <PageHeader.Standing
            label="Authorization"
            status="ATO with conditions"
            tone="warning"
            date={{ value: "2026-10-12", name: "PDR", now: NOW }}
          />
        </PageHeader.Facts>
      </PageHeader.Heading>
      <PageHeader.Actions>
        <Button variant="primary">Edit program</Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const page = document.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
    const [categorization, standing] = factsIn(factsOf(canvasElement)).map((fact) =>
      fact.getBoundingClientRect(),
    );
    // A fact a line, each whole and inside the phone, at one start.
    await expect(standing!.top).toBeGreaterThanOrEqual(categorization!.bottom - 0.5);
    await expect(Math.round(standing!.left)).toBe(Math.round(categorization!.left));
    for (const fact of factsIn(factsOf(canvasElement))) {
      await expect(fact.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
      await expect(fact.scrollWidth).toBeLessThanOrEqual(fact.clientWidth + 1);
    }
  },
};

/** Each facts line's standing, for the Standing dates story. */
const standingDates: {
  id: string;
  status: string;
  tone: "warning" | "information";
  date: PageHeaderStandingDate;
}[] = [
  {
    id: "late",
    status: "ATO with conditions",
    tone: "warning",
    date: { value: "2026-10-12", name: "PDR" },
  },
  {
    id: "today",
    status: "ATO with conditions",
    tone: "warning",
    date: { value: "2026-11-16", name: "CDR" },
  },
  {
    id: "soon",
    status: "ATO with conditions",
    tone: "warning",
    date: { value: "2026-11-18", name: "PDR" },
  },
  {
    id: "later",
    status: "ATO with conditions",
    tone: "warning",
    date: { value: "2026-12-04", name: "TRR" },
  },
  {
    id: "expiring",
    status: "ATO with conditions",
    tone: "warning",
    date: { value: "2027-01-15", kind: "expiry", soonWithin: 90 },
  },
  {
    id: "expires later",
    status: "ATO with conditions",
    tone: "warning",
    date: { value: "2029-09-17", kind: "expiry", soonWithin: 90 },
  },
  {
    id: "expired",
    status: "In review",
    tone: "information",
    date: { value: "2026-11-02", name: "Waiver", kind: "expiry" },
  },
];

/**
 * The standing's date, judged against the reader's today as DateLabel judges one: late in the
 * danger tone with its icon and how long ago ("PDR 35d late"), due today and due soon in the
 * warning tone with theirs, and a later day plainly. An expiry says expires and expired, and
 * `soonWithin` flags it a quarter ahead. Without a name the words follow the status. While the
 * standing is read a line holds its place; with no status it is Absent.
 */
export const StandingDates: Story = {
  name: "Standing dates",
  render: () => (
    <Stack space="space.150">
      {standingDates.map(({ id, status, tone, date }) => (
        <PageHeader.Facts key={id} data-testid={id}>
          <PageHeader.Standing
            label="Standing"
            status={status}
            tone={tone}
            date={{ ...date, now: NOW }}
          />
        </PageHeader.Facts>
      ))}
      <PageHeader.Facts data-testid="loading">
        <PageHeader.Standing label="Authorization" isLoading />
      </PageHeader.Facts>
      <PageHeader.Facts data-testid="absent">
        <PageHeader.Standing label="Authorization" />
      </PageHeader.Facts>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateOf = (id: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>('[data-slot="page-header-standing-date"]')!;
    // The words drawn: without the full date a DateTime keeps for its tooltip and description.
    const words = (id: string) => {
      const drawn = dateOf(id).cloneNode(true) as HTMLElement;
      for (const hidden of drawn.querySelectorAll("[hidden], [data-slot='visually-hidden']"))
        hidden.remove();
      return drawn.textContent?.replace(/\s+/g, " ").trim();
    };
    await expect(dateOf("late")).toHaveAttribute("data-state", "overdue");
    await expect(dateOf("today")).toHaveAttribute("data-state", "today");
    await expect(words("today")).toBe("CDR due today");
    await expect(dateOf("soon")).toHaveAttribute("data-state", "soon");
    await expect(words("soon")).toBe("PDR due Nov 18, 2026");
    await expect(dateOf("later")).toHaveAttribute("data-state", "upcoming");
    await expect(words("later")).toBe("TRR due Dec 4, 2026");
    // A later day is not flagged: no icon.
    await expect(dateOf("later").querySelector("svg")).toBeNull();
    for (const id of ["late", "today", "soon"])
      await expect(dateOf(id).querySelector("svg")).not.toBeNull();
    await expect(dateOf("expiring")).toHaveAttribute("data-state", "soon");
    await expect(words("expiring")).toBe("expires Jan 15, 2027");
    await expect(dateOf("expires later")).toHaveAttribute("data-state", "upcoming");
    await expect(dateOf("expired")).toHaveAttribute("data-state", "overdue");
    await expect(words("expired")).toBe("Waiver expired Nov 2, 2026");
    // The date is a time element, read in the reader's format.
    await expect(dateOf("soon").querySelector("time")).toHaveAttribute("datetime", "2026-11-18");
    // Loading holds the place and says so; no status is an Absent, heard as Not recorded.
    const loading = canvas.getByTestId("loading").querySelector("dd")!;
    await expect(loading).toHaveAttribute("aria-busy", "true");
    await expect(loading).toHaveTextContent("Loading");
    await expect(
      canvas.getByTestId("absent").querySelector('[data-slot="absent"]'),
    ).toHaveTextContent("Not recorded");
  },
};
