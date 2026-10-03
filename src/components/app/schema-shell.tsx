import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Box, Input, ModeSwitch, Shell } from "@ledger/design-system";
import { Database, FileText, Home, LayoutDashboard } from "lucide-react";
import { useSchemaCatalog } from "@/lib/collections";
import { domains, labelFor, type Collection } from "@/lib/records";
import { AccountMenu, useWorkspace } from "./workspace";

const NO_COLLECTIONS: Collection[] = [];

export function SchemaLayout({ children }: { children: ReactNode }) {
  const workspace = useWorkspace();
  // The inspector's navigation lists the collections the schema names; it loads with the inspector.
  const catalog = useSchemaCatalog();
  const collections = catalog.data ?? NO_COLLECTIONS;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // The page Main shows once it has rendered; a filter in the search keeps the page.
  const page = useRouterState({
    select: (state) => (state.resolvedLocation ?? state.location).pathname,
  });
  const [filter, setFilter] = useState("");
  const known = new Set<string>(domains.flatMap((domain) => [...domain.tables]));
  const groups = [
    ...domains,
    {
      label: "Supporting records",
      tables: collections.map((collection) => collection.name).filter((name) => !known.has(name)),
    },
  ];
  return (
    <Shell persist sideNavShortcut locationKey={page}>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton />
          <Shell.AppLogo
            name="Schema inspector"
            secondaryName={workspace.name}
            // The mark names the inspector, so it leads to the inspector's home.
            render={<Link to="/schema" aria-label="Schema inspector home" />}
          />
        </Shell.TopNav.Start>
        {/* The inspector has no search; the empty middle keeps the actions at the row's end. */}
        <Shell.TopNav.Middle />
        <Shell.TopNav.End>
          <ModeSwitch />
          <Shell.TopNav.Item icon={<Home />} label="Back to prototype" render={<Link to="/" />} />
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          <Box padding="space.150">
            <Input
              aria-label="Find a record collection"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Find records…"
            />
          </Box>
          <Shell.SideNav.Item
            icon={LayoutDashboard}
            isActive={pathname === "/schema"}
            render={<Link to="/schema" />}
          >
            Schema overview
          </Shell.SideNav.Item>
          {groups.map((group) => {
            const tables = group.tables.filter(
              (name) =>
                collections.some((collection) => collection.name === name) &&
                labelFor(name).toLowerCase().includes(filter.toLowerCase()),
            );
            return tables.length ? (
              <Shell.SideNav.Section key={group.label} heading={group.label}>
                {tables.map((name) => (
                  <Shell.SideNav.Item
                    key={name}
                    icon={group.label === "Reference library" ? Database : FileText}
                    isActive={
                      pathname === `/records/${name}` || pathname.startsWith(`/records/${name}/`)
                    }
                    render={<Link to="/records/$collection" params={{ collection: name }} />}
                  >
                    {labelFor(name)}
                  </Shell.SideNav.Item>
                ))}
              </Shell.SideNav.Section>
            ) : null;
          })}
        </Shell.SideNav.Body>
        <Shell.SideNav.Footer>
          <AccountMenu />
        </Shell.SideNav.Footer>
        <Shell.SideNav.Splitter label="Resize navigation" />
      </Shell.SideNav>
      <Shell.Main>{children}</Shell.Main>
    </Shell>
  );
}
