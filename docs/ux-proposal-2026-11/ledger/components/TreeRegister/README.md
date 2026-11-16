# TreeRegister

A register drawn as a tree on the table's own rows: depth is indentation in the name cell, and a row that holds others starts with its chevron. Proposed in the November 2026 UX proposal; not in the package (shipped Ledger has `Tree` and a tree mode of `DataTable`).

**When to use.** A hierarchy a reader scans as one list: business lines over products, configurations and programs; a product's structure; what a system takes from above.

**What you write.** `<table class="k-table nx-tree">`. The name cell is `td.is-fill` with depth `d-1` to `d-4` (20px a level). A row that holds others starts with a 14px `chevron-down` (open) or `chevron-right` (closed); `tr.is-branch` sets it on the sunken band and `tr.is-root` sets its name at weight 600. A row that holds nothing is `tr.is-leaf` and keeps the chevron's place. `nx-tree__n` is one quiet fact after the name (whose it is, or how many it holds); `nx-code` is a code before it.

**Do**
- One line a row at every depth; pooled numbers on a branch, the member's own on a leaf.
- Leave a cell empty where the level has no such fact.
- Keep the columns the same at every depth.

**Don't**
- No deeper than four levels, no icons for kinds of row, no second line under a name.
- Don't indent with spaces or dashes, and don't repeat the parent's name in its children.
