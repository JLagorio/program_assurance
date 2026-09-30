import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from "react";
import { Count } from "../components/badge";
import {
  CollapsibleContent,
  DisclosureTrigger,
  type CollapsibleProps,
} from "../components/collapsible";
import { cn } from "../lib/cn";
import { useLandmarkTitle, useRegisterTitle } from "../lib/landmark-title";
import {
  HeadingLevelScope,
  headingTag,
  nextHeadingLevel,
  useHeadingLevel,
  type HeadingLevel,
} from "../primitives/heading-level";

export type SectionProps = Omit<ComponentProps<"section">, "title"> & {
  /** The heading, for the built-in header. Leave it out and compose Section.Header, Section.Heading, Section.Title and Section.Actions yourself. */
  title?: ReactNode | undefined;
  count?: number | string | null | undefined;
  description?: ReactNode | undefined;
  action?: ReactNode | undefined;
  /** Draw a rule under the heading when the content needs separation; the content starts `space.100` below it. */
  divided?: boolean | undefined;
  /** Whether a titled Section is a region landmark named by its title. By default it is one where it heads a part of the page, at the top of its outline (its title an h2): a Section under another titled Section, in a titled panel, in a dialog or under a preview's record title is a titled block in the heading outline only, so the landmark list stays a short map of the page. `true` or `false` decides it outright. An untitled Section is never one. */
  landmark?: boolean | undefined;
  /** Folds the content under the title: the title becomes a button inside the heading, with a chevron after it that turns while the content is open, and the content stays hidden until the reader opens it. For provenance, counts and derivation a reader opens when they need them. Needs `title`. */
  isCollapsible?: boolean | undefined;
  /** With `isCollapsible`, whether it starts open. Closed by default. */
  defaultOpen?: boolean | undefined;
  /** With `isCollapsible`, the open state, when the caller controls it. */
  open?: boolean | undefined;
  /** With `isCollapsible`, called when the reader opens or closes it, with Base UI's event details (`details.cancel()` keeps the state). */
  onOpenChange?: CollapsibleProps["onOpenChange"] | undefined;
};
export type SectionHeaderProps = ComponentProps<"div"> & {
  /** Draw a rule under the heading when the content needs separation; the Section's content starts `space.100` below it. */
  divided?: boolean | undefined;
};
export type SectionHeadingProps = ComponentProps<"div">;
export type SectionTitleProps = useRender.ComponentProps<"h2">;
export type SectionDescriptionProps = ComponentProps<"p">;
export type SectionActionsProps = ComponentProps<"div">;

const SectionContext = createContext<{
  titleId: string;
  setHasTitle: (present: boolean) => void;
  /** The level of this Section's own title. */
  level: HeadingLevel;
} | null>(null);

