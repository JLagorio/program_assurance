# ScopedNav

The side nav scoped to what is open: one system, one product, or the organization, with a switcher at its head. Proposed in the November 2026 UX proposal; not in the package. It is drawn from the shipped side nav's parts (`k-sidenav`, `k-nav-item`) plus `nx-sysnav`, `nx-sysswitch` and `nx-orgnav`.

**When to use.** The shell of every proposal screen. A system's nav lists its assurance chain in order (Overview, System, Baseline, Controls, Requirements, Evidence, Findings, POA&M, Risks), then the quieter group Assess and authorize, then Library and the account. A product's nav puts Structure in System's place, ends with Where used and has no Authorization. The organization's nav is Home, Portfolio, Programs and the Library as a group.

**What you write.** `<nav class="k-sidenav nx-sysnav">` > `k-nav-body` > a `k-nav-section` with Home, the switcher, a `k-nav-section nx-sysnav__chain`, a `k-nav-section nx-sysnav__quiet` under a `k-nav-heading`; the footer holds Library and the `k-profile`. The switcher is `<a class="nx-sysswitch">` > `nx-sysswitch__mark` (two letters), `nx-sysswitch__text` > `nx-sysswitch__id` (`<b>` the code, then a tag such as High) and `nx-sysswitch__name`, then a `chevrons-up-down` icon. The organization's nav adds `nx-orgnav`.

**Do**
- Keep the destinations and their order identical on every screen of a scope.
- At most three small counts, only for work that waits on the reader: Evidence 54.
- Mark where the reader is in ink: `aria-current="page"` on `--ds-color-background-neutral`.

**Don't**
- Don't add, drop or reorder destinations a screen, and don't draw the nav by hand differently from this card.
- No hue for the current destination, and no count that is only a total.
