import { test } from "node:test";
import assert from "node:assert/strict";
import { extendTailwindMerge } from "tailwind-merge";

import { mergeConfig } from "../src/generated/merge-config.ts";

// The kit's cn(): tailwind-merge extended with the generated groups, as src/lib/cn.ts builds it.
const cn = extendTailwindMerge(mergeConfig);

/** Every generated class in a group, from the generated config itself. */
const groupClasses = Object.entries(mergeConfig.extend.classGroups).map(([id, [definition]]) => {
  const [[prefix, values]] = Object.entries(definition);
  return [id, values.map((value) => `${prefix}-${value}`)];
});

test("each generated utility merges with the rest of its property group", () => {
  for (const [id, classes] of groupClasses) {
    const [first, ...others] = classes;
    for (const cls of others) {
      assert.equal(cn(first, cls), cls, `${cls} replaces ${first} (${id})`);
      assert.equal(cn(cls, first), first, `${first} replaces ${cls} (${id})`);
    }
  }
});

test("a consumer's className wins over the kit's token class on the same property", () => {
  const overrides = [
    ["w-layout-rail", "w-full"],
    ["w-layout-panel", "w-auto"],
    ["min-w-control-medium", "min-w-0"],
    ["max-w-layout-measure", "max-w-full"],
    ["max-w-layout-measure", "max-w-none"],
    ["h-control-medium", "h-auto"],
    ["min-h-row", "min-h-0"],
    ["size-control-small", "size-full"],
    ["rounded-medium", "rounded-none"],
    ["rounded-t-medium", "rounded-t-none"],
    ["rounded-e-large", "rounded-e-none"],
    ["rounded-none", "rounded-s-medium"],
    ["p-200", "p-0"],
    ["gap-100", "gap-0"],
    ["w-400", "w-full"],
    ["shadow-raised", "shadow-none"],
    ["opacity-disabled", "opacity-100"],
    ["duration-fast", "duration-0"],
  ];
  for (const [kit, consumer] of overrides) {
    const merged = cn(kit, consumer).split(" ");
    if (consumer.startsWith("rounded-s-")) {
      // A side radius after the whole radius refines it; both stay.
      assert.deepEqual(merged, [kit, consumer], `${consumer} after ${kit}`);
      continue;
    }
    assert.deepEqual(merged, [consumer], `${consumer} replaces ${kit}`);
  }
  // A whole radius after a side radius replaces it.
  assert.equal(cn("rounded-t-medium", "rounded-none"), "rounded-none");
});

test("utilities on different properties stay together", () => {
  const pairs = [
    ["text-subtle", "font-body-small"],
    ["font-body", "font-semibold"],
    ["border-default", "border-w-selected"],
    ["h-control-small", "min-h-control-small"],
    ["h-control-small", "min-w-control-small"],
    ["w-layout-rail", "max-w-layout-measure"],
    ["w-layout-rail", "min-w-control-small"],
    ["bg-surface-raised", "shadow-raised"],
    ["icon-subtle", "text-subtle"],
    ["duration-fast", "ease-standard"],
  ];
  for (const [a, b] of pairs) assert.equal(cn(a, b), `${a} ${b}`, `${a} and ${b} both stay`);
});
