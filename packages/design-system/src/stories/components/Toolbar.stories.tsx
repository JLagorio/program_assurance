import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Button,
  Count,
  FilterChip,
  Table,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
} from "../../components";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { Download, Plus } from "lucide-react";
import { useState } from "react";
import { Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Toolbar",
  component: Toolbar,
  parameters: { layout: "padded" },
  args: { search: "", onSearch: () => {}, placeholder: "Search controls" },
} satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Search only; search and filters; filters and actions; no search, the children carry the row; a Select that narrows. */
export const ToolbarMatrix: Story = {
  render: () => {
    const undefinedItems = [
      { value: "ssp", label: "System security plan" },
      { value: "sap", label: "Assessment plan" },
      { value: "poam", label: "Plan of action" },
    ];
    return (
      <Stack space="space.200" className="max-w-layout-measure">
        <Toolbar search="" onSearch={() => {}} placeholder="Search controls" />
        <Toolbar search="AC-2" onSearch={() => {}} placeholder="Search controls">
          <FilterChip label="Baseline" value="Rev. 5" isActive />
          <FilterChip label="Impact" />
        </Toolbar>
        <Toolbar
          search=""
          onSearch={() => {}}
          placeholder="Search controls"
          actions={
            <>
              <Button size="small" iconBefore={<Download />}>
                Export
              </Button>
              <Button size="small" variant="primary" iconBefore={<Plus />}>
                New control
              </Button>
            </>
          }
        >
          <FilterChip label="Owner" />
          <FilterChip label="Status" />
        </Toolbar>
        <Toolbar
          actions={
            <Text size="small" color="color.text.subtle">
              12 of 340 controls
            </Text>
          }
        >
          <ToggleGroup aria-label="Lens" defaultValue={["gaps"]}>
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="gaps">
              Gaps <Count value={12} />
            </ToggleGroupItem>
            <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
          </ToggleGroup>
        </Toolbar>
        <Toolbar
          search=""
          onSearch={() => {}}
          placeholder="Search parts, suppliers"
          actions={
            <Button size="small" variant="subtle">
              Reset
            </Button>
          }
        >
          <div style={{ width: 220 }}>
            <Select<string> items={undefinedItems} defaultValue="ssp">
              <SelectTrigger className="w-full" size="sm" aria-label="Model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {undefinedItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Toolbar>
      </Stack>
    );
  },
};

const controls = [
  { id: "AC-2", title: "Account management", gap: true },
  { id: "AC-3", title: "Access enforcement", gap: false },
  { id: "AU-2", title: "Event logging", gap: true },
  { id: "CM-6", title: "Configuration settings", gap: false },
  { id: "IA-2", title: "Identification and authentication", gap: false },
  { id: "SC-7", title: "Boundary protection", gap: true },
];

function LiveDemo() {
  const [query, setQuery] = useState("");
  const [gaps, setGaps] = useState(false);
  const q = query.trim().toLowerCase();
  const rows = controls.filter(
    (c) =>
      (!gaps || c.gap) &&
      (!q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)),
  );
  return (
    <div style={{ width: 560 }}>
      <Toolbar
        search={query}
        onSearch={setQuery}
        placeholder="Control or title"
        actions={
          <Text size="small" color="color.text.subtle">
            {rows.length} of {controls.length} controls
          </Text>
        }
      >
        <FilterChip label="Gaps" isActive={gaps} onClick={() => setGaps((v) => !v)} />
      </Toolbar>
      <Table label="Controls">
        <thead>
          <tr>
            <Table.Header width={90}>Control</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header width={120}>Status</Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <Table.Row key={c.id}>
              <Table.Id id={c.id} />
              <Table.Cell>{c.title}</Table.Cell>
              <Table.Cell>
                {c.gap ? (
                  <Badge variant="secondary" tone="danger">
                    Gap
                  </Badge>
                ) : (
                  <Badge variant="secondary" tone="success">
                    Satisfied
                  </Badge>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

/** Typing narrows the table under it, the chip narrows it again, and the count at the end says how many remain. */
export const Live: Story = { render: () => <LiveDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Toolbar
            search=""
            onSearch={() => {}}
            placeholder="Search controls"
            actions={
              <Button size="small" variant="primary" iconBefore={<Plus />}>
                New control
              </Button>
            }
          >
            <FilterChip label="Owner" />
          </Toolbar>
        }
        doText="Every control in the row is the small size, so the row is one height."
        dont={
          <Toolbar
            search=""
            onSearch={() => {}}
            placeholder="Search controls"
            actions={
              <Button variant="primary" iconBefore={<Plus />}>
                New control
              </Button>
            }
          >
            <FilterChip label="Owner" />
          </Toolbar>
        }
        dontText="A default-size Button among small controls. The row grows to it and nothing else lines up."
      />
      <Pair
        do={
          <Toolbar
            actions={
              <>
                <Button size="small">Export</Button>
                <Button size="small" variant="primary">
                  New control
                </Button>
              </>
            }
          >
            <FilterChip label="Owner" />
          </Toolbar>
        }
        doText="Two actions at the end, the primary last. Past five, the rest go under a More menu."
        dont={
          <Toolbar
            actions={
              <>
                {["Export", "Import", "Print", "Archive", "Share", "Duplicate"].map((a) => (
                  <Button key={a} size="small">
                    {a}
                  </Button>
                ))}
                <Button size="small" variant="primary">
                  New control
                </Button>
              </>
            }
          >
            <FilterChip label="Owner" />
          </Toolbar>
        }
        dontText="Seven actions. The toolbar becomes a second navigation and the primary is lost among them."
      />
      <Pair
        do={
          <Toolbar
            search=""
            onSearch={() => {}}
            placeholder="Search controls"
            actions={
              <Button size="small" variant="primary">
                New control
              </Button>
            }
          />
        }
        doText="Search at the start, the action at the end: narrow first, act last."
        dont={
          <Toolbar search="" onSearch={() => {}} placeholder="Search controls">
            <Button size="small" variant="primary">
              New control
            </Button>
          </Toolbar>
        }
        dontText="The primary as a child. It sits beside the search where a filter goes, and the end of the row is empty."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Toolbar {...args}>
      <FilterChip label="Owner" />
      <FilterChip label="Status" />
    </Toolbar>
  ),
};
