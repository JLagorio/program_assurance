import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  avatarHue,
  AvatarFallback,
  avatarInitials,
  Badge,
  Avatar,
  Button,
  Dot,
  IconButton,
  Item,
  ItemGroup,
} from "../../components";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { ExternalLink, MoreHorizontal, Plus } from "lucide-react";
import { HeadingLevelProvider, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Components/Item",
  component: Item,
  subcomponents: { ItemGroup },
  parameters: { layout: "padded" },
  args: { title: "Bank reconciliation, July" },
} satisfies Meta<typeof Item>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each slot in a group of its own, since a group shares its columns; then the states, a titled compact group, and one with nothing in it. */
export const ItemMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Item.Group>
        <Item title="Title only" />
        <Item title="With meta" meta="PDF · 2.1 MB" />
        <Item title="With a description" description="A description under the title." />
        <Item title="With trailing" trailing="Sep 18, 2026" />
        <Item
          title="With actions"
          actions={
            <IconButton label="More" variant="subtle" size="small" icon={<MoreHorizontal />} />
          }
        />
      </Item.Group>
      <Item.Group>
        <Item id="MS-C" title="With an id" />
        <Item
          id="RMF-6"
          title="Id, meta and trailing"
          meta="Whitcombe LLP"
          trailing="Sep 18, 2026"
        />
        <Item id="EV-2201" idWidth={120} title="A wider id column, shared by the group" />
      </Item.Group>
      <Item.Group>
        <Item
          leading={<Dot tone="success" />}
          id="MS-D"
          title="Leading mark and id"
          meta="Sep 04"
        />
        <Item
          leading={
            <Avatar
              size="xsmall"
              aria-hidden="true"
              hue={avatarHue("Priya Natarajan")}
              title={"Priya Natarajan"}
            >
              <AvatarFallback>{avatarInitials("Priya Natarajan", 1)}</AvatarFallback>
            </Avatar>
          }
          id="MS-E"
          title="Leading avatar"
          description="Marks land at one x whatever they are."
        />
      </Item.Group>
      <Item.Group>
        <Item
          title="Selectable"
          description="onSelect makes the title a button over the row."
          onSelect={() => {}}
        />
        <Item title="Active" onSelect={() => {}} isActive />
        <Item
          title="A link row"
          link={<a href="#row" />}
          trailing={<ExternalLink className="size-icon-small icon-subtlest" />}
        />
        <Item title="Expanded" onSelect={() => {}}>
          <Text size="small" color="color.text.subtle">
            Children start under the title, whatever the row carries before it.
          </Text>
        </Item>
      </Item.Group>
      <Item.Group>
        <Item title="Collapsible" meta="click anywhere" isCollapsible>
          <Text size="small" color="color.text.subtle">
            A plain collapsible row opens on a click anywhere on it.
          </Text>
        </Item>
        <Item
          title="Collapsible link"
          meta="the chevron opens it"
          link={<a href="#row-2" />}
          isCollapsible
          defaultOpen
        >
          <Text size="small" color="color.text.subtle">
            A row that links or selects keeps its click; the chevron is the toggle.
          </Text>
        </Item>
      </Item.Group>
      <Item.Group title="Milestones" count={3} trailing="1 of 3 complete" size="compact">
        <Item
          leading={<Dot tone="success" />}
          id="MS-A"
          idWidth={48}
          title="Kickoff"
          meta="Complete"
          trailing="4 Mar"
        />
        <Item
          leading={<Dot tone="warning" />}
          id="MS-B"
          idWidth={48}
          title="Design review"
          meta="At risk"
          trailing="18 Sep"
        />
        <Item
          leading={<Dot tone="neutral" />}
          id="MS-C"
          idWidth={48}
          title="Authorization"
          meta="Planned"
          trailing="2 Dec"
        />
      </Item.Group>
      <Item.Group
        title="Evidence"
        trailing={
          <Button size="small" variant="subtle" iconBefore={<Plus />}>
            Add
          </Button>
        }
        empty="No evidence linked yet."
      />
    </Stack>
  ),
};

