// The side nav has two scopes (Josef's decision of 2026-11-14), drawn with the kit's Shell parts.
//
// The organization scope, on every page outside a program or a product: Home, Portfolio and
// Programs, then the Library (Frameworks, Overlays, Guidance, Components), then Registers, one
// quiet group that opens in place and holds every other destination (the cross-program registers,
// the Review queue, Authorization decisions, Profiles, Business lines, Products, the requirement
// library and Suppliers), then the reader's favorites; the account at the foot. Home is My work
// until a desk exists, Frameworks the control catalog, Guidance the supplemental guidance
// (NIST SP 800-160).
//
// The work scope, on a program's pages (its record and tabs, its focused views, its records under
// `/programs/:id/…`), on a program's records at an address of their own (a risk, an issue,
// evidence, a campaign: `programRecordPages`) once the record names its program, and on a product's
// (its record and its product assessments): Home, then the switcher naming the program or product
// (its code and name and what it is part of, over a square mark; a link back to the organization's
// Portfolio), then the chain of its work in order and a quieter group under it: for a program
// Overview, System, Baseline, Controls, Requirements, Evidence, Findings, POA&M, Risks, then Assess
// and authorize (Assessments, Authorization); for a product Overview, Structure, Controls, Where
// used, then Assess (Assessments), leaving out what a product has nothing behind yet. Each entry
// leads to the tab or focused view that holds that work; the Library and the account sit at the
// foot. A program or product that cannot be found falls back to the organization scope.
//
// A program's record at an address of its own opens in the organization scope while it loads, and
// switches once, whole, when the record and its program are read: the record by the page's own
// read of it (the same query), the program and its business line as every work scope reads them.
// A record of no program (a workspace's evidence) stays in the organization. Arriving from the
// program's own work (its Risks to a risk), the nav keeps that program's work while the record
// loads, so it never passes through the organization. The switch moves no focus: the shell moves
// it to Main once, on arrival.
//
// The current entry is marked from the address (route, tab, the POA&M & risk tab's Section), as
// `src/lib/navigation-scope.ts` derives it; the screen inventory declares each route's
// (`nav`), and the screen-family sweep checks it.

import { Link, useRouterState } from "@tanstack/react-router";
import { Avatar, AvatarFallback, Shell, Stack } from "@ledger/design-system";
import {
  Archive,
  ArrowDownFromLine,
  BookMarked,
  BookOpen,
  Boxes,
  Briefcase,
  Bug,
  ClipboardCheck,
  ClipboardList,
  Component,
  FileCheck2,
  FlaskConical,
  FolderKanban,
  Gavel,
  House,
  Layers,
  Layers2,
  LayoutDashboard,
  Library,
  ListChecks,
  ListTree,
  Network,
  Package,
  Rows3,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Stamp,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRow, type TableName } from "@/lib/models";
import { useAssuranceTrace } from "@/lib/assurance-trace";
import {
  navigationScope,
  organizationDestinations,
  organizationEntry,
  productDestinations,
  productEntry,
  programDestinations,
  programEntry,
  programRecordPages,
  programSections,
  scopeMark,
  type NavigationScope,
  type OrganizationKey,
  type ProductEntry,
  type ProgramEntry,
  type ProgramRecord,
} from "@/lib/navigation-scope";
import type { ProgramTab } from "@/components/prototype/program-workspace";
import { PersonalNavigationSection } from "./personal-navigation";

const organizationIcons: Record<OrganizationKey, LucideIcon> = {
  home: House,
  portfolio: Network,
  programs: FolderKanban,
  frameworks: BookOpen,
  overlays: Layers2,
  guidance: BookMarked,
  components: Component,
  "review-queue": Stamp,
  campaigns: FlaskConical,
  evidence: Archive,
  findings: Bug,
  register: ShieldAlert,
  packages: Package,
  briefing: Gavel,
  profiles: ShieldCheck,
  "business-lines": Briefcase,
  products: Boxes,
  requirements: ListChecks,
  suppliers: Users,
};

