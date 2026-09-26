import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Badge,
  Button,
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  Id,
} from "../../components";
import { SearchDialog, type SearchResult } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/SearchDialog",
  component: SearchDialog,
  parameters: { layout: "padded" },
  args: { open: false, onOpenChange: fn(), onSelect: fn(), results: [] },
} satisfies Meta<typeof SearchDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

/* Records of three kinds. Each id is an internal key, never shown and never matched: the one for
   Fleet telemetry contains "de", and a search for "de" must not find it through that. */
const records: SearchResult[] = [
  {
    id: "5a0e2c41-7d0b-4c55-9d7e-3f6a2c1b9e10",
    identifier: "PRG-014",
    title: "Payload integration",
    meta: "Program · Sarah Chen",
    group: "Programs",
    badge: (
      <Badge variant="secondary" size="xsmall" tone="information">
        Authorise
      </Badge>
    ),
  },
  {
    id: "8b61f0d2-1e4a-4a8c-b0d9-6c2e7a5f3b21",
    identifier: "PRG-021",
    title: "Ground segment refresh",
    meta: "Program · Omar Haddad",
    group: "Programs",
    badge: (
      <Badge variant="secondary" size="xsmall" tone="neutral">
        Assess
      </Badge>
    ),
  },
  {
    id: "d3de9e1a-4b0c-4f7e-9e61-1c2dde0a7b55",
    identifier: "PRG-030",
    title: "Fleet telemetry",
    meta: "Program · Dana Whitfield",
    group: "Programs",
  },
  {
    id: "4f7a1b93-0c52-4e18-a6b9-7e3f5c1a2b76",
    identifier: "PRG-044",
    title: "Classified payload study",
    meta: "Restricted · Omar Haddad",
    group: "Programs",
    disabledReason: "You do not have access to this program.",
  },
  {
    id: "0c9a7b3e-5f21-4d6a-8e0b-2a4c6e8f1d32",
    identifier: "RSK-0412",
    title: "Unpatched ground station firmware",
    meta: "Risk · High",
    group: "Risks",
    badge: (
      <Badge variant="secondary" size="xsmall" tone="danger">
        Open
      </Badge>
    ),
  },
  {
    id: "6e2b8d4f-0a13-4c7e-9b5d-7f1a3c5e9b43",
    identifier: "RSK-0388",
    title: "Vendor access not reviewed",
    meta: "Risk · Moderate",
    group: "Risks",
  },
  {
    id: "2f4d6b8a-9c01-4e3f-a5b7-8d0f2b4c6a54",
    identifier: "AC-2",
    title: "Account management",
    meta: "Control · NIST SP 800-53",
    group: "Controls",
    keywords: "accounts users provisioning",
  },
  {
    id: "9a1c3e5b-7d2f-4b6a-8c0e-1f3b5d7a9c65",
    identifier: "IR-4",
    title: "Incident handling",
    meta: "Control · NIST SP 800-53",
    group: "Controls",
  },
];

const recent: SearchResult[] = [records[0]!, records[3]!].map((r) => ({ ...r, group: "Recent" }));

/** The polite region's current lines, wherever `announce` put them. */
const spoken = (politeness: "polite" | "assertive" = "polite") =>
  [
    ...document.querySelectorAll<HTMLElement>(
      `[data-slot="announcer-region"][data-politeness="${politeness}"]`,
    ),
  ]
    .map((region) => region.textContent ?? "")
    .join(" ");

const body = () => within(document.body);

/** The row the arrows are on, which the field names as its active descendant. */
const highlighted = (dialog: HTMLElement) =>
  dialog.querySelector<HTMLElement>('[role="option"][data-highlighted]');

