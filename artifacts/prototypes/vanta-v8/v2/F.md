# Agent F: fix what the re-review found, and fold the requirement page into the Requirements page

Read `SP/vanta/v2/COMMON.md` (paths, rules, budgets) first; its file-ownership lines are replaced by the ones below. Your folder is `SP/vanta/v2/F/`, your build `out/v2-F.html`. v2 is live; read `SP/vanta/v2/WAVE1.md` and C1's and C2's notes (`v2/C1/notes.json`, `v2/C2/notes.json`, their `walk.mjs`) for how the workflow layer works, and the re-review: `SP/vanta/v2/R/review.json` (each of the 58 findings with its status and evidence, and a list `new` of problems v2 introduced) and `R/numbers.json`.

## Do
1. **The re-review's high and medium items, by what it says in review.json** (verify each in the current build before fixing; the review judged a snapshot from 21:11):
   - Evidence cannot be accepted from the Evidence register: with Accept chosen, Save review refuses ("What to revise … is required"). A field required for Send back is required only for Send back.
   - The chain verbs work from previews but not from the registers' own buttons: POA&M "Create POA&M item", Risks "Create risk", "Create task", "Link evidence", "Add evidence" end "Not saved". Wire each to the same state change its preview counterpart makes. Assessments has two "Plan an assessment" buttons and only the header one works.
   - My work's "Treat 2 critical risks" still opens Risks on All 40 with no filter and no preview: it must land on the two risks it counts (with the record open when it counts one), as C2 meant.
   - Upload › Add evidence with no file still says "Added, pending review": require the file, or say it is not wired.
   - Gadgets still in rows: Components 23 rings, POA&M 14 bars, Suppliers 12 bars: cut them where the number sits beside.
   - Preview and dialog actions that still do nothing or only toast: Edit asset, Ask Priya Raghavan, Add security outcomes, Invite by email: wire each or have it say plainly it is not wired.
   - Type over the budget on the Contingency plan (12 size/weight pairs), Checks (9) and the Overview (9): bring each to 8 or fewer.
   - A19 (the launcher answers "which controls lack evidence?" with No results): make the launcher answer a few such questions from the prototype's data, or say in it that AI agents answer questions and link there.
   - Anything else review.json marks `partly` that sits in your files and is quick: do it and note it; leave the rest listed in your final message.
2. **The requirement's chain on the Requirements page.** Josef (19 November): "The requirements chains should show on the requirements page as a component, probably not its own record. It's part of the requirements, right?" The lead answered yes. C1 made a requirement page (`rec--v7p-req--<id>`, drawn through `mod-zzzz-v2-1records.js`) with the statement, control mappings, allocations and evidence. Fold it into the Requirements page instead: a requirement's preview carries its chain as one component (controls mapped, allocated to, evidence, and the findings and risks that follow, each with its count and each record opening its own preview), with Map control and Link evidence where they were. The requirement page goes: no ↗ on a requirement's preview, and anything that linked to it opens the Requirements page with that requirement's preview open (`PA.v2.go("requirements", { open: { kind, id } })`). In your notes, name the other record pages that could fold into their register the same way, without changing them.

## Your files
Any prototype file the work needs except: `core.js`, `core.css`, `mod-v9-navlab.*`, `mod-zzzz-v2-5work.*`, `mod-zzzz-v2-9clean.*` (agent N is changing the navigation, removing EXAMPLE badges and fixing the visual layer's constant-column rule there, at the same time); agent S's new files (`mod-zzzz-v2-7sctm*`); `mod-zz-compare*` and `mod-zzzz-v2-0core.*` (the lead's; ask if the core needs a change). If a fix needs one of N's files, say so in your final message rather than editing it. Keep C1's and C2's walks passing (update a step your change makes stale, and say which).

## Done means
- Each item in 1 fixed in your build, or listed with why not; the requirement page folded; checks per COMMON.md plus `node SP/vanta/v2/C1/walk.mjs <build>` and `node SP/vanta/v2/C2/walk.mjs <build>`; your own walk of the fixes in `SP/vanta/v2/F/walk.mjs`.
- `notes.json` per COMMON.md.
- Final message, at most 250 words.
