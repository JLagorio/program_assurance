import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function AvatarRoot({
  name,
  size = "sm",
  className,
}: {
  name: string;
  size?: "xs" | "sm";
  className?: string;
}) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-secondary-foreground ring-1 ring-inset ring-border-subtle",
        size === "xs" ? "size-4 text-[9px]" : "size-5 text-[10px]",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Person({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <Avatar name={name} size="xs" />
      <span className="truncate">{name}</span>
    </span>
  );
}

function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((n) => (
        <Avatar key={n} name={n} size="xs" className="-ml-1 first:ml-0 ring-background" />
      ))}
      {rest > 0 ? (
        <span className="-ml-1 inline-flex size-4 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground ring-1 ring-inset ring-border-subtle">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

export const Avatar = Object.assign(AvatarRoot, { Stack: AvatarStack });
