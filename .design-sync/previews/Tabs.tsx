import { Tabs } from "program-assurance";

export function LinkTabs() {
  return (
    <Tabs
      active="Controls"
      items={[
        { label: "Overview", to: "/programs" },
        { label: "Controls", to: "/controls", count: 421 },
        { label: "Findings", to: "/findings", count: 12 },
        { label: "Evidence", to: "/evidence", count: 96 },
        { label: "POA&M", to: "/poam", count: 7 },
      ]}
    />
  );
}

export function ButtonTabs() {
  return (
    <Tabs
      active="Open"
      items={[
        { label: "Open", count: 12 },
        { label: "In remediation", count: 5 },
        { label: "Closed", count: 148 },
      ]}
    />
  );
}
