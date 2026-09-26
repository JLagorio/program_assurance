import { RecordPreviewProvider } from "@/components/prototype/record-preview";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  announce,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenuItem,
  KbdShortcut,
  KeyValue,
  LinkButton,
  ModeSwitch,
  SearchDialog,
  Shell,
  Stack,
  Text,
  type SearchResult,
} from "@ledger/design-system";
import {
  Archive,
  Boxes,
  Bug,
  CircleHelp,
  ClipboardList,
  Database,
  FileCheck2,
  FlaskConical,
  Gauge,
  Gavel,
  Inbox,
  Library,
  ListChecks,
  LogOut,
  Package,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkle,
  Users,
} from "lucide-react";
import { useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { determinations, programStatuses, riskStatuses } from "@/lib/status";
import { StatusBadge } from "./status";
import { AccountMenu, useSignOut, useWorkspace } from "./workspace";
import { SchemaLayout } from "./schema-shell";

const groups = [
  {
    label: "Work",
    items: [
      { label: "My work", to: "/work", icon: Inbox },
      { label: "Programs", to: "/programs", icon: ClipboardList },
      { label: "Assessment campaigns", to: "/campaigns", icon: FlaskConical },
      { label: "Portfolio", to: "/", icon: Gauge },
    ],
  },
  {
    label: "Assessment",
    items: [
      { label: "Evidence", to: "/evidence", icon: Archive },
      { label: "Findings & assets", to: "/findings", icon: Bug },
      { label: "POA&M & risk register", to: "/register", icon: ShieldAlert },
      { label: "Packages", to: "/packages", icon: Package },
      { label: "Authorization decisions", to: "/briefing", icon: Gavel },
    ],
  },
  {
    label: "Libraries",
    items: [
      { label: "Catalog", to: "/catalog", icon: FileCheck2 },
      { label: "Profiles", to: "/profiles", icon: ShieldCheck },
      { label: "Components", to: "/library/components", icon: Library },
      { label: "Products", to: "/library/products", icon: Boxes },
      { label: "Requirements", to: "/library/requirements", icon: ListChecks },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Suppliers", to: "/vendors", icon: Users },
      { label: "Design system", to: "/components", icon: Sparkle },
      { label: "Schema inspector", to: "/schema", icon: Database },
    ],
  },
] as const;

/** The address itself, or a page under it: `/programs` holds `/programs/…`, not `/programsx`. */
const within = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);

/** Records whose pages belong to a section other than their own address, as their trails say. */
const sections: ReadonlyArray<readonly [page: string, section: string]> = [
  ["/tasks", "/work"],
  ["/workstreams", "/programs"],
  ["/issues", "/findings"],
  ["/risks", "/register"],
  ["/poam-documents", "/register"],
];
const sectionFor = (pathname: string) =>
  sections.find(([page]) => within(pathname, page))?.[1] ?? pathname;

/** The prototype frame and the backend inspector are two views of the same workspace. */
export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const inspector = pathname.startsWith("/records/") || pathname === "/schema";
  // Moving between the two frames mounts a new Shell, which cannot see the page change: hand
  // focus to the new Main and say where the reader is, as each Shell does within itself.
  const frame = useRef(inspector);
  useEffect(() => {
    if (frame.current === inspector) return;
    frame.current = inspector;
    const next = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("main")?.focus({ preventScroll: true });
      announce(document.title);
    });
    return () => cancelAnimationFrame(next);
  }, [inspector]);
  return inspector ? (
    <SchemaLayout>{children}</SchemaLayout>
  ) : (
    <PrototypeLayout>{children}</PrototypeLayout>
  );
}

