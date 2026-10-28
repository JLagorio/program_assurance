import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Alert, AlertDescription, Button, Id, TextLink } from "../../components";
import { Citation } from "../../patterns/citation";
import { Related } from "../../patterns/related";

const meta = {
  title: "Patterns/Citation",
  component: Citation,
  parameters: { layout: "padded" },
  args: {
    title: "Retention handbook · Version 3",
    link: <a href="#source-page-8" />,
    meta: "Sam Rivera · Page 8 · Retention",
    passage:
      "Records are retained for seven years.\n\nThe original source remains available for inspection.",
    passageLabel: "Quoted passage",
  },
} satisfies Meta<typeof Citation>;
export default meta;
type Story = StoryObj<typeof meta>;
const nativeRef = createRef<HTMLLIElement>();

export const Basic: Story = {
  render: (args) => (
    <Related title="Sources" layout="cards" count={1}>
      <Citation
        {...args}
        cite="https://example.com/handbook#page=8"
        source={<TextLink href="#source-page-8">Read cited passage</TextLink>}
        backlinks={<TextLink href="#document-42">Open referring document</TextLink>}
      />
    </Related>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const quote = canvas.getByRole("blockquote", { name: "Quoted passage" });
    await expect(quote).toHaveAttribute("cite", "https://example.com/handbook#page=8");
    await expect(quote).toHaveTextContent("Records are retained for seven years.");
    await expect(canvas.getByRole("link", { name: "Read cited passage" })).toHaveAttribute(
      "href",
      "#source-page-8",
    );
    await expect(canvas.getByRole("link", { name: "Open referring document" })).toHaveAttribute(
      "href",
      "#document-42",
    );
  },
};

export const NativeProps: Story = {
  tags: ["!manifest"],
  render: (args) => (
    <Related title="Sources" layout="cards" count={1}>
      <Citation
        {...args}
        ref={nativeRef}
        data-testid="citation"
        id="citation-example"
        tabIndex={-1}
      />
    </Related>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(nativeRef.current).toBe(canvas.getByTestId("citation"));
    await expect(nativeRef.current).toHaveAttribute("id", "citation-example");
    nativeRef.current?.focus();
    await expect(nativeRef.current).toHaveFocus();
  },
};

export const LongSourceAndQuote: Story = {
  render: (args) => (
    <Related title="Sources" layout="cards" count={1}>
      <Citation
        {...args}
        title="International documentation handbook describing source preservation across regional service migrations"
        properties={[
          { label: "Source identifier", value: <Id className="break-all">{"a".repeat(80)}</Id> },
        ]}
        passage="Die Aufbewahrungsfrist für die Dokumentation bleibt unverändert. This quoted passage preserves its original line breaks and never truncates the source text."
        backlinks={
          <>
            <TextLink href="#record-1">Open first referring document</TextLink>
            <TextLink href="#record-2">Open second referring document</TextLink>
          </>
        }
      />
    </Related>
  ),
};

function RetriableSource() {
  const [failed, setFailed] = useState(true);
  return (
    <Related title="Sources" layout="cards" count={1}>
      <Citation
        title="Retention handbook"
        passage="The original source remains available for inspection."
        passageLabel="Quoted passage"
        source={
          failed ? (
            <>
              <Alert tone="danger" role="alert">
                <AlertDescription>The source could not be loaded.</AlertDescription>
              </Alert>
              <Button size="small" onClick={() => setFailed(false)}>
                Retry source
              </Button>
            </>
          ) : (
            <TextLink href="#source">Read cited passage</TextLink>
          )
        }
        backlinks={<TextLink href="#record">Open referring document</TextLink>}
      >
        <Related title="Passage discussions" count={0} empty="No discussions yet" />
      </Citation>
    </Related>
  );
}
export const SourceFailure: Story = {
  tags: ["!manifest"],
  render: () => <RetriableSource />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("The source could not be loaded.");
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(canvas.getByRole("button", { name: "Retry source" }));
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(canvas.getByRole("link", { name: "Read cited passage" })).toBeVisible(),
    );
    await expect(canvas.getByRole("blockquote", { name: "Quoted passage" })).toHaveTextContent(
      "The original source remains available",
    );
  },
};