const programIcons: Record<ProgramEntry, LucideIcon> = {
  overview: LayoutDashboard,
  system: Boxes,
  baseline: Layers,
  controls: ShieldCheck,
  requirements: ListChecks,
  evidence: FileCheck2,
  findings: ScanSearch,
  poam: ClipboardList,
  risks: TriangleAlert,
  assessments: ClipboardCheck,
  authorization: Stamp,
};

const productIcons: Record<ProductEntry, LucideIcon> = {
  overview: LayoutDashboard,
  structure: ListTree,
  controls: ShieldCheck,
  "where-used": ArrowDownFromLine,
  assessments: ClipboardCheck,
};

/**
 * The router marks a link it finds active `aria-current` itself, over the item's own mark, and it
 * finds `/programs/:id` active under every page of the program. The nav's links are marked current
 * from the address (`isActive`), so the router marks one only where the address is exactly its
 * own, which the nav marks current too.
 */
const exact = { exact: true, includeHash: true } as const;

/** Where the address is: its path, its search and its hash, as the router holds them now. */
function useAddress() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const hash = useRouterState({ select: (state) => state.location.hash });
  return { pathname, search, hash };
}

/**
 * The side nav's body and footer for the scope the address opens. `account` is the footer's
 * account menu, the same in both scopes.
 */
export function ScopeNavigation({ account }: { account: ReactNode }) {
  const address = useAddress();
  const scope = navigationScope(address.pathname);
  // The program whose work the nav shows, which a program's record keeps while it loads.
  const [held, setHeld] = useState<string | null>(null);
  const shows = scope.kind === "program" ? scope.programId : null;
  if (scope.kind !== "program-record" && shows !== held) setHeld(shows);
  switch (scope.kind) {
    case "program":
      return (
        <ProgramNav
          programId={scope.programId}
          current={programEntry(address.pathname, address.search["tab"], address.hash)}
          account={account}
          {...address}
        />
      );
    case "program-record":
      return (
        <ProgramRecordNav
          scope={scope}
          held={held}
          onShown={setHeld}
          account={account}
          {...address}
        />
      );
    case "product":
      return (
        <ProductNav
          productId={scope.productId}
          version={
            typeof address.search["version"] === "string" ? address.search["version"] : undefined
          }
          account={account}
          {...address}
        />
      );
    case "product-assessment":
      return (
        <AssessmentProductNav assessmentId={scope.assessmentId} account={account} {...address} />
      );
    case "organization":
      return <OrganizationNav account={account} {...address} />;
  }
}

type AddressProps = ReturnType<typeof useAddress> & { account: ReactNode };

/** Home, which leads to My work from either scope until a desk exists. */
function HomeItem({ isActive }: { isActive: boolean }) {
  return (
    <Shell.SideNav.Item
      icon={House}
      isActive={isActive}
      render={<Link activeOptions={exact} to="/work" />}
    >
      Home
    </Shell.SideNav.Item>
  );
}

/** One organization destination, a router link to it. */
function OrganizationItem({
  destination,
  current,
}: {
  destination: (typeof organizationDestinations)[keyof typeof organizationDestinations][number];
  current: OrganizationKey | undefined;
}) {
  return (
    <Shell.SideNav.Item
      icon={organizationIcons[destination.key]}
      isActive={current === destination.key}
      render={<Link activeOptions={exact} to={destination.to} />}
    >
      {destination.label}
    </Shell.SideNav.Item>
  );
}

/**
 * The organization scope: Home, Portfolio and Programs, the Library, then Registers, the quiet
 * group of every other destination, which opens in place and opens itself when it holds the page.
 */
