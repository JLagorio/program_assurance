# Enforce Tailwind CSS Design Tokens in Vue with @shadcn/lint

import Figure from "@features/mdx-components/components/Figure.astro";
import designSystemChecks from "@assets/images/shadcn-lint/tailwind-design-system-checks.png";
import LintExample from '@features/lint-lab/components/LintExample.astro';
import TokenThemeDemo from '@features/lint-lab/components/TokenThemeDemo.vue';

Tailwind is awesome.

I like having the styling next to the markup. I can read a component and understand its layout without jumping between files.

But there's a huge gap between using Tailwind and automatically verifying that code follows a design system.

This becomes especially obvious when AI agents write the UI. An agent can produce valid Tailwind while ignoring the tokens and component variants already in your project. Telling it to follow the design system gives it instructions. It also needs a way to check its work.

Take this button:

```vue
<BaseButton class="bg-red-500">Ship it</BaseButton>
```

`bg-red-500` is valid Tailwind. The app builds. But the button has its own variants and theme colors. Someone just painted over them.

Tailwind generates CSS for valid utilities. It doesn't decide whether a caller should change this button's background.

You can enforce conventions with custom lint rules and other tools. That work existed before this package. But the policy doesn't come from Tailwind itself.

<Figure
  src={designSystemChecks}
  alt="Tailwind generates CSS for bg-red-500 on BaseButton. With the configured @shadcn/lint rules, no-raw-colors and no-restyle report violations. Replacing the class with the danger variant passes the checks."
  caption="A valid Tailwind utility can still violate your component contract. The configured lint rules direct callers to the existing variant."
/>

That's the motivation behind [@shadcn/lint](https://github.com/shadcn-ui/lint#built-for-agents). Shadcn built it for AI agents that write UI. When an agent breaks a design-system rule, the lint error explains the violation, suggests an existing token or variant, and points to the relevant code. The agent can make the correction and run the check again.

That's what I like about the idea. It turns design-system contracts into checks both developers and agents can run. Components own their appearance. Callers use their variants and the classes your policy permits.

I built a small Vue todo lab to try the idea. Then I deliberately broke the styling to see what the linter caught.

## Try breaking the design system

The rendered button is on the left. Its Vue source is on the right. Switch to **After** below them to see the component, source, and lint findings change together.

<LintExample id="component-override" />

These findings come from actual ESLint runs against the Vue examples. The previews render Vue with a scoped stylesheet matching the lab's theme. The widgets display captured results; they don't run ESLint in your browser.

The first example produces two findings. `no-raw-colors` rejects the palette color. `no-restyle` rejects changing the shared button's color at the call site.

The repair uses the button's existing API:

```vue
<BaseButton variant="danger">Ship it</BaseButton>
```

The nice thing is that the message knows which variants exist. In the lab, it lists `primary`, `secondary`, `ghost`, and `danger`. It also points to `src/components/ui/BaseButton.vue`.

That's useful feedback for a developer. It's also useful for a coding agent. The next action is concrete, and the agent can run the same check after its edit.

## A component contract is more than a color rule

The `no-restyle` rule checks recognized design-system components. Token rules also check plain elements.

That distinction matters. Changing a paragraph to `text-danger` can fix its color violation. Changing the button to `class="bg-danger"` still overrides its appearance.

A semantic token doesn't give every caller permission to use it everywhere.

On a plain paragraph, the fix is simpler. Replace the palette color with the role it serves. Here, `text-red-500` becomes `text-danger`:

<LintExample id="raw-color" />

The text still says the same thing. Its color now comes from the theme's danger token.

With `allow: ["layout"]`, a caller can position a button:

```vue
<BaseButton class="mt-4 w-full" variant="danger">
	Delete completed tasks
</BaseButton>
```

The component still controls its padding, background, and radius. If the button needs another size, that belongs in its size API.

Different components can have different contracts. A card's content area might allow padding changes. A title might allow typography changes:

