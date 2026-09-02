import type { Meta, StoryObj } from "@storybook/react-vite";

import { Id, Resizable } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Resizable",
  component: Resizable,
  tags: ["autodocs"],
  args: { orientation: "horizontal", children: null },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    children: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Resizable>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = ["AC-2", "AC-6(1)", "AU-6", "CM-6", "IR-4", "SC-7", "SI-4"];

function Pane({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-subtle px-3 py-1.5 text-11 font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 text-13">{children}</div>
    </div>
  );
}

/** A list beside its detail. Drag the hairline; it also takes arrow keys when focused. */
export const Playground: Story = {
  render: (args) => (
    <div className="h-[320px] w-[720px] overflow-hidden rounded-lg border border-border">
      <Resizable {...(args.orientation ? { orientation: args.orientation } : {})}>
        <Resizable.Panel defaultSize={32} minSize={20}>
          <Pane label="Controls">
            <ul className="space-y-1">
              {rows.map((r) => (
                <li key={r}>
                  <Id>{r}</Id>
                </li>
              ))}
            </ul>
          </Pane>
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel minSize={30}>
          <Pane label="AC-2 · Account management">
            The organization manages information system accounts, including establishing,
            activating, modifying, reviewing, disabling, and removing accounts.
          </Pane>
        </Resizable.Panel>
      </Resizable>
    </div>
  ),
};

/** A vertical group nested in the right panel: work pane above, inspector below. */
export const Nested: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-2">
      <div className="h-[360px] w-[720px] overflow-hidden rounded-lg border border-border">
        <Resizable>
          <Resizable.Panel defaultSize={28} minSize={18}>
            <Pane label="Families">
              <ul className="space-y-1 text-muted-foreground">
                {["Access Control", "Audit", "Configuration", "Incident Response"].map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Pane>
          </Resizable.Panel>
          <Resizable.Handle />
          <Resizable.Panel>
            <Resizable orientation="vertical">
              <Resizable.Panel defaultSize={62} minSize={30}>
                <Pane label="Assessment">Result, method, and the evidence behind it.</Pane>
              </Resizable.Panel>
              <Resizable.Handle />
              <Resizable.Panel minSize={20}>
                <Pane label="Inspector">Selected row facts.</Pane>
              </Resizable.Panel>
            </Resizable>
          </Resizable.Panel>
        </Resizable>
      </div>
      <Spec>handle: 1px border, 9px hit area · primary on hover, drag, focus · sizes in %</Spec>
    </div>
  ),
};
