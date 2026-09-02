export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

/* One tone table for every status primitive (Badge, Dot, Meter, StackedBar).
   `text` and `fill` are the solid token; `soft` is the tinted surface a Badge
   sits on. Neutral has no solid token: fills use one alpha of muted-foreground
   and the dot one step darker so it still reads at 6px. Info stays on `info`,
   not `primary`, so data bars do not spend the blue budget. */
export const toneClasses: Record<Tone, { text: string; soft: string; fill: string; dot: string }> =
  {
    neutral: {
      text: "text-muted-foreground",
      soft: "bg-muted",
      fill: "bg-muted-foreground/40",
      dot: "bg-muted-foreground/50",
    },
    success: {
      text: "text-success",
      soft: "bg-success-soft",
      fill: "bg-success",
      dot: "bg-success",
    },
    warning: {
      text: "text-warning",
      soft: "bg-warning-soft",
      fill: "bg-warning",
      dot: "bg-warning",
    },
    danger: { text: "text-danger", soft: "bg-danger-soft", fill: "bg-danger", dot: "bg-danger" },
    info: { text: "text-info", soft: "bg-info-soft", fill: "bg-info", dot: "bg-info" },
  };
