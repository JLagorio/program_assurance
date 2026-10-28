import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import {
  SpreadsheetFormatting,
  SpreadsheetToolbar,
  type SpreadsheetFormat,
  type SpreadsheetFormattingProps,
} from "../../patterns/spreadsheet";
const meta = {
  title: "Patterns/Spreadsheet formatting",
  component: SpreadsheetFormatting,
  parameters: { layout: "padded" },
  args: { onFormat: fn(), onBorders: fn() },
} satisfies Meta<typeof SpreadsheetFormatting>;
export default meta;
type Story = StoryObj<typeof meta>;
function Controls(args: SpreadsheetFormattingProps) {
  const [style, setStyle] = useState<SpreadsheetFormat>(args.style ?? {});
  const [mixed, setMixed] = useState(args.mixed ?? []);
  return (
    <SpreadsheetToolbar label="Format selected cells">
      <SpreadsheetFormatting
        {...args}
        style={style}
        mixed={mixed}
        onFormat={(patch) => {
          args.onFormat(patch);
          setStyle((previous) => ({ ...previous, ...patch }));
          setMixed((previous) => previous.filter((key) => !(key in patch)));
        }}
      />
    </SpreadsheetToolbar>
  );
}
export const Default: Story = {
  render: (args) => (
    <SpreadsheetToolbar label="Format selected cells">
      <SpreadsheetFormatting {...args} />
    </SpreadsheetToolbar>
  ),
};
export const Formatting: Story = {
  tags: ["!manifest"],
  render: (args) => {
    const [style, setStyle] = useState<SpreadsheetFormat>(args.style ?? {});
    return (
      <SpreadsheetToolbar label="Format selected cells">
        <SpreadsheetFormatting
          {...args}
          style={style}
          onFormat={(patch) => {
            args.onFormat(patch);
            setStyle((current) => ({ ...current, ...patch }));
          }}
        />
      </SpreadsheetToolbar>
    );
  },
  play: async ({ canvas, canvasElement, args }) => {
    const user = userEvent.setup();
    await user.click(canvas.getByRole("button", { name: "Bold" }));
    await expect(args.onFormat).toHaveBeenLastCalledWith({ bold: true });
    await expect(canvas.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(canvas.getByRole("button", { name: "Text alignment" }));
    const page = within(canvasElement.ownerDocument.body);
    await user.click(await page.findByRole("menuitemradio", { name: "Align center" }));
    await expect(args.onFormat).toHaveBeenLastCalledWith({ align: "center" });
    await user.click(canvas.getByRole("button", { name: "Cell borders" }));
    await user.click(await page.findByRole("button", { name: "Outside borders" }));
    await expect(args.onBorders).toHaveBeenCalledWith(
      "outside",
      expect.objectContaining({ style: "solid", width: 1 }),
    );
    await waitFor(() =>
      expect(page.queryByRole("button", { name: "Outside borders" })).not.toBeInTheDocument(),
    );
  },
};
export const MixedSelection: Story = {
  args: {
    style: { bold: true, fontSize: 12, format: "currency" },
    mixed: ["bold", "fontSize", "format", "fontFamily"],
  },
  render: (args) => <Controls {...args} />,
  play: async ({ canvas, args }) => {
    const user = userEvent.setup();
    const bold = canvas.getByRole("button", { name: "Bold" });
    await expect(bold).toHaveAttribute("aria-pressed", "mixed");
    await expect(canvas.getByRole("combobox", { name: "Font family" })).toHaveTextContent("Mixed");
    await expect(canvas.getByRole("combobox", { name: "Number format" })).toHaveTextContent(
      "Mixed",
    );
    await user.click(bold);
    await expect(args.onFormat).toHaveBeenLastCalledWith({ bold: true });
    await expect(bold).toHaveAttribute("aria-pressed", "true");
  },
};
export const ProtectedFormats: Story = {
  args: { numberFormatDisabled: true },
  render: (args) => <Controls {...args} />,
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("button", { name: "Format as currency" })).toBeDisabled();
    await expect(canvas.getByRole("combobox", { name: "Number format" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Wrap text" }));
    await expect(args.onFormat).toHaveBeenLastCalledWith({ wrap: true });
  },
};
