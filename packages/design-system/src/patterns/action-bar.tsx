import type { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Id,
} from "../components";
import { PageHeader } from "../layout";

import { Badge, Indicator, type Tone } from "../components/badge";
import { Button } from "../components/button";
import { Fact } from "../components/typography";

/* The PageHeader is the header of every record: the trail ending in the
   id, the title with a word of meta, the actions, the facts, the strip below. A work surface
   needs the same header pinned above the work with two more things: the state axes as facts,
   the first the headline as a Badge and the rest a dot and a word, and the actions that change
   the state, where a blocked action stays in the row, disabled, with its reason written under
   it, because hiding the action hides the rule. The actions sit beside the title, as on every
   record's header. */

export type ActionBarState = {
  /** The axis: "Implementation", "Assessment", "Evidence". */
  label: string;
  /** The state as a word: "Partially satisfied", "34d". */
  value: string;
  tone: Tone;
  /** Rendered in place of the word when the viewer may change it: a small button, a select. */
  control?: ReactNode;
};

export type ActionBarAction = {
  /** A verb: "Request evidence", "Mark satisfied", "Submit". */
  label: string;
  onSelect: () => void;
  /** One per bar. */
  primary?: boolean | undefined;
  /** Why the action cannot be taken now: "2 findings still open". The button stays, disabled, and the reason is written under the row. */
  blocked?: string | null | undefined;
};

export type ActionBarProps = {
  /** The parents as BreadcrumbItem elements with BreadcrumbSeparator between them; the header appends the id as the last crumb. */
  crumbs?: ReactNode;
  /** The record's id: the last crumb of the trail. */
  id: ReactNode;
  /** The record's name, the h1. */
  title: ReactNode;
  /** After the title, a few words: the scope, the owner. */
  context?: ReactNode;
  /** The state axes, as facts under the title: the first a Badge, the headline; the rest a dot and a word. */
  states: ActionBarState[];
  /** The actions that change the state, one primary. A blocked action stays, disabled, with its reason under the row. */
  actions?: ActionBarAction[] | undefined;
  /** The tab strip under the bar. */
  tabs?: ReactNode;
};

/** The record's header pinned above the work: the trail, the title, the state axes as facts, and the actions that change them. A blocked action carries its reason rather than hiding. */
export function ActionBar({ crumbs, id, title, context, states, actions, tabs }: ActionBarProps) {
  const blocked = actions?.filter((a) => a.blocked) ?? [];
  const facts = states.length
    ? states.map((s, i) => (
        <Fact key={s.label} label={s.label}>
          {s.control ??
            (i === 0 ? (
              <Badge variant="secondary" size="xsmall" tone={s.tone}>
                {s.value}
              </Badge>
            ) : (
              <Indicator tone={s.tone}>{s.value}</Indicator>
            ))}
        </Fact>
      ))
    : null;
  const buttons = actions?.length ? (
    <div className="flex max-w-layout-measure flex-col items-end gap-050">
      <div className="flex items-center gap-100">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant={a.primary ? "primary" : "secondary"}
            onClick={a.onSelect}
            disabled={Boolean(a.blocked)}
          >
            {a.label}
          </Button>
        ))}
      </div>
      {blocked.length ? (
        <span className="text-end font-body-xsmall text-subtle">
          {blocked.map((a) => `${a.label}: ${a.blocked}`).join(" · ")}
        </span>
      ) : null}
    </div>
  ) : null;
  return (
    <div
      className={
        tabs
          ? "sticky-bar z-20 border-b border-default bg-surface-current pt-050"
          : "sticky-bar z-20 border-b border-default bg-surface-current pb-150 pt-050"
      }
    >
      <PageHeader>
        <Breadcrumb className="col-span-full">
          <BreadcrumbList>
            {crumbs}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Id>{id}</Id>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="min-w-0">
          <PageHeader.Title>{title}</PageHeader.Title>
          <div className="pt-050 flex flex-wrap items-center gap-100 font-body-small text-subtle">
            {context}
          </div>
        </div>
        <PageHeader.Actions>{buttons}</PageHeader.Actions>
        <div className="col-span-full">
          <>
            {facts ? (
              <Fact.Group className="border-t border-default pt-100">{facts}</Fact.Group>
            ) : null}
            {tabs}
          </>
        </div>
      </PageHeader>
    </div>
  );
}
