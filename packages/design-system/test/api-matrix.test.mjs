import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { extractMatrix, renderMarkdown, validatePolicy } from "../../../scripts/ds-api-matrix.mjs";

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
    assert.equal(component.domTarget.status, "not-documented");
    assert.equal(component.controlledBehavior.status, "not-documented");
    assert.equal(component.defaultBehavior.status, "not-documented");
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
    const inheritedPolicy = {
      components: {
        Renamed: {
          props: {
            externalFlag: { meaning: "Dependency flag with an intentional integration note." },
          },
        },
      },
    };
    const documentedInherited = extractMatrix(program, entry, inheritedPolicy);
    assert.ok(
      documentedInherited.components[0].props.find((prop) => prop.name === "externalFlag")
        ?.policyNote,
    );
    assert.doesNotThrow(() => validatePolicy(matrix, inheritedPolicy));
    const documentedMarkdown = renderMarkdown(documentedInherited, inheritedPolicy);
    assert.match(documentedMarkdown, /Dependency flag with an intentional integration note/);
    assert.doesNotMatch(documentedMarkdown, /Migration:\*\* undefined/);
    const markdown = renderMarkdown(matrix, { axes: {} });
    assert.match(markdown, /Action emphasis, not status/);
    assert.match(markdown, /not-documented/);
    assert.match(markdown, /Literal values/);
    assert.match(markdown, /new components and props do not require entries/);
    assert.match(markdown, /\[JSON evidence\]\(\.\/prop-matrix.json\)/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("optional API notes allow new APIs and reject stale or invalid supplied entries", () => {
  const matrix = { components: [{ name: "Example", props: [{ name: "value", axis: "value" }] }] };
  const policy = {
    components: {
      Example: {
        domTarget: "Input receives native props and ref.",
        controlledBehavior: "Caller owns value.",
        defaultBehavior: "No uncontrolled fallback.",
        reviewSources: ["example.tsx"],
        props: {
          value: { meaning: "Displayed input value." },
        },
      },
    },
  };
  assert.doesNotThrow(() => validatePolicy(matrix, policy));
  const mutate = (update) => {
    const copy = structuredClone(policy);
    update(copy.components.Example);
    return copy;
  };
  for (const field of ["domTarget", "controlledBehavior", "defaultBehavior", "reviewSources"])
    assert.doesNotThrow(() =>
      validatePolicy(
        matrix,
        mutate((review) => delete review[field]),
      ),
    );
  assert.doesNotThrow(() =>
    validatePolicy(
      matrix,
      mutate((review) => delete review.props.value),
    ),
  );
  assert.throws(
    () =>
      validatePolicy(
        matrix,
        mutate((review) => (review.props.value.migration = " ")),
      ),
    /Invalid policy note: Example.value.migration/,
  );
  assert.doesNotThrow(() =>
    validatePolicy(
      {
        components: [
          {
            name: "Example",
            props: [...matrix.components[0].props, { name: "newAxis", axis: "tone" }],
          },
          { name: "NewPart", props: [] },
        ],
      },
      policy,
    ),
  );
  assert.throws(() => validatePolicy({ components: [] }, policy), /Stale component policy/);
  assert.throws(
    () =>
      validatePolicy(
        matrix,
        mutate((review) => (review.props.removed = {})),
      ),
    /Stale prop policy/,
  );
  assert.throws(
    () =>
      validatePolicy(
        matrix,
        mutate((review) => (review.props.value.meaning = " ")),
      ),
    /Missing policy meaning: Example.value/,
  );
  assert.throws(
    () =>
      validatePolicy(
        matrix,
        mutate((review) => (review.domTarget = 42)),
      ),
    /Invalid policy note: Example.domTarget/,
  );
  assert.throws(
    () =>
      validatePolicy(
        matrix,
        mutate((review) => (review.reviewSources = [""])),
      ),
    /Invalid policy sources/,
  );
  assert.doesNotThrow(() => validatePolicy(matrix, { components: {} }));
  assert.doesNotThrow(() => validatePolicy(matrix, {}));
});