function Demo({
  initialResults,
  children,
}: {
  initialResults?: SearchResult[] | undefined;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState<SearchResult | null>(null);
  return (
    <Stack space="space.150">
      <Inline space="space.100" alignBlock="center">
        <Button onClick={() => setOpen(true)}>Search records</Button>
        {opened ? (
          <Text color="color.text.subtle">
            Opened {opened.identifier} {opened.title}.
          </Text>
        ) : null}
      </Inline>
      {children}
      <SearchDialog
        open={open}
        onOpenChange={setOpen}
        results={records}
        initialResults={initialResults}
        onSelect={setOpened}
        placeholder="Search programs, risks and controls"
      />
    </Stack>
  );
}

/** The dialog over the records it matches itself. The arrows move and the field's active descendant follows the highlighted row as the results change; Enter opens the record, the dialog closes and focus returns to the button that opened it. */
export const SearchDialogStory: Story = {
  name: "Search dialog",
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole("button", { name: "Search records" });
    await userEvent.click(opener);
    const dialog = await body().findByRole("dialog", { name: "Search" });
    const input = within(dialog).getByRole("combobox", { name: "Search" });
    await waitFor(() => expect(input).toHaveFocus());
    // Before a query: what to type, and no row the field could point at.
    const prompt = dialog.querySelector('[data-slot="search-dialog-message"]');
    await expect(prompt).toHaveTextContent("Find a record by its name or its identifier.");
    await waitFor(() => expect(prompt).toBeVisible());
    await expect(input).not.toHaveAttribute("aria-activedescendant");

    await userEvent.type(input, "ground");
    const options = await within(dialog).findAllByRole("option");
    await expect(options).toHaveLength(2);
    await expect(within(dialog).getByRole("group", { name: "Programs" })).toBeVisible();
    await expect(within(dialog).getByRole("group", { name: "Risks" })).toBeVisible();
    // The first row is highlighted as the results arrive, and the field names it.
    await waitFor(() => {
      const row = highlighted(dialog);
      expect(row).not.toBeNull();
      expect(input).toHaveAttribute("aria-activedescendant", row!.id);
    });
    await expect(highlighted(dialog)).toHaveTextContent("Ground segment refresh");
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(highlighted(dialog)).toHaveTextContent("Unpatched ground station"));
    await expect(input).toHaveAttribute("aria-activedescendant", highlighted(dialog)!.id);
    await expect(within(dialog).getByText("2 results")).toBeVisible();

    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(
      canvas.getByText("Opened RSK-0412 Unpatched ground station firmware."),
    ).toBeVisible();
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

/** Every word must appear in the name, the identifier, the meta, the group or the keywords, ignoring case and accents; the id is never matched. "de" finds Incident handling by its name and the moderate risk by its meta, and not Fleet telemetry, whose internal id contains "de". The count is shown in the footer and spoken once the results hold still. */
export const Matching: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Search records" }));
    const dialog = await body().findByRole("dialog", { name: "Search" });
    const input = within(dialog).getByRole("combobox", { name: "Search" });
    await userEvent.type(input, "de");
    await waitFor(() => expect(within(dialog).getAllByRole("option")).toHaveLength(2));
    const [risk, control] = within(dialog).getAllByRole("option");
    await expect(risk).toHaveTextContent("Vendor access not reviewed");
    await expect(control).toHaveTextContent("Incident handling");
    await expect(within(dialog).queryByText("Fleet telemetry")).toBeNull();
    await expect(within(dialog).getByText("2 results")).toBeVisible();
    await waitFor(() => expect(spoken()).toContain("2 results"), { timeout: 3000 });

    // Two words, in two fields: the identifier and the meta.
    await userEvent.clear(input);
    await userEvent.type(input, "ac-2 nist");
    await waitFor(() => expect(within(dialog).getAllByRole("option")).toHaveLength(1));
    await expect(within(dialog).getByRole("option")).toHaveTextContent("Account management");
    // A keyword finds a record without being shown.
    await userEvent.clear(input);
    await userEvent.type(input, "provisioning");
    await waitFor(() =>
      expect(within(dialog).getByRole("option")).toHaveTextContent("Account management"),
    );
    await expect(within(dialog).queryByText("provisioning")).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** A query that finds nothing says so and says what to try; the sentence is spoken. It is a different state from a search still in flight. */
export const NoResults: Story = {
  name: "No results",
  render: () => (
    <SearchDialog
      open
      onOpenChange={() => undefined}
      results={records}
      onSelect={() => undefined}
      defaultQuery="zzz"
    />
  ),
  play: async () => {
    const dialog = await body().findByRole("dialog", { name: "Search" });
    await waitFor(() => expect(within(dialog).getByText("No results for “zzz”")).toBeVisible());
    await expect(
      within(dialog).getByText("Check the spelling, or search for the identifier."),
    ).toBeVisible();
    await expect(within(dialog).queryAllByRole("option")).toHaveLength(0);
    await waitFor(() => expect(spoken()).toContain("No results for “zzz”"), { timeout: 3000 });
  },
};

/** A record the reader cannot open stays listed, unavailable, and says why under its meta as the row's description. The arrows reach it, so a screen reader hears the reason; Enter and a press do nothing. */
export const UnavailableRecord: Story = {
  name: "Unavailable record",
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Search records" }));
    const dialog = await body().findByRole("dialog", { name: "Search" });
    const input = within(dialog).getByRole("combobox", { name: "Search" });
    await userEvent.type(input, "classified");
    const option = await within(dialog).findByRole("option");
    await expect(option).toHaveAttribute("aria-disabled", "true");
    await expect(option).toHaveAccessibleDescription("You do not have access to this program.");
    // The reason is the description, not part of the row's name.
    await expect(option).not.toHaveAccessibleName(/access/);
    await expect(within(dialog).getByText("You do not have access to this program.")).toBeVisible();
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", option.id));
    await userEvent.keyboard("{Enter}");
    await userEvent.click(option, { pointerEventsCheck: 0 });
    await expect(body().getByRole("dialog", { name: "Search" })).toBeVisible();
    await expect(canvas.queryByText(/^Opened/)).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** Recent records under their own heading before anything is typed; typing replaces them with results. */
export const BeforeAQuery: Story = {
  name: "Before a query",
  render: () => <Demo initialResults={recent} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Search records" }));
    const dialog = await body().findByRole("dialog", { name: "Search" });
    const group = await within(dialog).findByRole("group", { name: "Recent" });
    await expect(within(group).getAllByRole("option")).toHaveLength(2);
    const input = within(dialog).getByRole("combobox", { name: "Search" });
    await waitFor(() =>
      expect(input).toHaveAttribute("aria-activedescendant", highlighted(dialog)!.id),
    );
    await userEvent.type(input, "incident");
    await waitFor(() => expect(within(dialog).queryByRole("group", { name: "Recent" })).toBeNull());
    await expect(within(dialog).getByRole("option")).toHaveTextContent("Incident handling");
    await userEvent.keyboard("{Escape}");
  },
};

/** The caller's own search: `filter={null}`, the query controlled, results after a delay. `loading` is set in `onQueryChange`, as the request starts, so the dialog never shows "No results" for a query whose results have not arrived. A failure shows above the field's results with Retry, is said at once, and Retry returns focus to the field. */
function RemoteDemo({ failFirst = false }: { failFirst?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Whether the next request fails; a ref, so the failure does not start another request.
  const failNext = useRef(failFirst);
  useEffect(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const timer = setTimeout(() => {
      setLoading(false);
      if (failNext.current) {
        failNext.current = false;
        setFailed(true);
        return;
      }
      setResults(
        records.filter((r) => {
          const text = `${r.identifier} ${r.title} ${r.meta}`.toLowerCase();
          return words.every((word) => text.includes(word));
        }),
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [query, attempt]);
  const search = (next: string) => {
    setQuery(next);
    setLoading(next.trim() !== "");
    setFailed(false);
  };
  return (
    <Stack space="space.150">
      <Inline>
        <Button onClick={() => setOpen(true)}>Search records</Button>
      </Inline>
      <SearchDialog
        open={open}
        onOpenChange={setOpen}
        query={query}
        onQueryChange={search}
        filter={null}
        results={query.trim() ? results : []}
        loading={loading}
        error={failed || undefined}
        onRetry={() => {
          setLoading(true);
          setFailed(false);
          setAttempt((n) => n + 1);
        }}
        onSelect={() => undefined}
        placeholder="Search programs, risks and controls"
      />
    </Stack>
  );
}

/** Whether "No results" was ever rendered in the dialog while `run` ran, even in a state React replaced before the next paint: the added nodes are read, not the dialog as it is by then. */
async function everSaidNoResults(dialog: HTMLElement, run: () => Promise<void>) {
  let said = false;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const nodes =
        mutation.type === "characterData" ? [mutation.target] : [...mutation.addedNodes];
      if (nodes.some((node) => /No results/.test(node.textContent ?? ""))) said = true;
    }
  });
  observer.observe(dialog, { subtree: true, childList: true, characterData: true });
  try {
    await run();
  } finally {
    observer.disconnect();
  }
  return said;
}

export const RemoteSearch: Story = {
  name: "Remote search",
  render: () => <RemoteDemo />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Search records" }));
    const dialog = await body().findByRole("dialog", { name: "Search" });
    const input = within(dialog).getByRole("combobox", { name: "Search" });
    const flashed = await everSaidNoResults(dialog, async () => {
      await userEvent.type(input, "risk");
      await expect(await within(dialog).findByText("Searching…")).toBeVisible();
      await expect(within(dialog).getByRole("listbox")).toHaveAttribute("aria-busy", "true");
      await waitFor(() => expect(within(dialog).getAllByRole("option")).toHaveLength(2));
    });
    // Searching is a different state from nothing found, even for a frame.
    await expect(flashed).toBe(false);
    await expect(within(dialog).getByRole("listbox")).not.toHaveAttribute("aria-busy");
    await waitFor(() => expect(spoken()).toContain("2 results"), { timeout: 3000 });
    // The next query keeps the listed rows usable while it runs, and marks the list busy.
    await userEvent.type(input, " high");
    await expect(within(dialog).getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    await expect(within(dialog).getAllByRole("option")).toHaveLength(2);
    await waitFor(() => expect(within(dialog).getAllByRole("option")).toHaveLength(1));
    await userEvent.keyboard("{Escape}");
  },
};

export const Failure: Story = {
  name: "Search failed",
  render: () => <RemoteDemo failFirst />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Search records" }));
    const dialog = await body().findByRole("dialog", { name: "Search" });
    const input = within(dialog).getByRole("combobox", { name: "Search" });
    await userEvent.type(input, "program");
    const message = await within(dialog).findByText("The search could not load results.");
    await expect(message).toBeVisible();

    await waitFor(() =>
      expect(spoken("assertive")).toContain("The search could not load results."),
    );
    await expect(within(dialog).queryByText(/No results/)).toBeNull();
    const retry = within(dialog).getByRole("button", { name: "Try again" });
    await expect(retry).toHaveAccessibleDescription("The search could not load results.");
    await userEvent.click(retry);
    await waitFor(() => expect(input).toHaveFocus());
    await waitFor(() => expect(within(dialog).getAllByRole("option")).toHaveLength(3));
    await expect(within(dialog).queryByText("The search could not load results.")).toBeNull();
    await userEvent.keyboard("{Escape}");
  },
};

/** At a phone's width the dialog keeps a margin on each side, long names wrap inside their row, and the footer's keys wrap instead of pushing the count off the edge. */
export const Phone: Story = {
  name: "At 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => (
    <SearchDialog
      open
      onOpenChange={() => undefined}
      results={records}
      onSelect={() => undefined}
      defaultQuery="o"
    />
  ),
  play: async () => {
    await waitFor(() => expect(window.innerWidth).toBe(390));

    const dialog = await body().findByRole("dialog", { name: "Search" });
    const box = dialog.getBoundingClientRect();
    await expect(box.left).toBeGreaterThan(0);
    await expect(box.right).toBeLessThan(window.innerWidth);
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    const footer = dialog.querySelector<HTMLElement>('[data-slot="search-dialog-footer"]')!;
    await expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
    for (const row of within(dialog).getAllByRole("option"))
      await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
  },
};

