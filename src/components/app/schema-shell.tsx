import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Box, Button, Inline, Input, ModeSwitch, Shell, Stack } from "@ledger/design-system";
import { Database, FileText, LayoutDashboard } from "lucide-react";
import { database } from "@/lib/database";
import { domains, labelFor } from "@/lib/records";
import { useWorkspace } from "./workspace";

export function SchemaLayout({ children }: { children: ReactNode }) {
  const workspace = useWorkspace();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const known = new Set<string>(domains.flatMap((domain) => [...domain.tables]));
  const groups = [
    ...domains,
    {
      label: "Supporting records",
      tables: workspace.collections
        .map((collection) => collection.name)
        .filter((name) => !known.has(name)),
    },
  ];
  async function signOut() {
    const { error } = await database().auth.signOut({ scope: "local" });
    if (error) setError(error.message);
  }
  return (
    <Shell persist sideNavShortcut>
      <Shell.TopNav>
        <Shell.TopNav.Start toggle={<Shell.SideNav.ToggleButton />}>
          <Shell.AppLogo
            name="Schema inspector"
            secondaryName={workspace.name}
            render={<Link to="/" />}
          />
        </Shell.TopNav.Start>
        <Shell.TopNav.End>
          <Button variant="secondary" size="small" render={<Link to="/" />}>
            Back to prototype
          </Button>
          <ModeSwitch />
          <Button variant="subtle" size="small" onClick={() => void signOut()}>
            Sign out
          </Button>
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
                workspace.collections.some((collection) => collection.name === name) &&
                labelFor(name).toLowerCase().includes(filter.toLowerCase()),
            );
            return tables.length ? (
              <Shell.SideNav.Section key={group.label} heading={group.label}>
                {tables.map((name) => (
                  <Shell.SideNav.Item
                    key={name}
                    icon={group.label === "Reference library" ? Database : FileText}
                    isActive={pathname.startsWith(`/records/${name}`)}
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
          <Box padding="space.150">
            <Stack space="space.050">
              <p className="font-body-small truncate" title={workspace.email}>
                {workspace.email}
              </p>
              <p className="font-body-small text-subtle">{labelFor(workspace.role)}</p>
            </Stack>
          </Box>
        </Shell.SideNav.Footer>
        <Shell.SideNav.Splitter label="Resize navigation" />
      </Shell.SideNav>
      <Shell.Main>
        {error && (
          <Inline>
            <p role="alert">{error}</p>
          </Inline>
        )}
        {children}
      </Shell.Main>
    </Shell>
  );
}
