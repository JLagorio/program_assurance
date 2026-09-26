import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Absent, Eyebrow, KeyValue, Prose, tones } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Typography",
  component: Eyebrow,
  parameters: { layout: "padded" },
  args: { children: "Rationale" },
} satisfies Meta<typeof Eyebrow>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Eyebrow in every tone and as a heading; Absent; Prose in every tone. */
export const TypographyMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Eyebrow">
        {tones.map((t) => (
          <Eyebrow key={t} tone={t}>
            {t}
          </Eyebrow>
        ))}
      </Specimens>
      <Specimens title="Eyebrow as a section heading (h3) and as a label (dt)">
        <Eyebrow as="h3">By supplier origin</Eyebrow>
        <dl>
          <Eyebrow as="dt">Algorithm</Eyebrow>
          <dd>SHA-256 with RSA</dd>
        </dl>
      </Specimens>
      <Specimens title="Absent, and Absent with a label for a screen reader">
        <Text>
          Assessor: <Absent />
        </Text>
        <Text>
          Assessor: <Absent label="Not recorded" />
        </Text>
      </Specimens>
      <Stack space="space.200" className="max-w-layout-measure">
        {tones.map((t) => (
          <Prose key={t} label={`${t} prose`} tone={t}>
            The condition, stated against CCI-001453. Management traffic on the tactical edge
            segment is not cryptographically protected.
          </Prose>
        ))}
      </Stack>
    </Stack>
  ),
};

/** In a rail: an Eyebrow heads a group of rows; Prose carries the paragraphs. */
export const InRail: Story = {
  render: () => (
    <Box style={{ maxWidth: 320 }} className="border-s border-default ps-200">
      <Stack space="space.300">
        <div>
          <Eyebrow as="h3" className="pb-050">
            Schedule
          </Eyebrow>
          <KeyValue label="Frequency">Quarterly</KeyValue>
          <KeyValue label="Next due">12 Nov 2026</KeyValue>
          <KeyValue label="Assessor">
            <Absent />
          </KeyValue>
        </div>
        <Prose label="Rationale" tone="warning">
          The July run had one exception where the approver also released the payment. Compensating
          review in place.
        </Prose>
        <Prose label="Objective">
          Payables are approved and paid by different people, so no one person can create and settle
          a vendor invoice.
        </Prose>
      </Stack>
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<Eyebrow>Rationale</Eyebrow>}
        doText="One to three words: a name for what follows."
        dont={
          <Eyebrow>The rationale the assessor gave for accepting the exception in July</Eyebrow>
        }
        dontText="A sentence in uppercase. An eyebrow is a label, and uppercase is hard to read past three words."
      />
      <Pair
        do={
          <Prose label="Rationale">
            The July run had one exception where the approver also released the payment.
          </Prose>
        }
        doText="A labelled paragraph is Prose: the eyebrow over the text."
        dont={
          <Text>
            <Text weight="medium">Rationale: </Text>
            The July run had one exception where the approver also released the payment.
          </Text>
        }
        dontText="A bold run-in label with a colon. It reads as part of the sentence, and a column of them has no edge."
      />
      <Pair
        do={
          <Inline space="space.100" alignBlock="baseline">
            <Text color="color.text.subtle">Assessor</Text>
            <Absent />
          </Inline>
        }
        doText="Nothing there is a muted dash, in the value's place."
        dont={
          <Inline space="space.100" alignBlock="baseline">
            <Text color="color.text.subtle">Assessor</Text>
            <Text>N/A</Text>
          </Inline>
        }
        dontText="N/A in the default colour. It says not applicable, which is a different fact, and it reads as loud as a value."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

const statement = `The organization disables accounts that have been inactive for 90 days.

Exceptions need a ticket approved by the system owner.
Each exception lists the account, the reason and the date it ends.`;

/** Authored text as it was written: a blank line starts a paragraph and a line break stays a line break. */
export const ProseParagraphs: Story = {
  render: () => (
    <Box style={{ maxWidth: 480 }}>
      <Prose label="Implementation statement">{statement}</Prose>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector<HTMLElement>('[data-slot="prose"]')!;
    const paragraphs = prose.querySelectorAll("p");
    await expect(paragraphs).toHaveLength(2);
    await expect(paragraphs[0]).toHaveTextContent(
      "The organization disables accounts that have been inactive for 90 days.",
    );
    await expect(getComputedStyle(paragraphs[1]!).whiteSpace).toBe("pre-line");
    // The line break in the second paragraph is kept: it takes two lines at any width.
    const lineHeight = parseFloat(getComputedStyle(paragraphs[1]!).lineHeight);
    await expect(paragraphs[1]!.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      lineHeight * 2 - 1,
    );
  },
};

const narrative = `Accounts are managed in the **identity provider**, and reviewed *every quarter*.

1. The owner exports the account list with \`idp export --inactive 90\`.
2. The assessor compares it with the [account standard](https://example.com/standards/accounts).
   - Accounts past 90 days are disabled.
   - Service accounts are listed separately.
3. Exceptions go to the system owner.
   Each names the account and the day it ends.

\`\`\`
idp export --inactive 90 --format csv
\`\`\`

<script>alert("not run")</script> [a link that is refused](javascript:alert(1)) and snake_case_names stay as typed.`;

/**
 * `markdown` renders a safe subset: paragraphs, bulleted and numbered lists (nested too),
 * emphasis, strong, inline and fenced code, and links. HTML in the text shows as the characters
 * typed, and a link whose address is not http(s), mailto, tel or relative shows as its words.
 */
export const ProseMarkdown: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Prose label="Narrative" markdown={narrative} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const prose = canvasElement.querySelector<HTMLElement>('[data-slot="prose"]')!;
    const canvas = within(prose);
    await expect(canvas.getByText("identity provider").tagName).toBe("STRONG");
    await expect(canvas.getByText("every quarter").tagName).toBe("EM");
    await expect(canvas.getByText("idp export --inactive 90").tagName).toBe("CODE");
    const lists = canvas.getAllByRole("list");
    await expect(lists[0]!.tagName).toBe("OL");
    await expect(within(lists[0]!).getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
    await expect(lists[1]!.tagName).toBe("UL");
    await expect(lists[0]!.contains(lists[1]!)).toBe(true);
    // An item's own line break stays a line break, as a paragraph's does.
    const third = lists[0]!.children[2] as HTMLElement;
    await expect(third).toHaveTextContent("Exceptions go to the system owner.");
    await expect(getComputedStyle(third).whiteSpace).toBe("pre-line");
    await expect(third.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      parseFloat(getComputedStyle(third).lineHeight) * 2 - 1,
    );
    const link = canvas.getByRole("link", { name: "account standard" });
    await expect(link).toHaveAttribute("href", "https://example.com/standards/accounts");
    await expect(prose.querySelector("pre code")).toHaveTextContent(
      "idp export --inactive 90 --format csv",
    );
    // No HTML is injected, and the refused link is text.
    await expect(prose.querySelector("script")).toBeNull();
    await expect(prose).toHaveTextContent('<script>alert("not run")</script>');
    await expect(canvas.queryByRole("link", { name: "a link that is refused" })).toBeNull();
    await expect(canvas.getByText(/a link that is refused/)).toBeInTheDocument();
    await expect(prose).toHaveTextContent("snake_case_names");
  },
};

