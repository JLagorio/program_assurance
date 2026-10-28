import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bookmark, History, Star } from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Reorder,
  ReorderItem,
  ReorderHandle,
  ReorderMove,
  useCollectionSelection,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Inline,
  Shell,
  Stack,
  Text,
  announce,
} from "@ledger/design-system";
import { database, requireIdentity } from "@/lib/database";
import {
  changeNavigation,
  navigationTargetFromLocation,
  navigationTargetKey,
  readNavigation,
  resolveNavigation,
  safeWorkspaceHref,
  type NavigationDestination,
  type NavigationItem,
  type NavigationTarget,
} from "@/lib/workspace-navigation";
import { useWorkspace } from "./workspace";

type PersonalNavigation = {
  items: NavigationItem[];
  destination: NavigationDestination | null;
  pending: boolean;
  error?: string | undefined;
  visit: (target: NavigationTarget) => Promise<void>;
  change: (
    operation: "favorite" | "unfavorite" | "forget" | "clear-recent" | "reorder",
    target?: NavigationTarget,
    keys?: string[],
  ) => Promise<void>;
  setTarget: (target: NavigationTarget | null) => void;
  open: (destination: NavigationDestination) => void;
  showManage: () => void;
  reload: () => void;
};
const Personal = createContext<PersonalNavigation | null>(null);
export function usePersonalNavigation() {
  return useContext(Personal);
}
/** Called by an active workbook so selecting a sheet updates the current favorite target. */
export function useWorkspaceNavigationTarget(target: NavigationTarget | null) {
  const setTarget = usePersonalNavigation()?.setTarget;
  const key = target ? navigationTargetKey(target) : null;
  const latest = useRef(target);
  latest.current = target;
  useEffect(() => {
    setTarget?.(latest.current);
    return () => setTarget?.(null);
  }, [setTarget, key]);
}
export function PersonalNavigationProvider({ children }: { children: ReactNode }) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.resolvedLocation ?? state.location });
  const [override, setTarget] = useState<NavigationTarget | null>(null);
  const [managing, setManaging] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string>();
  const queryKey = ["personal-navigation", workspace.tenantId, workspace.userId];
  const context = async () => ({
    tenantId: workspace.tenantId,
    token: await requireIdentity(workspace),
  });
  const target =
    override ??
    navigationTargetFromLocation(location.pathname, location.search as Record<string, unknown>);
  const targetKey = target ? navigationTargetKey(target) : null;
  const query = useQuery({
    queryKey,
    queryFn: async () => readNavigation(database(), await context()),
  });
  const destination = useQuery({
    queryKey: [...queryKey, "destination", targetKey],
    enabled: !!target,
    queryFn: async () => (target ? resolveNavigation(database(), await context(), target) : null),
  });
  const visited = useRef<string | null>(null);
  const visit = useCallback(
    async (item: NavigationTarget) => {
      await changeNavigation(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        "visit",
        item,
      );
      await cache.invalidateQueries({
        queryKey: ["personal-navigation", workspace.tenantId, workspace.userId],
        exact: true,
      });
    },
    [workspace, cache],
  );
  useEffect(() => {
    const value = destination.data;
    if (!targetKey && !location.search["savedView"]) visited.current = null;
    if (!value || value.key !== targetKey || location.search["savedView"]) return;
    const key = `${workspace.tenantId}:${workspace.userId}:${value.key}`;
    if (visited.current === key) return;
    visited.current = key;
    void visit(value.target).catch((cause: unknown) =>
      setFailure(cause instanceof Error ? cause.message : "Recent activity could not be saved."),
    );
    // The resolved target, not search-parameter cleanup or data refresh, determines a visit.
  }, [destination.data, targetKey, workspace.tenantId, workspace.userId, location.search, visit]);
  const change: PersonalNavigation["change"] = async (operation, item, keys) => {
    if (pending) return;
    setPending(true);
    setFailure(undefined);
    try {
      await changeNavigation(database(), await context(), operation, item, keys);
      await cache.invalidateQueries({ queryKey, exact: true });
      if (operation === "clear-recent") announce("Recently opened history cleared.");
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "Navigation could not be updated.");
      throw cause;
    } finally {
      setPending(false);
    }
  };
  const open = (item: NavigationDestination) => {
    const url = new URL(safeWorkspaceHref(item.href), "https://workspace.invalid");
    void navigate({
      to: url.pathname as never,
      search: Object.fromEntries(url.searchParams) as never,
    });
    setManaging(false);
  };
  const value: PersonalNavigation = {
    items: query.data ?? [],
    destination: destination.data ?? null,
    pending,
    error:
      failure ?? (query.isError ? "Your favorites and history could not be loaded." : undefined),
    visit,
    change,
    setTarget,
    open,
    showManage: () => setManaging(true),
    reload: () => {
      setFailure(undefined);
      void query.refetch();
    },
  };
  const favorites = value.items
    .filter((item) => item.favorite)
    .sort((a, b) => a.position - b.position);
  const recent = value.items
    .filter((item) => item.visitedAt)
    .sort((a, b) => b.visitedAt!.localeCompare(a.visitedAt!));
  const selection = useCollectionSelection({
    items: favorites.map((item) => item.key),
    disabled: pending,
  });
  async function removeSelected() {
    if (pending || !selection.selectedIds.length) return;
    setPending(true);
    setFailure(undefined);
    try {
      const auth = await context();
      for (const item of favorites.filter((favorite) => selection.isSelected(favorite.key))) {
        await changeNavigation(database(), auth, "unfavorite", item.target);
      }
      selection.clear();
      announce("Selected favorites removed.");
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "Favorites could not be removed.");
    } finally {
      await cache.invalidateQueries({ queryKey, exact: true });
      setPending(false);
    }
  }
  return (
    <Personal.Provider value={value}>
      {children}
      <Dialog open={managing} onOpenChange={setManaging} pending={pending}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Favorites and recent records</DialogTitle>
            <DialogDescription>
              Only you can see this list in this workspace. History includes records you opened.
              Clearing history keeps your favorites.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.250">
              {value.error && (
                <Alert tone="danger">
                  <AlertDescription>{value.error}</AlertDescription>
                  <Button onClick={value.reload}>Retry</Button>
                </Alert>
              )}
              <Text weight="semibold">Favorites</Text>
              {!favorites.length && (
                <Text color="color.text.subtle">Open a record and choose Add to favorites.</Text>
              )}
              {favorites.length > 0 && (
                <Inline spread="space-between" shouldWrap>
                  <Inline space="space.100">
                    <Checkbox
                      aria-label="Select all visible favorites"
                      checked={selection.allSelected}
                      indeterminate={selection.partiallySelected}
                      disabled={pending}
                      onCheckedChange={(checked) =>
                        checked ? selection.selectAll() : selection.clear()
                      }
                    />
                    <Text>{selection.selectedIds.length} selected</Text>
                  </Inline>
                  <Button
                    size="small"
                    disabled={pending || !selection.selectedIds.length}
                    onClick={() => void removeSelected()}
                  >
                    Remove selected
                  </Button>
                </Inline>
              )}
              <Reorder
                items={favorites.map((item) => item.key)}
                getItemLabel={(key) =>
                  favorites.find((item) => item.key === key)?.destination?.title ??
                  "Unavailable record"
                }
                onReorder={(keys) => void change("reorder", undefined, keys).catch(() => undefined)}
                disabled={pending}
                aria-label="Favorite order"
              >
                {favorites.map((item) => {
                  const title = item.destination?.title ?? "unavailable record";
                  return (
                    <ReorderItem key={item.key} itemId={item.key}>
                      <Inline space="space.100" spread="space-between">
                        <Inline space="space.050" className="min-w-0 flex-1">
                          <ReorderHandle />
                          <Checkbox
                            {...selection.getItemProps(item.key)}
                            aria-label={`Select favorite ${title}`}
                            checked={selection.isSelected(item.key)}
                            disabled={pending}
                            onClick={(event) =>
                              selection.toggle(item.key, {
                                range: event.shiftKey,
                                additive: event.ctrlKey || event.metaKey,
                              })
                            }
                          />
                          <Button
                            variant="subtle"
                            truncate
                            className="min-w-0"
                            disabled={!item.destination}
                            onClick={() => item.destination && open(item.destination)}
                          >
                            {item.destination?.title ?? "Unavailable record"}
                          </Button>
                        </Inline>
                        <Inline space="space.050" shrink="none">
                          <ReorderMove direction="previous" label={`Move ${title} up`} />
                          <ReorderMove direction="next" label={`Move ${title} down`} />
                          <Button
                            size="small"
                            variant="subtle"
                            disabled={pending}
                            onClick={() =>
                              void change("unfavorite", item.target).catch(() => undefined)
                            }
                          >
                            Remove
                          </Button>
                        </Inline>
                      </Inline>
                    </ReorderItem>
                  );
                })}
              </Reorder>
              <Inline spread="space-between" shouldWrap>
                <Text weight="semibold">Recently opened</Text>
                <Button
                  size="small"
                  disabled={pending || !recent.length}
                  onClick={() => void change("clear-recent").catch(() => undefined)}
                >
                  Clear history
                </Button>
              </Inline>
              {!recent.length && <Text color="color.text.subtle">No recently opened records.</Text>}
              {recent.map((item) => (
                <Inline key={item.key} space="space.100" spread="space-between" shouldWrap>
                  <Button
                    variant="subtle"
                    disabled={!item.destination}
                    onClick={() => item.destination && open(item.destination)}
                  >
                    {item.destination?.title ?? "Unavailable record"}
                  </Button>
                  <Inline space="space.050">
                    <IconButton
                      label={
                        item.favorite
                          ? `Remove ${item.destination?.title ?? "record"} from favorites`
                          : `Favorite ${item.destination?.title ?? "record"}`
                      }
                      icon={<Star />}
                      disabled={pending || (!item.favorite && !item.destination)}
                      onClick={() =>
                        void change(item.favorite ? "unfavorite" : "favorite", item.target).catch(
                          () => undefined,
                        )
                      }
                    />
                    <Button
                      variant="subtle"
                      size="small"
                      disabled={pending}
                      onClick={() => void change("forget", item.target).catch(() => undefined)}
                    >
                      Forget
                    </Button>
                  </Inline>
                </Inline>
              ))}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button>Close</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Personal.Provider>
  );
}
export function PersonalNavigationSection() {
  const personal = usePersonalNavigation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const favorites = useMemo(
    () =>
      personal?.items
        .filter((item) => item.favorite && item.destination)
        .sort((a, b) => a.position - b.position)
        .slice(0, 6) ?? [],
    [personal?.items],
  );
  if (!personal) return null;
  return (
    <Shell.SideNav.Section heading="Your workspace">
      {favorites.map((item) => (
        <Shell.SideNav.Item
          key={item.key}
          icon={Star}
          isActive={item.destination?.href === pathname}
          render={
            <Link
              to={item.destination!.href.split("?")[0] as never}
              search={
                Object.fromEntries(
                  new URL(item.destination!.href, "https://workspace.invalid").searchParams,
                ) as never
              }
            />
          }
        >
          {item.destination!.title}
        </Shell.SideNav.Item>
      ))}
      <Shell.SideNav.Item icon={History} onClick={personal.showManage}>
        Favorites and recent
      </Shell.SideNav.Item>
    </Shell.SideNav.Section>
  );
}
export function FavoriteCurrentRecord() {
  const personal = usePersonalNavigation();
  const item = personal?.destination;
  if (!personal || !item) return null;
  const favorite = personal.items.some((entry) => entry.key === item.key && entry.favorite);
  return (
    <Shell.TopNav.Item
      icon={favorite ? <Star fill="currentColor" /> : <Bookmark />}
      label={favorite ? "Remove from favorites" : "Add to favorites"}
      aria-disabled={personal.pending || undefined}
      onClick={() =>
        !personal.pending &&
        void personal
          .change(favorite ? "unfavorite" : "favorite", item.target)
          .catch(() => personal.showManage())
      }
    />
  );
}
