import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";

export type TabsProps = TabsPrimitive.Root.Props;

export function Tabs({ className, orientation = "horizontal", dir, ...props }: TabsProps) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={dir === "ltr" || dir === "rtl" ? dir : direction}>
      <TabsPrimitive.Root
        data-slot="tabs"
        dir={dir ?? direction}
        orientation={orientation}
        {...props}
        className={classes(
          "group/tabs flex min-w-0 gap-100 data-[orientation=horizontal]:flex-col",
          className,
        )}
      />
    </DirectionProvider>
  );
}

export const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit max-w-full shrink-0 items-center justify-center rounded-medium p-050 text-subtle data-[orientation=horizontal]:h-control-medium data-[orientation=vertical]:h-fit data-[orientation=vertical]:flex-col",
  {
    variants: {
      variant: {
        default: "bg-neutral",
        line: "gap-300 overflow-x-auto rounded-none border-default bg-transparent p-0 data-[orientation=horizontal]:h-auto data-[orientation=horizontal]:border-b data-[orientation=vertical]:border-e data-[orientation=vertical]:gap-100",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type TabsListProps = TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>;

export function TabsList({ className, variant = "default", ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      {...props}
      className={classes(tabsListVariants({ variant }), className)}
    />
  );
}

export type TabsTriggerProps = TabsPrimitive.Tab.Props;

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      {...props}
      className={classes(
        "relative inline-flex h-full min-h-control-small flex-1 shrink-0 items-center justify-center gap-075 whitespace-nowrap rounded-small px-100 font-body font-medium text-subtle outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused data-active:bg-surface data-active:text-default data-disabled:pointer-events-none data-disabled:text-disabled group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[variant=default]/tabs-list:data-active:shadow-raised group-data-[variant=line]/tabs-list:h-control-medium group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-050 group-data-[variant=line]/tabs-list:data-active:bg-transparent after:pointer-events-none after:absolute after:rounded-full after:bg-brand-bold after:opacity-0 after:transition-opacity after:duration-fast motion-reduce:after:transition-none group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-0 group-data-[orientation=horizontal]/tabs:after:h-025 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:end-0 group-data-[orientation=vertical]/tabs:after:w-025 group-data-[variant=line]/tabs-list:data-active:after:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-medium",
        className,
      )}
    />
  );
}

export type TabsContentProps = TabsPrimitive.Panel.Props;

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      {...props}
      className={classes(
        "flex-1 outline-none focus-visible:outline-focused [&[hidden]]:hidden",
        className,
      )}
    />
  );
}