function OrganizationNav({ pathname, account }: AddressProps) {
  const current = organizationEntry(pathname);
  const register = organizationDestinations.registers.find((item) => item.key === current)?.key;
  const [open, setOpen] = useState(Boolean(register));
  // The current destination stays in view: arriving on a register opens the group.
  const [shown, setShown] = useState(register);
  if (register !== shown) {
    setShown(register);
    if (register) setOpen(true);
  }
  return (
    <>
      <Shell.SideNav.Body>
        <Shell.SideNav.Section>
          {organizationDestinations.top.map((destination) =>
            destination.key === "home" ? (
              <HomeItem key={destination.key} isActive={current === "home"} />
            ) : (
              <OrganizationItem key={destination.key} destination={destination} current={current} />
            ),
          )}
        </Shell.SideNav.Section>
        <Shell.SideNav.Section heading="Library">
          {organizationDestinations.library.map((destination) => (
            <OrganizationItem key={destination.key} destination={destination} current={current} />
          ))}
        </Shell.SideNav.Section>
        <Shell.SideNav.Expandable
          label="Registers"
          icon={Rows3}
          isActive={Boolean(register)}
          open={open}
          onOpenChange={setOpen}
        >
          {organizationDestinations.registers.map((destination) => (
            <OrganizationItem key={destination.key} destination={destination} current={current} />
          ))}
        </Shell.SideNav.Expandable>
        <PersonalNavigationSection />
      </Shell.SideNav.Body>
      <Shell.SideNav.Footer>{account}</Shell.SideNav.Footer>
    </>
  );
}

/**
 * The work scope's switcher: the program or product it is open on, by its code or name, then its
 * name or what it is, and what it is part of, over a square mark. The kit's Profile, the side
 * nav's row of a mark and two lines, drawn as a link back to the organization's Portfolio; in the
 * icon rail its mark stays and the names show on hover and focus.
 */
function WorkScopeLink({
  mark,
  name,
  description,
}: {
  mark: string;
  name: string;
  description: string;
}) {
  return (
    <Shell.Profile
      avatar={
        <Avatar size="small" shape="square" aria-hidden="true">
          <AvatarFallback>{scopeMark(mark)}</AvatarFallback>
        </Avatar>
      }
      name={name}
      description={description}
      render={<Link activeOptions={exact} to="/" aria-description="Back to the Portfolio" />}
    />
  );
}

/** The work scope's foot: the Library, then the account. */
function WorkFooter({ account }: { account: ReactNode }) {
  return (
    <Shell.SideNav.Footer>
      <Stack space="space.100">
        <Shell.SideNav.Item icon={Library} render={<Link activeOptions={exact} to="/catalog" />}>
          Library
        </Shell.SideNav.Item>
        {account}
      </Stack>
    </Shell.SideNav.Footer>
  );
}

/** The program tab each entry of the chain opens, where it opens one. */
const programTabs: Record<
  Exclude<ProgramEntry, "overview" | "baseline" | "authorization" | "poam" | "risks">,
  ProgramTab
> = {
  system: "System",
  controls: "Controls",
  requirements: "Requirements",
  evidence: "Evidence",
  findings: "Findings",
  assessments: "Assessment campaigns",
};

/** Where a program entry leads: its tab, its focused view, or the POA&M & risk tab's Section. */
function programLink(entry: ProgramEntry, programId: string) {
  const params = { programId };
  switch (entry) {
    case "overview":
      return <Link activeOptions={exact} to="/programs/$programId" params={params} />;
    case "baseline":
      return (
        <Link activeOptions={exact} to="/programs/$programId/control-baseline" params={params} />
      );
    case "authorization":
      return <Link activeOptions={exact} to="/programs/$programId/authorization" params={params} />;
    case "poam":
    case "risks":
      return (
        <Link
          activeOptions={exact}
          to="/programs/$programId"
          params={params}
          search={{ tab: "POA&M & risk" }}
          hash={programSections[entry]}
        />
      );
    default:
      return (
        <Link
          activeOptions={exact}
          to="/programs/$programId"
          params={params}
          search={{ tab: programTabs[entry] }}
        />
      );
  }
}

/**
 * A program's work scope, `current` the entry the address marks. A program that cannot be found
 * leaves the reader in the organization.
 */
