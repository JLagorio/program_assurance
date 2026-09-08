import { createRef } from "react";

import { Toggle, ToggleGroup, ToggleGroupItem, toggleVariants } from "../src/index";

const button = createRef<HTMLButtonElement>();
const group = createRef<HTMLDivElement>();

<Toggle
  ref={button}
  variant="outline"
  size="sm"
  defaultPressed
  aria-label="Bold"
  render={(props, state) => <button {...props} data-pressed-state={state.pressed} />}
  className={(state) => (state.pressed ? "font-bold" : "font-normal")}
  style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
  onClick={(event) => {
    const target: HTMLButtonElement = event.currentTarget;
    target.focus();
    event.preventBaseUIHandler();
  }}
  onPressedChange={(pressed, details) => {
    const next: boolean = pressed;
    const event: Event = details.event;
    if (!next && event.defaultPrevented) details.cancel();
  }}
>
  <svg aria-hidden />
</Toggle>;

<Toggle nativeButton={false} render={<div ref={group} />} aria-label="Custom toggle" />;

type Format = "bold" | "italic";
const selected: readonly Format[] = ["bold"];
<ToggleGroup<Format>
  ref={group}
  value={selected}
  multiple
  variant="outline"
  size="lg"
  spacing={0}
  orientation="vertical"
  loopFocus={false}
  disabled
  aria-label="Formatting"
  render={(props, state) => <div {...props} data-multiple-state={state.multiple} />}
  className={(state) => (state.disabled ? "opacity-50" : "opacity-100")}
  style={(state) => ({ padding: state.orientation === "vertical" ? 4 : 0 })}
  onValueChange={(values, details) => {
    const next: Format[] = values;
    if (next.length === 0) details.cancel();
  }}
>
  <ToggleGroupItem
    ref={button}
    value="bold"
    render={<button title="Bold formatting" />}
    className={(state) => (state.pressed ? "font-bold" : "font-normal")}
    style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
    onPressedChange={(pressed, details) => {
      if (!pressed) details.cancel();
    }}
  >
    Bold
  </ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>;

<ToggleGroup defaultValue={["bold"]}>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
</ToggleGroup>;

const classes: string = toggleVariants({ variant: "outline", size: "default" });
void classes;

// @ts-expect-error Single and multiple selection both use arrays.
<ToggleGroup value="bold" />;
// @ts-expect-error Generic selection values remain within the declared value type.
<ToggleGroup<Format> value={["strikethrough"]} />;
// @ts-expect-error Composition uses ToggleGroupItem children, not the retired item model.
<ToggleGroup items={[{ value: "bold", label: "Bold" }]} />;
// @ts-expect-error Icons are native children, not a separate shortcut prop.
<Toggle icon={<svg />} />;
// @ts-expect-error Toggle uses the reference size vocabulary.
<Toggle size="small" />;
