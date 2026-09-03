import type { ReactNode } from "react";

import docs from "../../generated/docs.json";

/* Shared pieces for the token sheets. Everything here is built from the generated
   utilities, so the sheets are the first consumer of the system they document. */

export type TokenDoc = {
  name: string;
  cssVar: string;
  type: string;
  group: string;
  description: string;
  light: string;
  dark: string | null;
  lightResolved: string;
  darkResolved: string | null;
  introduced: string | null;
  deprecated: string | null;
  utility: string | null;
};

export const allDocs = docs as TokenDoc[];

export const under = (prefix: string) =>
  allDocs.filter((d) => d.name === prefix || d.name.startsWith(prefix + "."));

export function Page({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-600 py-100">
      <header className="flex flex-col gap-050">
        <h1 className="font-heading-small text-default">{title}</h1>
        {lede ? <p className="max-w-[72ch] font-body text-subtle">{lede}</p> : null}
      </header>
      {children}
    </div>
  );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-150">
      <h2 className="font-body-xsmall uppercase tracking-[0.06em] text-subtlest">{title}</h2>
      {children}
    </section>
  );
}

/** A value in code style without leaving the one typeface. */
export function Spec({ children }: { children: ReactNode }) {
  return <span className="font-body-small text-subtlest tabular-nums">{children}</span>;
}

/** Renders `children` inside a forced colour mode, so light and dark sit side by side. */
export function Mode({
  mode,
  children,
  className,
}: {
  mode: "light" | "dark";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-color-mode={mode} className={"bg-surface text-default " + (className ?? "")}>
      {children}
    </div>
  );
}

function SwatchBody({ d }: { d: TokenDoc }) {
  const v = `var(${d.cssVar})`;
  if (d.group === "text" || d.group === "icon")
    return (
      <span className="font-heading-small" style={{ color: v }}>
        Aa
      </span>
    );
  if (d.group === "border")
    return (
      <span
        className="block size-400 rounded-medium bg-surface"
        style={{ border: `2px solid ${v}` }}
      />
    );
  if (d.group === "shadow")
    return (
      <span className="block size-400 rounded-medium bg-surface-raised" style={{ boxShadow: v }} />
    );
  if (d.group === "opacity")
    return (
      <span className="block size-400 rounded-medium bg-neutral-bold" style={{ opacity: v }} />
    );
  return null;
}

/** One token in one mode: a swatch on the mode's own surface. */
export function Swatch({ d, mode }: { d: TokenDoc; mode: "light" | "dark" }) {
  const v = `var(${d.cssVar})`;
  const isFill = d.group === "background" || d.group === "surface" || d.group === "palette";
  return (
    <Mode mode={mode} className="flex h-600 w-full items-center justify-center rounded-medium">
      {isFill ? (
        <span className="block size-full rounded-medium" style={{ backgroundColor: v }} />
      ) : (
        <SwatchBody d={d} />
      )}
    </Mode>
  );
}

/** The documentation table: name, description, light value, dark value. */
export function TokenTable({ rows }: { rows: TokenDoc[] }) {
  return (
    <div className="overflow-x-auto rounded-large border border-default">
      <table className="w-full border-collapse font-body">
        <thead>
          <tr className="border-b border-default bg-surface-sunken text-left font-body-small text-subtlest">
            <th className="px-150 py-100 font-medium">Token</th>
            <th className="px-150 py-100 font-medium">Light</th>
            <th className="px-150 py-100 font-medium">Dark</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.name} className="border-b border-default last:border-b-0 align-top">
              <td className="w-[46%] px-150 py-100">
                <div className="flex flex-col gap-025">
                  <span className="text-default">{d.name}</span>
                  {d.utility ? <Spec>{d.utility}</Spec> : null}
                  {d.description ? (
                    <span className="font-body-small text-subtle">{d.description}</span>
                  ) : null}
                  {d.deprecated ? (
                    <span className="font-body-small text-danger">Deprecated: {d.deprecated}</span>
                  ) : null}
                </div>
              </td>
              <td className="w-[27%] px-150 py-100">
                <div className="flex flex-col gap-050">
                  <Swatch d={d} mode="light" />
                  <Spec>{d.light}</Spec>
                </div>
              </td>
              <td className="w-[27%] px-150 py-100">
                {d.dark ? (
                  <div className="flex flex-col gap-050">
                    <Swatch d={d} mode="dark" />
                    <Spec>{d.dark}</Spec>
                  </div>
                ) : (
                  <Spec>same</Spec>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