/** Three lists a record page is made of: evidence, milestones, and a conversation. */
export const Lists: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-[640px]">
      <Item.Group title="Evidence" count={2}>
        <Item
          id="EV-2201"
          title="Bank reconciliation, July"
          meta="PDF · 2.1 MB"
          description="Uploaded by Dana Whitfield"
          trailing="12 Aug"
          link={<a href="#ev-2201" />}
        />
        <Item
          id="EV-2202"
          title="Approval matrix"
          meta="XLSX"
          trailing="9 Aug"
          onSelect={() => undefined}
          isActive
          actions={
            <IconButton label="Open" variant="subtle" size="small" icon={<ExternalLink />} />
          }
        />
      </Item.Group>
      <Item.Group title="Milestones" trailing="1 of 3 complete">
        <Item
          leading={<Dot tone="success" />}
          id="MS-A"
          idWidth={48}
          title="Kickoff"
          meta="Complete"
          trailing="4 Mar"
        />
        <Item
          leading={<Dot tone="warning" />}
          id="MS-B"
          idWidth={48}
          title="Design review"
          meta="At risk"
          trailing="18 Sep"
        />
        <Item
          leading={<Dot tone="neutral" />}
          id="MS-C"
          idWidth={48}
          title="Authorization"
          meta="Planned"
          trailing="2 Dec"
        />
      </Item.Group>
      <Item.Group>
        <Item
          leading={
            <Avatar
              size="xsmall"
              aria-hidden="true"
              hue={avatarHue("Priya Natarajan")}
              title={"Priya Natarajan"}
            >
              <AvatarFallback>{avatarInitials("Priya Natarajan", 1)}</AvatarFallback>
            </Avatar>
          }
          title="Priya requested a walkthrough"
          description="Wants to see the payables run end to end before signing off."
          trailing="Yesterday"
        >
          <Badge variant="secondary" tone="information">
            Open request
          </Badge>
        </Item>
      </Item.Group>
    </Stack>
  ),
};