/** The props as controls. The button opens the dialog; loading and error show their states over the records. */
export const Playground: Story = {
  args: {
    results: records,
    title: "Search",
    placeholder: "Search programs, risks and controls",
    loading: false,
    error: false,
  },
  argTypes: {
    loading: { control: "boolean" },
    error: { control: "boolean" },
    open: { control: false },
    results: { control: false },
    initialResults: { control: false },
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <Inline>
        <Button onClick={() => setOpen(true)}>Search records</Button>
        <SearchDialog {...args} open={open} onOpenChange={setOpen} />
      </Inline>
    );
  },
};

/** The rows as a list, for a pair. */
function Rows({ placeholder, children }: { placeholder: string; children: ReactNode }) {
  return (
    <div className="rounded-large border border-default bg-surface-overlay shadow-raised">
      <Command label="Records">
        <CommandInput placeholder={placeholder} hint={null} />
        <CommandList>{children}</CommandList>
      </Command>
    </div>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Pair
      do={
        <Rows placeholder="Search programs, risks and controls">
          {records.slice(0, 2).map((r) => (
            <CommandItem
              key={r.id}
              value={`${r.identifier} ${r.title}`}
              className="h-auto items-start py-100"
            >
              <Id className="text-subtle">{r.identifier}</Id>
              <span className="min-w-0 flex-1">
                <span className="block break-words">{r.title}</span>
                <span className="block break-words font-body-xsmall text-subtle">{r.meta}</span>
              </span>
              {r.badge}
            </CommandItem>
          ))}
        </Rows>
      }
      doText="A SearchDialog: the identifier, the name, the kind and owner under it, one status. The reader knows which record Enter opens."
      dont={
        <Rows placeholder="Type a command…">
          <CommandItem value="program-5a0e2c41">Payload integration</CommandItem>
          <CommandItem value="program-8b61f0d2">Ground segment refresh</CommandItem>
        </Rows>
      }
      dontText="Records as commands in the CommandPalette: a label alone, a dialog named “Command palette”, and “No commands match” while the records load."
    />
  ),
};
