/**
 * The side nav's two scopes (Josef's decision of 2026-11-14): the organization's, on every page
 * outside a program or a product, and a work scope that opens under a program or a product, its
 * work as a chain in order. Which scope an address opens, where each destination leads and which
 * one the address marks current are derived here from the address alone, a program's record at an
 * address of its own taking its program from the record; the shell draws them
 * (src/components/app/scope-navigation.tsx).
 */

/** Where an address stands: the organization, or the program or product whose work it is. */
export type NavigationScope =
  | { kind: "organization" }
  | { kind: "program"; programId: string }
  /** A program's record at an address of its own: its program's work, once the record names it. */
  | { kind: "program-record"; record: ProgramRecord; recordId: string }
  | { kind: "product"; productId: string }
  /** A product assessment's record: its product's work, once the assessment names the product. */
  | { kind: "product-assessment"; assessmentId: string };

/**
 * A program's records whose pages sit at an address outside the program's, by that address, and
 * the entry of the program's work that lists each: a risk Risks, a remediation item and a POA&M
 * plan POA&M, an operational issue and an assessment finding Findings, an asset System (its
 * system's record lists it), evidence Evidence, a campaign Assessments, a package Authorization. A
 * task and a workstream mark none: the program's Schedule lists its tasks and holds no entry, and
 * no part of the program lists its workstreams.
 */
export const programRecordPages = {
  risk: { path: "/register/risks", entry: "risks" },
  remediation: { path: "/register/poam", entry: "poam" },
  "poam-plan": { path: "/poam-documents", entry: "poam" },
  issue: { path: "/issues", entry: "findings" },
  finding: { path: "/findings", entry: "findings" },
  asset: { path: "/findings/assets", entry: "system" },
  evidence: { path: "/evidence", entry: "evidence" },
  campaign: { path: "/campaigns", entry: "assessments" },
  package: { path: "/packages", entry: "authorization" },
  task: { path: "/tasks", entry: null },
  workstream: { path: "/workstreams", entry: null },
} as const satisfies Record<string, { path: string; entry: ProgramEntry | null }>;

export type ProgramRecord = keyof typeof programRecordPages;

/**
 * The scope an address opens. A program's record, its tabs, its focused views and its records
 * under `/programs/:id/…` open its work, and so does a program's record at an address of its own
 * (`programRecordPages`) once the record names its program; a product's record and a product
 * assessment's open the product's. Program setup (`/programs/new`) and everything else stay in the
 * organization.
 */
export function navigationScope(pathname: string): NavigationScope {
  const segments = pathname.split("/").filter(Boolean);
  const [first, second, third] = segments;
  if (first === "programs" && second && second !== "new")
    return { kind: "program", programId: second };
  if (first === "library" && second === "products" && third)
    return { kind: "product", productId: third };
  if (first === "library" && second === "product-assessments" && third)
    return { kind: "product-assessment", assessmentId: third };
  // The record's own address, its id one segment under its register's: `/findings/assets/:id` is
  // an asset, `/findings/:id` a finding.
  for (const [record, page] of Object.entries(programRecordPages) as [
    ProgramRecord,
    { path: string },
  ][]) {
    const prefix = page.path.split("/").filter(Boolean);
    const recordId = segments[prefix.length];
    if (
      recordId &&
      segments.length === prefix.length + 1 &&
      prefix.every((part, index) => segments[index] === part)
    )
      return { kind: "program-record", record, recordId };
  }
  return { kind: "organization" };
}

/** The address itself, or a page under it: `/programs` holds `/programs/…`, not `/programsx`. */
const within = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);

/**
 * A destination of the organization scope: where it leads (`to`) and the addresses whose pages it
 * holds, which mark it current. A record whose page sits at another address than its register's (a
 * task, a workstream, an issue, a risk, a POA&M plan) is held where its trail says it belongs.
 */
type OrganizationDestination = {
  key: string;
  label: string;
  to: string;
  holds: readonly string[];
};

/**
 * The organization's destinations: Home, Portfolio and Programs, then the Library. Home is My work
 * until a desk exists; Frameworks is the control catalog, its CCIs and their sources; Guidance the
 * supplemental guidance beside it (NIST SP 800-160). Every other destination the application had
 * is under Registers, one quiet group after the Library, named for what they are.
 */
