# Agent N: nested navigation everywhere, no EXAMPLE badges, and two visual-layer fixes

Read `SP/vanta/v2/COMMON.md` (paths, rules, budgets) first; its file-ownership lines are replaced by the ones below. Your folder is `SP/vanta/v2/N/`, your build `out/v2-N.html`. v2 is live; read `SP/vanta/v2/WAVE1.md` for what the first wave did, and C1's and C2's notes (`SP/vanta/v2/C1/notes.json`, `C2/notes.json`) for the workflow layer.

## Josef's words (19 November)
1. "For those library screens and really anything else we need to use the nav pattern we did for programs, since we have nested navigation basically."
2. "Also remove all of those EXAMPLE badges, that's just clutter."
3. "The requirements chains should show on the requirements page as a component, probably not its own record. It's part of the requirements, right?" (The lead's answer: yes. A requirement's trace, the controls it maps, the elements it is allocated to, its evidence and what follows downstream, belongs on the Requirements page, not on a page of its own. Agent F does 3; it is here so you know.)

## Do
1. **Nested navigation.** Every rail destination that holds several pages (Library, Products, Settings, About, and any other the rail has) shows them the way a program's pages show: a side menu beside the rail, the area's name at its top where a program's switcher sits, its pages listed (in groups where the area has groups, such as Settings' Workspace and My account), the current page marked as in a program's menu. Those pages lose their section tab strip. On a phone, the menu opens from ☰ as a program's does. L1 drew Settings' own left list of sections inside the page (`mod-zzzz-v2-5work.js`): the side menu replaces it. Keep what V did to the menus (ink on grey, groups folded but the current one; with only a few pages, an area's menu shows them all) and C2's assessment-mode menu.
2. **The SCTM workbook's place.** Agent S is building a full-window SCTM workbook at route `sctm` (like the SSP editor at `ssp`). Add "SCTM workbook" to the program's menu in the Compliance group, after Requirements. S draws the screen; do not draw it.
3. **No EXAMPLE badges** anywhere: in rows, headers, cards, previews, dialogs and the editors. A footnote the badge introduced stays as a plain grey sentence when it still makes sense without it; one that only explained a badge goes. Make it hold for screens other agents add later (the visual layer, `mod-zzzz-v2-9clean.js`, is the place for a generic rule).
4. **Two fixes the re-review found in the visual layer** (`SP/vanta/v2/R/review.json`): the constant-column rule cuts columns that read the same on the first page of a paged register though the register varies (Evidence "All 368" loses Status, Latest version and Renew by; Requirements loses State). Cut a column only when the whole register is on screen, and never a status or state column. And the constant columns it missed: Risks "Reassess by Dec 12", Inventory "Assign owner", owners that all read "Unassigned"/"—" (an action word in every row is a constant column too, unless it is the row's only action).

## Your files
`core.js`, `core.css`, `mod-v9-navlab.*`, `mod-zzzz-v2-5work.*` (L1's Settings), `mod-zzzz-v2-9clean.*` (the visual layer), and the checks your change makes stale (`SP/vanta/ssp/probe-v9.mjs` asserts that Library's and Settings' pages are tabs; say which you changed). Nothing else: agent F is fixing the re-review's findings in the page and workflow modules (and folding the requirement page into the Requirements page) at the same time, agent S is building the SCTM workbook in its own files, and `mod-zz-compare*` and `mod-zzzz-v2-0core.*` are the lead's (ask if the core needs a change). If one of your changes needs a page module changed, say so in your final message.

## Done means
- Every rail area with pages uses the side menu at 1440 and as a drawer at 390; no section tab strip is left; no EXAMPLE badge on any of the 791 routes, their previews or dialogs; Evidence and Requirements keep their status columns.
- `notes.json` per COMMON.md; checks per COMMON.md.
- Final message, at most 250 words.
