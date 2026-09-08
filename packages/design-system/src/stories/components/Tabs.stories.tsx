import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Badge,
  Button,
  Count,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

const views = ["Overview", "Controls", "Evidence", "History"];

/** Shadcn's default and line variants, manual and automatic activation, and overflow. */
export const Variants: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Default · manual activation">
        <Tabs defaultValue={0}>
          <TabsList aria-label="Manual views">
            {views.map((view, i) => (
              <TabsTrigger key={view} value={i} disabled={i === 2}>
                {view}
              </TabsTrigger>
            ))}
          </TabsList>
          {views.map((view, i) => (
            <TabsContent key={view} value={i}>
              {view} content
            </TabsContent>
          ))}
        </Tabs>
      </Specimens>
      <Specimens title="Line · automatic activation · scrolls when narrow">
        <Tabs defaultValue="Controls" className="w-full max-w-[320px]">
          <TabsList
            variant="line"
            activateOnFocus
            aria-label="Record views"
            className="w-full justify-start"
          >
            {views.map((view) => (
              <TabsTrigger key={view} value={view}>
                {view}
                {view === "Controls" ? <Count value={340} max={9999} /> : null}
                {view === "Evidence" ? (
                  <Badge variant="secondary" tone="warning" size="xsmall">
                    Draft
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {views.map((view) => (
            <TabsContent key={view} value={view}>
              {view} content
            </TabsContent>
          ))}
        </Tabs>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const manual = within(canvas.getByRole("tablist", { name: "Manual views" }));
    const overview = manual.getByRole("tab", { name: "Overview" });
    const controls = manual.getByRole("tab", { name: "Controls" });
    overview.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(controls).toHaveFocus());
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Enter}");
    await expect(controls).toHaveAttribute("aria-selected", "true");
    const panel = canvas.getByRole("tabpanel", { name: "Controls" });
    await expect(controls).toHaveAttribute("aria-controls", panel.id);
    await expect(panel).toHaveAttribute("aria-labelledby", controls.id);
    await userEvent.keyboard("{ArrowRight}");
    const disabled = manual.getByRole("tab", { name: "Evidence" });
    await waitFor(() => expect(disabled).toHaveFocus());
    await userEvent.keyboard("{Enter} ");
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    await expect(controls).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(manual.getByRole("tab", { name: "History" })).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(overview).toHaveFocus());
    await userEvent.keyboard(" ");
    await expect(overview).toHaveAttribute("aria-selected", "true");
    const line = canvas.getByRole("tablist", { name: "Record views" });
    await expect(line.scrollWidth).toBeGreaterThan(line.clientWidth);
    const lineTabs = within(line);
    const selected = lineTabs.getByRole("tab", { name: "Controls 340" });
    await expect(selected.tagName).toBe("BUTTON");
    await expect(selected.getBoundingClientRect().height).toBe(32);
    await waitFor(() => expect(getComputedStyle(selected, "::after").opacity).toBe("1"));
    await expect(getComputedStyle(selected, "::after").height).toBe("2px");
    selected.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(lineTabs.getByRole("tab", { name: "Evidence Draft" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await userEvent.keyboard("{Home}");
    await waitFor(() =>
      expect(lineTabs.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await waitFor(() =>
      expect(
        lineTabs.getByRole("tab", { name: "Overview" }).getBoundingClientRect().left,
      ).toBeGreaterThanOrEqual(line.getBoundingClientRect().left),
    );
    await userEvent.keyboard("{End}");
    const history = lineTabs.getByRole("tab", { name: "History" });
    await waitFor(() => expect(history).toHaveAttribute("aria-selected", "true"));
    await waitFor(() =>
      expect(history.getBoundingClientRect().right).toBeLessThanOrEqual(
        line.getBoundingClientRect().right + 1,
      ),
    );
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(line.scrollLeft).toBe(0));
  },
};

const rootRef = createRef<HTMLDivElement>();
const listRef = createRef<HTMLDivElement>();
const tabRef = createRef<HTMLButtonElement>();
const panelRef = createRef<HTMLDivElement>();
const rejectedChange = fn();
function Editing() {
  const [value, setValue] = useState<string | null>("Draft");
  return (
    <Stack space="space.200">
      <Tabs
        ref={rootRef}
        value={value}
        onValueChange={(next, details) => {
          if (next === "Locked") {
            rejectedChange(details.reason);
            details.cancel();
          } else setValue(next);
        }}
        render={<section aria-label="Review editor" />}
        className={(state) => (state.orientation === "horizontal" ? "gap-200" : "gap-100")}
      >
        <TabsList ref={listRef} aria-label="Review views">
          <TabsTrigger
            ref={tabRef}
            value="Draft"
            style={(state) => ({ fontStyle: state.active ? "normal" : "italic" })}
          >
            Draft
          </TabsTrigger>
          <TabsTrigger value="Preview">Preview</TabsTrigger>
          <TabsTrigger value="Locked">Locked</TabsTrigger>
        </TabsList>
        <TabsContent ref={panelRef} value="Draft" keepMounted className="flex" render={<section />}>
          <Input aria-label="Draft title" defaultValue="Assessment" />
        </TabsContent>
        <TabsContent value="Preview">
          <Input aria-label="Preview note" defaultValue="" />
        </TabsContent>
        <TabsContent value="Locked">Restricted review</TabsContent>
      </Tabs>
      <Button onClick={() => setValue(null)}>Clear selection</Button>
      <Text role="status">Selected: {value ?? "none"}</Text>
    </Stack>
  );
}

/** Controlled values, cancellable changes, refs/render, and retained versus unmounted views. */
export const EditingAndMounting: Story = {
  render: () => <Editing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    rejectedChange.mockClear();
    await expect(rootRef.current).toBe(canvas.getByRole("region", { name: "Review editor" }));
    await expect(listRef.current).toBe(canvas.getByRole("tablist", { name: "Review views" }));
    await expect(tabRef.current).toBe(canvas.getByRole("tab", { name: "Draft" }));
    await expect(panelRef.current?.tagName).toBe("SECTION");
    const draft = canvas.getByRole("textbox", { name: "Draft title" });
    await userEvent.type(draft, " updated");
    await userEvent.click(canvas.getByRole("tab", { name: "Preview" }));
    await waitFor(() => expect(panelRef.current).not.toBeVisible());
    await expect(panelRef.current).toHaveAttribute("hidden");
    await expect(panelRef.current).toHaveAttribute("inert");
    await expect(draft).toBeInTheDocument();
    await userEvent.type(canvas.getByRole("textbox", { name: "Preview note" }), "Temporary");
    await userEvent.click(canvas.getByRole("tab", { name: "Locked" }));
    await expect(rejectedChange).toHaveBeenCalledWith("none");
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: Preview");
    await userEvent.click(canvas.getByRole("tab", { name: "Draft" }));
    await expect(draft).toHaveValue("Assessment updated");
    await expect(canvas.queryByRole("textbox", { name: "Preview note", hidden: true })).toBeNull();
    await userEvent.click(canvas.getByRole("tab", { name: "Preview" }));
    await expect(canvas.getByRole("textbox", { name: "Preview note" })).toHaveValue("");
    await userEvent.click(canvas.getByRole("button", { name: "Clear selection" }));
    await expect(canvas.queryByRole("tabpanel")).toBeNull();
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: none");
    await userEvent.click(canvas.getByRole("tab", { name: "Draft" }));
  },
};

/** Locale direction and vertical keyboard navigation are supplied to Base UI itself. */
export const Orientation: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <Stack space="space.400">
        <Specimens title="Horizontal · inherited RTL">
          <Tabs defaultValue="Overview" className="w-full max-w-[280px]">
            <TabsList
              variant="line"
              activateOnFocus
              aria-label="RTL views"
              className="w-full justify-start"
            >
              {views.map((view) => (
                <TabsTrigger key={view} value={view}>
                  {view}
                </TabsTrigger>
              ))}
            </TabsList>
            {views.map((view) => (
              <TabsContent key={view} value={view}>
                {view} content
              </TabsContent>
            ))}
          </Tabs>
        </Specimens>
        <Specimens title="Vertical · explicit LTR · no wrapping">
          <Tabs orientation="vertical" dir="ltr" defaultValue="Overview">
            <TabsList variant="line" activateOnFocus loopFocus={false} aria-label="Vertical views">
              {views.map((view) => (
                <TabsTrigger key={view} value={view}>
                  {view}
                </TabsTrigger>
              ))}
            </TabsList>
            {views.map((view) => (
              <TabsContent key={view} value={view}>
                {view} content
              </TabsContent>
            ))}
          </Tabs>
        </Specimens>
      </Stack>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const rtl = within(canvas.getByRole("tablist", { name: "RTL views" }));
    rtl.getByRole("tab", { name: "Overview" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(rtl.getByRole("tab", { name: "Controls" })).toHaveAttribute("aria-selected", "true"),
    );
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(rtl.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true"),
    );
    await userEvent.keyboard("{End}");
    const rtlLast = rtl.getByRole("tab", { name: "History" });
    await waitFor(() => expect(rtlLast).toHaveAttribute("aria-selected", "true"));
    const rtlList = canvas.getByRole("tablist", { name: "RTL views" });
    await waitFor(() =>
      expect(rtlLast.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        rtlList.getBoundingClientRect().left - 1,
      ),
    );
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(rtlList.scrollLeft).toBe(0));
    const verticalList = canvas.getByRole("tablist", { name: "Vertical views" });
    await expect(verticalList).toHaveAttribute("aria-orientation", "vertical");
    await expect(getComputedStyle(verticalList).flexDirection).toBe("column");
    const vertical = within(verticalList);
    vertical.getByRole("tab", { name: "Overview" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(vertical.getByRole("tab", { name: "Controls" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await userEvent.keyboard("{End}");
    const last = vertical.getByRole("tab", { name: "History" });
    await waitFor(() => expect(last).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}");
    await expect(last).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(last, "::after").opacity).toBe("1"));
    await expect(getComputedStyle(last, "::after").width).toBe("2px");
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(vertical.getByRole("tab", { name: "Evidence" })).toHaveFocus());
  },
};

function Linked() {
  const [value, setValue] = useState("Overview");
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList variant="line" aria-label="Linked views">
        {views.map((view) => (
          <TabsTrigger
            key={view}
            value={view}
            nativeButton={false}
            render={<a href={`#${view.toLowerCase()}`} />}
          >
            {view}
          </TabsTrigger>
        ))}
      </TabsList>
      {views.map((view) => (
        <TabsContent key={view} value={view}>
          {view} content
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** A router Link or anchor keeps its href while participating in the tab pattern. */
export const Links: Story = {
  render: () => <Linked />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const controls = canvas.getByRole("tab", { name: "Controls" });
    await expect(controls.tagName).toBe("A");
    await expect(controls).toHaveAttribute("href", "#controls");
    await expect(controls).not.toHaveAttribute("type");
    // Observe whether Base UI allows native navigation; suppress only the test's browser action.
    const prevented: boolean[] = [];
    const intercept = (event: MouseEvent) => {
      prevented.push(event.defaultPrevented);
      event.preventDefault();
    };
    canvasElement.ownerDocument.addEventListener("click", intercept);
    try {
      await userEvent.click(controls);
      await expect(controls).toHaveAttribute("aria-selected", "true");
      await fireEvent.click(controls, { ctrlKey: true });
      await fireEvent.click(controls, { metaKey: true });
      await userEvent.keyboard("{ArrowRight}");
      const evidence = canvas.getByRole("tab", { name: "Evidence" });
      await waitFor(() => expect(evidence).toHaveFocus());
      await expect(controls).toHaveAttribute("aria-selected", "true");
      await userEvent.keyboard("{Enter}");
      await expect(evidence).toHaveAttribute("aria-selected", "true");
      await expect(prevented).toEqual([false, false, false, false]);
    } finally {
      canvasElement.ownerDocument.removeEventListener("click", intercept);
    }
  },
};
