import {
  IconButton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "program-assurance";
import { History } from "lucide-react";

export function OnIconButton() {
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="flex items-center justify-center"
        style={{ paddingTop: 96, paddingBottom: 40 }}
      >
        <Tooltip open>
          <TooltipTrigger asChild>
            <IconButton aria-label="View assessment history">
              <History className="size-4" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent side="top">View assessment history</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
