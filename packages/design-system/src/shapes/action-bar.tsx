import type { ReactNode } from "react";

import { Badge, Indicator, type Tone } from "../components/badge";
import { Button } from "../components/button";
import { Fact } from "../components/typography";
import { RecordHeader } from "../patterns/record-header";

/* Reference material. The RecordHeader is the header of every record: the trail ending in the
   id, the title with a word of meta, the actions, the facts, the strip below. A work surface
   needs the same header pinned above the work with two more things: the state axes as facts,
   the first the headline as a Badge and the rest a dot and a word, and the actions that change
   the state, where a blocked action stays in the row, disabled, with its reason written under
   it, because hiding the action hides the rule. Jira's issue header with its workflow button is
   the model; Atlassian's page header puts the actions beside the title the same way. */

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
  /** The parents in the trail, Breadcrumb.Items; the id is the trail's last crumb. */
  crumbs?: ReactNode;
  /** @deprecated A whole Breadcrumb. Pass the parents as `crumbs`; the id is drawn as the last crumb. */
  breadcrumb?: ReactNode;
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
export function ActionBar({
  crumbs,
  breadcrumb,
  id,
  title,
  context,
  states,
  actions,
  tabs,
}: ActionBarProps) {
  const blocked = actions?.filter((a) => a.blocked) ?? [];
  const facts = states.length
    ? states.map((s, i) => (
        <Fact key={s.label} label={s.label}>
          {s.control ??
            (i === 0 ? (
              <Badge size="xsmall" tone={s.tone}>
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
      <RecordHeader
        crumbs={crumbs}
        breadcrumb={breadcrumb}
        id={id}
        title={title}
        meta={context}
        facts={facts}
        actions={buttons}
        below={tabs}
      />
    </div>
  );
}
