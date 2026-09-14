import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from "react";
import { Count } from "../components/badge";
import { cn } from "../lib/cn";
import { useLandmarkTitle, useRegisterTitle } from "../lib/landmark-title";

export type SectionProps = Omit<ComponentProps<"section">, "title"> & {
  /** The heading, for the built-in header. Leave it out and compose Section.Header, Section.Heading, Section.Title and Section.Actions yourself. */
  title?: ReactNode | undefined;
  count?: number | string | null | undefined;
  description?: ReactNode | undefined;
  action?: ReactNode | undefined;
  /** Draw a rule under the heading when the content needs separation. */
  divided?: boolean | undefined;
};
export type SectionHeaderProps = ComponentProps<"div"> & {
  /** Draw a rule under the heading when the content needs separation. */
  divided?: boolean | undefined;
};
export type SectionHeadingProps = ComponentProps<"div">;
export type SectionTitleProps = useRender.ComponentProps<"h2">;
export type SectionDescriptionProps = ComponentProps<"p">;
export type SectionActionsProps = ComponentProps<"div">;

const SectionContext = createContext<{
  titleId: string;
  setHasTitle: (present: boolean) => void;
} | null>(null);

/** A titled region: the built-in header from `title`, `count`, `description` and `action`, or the parts composed by hand. Compose disclosure with Collapsible when needed. */
function SectionRoot({
  title,
  count,
  description,
  action,
  divided = false,
  className,
  children,
  ...props
}: SectionProps) {
  const { titleId, hasTitle, setHasTitle } = useLandmarkTitle();
  const context = useMemo(() => ({ titleId, setHasTitle }), [titleId, setHasTitle]);
  const configured = title !== undefined;
  return (
    <SectionContext.Provider value={context}>
      <section
        {...props}
        aria-labelledby={configured || hasTitle ? titleId : undefined}
        data-slot="section"
        className={cn("min-w-0", className)}
      >
        {configured ? (
          <Header divided={divided}>
            <Heading>
              <div className="flex min-w-0 items-baseline gap-100">
                <Title>{title}</Title>
                {count != null ? <Count value={count} /> : null}
              </div>
              {description ? <Description>{description}</Description> : null}
            </Heading>
            {action ? <Actions>{action}</Actions> : null}
          </Header>
        ) : null}
        {children}
      </section>
    </SectionContext.Provider>
  );
}

/** The bar over the content: a Heading on the left, Actions on the right. */
export function Header({ divided = false, className, ...props }: SectionHeaderProps) {
  return (
    <div
      {...props}
      data-slot="section-header"
      className={cn(
        "flex items-start justify-between gap-100 pb-100",
        divided && "border-b border-default",
        className,
      )}
    />
  );
}
/** The left of the header: the Title with a Count or a Badge beside it, then a Description. */
export function Heading({ className, ...props }: SectionHeadingProps) {
  return (
    <div
      {...props}
      data-slot="section-heading"
      className={cn("flex min-w-0 flex-1 flex-col gap-025", className)}
    />
  );
}
/** The region's heading and its accessible name: an h2, or `render` for another level. */
export function Title({ render, ref, className, ...props }: SectionTitleProps) {
  const section = useContext(SectionContext);
  useRegisterTitle(section?.setHasTitle);
  return useRender({
    defaultTagName: "h2",
    render,
    ref,
    state: { slot: "section-title" },
    props: mergeProps<"h2">(props, {
      ...{ "data-slot": "section-title" },
      id: section?.titleId,
      className: cn("min-w-0 break-words font-body font-medium text-default", className),
    }),
  });
}
export function Description({ className, ...props }: SectionDescriptionProps) {
  return (
    <p
      {...props}
      data-slot="section-description"
      className={cn("font-body-small text-subtle", className)}
    />
  );
}
/** The right of the header: one action, or a few. */
export function Actions({ className, ...props }: SectionActionsProps) {
  return (
    <div
      {...props}
      data-slot="section-actions"
      className={cn("flex shrink-0 items-center gap-100", className)}
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
