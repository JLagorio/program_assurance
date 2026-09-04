import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import {
  Box,
  DensityProvider,
  Inline,
  ModeProvider,
  Toaster,
  densityScript,
  modeScript,
  shellScript,
} from "@ledger/design-system";

import appCss from "../styles.css?url";
import { PersonaSwitch } from "../components/app/persona-switch";
import { reportLovableError } from "../lib/lovable-error-reporting";

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
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-medium bg-brand-bold px-200 py-100 font-body font-medium text-inverse transition-colors hover:bg-brand-subtlest"
          >
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
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-medium bg-brand-bold px-200 py-100 font-body font-medium text-inverse transition-colors hover:bg-brand-subtlest"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-medium border border-input bg-surface px-200 py-100 font-body font-medium text-default transition-colors hover:bg-neutral-subtle-hovered"
          >
            Go home
          </a>
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
    // Apply the stored colour mode, row density and shell state before the first paint; the providers take over after mount.
    scripts: [{ children: modeScript }, { children: densityScript }, { children: shellScript }],
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

  return (
    <QueryClientProvider client={queryClient}>
      <ModeProvider>
        <DensityProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <Toaster />
          <PersonaSwitch />
        </DensityProvider>
      </ModeProvider>
    </QueryClientProvider>
  );
}
