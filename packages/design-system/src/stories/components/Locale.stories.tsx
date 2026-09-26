import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";

import { DateTime } from "../../components";
import { LedgerProvider, useLedgerLocale, type LedgerMessages } from "../../mode";
import { PreviewNavigation } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Locale",
  component: LedgerProvider,
  parameters: { layout: "padded" },
} satisfies Meta<typeof LedgerProvider>;
export default meta;
type Story = StoryObj;

/** Half past midnight UTC on 19 September 2026: the evening of the 18th in the Americas. */
const instant = "2026-09-19T00:30:00.000Z";

/** One provider near the root, with the reader's zone: every date inside shows in it. */
export const ReadersZone: Story = {
  name: "The reader's zone",
  render: () => (
    <LedgerProvider locale="en-US" timeZone="America/New_York">
      <Text>
        Updated <DateTime value="2026-09-19T00:30:00.000Z" showTimeZone />
      </Text>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent(/Updated Sep 18, 2026, 8:30\sPM\sEDT/);
  },
};

function Row({ zone, children }: { zone: string; children: ReactNode }) {
  return (
    <Inline space="space.100" alignBlock="baseline" shouldWrap>
      <Text size="small" color="color.text.subtle">
        {zone}
      </Text>
      {children}
    </Inline>
  );
}

/**
 * An instant moves with the zone: the same moment is Sep 18 in Los Angeles and Sep 19 in Tokyo.
 * A calendar day, an ISO date with no time, never moves.
 */
export const InstantsAndDays: Story = {
  name: "Instants and days",
  render: () => (
    <Stack space="space.100">
      {["America/Los_Angeles", "Europe/London", "Asia/Tokyo"].map((zone) => (
        <LedgerProvider key={zone} timeZone={zone}>
          <Inline space="space.100" alignBlock="baseline" shouldWrap>
            <Text size="small" color="color.text.subtle">
              {zone}
            </Text>
            <DateTime value="2026-09-19T00:30:00.000Z" showTimeZone />
            <Text size="small" color="color.text.subtle">
              due
            </Text>
            <DateTime value="2026-09-18" />
          </Inline>
        </LedgerProvider>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    // Each row holds the instant, then the day: Los Angeles, London, Tokyo.
    const [losAngeles, , london, , tokyo] = canvasElement.querySelectorAll("time");
    await expect(losAngeles).toHaveTextContent(/Sep 18, 2026/);
    await expect(london).toHaveTextContent(/Sep 19, 2026/);
    await expect(tokyo).toHaveTextContent(/Sep 19, 2026/);
    const days = [...canvasElement.querySelectorAll("time")].filter((_, index) => index % 2);
    for (const day of days) await expect(day).toHaveTextContent("Sep 18, 2026");
  },
};

function Formatted() {
  const { locale, timeZone, formatDate, formatDay, formatNumber } = useLedgerLocale();
  return (
    <Row zone={`${locale}, ${timeZone}`}>
      <Text data-testid={`formatted-${locale}`}>
        {formatDate(Date.parse(instant), { dateStyle: "medium", timeStyle: "short" })} ·{" "}
        {formatDay({ year: 2026, month: 9, day: 18 }, { dateStyle: "medium" })} ·{" "}
        {formatNumber(1234.5)}
      </Text>
    </Row>
  );
}

/** `useLedgerLocale()` hands your own code the provider's formatters: an instant, a day and a number, in each locale's words. */
export const Formatters: Story = {
  render: () => (
    <Stack space="space.100">
      <LedgerProvider locale="en-US" timeZone="America/Chicago">
        <Formatted />
      </LedgerProvider>
      <LedgerProvider locale="en-GB" timeZone="Europe/London">
        <Formatted />
      </LedgerProvider>
      <LedgerProvider locale="de-DE" timeZone="Europe/Berlin">
        <Formatted />
      </LedgerProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("formatted-en-US")).toHaveTextContent("1,234.5");
    await expect(canvas.getByTestId("formatted-en-GB")).toHaveTextContent("18 Sept 2026");
    await expect(canvas.getByTestId("formatted-de-DE")).toHaveTextContent("19.09.2026, 02:30");
    await expect(canvas.getByTestId("formatted-de-DE")).toHaveTextContent("1.234,5");
  },
};

/** Module constants: a new object on every render would rebuild the formatters. */
const french = {
  previousRecord: "Fiche précédente",
  nextRecord: "Fiche suivante",
  openFullRecord: "Ouvrir la fiche dans un nouvel onglet",
  recordPosition: "Fiche {position} sur {total}",
} satisfies Partial<LedgerMessages>;
const shorter = { nextRecord: "Suivante" } satisfies Partial<LedgerMessages>;

function Records() {
  const [position, setPosition] = useState(1);
  return (
    <PreviewNavigation
      position={position}
      total={3}
      onPrevious={() => setPosition((value) => value - 1)}
      onNext={() => setPosition((value) => value + 1)}
      openLink={<a href={`#fiche-${position}`} target="_blank" rel="noopener noreferrer" />}
    />
  );
}

/**
 * The kit's own words are messages: translate them once at the provider. A nested provider
 * overrides the few it names and inherits the rest, here the shorter "Suivante".
 */
export const Messages: Story = {
  render: () => (
    <LedgerProvider locale="fr-FR" messages={french}>
      <LedgerProvider messages={shorter}>
        <Records />
      </LedgerProvider>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Fiche précédente" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Suivante" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Fiche 2 sur 3");
    await expect(
      canvas.getByRole("link", { name: "Ouvrir la fiche dans un nouvel onglet" }),
    ).toHaveAttribute("href", "#fiche-2");
  },
};

/** `direction` sets `dir` on the provider's element, with `lang` from `locale`; digits and dates follow the locale. */
export const RightToLeft: Story = {
  name: "Right to left",
  render: () => (
    <LedgerProvider locale="ar-EG" direction="rtl" timeZone="Africa/Cairo">
      <Text>
        آخر تحديث <DateTime value={instant} format="date" />
      </Text>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const date = canvasElement.querySelector("time");
    const scope = date?.closest("[dir]");
    await expect(scope).toHaveAttribute("dir", "rtl");
    await expect(scope).toHaveAttribute("lang", "ar-EG");
    await expect(date).toHaveTextContent("٢٠٢٦");
  },
};
