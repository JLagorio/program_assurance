import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { PageSkeleton } from "@ledger/design-system";

import { routeTree } from "./routeTree.gen";

/* Shown while a route's loader is still pending: the shell stays put and only
   the page area pulses. Sync loaders never trip it; the routes that import the
   catalog text on demand do. */
function Pending() {
  return <PageSkeleton />;
}

/* A read stays fresh for 30 seconds, so a retained tab panel shown again, or a
   preview stepping back to a record, reuses what it read instead of asking the
   server again. Writes invalidate the tables they change, so the reader's own
   edits show at once; another session's change shows after 30 seconds, when
   the reader comes back to the window, or on Retry. Coming back to the window
   and a connection that comes back both read everything again whatever its
   age, since the reader cannot know what changed while they were away. */
const READ_FRESH_MS = 30_000;

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: READ_FRESH_MS,
        refetchOnWindowFocus: "always",
        refetchOnReconnect: "always",
      },
    },
  });

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