/** `renderLink` sends Markdown links through a router's link element; the kit stays router-free. */
export const ProseRouterLinks: Story = {
  render: () => (
    <Box style={{ maxWidth: 480 }}>
      <Prose
        markdown="See [AC-2](/controls/ac-2) and [AC-3](/controls/ac-3) for the related controls."
        renderLink={(href) => <a href={`#route${href}`} data-router="true" />}
      />
    </Box>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "AC-2" });
    await expect(link).toHaveAttribute("href", "#route/controls/ac-2");
    await expect(link).toHaveAttribute("data-router", "true");
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
  },
};

/** `size="large"` for reading text at the measure, such as a statement in a record body. */
export const ProseLarge: Story = {
  render: () => (
    <Box className="max-w-layout-measure">
      <Prose size="large">{statement}</Prose>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const paragraph = canvasElement.querySelector("p")!;
    await expect(paragraph).toHaveClass("font-body-large");
  },
};

/** Absent with a `label`: the dash is hidden from a screen reader, which hears the label in its place. */
export const AbsentLabelled: Story = {
  render: () => (
    <Box style={{ maxWidth: 300 }}>
      <KeyValue label="Assessor">
        <Absent label="Not recorded" />
      </KeyValue>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const absent = canvasElement.querySelector<HTMLElement>('[data-slot="absent"]')!;
    await expect(absent.querySelector('[aria-hidden="true"]')).toHaveTextContent("—");
    await expect(within(absent).getByText("Not recorded")).toHaveAttribute(
      "data-slot",
      "visually-hidden",
    );
  },
};
