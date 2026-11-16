# PageHeader

The one header of a page: an optional trail, the name as the page's h1, and one action slot at its end. Ledger part: `<PageHeader>` with `PageHeader.Lead` (a `Breadcrumb` trail), `PageHeader.Title` and `PageHeader.Actions` (static rendition; the React part is not bundled).

**When to use.** First thing in Main on every register, record page, dashboard and focused view. A preview panel repeats it one level down with the record's name as an h2.

**What you write.** `<div class="k-pagehead">` > `k-trail` (links with a `chevron-right` icon between them, the last a `<span aria-current="page">`) and `k-titlebar` > `<h1 class="k-title truncate">` then `k-actions`. The title is 24/30 at weight 600; the trail is 12/16 in `--ds-color-text-subtle` with its last level in `--ds-color-text`.

**Do**
- A register's header holds only its name. Its create action lives in the toolbar.
- A record's header holds one primary or the Actions menu (`ellipsis`), and a version menu before it when every tab reads one revision.
- Put a code in the trail or in Details; the title is the record's name.

**Don't**
- No sentence under the title, no status badge, no back-chevron row, no second action row.
- Don't write a raw heading with type classes in place of `k-title`.
