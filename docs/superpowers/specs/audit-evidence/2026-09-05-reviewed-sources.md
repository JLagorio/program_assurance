# Reviewed reference sources and crawl limits

Read on 2026-09-05. This is the claim-bearing source list for the [second-pass audit](../2026-09-05-design-system-audit-second-pass.md). “Reviewed” means relevant content was examined through web output/search extraction or official source files; it does not mean every interactive example was operated. The separate JSON crawl is a retrieval index, not a human-reviewed checklist.

## Crawl accounting

The public-document crawler attempted 1,165 discovered URLs and retrieved 1,113 responses; it exhausted its discovered queue below its 2,000-URL ceiling. Counts include `www`/non-`www`, trailing-slash aliases, and component subpages. Some failed URLs were produced by imperfect relative/Markdown-link extraction; **52 failures must not be reported as 52 verified broken official links**. HTTP 200 and a large response body can still be a JavaScript shell. Base site retrieval illustrates that limitation.

Atlassian documentation bundles and linked pages, Carbon components/elements/guidelines/patterns/contributing, and HubSpot's UI-extension component/design-pattern paths were eligible for traversal. External blogs, videos, assets, translated variants, authenticated resources, and arbitrary pages outside those path rules were not crawled. Apple was researched through indexed official excerpts because its normal pages returned JavaScript-required shells. Base Web's implementation docs were inspected through the official GitHub source; they do not stand in for all current Uber design guidance.

## Atlassian

