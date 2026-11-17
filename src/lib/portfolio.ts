/**
 * The Portfolio's hierarchy: business line › product › configuration › program, as one tree of
 * rows. A product sits under its business line (a product in none sits at the root), each active
 * configuration under its product, and each variant (a program's system created from the product)
 * under the configuration it was created from. A program that takes two products stands under
 * both. Every row knows the programs under it, so a cell can count what stands in them once.
 *
 * The rows are built from small reference collections (business lines, products, their versions
 * and configurations, the variants and their programs) and the elements each variant changed; the
 * counts that stand on a program (its control status, its open issues) are read apart, for the
 * programs this tree names, and summed by the screen over each row's `programIds`.
 */

export type PortfolioLine = { id: string; code: string; name: string };
export type PortfolioProduct = {
  id: string;
  code: string;
  name: string;
  business_line_id: string | null;
};
export type PortfolioVersion = {
  id: string;
  product_id: string;
  version_number: number;
  state: string;
  published_at: string | null;
};
export type PortfolioConfiguration = {
  id: string;
  product_id: string;
  code: string;
  name: string;
  state: string;
};
/** A program's system created from a product version: its authorization boundary. */
export type PortfolioVariant = {
  id: string;
  code: string;
  program_id: string;
  product_revision_id: string | null;
  product_configuration_id: string | null;
};
export type PortfolioProgram = { id: string; code: string; name: string };
/** An element inside a variant: whether the program declared what it changed in it. */
export type PortfolioElement = {
  boundary_system_id: string | null;
  product_change_kinds: readonly string[] | null;
};

export type PortfolioInput = {
  lines: readonly PortfolioLine[];
  products: readonly PortfolioProduct[];
  versions: readonly PortfolioVersion[];
  configurations: readonly PortfolioConfiguration[];
  variants: readonly PortfolioVariant[];
  programs: readonly PortfolioProgram[];
  elements: readonly PortfolioElement[];
};

/** What a row asks the reader to look at: the presets of the "Needs a look" strip filter on it. */
export type PortfolioAttention = "behind" | "modified";

export type PortfolioRow = {
  /** Unique in the tree: the kind, then the record's id. */
  id: string;
  kind: "line" | "product" | "configuration" | "variant";
  /** The record the row's name opens: the business line, product, configuration or program. */
  recordId: string;
  name: string;
  /** A product's code; a variant's system code. */
  code: string | null;
  /** A product's latest published version, or the version a variant took. */
  version: number | null;
  /** When a product's latest published version was published. */
  publishedAt: string | null;
  /** The version a product's standing is read from: its latest published one. */
  revisionId: string | null;
  /** A configuration's product version standing, by the configuration's id. */
  configurationId: string | null;
  /** How many published versions of its product are newer than the one a variant took. */
  behind: number;
  /** The programs under the row, each once: a variant's own program. */
  programIds: string[];
  /** The elements of the variants under the row whose program declared a change. */
  modified: number;
  /** A variant's: what the reader should look at. Empty on every other row. */
  attention: PortfolioAttention[];
  children: PortfolioRow[];
};

const byName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
const unique = (ids: readonly string[]) => [...new Set(ids)];

