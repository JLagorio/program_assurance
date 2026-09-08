import {
  Button,
  Inline,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type ButtonProps,
} from "@ledger/design-system";

/** A capability that needs a connected service or an unfinished product workflow. */
export function UnavailableAction({
  reason,
  children,
  ...props
}: ButtonProps & { reason: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Inline
            as="span"
            display="inline-flex"
            tabIndex={0}
            role="group"
            aria-label={reason}
            className="focus-visible:outline-focused"
          >
            <Button {...props} disabled title={reason}>
              {children} <span className="font-body-xsmall">(unavailable)</span>
            </Button>
          </Inline>
        }
      />
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
