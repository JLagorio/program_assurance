import {
  Fragment,
  useMemo,
  type ComponentProps,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import type { TextElement } from "../primitives";
import { VisuallyHidden } from "../primitives/visually-hidden";
import { toneClasses, type Tone } from "./badge";
import { List } from "./list";
import { TextLink } from "./text-link";

/* Small text parts that recur across rails, headers and cards. For body copy and titles, the
   Text and Heading primitives. */

export type EyebrowProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** One to three words, set in uppercase by the component: a section's name, a record's kind, a callout's label. */
  children: ReactNode;
  /** A colour for a callout's label; `neutral`, the default, is the subtle text colour. */
  tone?: Tone | undefined;
  /** The element: `div` by default; `h3` or `h4` when the eyebrow heads a section, `dt` when it labels a value. */
  as?: TextElement | "h2" | "h3" | "h4" | undefined;
  /** An id, so a list can be labelled by its eyebrow. */
  id?: string | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLElement> | undefined;
};

/** Uppercase micro-label on the xxsmall heading token. A tone colours it for a callout. Native props and the ref reach its element. */
export function Eyebrow({
  children,
  tone = "neutral",
  as = "div",
  className,
  ref,
  ...props
}: EyebrowProps) {
  const Comp = as as "div";
  return (
    <Comp
      {...props}
      ref={ref as Ref<HTMLDivElement> | undefined}
      className={cn(
        "font-heading-xxsmall uppercase",
        tone === "neutral" ? "text-subtle" : toneClasses[tone].text,
        className,
      )}
      data-slot="eyebrow"
    >
      {children}
    </Comp>
  );
}

export type AbsentProps = Omit<ComponentProps<"span">, "children"> & {
  /**
   * What a screen reader hears in place of the dash, when the context says more than the default:
   * "None", "No due date", "Not available". Without it, the LedgerProvider's `absent` message,
   * "Not recorded" in English. The dash itself is always hidden from assistive technology, which
   * skips it at default punctuation settings.
   */
  label?: string | undefined;
};

/**
 * The absent value: a muted dash where a value would be, which a screen reader hears as `label`,
 * "Not recorded" by default.
 */
export function Absent({ label, className, ...props }: AbsentProps = {}) {
  const { messages } = useLedgerLocale();
  const spoken = label || messages.absent;
  return (
    <span {...props} data-slot="absent" className={cn("text-subtlest", className)}>
      <span aria-hidden="true">—</span>
      <VisuallyHidden>{spoken}</VisuallyHidden>
    </span>
  );
}

/* ——— Prose ———————————————————————————————————————————————————————————————————————————————————
   Authored text as the reader wrote it: blank lines separate paragraphs, a line break stays a
   line break, and `markdown` adds a small safe subset (paragraphs, bulleted and numbered lists,
   emphasis, strong, inline and fenced code, links). The source is parsed into React elements;
   no HTML is ever injected, so markup in the text is shown as text, and a link whose address is
   not http(s), mailto, tel or relative is shown as its words alone. */

type ProseInline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "em" | "strong"; children: ProseInline[] }
  | { kind: "link"; href: string; children: ProseInline[] };

type ProseBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "code"; text: string }
  | { kind: "list"; ordered: boolean; start: number; items: ProseBlock[][] };

