# TextLink

Text that navigates: an underlined ink link, a quieter brand link, and a record's name in a row. Ledger part: `<TextLink>` (and a link-styled `<Button>` for a step done in place); static rendition, the React parts are not bundled.

**When to use.** Any destination: a record's page, a register asked a question, a step that leads elsewhere. Buttons act; links navigate.

**What you write.** `<a class="k-link">` is ink (`--ds-color-text`) with a 1px underline in `--ds-color-border-bold`, 3px under the text. `k-link is-brand` is `--ds-color-text-brand` without an underline, for View all and Clear filters. `<a class="k-name">` is a record's name in a table row: `--ds-color-text` at weight 500, no colour of its own. A step done on the page itself is `<button class="k-btn is-link k-link">`, which wraps like the text around it.

**Do**
- Name the destination by the record's own name, or the step in the words of its operation: Open assessment findings, Link evidence to REQ-442.
- A record with no stored name links as "Unnamed requirement", never as a missing value.
- Make a count a link when it opens exactly the records it counts; a zero opens nothing.

**Don't**
- Don't colour a name in a table: the register's colour stays with its statuses.
- Don't write "click here", and never lead a name into the schema inspector.
