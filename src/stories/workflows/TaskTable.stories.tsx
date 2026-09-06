import type { Meta, StoryObj } from "@storybook/react-vite";

import { myWorkPresets, programPresets, TaskTable } from "@/components/app/task-table";
import { sortTasks, tasksAssignedTo, tasksForProgram, tasksWaitingOn } from "@/lib/tasks";

const me = "Priya Raghavan";
const program = "PRG-1041";
const empty = { title: "No tasks match", description: "Change the view or the filters." };
const add = { program, subject: { kind: "program" as const, id: program } };

const meta = {
  title: "Product/Workflows/Task table",
  component: TaskTable,
  parameters: { layout: "padded", a11y: { test: "error" } },
  globals: { theme: "ledger" },
} satisfies Meta<typeof TaskTable>;
export default meta;
type Story = StoryObj;

/** The program's Tasks tab: rows banded by when, a saved view per question, every cell edited in place. */
export const ProgramTab: Story = {
  tags: ["app-contract"],
  render: () => (
    <TaskTable
      tasks={tasksForProgram(program)}
      me={me}
      label="Program tasks"
      showSubject
      presets={programPresets(me)}
      defaultPreset="open"
      add={add}
      empty={empty}
    />
  ),
};

/** My work: what is yours and what you wait on, across programs. */
export const MyWork: Story = {
  render: () => {
    const all = sortTasks([
      ...new Map([...tasksAssignedTo(me), ...tasksWaitingOn(me)].map((t) => [t.id, t])).values(),
    ]);
    return (
      <TaskTable
        tasks={all}
        me={me}
        label="My work"
        showSubject
        presets={myWorkPresets}
        defaultPreset="mine"
        empty={empty}
      />
    );
  },
};

/** Banded by assignee: who has what. */
export const ByAssignee: Story = {
  render: () => (
    <TaskTable
      tasks={tasksForProgram(program)}
      me={me}
      label="Program tasks"
      showSubject
      defaultGroup="assignee"
      presets={programPresets(me)}
      defaultPreset="all"
      add={add}
      empty={empty}
    />
  ),
};

/** No bands: one list, sorted. */
export const Flat: Story = {
  render: () => (
    <TaskTable
      tasks={tasksForProgram(program)}
      me={me}
      label="Program tasks"
      showSubject
      defaultGroup=""
      presets={programPresets(me)}
      defaultPreset="all"
      add={add}
      empty={empty}
    />
  ),
};

/** A row open beside the list: the properties, the note, the task's own log. ⌘↑ and ⌘↓ step through the rows. */
export const PanelOpen: Story = {
  tags: ["app-contract"],
  render: () => (
    <TaskTable
      tasks={tasksForProgram(program)}
      me={me}
      label="Program tasks"
      showSubject
      presets={programPresets(me)}
      defaultPreset="open"
      add={add}
      empty={empty}
      initialOpen="TSK-0002"
    />
  ),
};

/** Nothing to show. */
export const Empty: Story = {
  render: () => (
    <TaskTable
      tasks={[]}
      me={me}
      label="Program tasks"
      showSubject
      empty={{ title: "No tasks", description: "Ask for something from a record's log bar." }}
    />
  ),
};