const LIST_ITEM = /^( *)([-*+]|\d{1,9}[.)])( +|$)(.*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const ESCAPABLE = /[\\`*_{}[\]()#+\-.!<>~|]/;
const WORD = /[\p{L}\p{N}]/u;

const leadingSpaces = (line: string) => line.length - line.trimStart().length;
const isOrderedMarker = (marker: string) => /\d/.test(marker);

/** A list item that may interrupt a paragraph: a bullet, or a numbered item starting at 1. */
function interruptsParagraph(line: string) {
  const item = LIST_ITEM.exec(line);
  if (!item || !item[4]?.trim()) return false;
  return !isOrderedMarker(item[2]!) || parseInt(item[2]!, 10) === 1;
}

function parseList(lines: string[], from: number): [ProseBlock, number] {
  const first = LIST_ITEM.exec(lines[from]!)!;
  const indent = first[1]!.length;
  const ordered = isOrderedMarker(first[2]!);
  const items: string[][] = [];
  let contentColumn = indent + 2;
  let afterBlank = false;
  let i = from;
  while (i < lines.length) {
    const line = lines[i]!;
    const item = LIST_ITEM.exec(line);
    if (item && item[1]!.length < contentColumn && (items.length === 0 || item[1]!.length >= indent)) {
      if (isOrderedMarker(item[2]!) !== ordered) break;
      items.push([item[4]!]);
      contentColumn = item[1]!.length + item[2]!.length + Math.min(Math.max(item[3]!.length, 1), 4);
      afterBlank = false;
      i++;
      continue;
    }
    if (!line.trim()) {
      let next = i + 1;
      while (next < lines.length && !lines[next]!.trim()) next++;
      const following = lines[next];
      const sibling = following !== undefined ? LIST_ITEM.exec(following) : null;
      const continues =
        following !== undefined &&
        (leadingSpaces(following) >= contentColumn ||
          (sibling !== null &&
            sibling[1]!.length >= indent &&
            sibling[1]!.length < contentColumn &&
            isOrderedMarker(sibling[2]!) === ordered));
      if (!continues) break;
      items.at(-1)!.push("");
      afterBlank = true;
      i++;
      continue;
    }
    const lead = leadingSpaces(line);
    if (lead >= contentColumn || (lead > indent && !afterBlank)) {
      items.at(-1)!.push(line.slice(Math.min(lead, contentColumn)));
      i++;
      continue;
    }
    // A lazy continuation line carries on the item's paragraph.
    if (!afterBlank && !item && !FENCE.test(line)) {
      items.at(-1)!.push(line.trim());
      i++;
      continue;
    }
    break;
  }
  return [
    {
      kind: "list",
      ordered,
      start: ordered ? parseInt(first[2]!, 10) : 1,
      items: items.map((body) => parseProseBlocks(body)),
    },
    i,
  ];
}

function parseProseBlocks(lines: string[]): ProseBlock[] {
  const blocks: ProseBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1]!;
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trimStart().startsWith(marker)) body.push(lines[i++]!);
      i++;
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }
    if (LIST_ITEM.test(line)) {
      const [list, next] = parseList(lines, i);
      blocks.push(list);
      i = next;
      continue;
    }
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !FENCE.test(lines[i]!) &&
      !(paragraph.length > 0 && interruptsParagraph(lines[i]!))
    )
      paragraph.push(lines[i++]!.trim());
    blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
  }
  return blocks;
}

function matchLink(src: string, from: number) {
  let depth = 0;
  let close = from;
  for (; close < src.length; close++) {
    const c = src[close];
    if (c === "\\") close++;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) break;
  }
  if (close >= src.length || src[close + 1] !== "(") return null;
  let k = close + 2;
  while (src[k] === " ") k++;
  let href = "";
  let parens = 0;
  for (; k < src.length; k++) {
    const c = src[k]!;
    if (/\s/.test(c) || (c === ")" && parens === 0)) break;
    if (c === "\\" && k + 1 < src.length) {
      k++;
      href += src[k];
      continue;
    }
    if (c === "(") parens++;
    if (c === ")") parens--;
    href += c;
  }
  while (src[k] === " ") k++;
  const quote = src[k];
  if (quote === '"' || quote === "'") {
    const end = src.indexOf(quote, k + 1);
    if (end === -1) return null;
    k = end + 1;
    while (src[k] === " ") k++;
  }
  const label = src.slice(from + 1, close);
  if (src[k] !== ")" || !label.trim()) return null;
  return { label, href: href.replace(/^<(.*)>$/, "$1"), end: k + 1 };
}

function matchEmphasis(src: string, from: number) {
  const mark = src[from]!;
  let run = 1;
  while (src[from + run] === mark) run++;
  // An underscore inside a word (snake_case, a file name) is a character, not emphasis.
  if (mark === "_" && WORD.test(src[from - 1] ?? " ")) return null;
  const size = run >= 2 ? 2 : 1;
  const delimiter = mark.repeat(size);
  const start = from + size;
  if (/\s/.test(src[start] ?? " ")) return null;
  let k = start;
  while (k < src.length) {
    const close = src.indexOf(delimiter, k);
    if (close === -1) return null;
    if (size === 1 && src[close + 1] === mark) {
      let skip = close;
      while (src[skip] === mark) skip++;
      k = skip;
      continue;
    }
    const closes =
      close > start &&
      !/\s/.test(src[close - 1]!) &&
      src[close - 1] !== "\\" &&
      !(mark === "_" && WORD.test(src[close + size] ?? " "));
    if (closes) return { strong: size === 2, inner: src.slice(start, close), end: close + size };
    k = close + 1;
  }
  return null;
}

function parseProseInline(src: string): ProseInline[] {
  const out: ProseInline[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ kind: "text", text });
    text = "";
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (c === "\\" && i + 1 < src.length && ESCAPABLE.test(src[i + 1]!)) {
      text += src[i + 1];
      i += 2;
      continue;
    }
    if (c === "`") {
      let run = 1;
      while (src[i + run] === "`") run++;
      const fence = "`".repeat(run);
      const close = src.indexOf(fence, i + run);
      if (close !== -1) {
        flush();
        let code = src.slice(i + run, close).replace(/\n/g, " ");
        if (code.length > 2 && code.startsWith(" ") && code.endsWith(" ")) code = code.slice(1, -1);
        out.push({ kind: "code", text: code });
        i = close + run;
        continue;
      }
      text += fence;
      i += run;
      continue;
    }
    if (c === "<") {
      const auto = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i.exec(src.slice(i));
      if (auto) {
        flush();
        const href = auto[1]!;
        out.push({ kind: "link", href, children: [{ kind: "text", text: href.replace(/^mailto:/i, "") }] });
        i += auto[0].length;
        continue;
      }
    }
    if (c === "[") {
      const link = matchLink(src, i);
      if (link) {
        flush();
        out.push({ kind: "link", href: link.href, children: parseProseInline(link.label) });
        i = link.end;
        continue;
      }
    }
    if (c === "*" || c === "_") {
      const emphasis = matchEmphasis(src, i);
      if (emphasis) {
        flush();
        out.push({
          kind: emphasis.strong ? "strong" : "em",
          children: parseProseInline(emphasis.inner),
        });
        i = emphasis.end;
        continue;
      }
    }
    text += c;
    i++;
  }
  flush();
  return out;
}

