import { AppLayout } from "@/components/app/shell";
import { restoreWorkspaceRecords } from "@/lib/workspace-restore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import {
  Box,
  Button,
  Inline,
  ModeProvider,
  Toaster,
  buttonVariants,
  modeScript,
  shellScript,
  toast,
} from "@ledger/design-system";

import { PersonaSwitch } from "../components/app/persona-switch";
import { reportLovableError } from "../lib/lovable-error-reporting";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <Inline className="min-h-screen bg-surface px-200" alignBlock="center" alignInline="center">
      <div className="max-w-layout-measure text-center">
        <h1 className="font-heading-large font-semibold text-default">404</h1>
        <h2 className="pt-200 font-heading-small font-semibold text-default">Page not found</h2>
        <p className="pt-100 font-body text-subtle">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Box paddingBlockStart="space.300">
          <Link to="/" className={buttonVariants({ variant: "primary" })}>
            Go home
          </Link>
        </Box>
      </div>
    </Inline>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <Inline className="min-h-screen bg-surface px-200" alignBlock="center" alignInline="center">
      <div className="max-w-layout-measure text-center">
        <h1 className="font-heading-small font-semibold text-default">This page didn't load</h1>
        <p className="pt-100 font-body text-subtle">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <Inline className="pt-300" space="space.100" alignInline="center" shouldWrap>
          <Button
            variant="primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Link to="/" className={buttonVariants({ variant: "secondary" })}>
            Go home
          </Link>
        </Inline>
      </div>
    </Inline>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Equinox" },
    ],
    // Apply the stored colour mode and shell state before the first paint; the providers take over after mount.
    scripts: [{ children: modeScript }, { children: shellScript }],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // The mode and shell scripts mark this element before React hydrates; the mismatch is theirs.
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const errors = restoreWorkspaceRecords();
    if (errors.length)
      toast.add({
        title: "Some saved workspace records could not be restored",
        type: "error",
        timeout: 8000,
        description: errors.join(" "),
      });
    // Server loaders cannot see browser-saved records. Re-resolve deep links
    // after restoration, before rendering their record components.
    void router.invalidate().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <ModeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        {ready ? (
          <AppLayout>
            <Outlet />
          </AppLayout>
        ) : (
          <Inline className="min-h-screen" alignBlock="center" alignInline="center">
            <p role="status">Loading workspace…</p>
          </Inline>
        )}
        <Toaster />
        <PersonaSwitch />
      </ModeProvider>
    </QueryClientProvider>
  );
}
