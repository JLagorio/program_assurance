import { cn } from "../lib/cn";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const sizes = { xsmall: "size-200", small: "size-250" } as const;

/** Initials in a circle. No photos in this product; a name is enough. */
function AvatarRoot({ name, size = "small", className }: { name: string; size?: keyof typeof sizes | undefined; className?: string | undefined }) {
  return (
    <span
      title={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border border-default bg-neutral font-body-xsmall font-medium text-subtle", sizes[size], className)}
    >
      {initials(name)}
    </span>
  );
}

/** An Avatar with the name beside it. */
export function Person({ name, className }: { name: string; className?: string | undefined }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-075", className)}>
      <Avatar name={name} size="xsmall" />
      <span className="truncate">{name}</span>
    </span>
  );
}

/** Up to `max` avatars overlapping, then a +n. */
function AvatarStack({ names, max = 4 }: { names: string[]; max?: number | undefined }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="flex items-center -space-x-050">
      {shown.map((n) => (
        <Avatar key={n} name={n} size="xsmall" />
      ))}
      {rest > 0 ? (
        <span className="inline-flex size-200 items-center justify-center rounded-full border border-default bg-neutral font-body-xsmall font-medium text-subtle">+{rest}</span>
      ) : null}
    </span>
  );
}

export const Avatar = Object.assign(AvatarRoot, { Stack: AvatarStack });