function PrototypeLayout({ children }: { children: ReactNode }) {
  const workspace = useWorkspace();
  const signOut = useSignOut();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // The page Main shows once it has rendered: a tab or a filter in the search keeps the page.
  const page = useRouterState({
    select: (state) => (state.resolvedLocation ?? state.location).pathname,
  });
  const section = sectionFor(pathname);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Shell sideNavShortcut persist collapsedSideNav="icons" locationKey={page}>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton />
          <Shell.AppLogo
            name="Program Assurance"
            secondaryName={workspace.name}
            render={<Link to="/" aria-label="Program Assurance home" />}
          />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <RecordSearch />
        </Shell.TopNav.Middle>
        <Shell.TopNav.End>
          <ModeSwitch />
          <Shell.TopNav.Item
            icon={<CircleHelp />}
            label="Help and shortcuts"
            onClick={() => setHelpOpen(true)}
          />
          <Shell.TopNav.Item icon={<Inbox />} label="My work" render={<Link to="/work" />} />
          <Shell.TopNav.Item
            icon={<Settings />}
            label="Settings"
            onClick={() => setSettingsOpen(true)}
          />
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          {groups.map((group) => (
            <Shell.SideNav.Section key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <Shell.SideNav.Item
                  key={item.to}
                  icon={item.icon}
                  isActive={item.to === "/" ? pathname === "/" : within(section, item.to)}
                  render={<Link to={item.to} />}
                >
                  {item.label}
                </Shell.SideNav.Item>
              ))}
            </Shell.SideNav.Section>
          ))}
        </Shell.SideNav.Body>
        <Shell.SideNav.Footer>
          <AccountMenu>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings aria-hidden />
              Settings
            </DropdownMenuItem>
          </AccountMenu>
        </Shell.SideNav.Footer>
        <Shell.SideNav.Splitter label="Resize side navigation" />
      </Shell.SideNav>
      <RecordPreviewProvider>
        <Shell.Main>{children}</Shell.Main>
      </RecordPreviewProvider>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help and shortcuts</DialogTitle>
            <DialogDescription>
              Work in the prototype and inspect the same saved records in the schema inspector.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.300">
              <KeyValue.Group labelWidth={200}>
                <KeyValue label="Search records">
                  <KbdShortcut keys="Mod+K" />
                </KeyValue>
                <KeyValue label="Show or hide the navigation">
                  <KbdShortcut keys="Ctrl+[" />
                </KeyValue>
                <KeyValue label="Close a dialog or a preview">
                  <KbdShortcut keys="Escape" />
                </KeyValue>
              </KeyValue.Group>
              <Text as="p">
                Tab moves between controls, and Enter or Space activates them. Search finds
                programs, risks and assessment findings by their name or code.
              </Text>
              <Text as="p">
                Create a program, define its systems and scope, then connect implementation,
                assessment, evidence and remediation records.
              </Text>
              <LinkButton render={<Link to="/schema" onClick={() => setHelpOpen(false)} />}>
                Open schema inspector
              </LinkButton>
            </Stack>
          </DialogBody>
        </DialogContent>
      </Dialog>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Your account, and how Program Assurance looks in this browser.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.200">
              <KeyValue.Group labelWidth={120}>
                <KeyValue label="Workspace" wrap>
                  {workspace.name}
                </KeyValue>
                <KeyValue label="Signed in as" wrap>
                  {workspace.email}
                </KeyValue>
                <KeyValue label="Role">{labelFor(workspace.role)}</KeyValue>
              </KeyValue.Group>
              {/* Label over the switch at every width: its three words never fit beside a label on a phone. */}
              <KeyValue.Group layout="stacked">
                <KeyValue label="Appearance">
                  <ModeSwitch showLabels />
                </KeyValue>
              </KeyValue.Group>
            </Stack>
          </DialogBody>
          <DialogFooter showCloseButton>
            <Button
              variant="subtle"
              iconBefore={<LogOut />}
              onClick={() => {
                // The dialog closes first, so a draft's discard prompt does not open over it.
                setSettingsOpen(false);
                void signOut();
              }}
            >
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

/**
 * The product's record search: the top nav's search opens a SearchDialog over programs, risks and
 * assessment findings, each row its code, its name and its status. Nothing loads until the reader
 * reaches for the search.
 */
function RecordSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [wanted, setWanted] = useState(false);
  const programs = useRows(
    "programs",
    {},
    { enabled: wanted, columns: ["id", "code", "name", "status"] },
  );
  const risks = useRows(
    "risks",
    {},
    { enabled: wanted, columns: ["id", "title", "status", "program_id"] },
  );
  const findings = useRows(
    "assessment_findings",
    {},
    { enabled: wanted, columns: ["id", "title", "determination"] },
  );
  const results = useMemo<SearchResult[]>(() => {
    const programName = new Map(
      (programs.data ?? []).map((program) => [program.id, `${program.code} · ${program.name}`]),
    );
    return [
      ...(programs.data ?? []).map((row) => ({
        id: `programs/${row.id}`,
        identifier: row.code,
        title: row.name,
        group: "Programs",
        badge: <StatusBadge statuses={programStatuses} value={row.status} size="xsmall" />,
      })),
      ...(risks.data ?? []).map((row) => ({
        id: `risks/${row.id}`,
        title: row.title,
        meta: row.program_id ? programName.get(row.program_id) : undefined,
        group: "Risks",
        badge: <StatusBadge statuses={riskStatuses} value={row.status} size="xsmall" />,
      })),
      ...(findings.data ?? []).map((row) => ({
        id: `findings/${row.id}`,
        title: row.title,
        group: "Assessment findings",
        badge: row.determination ? (
          <StatusBadge statuses={determinations} value={row.determination} size="xsmall" />
        ) : undefined,
      })),
    ];
  }, [programs.data, risks.data, findings.data]);
  const queries = [programs, risks, findings];
  const failed = queries.filter((query) => query.isError);
  // A chosen record replaces the page. The dialog then returns no focus, and the Shell takes it
  // on to Main with the page change, instead of back to the search button (or, after ⌘K, to the
  // first link of the new page).
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const chosen = useRef(false);
  function openRecord(result: SearchResult) {
    chosen.current = `/${result.id}` !== pathname;
    const [kind, id = ""] = result.id.split("/");
    if (kind === "programs")
      void navigate({ to: "/programs/$programId", params: { programId: id } });
    else if (kind === "risks") void navigate({ to: "/risks/$riskId", params: { riskId: id } });
    else void navigate({ to: "/findings/$findingId", params: { findingId: id } });
  }
  const want = () => setWanted(true);
  return (
    <>
      <Shell.TopNav.Search
        label="Search programs, risks, and findings"
        onOpen={() => {
          chosen.current = false;
          setWanted(true);
          setOpen(true);
        }}
        // Start reading the records as the reader reaches for the search.
        onPointerEnter={want}
        onFocus={want}
      />
      <SearchDialog
        open={open}
        onOpenChange={setOpen}
        results={results}
        onSelect={openRecord}
        finalFocus={() => !chosen.current}
        placeholder="Search programs, risks and assessment findings"
        loading={wanted && queries.some((query) => query.isPending)}
        error={
          failed.length === 0
            ? undefined
            : failed.length === queries.length
              ? "Records could not be loaded. Check your connection and try again."
              : "Some records could not be loaded, so these results may be incomplete."
        }
        onRetry={() => failed.forEach((query) => void query.refetch())}
      />
    </>
  );
}