```js
// Options for shadcn/no-restyle
{
	allow: ["layout"],
	contracts: [
		{ pattern: "^CardContent$", allow: ["layout", "spacing"] },
		{ pattern: "^CardTitle$", allow: ["layout", "typography"] },
	],
}
```

Each contract replaces the `allow` list, so keep `layout` when you still want it. The [no-restyle documentation](https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-restyle.md) explains matching and exceptions.

I like this more than a blanket ban on `class`. The policy can reflect how the component is meant to work.

## What the linter reads

The package analyzes source code. It reads component imports, variants, theme declarations, and supported class expressions. For unknown classes, it asks the installed Tailwind 4 whether they generate CSS.

If Tailwind or the theme cannot load, `no-unknown-classes` warns and falls back to weaker grammar checks. Resolve that warning before trusting a clean run. The [fallback documentation](https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-unknown-classes.md#without-a-resolvable-theme) explains the limits.

The loop is simple: run the checks, read the allowed alternatives, edit the source, and run the checks again.

There's no AI service judging the design. The feedback comes from static analysis and the configured rules.

The package supports React, Vue, and Svelte. You don't need shadcn/ui components. Your own UI directory and component APIs can provide the contract.

I'm using `@shadcn/lint` 0.2.0 with Tailwind 4 here. Vue templates need ESLint with `vue-eslint-parser`. Oxlint exposes the script blocks to this plugin, but not the templates. The [Vue setup documentation](https://github.com/shadcn-ui/lint/blob/main/docs/vue.md) covers that difference.

If a project already uses Oxlint, keep it for its existing checks. Add ESLint for the Vue template policy.

## Add the rules to a Vue project

This setup assumes an existing Vue project with Tailwind 4. The plugin requires Node.js 20.19 or later and supports ESLint 9.30 or later. Use a Node version supported by your installed ESLint release. Check the [ESLint prerequisites](https://eslint.org/docs/latest/use/getting-started#prerequisites).

```bash
pnpm add -D @shadcn/lint eslint @typescript-eslint/parser vue-eslint-parser
```

Merge the following into your flat config. If `eslint-plugin-vue` already configures the Vue parser, preserve that setup and add the plugin and rules there.

```js
// eslint.config.mjs
import { plugin as shadcn } from "@shadcn/lint"
import tsParser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config"
import vueParser from "vue-eslint-parser"

export default defineConfig([
	{
		files: ["**/*.vue"],
		languageOptions: {
			parser: vueParser,
			parserOptions: { parser: tsParser },
		},
		plugins: { shadcn },
		rules: {
			"shadcn/no-restyle": ["error", {
				allow: ["layout"],
				componentImports: ["^@/components/ui(?:/|$)"],
			}],
			"shadcn/no-raw-colors": "error",
			"shadcn/no-arbitrary-values": "error",
			"shadcn/no-unknown-classes": "error",
		},
	},
	{
		files: ["src/components/ui/**/*.vue"],
		rules: { "shadcn/no-restyle": "off" },
	},
])
```

The last block lets shared components define their appearance. It keeps the token rules enabled inside those components. Adjust the path to your UI directory.

The plugin discovers the theme through `components.json`, or a stylesheet that imports Tailwind when that file is absent. Check discovery when the project has multiple themes.

Class helpers can also live in TypeScript files. Add another config block with `files: ["**/*.ts"]`, `tsParser`, the plugin, and the rules you want there. The Vue block doesn't cover those files.

For an initial run:

```bash
pnpm exec eslint src
```

Add that command to the project's lint scripts and CI. If you roll out rules as warnings, use `--max-warnings 0` when you're ready to make warnings fail CI.

I would start with a small set of shared components. Fix the findings, then expand coverage. A thousand warnings that everyone ignores won't enforce anything.

## The limits are real

A clean lint result doesn't prove that the page looks good.

The linter doesn't inspect screenshots, measure contrast, or check whether a dialog fits a narrow screen. Browser tests and visual review still have work to do.

It also has source-analysis limits. Vue `<style>` blocks and stylesheet declarations need separate CSS checks. Imported class values and runtime expressions can fall outside what it can resolve.

`require-static-classes` can report unreadable class values on recognized components. It's an additional rule, and the four-rule config above doesn't enable it.

New theme tokens and disabled rules also deserve review. An agent can silence a finding by adding a token for every exception. That passes a token check while making the design system worse.

And don't expect `--fix` to design the interface. Choosing a new variant, accepting a different radius, or changing a semantic role needs judgment.

## Make the tokens worth enforcing

The linter needs a useful policy. I would start with semantic names that describe a role, such as `primary`, `danger`, `surface`, and `muted-foreground`.

A call site using `bg-indigo-600` describes a color choice. A shared component using `bg-primary` describes what the color does.

Try the theme controls below. Switch **Indigo** to **Teal**, then switch **Light** to **Dark**. The semantic components update together. The hardcoded examples keep their fixed colors.

<TokenThemeDemo client:visible />

The demo uses CSS variables to show the difference. A token change reaches every component that references that token. The raw values don't have that connection.

In Tailwind 4, the mapping can look like this:

```css
/* src/styles.css */
@import "tailwindcss";

:root {
	--primary: #4338ca;
	--primary-foreground: #ffffff;
	--surface: #ffffff;
	--foreground: #18181b;
}

.dark {
	--primary: #a5b4fc;
	--primary-foreground: #1e1b4b;
	--surface: #18181b;
	--foreground: #fafafa;
}

@theme inline {
	--color-primary: var(--primary);
	--color-primary-foreground: var(--primary-foreground);
	--color-surface: var(--surface);
	--color-foreground: var(--foreground);
}
```

Now `bg-primary text-primary-foreground` reads the active variables. Put `.dark` on the relevant ancestor to switch those values. Explicit `dark:` utilities need the project's corresponding dark-mode configuration.

Tailwind's [theme documentation](https://tailwindcss.com/docs/theme) explains `@theme inline`. Its [dark-mode guide](https://tailwindcss.com/docs/dark-mode) covers selector-based switching.

Hardcoded values belong in token definitions. That's where the design chooses actual colors. At call sites, use the roles those definitions expose.

Keep foreground and background tokens paired. When a background changes, review its text color too. Check contrast in both themes and in hover, focus, and disabled states.

Keep sizes and radii intentional as well. Shared components should expose a small set of sizes. Avoid adding `--special-page-13px` just to satisfy a lint rule.

This last example replaces `rounded-[13px]` with `rounded-xl`. The visual difference is small, but the radius now uses a named step:

<LintExample id="arbitrary-value" />

That changes the radius from 13px to 12px in this theme. A nearby value isn't automatically the right value. The linter suggests a scale step; I still need to decide whether it fits.

There's a subtle catch with spacing. Tailwind 4 supports dynamic numeric spacing utilities. Removing square brackets doesn't create a finite spacing scale.

The [no-arbitrary-values documentation](https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-arbitrary-values.md) even shows `p-[13px]` becoming `p-3.25` with the default spacing unit. Both represent 13px.

If your policy permits only specific spacing steps, enforce that restriction explicitly. `no-arbitrary-values` alone doesn't do it.

Keep conditional classes complete and visible in source:

```ts
const statusClasses = {
	error: "bg-danger text-danger-foreground",
	ready: "bg-primary text-primary-foreground",
} as const
```

Avoid constructing `bg-${color}-500`. Complete class strings help Tailwind detect utilities and give static analysis something concrete to inspect. See [Tailwind's source detection rules](https://tailwindcss.com/docs/detecting-classes-in-source-files).

For a stricter project, `@theme { --color-*: initial; }` removes the default color namespace. Declare your own colors afterward. Review existing usages before doing that. Resetting `--color-*` leaves `--spacing` intact.

My rule would be simple. Variants own component appearance. Semantic tokens connect components to the theme. Consumers get the layout changes their contracts allow.

Start enforcing that policy on a small area. Review exceptions and new tokens as design decisions. Then a lint failure can point to a real violation, and a passing check means something specific.