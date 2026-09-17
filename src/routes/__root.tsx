import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ModeProvider,
  PageHeader,
  Toaster,
  modeScript,
  shellScript,
} from "@ledger/design-system";
import { RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppLayout } from "@/components/app/shell";
import { Screen, WorkspaceProvider } from "@/components/app/workspace";
import { MissingRecord } from "@/components/prototype/work-common";
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
      <MissingRecord kind="Page" description="The requested page does not exist." />
    </Screen>
  ),
  errorComponent: WorkspaceError,
});

function WorkspaceError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  async function retry() {
    if (retrying) return;
    setRetrying(true);
    try {
      await router.invalidate();
      reset();
    } catch (cause) {
      setRetryError(cause instanceof Error ? cause.message : "The page could not be reloaded.");
    } finally {
      setRetrying(false);
    }
  }
  return (
    <Screen>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Workspace unavailable</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Empty>
        <EmptyMedia variant="icon" aria-hidden>
          <RefreshCw />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>This page could not be loaded</EmptyTitle>
          <EmptyDescription role="alert">
            {retryError || error.message || "Retry loading the page or return to your workspace."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="primary"
            isLoading={retrying}
            disabled={retrying}
            onClick={() => void retry()}
          >
            Retry loading
          </Button>
          <Button render={<Link to="/" />}>Open workspace</Button>
        </EmptyContent>
      </Empty>
    </Screen>
  );
}
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
