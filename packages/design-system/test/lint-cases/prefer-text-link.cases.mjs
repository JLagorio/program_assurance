// ledger/prefer-text-link: navigation that reads as text is TextLink, and a link that opens a new
// tab says so through TextLink newTab.
import { KIT, KIT_SETTINGS, STORY, kitImport } from "../lint-helpers.mjs";

const kit = kitImport("Button", "PreviewNavigation", "TextLink");

export default {
  valid: [
    { code: `${kit} <TextLink href="/x" newTab>Open</TextLink>` },
    { code: `${kit} <TextLink newTab render={<Link to="/x" target="_blank" />}>Open</TextLink>` },
    // A part that announces the new tab itself holds the link in a prop.
    { code: `${kit} <PreviewNavigation openLink={<Link to="/x" target="_blank" />} />` },
    { code: `${kit} <PreviewNavigation openLink={given ?? <Link to="/x" target="_blank" />} />` },
    { code: '<a href="/x" className="truncate">Same tab</a>' },
    { code: `${kit} <Button variant="link" onClick={open}>Preview</Button>` },
    // Without the package preset's settings a file is a product's, whose relative import is its
    // own file, not the kit's TextLink.
    {
      code: 'import { TextLink } from "./text-link"; <TextLink href="/x" target="_blank">Open</TextLink>',
      filename: KIT,
    },
    // The Button branch judges the kit's Button only: a look-alike, another package's or a
    // parameter is not reported.
    { code: '<Button variant="link" asChild><a href="/x">Open</a></Button>' },
    {
      code: 'import { Button } from "other-kit"; <Button variant="link" asChild><a href="/x">Open</a></Button>',
    },
    {
      code: `${kit} export function Row(Button) { return <Button variant="link" asChild><a href="/x">Open</a></Button>; }`,
    },
    // A TextLink that is not the kit's does not announce a new tab, so its target is its own.
    {
      code: 'import { TextLink } from "other-kit"; <TextLink href="/x" target="_blank">Open</TextLink>',
    },
    // In the kit, a story's own component named TextLink is no part, even at the top of the file.
    {
      code: 'function TextLink(p) { return <a {...p} />; } export const X = () => <TextLink href="/x" target="_blank">x</TextLink>;',
      filename: STORY,
      settings: KIT_SETTINGS,
    },
    // A brand colour under a state that marks the current destination is a navigation link's
    // active state, not the text-link look.
    {
      code: '<nav><Link to="/a" className="data-[status=active]:text-brand">A</Link><a href="/b" aria-current="page" className="aria-[current=page]:text-brand">B</a><NavLink to="/c" className="[&.active]:text-brand">C</NavLink></nav>',
    },
    // A component of this file whose TextLink says newTab itself.
    {
      code: `${kitImport("TextLink")} const Out = (props) => <TextLink newTab {...props} />; export const A = () => <Out href="https://example.com" target="_blank">Docs</Out>;`,
    },
  ],
  invalid: [
    {
      code: '<a href="https://example.test" target="_blank" rel="noreferrer">Source</a>',
      errors: [{ messageId: "newTab", data: { tag: "a" }, line: 1, column: 32 }],
    },
    {
      code: '<Link to="/x" target="_blank">Open</Link>',
      errors: [{ messageId: "newTab", data: { tag: "Link" } }],
    },
    {
      code: `${kit} <TextLink href="/x" target="_blank">Open</TextLink>`,
      errors: [{ messageId: "textLinkTarget" }],
    },
    {
      // The product's evidence preview (src/components/prototype/system-evidence.tsx), which its
      // allowance counts.
      code: `${kit} <TextLink href={preview.uri} target="_blank" rel="noopener noreferrer">{preview.uri}</TextLink>`,
      errors: [{ messageId: "textLinkTarget", line: 1, column: 107 }],
    },
    {
      code: `${kit} <TextLink render={<Link to="/x" target="_blank" />}>Open</TextLink>`,
      errors: [{ messageId: "renderTarget" }],
    },
    {
      code: '<NavLink to="/x" className="text-brand hover:underline">Open</NavLink>',
      errors: [{ messageId: "linkClasses", data: { tag: "NavLink" }, line: 1, column: 18 }],
    },
    {
      code: `${kit} <Button variant="link" asChild><a href="/x">Open</a></Button>`,
      errors: [{ messageId: "buttonLink" }],
    },
    {
      // An alias and a namespace are the kit's TextLink and Button.
      code: 'import { TextLink as Go } from "@ledger/design-system"; <Go href="/x" target="_blank">Open</Go>',
      errors: [{ messageId: "textLinkTarget" }],
    },
    {
      code: 'import * as Kit from "@ledger/design-system"; <Kit.TextLink render={<a href="/x" target="_blank" />}>Open</Kit.TextLink>',
      errors: [{ messageId: "renderTarget" }],
    },
    {
      code: 'import { Button as Action } from "@ledger/design-system"; <Action variant="link" asChild><a href="/x">Open</a></Action>',
      errors: [{ messageId: "buttonLink" }],
    },
    {
      // Inside the kit, a relative import of the part is the part, under an alias too.
      code: 'import { TextLink } from "./text-link"; <TextLink href="/x" target="_blank">Open</TextLink>',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [{ messageId: "textLinkTarget" }],
    },
    {
      code: 'import { TextLink as Local } from "../components/text-link"; <Local href="/x" target="_blank">Open</Local>',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [{ messageId: "textLinkTarget" }],
    },
    {
      // The product's note names its own link part.
      code: '<a href="/x" className={cn("text-brand", open && "font-medium")}>Open</a>',
      options: [{ note: "A record's name is RecordLink." }],
      errors: [
        {
          messageId: "linkClasses",
          data: { tag: "a", note: " A record's name is RecordLink." },
        },
      ],
    },
    {
      // The link classes are read through a const and a spread, as a literal is.
      code: 'const linky = "text-brand hover:underline"; <><a href="/x" className={linky}>Open</a><Link to="/x" {...{ className: "hover:underline" }}>Open</Link></>',
      errors: [
        { messageId: "linkClasses", data: { tag: "a" } },
        { messageId: "linkClasses", data: { tag: "Link" } },
      ],
    },
    {
      // A component of this file that hands target on to a TextLink.
      code: `${kitImport("TextLink")} const Out = (props) => <TextLink {...props} />; export const A = () => <Out href="https://example.com" target="_blank">Docs</Out>;`,
      errors: [{ messageId: "forwardedTarget", data: { tag: "Out" } }],
    },
    {
      // The text-link classes at a breakpoint or important fake a link too.
      code: '<><a href="/x" className="md:text-brand">Docs</a><a href="/y" className="!text-brand">Help</a></>',
      errors: [
        { messageId: "linkClasses", data: { tag: "a" } },
        { messageId: "linkClasses", data: { tag: "a" } },
      ],
    },
    {
      // A brand colour at rest is the text-link look, whatever marks the current destination.
      code: '<Link to="/a" className="text-brand data-[status=active]:font-semibold">A</Link>',
      errors: [{ messageId: "linkClasses", data: { tag: "Link" } }],
    },
  ],
};
