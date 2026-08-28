import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

// Tabs and Shell render <Link>/useRouterState, which throw outside a router.
// RouterContextProvider supplies the context without rendering a route tree;
// the catch-all route lets arbitrary `to` paths build hrefs.
const rootRoute = createRootRoute();
const catchAll = createRoute({ getParentRoute: () => rootRoute, path: "$" });
const router = createRouter({
  routeTree: rootRoute.addChildren([catchAll]),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

export function PreviewRouter({ children }: { children: ReactNode }) {
  return <RouterContextProvider router={router}>{children}</RouterContextProvider>;
}