| Source                                                                         | Reviewed topic / use                                                                                                                                                             |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Documentation index](https://atlassian.design/llms.txt)                       | Documentation structure, tokens/primitives/component resources, lint and migration tools; traversal seed.                                                                        |
| [Component bundle](https://atlassian.design/llms-components.txt)               | Selected prop tables, including button/checkbox/input names, callbacks and accessibility surfaces. Supports comparison of conventions, not blanket endorsement of every example. |
| [Accessibility bundle](https://atlassian.design/llms-a11y.txt)                 | Labels, semantic HTML, focus restoration, keyboard, testing and live regions.                                                                                                    |
| [Content bundle](https://atlassian.design/llms-content.txt)                    | Error resolution and distinct empty-state contexts; consistency of content patterns.                                                                                             |
| [Accessibility foundation](https://atlassian.design/foundations/accessibility) | Accessibility as a system-wide discipline.                                                                                                                                       |
| [Button](https://atlassian.design/components/button)                           | Component purpose, variant/API documentation.                                                                                                                                    |
| [Release phases](https://atlassian.design/release-phases)                      | Explicit stability and lifecycle communication.                                                                                                                                  |

Tokens, primitives and styling bundles were additionally retrieved and indexed by the crawler. No claim in this second pass depends on unreviewed bundle details. The direct design-token landing page returned no readable text in the web extractor.

## Carbon

| Source                                                                                          | Reviewed topic / use                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Home](https://carbondesignsystem.com/)                                                         | Public reference identity, resource navigation; published site version metadata.                                        |
| [Accessibility overview](https://carbondesignsystem.com/guidelines/accessibility/overview/)     | Foundation-wide accessibility guidance.                                                                                 |
| [Modal accessibility](https://carbondesignsystem.com/components/modal/accessibility/)           | Keyboard constraints, initial focus, labels and public testing status. Initial focus is distinct from a default action. |
| [Data-table accessibility](https://carbondesignsystem.com/components/data-table/accessibility/) | Separate default, advanced-state, keyboard and manual-screen-reader evidence.                                           |
| [Button usage](https://carbondesignsystem.com/components/button/usage/)                         | Hierarchy, purpose, grouping, sizes and context. Reference-specific numeric sizing is not a universal requirement.      |
| [Data-table usage](https://carbondesignsystem.com/components/data-table/usage/)                 | Data-table composition and interaction guidance.                                                                        |
| [Forms](https://carbondesignsystem.com/patterns/forms-pattern/)                                 | Inline validation, correction, error placement, client/server distinctions.                                             |
| [Empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/)                   | First-use/no-results/error distinctions and recovery.                                                                   |
| [Notifications](https://carbondesignsystem.com/patterns/notification-pattern/)                  | Workflow messaging choice and context.                                                                                  |
| [Motion](https://carbondesignsystem.com/elements/motion/overview/)                              | Purposeful productive/expressive motion; duration/easing roles.                                                         |
| [Content overview](https://carbondesignsystem.com/guidelines/content/overview/)                 | Content as part of the design-system contract.                                                                          |

The guessed `/guidelines/accessibility/testing/` and `/contributing/overview/` endpoints failed through the web tool. No finding relies on their nonexistent/unavailable contents. The crawl subsequently follows actual discovered contributing links where available.

## Uber Base / Base Web

| Source                                                                                                                                   | Status and reviewed topic                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Base](https://base.uber.com/)                                                                                                           | Requested site; no readable content through the text extractor. Downloaded HTML is not a completed visual/content audit. |
| [Base Web](https://baseweb.design/)                                                                                                      | Empty readable extraction; not treated as proof the site has no documentation.                                           |
| [Live override guide](https://baseweb.design/guides/understanding-overrides/)                                                            | Empty readable extraction; official source twin below used.                                                              |
| [Official Base Web repository](https://github.com/uber/baseweb)                                                                          | Identity and source location for implementation guidance.                                                                |
| [Override guide source](https://raw.githubusercontent.com/uber/baseweb/main/documentation-site/pages/guides/understanding-overrides.mdx) | Consistent access to subcomponents and the explicit caution about customization/upgrade burden.                          |
| [Theming guide source](https://raw.githubusercontent.com/uber/baseweb/main/documentation-site/pages/guides/theming.mdx)                  | Shared values, light/dark themes, provider responsibilities.                                                             |

The guessed versioning-policy MDX path failed; no second-pass conclusion depends on it. Claims that Base Web lacks accessibility or has fewer internal safeguards cannot be inferred from these access limits.

## HubSpot

| Source                                                                                                                                                      | Reviewed topic / use                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [UI extension components](https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/overview)                    | Standard versus CRM component boundaries and import surface.                            |
| [Documentation index](https://developers.hubspot.com/docs/llms.txt)                                                                                         | Discovery attempt; overview/related links provide the useful UI-component traversal.    |
| [CRM actions overview](https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/crm-action-components/overview) | Action components as concrete host-integrated workflows.                                |
| [Button](https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/button)                   | Bare `disabled`, action/href/overlay behavior, alias-heavy sizes, content expectations. |
| [Form](https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/form)                       | Explicit submit event and input composition.                                            |
| [Input](https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/input)                     | Visible label, descriptions, requiredness, value callbacks and validation.              |
| [Table](https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/table)                     | Documented data composition and props.                                                  |
| [EmptyState](https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/empty-state)          | Empty-state component anatomy and usage.                                                |

The crawl retrieved 60 HubSpot URLs in the eligible UI-extension scope. Other retrieved pages remain indexed evidence, not claim-bearing reviews in this document. Host constraints and extension-specific button limits are not adopted wholesale.

## Apple and first principles

The primary Apple URLs usually return “requires JavaScript” from `open`. Relevant official content was available through search extraction, sometimes with a query-string variant. That is indexed-content evidence, potentially older than the live page; there was no browser session available to operate these pages. Recommendations are limited to the content actually returned.

| Source                                                                                                                                      | Reviewed topic / interpretation                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [HIG overview](https://developer.apple.com/design/human-interface-guidelines)                                                               | Hierarchy, consistency, platform context.                                                                                     |
| [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)                                                              | Adaptation, grouping and relevant information hierarchy.                                                                      |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)                                                | Perceivable/adaptable interaction, mobility and motion preferences.                                                           |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)                                                            | Purpose, press feedback and platform-specific targets.                                                                        |
| [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)                                                              | Intent, reversibility, confirmation, destructive styling and default action. Current guidance does not say to default Cancel. |
| [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data)                                                | Minimize unnecessary entry, provide choices, validate dynamically.                                                            |
| [Writing](https://developer.apple.com/design/human-interface-guidelines/writing)                                                            | Clear actionable labels, consistent language, errors near fields.                                                             |
| [Undo and redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)                                                | Predictable reversal and visible results.                                                                                     |
| [Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)                                    | Preserve orientation; distinguish focus and selection.                                                                        |
| [Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left)                                                | Directionality includes icons and content, not just spacing.                                                                  |
| [Loading](https://developer.apple.com/design/human-interface-guidelines/loading)                                                            | Useful content and continued activity while waiting.                                                                          |
| [Searching](https://developer.apple.com/design/human-interface-guidelines/searching)                                                        | Discoverable search and clear scope.                                                                                          |
| [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields)                                                | Search-field purpose and scoping clues.                                                                                       |
| [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)                                          | Scannable content and selection feedback.                                                                                     |
| [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)                                                          | Deliberate action hierarchy and clear control meanings.                                                                       |
| [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)                                                        | Respect familiar shortcuts and discoverability.                                                                               |
| [Icons](https://developer.apple.com/design/human-interface-guidelines/icons)                                                                | Meaning, localization and direction-sensitive symbols.                                                                        |
| [Settings](https://developer.apple.com/design/human-interface-guidelines/settings)                                                          | Context for view/system preferences; no universal density prescription inferred.                                              |
| [Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications)                                                | Notification context and unnecessary repetition; native system notifications are not identical to web toasts.                 |
| [Reduced-motion evaluation](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria) | Meaning-preserving alternatives and testing triggered effects.                                                                |
| [UI design tips](https://developer.apple.com/design/tips/)                                                                                  | Native touch/readability examples; not a web compliance checklist.                                                            |
| [First-principles essay](https://awiserworld.net/home/first-principles-a-brief-history/)                                                    | Philosophical framing only. No UI finding or quantitative rule is proved by this essay.                                       |

Direct attempts at `/inputs`, `/feedback`, and `/managing-notifications` also returned JavaScript shells. No unsupported quotations or behavioral claims are inferred from them.

## Web behavior and token-interchange references

| Source                                                                                            | Reviewed topic / use                                                                                                                        |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)      | 24×24 CSS-pixel minimum criterion and its spacing/other exceptions; icon size is not hit-region size.                                       |
| [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)                                 | Narrow/zoomed operation and appropriate exceptions for two-dimensional content.                                                             |
| [Focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) | Sticky/overlay layouts must not completely hide focused controls.                                                                           |
| [Modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)                    | Focus entry, containment, dismissal and restoration.                                                                                        |
| [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)                                    | Roles, keyboard and automatic/manual activation.                                                                                            |
| [Tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)                                | Focus/selection distinction, entry point, hierarchy and typeahead guidance.                                                                 |
| [DTCG 2025.10 Format Module](https://www.designtokens.org/tr/2025.10/format/)                     | Structured dimension/duration values and numeric typography line height. This is a Community Group specification, not a W3C Recommendation. |

Interpretations in the main report are recommendations for Ledger. Source systems disagree in places and even public examples can have mistakes; none is treated as an infallible template.
