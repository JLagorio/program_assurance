/*
 * The furniture every chart part shares, internal to this folder, one file per concern:
 *
 * - `_types`: the data shapes, the sizes and the table twin's shape.
 * - `_values`: a value's text, the value axis' domain, ticks and width, a change from the point before.
 * - `_time`: the time axis' ticks and labels, in the reader's zone.
 * - `_csv`: the twin as a CSV, and the file's name.
 * - `_labels`: reference and band labels spread in one row, and a category label fitted to its band.
 * - `_tones`: the chart tokens and the grid, axis, cursor and marker furniture.
 * - `_frame-state`: what the Frame shares with its part and what the part reports back.
 * - `_texture`: the patterns a textured series wears.
 * - `_motion`: recharts' animation on the motion tokens, and reduced motion.
 * - `_marks`: ticks, swatches, the zero line, margins and the tooltip.
 * - `_references`: reference lines and bands, and their labels.
 * - `_card`: choosing a mark, and the details card anchored to it.
 * - `_plot`: the plot wrapper, the svg's name and role, the keyboard walk, the skeleton.
 * - `_export`: the plot as an image, and the download.
 *
 * A part imports from here. Nothing here is exported from the package except through the parts
 * and the family's index. The pure ones (`_values`, `_time`, `_csv`, `_labels`) have no runtime
 * imports, so `node --test` runs them (test/chart.test.mjs).
 */

export * from "./_types";
export * from "./_values";
export * from "./_time";
export * from "./_csv";
export * from "./_labels";
export * from "./_tones";
export * from "./_frame-state";
export * from "./_texture";
export * from "./_motion";
export * from "./_marks";
export * from "./_references";
export * from "./_card";
export * from "./_plot";
export * from "./_export";
