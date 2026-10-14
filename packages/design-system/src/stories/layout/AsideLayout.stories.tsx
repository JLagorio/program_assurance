import type { Meta, StoryObj } from "@storybook/react-vite";
import { Activity, createRef, useEffect, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { tokenValue } from "../..";
import {
  Badge,
  Button,
  KeyValue,
  Prose,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "../../components";
import { AsideLayout, PageHeader, Section, Shell } from "../../layout";
import { Editable, Inspector } from "../../patterns";
import { Stack, Text } from "../../primitives";
import { interact } from "../_lib/interact";

const meta = {
  title: "Layout/AsideLayout",
  component: AsideLayout,
  parameters: { layout: "padded" },
  args: {},
} satisfies Meta<typeof AsideLayout>;
export default meta;
type Story = StoryObj<typeof meta>;

const box = (el: Element) => el.getBoundingClientRect();
/** Whether the window is at least the large breakpoint, where the rail can show. */
const large = () =>
  window.matchMedia(`(width >= ${tokenValue("dimension.breakpoint.lg")})`).matches;
/** Whether the window is under 30rem tall, where the rail scrolls with the page. */
const short = () => window.matchMedia("(height < 30rem)").matches;
const layoutOf = (el: Element) => el.closest<HTMLElement>('[data-slot="aside-layout"]');

/**
 * A record without tabs: its Details beside everything under its header. Where the layout leaves
 * the body a list column beside it, the Details are the rail at the body's end, open, their groups
 * h2s; narrower (a phone, a 320px frame) they are a closed Details disclosure above the body, its
 * row carrying the status. They come first in the document at every width.
 */
export const Record: Story = {
  render: () => (
    <AsideLayout
      aside={
        <Shell.Aside
          label="Task details"
          summary={
            <Badge variant="secondary" tone="information">
              In progress
            </Badge>
          }
        >
          <Inspector.Group title="Details">
            <KeyValue label="Status">
              <Badge variant="secondary" tone="information">
                In progress
              </Badge>
            </KeyValue>
            <KeyValue label="Owner">Sarah Chen</KeyValue>
            <KeyValue label="Due">30 Sept 2026</KeyValue>
            <KeyValue label="Identifier">TSK-118</KeyValue>
          </Inspector.Group>
          <Inspector.Group title="Provenance" defaultOpen={false}>
            <KeyValue label="Created">12 Sept 2026</KeyValue>
            <KeyValue label="Created by">Dana Whitfield</KeyValue>
          </Inspector.Group>
        </Shell.Aside>
      }
    >
      <Stack space="space.300">
        <Section title="Description">
          <Prose>
            Review the privileged accounts on the payload ground segment and revoke every one that
            nobody owns.
          </Prose>
        </Section>
        <Section title="Acceptance criteria">
          <Prose>
            {"Every privileged account has a named owner.\nA revoked account cannot sign in."}
          </Prose>
        </Section>
      </Stack>
    </AsideLayout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const details = canvas.getByRole("region", { name: "Task details" });
    const description = canvas.getByRole("heading", { name: "Description" });
    // First in the document at every width.
    await expect(
      details.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    if (layoutOf(details)?.dataset["display"] === "rail") {
      // The rail at the body's end, open, its groups under the page's h1.
      await expect(box(details).left).toBeGreaterThanOrEqual(box(description).right);
      await expect(within(details).getByRole("heading", { name: "Details" }).tagName).toBe("H2");
      await expect(within(details).getByText("Sarah Chen")).toBeVisible();
      await expect(within(details).queryByRole("button", { name: /In progress$/ })).toBeNull();
    } else {
      // The disclosure above the body, closed, its row an h2's button carrying the status.
      const toggle = within(details).getByRole("button", { name: /^Details\s*In progress$/ });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle.closest("h2")).not.toBeNull();
      await expect(box(details).bottom).toBeLessThanOrEqual(box(description).top + 1);
    }
  },
};

/** A requirement's Details: its state, owner and identifiers, then its identity. */
function RequirementDetails() {
  return (
    <Shell.Aside
      label="Requirement details"
      summary={
        <Badge variant="secondary" tone="information">
          In progress
        </Badge>
      }
    >
      <Inspector.Group title="Details">
        <KeyValue label="Status">
          <Badge variant="secondary" tone="information">
            In progress
          </Badge>
        </KeyValue>
        <KeyValue label="Owner">
          <TextLink href="#people-alex-morgan">Alex Morgan</TextLink>
        </KeyValue>
        <KeyValue label="Identifier">REQ-104</KeyValue>
        <KeyValue label="Updated">12 Sept 2026</KeyValue>
      </Inspector.Group>
      <Inspector.Group title="Identity">
        <KeyValue label="Framework">NIST 800-53 r5, moderate</KeyValue>
        <KeyValue label="Control">AC-2</KeyValue>
      </Inspector.Group>
    </Shell.Aside>
  );
}

/** A tabbed record: the header and the strip across the page, the Details in Overview's panel. */
function TabbedRecordPage() {
  const [tab, setTab] = useState("overview");
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Review privileged access</PageHeader.Title>
        </PageHeader.Heading>
        <PageHeader.Actions>
          <Button>Actions</Button>
        </PageHeader.Actions>
      </PageHeader>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" aria-label="Requirement sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <AsideLayout aside={<RequirementDetails />}>
            <Stack space="space.300">
              <Section title="Statement">
                <Prose>
                  Privileged access to the platform and its supporting services is reviewed every
                  quarter, and access that is no longer needed is revoked within five working days.
                </Prose>
              </Section>
              <Section title="Acceptance criteria" count={2}>
                <Prose>
                  {"Every privileged account has a named owner.\nA revoked account cannot sign in."}
                </Prose>
              </Section>
            </Stack>
          </AsideLayout>
        </TabsContent>
        <TabsContent value="evidence">
          <Text color="color.text.subtle">The evidence register, across the work area.</Text>
        </TabsContent>
      </Tabs>
    </Stack>
  );
}

/**
 * On a tabbed record the Details belong to the Overview tab: they start under the tab strip, beside
 * Overview's body, and leave with the tab. The header and the strip span the page on every tab, so
 * choosing another tab moves neither the strip's end nor the header's actions.
 */
export const TabbedRecord: Story = {
  name: "On a tabbed record",
  render: () => <TabbedRecordPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tablist = canvas.getByRole("tablist", { name: "Requirement sections" });
    const actions = canvas.getByRole("button", { name: "Actions" });
    const details = canvas.getByRole("region", { name: "Requirement details" });
    // In Overview's panel, under the strip, at every width.
    await expect(canvas.getByRole("tabpanel", { name: "Overview" })).toContainElement(details);
    await expect(box(details).top).toBeGreaterThanOrEqual(box(tablist).bottom - 1);
    if (layoutOf(details)?.dataset["display"] === "rail") {
      await expect(box(details).left).toBeGreaterThanOrEqual(
        box(canvas.getByRole("heading", { name: "Statement" })).right,
      );
      // The rail ends where the strip does.
      await expect(Math.abs(box(details).right - box(tablist).right)).toBeLessThanOrEqual(1);
    }
    // Another tab: no Details, and the strip and the header keep their width and place.
    const strip = box(tablist);
    const action = box(actions);
    await userEvent.click(canvas.getByRole("tab", { name: "Evidence" }));
    await waitFor(() =>
      expect(canvas.queryByRole("region", { name: "Requirement details" })).toBeNull(),
    );
    await expect(Math.abs(box(tablist).width - strip.width)).toBeLessThanOrEqual(1);
    await expect(Math.abs(box(actions).left - action.left)).toBeLessThanOrEqual(1);
    await userEvent.click(canvas.getByRole("tab", { name: "Overview" }));
    await expect(
      await canvas.findByRole("region", { name: "Requirement details" }),
    ).toBeInTheDocument();
  },
};