export const organizationDestinations = {
  top: [
    { key: "home", label: "Home", to: "/work", holds: ["/work", "/tasks"] },
    { key: "portfolio", label: "Portfolio", to: "/", holds: [] },
    { key: "programs", label: "Programs", to: "/programs", holds: ["/programs", "/workstreams"] },
  ],
  library: [
    { key: "frameworks", label: "Frameworks", to: "/catalog", holds: ["/catalog"] },
    { key: "overlays", label: "Overlays", to: "/overlays", holds: ["/overlays"] },
    { key: "guidance", label: "Guidance", to: "/guidance", holds: ["/guidance"] },
    {
      key: "components",
      label: "Components",
      to: "/library/components",
      // The components, and the sets they are versioned in.
      holds: ["/library/components", "/library/component-sets"],
    },
  ],
  registers: [
    { key: "review-queue", label: "Review queue", to: "/review-queue", holds: ["/review-queue"] },
    { key: "campaigns", label: "Assessment campaigns", to: "/campaigns", holds: ["/campaigns"] },
    { key: "evidence", label: "Evidence", to: "/evidence", holds: ["/evidence"] },
    {
      key: "findings",
      label: "Findings & assets",
      to: "/findings",
      holds: ["/findings", "/issues"],
    },
    {
      key: "register",
      label: "POA&M & risk register",
      to: "/register",
      holds: ["/register", "/risks", "/poam-documents"],
    },
    { key: "packages", label: "Packages", to: "/packages", holds: ["/packages"] },
    { key: "briefing", label: "Authorization decisions", to: "/briefing", holds: ["/briefing"] },
    { key: "profiles", label: "Profiles", to: "/profiles", holds: ["/profiles"] },
    {
      key: "business-lines",
      label: "Business lines",
      to: "/library/business-lines",
      holds: ["/library/business-lines"],
    },
    {
      key: "products",
      label: "Products",
      to: "/library/products",
      holds: ["/library/products", "/library/product-assessments"],
    },
    {
      key: "requirements",
      label: "Requirements",
      to: "/library/requirements",
      holds: ["/library/requirements"],
    },
    { key: "suppliers", label: "Suppliers", to: "/vendors", holds: ["/vendors"] },
  ],
} as const satisfies Record<string, readonly OrganizationDestination[]>;

export type OrganizationKey =
  (typeof organizationDestinations)[keyof typeof organizationDestinations][number]["key"];

/** The organization destination an address marks current, if any. */
export function organizationEntry(pathname: string): OrganizationKey | undefined {
  if (pathname === "/") return "portfolio";
  const all = Object.values(organizationDestinations).flat() as readonly OrganizationDestination[];
  return all.find((destination) => destination.holds.some((to) => within(pathname, to)))?.key as
    OrganizationKey | undefined;
}

/**
 * A program's work, in the chain's order, then the quieter Assess and authorize. Each leads to the
 * program's tab or focused view that holds that work: Controls the part, which opens on its Status
 * view (its switch also leads to Baseline), Baseline the Control baseline view,
 * Authorization its view, POA&M and Risks the POA&M & risk tab at each Section, Assessments the
 * Assessment campaigns tab.
 */
export const programDestinations = {
  chain: [
    { key: "overview", label: "Overview" },
    { key: "system", label: "System" },
    { key: "baseline", label: "Baseline" },
    { key: "controls", label: "Controls" },
    { key: "requirements", label: "Requirements" },
    { key: "evidence", label: "Evidence" },
    { key: "findings", label: "Findings" },
    { key: "poam", label: "POA&M" },
    { key: "risks", label: "Risks" },
  ],
  quiet: [
    { key: "assessments", label: "Assessments" },
    { key: "authorization", label: "Authorization" },
  ],
} as const;

export type ProgramEntry =
  (typeof programDestinations)[keyof typeof programDestinations][number]["key"];

/** The Section of the POA&M & risk tab that each of its two entries opens at. */
export const programSections = { poam: "program-poam_documents", risks: "program-risks" } as const;