/** An address a link may take: http(s), mailto, tel, or one relative to the page. Anything else (javascript:, data:) is refused. */
function safeHref(raw: string) {
  const href = raw.trim();
  if (!href) return null;
  // Browsers ignore control characters and spaces inside a scheme ("java\tscript:"), so the check does too.
  const bare = Array.from(href, (char) => (char <= " " || char === "\u007f" ? "" : char)).join("");
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(bare);
  if (!scheme) return href;
  return /^(https?|mailto|tel)$/i.test(scheme[1]!) ? href : null;
}

type ProseRenderContext = {
  renderLink: ((href: string) => ReactElement) | undefined;
  paragraph: string;
};

function renderInline(
  nodes: ProseInline[],
  context: ProseRenderContext,
  key: string,
  inLink = false,
): ReactNode[] {
  return nodes.map((node, index) => {
    const id = `${key}.${index}`;
    switch (node.kind) {
      case "text":
        return node.text;
      case "code":
        return (
          <code key={id} className="rounded-xsmall bg-surface-sunken px-050 font-code">
            {node.text}
          </code>
        );
      case "em":
        return <em key={id}>{renderInline(node.children, context, id, inLink)}</em>;
      case "strong":
        return (
          <strong key={id} className="font-semibold">
            {renderInline(node.children, context, id, inLink)}
          </strong>
        );
      case "link": {
        const children = renderInline(node.children, context, id, true);
        const href = safeHref(node.href);
        // A link in a link is its words; a refused address is its words.
        if (inLink || href === null) return <Fragment key={id}>{children}</Fragment>;
        // Underlined, so a link in running text is told apart by more than its colour.
        return context.renderLink ? (
          <TextLink key={id} render={context.renderLink(href)} className="underline">
            {children}
          </TextLink>
        ) : (
          <TextLink key={id} href={href} className="underline">
            {children}
          </TextLink>
        );
      }
    }
  });
}

function renderBlocks(blocks: ProseBlock[], context: ProseRenderContext, key: string): ReactNode[] {
  return blocks.map((block, index) => {
    const id = `${key}.${index}`;
    switch (block.kind) {
      case "paragraph":
        return (
          <p key={id} className={context.paragraph}>
            {renderInline(parseProseInline(block.text), context, id)}
          </p>
        );
      case "code":
        return (
          <pre
            key={id}
            className="whitespace-pre-wrap break-words rounded-medium bg-surface-sunken px-100 py-075 font-code text-default"
          >
            <code>{block.text}</code>
          </pre>
        );
      case "list":
        return (
          <List key={id} ordered={block.ordered} start={block.start}>
            {block.items.map((item, itemIndex) => {
              const itemId = `${id}.${itemIndex}`;
              const only = item.length === 1 ? item[0] : undefined;
              return (
                // An item's own lines stay lines, as a paragraph's do.
                <List.Item key={itemId} className="whitespace-pre-line">
                  {item.length === 0 ? null : only?.kind === "paragraph" ? (
                    renderInline(parseProseInline(only.text), context, itemId)
                  ) : (
                    <div className="flex flex-col gap-050">
                      {renderBlocks(item, context, itemId)}
                    </div>
                  )}
                </List.Item>
              );
            })}
          </List>
        );
    }
  });
}

/** Plain authored text: paragraphs at blank lines; each keeps its line breaks through `pre-line`. */
function plainBlocks(text: string): ProseBlock[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((paragraph) => paragraph.replace(/^\n+|\n+$/g, ""))
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => ({ kind: "paragraph", text: paragraph }));
}

