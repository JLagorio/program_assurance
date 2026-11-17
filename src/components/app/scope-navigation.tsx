// The side nav has two scopes (Josef's decision of 2026-11-14), drawn with the kit's Shell parts.
//
// The organization scope, on every page outside a program or a product: Home, Portfolio and
// Programs, then the Library (Frameworks, Overlays, Guidance, Components), then Registers, one
// quiet group that opens in place and holds every other destination (the cross-program registers,
// the Review queue, Authorization decisions, Profiles, Business lines, Products, the requirement
// library and Suppliers), then the reader's favorites; the account at the foot. Home is My work
// until a desk exists, Frameworks the catalog, Guidance the catalog's reference sources.
//
// The work scope, on a program's pages (its record and tabs, its focused views, its records under
// `/programs/:id/…`) and on a product's (its record and its product assessments): Home, then the
// switcher naming the program or product (its code and name and what it is part of, over a square
// mark; a link back to the organization's Portfolio), then the chain of its work in order and a
// quieter group under it: for a program Overview, System, Baseline, Controls, Requirements,
// Evidence, Findings, POA&M, Risks, then Assess and authorize (Assessments, Authorization); for a
// product Overview, Structure, Controls, Where used, then Assess (Assessments), leaving out what a
// product has nothing behind yet. Each entry leads to the tab or focused view that holds that
// work; the Library and the account sit at the foot. A program or product that cannot be found
// falls back to the organization scope.
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
import { useState, type ReactNode } from "react";
import { useRow } from "@/lib/models";
import {
  navigationScope,
  organizationDestinations,
  organizationEntry,
  productDestinations,
  productEntry,
  programDestinations,
  programEntry,
  programSections,
  scopeMark,
  type OrganizationKey,
  type ProductEntry,
  type ProgramEntry,
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
  switch (scope.kind) {
    case "program":
      return <ProgramNav programId={scope.programId} account={account} {...address} />;
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
      render={
        "tab" in destination ? (
          <Link activeOptions={exact} to="/catalog" search={{ tab: destination.tab }} />
        ) : (
          <Link activeOptions={exact} to={destination.to} />
        )
      }
    >
      {destination.label}
    </Shell.SideNav.Item>
  );
}

/**
 * The organization scope: Home, Portfolio and Programs, the Library, then Registers, the quiet
 * group of every other destination, which opens in place and opens itself when it holds the page.
 */
function OrganizationNav({ pathname, search, account }: AddressProps) {
  const current = organizationEntry(pathname, search["tab"]);
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

/** A program's work scope. A program that cannot be found leaves the reader in the organization. */
function ProgramNav({
  programId,
  pathname,
  search,
  hash,
  account,
}: AddressProps & { programId: string }) {
  const program = useRow("programs", programId);
  const line = useRow("business_lines", program.data?.business_line_id);
  if (program.data === null)
    return <OrganizationNav pathname={pathname} search={search} hash={hash} account={account} />;
  const current = programEntry(pathname, search["tab"], hash);
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
