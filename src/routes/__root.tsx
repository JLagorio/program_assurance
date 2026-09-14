import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { ModeProvider, Toaster, modeScript, shellScript } from "@ledger/design-system";
import type { ReactNode } from "react";
import { AppLayout } from "@/components/app/shell";
import { Screen, WorkspaceProvider } from "@/components/app/workspace";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Program Assurance" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [{ children: modeScript }, { children: shellScript }],
  }),
  shellComponent: RootShell,
  component: Root,
  notFoundComponent: () => (
    <Screen>
      <h1 className="font-heading-large">Record not found</h1>
      <p>The requested page does not exist.</p>
      <Link to="/">Open workspace</Link>
    </Screen>
  ),
  errorComponent: ({ error }) => (
    <Screen>
      <h1 className="font-heading-large">Workspace unavailable</h1>
      <p role="alert">{error.message}</p>
      <Link to="/">Open workspace</Link>
    </Screen>
  ),
});
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
function Root() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ModeProvider>
        <WorkspaceProvider>
          <AppLayout>
            <Outlet />
          </AppLayout>
        </WorkspaceProvider>
        <Toaster />
      </ModeProvider>
    </QueryClientProvider>
  );
}
