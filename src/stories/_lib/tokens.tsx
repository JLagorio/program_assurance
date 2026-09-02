import { useEffect, useState } from "react";
import type { ReactNode, RefObject } from "react";

/* Shared helpers for the Foundations sheets. Everything reads live from the
   document so the Theme toolbar (Ledger / Nightwatch / Linear-refined) is
   reflected without a reload. */

function watchTheme(read: () => void) {
  read();
  const obs = new MutationObserver(read);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

/** Live value of a CSS custom property on <html>. */
export function useCssVar(name: string): string {
  const [value, setValue] = useState("");
  useEffect(
    () =>
      watchTheme(() =>
        setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim()),
      ),
    [name],
  );
  return value;
}

/** Resolved computed style of an element, e.g. the border-radius a `rounded-md` box actually gets. */
export function useComputed<T extends HTMLElement>(ref: RefObject<T | null>, prop: string): string {
  const [value, setValue] = useState("");
  useEffect(
    () =>
      watchTheme(() => {
        if (ref.current) setValue(getComputedStyle(ref.current).getPropertyValue(prop).trim());
      }),
    [ref, prop],
  );
  return value;
}

export function Sheet({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1100px] space-y-8 py-2">
      <header>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em]">{title}</h1>
        {lede ? (
          <p className="mt-1 max-w-[72ch] text-[13px] text-muted-foreground">{lede}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}

export function Group({
  title,
  note,
  cols = 6,
  children,
}: {
  title: string;
  note?: ReactNode;
  cols?: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline gap-2 border-b border-border pb-1.5">
        <h2 className="text-[13px] font-semibold tracking-[-0.005em]">{title}</h2>
        {note ? <span className="text-[12px] text-muted-foreground">{note}</span> : null}
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {children}
      </div>
    </section>
  );
}

export function Swatch({ token, note }: { token: string; note?: string }) {
  const value = useCssVar(token);
  return (
    <div className="min-w-0">
      <div
        className="h-12 rounded-md ring-1 ring-inset ring-foreground/10"
        style={{ background: `var(${token})` }}
      />
      <div className="mt-1.5 truncate font-mono text-[11px] tracking-tight text-foreground">
        {token}
      </div>
      <div className="truncate font-mono text-[11px] text-muted-foreground" title={value}>
        {value || "—"}
      </div>
      {note ? <div className="mt-0.5 text-[11px] text-muted-foreground">{note}</div> : null}
    </div>
  );
}

/** Small mono annotation under a specimen. */
export function Spec({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-tight text-muted-foreground">{children}</div>
  );
}
