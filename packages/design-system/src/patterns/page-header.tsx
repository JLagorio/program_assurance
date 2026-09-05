import type { ReactNode } from "react";

/* The head of an index page: the area it belongs to, the name, one line, the actions. The filters
   and the table are the IndexPage's. */

export type PageHeaderProps = {
  /** The area the page belongs to, above the title: "Libraries", "Risk". A word or two, where a breadcrumb would otherwise sit. */
  eyebrow?: ReactNode;
  /** The page's name, the h1: "Programs", "Control catalog". A noun, not a sentence. */
  title: string;
  /** One line under the title: what the rows are, a constraint, a count. Not an explanation of the model. It truncates, and the full text is its tooltip. */
  description?: string | undefined;
  /** The page's actions at the end of the row: one primary, and at most two beside it. */
  actions?: ReactNode;
};

/** The top of an index page: an eyebrow, the title, one line, the actions. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-300">
      <div className="flex min-w-0 flex-col gap-050">
        {eyebrow ? <div className="font-body text-subtle">{eyebrow}</div> : null}
        <h1 className="font-heading-medium text-default">{title}</h1>
        {description ? (
          <p title={description} className="truncate font-body text-subtle">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-100">{actions}</div> : null}
    </div>
  );
}
