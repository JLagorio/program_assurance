import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { PageSkeleton } from "@/ds/patterns";
import { Shell } from "@/ds/shell";

import { routeTree } from "./routeTree.gen";

/* Shown while a route's loader is still pending: the shell stays put and only
   the page area pulses. Sync loaders never trip it; the routes that import the
   catalog text on demand do. */
function Pending() {
  return (
    <Shell>
      <PageSkeleton />
    </Shell>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: Pending,
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
  });

  return router;
};