/** A milestone that folds its tasks: a nested group under the title, opened by the chevron. */
export const Nested: Story = {
  render: () => (
    <Item.Group title="Milestones" trailing="1 of 2 complete" className="max-w-[640px]">
      <Item
        leading={<Dot tone="warning" />}
        id="MS-B"
        idWidth={48}
        title="Design review"
        meta="At risk"
        trailing="18 Sep"
        link={<a href="#ms-b" />}
        isCollapsible
        defaultOpen
      >
        <Item.Group size="compact">
          <Item
            leading={<Dot tone="success" />}
            title="Threat model walkthrough"
            trailing="2 Sep"
          />
          <Item
            leading={<Dot tone="warning" />}
            title="Boundary diagram sign-off"
            meta="Waiting on the ISSM"
            trailing="16 Sep"
          />
          <Item leading={<Dot tone="neutral" />} title="Findings triage" trailing="18 Sep" />
        </Item.Group>
      </Item>
      <Item
        leading={<Dot tone="success" />}
        id="MS-A"
        idWidth={48}
        title="Kickoff"
        meta="Complete"
        trailing="4 Mar"
        link={<a href="#ms-a" />}
        isCollapsible
      >
        <Item.Group size="compact">
          <Item leading={<Dot tone="success" />} title="Charter signed" trailing="1 Mar" />
        </Item.Group>
      </Item>
    </Item.Group>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Playground: Story = {
  render: (args) => (
    <Item.Group>
      <Item {...args} />
    </Item.Group>
  ),
};

/** A record row keeps its link, disclosure and secondary actions independent. */
export const NativeIntegration: Story = {
  render: function Example() {
    const row = useRef<HTMLLIElement>(null);
    const link = useRef<HTMLAnchorElement>(null);
    const [locked, setLocked] = useState(true);
    const [action, setAction] = useState("Ready");
    return (
      <Stack>
        <Item.Group id="record-actions" title="Record actions">
          <Item
            ref={row}
            aria-label="Assessment package row"
            tabIndex={-1}
            style={{ maxWidth: 640 }}
            title="Assessment package"
            id="PKG-1041"
            isCollapsible
            onOpenChange={(_open, details) => {
              if (locked) details.cancel();
            }}
            link={
              <a
                id="assessment-package-link"
                ref={link}
                href="#package"
                onClick={(event) => {
                  event.preventDefault();
                  setAction("Opened record");
                }}
              />
            }
            actions={
              <Button size="small" onClick={() => setAction("Downloaded")}>
                Download
              </Button>
            }
          >
            <Text>Evidence and approval details</Text>
          </Item>
        </Item.Group>
        <Button onClick={() => setLocked(false)}>Allow details</Button>
        <Button onClick={() => row.current?.focus()}>Focus row</Button>
        <Button onClick={() => link.current?.focus()}>Focus record link</Button>
        <Text role="status">{action}</Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Assessment package" });
    await expect(link).toHaveAttribute("id", "assessment-package-link");
    await expect(link).toHaveAttribute("href", "#package");
    const toggle = canvas.getByRole("button", { name: "Assessment package" });
    // The chevron sits above the title's stretched link: a click or a tap on it reaches the
    // chevron, never the record, and on a touch screen its hit area is 24px.
    const chevron = toggle.getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(
      chevron.left + chevron.width / 2,
      chevron.top + chevron.height / 2,
    );
    await expect(hit && toggle.contains(hit)).toBe(true);
    await expect(toggle).toHaveClass("touch-target");
    // It is the kit's 20px row control, named by the title, and mounts no tooltip of its own.
    await expect(chevron.width).toBe(20);
    await expect(chevron.height).toBe(20);
    await expect(toggle).toHaveAttribute("data-slot", "icon-button");
    await expect(toggle).not.toHaveAttribute("data-slot", "tooltip-trigger");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(canvas.getByRole("button", { name: "Allow details" }));
    await userEvent.click(toggle);
    await expect(await canvas.findByText("Evidence and approval details")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Download" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Downloaded");
    await userEvent.click(canvas.getByRole("button", { name: "Focus row" }));
    await expect(canvas.getByRole("listitem", { name: "Assessment package row" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Focus record link" }));
    await expect(link).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByRole("status")).toHaveTextContent("Downloaded");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Opened record");
  },
};

/** A group's title is a heading at the contextual level and names its list: an h3 when nothing sets one, an h2 in a region that starts its outline at 2 (a page's rail). A compact empty message stays body text. */
export const GroupHeadingLevel: Story = {
  name: "Group heading level",
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Stack space="space.400">
        <Item.Group title="Decisions" count={1}>
          <Item id="DEC-12" title="Accept residual risk on legacy VPN" trailing="4 Sept" />
        </Item.Group>
        <HeadingLevelProvider level={2}>
          <Item.Group title="Milestones" size="compact" empty="No milestones recorded." />
          <Item.Group title="Reviews" size="compact">
            <Item title="Quarterly access review" trailing="30 Sept" />
          </Item.Group>
        </HeadingLevelProvider>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Decisions" }).tagName).toBe("H3");
    await expect(canvas.getByRole("heading", { name: "Milestones" }).tagName).toBe("H2");
    await expect(canvas.getByRole("heading", { name: "Reviews" }).tagName).toBe("H2");
    await expect(canvas.getByRole("list", { name: "Reviews" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "No milestones recorded." })).toBeNull();
  },
};

/** A group without a title of its own is named through the list: `aria-labelledby` points at the heading a card draws, `aria-label` names it when nothing shows a heading. Both reach the `ol`, never the wrapper, which has no role. */
export const GroupNamedFromOutside: Story = {
  name: "Group named from outside",
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Stack space="space.300">
        <Stack space="space.100">
          <Text id="linked-evidence" weight="semibold">
            Linked evidence
          </Text>
          <Item.Group aria-labelledby="linked-evidence" size="compact" data-testid="labelled">
            <Item id="EV-204" title="Access review export, August" trailing="2 Sept" />
          </Item.Group>
        </Stack>
        <Item.Group aria-label="Recent decisions" size="compact" data-testid="named">
          <Item id="DEC-12" title="Accept residual risk on legacy VPN" trailing="4 Sept" />
        </Item.Group>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const labelled = canvas.getByRole("list", { name: "Linked evidence" });
    await expect(labelled.tagName).toBe("OL");
    await expect(canvas.getByTestId("labelled")).not.toHaveAttribute("aria-labelledby");
    await expect(canvas.getByTestId("labelled")).toHaveAttribute("data-slot", "item-group");
    const named = canvas.getByRole("list", { name: "Recent decisions" });
    await expect(named.tagName).toBe("OL");
    await expect(canvas.getByTestId("named")).not.toHaveAttribute("aria-label");
    await expect(within(named).getByRole("listitem")).toHaveAttribute("data-slot", "item");
  },
};

/** The row open beside the list says so: `isActive` fills it and puts `aria-current="true"` on its link or button. The id, the meta and the description are the row's accessible description, so two rows with one name read apart. */
export const OpenRowAndDescription: Story = {
  name: "Open row and description",
  render: function Example() {
    const [open, setOpen] = useState("ac-01_odp.01");
    const rows = [
      { id: "ac-01_odp.01", title: "personnel or roles", meta: "Assignment" },
      { id: "ac-01_odp.02", title: "personnel or roles", meta: "Assignment" },
      { id: "ac-01_odp.03", title: "frequency", meta: "Selection" },
    ];
    return (
      <div style={{ maxWidth: 360 }}>
        <Item.Group aria-label="Parameters" size="compact">
          {rows.map((row) => (
            <Item
              key={row.id}
              id={row.id}
              idWidth={104}
              title={row.title}
              meta={row.meta}
              description="Defined in the organization's policy"
              onSelect={() => setOpen(row.id)}
              isActive={open === row.id}
            />
          ))}
        </Item.Group>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first, second, third] = canvas.getAllByRole("button");
    await expect(first).toHaveAttribute("aria-current", "true");
    await expect(second).not.toHaveAttribute("aria-current");
    await expect(first).toHaveAccessibleName("personnel or roles");
    await expect(first).toHaveAccessibleDescription(
      "ac-01_odp.01 Assignment Defined in the organization's policy",
    );
    await expect(second).toHaveAccessibleDescription(/^ac-01_odp\.02/);
    // Forced colours remove the selected fill, so the open row is outlined instead.
    if (matchMedia("(forced-colors: active)").matches) {
      const row = (control: HTMLElement) => control.closest("li")!.firstElementChild!;
      await expect(getComputedStyle(row(first!)).outlineStyle).toBe("solid");
      await expect(getComputedStyle(row(second!)).outlineStyle).toBe("none");
    }
    await userEvent.click(second!);
    await expect(second).toHaveAttribute("aria-current", "true");
    await expect(first).not.toHaveAttribute("aria-current");
    await expect(third).not.toHaveAttribute("aria-current");
  },
};

/** A group fed from several sources shows its `empty` when none of them has a row: empty arrays, `false` and empty fragments are nothing. */
export const EmptyFromSeveralSources: Story = {
  name: "Empty from several sources",
  render: () => {
    const decisions: string[] = [];
    const reviews: string[] = [];
    return (
      <div style={{ maxWidth: 480 }}>
        <Item.Group title="History" empty="Nothing recorded yet.">
          {decisions.map((d) => (
            <Item key={d} title={d} />
          ))}
          {reviews.length > 0 && reviews.map((r) => <Item key={r} title={r} />)}
          <>
            {reviews.map((r) => (
              <Item key={r} title={r} />
            ))}
          </>
        </Item.Group>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Nothing recorded yet.")).toBeInTheDocument();
    await expect(canvas.queryByRole("list")).toBeNull();
  },
};

const longName = "Router management plane accepts unencrypted telnet from the operations VLAN";

/** Long names in a narrow list: a cut title shows in full in a tooltip on hover and when its row takes keyboard focus, and `maxTitleLines` gives a list of long names two or three lines. The group heading wraps. A short meta keeps its words while the title gives way, and a long one is cut at half the line. */
export const LongNames: Story = {
  name: "Long names",
  render: () => (
    <div style={{ width: 280, maxWidth: "100%" }}>
      <Stack space="space.300">
        <Item.Group title="Findings linked to the ground segment boundary" size="compact">
          <Item id="FND-2231" title={longName} link={<a href="#fnd-2231" />} />
          <Item id="FND-2214" title="SSH permits GSSAPI authentication" trailing="CAT II" />
        </Item.Group>
        <Item.Group aria-label="Two lines" size="compact">
          <Item title={longName} maxTitleLines={2} onSelect={() => {}} />
        </Item.Group>
        <Item.Group aria-label="Meta beside a long name" size="compact">
          <Item title={longName} meta="CAT I" link={<a href="#fnd-2240" />} />
          <Item
            title="Telnet enabled"
            meta="Operations VLAN, management plane, all ground routers"
            onSelect={() => {}}
          />
        </Item.Group>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole("heading", {
      name: "Findings linked to the ground segment boundary",
    });
    // The heading wraps rather than cutting its words.
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth + 1);
    const link = within(
      canvas.getByRole("list", { name: "Findings linked to the ground segment boundary" }),
    ).getByRole("link", { name: longName });
    const title = link.querySelector<HTMLElement>('[data-slot="truncate"]')!;
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    // The name sits above the row's stretched overlay, so the pointer reaches it.
    const box = title.getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(
      box.left + 8,
      box.top + box.height / 2,
    );
    await expect(hit && title.contains(hit)).toBe(true);
    const revealed = () =>
      waitFor(() => {
        const popup = document.querySelector<HTMLElement>('[data-slot="truncate-full-text"]');
        expect(popup).not.toBeNull();
        return popup!;
      });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(await revealed()).toHaveTextContent(longName);
    await userEvent.tab();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull(),
    );
    // Two lines clamp the name, still in one row.
    const twoLines = within(canvas.getByRole("list", { name: "Two lines" }))
      .getByRole("button")
      .querySelector<HTMLElement>('[data-slot="truncate"]')!;
    await expect(twoLines).toHaveAttribute("data-max-lines", "2");
    const line = parseFloat(getComputedStyle(twoLines).lineHeight);
    await expect(twoLines.clientHeight).toBeGreaterThan(line * 1.5);
    // A short meta keeps its words and the title gives way; a long meta stops at half the line.
    const metaList = within(canvas.getByRole("list", { name: "Meta beside a long name" }));
    const short = metaList.getByText("CAT I");
    await expect(short.scrollWidth).toBeLessThanOrEqual(short.clientWidth + 1);
    const cutTitle = metaList
      .getByRole("link", { name: longName })
      .querySelector<HTMLElement>('[data-slot="truncate"]')!;
    await expect(cutTitle.scrollWidth).toBeGreaterThan(cutTitle.clientWidth);
    const long = metaList.getByText("Operations VLAN, management plane, all ground routers");
    const lineBox = long.parentElement!.getBoundingClientRect();
    await expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(lineBox.width / 2 + 1);
    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
  },
};

/** Right to left: the columns run from the right, the id first, and a title that is a button or a disclosure starts at its start edge, the right, as a link's does. */
export const RightToLeft: Story = {
  name: "Right to left",
  render: () => (
    <div dir="rtl" style={{ maxWidth: 420 }}>
      <Item.Group aria-label="Right to left" size="compact">
        <Item id="REQ-014" title="Boundary protection" meta="SC-7" onSelect={() => {}} />
        <Item id="REQ-015" title="Session lock" isCollapsible>
          Lock after fifteen minutes.
        </Item>
        <Item id="REQ-016" title="Audit review" link={<a href="#req-016" />} />
      </Item.Group>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = within(within(canvasElement).getByRole("list", { name: "Right to left" }));
    for (const name of ["Boundary protection", "Session lock", "Audit review"]) {
      const control = list.getByRole(name === "Audit review" ? "link" : "button", { name });
      const text = control.querySelector<HTMLElement>('[data-slot="truncate"]')!;
      const row = control.closest("li")!;
      const id = within(row).getByText(/^REQ-/);
      // The title's text starts at its start edge, the right, after the id, the first column.
      await expect(getComputedStyle(control).textAlign).toBe("start");
      await expect(id.getBoundingClientRect().left).toBeGreaterThan(
        text.getBoundingClientRect().right - 1,
      );
    }
  },
};

/** A row that opens its record is a link, `link`; `onSelect` is for a row that acts in place. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <Item.Group aria-label="Evidence">
          <Item
            id="EV-2201"
            title="Bank reconciliation, July"
            meta="PDF"
            link={<a href="#ev-2201" />}
          />
        </Item.Group>
      }
      doText="The row opens its record through link: a real anchor, which a reader can open in a new tab or copy."
      dont={
        <Item.Group aria-label="Evidence to open">
          <Item
            id="EV-2202"
            title="Approval matrix"
            meta="XLSX"
            onSelect={() => window.location.assign("#ev-2202")}
          />
        </Item.Group>
      }
      dontText="onSelect that navigates. The title is a button, so a new tab, a copied address and the browser's own link menu are gone."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Bank reconciliation, July" });
    await expect(link).toHaveAttribute("href", "#ev-2201");
    // The Don't's title is a button: nothing to open in a new tab.
    const button = canvas.getByRole("button", { name: "Approval matrix" });
    await expect(button).not.toHaveAttribute("href");
  },
};
