import { createRef } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
} from "../src/index";

const tabsRoot: TabsProps = {
  ref: createRef<HTMLDivElement>(),
  defaultValue: 1,
  orientation: "vertical",
  dir: "rtl",
  render: <section aria-label="Record" />,
  className: (state) => (state.orientation === "vertical" ? "gap-200" : "gap-100"),
  style: (state) => ({ opacity: state.tabActivationDirection === "none" ? 1 : 0.9 }),
  onValueChange(value, details) {
    if (value === 2 && details.reason === "none") details.cancel();
  },
};
const tabsList: TabsListProps = {
  ref: createRef<HTMLDivElement>(),
  variant: "line",
  activateOnFocus: true,
  loopFocus: false,
  "aria-label": "Record views",
  className: tabsListVariants({ variant: "line" }),
};
const tabsTrigger: TabsTriggerProps = {
  ref: createRef<HTMLButtonElement>(),
  value: 1,
  disabled: false,
  className: (state) => (state.active ? "font-medium" : "font-regular"),
  onClick: (event) => event.preventBaseUIHandler(),
};
const tabsPanel: TabsContentProps = {
  ref: createRef<HTMLDivElement>(),
  value: 1,
  keepMounted: true,
  render: (props, state) => <section {...props} data-inactive={state.hidden} />,
};
<Tabs {...tabsRoot}>
  <TabsList {...tabsList}>
    <TabsTrigger {...tabsTrigger}>Overview</TabsTrigger>
    <TabsTrigger value={2} nativeButton={false} render={<a href="/record?tab=history" />}>
      History
    </TabsTrigger>
  </TabsList>
  <TabsContent {...tabsPanel}>Overview content</TabsContent>
</Tabs>;
<Tabs value={null} />;
// @ts-expect-error Activation belongs on TabsList as activateOnFocus.
<Tabs activation="automatic" />;
// @ts-expect-error Use aria-label on the tablist.
<TabsList label="Views" />;
// @ts-expect-error Counts belong in children.
<TabsTrigger value="overview" count={2} />;
// @ts-expect-error Composition uses render.
<TabsContent value="overview" asChild />;