function ProgramNav({
  programId,
  current,
  pathname,
  search,
  hash,
  account,
}: AddressProps & { programId: string; current: ProgramEntry | undefined }) {
  const program = useRow("programs", programId);
  const line = useRow("business_lines", program.data?.business_line_id);
  if (program.data === null)
    return <OrganizationNav pathname={pathname} search={search} hash={hash} account={account} />;
  const item = (
    entry: (typeof programDestinations.chain)[number] | (typeof programDestinations.quiet)[number],
  ) => (
    <Shell.SideNav.Item
      key={entry.key}
      icon={programIcons[entry.key]}
      isActive={current === entry.key}
      render={programLink(entry.key, programId)}
    >
      {entry.label}
    </Shell.SideNav.Item>
  );
  return (
    <>
      <Shell.SideNav.Body>
        <Shell.SideNav.Section>
          <HomeItem isActive={false} />
        </Shell.SideNav.Section>
        {program.data && (
          <WorkScopeLink
            mark={program.data.name}
            name={program.data.code}
            description={line.data ? `${program.data.name} · ${line.data.name}` : program.data.name}
          />
        )}
        <Shell.SideNav.Section>{programDestinations.chain.map(item)}</Shell.SideNav.Section>
        <Shell.SideNav.Section heading="Assess and authorize">
          {programDestinations.quiet.map(item)}
        </Shell.SideNav.Section>
        <PersonalNavigationSection />
      </Shell.SideNav.Body>
      <WorkFooter account={account} />
    </>
  );
}

/** The table of each program record at an address of its own, which the record's page reads. */
const programRecordTables = {
  risk: "risks",
  remediation: "poam_items",
  "poam-plan": "poam_documents",
  issue: "operational_issues",
  finding: "assessment_findings",
  asset: "inventory_items",
  evidence: "evidence_artifacts",
  campaign: "assessment_campaigns",
  package: "authorization_packages",
  task: "tasks",
  workstream: "workstreams",
} as const satisfies Record<ProgramRecord, TableName>;

/** What the nav reads of a program's record: its program, else what leads to it. */
type ProgramRecordFields = {
  program_id?: string | null;
  poam_document_id?: string | null;
  system_id?: string | null;
};

/**
 * The program a record names, through the reads its page makes already (the same queries, so the
 * nav asks nothing more): its own `program_id`; a remediation item's POA&M plan's, as its Details
 * name the plan; an asset's system's, as its Details name the system; an assessment finding's from
 * its trace, the program of its results' campaign. `undefined` while that is read, `null` for a
 * record of no program, one that cannot be found, or a read that failed.
 */
function useRecordProgram(
  scope: Extract<NavigationScope, { kind: "program-record" }>,
): string | null | undefined {
  const query = useRow(programRecordTables[scope.record] as TableName, scope.recordId);
  const record = query.data as ProgramRecordFields | null | undefined;
  const plan = useRow(
    "poam_documents",
    scope.record === "remediation" ? record?.poam_document_id : undefined,
  );
  const system = useRow("systems", scope.record === "asset" ? record?.system_id : undefined);
  const trace = useAssuranceTrace(
    scope.record === "finding" ? { kind: "finding", id: scope.recordId } : null,
  );
  if (query.isError || record === null) return null;
  if (record === undefined) return undefined;
  const through = (hop: { data?: { program_id: string } | null | undefined; isError: boolean }) =>
    hop.isError ? null : hop.data === undefined ? undefined : (hop.data?.program_id ?? null);
  switch (scope.record) {
    case "remediation":
      return through(plan);
    case "asset":
      return through(system);
    case "finding": {
      if (trace.isError) return null;
      // A trace kept from the finding before answers nothing of this one.
      if (!trace.data || trace.isPlaceholderData) return undefined;
      return (
        trace.data.findings.find((finding) => finding.id === scope.recordId)?.program_id ?? null
      );
    }
    default:
      return record.program_id ?? null;
  }
}

/**
 * A program's record at an address of its own: the organization's scope while the record, its
 * program and the program's business line are read (or the program's work the nav was showing),
 * then that program's work with the entry that lists the record current, all at once. `onShown`
 * hears the program the nav shows, which the next record keeps while it loads.
 */
