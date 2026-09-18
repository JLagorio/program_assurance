# Repository Guidelines

## Project Structure & Module Organization

Program Assurance uses TanStack Start, React, TypeScript, and Supabase. File-based routes live in `src/routes/`, UI in `src/components/`, and domain logic and generated database models in `src/lib/`. Shared Ledger components, tokens, and Storybook stories live in `packages/design-system/`. Static assets belong in `public/`; migrations and SQL tests in `supabase/`; workflow documentation in `docs/`. Keep archived `tests/fixtures/legacy-poc/` code outside the application runtime.

## Build, Test, and Development Commands

Use Node.js 22.12+ and npm; follow `README.md` for Supabase CLI and Docker/Colima setup.

- `npm install`: install workspace dependencies.
- `npm run local:start`: start Supabase, apply migrations, and prepare local authentication.
- `npm run dev`: start Vite; `npm run build`: validate/build Ledger and the application.
- `npm run lint` and `npx tsc --noEmit`: check lint rules and application types.
- `npm run test:app`: run application Vitest and runtime-boundary tests.
- `npm run storybook`: develop shared UI components.
- `npm run models:generate`: regenerate database types after schema changes.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, double quotes, semicolons, and trailing commas; Prettier sets a 100-character print width. Format changed files with `npx prettier --write <paths>`. Use kebab-case modules, PascalCase components, and TanStack route names such as `programs.$programId.tsx`. Use `@/` for application imports and `@ledger/design-system` for shared UI. Follow ESLint's Ledger rules; regenerate generated files instead of hand-editing them.

## Testing Guidelines

Place domain tests alongside code as `*.test.ts`; Node test-runner suites live in `scripts/tests/*.test.mjs`. Run `npm run test:local` for backend integration and `npm run test:browser` for Playwright workflows; browser checks require Supabase and the app running. Run relevant feature suites. For Ledger changes, follow package checks in `.github/workflows/ci.yml`. No numeric coverage threshold is configured.

## Commit & Pull Request Guidelines

History has no consistent commit prefix. Write action-oriented subjects. Describe behavior changes, link relevant issues, report validation, and include screenshots for UI changes. Keep commits focused and preserve unrelated workspace edits.

## Design system

Read [`packages/design-system/AGENTS.md`](packages/design-system/AGENTS.md) before changing the kit. It points at the component library guide, the Storybook (the contract, with an MCP server at port 6007) and the checks in CI order; `packages/design-system/llms.txt` is the Storybook as one generated file for tools that cannot reach it. Domain code in `src/lib` never imports the UI; the lint enforces the direction.

## Screens

Read [the product pattern contract](docs/guides/product-patterns.md) before creating or changing a screen. It decides which Ledger part this application uses for each shape (register, preview, record, form, states, titles), names the closed exceptions, points at the file to copy, and says what checks it. Ledger's Storybook documents the generic component APIs; the contract decides between them here. Do not infer a shape from a neighbouring screen, and do not keep a second copy of the contract in any instruction file. A shape the contract does not cover needs a written recommendation before it is built. After changing a screen, run the lint, type and workflow checks and look at it at desktop and 390px widths.

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
