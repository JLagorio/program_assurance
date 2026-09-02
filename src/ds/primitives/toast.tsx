import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";
import { Toaster as Sonner, toast } from "sonner";

export { toast };

type Position = NonNullable<ComponentProps<typeof Sonner>["position"]>;

/* Confirmation of an action: bottom right, gone in a few seconds. Render one
   Toaster near the root, then toast.success("Evidence linked"),
   toast.error(...), toast.warning(...) or toast.info(...) from anywhere. */
export function Toaster({
  position = "bottom-right",
  expand = false,
}: {
  position?: Position;
  expand?: boolean;
}) {
  return (
    <Sonner
      position={position}
      expand={expand}
      gap={8}
      offset={16}
      visibleToasts={4}
      icons={{
        success: <CircleCheck className="size-4 text-success" />,
        error: <CircleAlert className="size-4 text-danger" />,
        warning: <TriangleAlert className="size-4 text-warning" />,
        info: <Info className="size-4 text-info" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[356px] items-start gap-2.5 rounded-lg border border-border bg-popover px-3.5 py-3 text-13 text-popover-foreground shadow-pop",
          icon: "mt-px flex shrink-0 items-center",
          content: "min-w-0 flex-1",
          title: "font-medium leading-snug",
          description: "mt-0.5 text-12 leading-snug text-muted-foreground",
          actionButton:
            "ml-2 h-6 shrink-0 rounded-md bg-primary px-2 text-12 font-medium text-primary-foreground shadow-button-primary hover:bg-primary-hover",
          cancelButton:
            "ml-2 h-6 shrink-0 rounded-md px-2 text-12 font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground",
        },
      }}
    />
  );
}
