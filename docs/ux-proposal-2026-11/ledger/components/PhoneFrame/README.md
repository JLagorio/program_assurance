# PhoneFrame

A 390px phone screen: a 48px top bar, a scrolling main and a bottom bar that holds the screen's one action. It is a static rendition of how Ledger's `<Shell>` lays out on a phone (the side nav becomes an overlay behind Menu); the React part is not bundled.

**When to use.** A mock of a screen at phone width. The real frame is 390 by 844; this card draws it shorter.

**What you write.** `<div class="lx k-phone">` > `k-phone-top` (Menu, the place, Search, the reader's `k-avatar`), `k-phone-main` (16px padding, children 16px apart) and `k-phone-bar` (buttons at `s-lg`, 36px, sharing the row with `grow`).

**Do**
- Keep one filled button, in the bar. Everything else there is secondary.
- Keep the state, the owner and the due day in the first screen: a closed Details row or a short `k-kv`.
- Let a table drop its lower-priority columns; a row keeps its name and its state.

**Don't**
- Don't shrink the type or scroll the page sideways to fit a desktop layout.
- Don't draw the side nav in the frame; Menu opens it.
