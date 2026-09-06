import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { extractMatrix, renderMarkdown, validateReview } from "../../../scripts/ds-api-matrix.mjs";

test("API matrix resolves aliases, compounds, branch-only props, and aliased literal axes", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-prop-matrix-"));
  try {
    const entry = path.join(directory, "index.ts");
    fs.mkdirSync(path.join(directory, "node_modules/fixture"), { recursive: true });
    fs.writeFileSync(
      path.join(directory, "node_modules/fixture/index.d.ts"),
      `
      export interface ExternalProps { externalFlag?: boolean; id?: string; }
    `,
    );
    fs.writeFileSync(
      path.join(directory, "component.ts"),
      `
      import type { ExternalProps } from "./node_modules/fixture";
      type Variant = "primary" | "secondary";
      type Props = ExternalProps & {
        /** Action emphasis, not status. */
        variant?: Variant;
        runtimeDefault?: number;
      } & ({ kind: "link"; href: string } | { kind: "button"; disabled?: boolean });
      function Root({ variant = "secondary", runtimeDefault, ...props }: Props) {
        const resolved = runtimeDefault ?? 42;
        return { variant, resolved, props };
      }
      function Part({ label = "Part" }: { label?: string }) { return label; }
      export const Compound = Object.assign(Root, { Part });
    `,
    );
    fs.writeFileSync(entry, 'export { Compound as Renamed } from "./component";');
    const program = ts.createProgram([entry], {
      strict: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
    });
    const matrix = extractMatrix(program, entry);
    assert.deepEqual(
      matrix.components.map((component) => component.name),
      ["Renamed", "Renamed.Part"],
    );
    const component = matrix.components[0];
    const variant = component.props.find((prop) => prop.name === "variant");
    assert.deepEqual(variant.literalValues.sort(), ["primary", "secondary"]);
    assert.equal(variant.default.expression, '"secondary"');
    assert.equal(variant.documentation[0], "Action emphasis, not status.");
    assert.equal(
      component.props.find((prop) => prop.name === "href").presence.length,
      1,
      "union-exclusive props must not disappear",
    );
    assert.equal(
      component.props.find((prop) => prop.name === "runtimeDefault").default.status,
      "not-resolved",
      "body fallbacks must not be falsely certified as parameter defaults",
    );
    assert.equal(component.domTarget.status, "not-reviewed");
    assert.equal(component.controlledBehavior.status, "not-reviewed");
    assert.equal(component.defaultBehavior.status, "not-reviewed");
    const external = component.inheritedProps.find(
      (prop) => matrix.inheritedCatalog[prop.definition].name === "externalFlag",
    );
    assert.ok(external, "inherited props remain in the catalog");
    assert.equal(
      external.presence.length,
      2,
      "inherited optionality is preserved for every union branch",
    );
    assert.equal(matrix.components[1].props[0].default.expression, '"Part"');
    const reviewedInherited = extractMatrix(program, entry, {
      components: {
        Renamed: {
          props: {
            externalFlag: { meaning: "Reviewed dependency flag.", migration: "Keep forwarding." },
          },
        },
      },
    });
    assert.ok(
      reviewedInherited.components[0].props.find((prop) => prop.name === "externalFlag")
        ?.reviewedPolicy,
    );
    const markdown = renderMarkdown(matrix, { axes: {} });
    assert.match(markdown, /Action emphasis, not status/);
    assert.match(markdown, /not-reviewed/);
    assert.match(markdown, /Literal values/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("complete API review rejects uncovered additions, missing behavior and axes, and orphaned policies", () => {
  const matrix = { components: [{ name: "Example", props: [{ name: "value", axis: "value" }] }] };
  const policy = {
    requireCompleteReview: true,
    components: {
      Example: {
        domTarget: "Input receives native props and ref.",
        controlledBehavior: "Caller owns value.",
        defaultBehavior: "No uncontrolled fallback.",
        reviewSources: ["example.tsx"],
        props: {
          value: { meaning: "Displayed input value.", migration: "Preserve caller ownership." },
        },
      },
    },
  };
  assert.doesNotThrow(() => validateReview(matrix, policy));
  const mutate = (update) => {
    const copy = structuredClone(policy);
    update(copy.components.Example);
    return copy;
  };
  for (const field of ["domTarget", "controlledBehavior", "defaultBehavior", "reviewSources"])
    assert.throws(
      () =>
        validateReview(
          matrix,
          mutate((review) => delete review[field]),
        ),
      /Incomplete API review/,
    );
  assert.throws(
    () =>
      validateReview(
        matrix,
        mutate((review) => delete review.props.value),
      ),
    /Incomplete axis review/,
  );
  assert.throws(
    () =>
      validateReview(
        matrix,
        mutate((review) => (review.props.value.migration = " ")),
      ),
    /Incomplete axis review/,
  );
  assert.throws(
    () =>
      validateReview(
        { components: [...matrix.components, { name: "NewPart", props: [] }] },
        policy,
      ),
    /NewPart.domTarget/,
  );
  assert.throws(() => validateReview({ components: [] }, policy), /Stale component policy/);
  assert.throws(
    () =>
      validateReview(
        matrix,
        mutate((review) => (review.props.removed = {})),
      ),
    /Stale prop policy/,
  );
  // Partial fixture inventories are not silently promoted to completed reviews.
  assert.doesNotThrow(() => validateReview(matrix, { components: {} }));
});
