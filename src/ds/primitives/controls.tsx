import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[12px] font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const controlBase =
  "h-8 w-full rounded-md border border-input bg-card px-2.5 text-[13px] text-foreground outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(controlBase, "select-chevron appearance-none pr-8", className)}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlBase, "h-auto min-h-[68px] resize-y py-1.5 leading-snug", className)}
      {...props}
    />
  );
}
