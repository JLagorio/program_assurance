import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Badge,
  Button,
  Dialog,
  Field,
  KeyValue,
  NativeSelect,
  Person,
  Table,
  Textarea,
  Id,
} from "@/ds/primitives";
import { behindPage, evidence, people } from "../_lib/fixtures";

const noop = () => {};

const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  // A Dialog traps focus and locks the page; each docs example gets its own frame.
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "560px" } },
  },
  decorators: [behindPage],
  args: { open: true, onClose: noop, title: "Submit for authorization", children: null },
  argTypes: {
    open: { control: "boolean" },
    width: { control: "inline-radio", options: ["md", "lg"] },
    title: { control: "text" },
    description: { control: "text" },
    onClose: { control: false },
    children: { control: false },
    aside: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Description, a form body, aside facts and a footer. onClose is a no-op here. */
export const Open: Story = {
  args: {
    description: "This locks PKG-2026-114 and notifies the authorizing official.",
    children: (
      <div className="space-y-4">
        <Field label="Authorizing official">
          <NativeSelect defaultValue="K. Lund">
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Decision memo" hint="Attached to the authorization record.">
          <Textarea defaultValue="All moderate-baseline controls assessed. Seven findings remain open under POA&M with owners and due dates assigned." />
        </Field>
      </div>
    ),
    aside: (
      <dl>
        <KeyValue label="Package">
          <Id>PKG-2026-114</Id>
        </KeyValue>
        <KeyValue label="Controls">
          <span className="tnum">340</span>
        </KeyValue>
        <KeyValue label="Satisfied">
          <span className="tnum">212</span>
        </KeyValue>
        <KeyValue label="Open findings">
          <Badge tone="danger" size="xs">
            7
          </Badge>
        </KeyValue>
        <KeyValue label="Submitted by">
          <Person name="D. Reyes" />
        </KeyValue>
      </dl>
    ),
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Submit package</Button>
      </>
    ),
  },
};

/** Large width: a dense table as the body. */
export const Large: Story = {
  args: {
    width: "lg",
    title: "Link evidence",
    description: "Evidence already collected for AC-2(3). Pick what supports this assessment.",
    children: (
      <Table>
        <thead>
          <tr>
            <Table.Header className="w-[96px]">Evidence</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header className="w-[120px]">Kind</Table.Header>
            <Table.Header className="w-[72px] text-right">Age</Table.Header>
          </tr>
        </thead>
        <tbody>
          {evidence.map((e) => (
            <Table.Row key={e.id}>
              <Table.Id id={e.id} />
              <Table.Cell>{e.title}</Table.Cell>
              <Table.Cell>
                <Badge size="xs">{e.kind}</Badge>
              </Table.Cell>
              <Table.Cell className="text-right">
                {e.age.endsWith("d") && parseInt(e.age, 10) > 30 ? (
                  <Badge tone="warning" size="xs">
                    {e.age}
                  </Badge>
                ) : (
                  <span className="tnum text-muted-foreground">{e.age}</span>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    ),
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Link 2 items</Button>
      </>
    ),
  },
};