function ProgramRecordNav({
  scope,
  held,
  onShown,
  ...address
}: AddressProps & {
  scope: Extract<NavigationScope, { kind: "program-record" }>;
  held: string | null;
  onShown: (programId: string | null) => void;
}) {
  const named = useRecordProgram(scope);
  const program = useRow("programs", named);
  const line = useRow("business_lines", program.data?.business_line_id);
  const read = program.data !== undefined && !line.isLoading;
  const shown =
    named === null || program.data === null || program.isError
      ? null
      : named !== undefined && read
        ? named
        : held;
  useEffect(() => onShown(shown), [shown, onShown]);
  return shown ? (
    <ProgramNav
      programId={shown}
      current={programRecordPages[scope.record].entry ?? undefined}
      {...address}
    />
  ) : (
    <OrganizationNav {...address} />
  );
}

/**
 * The product record's search for an entry: the version the reader is on, kept, then the tab, and
 * the Assessment tab's List for Controls.
 */
function productSearch(entry: ProductEntry, version: string | undefined): Record<string, unknown> {
  const tab = {
    overview: undefined,
    structure: "Structure",
    controls: "Assessment",
    "where-used": "Variants",
    assessments: "Assessment",
  }[entry];
  return {
    ...(version ? { version } : {}),
    ...(tab ? { tab } : {}),
    ...(entry === "controls" ? { show: "list" } : {}),
  };
}

/** A product's work scope. A product that cannot be found leaves the reader in the organization. */
function ProductNav({
  productId,
  version,
  pathname,
  search,
  hash,
  account,
}: AddressProps & { productId: string; version: string | undefined }) {
  const product = useRow("products", productId);
  const line = useRow("business_lines", product.data?.business_line_id);
  if (product.data === null)
    return <OrganizationNav pathname={pathname} search={search} hash={hash} account={account} />;
  const current = productEntry(pathname, search["tab"], search["show"]);
  const item = (
    entry: (typeof productDestinations.chain)[number] | (typeof productDestinations.quiet)[number],
  ) => (
    <Shell.SideNav.Item
      key={entry.key}
      icon={productIcons[entry.key]}
      isActive={current === entry.key}
      render={
        <Link
          activeOptions={exact}
          to="/library/products/$productKey"
          params={{ productKey: productId }}
          search={() => productSearch(entry.key, version)}
        />
      }
    >
      {entry.label}
    </Shell.SideNav.Item>
  );
  return (
    <>
      <Shell.SideNav.Body>
        <Shell.SideNav.Section>
          <HomeItem isActive={false} />
        </Shell.SideNav.Section>
        {product.data && (
          <WorkScopeLink
            mark={product.data.name}
            name={product.data.name}
            description={line.data ? `Product · ${line.data.name}` : "Product"}
          />
        )}
        <Shell.SideNav.Section>{productDestinations.chain.map(item)}</Shell.SideNav.Section>
        <Shell.SideNav.Section heading="Assess">
          {productDestinations.quiet.map(item)}
        </Shell.SideNav.Section>
        <PersonalNavigationSection />
      </Shell.SideNav.Body>
      <WorkFooter account={account} />
    </>
  );
}

/**
 * A product assessment's record opens its product's work, at the version it judges, once the
 * assessment names the product; one that cannot be found leaves the reader in the organization.
 */
function AssessmentProductNav({
  assessmentId,
  ...address
}: AddressProps & { assessmentId: string }) {
  const assessment = useRow("product_assessments", assessmentId);
  const revision = useRow("product_revisions", assessment.data?.product_revision_id);
  if (assessment.data === null || revision.data === null) return <OrganizationNav {...address} />;
  if (!revision.data)
    return (
      <>
        <Shell.SideNav.Body>
          <Shell.SideNav.Section>
            <HomeItem isActive={false} />
          </Shell.SideNav.Section>
        </Shell.SideNav.Body>
        <WorkFooter account={address.account} />
      </>
    );
  return (
    <ProductNav productId={revision.data.product_id} version={revision.data.id} {...address} />
  );
}
