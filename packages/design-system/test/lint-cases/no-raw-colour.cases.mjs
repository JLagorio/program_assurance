// ledger/no-raw-colour: an SVG or chart colour is currentColor or a token. A colour attribute on
// an SVG element or a recharts part, the colour keys of a recharts part's object props and of the
// records its data or payload holds, and a module's list of colours are read through the value,
// wherever it is written.
import { KIT, KIT_SETTINGS, STORY } from "../lint-helpers.mjs";

const attribute = (tag, name, value, from = "") => ({
  messageId: "attribute",
  data: { tag, attribute: name, value, from },
});

export default {
  valid: [
    { code: '<rect fill={token("color.chart.brand")} stroke={surface()} />' },
    { code: '<><rect fill="url(#hatch)" /><path fill="currentColor" stroke="none" /></>' },
    { code: '<stop stopColor="var(--ds-color-chart-brand)" stopOpacity={0.3} />' },
    // A kit part's own props named fill or color are the part's, never a colour attribute.
    { code: '<><DataTable fill={fill} /><Text color="color.text.subtle" /></>' },
    // A component that is not recharts' keeps its props.
    { code: '<Cell fill="#f00" />' },
    {
      code: 'import { Bar } from "recharts"; export const A = ({ i }) => <Bar dataKey="y" fill={chartColor(i)} label={{ position: "top" }} />;',
    },
    // A list of colour names alone is as often a list of token names.
    {
      code: 'const hues = ["blue", "teal", "green"]; export const A = ({ hue }) => <span className={`bg-accent-${hue}`} />;',
    },
    // A style's colours are no-style-design-value's.
    {
      code: 'const tones = { danger: { fill: "#f00" } }; export const A = () => <i style={tones.danger} />;',
    },
    {
      code: 'import type { CSSProperties } from "react"; export const s: CSSProperties = { color: "#f00" };',
      only: "ts",
    },
    // A list with something else in it is no list of colours.
    { code: 'export const series = [{ key: "a", label: "Open", color: "#f00" }];' },
    // A colour the browser's own chrome reads, and relative colour syntax on a token.
    { code: '<link rel="mask-icon" href="/pinned.svg" color="#5bbad5" />' },
    { code: '<rect fill="oklch(from var(--ds-color-chart-brand) l c h / 0.4)" />' },
    // A recharts part's records read by key, with their colour from a token.
    {
      code: 'import { Pie } from "recharts"; export const A = ({ open }) => <Pie dataKey="value" data={[{ name: "Open", value: open, fill: token("color.chart.brand") }]} />;',
    },
  ],
  invalid: [
    {
      code: '<svg><rect fill="#f00" /></svg>',
      errors: [{ ...attribute("rect", "fill", "#f00"), line: 1, column: 12 }],
    },
    {
      // Either branch, a template with its holes as written, and a colour name.
      code: '<><rect fill={on ? "#f00" : "currentColor"} /><stop stopColor={`hsl(${h} 50% 50%)`} /><circle stroke="tomato" /></>',
      errors: [
        attribute("rect", "fill", "#f00"),
        attribute("stop", "stopColor", "hsl(${h} 50% 50%)"),
        attribute("circle", "stroke", "tomato"),
      ],
    },
    {
      // A const is read where it is used, and said where it is written.
      code: 'const RED = "#f00";\nexport const A = () => <circle fill={RED} />;',
      errors: [attribute("circle", "fill", "#f00", " (from RED on line 1)")],
    },
    {
      // A recharts part, by name, alias or namespace.
      code: 'import { Bar } from "recharts"; import * as R from "recharts"; export const A = () => <><Bar dataKey="y" fill="#8884d8" /><R.Line dataKey="v" stroke="rgb(0 0 0)" /></>;',
      errors: [attribute("Bar", "fill", "#8884d8"), attribute("R.Line", "stroke", "rgb(0 0 0)")],
    },
    {
      // A recharts part's object props: the colour keys of what they are given.
      code: 'import { Line, XAxis } from "recharts"; const tick = { fill: "#666", fontSize: 12 }; export const A = () => <><Line dataKey="v" activeDot={{ r: 4, fill: "#fff" }} /><XAxis tick={tick} /></>;',
      errors: [
        {
          messageId: "entry",
          data: { tag: "XAxis", attribute: "tick", key: "fill", value: "#666", from: "" },
          line: 1,
          column: 56,
        },
        {
          messageId: "entry",
          data: { tag: "Line", attribute: "activeDot", key: "fill", value: "#fff", from: "" },
        },
      ],
    },
    {
      // A module's list of colours is reported where it is written, once, however it is read.
      code: 'import { Cell } from "recharts"; const COLORS = ["#0088FE", "#00C49F"]; export const A = ({ i }) => <Cell fill={COLORS[i % 2]} />;',
      errors: [
        {
          messageId: "list",
          data: { name: "COLORS", value: "#0088FE, #00C49F" },
          line: 1,
          column: 40,
        },
      ],
    },
    {
      code: 'export const palette = Object.freeze({ danger: "#e11d48", ok: "#16a34a", warn: "orange", info: "hsl(210 80% 50%)", dim: 0.5 });',
      errors: [
        {
          messageId: "list",
          data: { name: "palette", value: "#e11d48, #16a34a, orange and 1 more" },
        },
      ],
    },
    {
      // A recharts part's records paint from their own colour keys: a Pie's sectors from each
      // record's fill (Cell is deprecated), a Legend's entries from their color. A record two
      // parts read is reported once.
      code: 'import { Legend, Pie } from "recharts"; const data = [{ name: "Open", value: 4, fill: "#0088FE" }]; export const A = () => <><Pie data={data} dataKey="value" /><Pie data={data} dataKey="value" /><Legend payload={[{ value: "Open", type: "square", color: "tomato" }]} /></>;',
      errors: [
        {
          messageId: "entry",
          data: { tag: "Pie", attribute: "data", key: "fill", value: "#0088FE", from: "" },
        },
        {
          messageId: "entry",
          data: { tag: "Legend", attribute: "payload", key: "color", value: "tomato", from: "" },
        },
      ],
    },
    {
      // A var()'s fallback is the colour wherever the variable is not set, and a concatenation's
      // strings are read.
      code: '<><rect fill="var(--nope, #f00)" /><path stroke={"#0088fe" + alpha} /></>',
      errors: [attribute("rect", "fill", "#f00"), attribute("path", "stroke", "#0088fe")],
    },
    {
      // The kit's own source and its stories are read too.
      code: 'export const Dot = () => <svg><circle r={4} fill="#22c55e" /></svg>;',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [attribute("circle", "fill", "#22c55e")],
    },
    {
      code: 'export const Swatch = () => <svg><rect width={8} height={8} fill="white" /></svg>;',
      filename: STORY,
      settings: KIT_SETTINGS,
      errors: [attribute("rect", "fill", "white")],
    },
  ],
};
