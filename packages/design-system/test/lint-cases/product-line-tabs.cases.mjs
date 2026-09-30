// ledger/product-line-tabs: a product TabsList is the line variant, after any prop spreads, and
// leaves its wrapping, width and overflow to the kit.
import { kitImport } from "../lint-helpers.mjs";

const tabs = kitImport("TabsList");
/** A layout override: a class, quoted, or a style property, on the TabsList as written. */
const override = (value, { style = false, tag = "TabsList" } = {}) => ({
  messageId: "override",
  data: { value, subject: style ? `style.${value}` : `"${value}"`, tag },
});

export default {
  valid: [
    { code: `${tabs} <TabsList variant="line" />` },
    { code: `${tabs} <TabsList {...props} variant={"line"} />` },
    {
      code: `${tabs} <TabsList variant="line" className={small ? "text-subtle" : "text-default"} />`,
    },
    {
      code: `${tabs} <TabsList variant="line" style={{ color: "inherit", overflowX: undefined }} />`,
    },
    {
      code: `${tabs} <TabsList variant={"line" as const} className="w-full pt-100" />`,
      only: "ts",
    },
    // A destructured const is one slot of its initialiser; the label beside it is not a class.
    {
      code: `${tabs} const [label, layout] = ["flex-wrap", "text-subtle"]; <TabsList variant="line" className={layout} />`,
    },
    { code: 'import * as Kit from "@ledger/design-system"; <Kit.TabsList variant="line" />' },
    // Not the kit's TabsList.
    { code: '<TabsList variant="default" className="flex-wrap" />' },
    { code: `${tabs} function Child(TabsList) { return <TabsList />; }` },
    { code: 'import { TabsList } from "other-kit"; <TabsList variant="default" />' },
    { code: 'import type { TabsList } from "@ledger/design-system"; <TabsList />', only: "ts" },
  ],
  invalid: [
    {
      code: `${tabs} <TabsList />`,
      errors: [{ messageId: "variant", line: 1, column: 51 }],
    },
    { code: `${tabs} <TabsList variant={variant} />`, errors: [{ messageId: "variant" }] },
    { code: `${tabs} <TabsList variant="line" {...props} />`, errors: [{ messageId: "variant" }] },
    {
      code: 'import * as Kit from "@ledger/design-system"; <Kit.TabsList variant="default" />',
      errors: [{ messageId: "variant" }],
    },
    {
      code: `${tabs} <TabsList variant="line" className="flex-wrap" />`,
      errors: [{ ...override("flex-wrap"), line: 1, column: 76 }],
    },
    {
      code: `${tabs} <TabsList variant="line" className="md:flex-wrap-reverse!" />`,
      errors: [override("md:flex-wrap-reverse!")],
    },
    {
      code: `${tabs} <TabsList variant="line" className={cn("w-full", { "overflow-hidden": small })} />`,
      errors: [override("overflow-hidden")],
    },
    {
      code: `${tabs} const layout = "w-fit"; <TabsList variant="line" className={layout} />`,
      errors: [override("w-fit")],
    },
    {
      code: `${tabs} <TabsList variant="line" style={{ overflowX: "auto" }} />`,
      errors: [override("overflowX", { style: true })],
    },
    {
      code: `${tabs} <TabsList variant="line" style={{ width: "fit-content" }} />`,
      errors: [override("width", { style: true })],
    },
    {
      // Both at once: the variant and the override are two reports.
      code: 'import { TabsList as Views } from "@ledger/design-system"; <Views className="w-fit" />',
      errors: [{ messageId: "variant" }, override("w-fit", { tag: "Views" })],
    },
    {
      // The TabsList's classes are read through a const and a map entry.
      code: `${tabs} const wrap = "flex-wrap"; const fit = { narrow: "w-fit" }; <><TabsList variant="line" className={wrap} /><TabsList variant="line" className={cn(fit.narrow)} /></>`,
      errors: [override("flex-wrap"), override("w-fit")],
    },
  ],
};
