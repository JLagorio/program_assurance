import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  CatchBoundary,
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useLocation,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  Inline,
  LedgerProvider,
  LinkButton,
  ModeProvider,
  PageHeader,
  Section,
  Stack,
  Text,
  Toaster,
  modeScript,
  shellScript,
} from "@ledger/design-system";
import { useState, type ReactNode } from "react";
import { AppLayout } from "@/components/app/shell";
import { Screen, WorkspaceProvider } from "@/components/app/workspace";
import { APP_LOCALE, useReaderTimeZone } from "@/components/prototype/work-format";
import appCss from "../styles.css?url";

const PRODUCT = "Program Assurance";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ match }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // A route sets its own title; an address no route matches is "Page not found".
      { title: match.globalNotFound ? `Page not found — ${PRODUCT}` : PRODUCT },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [{ children: modeScript }, { children: shellScript }],
  }),
  shellComponent: RootShell,
  component: Root,
  notFoundComponent: PageNotFound,
  errorComponent: WorkspaceError,
});

/** An address no route matches, inside the shell: a missing page, with a route back. */
function PageNotFound() {
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Page not found</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Empty>
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind="search" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Nothing at this address</EmptyTitle>
          <EmptyDescription>
            The link may be mistyped, or the page may have moved. Your workspace has everything you
            can open.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <LinkButton variant="primary" render={<Link to="/" />}>
            Open workspace
          </LinkButton>
        </EmptyContent>
      </Empty>
    </Stack>
  );
}

function messageOf(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

/**
 * A failure while loading or drawing a page: a danger Alert that says what happened, with Retry
 * and a route home, and the technical message folded away below it.
 */
function PageFailure({
  title,
  error,
  reset,
  refresh,
}: ErrorComponentProps & {
  title: string;
  /** Reloads the data the page drew from, so a retry does not draw the same failure again. */
  refresh?: (() => Promise<unknown>) | undefined;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<unknown>(null);
  async function retry() {
    if (retrying) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await Promise.all([router.invalidate(), refresh?.()]);
      // The router hands a match that failed in its loader no reset: invalidating redraws it.
      (reset as (() => void) | undefined)?.();
    } catch (cause) {
      setRetryError(cause ?? new Error("The page could not be reloaded."));
    } finally {
      setRetrying(false);
    }
  }
  const detail = messageOf(retryError ?? error);
  return (
    <Stack space="space.300">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>{title}</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <Alert tone="danger" role="alert">
        <AlertTitle>This page could not be loaded</AlertTitle>
        <AlertDescription>
          {retryError
            ? "Retrying did not load it either. Check your connection and retry, or open your workspace."
            : "Retry loading the page, or open your workspace."}
        </AlertDescription>
        <AlertAction>
          <Inline space="space.100" shouldWrap>
            <Button variant="primary" isLoading={retrying} onClick={() => void retry()}>
              Retry loading
            </Button>
            <LinkButton render={<Link to="/" />}>Open workspace</LinkButton>
          </Inline>
        </AlertAction>
      </Alert>
      {detail && (
        <Section title="Technical details" isCollapsible>
          <Text as="p" size="small" color="color.text.subtle" preserveLineBreaks>
            {detail}
          </Text>
        </Section>
      )}
    </Stack>
  );
}

/** The root failed: the providers and the shell are gone, so the page stands alone. */
function WorkspaceError(props: ErrorComponentProps) {
  return (
    <Screen>
      <PageFailure {...props} title="Workspace unavailable" />
    </Screen>
  );
}

/** A route failed inside the shell: the navigation, the providers and the other work stay. */
function RouteError(props: ErrorComponentProps) {
  const queryClient = useQueryClient();
  // The records the page drew are dropped and read again, so a retry does not redraw bad data.
  return (
    <PageFailure {...props} title="Page unavailable" refresh={() => queryClient.resetQueries()} />
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

function RouteBoundary({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  return (
    <CatchBoundary getResetKey={() => pathname} errorComponent={RouteError}>
      {children}
    </CatchBoundary>
  );
}

function Root() {
  const { queryClient } = Route.useRouteContext();
  // Dates read in the reader's zone; the server and the hydrating client agree on UTC first.
  const timeZone = useReaderTimeZone();
  return (
    <QueryClientProvider client={queryClient}>
      <LedgerProvider locale={APP_LOCALE} timeZone={timeZone}>
        <ModeProvider>
          <WorkspaceProvider>
            <AppLayout>
              <RouteBoundary>
                <Outlet />
              </RouteBoundary>
            </AppLayout>
          </WorkspaceProvider>
          <Toaster />
        </ModeProvider>
      </LedgerProvider>
    </QueryClientProvider>
  );
}
