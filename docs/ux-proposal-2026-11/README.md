# UX proposal, November 2026

A snapshot of the four artifacts behind the UX proposal, taken 2026-11-16 after pass six, which put Josef's answers to all 40 of its decisions on the page, the boards and the prototype. The live artifacts are the source of truth; this copy keeps them beside the code. The implementation checklist is [docs/guides/ux-proposal-checklist.md](../guides/ux-proposal-checklist.md).

| Folder | What it is | Open | Live |
| --- | --- | --- | --- |
| [proposal/](proposal/) | A Path, Not a Page: the 40 decisions, the reasoning, every board with its job | `proposal/index.html` in a browser | [artifact](https://claude.ai/artifact/GYxwfYJuHpsptsaQyJV24u) |
| [prototype/](prototype/) | The clickable app: 81 screens in 18 flows. A screen's address is its key (`#component--overview`) | `prototype/index.html` in a browser | [artifact](https://claude.ai/artifact/Fm8T8rkFfeiARpGBB7U7jM) |
| [mocks/](mocks/) | Every board as its own page (89, the eight component sheets included), linked as in the prototype | any `mocks/<board>.html` | [canvas](https://claude.ai/artifact/3MbdfEKz2n7AfNCXvLkAjz) |
| [ledger/](ledger/) | Ledger as a Design System artifact: tokens in four themes, the brand book, 57 part cards, the cover | `ledger/README.md`; the cards render on the live page | [artifact](https://claude.ai/artifact/2iju1qSiUEtVKtTi3SeCy3) |

- The pages load Geist from Google Fonts; offline they fall back to the system font.
- `ledger/tokens.css` is the stylesheet the Design System page compiles from `ledger/tokens.json`, kept here for reference.
- The board sources and the scripts that draw them are not in the repository; regenerate a page from its live artifact, not by hand.