/** The hierarchy as tree rows: business lines by name, then the products in no business line. */
export function portfolioHierarchy(input: PortfolioInput): PortfolioRow[] {
  const programName = new Map(input.programs.map((program) => [program.id, program]));
  const versionOf = new Map(input.versions.map((version) => [version.id, version]));
  const changed = new Map<string, number>();
  for (const element of input.elements) {
    if (!element.boundary_system_id || !element.product_change_kinds?.length) continue;
    changed.set(element.boundary_system_id, (changed.get(element.boundary_system_id) ?? 0) + 1);
  }

  const variantRow = (variant: PortfolioVariant, published: readonly number[]): PortfolioRow => {
    const taken = variant.product_revision_id ? versionOf.get(variant.product_revision_id) : null;
    const behind = taken ? published.filter((number) => number > taken.version_number).length : 0;
    const modified = changed.get(variant.id) ?? 0;
    const program = programName.get(variant.program_id);
    return {
      id: `variant:${variant.id}`,
      kind: "variant",
      recordId: variant.program_id,
      name: program?.name ?? variant.code,
      code: variant.code,
      version: taken?.version_number ?? null,
      publishedAt: null,
      revisionId: null,
      configurationId: null,
      behind,
      programIds: [variant.program_id],
      modified,
      attention: [
        ...(behind > 0 ? (["behind"] as const) : []),
        ...(modified > 0 ? (["modified"] as const) : []),
      ],
      children: [],
    };
  };
  /** A summary row: what stands under it, its programs once. */
  const summed = (children: PortfolioRow[]) => ({
    programIds: unique(children.flatMap((child) => child.programIds)),
    modified: children.reduce((sum, child) => sum + child.modified, 0),
  });

  const productRow = (product: PortfolioProduct): PortfolioRow => {
    const versions = input.versions.filter((version) => version.product_id === product.id);
    const published = versions
      .filter((version) => version.state === "published")
      .sort((a, b) => b.version_number - a.version_number);
    const latest = published[0] ?? null;
    const numbers = published.map((version) => version.version_number);
    const ids = new Set(versions.map((version) => version.id));
    const variants = input.variants
      .filter((variant) => variant.product_revision_id && ids.has(variant.product_revision_id))
      .map((variant) => ({ variant, row: variantRow(variant, numbers) }))
      .sort((a, b) => byName(a.row, b.row));
    const configurations = input.configurations
      .filter((configuration) => configuration.product_id === product.id)
      .filter((configuration) => configuration.state === "active")
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const placed = new Set<string>();
    const children: PortfolioRow[] = configurations.map((configuration) => {
      const under = variants
        .filter(({ variant }) => variant.product_configuration_id === configuration.id)
        .map(({ row }) => row);
      for (const row of under) placed.add(row.id);
      return {
        id: `configuration:${configuration.id}`,
        kind: "configuration",
        recordId: configuration.id,
        name: configuration.name,
        code: configuration.code,
        version: null,
        publishedAt: null,
        revisionId: latest?.id ?? null,
        configurationId: configuration.id,
        behind: 0,
        ...summed(under),
        attention: [],
        children: under,
      };
    });
    // A variant of a configuration since retired stands under its product.
    children.push(...variants.map(({ row }) => row).filter((row) => !placed.has(row.id)));
    return {
      id: `product:${product.id}`,
      kind: "product",
      recordId: product.id,
      name: product.name,
      code: product.code,
      version: latest?.version_number ?? null,
      publishedAt: latest?.published_at ?? null,
      revisionId: latest?.id ?? null,
      configurationId: null,
      behind: 0,
      ...summed(children),
      attention: [],
      children,
    };
  };

  const lineIds = new Set(input.lines.map((line) => line.id));
  const lines = [...input.lines].sort(byName).map((line): PortfolioRow => {
    const children = input.products
      .filter((product) => product.business_line_id === line.id)
      .sort(byName)
      .map(productRow);
    return {
      id: `line:${line.id}`,
      kind: "line",
      recordId: line.id,
      name: line.name,
      code: line.code,
      version: null,
      publishedAt: null,
      revisionId: null,
      configurationId: null,
      behind: 0,
      ...summed(children),
      attention: [],
      children,
    };
  });
  const loose = input.products
    .filter((product) => !product.business_line_id || !lineIds.has(product.business_line_id))
    .sort(byName)
    .map(productRow);
  return [...lines, ...loose];
}

/** Every row of the tree, depth first. */
export const portfolioRows = (rows: readonly PortfolioRow[]): PortfolioRow[] =>
  rows.flatMap((row) => [row, ...portfolioRows(row.children)]);

/** The programs that take a product, each once. */
export const programsOnAProduct = (rows: readonly PortfolioRow[]): string[] =>
  unique(rows.flatMap((row) => row.programIds));

/** Open issues by severity, a key of `severityLevels`; an issue nobody rated counts under none. */
export type SeverityCounts = Readonly<Record<string, number>>;

/** The open issues of each program, by severity, from the issues' program and severity. */
export function issuesByProgram(
  issues: readonly { program_id: string | null; severity: string | null }[],
): ReadonlyMap<string, SeverityCounts> {
  const counts = new Map<string, Record<string, number>>();
  for (const issue of issues) {
    if (!issue.program_id) continue;
    const program = counts.get(issue.program_id) ?? {};
    const key = issue.severity ?? "none";
    program[key] = (program[key] ?? 0) + 1;
    counts.set(issue.program_id, program);
  }
  return counts;
}

/** The open issues of a row's programs, by severity: each program counted once. */
export function rowIssues(
  row: Pick<PortfolioRow, "programIds">,
  byProgram: ReadonlyMap<string, SeverityCounts>,
): Record<string, number> {
  const total: Record<string, number> = {};
  for (const id of row.programIds)
    for (const [severity, count] of Object.entries(byProgram.get(id) ?? {}))
      total[severity] = (total[severity] ?? 0) + count;
  return total;
}