/** Whether children are text alone (strings and numbers), which Prose may split into paragraphs. */
function textOf(children: ReactNode): string | null {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children) && children.length > 0) {
    const parts = children.map((child: ReactNode) =>
      typeof child === "string" || typeof child === "number" ? String(child) : null,
    );
    return parts.every((part) => part !== null) ? parts.join("") : null;
  }
  return null;
}

const proseSizes = {
  medium: { text: "font-body", gap: "gap-100" },
  large: { text: "font-body-large", gap: "gap-150" },
} as const;

export type ProseProps = Omit<ComponentProps<"div">, "children"> & {
  /** The text's name, as an Eyebrow: "Rationale", "Condition". Leave it out for a body of text under a heading of its own. */
  label?: string | undefined;
  /** Colours the label for a callout. */
  tone?: Tone | undefined;
  /**
   * The text. A string is authored text: a blank line starts a paragraph and a line break stays
   * a line break. Composed inline content (words with a TextLink) is one paragraph.
   */
  children?: ReactNode | undefined;
  /**
   * The text as a safe Markdown subset, in place of `children`: paragraphs, `-` and `1.` lists,
   * `*emphasis*`, `**strong**`, `` `code` ``, fenced code and `[links](https://…)`. Line breaks
   * are kept. Anything else, HTML included, shows as the characters typed.
   */
  markdown?: string | undefined;
  /** The element a Markdown link renders through, for a router: `(href) => <Link to={href} />`. A native anchor by default. */
  renderLink?: ((href: string) => ReactElement) | undefined;
  /** `medium` (font.body, the default) in a rail; `large` (font.body.large) for reading text at the measure. */
  size?: keyof typeof proseSizes | undefined;
};

/**
 * Authored text: one paragraph or several, with the line breaks it was written with, optionally a
 * safe Markdown subset, under an optional Eyebrow label.
 */
export function Prose({
  label,
  tone = "neutral",
  children,
  markdown,
  renderLink,
  size = "medium",
  className,
  ...props
}: ProseProps) {
  const sizing = proseSizes[size];
  // A long unbroken token (a URL, a hash, an id) breaks where it must, so authored text never
  // pushes its column wider.
  const paragraph = cn(sizing.text, "whitespace-pre-line break-words text-default");
  const text = markdown === undefined ? textOf(children) : null;
  const blocks = useMemo(
    () =>
      markdown !== undefined
        ? parseProseBlocks(markdown.replace(/\r\n?/g, "\n").split("\n"))
        : text !== null
          ? plainBlocks(text)
          : null,
    [markdown, text],
  );
  const context: ProseRenderContext = { renderLink, paragraph };
  const body =
    blocks === null ? (
      <p className={paragraph}>{children}</p>
    ) : blocks.length === 1 ? (
      renderBlocks(blocks, context, "prose")
    ) : (
      <div data-slot="prose-body" className={cn("flex flex-col", sizing.gap)}>
        {renderBlocks(blocks, context, "prose")}
      </div>
    );
  return (
    <div
      {...props}
      data-slot="prose"
      className={cn(
        "flex flex-col gap-050 text-default",
        sizing.text,
        label && "pt-075",
        className,
      )}
    >
      {label ? <Eyebrow tone={tone}>{label}</Eyebrow> : null}
      {body}
    </div>
  );
}

export type FactProps = Omit<ComponentProps<"div">, "children"> & {
  /** The fact's name, one or two words: "Owner", "Frequency". */
  label: string;
  /** The value: a word, a number, a Person, a Badge, an Absent. */
  children: ReactNode;
  className?: string | undefined;
};

/** Inline `label value` pair. Renders dt/dd; a row of them is a Fact.Group. A value that runs long wraps, and a long unbroken one (an id, a URL) breaks where it must. Native div props and the ref reach the pair. */
function FactRoot({ label, children, className, ...props }: FactProps) {
  return (
    <div
      {...props}
      className={cn("flex min-w-0 items-baseline gap-075", className)}
      data-slot="fact"
    >
      <dt className="shrink-0 font-body-small text-subtle">{label}</dt>
      <dd className="min-w-0 break-words font-body font-medium text-default">{children}</dd>
    </div>
  );
}

export type FactGroupProps = Omit<ComponentProps<"dl">, "children"> & {
  /** Fact children, the ones the reader acts on. At most six under a header. */
  children: ReactNode;
  className?: string | undefined;
};

/** The facts strip: a wrapping row of Facts on one baseline. Under a record header it holds at most six; the rest belong in the rail. Native dl props and the ref reach the list. */
export function FactGroup({ children, className, ...props }: FactGroupProps) {
  return (
    <dl
      {...props}
      className={cn("flex flex-wrap items-baseline gap-x-300 gap-y-075", className)}
      data-slot="fact-group"
    >
      {children}
    </dl>
  );
}

export const Fact = Object.assign(FactRoot, { Group: FactGroup });