/**
 * On a phone the Details are a disclosure at the top of Overview: one row under the tab strip that
 * names them and carries the record's state, closed until the reader opens it, so the state is one
 * tap from the top and the sections keep their place. Its button is an h2's; the content sits one
 * level below, and the Details group it is named after is its content, with no second title.
 * Another tab has no Details, and the strip stays where it was.
 */
export const Phone: Story = {
  name: "At 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <TabbedRecordPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const details = await canvas.findByRole("region", { name: "Requirement details" });
    const tablist = canvas.getByRole("tablist", { name: "Requirement sections" });
    await expect(box(details).top).toBeGreaterThanOrEqual(box(tablist).bottom - 1);
    await expect(box(details).bottom).toBeLessThanOrEqual(
      box(canvas.getByRole("heading", { name: "Statement" })).top + 1,
    );
    // One row, closed, its button an h2's.
    const toggle = within(details).getByRole("button", { name: /^Details\s*In progress$/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle.closest("h2")).not.toBeNull();
    await expect(within(details).getByText("Alex Morgan").checkVisibility()).toBe(false);
    // A press opens it: the Details group's rows with no second title, then the other groups one
    // level below the disclosure, unfolding on the kit's motion.
    await expect(details).toHaveAttribute("data-instant");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(details).not.toHaveAttribute("data-instant");
    await waitFor(() => expect(within(details).getByText("Alex Morgan")).toBeVisible());
    await expect(within(details).queryByRole("heading", { name: "Details" })).toBeNull();
    await expect(within(details).getByRole("heading", { name: "Identity" }).tagName).toBe("H3");
    // The keyboard: Enter closes it and Space opens it again, focus staying on the button.
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveFocus();
    // Another tab has no Details, and the strip stays put.
    const stripTop = box(tablist).top;
    await userEvent.click(canvas.getByRole("tab", { name: "Evidence" }));
    await waitFor(() =>
      expect(canvas.queryByRole("region", { name: "Requirement details" })).toBeNull(),
    );
    await expect(Math.abs(box(tablist).top - stripTop)).toBeLessThanOrEqual(1);
  },
};

