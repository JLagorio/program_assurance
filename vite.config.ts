// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { defaultClientConditions, defaultServerConditions, type Plugin } from "vite";

// In dev the app reads the design system's TypeScript source through the package's
// `@ledger/source` export condition, so a kit edit hot-reloads here; `vite build` resolves the
// package's `dist/`, as any other consumer does. tsconfig.json's customConditions names it too.
const ledgerSource: Plugin = {
  name: "ledger-source",
  apply: "serve",
  configEnvironment: (name, config) => ({
    resolve: {
      conditions: config.resolve?.conditions
        ? ["@ledger/source"]
        : [
            ...((config.consumer ?? (name === "client" ? "client" : "server")) === "client"
              ? defaultClientConditions
              : defaultServerConditions),
            "@ledger/source",
          ],
    },
  }),
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: { plugins: [ledgerSource] },
});
