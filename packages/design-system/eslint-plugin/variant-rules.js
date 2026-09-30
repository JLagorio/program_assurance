// ledger/no-unknown-variant: every variant a class carries is one Tailwind generates, from the
// grammar the token build asked it for (variants.js over lint.json) and the variants a product
// declares (settings.ledger.customVariants), an `aria-` variant names an ARIA attribute, and no
// selector or feature query reads a CSS variable. A class under a variant Tailwind does not know generates no CSS, so the style
// it asks for never lands and nothing else says so. The owner of each class is classify's
// (classes.js): a `dark:` class stays no-dark-variant's and a margin no-margin's, and an unknown
// variant comes before every rule that judges the base. A misspelling with one spelling it meant
// is offered as an editor suggestion, never as --fix, and only when the respelled class passes
// every class rule (the closure check); a breakpoint or a container size is never respelled, and
// the finding lists the sizes instead, the container sizes first.
import { classSites } from "./class-sites.js";
import { classesOf, classify } from "./classes.js";
import { STALE_MESSAGE, reportingStaleData } from "./data.js";
import { classFix } from "./fixes.js";
import { defineRules } from "./report.js";

const RULE = "no-unknown-variant";

export const variantRules = defineRules({
  [RULE]: {
    description:
      "Every variant is one Tailwind generates, and an aria- variant names an ARIA attribute.",
    hasSuggestions: true,
    // By cause (variantsProblem in variants.js), with the variant's one spelling when it has one.
    messages: {
      variant:
        '"{{cls}}" uses "{{variant}}", which is not a variant Tailwind knows, so it generates no CSS. Spell a state as Tailwind does, such as hover or focus-visible, or use a data- or aria- attribute the element sets.{{note}}',
      respell:
        '"{{cls}}" uses "{{variant}}", which is not a variant Tailwind knows, so it generates no CSS. Spell the variant "{{meant}}".{{note}}',
      modifier:
        '"{{cls}}" uses "{{variant}}", but a /name follows only a group-, peer- or container variant, so it generates no CSS. Write "{{without}}".{{note}}',
      groupModifier:
        '"{{cls}}" uses "{{variant}}", but a /name follows only a group-, peer- or container variant, so it generates no CSS. Write "{{without}}", or "{{group}}" for the group of that name.{{note}}',
      breakpoint:
        '"{{cls}}" uses "{{variant}}", which is not a breakpoint, so it generates no CSS. In Main or a panel, use a container size: {{containers}}. Window breakpoints: {{breakpoints}}.{{note}}',
      container:
        '"{{cls}}" uses "{{variant}}", which is not a container size, so it generates no CSS. The sizes are {{sizes}}.{{note}}',
      aria: '"{{cls}}" names aria-{{name}}, which is not an ARIA attribute, so it never matches. Name an attribute the element sets, or key a state of its own to data-.{{note}}',
      variable:
        '"{{cls}}" uses "{{variant}}", whose value is a CSS variable, which no selector or feature query reads, so it never matches. Write the value itself, such as nth-3 or supports-[display:grid].{{note}}',
      ariaRespell:
        '"{{cls}}" names aria-{{name}}, which is not an ARIA attribute, so it never matches. Spell the variant "{{meant}}".{{note}}',
      // The editor suggestion that writes the respelled class, when it passes every class rule.
      replace: '"{{cls}}" becomes "{{replacement}}".{{note}}',
      // Lint data the token build did not write from today's inputs, once per file (data.js).
      stale: STALE_MESSAGE,
    },
    create(context) {
      // A string two class sites reach is judged once, where it is written (as forEachClass in
      // index.js does for the other class rules).
      const claimed = new WeakSet();
      return reportingStaleData(
        context,
        classSites(context).visitors((site) => {
          for (const { text, node } of site.strings) {
            // Only a class with a variant is this rule's, and a variant ends at a colon.
            if (claimed.has(node) || !text.includes(":")) continue;
            claimed.add(node);
            for (const parsed of classesOf(text)) {
              if (!parsed.variants.length) continue;
              const { owner, cause, data } = classify(parsed);
              if (owner !== RULE) continue;
              const { fix } = data.replacement
                ? classFix(node, context.sourceCode, parsed.cls, data.replacement)
                : {};
              context.report({
                node,
                messageId: cause,
                data: { ...data },
                ...(fix
                  ? {
                      suggest: [
                        {
                          messageId: "replace",
                          data: { cls: parsed.cls, replacement: data.replacement },
                          fix,
                        },
                      ],
                    }
                  : {}),
              });
            }
          }
        }),
      );
    },
  },
});
