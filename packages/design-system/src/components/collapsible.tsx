import { Collapsible as Primitive } from "@base-ui/react/collapsible";
import { classes } from "../lib/base-ui";

export type CollapsibleProps = Primitive.Root.Props;
export type CollapsibleTriggerProps = Primitive.Trigger.Props;
export type CollapsibleContentProps = Primitive.Panel.Props;
export function Collapsible(props: CollapsibleProps) {
  return <Primitive.Root data-slot="collapsible" {...props} />;
}
export function CollapsibleTrigger({ className, ...props }: CollapsibleTriggerProps) {
  return (
    <Primitive.Trigger
      data-slot="collapsible-trigger"
      {...props}
      className={classes(
        "rounded-small outline-none focus-visible:outline-focused data-disabled:pointer-events-none data-disabled:text-disabled",
        className,
      )}
    />
  );
}
export function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
  return (
    <Primitive.Panel
      data-slot="collapsible-content"
      {...props}
      className={classes(
        "h-(--collapsible-panel-height) overflow-hidden data-open:animate-collapse-open data-closed:animate-collapse-close [&[hidden]:not([hidden=until-found])]:hidden",
        className,
      )}
    />
  );
}
