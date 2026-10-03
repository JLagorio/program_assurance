# Repository guidelines

This is a slice of Program Assurance, a React 19 and TypeScript product built on Ledger, its design system (`@ledger/design-system`). Product screens live in `src/components/prototype/`; the kit lives in `packages/design-system/`.

## Design system

Read [`packages/design-system/AGENTS.md`](packages/design-system/AGENTS.md) before using or changing the kit. It points at the component library guide and the Storybook, the contract for every part; [`packages/design-system/llms.txt`](packages/design-system/llms.txt) is the Storybook as one file. Product code imports the package root, `@ledger/design-system`, and never a file inside it.

## Screens

Read [the product pattern contract](docs/guides/product-patterns.md) before creating or changing a screen. It decides which Ledger part this application uses for each shape. Some files it names as references are not in this slice; [`src/components/prototype/supplier-register.tsx`](src/components/prototype/supplier-register.tsx) is a register to copy from.

## Style

Strict TypeScript, two-space indentation, double quotes, semicolons and trailing commas, 100 columns. Follow ESLint's Ledger rules.
