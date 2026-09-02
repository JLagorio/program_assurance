import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { Toaster as Sonner, toast } from "sonner";

export { toast };

type Position = NonNullable<ComponentPropsWithoutRef<typeof Sonner>["position"]>;

/** Confirmation of an action: bottom right, gone in a few seconds. Render one Toaster near the root, then toast.success("Evidence linked") from anywhere. */
export function Toaster({ position = "bottom-right", expand = false }: { position?: Position | undefined; expand?: boolean | undefined }) {
  return (
    <Sonner
      position={position}
      expand={expand}
      gap={8}
      offset={16}
      visibleToasts={4}
      icons={{
        success: <CircleCheck className="size-icon-medium icon-success" />,
        error: <CircleAlert className="size-icon-medium icon-danger" />,
        warning: <TriangleAlert className="size-icon-medium icon-warning" />,
        info: <Info className="size-icon-medium icon-information" />,
      }}
      toastOptions={{
        unstyled: true,
        style: { width: 356 },
        classNames: {
          toast: "flex items-start gap-100 rounded-large border border-default bg-surface-overlay px-150 py-150 font-body text-default shadow-overlay",
          icon: "flex shrink-0 items-center",
          content: "flex min-w-0 flex-1 flex-col gap-025",
          title: "font-medium",
          description: "font-body-small text-subtle",
          actionButton: "ms-100 h-control-xsmall shrink-0 rounded-medium bg-brand-bold px-100 font-body-small font-medium text-inverse hover:bg-brand-bold-hovered",
          cancelButton: "ms-100 h-control-xsmall shrink-0 rounded-medium px-100 font-body-small font-medium text-subtle hover:bg-neutral-subtle-hovered hover:text-default",
        },
      }}
    />
  );
}