/** A titled block: the built-in header from `title`, `count`, `description` and `action`, or the parts composed by hand. Its title takes the contextual heading level (an h2 outside every HeadingLevelProvider) and its content one level below, so a Section inside a Section is an h3. At the top of its outline it is a region named by its title; `landmark` decides that outright. `isCollapsible` folds the content under the title, as on Item. */
function SectionRoot({
  title,
  count,
  description,
  action,
  divided = false,
  landmark,
  isCollapsible = false,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  children,
  ...props
}: SectionProps) {
  const { titleId, hasTitle, setHasTitle } = useLandmarkTitle();
  const surrounding = useHeadingLevel();
  const level = surrounding ?? 2;
  const context = useMemo(() => ({ titleId, setHasTitle, level }), [titleId, setHasTitle, level]);
  const configured = title !== undefined;
  const folds = isCollapsible && configured;
  // A region only where it heads a part of the page, unless the caller says otherwise.
  const isLandmark = landmark ?? level <= 2;
  const sectionProps = {
    ...props,
    "aria-labelledby": isLandmark && (configured || hasTitle) ? titleId : undefined,
    "data-slot": "section",
    className: cn("min-w-0", className),
  };
  const header = configured ? (
    <Header divided={divided}>
      <Heading>
        <div className="flex min-w-0 items-baseline gap-100">
          {folds ? (
            <Title>
              <DisclosureTrigger className="py-050">
                {title}
                {count != null ? (
                  <>
                    {" "}
                    <Count value={count} />
                  </>
                ) : null}
              </DisclosureTrigger>
            </Title>
          ) : (
            <>
              <Title>{title}</Title>
              {count != null ? <Count value={count} /> : null}
            </>
          )}
        </div>
        {description ? <Description>{description}</Description> : null}
      </Heading>
      {action ? <Actions>{action}</Actions> : null}
    </Header>
  ) : null;
  // One element tree whether or not a composed Title has mounted yet: only the level changes.
  const body = (
    <HeadingLevelScope level={configured || hasTitle ? nextHeadingLevel(level) : surrounding}>
      {children}
    </HeadingLevelScope>
  );
  return (
    <SectionContext.Provider value={context}>
      {folds ? (
        <CollapsiblePrimitive.Root
          {...(open === undefined ? { defaultOpen } : { open })}
          {...(onOpenChange ? { onOpenChange } : {})}
          render={<section {...sectionProps} data-collapsible="" />}
        >
          {header}
          {/* Kept mounted while closed, so drafts inside survive and find-in-page opens it. */}
          <CollapsibleContent hiddenUntilFound data-slot="section-content">
            {/* Under a divided header the content starts below the rule, inside the fold so a
                closed section adds no height. */}
            {divided ? <div className="pt-100">{body}</div> : body}
          </CollapsibleContent>
        </CollapsiblePrimitive.Root>
      ) : (
        <section {...sectionProps}>
          {header}
          {body}
        </section>
      )}
    </SectionContext.Provider>
  );
}

/** The bar over the content: a Heading, then Actions at the end of its row. The Heading keeps a readable measure; when the row cannot give it that beside the Actions, they take the next row, at the end. A one-line heading sits centred on the Actions' row; a taller one keeps them at its top. `divided` draws a `color.border` rule inside the header's own end, `space.100` above what follows. */
export function Header({ divided = false, className, ...props }: SectionHeaderProps) {
  return (
    <div
      {...props}
      {...(divided ? { "data-divided": "" } : {})}
      data-slot="section-header"
      className={cn(
        "section-header flex min-w-0 flex-wrap items-stretch justify-between gap-100 pb-100",
        className,
      )}
    />
  );
}
/** The start of the header: the Title with a Count or a Badge beside it, then a Description. In a Header it keeps a readable measure of about 12rem, or its own width when that is shorter, and grows. */
export function Heading({ className, ...props }: SectionHeadingProps) {
  return (
    <div
      {...props}
      data-slot="section-heading"
      className={cn("flex min-w-0 flex-col justify-center gap-025", className)}
    />
  );
}
/** The Section's heading, and a region's accessible name, at the Section's level: an h2 outside every HeadingLevelProvider, one below the surrounding level inside one (an h3 in a titled Section). Body size, semibold, as a disclosure's header. `render` sets another element outright. */
export function Title({ render, ref, className, ...props }: SectionTitleProps) {
  const section = useContext(SectionContext);
  const surrounding = useHeadingLevel();
  useRegisterTitle(section?.setHasTitle);
  return useRender({
    defaultTagName: headingTag(section?.level ?? surrounding ?? 2),
    render,
    ref,
    state: { slot: "section-title" },
    props: mergeProps<"h2">(props, {
      ...{ "data-slot": "section-title" },
      id: section?.titleId,
      className: cn("min-w-0 break-words font-body font-semibold text-default", className),
    }),
  });
}
export function Description({ className, ...props }: SectionDescriptionProps) {
  return (
    <p
      {...props}
      data-slot="section-description"
      className={cn("break-words font-body-small text-subtle", className)}
    />
  );
}
/** The end of the header: one action, or a few. They stay on one row with the Heading while it keeps its measure, and take the next row otherwise. */
export function Actions({ className, ...props }: SectionActionsProps) {
  return (
    <div
      {...props}
      data-slot="section-actions"
      className={cn(
        "flex shrink-0 flex-wrap content-start items-center justify-end gap-100",
        className,
      )}
    />
  );
}

export const Section = Object.assign(SectionRoot, {
  Header,
  Heading,
  Title,
  Description,
  Actions,
});