/**
 * A tabbed record in a frame whose width the story changes, as a panel opening or a resize does.
 * Overview's panel stays mounted while another tab shows, its effects paused, as a retained tab
 * panel's are.
 */
function ResizableRecord() {
  const [nextAction, setNextAction] = useState("Ask the account owners");
  const [tab, setTab] = useState("overview");
  return (
    <div data-testid="frame" className="max-w-full" style={{ maxWidth: 1000 }}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" aria-label="Requirement sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" keepMounted>
          <Activity mode={tab === "overview" ? "visible" : "hidden"}>
            <AsideLayout
              aside={
                <Shell.Aside
                  label="Requirement details"
                  summary={
                    <Badge variant="secondary" tone="information">
                      In progress
                    </Badge>
                  }
                >
                  <Inspector.Group title="Details">
                    <KeyValue label="Owner">
                      <TextLink href="#people-alex-morgan">Alex Morgan</TextLink>
                    </KeyValue>
                    <KeyValue label="Next action">
                      <Editable.Text
                        label="Next action"
                        value={nextAction}
                        onValueChange={setNextAction}
                        save={async () => {}}
                      />
                    </KeyValue>
                  </Inspector.Group>
                  <Inspector.Group title="Identity">
                    <KeyValue label="Framework">NIST 800-53 r5, moderate</KeyValue>
                  </Inspector.Group>
                </Shell.Aside>
              }
            >
              <Section title="Statement">
                <Prose>
                  Privileged access is reviewed every quarter, and access that is no longer needed is
                  revoked within five working days.
                </Prose>
              </Section>
            </AsideLayout>
          </Activity>
        </TabsContent>
        <TabsContent value="evidence">
          <Text color="color.text.subtle">The evidence register, across the work area.</Text>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * The layout reads its own width, so whatever narrows it (an open panel, a wide side nav, a smaller
 * window) turns the rail into the disclosure, and widening it turns it back. The Details are the
 * same nodes in both and show as they are at once: nothing folds on the kit's motion unless the
 * reader toggles it. Focus on a control inside stays on it, the disclosure opening around it, and a
 * draft in an Editable keeps its field and its text. A control the change replaces (a group's
 * title, an h2 in the rail and an h3 in the disclosure) hands focus to the first control left, once:
 * coming back to the tab from another one leaves focus on the tab.
 */
export const DisplayChange: Story = {
  name: "A change of display",
  globals: { viewport: { value: "ledgerDesktop", isRotated: false } },
  render: () => <ResizableRecord />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");
    const details = canvas.getByRole("region", { name: "Requirement details" });
    const layout = layoutOf(details);
    // The change needs a window from the large breakpoint and room for the frame's wide width.
    if (!large() || !layout || box(frame.parentElement ?? frame).width < 700) {
      await expect(layout).toHaveAttribute("data-display", "disclosure");
      return;
    }
    const narrow = async () => {
      frame.style.maxWidth = "560px";
      await waitFor(() => expect(layout).toHaveAttribute("data-display", "disclosure"));
    };
    const wide = async () => {
      frame.style.maxWidth = "1000px";
      await waitFor(() => expect(layout).toHaveAttribute("data-display", "rail"));
    };
    await waitFor(() => expect(layout).toHaveAttribute("data-display", "rail"));
    const content = details.querySelector<HTMLElement>(
      ':scope > [data-slot="collapsible-content"]',
    );
    const framework = within(details).getByText("NIST 800-53 r5, moderate");
    // The same nodes, shown as they are at once: the disclosure is closed, and nothing folded.
    await narrow();
    await expect(within(details).getByText("NIST 800-53 r5, moderate")).toBe(framework);
    await expect(content?.getAnimations() ?? []).toHaveLength(0);
    await expect(framework.checkVisibility()).toBe(false);
    await wide();
    await expect(framework).toBeVisible();
    await expect(content?.getAnimations() ?? []).toHaveLength(0);
    // Focus on a control in the rail stays on it; the disclosure opens around it.
    const owner = within(details).getByRole("link", { name: "Alex Morgan" });
    owner.focus();
    await narrow();
    await expect(owner).toHaveFocus();
    await expect(owner).toBeVisible();
    await expect(
      within(details).getByRole("button", { name: /^Details\s*In progress$/ }),
    ).toHaveAttribute("aria-expanded", "true");
    await wide();
    await expect(owner).toHaveFocus();
    // A draft keeps its field and its text.
    await userEvent.click(within(details).getByRole("button", { name: /^Next action/ }));
    const field = await within(details).findByRole("textbox", { name: "Next action" });
    await userEvent.clear(field);
    await userEvent.type(field, "Call the vendor");
    await narrow();
    await expect(field).toHaveFocus();
    await expect(field).toHaveValue("Call the vendor");
    await wide();
    await expect(field).toHaveFocus();
    await expect(field).toHaveValue("Call the vendor");
    // Escape puts the old value back; the close settles in one act scope.
    await interact(() =>
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    // A control the change replaces hands focus to the first control left: the disclosure's row,
    // then the rail's first group.
    within(details).getByRole("button", { name: "Identity" }).focus();
    await narrow();
    await expect(
      within(details).getByRole("button", { name: /^Details\s*In progress$/ }),
    ).toHaveFocus();
    await wide();
    await expect(within(details).getByRole("button", { name: "Details" })).toHaveFocus();
    // Coming back to the tab moves no focus: showing Overview's retained panel again hands it on to
    // nothing in the Details a second time.
    const overview = canvas.getByRole("tab", { name: "Overview" });
    await userEvent.click(canvas.getByRole("tab", { name: "Evidence" }));
    await userEvent.click(overview);
    await waitFor(() => expect(details).toBeVisible());
    await expect(overview).toHaveFocus();
    // Near the edge the rail keeps its place until the layout is space.300 narrower than the
    // width it needs, so a page scrollbar that comes and goes with it never flips the display.
    const px = (name: Parameters<typeof tokenValue>[0]) => Number.parseFloat(tokenValue(name));
    const needs =
      px("dimension.layout.list") + px("space.300") + px("dimension.layout.rail") + px("space.300");
    const settle = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
    frame.style.maxWidth = `${needs - px("space.300") / 2}px`;
    await settle();
    await expect(layout).toHaveAttribute("data-display", "rail");
    frame.style.maxWidth = `${needs - px("space.300") - 1}px`;
    await waitFor(() => expect(layout).toHaveAttribute("data-display", "disclosure"));
    frame.style.maxWidth = `${needs - 1}px`;
    await settle();
    await expect(layout).toHaveAttribute("data-display", "disclosure");
    frame.style.maxWidth = `${needs}px`;
    await waitFor(() => expect(layout).toHaveAttribute("data-display", "rail"));
    frame.style.maxWidth = "1000px";
  },
};

const longGroups = ["Details", "Identity", "Boundary", "Ownership", "Schedule", "Provenance"];
const longSections = [
  "Mission",
  "Boundary",
  "Interconnections",
  "Data flows",
  "Users",
  "Hosting",
  "Inheritance",
  "Evidence",
  "Assessments",
  "Findings",
  "Risks",
  "Remediation",
  "Monitoring",
  "Contacts",
];

/** A system whose Details and body both run longer than the window. */
function LongRecord() {
  return (
    <AsideLayout
      aside={
        <Shell.Aside label="System details">
          {longGroups.map((title) => (
            <Inspector.Group key={title} title={title}>
              {["Owner", "Steward", "Identifier", "Updated", "Reviewed"].map((label) => (
                <KeyValue key={label} label={label}>
                  {`${title} ${label.toLowerCase()}`}
                </KeyValue>
              ))}
            </Inspector.Group>
          ))}
        </Shell.Aside>
      }
    >
      <Stack space="space.400">
        {longSections.map((title) => (
          <Section key={title} title={title}>
            <Prose>
              The ground segment receives telemetry from the spacecraft, archives it, and serves it
              to the mission operations team. Each part of the record runs longer than the window,
              so the page scrolls while the Details stay beside it.
            </Prose>
          </Section>
        ))}
      </Stack>
    </AsideLayout>
  );
}

/**
 * As the page scrolls the rail stays in view under the shell's header (the top nav's height
 * outside a Shell), at most the window's height under it, and scrolls inside itself when the
 * Details are taller: two scroll regions, the page and the rail, with the page's scroll untouched.
 * At the rail's end the wheel goes on to the page. In a window under 30rem tall the rail scrolls
 * with the page instead.
 */
export const TallerThanTheWindow: Story = {
  name: "Taller than the window",
  globals: { viewport: { value: "ledgerDesktop", isRotated: false } },
  render: () => <LongRecord />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const details = canvas.getByRole("region", { name: "System details" });
    if (layoutOf(details)?.dataset["display"] !== "rail") return;
    if (short()) {
      await expect(getComputedStyle(details).position).toBe("static");
      return;
    }
    const style = getComputedStyle(details);
    await expect(style.position).toBe("sticky");
    await expect(style.overflowY).toBe("auto");
    await expect(style.overscrollBehaviorY).toBe("auto");
    await expect(details.scrollHeight).toBeGreaterThan(details.clientHeight);
    const top = Number.parseFloat(tokenValue("dimension.layout.topnav"));
    const scroller = canvasElement.ownerDocument.scrollingElement;
    if (!scroller) return;
    try {
      scroller.scrollTop = 800;
      await waitFor(() => expect(Math.abs(box(details).top - top)).toBeLessThanOrEqual(1));
      await expect(box(details).bottom).toBeLessThanOrEqual(window.innerHeight + 1);
      // The last group is reached by scrolling the rail.
      details.scrollTop = details.scrollHeight;
      const last = within(details).getByRole("button", { name: "Provenance" });
      await waitFor(() => expect(box(last).bottom).toBeLessThanOrEqual(box(details).bottom));
    } finally {
      scroller.scrollTop = 0;
      details.scrollTop = 0;
    }
  },
};

/** Details with nothing to show take no room: the body has the whole width, with no rule. */
export const NoDetails: Story = {
  name: "No Details to show",
  render: () => (
    <AsideLayout aside={<Shell.Aside label="Task details">{null}</Shell.Aside>}>
      <Section title="Description">
        <Prose>The task has no Details yet; its description takes the whole width.</Prose>
      </Section>
    </AsideLayout>
  ),
  play: async ({ canvasElement }) => {
    const layout = canvasElement.querySelector<HTMLElement>('[data-slot="aside-layout"]');
    const body = canvasElement.querySelector<HTMLElement>('[data-slot="aside-layout-body"]');
    const cell = canvasElement.querySelector<HTMLElement>('[data-slot="aside-layout-aside"]');
    await expect(within(canvasElement).queryByRole("region", { name: "Task details" })).toBeNull();
    await expect(cell && getComputedStyle(cell).display).toBe("none");
    await expect(
      layout && body && Math.abs(box(body).width - box(layout).width),
    ).toBeLessThanOrEqual(1);
    // Nor any height: the body starts at the layout's top, with no gap above it.
    await expect(layout && body && Math.abs(box(body).top - box(layout).top)).toBeLessThanOrEqual(1);
  },
};

/** A product's Details keyed by the version they show: choosing another mounts them again. */
function VersionedRecord() {
  const [version, setVersion] = useState(2);
  const chosen = useRef(false);
  const select = useRef<HTMLButtonElement>(null);
  // The control the reader chose with keeps focus in the Details mounted for the new version.
  useEffect(() => {
    if (!chosen.current) return;
    chosen.current = false;
    select.current?.focus();
  }, [version]);
  return (
    <AsideLayout
      key={version}
      aside={
        <Shell.Aside label="Product details">
          <Inspector.Group title="Details">
            <KeyValue label="Version">
              <Button
                ref={select}
                variant="secondary"
                onClick={() => {
                  chosen.current = true;
                  setVersion((shown) => (shown === 2 ? 1 : 2));
                }}
              >
                {`Version ${version}`}
              </Button>
            </KeyValue>
          </Inspector.Group>
        </Shell.Aside>
      }
    >
      <Section title="Description">
        <Prose>The product&apos;s description, as the chosen version states it.</Prose>
      </Section>
    </AsideLayout>
  );
}

/**
 * A layout mounted again where one was (another version of the record, the next record) starts as
 * the display the last one measured, so at a desktop width its first commit is already the rail and
 * an effect that focuses a control in the Details as they mount finds it shown.
 */
export const MountedAgain: Story = {
  name: "Mounted again",
  tags: ["!manifest"],
  globals: { viewport: { value: "ledgerDesktop", isRotated: false } },
  render: () => <VersionedRecord />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const details = canvas.getByRole("region", { name: "Product details" });
    await waitFor(() => expect(layoutOf(details)).toHaveAttribute("data-display"));
    if (layoutOf(details)?.dataset["display"] !== "rail") return;
    await userEvent.click(within(details).getByRole("button", { name: "Version 2" }));
    await expect(await canvas.findByRole("button", { name: "Version 1" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Version 1" }));
    await expect(await canvas.findByRole("button", { name: "Version 2" })).toHaveFocus();
  },
};

const layoutRef = createRef<HTMLDivElement>();

/** AsideLayout forwards its native props, its class and its ref to its root, and names itself with `data-slot`. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: () => (
    <AsideLayout
      ref={layoutRef}
      id="record-body"
      data-testid="layout"
      className="pb-300"
      aside={
        <Shell.Aside label="Task details">
          <Inspector.Group title="Details">
            <KeyValue label="Owner">Sarah Chen</KeyValue>
          </Inspector.Group>
        </Shell.Aside>
      }
    >
      <Prose>The task&apos;s description.</Prose>
    </AsideLayout>
  ),
  play: async ({ canvasElement }) => {
    const layout = within(canvasElement).getByTestId("layout");
    await expect(layoutRef.current).toBe(layout);
    await expect(layout).toHaveAttribute("id", "record-body");
    await expect(layout).toHaveAttribute("data-slot", "aside-layout");
    await expect(layout).toHaveClass("pb-300");
    await expect(layout).toHaveAttribute("data-display");
  },
};
