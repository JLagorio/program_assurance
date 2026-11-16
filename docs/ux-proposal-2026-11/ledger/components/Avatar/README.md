# Avatar

A person as two initials in a circle, beside their name or alone where the name is already said. Ledger part: `<Avatar>` (static rendition; the React part is not bundled).

**When to use.** An owner, an assignee or the signed-in reader. A person column in a table is the name alone; the avatar is for the account, a rail and a waiting line.

**What you write.** `<span class="k-avatar">PR</span>`: 24px, `--ds-color-background-neutral` inside a 1px `--ds-color-border` ring, initials 11/14 at 500 in `--ds-color-text-subtle`. Sizes `s-xs` 16 and `s-md` 32. `is-empty` is the hollow form for nobody. The account block is `k-profile`: the avatar, the name at weight 500, the role in `t-small c-subtle`.

**Do**
- Use the person's two initials, upper case, and keep the name beside it wherever space allows.
- Say "No owner" beside the empty form; it is a statement, not a missing value.

**Don't**
- No photographs, no coloured grounds a person, no stacked groups of faces.
- Don't use an avatar for an organization or a role.
