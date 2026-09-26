import { CircleAlert } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode, type Ref } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { headingTag, useHeadingLevel } from "../primitives/heading-level";
import { Alert, AlertDescription, AlertTitle, type AlertProps } from "./alert";
import { Button } from "./button";

export type ErrorSummaryIssue = {
  /** What fixes the field, naming it: "Enter a task title." The FieldError beside the field says the same. */
  message: ReactNode;
  /**
   * The control the item moves focus to: its `id`, the element, or a function that finds it once
   * `onSelect` has rendered it. A group (a RadioGroup, a FieldSet) focuses its first focusable
   * control; a Checkbox or Switch `id`, which names its hidden input, focuses the visible box.
   * With neither `target` nor `onSelect`, the item is text, not a button.
   */
  target?: string | HTMLElement | null | (() => HTMLElement | null | undefined) | undefined;
  /** Runs before focus moves, for example to open the step or tab that holds the field. */
  onSelect?: (() => void) | undefined;
  /** A stable key for the item. Defaults to the target's id, then the position. */
  id?: string | undefined;
};

export type ErrorSummaryProps = Omit<AlertProps, "role" | "tone" | "variant" | "title"> & {
  /** Every issue from the last submission, in the order the fields appear. Renders nothing when empty. */
  issues: readonly ErrorSummaryIssue[];
  /** The title, a heading at the contextual level (an h2 outside every HeadingLevelProvider). Defaults to the locale's "There is a problem". */
  title?: ReactNode | undefined;
  /** An optional sentence between the title and the list. */
  children?: ReactNode | undefined;
  /**
   * Moves focus to the summary when it appears, and again whenever `focusKey` changes, so a reader
   * who submits lands on the list of what to fix. @default true
   */
  autoFocus?: boolean | undefined;
  /** Change it on every failed submission (a submit count) to bring focus back to a summary already showing. */
  focusKey?: string | number | undefined;
};

const tabbable =
  'input:not([type="hidden"]):not([aria-hidden="true"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex="0"], [contenteditable="true"]';

function resolve(target: ErrorSummaryIssue["target"], document: Document) {
  if (!target) return null;
  if (typeof target === "string") return document.getElementById(target);
  if (typeof target === "function") return target() ?? null;
  return target;
}

/** The element to focus for a target: itself when it can take focus, else the control it stands for. */
function focusableFor(element: HTMLElement): HTMLElement {
  if (element.matches(tabbable) || (element.matches("[tabindex]") && element.tabIndex >= 0))
    return element;
  const inside = element.querySelector<HTMLElement>(tabbable);
  if (inside) return inside;
  // Base UI's Checkbox, Radio and Switch put `id` on a hidden input after their visible root.
  if (element instanceof HTMLInputElement && element.getAttribute("aria-hidden") === "true") {
    let root = element.previousElementSibling;
    while (root instanceof HTMLInputElement) root = root.previousElementSibling;
    if (root instanceof HTMLElement && root.hasAttribute("tabindex")) return root;
  }
  return (
    element
      .closest<HTMLElement>('[data-slot="field"], fieldset')
      ?.querySelector<HTMLElement>(tabbable) ?? element
  );
}

/** Moves focus to an issue's control, bringing its label into view. Retries while `onSelect` renders it. */
function focusIssue(issue: ErrorSummaryIssue, document: Document, attempts = 6) {
  const element = resolve(issue.target, document);
  if (!element) {
    if (attempts > 0) requestAnimationFrame(() => focusIssue(issue, document, attempts - 1));
    return;
  }
  const control = focusableFor(element);
  (control.closest('[data-slot="field"], fieldset') ?? control).scrollIntoView({
    block: "nearest",
  });
  // `focusVisible` draws the ring after a pointer press too, so the reader sees where focus went.
  control.focus({ preventScroll: true, focusVisible: true } as FocusOptions);
}

/**
 * Every issue with a submitted form in one place, each a button that moves focus to its field.
 * A danger Alert with `role="alert"`, focused when it appears, for long dialogs, multi-step
 * forms and any form whose fields do not all fit on screen. Each field still shows its own
 * FieldError. Pass the issues from the last submission; recomputing them on every keystroke
 * re-announces the alert while the reader types.
 */
export function ErrorSummary({
  issues,
  title,
  children,
  autoFocus = true,
  focusKey,
  className,
  ref,
  ...props
}: ErrorSummaryProps) {
  const { t } = useLedgerLocale();
  const Title = headingTag(useHeadingLevel() ?? 2);
  const titleId = useId();
  const own = useRef<HTMLDivElement | null>(null);
  const visible = issues.length > 0;
  useEffect(() => {
    if (visible && autoFocus) own.current?.focus();
  }, [visible, autoFocus, focusKey]);
  if (!visible) return null;
  const setRef = (node: HTMLDivElement | null) => {
    own.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };
  return (
    <Alert
      data-slot="error-summary"
      tone="danger"
      role="alert"
      tabIndex={-1}
      aria-labelledby={titleId}
      {...props}
      ref={setRef as Ref<HTMLDivElement>}
      className={cn("outline-none", className)}
    >
      <CircleAlert aria-hidden className="icon-danger" />
      <AlertTitle id={titleId}>
        <Title className="font-body font-medium">{title ?? t("errorSummaryTitle")}</Title>
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-075">
        {children}
        <ul data-slot="error-summary-list" className="flex flex-col gap-050">
          {issues.map((issue, index) => (
            <li
              key={issue.id ?? (typeof issue.target === "string" ? issue.target : index)}
              data-slot="error-summary-item"
            >
              {issue.target || issue.onSelect ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto whitespace-normal text-start text-danger underline"
                  onClick={(event) => {
                    issue.onSelect?.();
                    focusIssue(issue, event.currentTarget.ownerDocument);
                  }}
                >
                  {issue.message}
                </Button>
              ) : (
                // An issue with no field to lead to (a rule across fields) is not an action.
                <span className="text-danger">{issue.message}</span>
              )}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
