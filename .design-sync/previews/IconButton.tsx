import { IconButton } from "program-assurance";
import { Download, Pencil, RefreshCw, Trash2, Copy } from "lucide-react";

export function Actions() {
  return (
    <div className="flex items-center gap-2">
      <IconButton aria-label="Download evidence">
        <Download className="size-4" />
      </IconButton>
      <IconButton aria-label="Edit finding">
        <Pencil className="size-4" />
      </IconButton>
      <IconButton aria-label="Re-run scan">
        <RefreshCw className="size-4" />
      </IconButton>
      <IconButton aria-label="Copy control ID">
        <Copy className="size-4" />
      </IconButton>
      <IconButton aria-label="Delete artifact">
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex items-center gap-2">
      <IconButton aria-label="Download evidence" disabled>
        <Download className="size-4" />
      </IconButton>
      <IconButton aria-label="Delete artifact" disabled>
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );
}
