import { useId } from "react";

import { cn } from "../../lib/cn";

/** A pattern a series wears as well as its colour, so a stack reads in print, under colour-vision loss and in a forced-colours mode. `solid` is none. */
export type Texture = "solid" | "hatch" | "hatch-back" | "dots" | "cross" | "lines" | "columns";

const textureOrder: Texture[] = [
  "solid",
  "hatch",
  "hatch-back",
  "dots",
  "cross",
  "lines",
  "columns",
];

/** The texture of the i-th series: the first solid, then the six patterns in order. */
export const textureOf = (i: number): Texture => textureOrder[i % textureOrder.length] ?? "solid";

/** The fill of a textured series: its pattern's url, or its colour when solid. */
export const textureFill = (id: string, key: string, texture: Texture, color: string) =>
  texture === "solid" ? color : `url(#${id}-${key})`;

/** One textured series: its key, its colour and its pattern. */
export type TextureEntry = { key: string; color: string; texture: Texture };

function PatternMarks({ texture, color }: { texture: Texture; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const };
  switch (texture) {
    case "hatch":
      return <path d="M-2,10 L10,-2 M-2,2 L2,-2 M6,10 L10,6" {...stroke} />;
    case "hatch-back":
      return <path d="M-2,-2 L10,10 M6,-2 L10,2 M-2,6 L2,10" {...stroke} />;
    case "dots":
      return <circle cx={4} cy={4} r={1.6} fill={color} />;
    case "cross":
      return <path d="M-2,10 L10,-2 M-2,-2 L10,10" {...stroke} />;
    case "lines":
      return <path d="M0,4 L8,4" {...stroke} />;
    case "columns":
      return <path d="M4,0 L4,8" {...stroke} />;
    default:
      return null;
  }
}

/** The pattern of one textured series: the colour at 30% under the marks in the colour, 8px across. */
function Pattern({ id, texture, color }: { id: string; texture: Texture; color: string }) {
  return (
    <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse">
      <rect width={8} height={8} fill={color} fillOpacity={0.3} />
      <PatternMarks texture={texture} color={color} />
    </pattern>
  );
}

/** The defs a chart needs for its textured series, inside an svg: `url(#<id>-<key>)` for each. */
export function TextureDefs({ id, entries }: { id: string; entries: TextureEntry[] }) {
  return (
    <defs>
      {entries.map((e) =>
        e.texture === "solid" ? null : (
          <Pattern key={e.key} id={`${id}-${e.key}`} texture={e.texture} color={e.color} />
        ),
      )}
    </defs>
  );
}

/**
 * The same defs in an svg of their own beside the plot, for `Plot`'s `textures`: a fill in any svg
 * of the document can point at them, so a part that wears textures gets its patterns whether or
 * not it draws defs inside its chart. Zero-sized rather than `display: none`, which would stop the
 * patterns painting.
 */
export function PlotTextureDefs({ id, entries }: { id: string; entries: TextureEntry[] }) {
  if (!entries.some((e) => e.texture !== "solid")) return null;
  return (
    <svg
      aria-hidden
      focusable="false"
      width={0}
      height={0}
      className="pointer-events-none absolute overflow-hidden"
      data-slot="chart-textures"
    >
      <TextureDefs id={id} entries={entries} />
    </svg>
  );
}

/** A textured swatch for a legend or a card: the pattern in its own small svg. */
export function TextureSwatch({
  texture,
  color,
  className,
}: {
  texture: Texture;
  color: string;
  className?: string | undefined;
}) {
  const id = useId();
  return (
    <svg
      aria-hidden
      width={12}
      height={12}
      data-slot="chart-swatch"
      className={cn("shrink-0 rounded-xsmall", className)}
    >
      <defs>
        <Pattern id={id} texture={texture} color={color} />
      </defs>
      <rect width={12} height={12} rx={2} fill={texture === "solid" ? color : `url(#${id})`} />
    </svg>
  );
}