/**
 * A page under the program's address, by its first segment, and the entry that holds it: its
 * records (a control, a requirement, a system, a component) and each focused view, under the work
 * it reads (the tab the view is listed under).
 */
const programPages: Readonly<Record<string, ProgramEntry>> = {
  controls: "controls",
  requirements: "requirements",
  systems: "system",
  components: "system",
  "control-baseline": "baseline",
  authorization: "authorization",
  export: "overview",
  baseline: "system",
  posture: "requirements",
  compliance: "requirements",
  workbook: "requirements",
  sctm: "requirements",
  // The Control status view's old address, which opens the Controls part's Status view.
  "control-status": "controls",
  resiliency: "controls",
  "product-delta": "controls",
  inheritance: "controls",
  conmon: "assessments",
  ingestion: "assessments",
  risk: "risks",
};

/**
 * The program's tabs, by name, and the entry that holds each. Library is what a system takes from
 * above, so it is System's; Schedule holds no entry of the chain, so none is current there.
 */
const programTabEntries: Readonly<Record<string, ProgramEntry | null>> = {
  overview: "overview",
  system: "system",
  library: "system",
  requirements: "requirements",
  controls: "controls",
  "assessment campaigns": "assessments",
  schedule: null,
  findings: "findings",
  evidence: "evidence",
  "poa&m & risk": "poam",
};

/**
 * The program entry an address marks current: by the page under the program's address, else by
 * the tab, the POA&M & risk tab's Risks Section marking Risks. An address that names no tab is the
 * Overview, as the record shows it.
 */
export function programEntry(
  pathname: string,
  tab: unknown,
  hash: string,
): ProgramEntry | undefined {
  const page = pathname.split("/").filter(Boolean)[2];
  if (page) return programPages[page];
  const named = typeof tab === "string" && tab ? tab.toLowerCase() : "overview";
  const entry = named in programTabEntries ? programTabEntries[named] : "overview";
  if (entry === "poam" && hash === programSections.risks) return "risks";
  return entry ?? undefined;
}

/**
 * A product's work: the same chain where the product record has something behind it, Structure in
 * System's place, Where used at its end, and Assessments alone under Assess. Controls is the
 * Assessment tab's List of controls by configuration; Assessments the same tab's configurations,
 * whose Section lists the version's product assessments; Where used its Variants. An entry with
 * nothing behind it on a product yet (Baseline, Requirements, Evidence, Findings, POA&M, Risks) is
 * left out.
 */
export const productDestinations = {
  chain: [
    { key: "overview", label: "Overview" },
    { key: "structure", label: "Structure" },
    { key: "controls", label: "Controls" },
    { key: "where-used", label: "Where used" },
  ],
  quiet: [{ key: "assessments", label: "Assessments" }],
} as const;

export type ProductEntry =
  (typeof productDestinations)[keyof typeof productDestinations][number]["key"];

/** The product record's tabs, by name, and the entry that holds each; Versions holds none. */
const productTabEntries: Readonly<Record<string, ProductEntry | null>> = {
  overview: "overview",
  structure: "structure",
  configurations: "structure",
  assessment: "assessments",
  variants: "where-used",
  versions: null,
};

/**
 * The product entry an address marks current: a product assessment's record is Assessments; on
 * the product's record, its tab, the Assessment tab's List (`show=list`) being Controls.
 */
export function productEntry(
  pathname: string,
  tab: unknown,
  show: unknown,
): ProductEntry | undefined {
  if (navigationScope(pathname).kind === "product-assessment") return "assessments";
  const named = typeof tab === "string" && tab ? tab.toLowerCase() : "overview";
  const entry = named in productTabEntries ? productTabEntries[named] : "overview";
  if (entry === "assessments" && show === "list") return "controls";
  return entry ?? undefined;
}

/**
 * The square mark of a program or a product in the switcher: the first letters of its name's first
 * two words ("Atlas payments platform" is AP, "X800 Missile" XM).
 */
export function scopeMark(name: string): string {
  const words = name.split(/[\s·]+/).filter((word) => /[\p{L}\p{N}]/u.test(word));
  return words
    .slice(0, 2)
    .map((word) => [...word].find((letter) => /[\p{L}\p{N}]/u.test(letter)) ?? "")
    .join("")
    .toUpperCase();
}
