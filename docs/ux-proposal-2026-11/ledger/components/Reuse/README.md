# Reuse

The words of reuse: where an inherited result comes from, how a consumer stands against the version it took, and where an offered result stands. Proposed in the November 2026 UX proposal; not in the package.

**When to use.** Wherever a system or a product is built from a shared component or a product version: a component assessed once and used everywhere, a variant behind its product, a finding offered up to the component's owner.

**What you write.**
- Assessed once: `<span class="nx-once">` > the determination (`nx-det`), then `<a class="nx-prov">Mission Computer <b>3.0</b></a>`, a small hatched tag that names the component version the result comes from.
- Against what it took, as words, never pills: `<span class="nx-reuse is-pinned">Pinned <b>3.0</b></span>` (plain); `<a class="nx-reuse is-behind">Behind <b>1</b><u>Take version 3.1</u></a>` (`--ds-color-text-warning`, ends in its verb); `<span class="nx-reuse is-modified">Modified here</span>` (`--ds-color-text-accent-teal`).
- An offer, in a row: `<span class="nx-offer is-offered">Offered</span>`, `is-accepted` (green: published for every consumer), `is-returned` (amber).

**Do**
- Name the version beside the component, every time: Mission Computer 3.0.
- Let "Behind" carry its verb: Take version 3.1.
- In a record header an offer's state is the state label, not this pill.

**Don't**
- An inherited result is never editable on its row: it is entered once, on the component.
- No pill for pinned, behind or modified, and no hue for a provenance tag.
