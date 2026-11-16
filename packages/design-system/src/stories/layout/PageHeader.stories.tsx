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
  getModifierKey,
  HeadingLevelProvider,
  IconButton,
  PageHeader,
  PageHeaderLead,
  PageHeaderSlot,
  PageHeaderStanding,
  PageHeaderTitle,
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
  subcomponents: { PageHeaderTitle, PageHeaderLead, PageHeaderSlot, PageHeaderStanding },
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

/** A register's header is its name, and a record's is its trail, its name and its actions: the create action is the toolbar's, and the record's facts are labelled properties in its Details. */
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
                </PageHeader.Heading>
                <PageHeader.Actions>
                  <Button variant="primary">Edit requirement</Button>
                </PageHeader.Actions>
              </PageHeader>
            </div>
          }
          doText="The trail with the code, the name and one primary. Status, owner and due are labelled properties in the Details rail."
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
          dontText="The code in the name, the status, owner and due in the header and two buttons. The facts lose their labels, and the row wraps on a phone."
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
    // The record's header holds the trail, the name and one action, and none of its facts.
    const record = header("record-do");
    await expect(within(record).getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
    await expect(within(record).getAllByRole("button")).toHaveLength(1);
    await expect(record.querySelector('[data-slot="badge"]')).toBeNull();
    await expect(record.querySelector('[data-slot="page-header-description"]')).toBeNull();
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

/**
 * On an Overview the standing is the headline: one line under the name and the slot, in the
 * display size, of two beats at most. A count reads its figure and what it counts, with what it is
 * out of in the subtle weight; a beat that is a judgement takes its tone. The name stays the h1 and
 * the standing is not a heading. Where the line has the room the beats share it.
 */
export const Standing: Story = {
  name: "Standing headline",
  render: () => (
    <PageHeader>
      <PageHeader.Lead render={<Breadcrumb />}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#components">Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mission Computer</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageHeader.Lead>
      <PageHeader.Heading>
        <PageHeader.Title>Mission Computer</PageHeader.Title>
      </PageHeader.Heading>
      <PageHeader.Slot
        advance={{
          label: "Review offer",
          reason: "1 offer waiting",
          detail: "CVE-2024-6387 from WS-X90",
          onAction: advanced,
        }}
      />
      <PageHeader.Standing
        beats={[
          { value: 42, total: 61, label: "satisfied" },
          { value: 2, label: "to review", tone: "warning" },
        ]}
      />
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The name is the one heading; the standing is not one.
    await expect(canvas.getAllByRole("heading")).toHaveLength(1);
    const title = canvas.getByRole("heading", { level: 1, name: "Mission Computer" });
    const standing = canvasElement.querySelector<HTMLElement>(
      '[data-slot="page-header-standing"]',
    )!;
    const beats = [
      ...standing.querySelectorAll<HTMLElement>('[data-slot="page-header-standing-beat"]'),
    ];
    await expect(beats).toHaveLength(2);
    await expect(beats[0]).toHaveTextContent("42 of 61 satisfied");
    await expect(beats[1]).toHaveTextContent("2 to review");
    await expect(beats[1]).toHaveAttribute("data-tone", "warning");
    for (const beat of beats) await expect(getComputedStyle(beat).fontSize).toBe("32px");
    // The total is in the subtle weight; the figure keeps the beat's.
    const of = beats[0]!.querySelector("span")!;
    await expect(of).toHaveTextContent("of 61");
    await expect(Number(getComputedStyle(of).fontWeight)).toBeLessThan(
      Number(getComputedStyle(beats[0]!).fontWeight),
    );
    // Under the name and the slot, across the header.
    const slot = canvasElement.querySelector('[data-slot="page-header-slot"]')!;
    await expect(standing.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      Math.max(title.getBoundingClientRect().bottom, slot.getBoundingClientRect().bottom) - 0.5,
    );
    // Two beats share the line where it has the room (32rem), and take a line each where it does not.
    const [first, second] = beats.map((beat) => beat.getBoundingClientRect());
    if (standing.getBoundingClientRect().width >= 512)
      await expect(Math.round(second!.top)).toBe(Math.round(first!.top));
    else await expect(second!.top).toBeGreaterThanOrEqual(first!.bottom - 0.5);
    for (const beat of beats)
      await expect(beat.scrollWidth).toBeLessThanOrEqual(beat.clientWidth + 1);
  },
};

/**
 * On a phone the standing gives each beat its line, from its own width, never the window's: two
 * beats of words, the judgement in its tone, under the name with the slot's act on the row below.
 */
export const StandingOnAPhone: Story = {
  name: "Standing headline on a phone",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => (
    <PageHeader>
      <PageHeader.Heading>
        <PageHeader.Title>WS-X90 Sentinel Mission System</PageHeader.Title>
      </PageHeader.Heading>
      <PageHeader.Slot
        advance={{
          label: "Add security outcomes",
          reason: "PDR cannot be decided",
          detail: "no criteria recorded",
          onAction: advanced,
        }}
      />
      <PageHeader.Standing
        beats={[{ value: "ATO with conditions." }, { value: "PDR 35d late.", tone: "danger" }]}
      />
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const canvas = within(canvasElement);
    const title = canvas.getByRole("heading", { level: 1 }).getBoundingClientRect();
    const act = canvas
      .getByRole("button", { name: "Add security outcomes" })
      .getBoundingClientRect();
    await expect(act.top).toBeGreaterThanOrEqual(title.bottom);
    const beats = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="page-header-standing-beat"]'),
    ];
    await expect(beats).toHaveLength(2);
    await expect(beats[1]).toHaveAttribute("data-tone", "danger");
    // One beat a line, each inside the phone.
    const [first, second] = beats.map((beat) => beat.getBoundingClientRect());
    await expect(second!.top).toBeGreaterThanOrEqual(first!.bottom - 0.5);
    await expect(Math.round(second!.left)).toBe(Math.round(first!.left));
    for (const beat of beats) {
      await expect(beat.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
      await expect(beat.scrollWidth).toBeLessThanOrEqual(beat.clientWidth + 1);
    }
  },
};
