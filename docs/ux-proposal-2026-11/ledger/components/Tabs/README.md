# Tabs

Line tabs: one row of views under a page or preview header, the selected one underlined. Ledger part: `<Tabs>` with `<TabsList variant="line">`, `TabsTrigger` and `TabsContent` (static rendition; the React part is not bundled).

**When to use.** The views a reader comes back to on a record, at most about seven, or the collections of a register page that holds more than one. A filter over one collection is a ToggleGroup or a toolbar filter, never a tab.

**What you write.** `<div class="k-tabs" role="tablist">` > `<a class="k-tab" role="tab" aria-selected="true|false">`, with an optional trailing `k-count`. Tabs are 32px tall, 24px apart, weight 500 in `--ds-color-text-subtle`; the selected one is `--ds-color-text` over a 2px underline. The strip's hairline (`--ds-color-border`) spans the content width.

**Do**
- Keep the strip to one row; it scrolls when it is narrower than its labels.
- Count a tab's collection with `k-count`: 0 once its rows are read, no count while they load.
- Start the panel 12px under the strip, with its toolbar and table. The tab already names the collection.

**Don't**
- No second strip inside a tab: collections there sit under Section headings.
- No wrap, width or overflow class on the strip.

In this stylesheet the selected underline is ink (`--ds-color-background-neutral-bold`, the proposal's rule); shipped Ledger draws it with `--ds-color-border-brand`.
