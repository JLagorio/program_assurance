import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { LedgerProvider, PreviewNavigation, Stack, Text } from "../..";

const meta = {
  title: "Patterns/PreviewNavigation",
  component: PreviewNavigation,
  parameters: { layout: "centered" },
} satisfies Meta<typeof PreviewNavigation>;
export default meta;
type Story = StoryObj;

function Example() {
  const [position, setPosition] = useState(1);
  return (
    <Stack space="space.150">
      <Text>Record {position}</Text>
      <PreviewNavigation
        position={position}
        total={3}
        onPrevious={() => setPosition((value) => value - 1)}
        onNext={() => setPosition((value) => value + 1)}
        openLink={<a href={`#record-${position}`} target="_blank" rel="noopener noreferrer" />}
      />
    </Stack>
  );
}

export const Collection: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole("button", { name: "Previous record" });
    const next = canvas.getByRole("button", { name: "Next record" });
    await expect(previous).toBeDisabled();
    await userEvent.click(next);
    await expect(canvas.getByRole("status")).toHaveTextContent("2 of 3 records");
    await expect(canvas.getByRole("link", { name: "Open full record in new tab" })).toHaveAttribute(
      "href",
      "#record-2",
    );
    await userEvent.click(next);
    await expect(next).toBeDisabled();
    await expect(previous).toHaveFocus();
    await userEvent.click(previous);
    await expect(canvas.getByRole("status")).toHaveTextContent("2 of 3 records");
  },
};

export const OutsideResults: Story = {
  render: () => (
    <PreviewNavigation
      position={0}
      total={3}
      openLink={<a href="#record" target="_blank" rel="noopener noreferrer" />}
    />
  ),
};

export const Localized: Story = {
  render: () => (
    <LedgerProvider
      locale="es"
      messages={{
        previousRecord: "Registro anterior",
        nextRecord: "Registro siguiente",
        openFullRecord: "Abrir registro en otra pestaña",
        recordPosition: "Registro {position} de {total}",
      }}
    >
      <Example />
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Registro siguiente" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Registro 2 de 3");
    await expect(canvas.getByRole("button", { name: "Registro anterior" })).toBeEnabled();
    await expect(
      canvas.getByRole("link", { name: "Abrir registro en otra pestaña" }),
    ).toHaveAttribute("href", "#record-2");
  },
};
