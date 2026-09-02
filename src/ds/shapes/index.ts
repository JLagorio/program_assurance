/**
 * Application shapes.
 *
 * `ui.tsx` says every screen is one of two shapes — IndexPage or ShowPage —
 * and that is exactly the problem. A traceability matrix, a work surface, a
 * decision queue and a reference document are different jobs, and pouring all
 * of them into "header, tab strip, stack of Sections containing tables" is why
 * every screen in this product looks the same and none of them feels like a
 * tool. The visual language is fine; the missing layer is shapes that match
 * what a person is doing.
 *
 * Four shapes, each answering a job the two archetypes could not:
 *
 *  - `WorkPane`   — you are working through a list. The list stays.
 *  - `Inspector`  — the facts stay put while the content scrolls.
 *  - `ActionBar`  — state and the actions that change it, pinned, not buried.
 *  - `Disclosure` — reference material is present but closed.
 *
 * None of them takes a `description` prop. That is deliberate: 4,382 words of
 * explanatory prose accumulated across 41 routes because `Section` invited it.
 */

export * from "./action-bar";
export * from "./disclosure";
export * from "./inspector";
export * from "./work-pane";
