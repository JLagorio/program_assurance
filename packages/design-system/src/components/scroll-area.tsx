import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ScrollArea as Primitive } from "@base-ui/react/scroll-area";
import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";

export type ScrollAreaProps = Primitive.Root.Props & {
  /** Native attributes and ref for the element that actually scrolls. */
  viewportProps?: Primitive.Viewport.Props | undefined;
};
export function ScrollArea({ className, children, dir, viewportProps, ...props }: ScrollAreaProps) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={dir === "rtl" || dir === "ltr" ? dir : direction}>
      <Primitive.Root
        data-slot="scroll-area"
        dir={dir ?? direction}
        {...props}
        className={classes(
          "group/scroll-area relative flex min-h-0 flex-col overflow-hidden",
          className,
        )}
      >
        <Primitive.Viewport
          data-slot="scroll-area-viewport"
          {...viewportProps}
          className={classes(
            "size-full min-h-0 flex-1 rounded-[inherit] outline-none focus-visible:outline-focused",
            viewportProps?.className,
          )}
        >
          {children}
        </Primitive.Viewport>
        <ScrollBar />
        <Primitive.Corner />
      </Primitive.Root>
    </DirectionProvider>
  );
}
export type ScrollBarProps = Primitive.Scrollbar.Props;
export function ScrollBar({ className, orientation = "vertical", ...props }: ScrollBarProps) {
  return (
    <Primitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
      className={classes(
        "flex touch-none select-none p-025 transition-opacity duration-fast data-[orientation=vertical]:h-full data-[orientation=vertical]:w-100 data-[orientation=horizontal]:h-100 data-[orientation=horizontal]:flex-col",
        className,
      )}
    >
      <Primitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-neutral-pressed transition-colors duration-fast ease-standard hover:bg-neutral-bold"
      />
    </Primitive.Scrollbar>
  );
}
