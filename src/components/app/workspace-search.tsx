import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Button, CommandPalette, Inline, Shell, type PaletteCommand } from "@ledger/design-system";
import { database, requireIdentity } from "@/lib/database";
import { useRows } from "@/lib/models";
import { savedViewSchema } from "@/lib/saved-views";
import { searchWorkspace } from "@/lib/workspace-search";
import {
  resolveNavigation,
  safeWorkspaceHref,
  type NavigationTarget,
} from "@/lib/workspace-navigation";
import { useWorkspace } from "./workspace";
import { usePersonalNavigation } from "./personal-navigation";
import { useRegisteredWorkspaceActions } from "./workspace-actions";
const groups = {
  program: "Programs",
  requirement: "Requirements",
  control: "Controls",
  evidence: "Evidence",
  citation: "Evidence passages",
  risk: "Risks",
  finding: "Assessment findings",
};
const categories = ["All", "Records", "Views", "Actions"] as const;
type Category = (typeof categories)[number];
/** One launcher and one shortcut owner for records, destinations and route-authorized commands. */
export function RecordSearch() {
  const workspace = useWorkspace();
  const personal = usePersonalNavigation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [wanted, setWanted] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [failure, setFailure] = useState<string>();
  const chosen = useRef(false);
  const running = useRef(new Set<string>());
  const readActions = useRegisteredWorkspaceActions();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(timer);
  }, [query]);
  const programs = useRows(
    "programs",
    {},
    { enabled: wanted, columns: ["id", "code", "name", "status"] },
  );
  const views = useQuery({
    queryKey: ["launcher-saved-views", workspace.tenantId, workspace.userId],
    enabled: open,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await database()
        .from("assurance_saved_views")
        .select("*")
        .eq("tenant_id", workspace.tenantId)
        .order("name")
        .limit(200)
        .setHeader("Authorization", `Bearer ${await requireIdentity(workspace)}`);
      if (error) throw new Error(error.message);
      return (data ?? []).flatMap((item) => {
        const result = savedViewSchema.safeParse(item);
        return result.success ? [result.data] : [];
      });
    },
  });
  const remote = useQuery({
    queryKey: ["workspace-search", workspace.tenantId, workspace.userId, debounced],
    enabled: open && debounced.length >= 2 && (category === "All" || category === "Records"),
    queryFn: async ({ signal }) =>
      searchWorkspace(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        debounced,
        signal,
      ),
  });
  function go(href: string) {
    const url = new URL(safeWorkspaceHref(href), "https://workspace.invalid");
    chosen.current = url.pathname !== pathname;
    void navigate({
      to: url.pathname as never,
      search: Object.fromEntries(url.searchParams) as never,
    });
  }
  async function openTarget(target: NavigationTarget) {
    try {
      const destination = await resolveNavigation(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        target,
      );
      if (!destination) throw new Error("This destination is no longer available.");
      go(destination.href);
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "This destination could not be opened.");
      setOpen(true);
    }
  }
  const term = query.trim().toLocaleLowerCase();
  const matches = (text: string) =>
    term.split(/\s+/).every((word) => text.toLocaleLowerCase().includes(word));
  const records: PaletteCommand[] = (() => {
    const local = (programs.data ?? []).map((item) => ({
      id: `/programs/${item.id}`,
      label: `${item.code} · ${item.name}`,
      group: "Programs",
      description: "",
      href: `/programs/${item.id}`,
    }));
    const found =
      debounced === query.trim()
        ? (remote.data ?? []).map((hit) => ({
            id: hit.href,
            label: `${hit.identifier ? `${hit.identifier} · ` : ""}${hit.title}`,
            group: groups[hit.kind],
            description: hit.excerpt,
            href: hit.href,
          }))
        : [];
    return [
      ...new Map(
        [...local.filter((item) => matches(item.label)), ...found].map((item) => [item.id, item]),
      ).values(),
    ].map((item) => ({ ...item, run: () => go(item.href) }));
    // Derived from the exact query, so stale remote hits never appear for newly typed words.
  })();
  const registered = readActions().filter((command) => command.id !== "palette");
  const actions: PaletteCommand[] = registered.map((command) => ({
    id: `action:${command.id}`,
    label: command.label,
    group: command.group ?? "Current page",
    shortcut: command.shortcut,
    disabledReason:
      command.enabled === false
        ? (command.disabledReason ?? "This action is not available for the current selection.")
        : undefined,
    run: () => {
      if (running.current.has(command.id)) return;
      const current = readActions().find((item) => item.id === command.id);
      if (!current || current.enabled === false) return;
      running.current.add(command.id);
      void Promise.resolve()
        .then(current.run)
        .catch((cause: unknown) => {
          setFailure(cause instanceof Error ? cause.message : "The action could not finish.");
          setOpen(true);
        })
        .finally(() => running.current.delete(command.id));
    },
  }));
  actions.push(
    {
      id: "personal:manage",
      label: "Manage favorites and recent records",
      group: "Your workspace",
      run: () => personal?.showManage(),
    },
    {
      id: "go:attention",
      label: "Open attention inbox",
      group: "Go to",
      run: () => go("/work?view=attention"),
    },
  );
  if (personal?.destination) {
    const destination = personal.destination;
    const favorite = personal.items.some((item) => item.key === destination.key && item.favorite);
    actions.push({
      id: "personal:favorite",
      label: favorite ? "Remove current record from favorites" : "Add current record to favorites",
      description: destination.title,
      group: "Your workspace",
      disabledReason: personal.pending ? "An update is still being saved." : undefined,
      run: () =>
        void personal
          .change(favorite ? "unfavorite" : "favorite", destination.target)
          .catch(() => personal.showManage()),
    });
  }
  actions.sort((a, b) => (a.group === b.group ? 0 : a.group.localeCompare(b.group)));
  const saved: PaletteCommand[] = (views.data ?? []).map((view) => ({
    id: `view:${view.id}`,
    label: view.name,
    group: "Saved views",
    hint: view.visibility === "workspace" ? "Shared" : "Private",
    disabledReason:
      view.definition.kind === "table" && !view.definition.destination
        ? "Open this view from its original collection and save its settings to make it available here."
        : undefined,
    run: () => void openTarget({ kind: "saved-view", recordId: view.id }),
  }));
  const favorites: PaletteCommand[] = (personal?.items ?? [])
    .filter((item) => item.favorite && item.destination)
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      id: `favorite:${item.key}`,
      label: item.destination!.title,
      group: "Favorites",
      run: () => void openTarget(item.target),
    }));
  const recent: PaletteCommand[] = (personal?.items ?? [])
    .filter((item) => item.visitedAt && !item.favorite && item.destination)
    .sort((a, b) => b.visitedAt!.localeCompare(a.visitedAt!))
    .slice(0, 8)
    .map((item) => ({
      id: `recent:${item.key}`,
      label: item.destination!.title,
      group: "Recently opened",
      run: () => void openTarget(item.target),
    }));
  const commands = (
    category === "Actions"
      ? actions
      : category === "Views"
        ? saved
        : category === "Records"
          ? records
          : term
            ? [...actions, ...saved, ...records]
            : [...favorites, ...recent, ...actions, ...saved.slice(0, 5)]
  ).filter((item) =>
    matches(`${item.label} ${item.group} ${item.description ?? ""} ${item.hint ?? ""}`),
  );
  return (
    <>
      <Shell.TopNav.Search
        label="Search records, views, and actions"
        onPointerEnter={() => setWanted(true)}
        onFocus={() => setWanted(true)}
        onOpen={() => {
          chosen.current = false;
          setWanted(true);
          setFailure(undefined);
          setOpen(true);
        }}
      />
      <CommandPalette
        highlightMatches
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery("");
        }}
        title="Search and actions"
        description="Find records, saved views, and actions for the current page. Favorites and recent records are private to you."
        placeholder="Search records, views, or actions…"
        query={query}
        onQueryChange={setQuery}
        filter={false}
        commands={commands}
        chooseHint="to open or run"
        finalFocus={() => !chosen.current}
        controls={
          <Inline space="space.050" shouldWrap role="group" aria-label="Search categories">
            {categories.map((item) => (
              <Button
                key={item}
                size="small"
                variant={category === item ? "primary" : "subtle"}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </Inline>
        }
        loading={
          open &&
          query.trim().length >= 2 &&
          (category === "All" || category === "Records") &&
          (query.trim() !== debounced || remote.isFetching)
        }
        error={
          failure ??
          personal?.error ??
          (remote.isError || views.isError ? "Some results could not be loaded." : undefined)
        }
        onRetry={() => {
          setFailure(undefined);
          personal?.reload();
          void remote.refetch();
          void views.refetch();
        }}
        noResults={
          term
            ? "No matching records, views, or actions."
            : "Open a record to build your recent list, or start typing to search."
        }
      />
    </>
  );
}
