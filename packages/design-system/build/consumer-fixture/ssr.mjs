import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  Avatar,
  Combobox,
  Attachment,
  Alert,
  Accordion,
  Collapsible,
  Button,
  IconButton,
  buttonVariants,
  Badge,
  badgeVariants,
  tones,
  Separator,
  Skeleton,
  Kbd,
  KbdGroup,
  Toggle,
  toggleVariants,
  ToggleGroup,
  ToggleGroupItem,
  Switch,
  RadioGroup,
  RadioGroupItem,
  Checkbox,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  Composer,
  TaskRow,
  Item,
  LedgerProvider,
  toast,
} from "@ledger/design-system";
import * as ledger from "@ledger/design-system";
import { cn } from "@ledger/design-system/cn";

for (const name of ["Activity", "Task", "parseMentions"])
  assert.equal(name in ledger, false, name + " must remain application-owned");
assert.equal(typeof Composer, "function");
assert.equal(typeof TaskRow, "function");
assert.equal(typeof toast.promise, "function");
assert.equal(cn("flex", "block"), "block");
for (const defaultOpen of [false, true]) {
  const previewHtml = renderToString(
    createElement(
      HoverCard,
      { defaultOpen, defaultTriggerId: "packed-preview" },
      createElement(
        HoverCardTrigger,
        {
          id: "packed-preview",
          href: "/records/preview",
          rel: "bookmark",
          delay: 0,
          closeDelay: 0,
          className: (state) => (state.open ? "packed-open" : "packed-closed"),
          style: (state) => ({ opacity: state.open ? 1 : 0.8 }),
        },
        "Preview record",
      ),
      createElement(HoverCardContent, { side: "inline-end" }, "Client preview content"),
    ),
  );
  assert.match(previewHtml, /^<a[^>]*data-slot="hover-card-trigger"/);
  assert.match(previewHtml, /href="[/]records[/]preview"/);
  assert.match(previewHtml, /rel="bookmark"/);
  assert.match(previewHtml, new RegExp(defaultOpen ? "packed-open" : "packed-closed"));
  assert.match(previewHtml, new RegExp(defaultOpen ? "opacity:1" : "opacity:0.8"));
  assert.equal(previewHtml.includes('data-popup-open=""'), defaultOpen);
  assert.doesNotMatch(previewHtml, /role="button"| delay=| closeDelay=/);
  // The automatic portal renders on the client, including for an initially open card.
  assert.doesNotMatch(previewHtml, /Client preview content|data-slot="hover-card-content"/);
}
const previewButtonHtml = renderToString(
  createElement(
    HoverCard,
    null,
    createElement(HoverCardTrigger, {
      render: createElement("button", { type: "button", "aria-label": "Preview record" }),
    }),
  ),
);
assert.match(previewButtonHtml, /^<button[^>]*type="button"/);
assert.match(previewButtonHtml, /data-slot="hover-card-trigger"/);
assert.match(previewButtonHtml, /aria-label="Preview record"/);
console.log("Packed HoverCard anchor semantics, trigger state and client portal SSR passed");
for (const defaultOpen of [false, true]) {
  const popoverHtml = renderToString(
    createElement(
      Popover,
      { defaultOpen, defaultTriggerId: "packed-popover", modal: "trap-focus" },
      createElement(
        PopoverTrigger,
        {
          id: "packed-popover",
          name: "filters",
          openOnHover: true,
          delay: 100,
          className: (state) => (state.open ? "packed-open" : "packed-closed"),
        },
        "Filters",
      ),
      createElement(PopoverContent, null, createElement(PopoverClose, null, "Client close")),
    ),
  );
  const trigger = popoverHtml.match(/<button[^>]*>/)?.[0];
  assert.ok(trigger);
  for (const attribute of [
    'type="button"',
    'data-slot="popover-trigger"',
    'aria-haspopup="dialog"',
    'name="filters"',
  ])
    assert.ok(trigger.includes(attribute), attribute);
  assert.ok(trigger.includes('aria-expanded="' + defaultOpen + '"'));
  assert.match(trigger, new RegExp(defaultOpen ? "packed-open" : "packed-closed"));
  assert.doesNotMatch(trigger, / openOnHover=| delay=/);
  assert.doesNotMatch(popoverHtml, /Client close|data-slot="popover-content"/);
}
const popoverPartsHtml = renderToString(
  createElement(
    Popover,
    null,
    createElement(
      PopoverHeader,
      { title: "Filter settings" },
      createElement(PopoverTitle, { id: "filter-title", render: createElement("h3") }, "Filters"),
      createElement(PopoverDescription, { id: "filter-description" }, "Refine records"),
    ),
    createElement(PopoverClose, { name: "action", value: "apply" }, "Apply"),
    createElement(
      PopoverTrigger,
      { nativeButton: false, disabled: true, render: createElement("span") },
      "Unavailable",
    ),
  ),
);
assert.match(popoverPartsHtml, /<div[^>]*data-slot="popover-header"[^>]*title="Filter settings"/);
const popoverTitle = popoverPartsHtml.match(/<h3[^>]*data-slot="popover-title"[^>]*>/)?.[0];
const popoverDescription = popoverPartsHtml.match(
  /<p[^>]*data-slot="popover-description"[^>]*>/,
)?.[0];
assert.ok(popoverTitle);
assert.ok(popoverDescription);
assert.match(popoverTitle, /id="filter-title"/);
assert.match(popoverDescription, /id="filter-description"/);
const popoverClose = popoverPartsHtml.match(/<button[^>]*data-slot="popover-close"[^>]*>/)?.[0];
assert.ok(popoverClose);
assert.match(popoverClose, /type="button"/);
assert.match(popoverClose, /name="action"/);
assert.match(popoverClose, /value="apply"/);
assert.match(
  popoverPartsHtml,
  /<span[^>]*role="button"[^>]*tabindex="-1"[^>]*aria-disabled="true"/,
);
console.log("Packed Popover trigger state, native parts and client portal SSR passed");
const breadcrumbHtml = renderToString(
  createElement(
    Breadcrumb,
    { "aria-label": "Packed breadcrumb" },
    createElement(
      BreadcrumbList,
      null,
      createElement(
        BreadcrumbItem,
        null,
        createElement(
          BreadcrumbLink,
          { render: createElement("a", { href: "/records", "data-consumer-render": "anchor" }) },
          "Records",
        ),
      ),
      createElement(BreadcrumbSeparator, null),
      createElement(
        BreadcrumbItem,
        null,
        createElement(
          "button",
          { "aria-label": "More parent pages" },
          createElement(BreadcrumbEllipsis, null),
        ),
      ),
      createElement(BreadcrumbSeparator, null),
      createElement(BreadcrumbItem, null, createElement(BreadcrumbPage, null, "Packed record")),
    ),
  ),
);
assert.match(breadcrumbHtml, /<nav [^>]*aria-label="Packed breadcrumb"/);
assert.match(breadcrumbHtml, /<ol [^>]*data-slot="breadcrumb-list"/);
assert.match(breadcrumbHtml, /<li [^>]*data-slot="breadcrumb-item"/);
const packedBreadcrumbLink = breadcrumbHtml.match(/<a [^>]*>/)?.[0];
assert.ok(packedBreadcrumbLink);
assert.match(packedBreadcrumbLink, /data-slot="breadcrumb-link"/);
assert.ok(packedBreadcrumbLink.includes('href="/records"'));
assert.match(packedBreadcrumbLink, /data-consumer-render="anchor"/);
assert.match(breadcrumbHtml, />Records<[/]a>/);
const packedBreadcrumbPage = breadcrumbHtml.match(
  /<span [^>]*data-slot="breadcrumb-page"[^>]*>/,
)?.[0];
assert.ok(packedBreadcrumbPage);
assert.match(packedBreadcrumbPage, /role="link"/);
assert.match(packedBreadcrumbPage, /aria-disabled="true"/);
assert.match(packedBreadcrumbPage, /aria-current="page"/);
assert.doesNotMatch(packedBreadcrumbPage, /tabindex=/);
assert.match(breadcrumbHtml, />Packed record<[/]span>/);
for (const slot of ["breadcrumb-separator", "breadcrumb-ellipsis"]) {
  const tag = breadcrumbHtml.match(
    new RegExp('<(?:li|span) [^>]*data-slot="' + slot + '"[^>]*>'),
  )?.[0];
  assert.ok(tag);
  assert.match(tag, /role="presentation"/);
  assert.match(tag, /aria-hidden="true"/);
}
assert.match(breadcrumbHtml, /aria-label="More parent pages"/);
const comboHtml = renderToString(
  createElement(
    Combobox.Root,
    { items: ["React", "Vue"], defaultValue: "React", name: "framework" },
    createElement(Combobox.Input, { "aria-label": "Framework" }),
  ),
);
assert.match(comboHtml, /role="combobox"/);
assert.match(comboHtml, /name="framework"/);
assert.match(comboHtml, /value="React"/);
const avatarHtml = renderToString(
  createElement(
    Avatar.Stack,
    { "aria-label": "Packed reviewers" },
    createElement(
      Avatar,
      { name: "Dana Whitlock", size: "medium", "aria-label": "Dana Whitlock, online" },
      createElement(Avatar.Image, { src: "/dana.png" }),
      createElement(Avatar.Fallback, null),
      createElement(Avatar.Badge, { tone: "success" }),
    ),
    createElement(Avatar.Count, null, "+2"),
  ),
);
assert.match(avatarHtml, /role="group"/);
assert.match(avatarHtml, /data-slot="avatar-fallback"/);
assert.match(avatarHtml, />DW</);
assert.doesNotMatch(avatarHtml, /<img/);
assert.match(avatarHtml, /data-slot="avatar-count"/);
assert.match(avatarHtml, /data-slot="avatar-badge"/);
assert.match(avatarHtml, /data-tone="success"/);
const attachmentHtml = renderToString(
  createElement(
    Attachment,
    { state: "uploading" },
    createElement(
      Attachment.Content,
      null,
      createElement(Attachment.Title, null, "packed-file.pdf"),
    ),
    createElement(Attachment.Trigger, { "aria-label": "Preview packed file" }),
  ),
);
assert.match(attachmentHtml, /aria-busy="true"/);
assert.match(attachmentHtml, /packed-file.pdf/);
assert.match(attachmentHtml, /data-slot="attachment-trigger"/);
const html = renderToString(
  createElement(
    LedgerProvider,
    { locale: "en-US" },
    createElement(
      "div",
      null,
      createElement(
        Alert,
        { role: "note", "aria-labelledby": "packed-alert-title" },
        createElement(Alert.Title, { id: "packed-alert-title" }, "Packed callout"),
        createElement(Alert.Description, null, "Packed description"),
        createElement(Alert.Action, null, createElement(Button, null, "Review")),
      ),
      createElement(
        Accordion,
        { type: "single", defaultValue: "stable" },
        createElement(
          Accordion.Item,
          { value: "stable" },
          createElement(
            Accordion.Header,
            null,
            createElement(Accordion.Trigger, null, "Packed accordion"),
          ),
          createElement(Accordion.Content, null, "Packed panel"),
        ),
      ),
      createElement(
        Collapsible,
        { defaultOpen: true },
        createElement(Collapsible.Trigger, null, "Packed disclosure"),
        createElement(Collapsible.Content, null, "Packed detail"),
      ),
      createElement(Button, null, "Save"),
      createElement(Composer, { label: "Message", onSubmit: () => {} }),
      createElement(Item.Group, null, createElement(TaskRow, { title: "Review draft" })),
    ),
  ),
);
assert.match(html, /<button/);
assert.match(html, /Save/);
assert.match(html, /<textarea/);
assert.match(html, /Review draft/);
assert.match(html, /Packed callout/);
assert.match(html, /data-slot="alert-action"/);
assert.match(html, /Packed accordion/);
assert.match(html, /Packed panel/);
assert.match(html, /Packed disclosure/);
console.log("Packed ESM import and SSR passed");

const mixedCheckboxHtml = renderToString(
  createElement(Checkbox, {
    id: "packed-checkbox",
    name: "selection",
    form: "preferences",
    value: "yes",
    checked: false,
    indeterminate: true,
    required: true,
    readOnly: true,
    className: (state) => (state.indeterminate ? "packed-mixed" : "packed-binary"),
    style: (state) => ({ opacity: state.readOnly ? 0.8 : 1 }),
  }),
);
const checkboxRoot = mixedCheckboxHtml.match(/^<span[^>]*>/)?.[0];
const checkboxInput = mixedCheckboxHtml.match(/<input[^>]*>/)?.[0];
assert.ok(checkboxRoot);
assert.ok(checkboxInput);
for (const attribute of [
  'role="checkbox"',
  'aria-checked="mixed"',
  'aria-readonly="true"',
  'data-indeterminate=""',
])
  assert.ok(checkboxRoot.includes(attribute), attribute);
assert.match(checkboxRoot, /packed-mixed/);
assert.match(checkboxRoot, /opacity:0.8/);
assert.doesNotMatch(checkboxRoot, /id="packed-checkbox"|data-checked=|data-unchecked=/);
for (const attribute of [
  'id="packed-checkbox"',
  'type="checkbox"',
  'name="selection"',
  'form="preferences"',
  'value="yes"',
  'required=""',
])
  assert.ok(checkboxInput.includes(attribute), attribute);
assert.doesNotMatch(checkboxInput, / checked=""/);
assert.match(mixedCheckboxHtml, /data-slot="checkbox-indicator"/);
assert.match(mixedCheckboxHtml, /lucide-minus/);
assert.match(mixedCheckboxHtml, /<[/]span><input/);
const nativeCheckboxHtml = renderToString(
  createElement(Checkbox, {
    id: "native-checkbox",
    nativeButton: true,
    render: createElement("button"),
    defaultChecked: true,
  }),
);
assert.match(nativeCheckboxHtml, /^<button[^>]*id="native-checkbox"/);
assert.match(nativeCheckboxHtml, /type="button"/);
assert.match(nativeCheckboxHtml, /lucide-check/);
assert.match(nativeCheckboxHtml, /<[/]button><input/);
assert.doesNotMatch(nativeCheckboxHtml.match(/<input[^>]*>/)?.[0] ?? "", /id="native-checkbox"/);
const uncheckedCheckboxHtml = renderToString(
  createElement(Checkbox, { name: "selection", uncheckedValue: "no", disabled: true }),
);
const uncheckedInputs = uncheckedCheckboxHtml.match(/<input[^>]*>/g);
assert.equal(uncheckedInputs?.length, 2);
assert.match(uncheckedInputs[0], /type="hidden"/);
assert.match(uncheckedInputs[0], /value="no"/);
for (const input of uncheckedInputs) assert.match(input, / disabled=""/);
assert.doesNotMatch(uncheckedCheckboxHtml, /data-slot="checkbox-indicator"/);
console.log("Packed Checkbox mixed state, indicator, native input and form attributes SSR passed");

const switchHtml = renderToString(
  createElement(Switch, {
    id: "packed-switch",
    name: "updates",
    form: "preferences",
    value: "yes",
    defaultChecked: true,
    required: true,
    readOnly: true,
    size: "sm",
    className: (state) => (state.checked ? "packed-checked" : "packed-unchecked"),
    style: (state) => ({ opacity: state.readOnly ? 0.8 : 1 }),
  }),
);
const switchRoot = switchHtml.match(/^<span[^>]*>/)?.[0];
const switchInput = switchHtml.match(/<input[^>]*>/)?.[0];
assert.ok(switchRoot);
assert.ok(switchInput);
for (const attribute of [
  'role="switch"',
  'aria-checked="true"',
  'aria-readonly="true"',
  'aria-required="true"',
  'data-size="sm"',
])
  assert.ok(switchRoot.includes(attribute), attribute);
assert.match(switchRoot, /packed-checked/);
assert.match(switchRoot, /opacity:0.8/);
assert.doesNotMatch(switchRoot, /id="packed-switch"/);
for (const attribute of [
  'id="packed-switch"',
  'type="checkbox"',
  'name="updates"',
  'form="preferences"',
  'value="yes"',
  'required=""',
  'checked=""',
])
  assert.ok(switchInput.includes(attribute), attribute);
assert.equal(switchHtml.match(/data-slot="switch-thumb"/g)?.length, 1);
assert.match(switchHtml, /<[/]span><input/);
const disabledSwitchHtml = renderToString(
  createElement(Switch, { name: "updates", uncheckedValue: "no", disabled: true }),
);
const disabledSwitchInputs = disabledSwitchHtml.match(/<input[^>]*>/g);
assert.equal(disabledSwitchInputs?.length, 2);
assert.match(disabledSwitchInputs[0], /type="hidden"/);
assert.match(disabledSwitchInputs[0], /value="no"/);
for (const input of disabledSwitchInputs) assert.match(input, / disabled=""/);
const nativeSwitchHtml = renderToString(
  createElement(Switch, {
    id: "native-switch",
    nativeButton: true,
    render: createElement("button"),
  }),
);
assert.match(nativeSwitchHtml, /^<button[^>]*id="native-switch"/);
assert.match(nativeSwitchHtml, /type="button"/);
assert.match(nativeSwitchHtml, /<[/]button><input/);
assert.doesNotMatch(nativeSwitchHtml.match(/<input[^>]*>/)?.[0] ?? "", /id="native-switch"/);
console.log("Packed Switch hidden input, form attributes, states and native-button SSR passed");

const radioHtml = renderToString(
  createElement(
    RadioGroup,
    {
      id: "packed-radios",
      defaultValue: 2,
      name: "priority",
      form: "preferences",
      required: true,
      readOnly: true,
      "aria-label": "Priority",
      className: (state) => (state.readOnly ? "packed-readonly" : "packed-editable"),
      style: (state) => ({ padding: state.required ? 4 : 0 }),
    },
    createElement(RadioGroupItem, { value: 1, id: "radio-one", "aria-label": "Normal" }),
    createElement(RadioGroupItem, {
      value: 2,
      id: "radio-two",
      "aria-label": "Urgent",
      nativeButton: true,
      render: createElement("button"),
    }),
  ),
);
assert.match(radioHtml, /^<div[^>]*id="packed-radios"/);
assert.match(radioHtml, /role="radiogroup"/);
assert.match(radioHtml, /aria-readonly="true"/);
assert.match(radioHtml, /packed-readonly/);
assert.match(radioHtml, /padding:4px/);
assert.match(radioHtml, /<span[^>]*role="radio"/);
assert.match(radioHtml, /<button[^>]*id="radio-two"/);
assert.equal(radioHtml.match(/data-slot="radio-group-indicator"/g)?.length, 1);
const radioInputs = radioHtml.match(/<input[^>]*>/g);
assert.equal(radioInputs?.length, 2);
for (const input of radioInputs) {
  for (const attribute of ['type="radio"', 'name="priority"', 'form="preferences"', 'required=""'])
    assert.ok(input.includes(attribute), attribute);
  assert.match(input, / readonly=""/i);
}
assert.match(radioInputs[0], /id="radio-one"/);
assert.match(radioInputs[0], /value="1"/);
assert.doesNotMatch(radioInputs[0], / checked=""/);
assert.match(radioInputs[1], /value="2"/);
assert.match(radioInputs[1], / checked=""/);
assert.doesNotMatch(radioInputs[1], /id="radio-two"/);
const disabledRadioHtml = renderToString(
  createElement(RadioGroup, { disabled: true }, createElement(RadioGroupItem, { value: "normal" })),
);
assert.match(disabledRadioHtml, /<input[^>]* disabled=""/);
console.log(
  "Packed RadioGroup numeric values, form inputs, selection and native-button SSR passed",
);

const toggleHtml = renderToString(
  createElement(
    Toggle,
    {
      defaultPressed: true,
      variant: "outline",
      size: "sm",
      id: "packed-toggle",
      title: "Bold formatting",
      className: (state) => (state.pressed ? "packed-pressed" : "packed-unpressed"),
      style: (state) => ({ opacity: state.disabled ? 0.5 : 1 }),
      render: (props, state) =>
        createElement("button", { ...props, "data-consumer-pressed": String(state.pressed) }),
    },
    createElement("svg", { "aria-hidden": true, "data-consumer-icon": "bold" }),
    "Bold",
  ),
);
for (const attribute of [
  'type="button"',
  'data-slot="toggle"',
  'id="packed-toggle"',
  'title="Bold formatting"',
  'aria-pressed="true"',
  'data-pressed=""',
  'data-consumer-pressed="true"',
  'data-consumer-icon="bold"',
])
  assert.ok(toggleHtml.includes(attribute), attribute);
assert.match(toggleHtml, /packed-pressed/);
assert.match(toggleHtml, /opacity:1/);
assert.doesNotMatch(toggleHtml, / (?:variant|size|pressed|defaultPressed)=|data-state=/i);
assert.equal(typeof toggleVariants({ variant: "outline", size: "lg" }), "string");

for (const defaultValue of [[], ["table"]]) {
  const singleGroupHtml = renderToString(
    createElement(
      ToggleGroup,
      { defaultValue, "aria-label": "View", dir: "rtl" },
      createElement(ToggleGroupItem, { value: "table" }, "Table"),
      createElement(ToggleGroupItem, { value: "board", disabled: true }, "Board"),
    ),
  );
  assert.match(singleGroupHtml, /role="group"/);
  assert.match(singleGroupHtml, /data-slot="toggle-group"/);
  assert.match(singleGroupHtml, /data-orientation="horizontal"/);
  assert.match(singleGroupHtml, /data-spacing="2"/);
  assert.match(singleGroupHtml, /dir="rtl"/);
  assert.equal(singleGroupHtml.match(/data-slot="toggle-group-item"/g)?.length, 2);
  assert.equal(singleGroupHtml.match(/aria-pressed="true"/g)?.length ?? 0, defaultValue.length);
  assert.equal(singleGroupHtml.match(/ disabled=""/g)?.length, 1);
  assert.doesNotMatch(singleGroupHtml, /role="radio"|aria-checked=|data-state=/);
}
const multipleGroupHtml = renderToString(
  createElement(
    ToggleGroup,
    {
      defaultValue: ["bold", "italic"],
      multiple: true,
      disabled: true,
      variant: "outline",
      size: "lg",
      spacing: 0,
      orientation: "vertical",
      "aria-label": "Formatting",
      className: (state) => (state.multiple ? "packed-multiple" : "packed-single"),
      style: (state) => ({ padding: state.orientation === "vertical" ? 4 : 0 }),
      render: (props, state) =>
        createElement("div", { ...props, "data-consumer-orientation": state.orientation }),
    },
    createElement(ToggleGroupItem, { value: "bold" }, "Bold"),
    createElement(ToggleGroupItem, { value: "italic" }, "Italic"),
  ),
);
assert.match(multipleGroupHtml, /data-multiple=""/);
assert.match(multipleGroupHtml, /data-consumer-orientation="vertical"/);
assert.match(multipleGroupHtml, /data-orientation="vertical"/);
assert.match(multipleGroupHtml, /data-spacing="0"/);
assert.match(multipleGroupHtml, /packed-multiple/);
assert.match(multipleGroupHtml, /padding:4px/);
assert.equal(multipleGroupHtml.match(/aria-pressed="true"/g)?.length, 2);
assert.equal(multipleGroupHtml.match(/ disabled=""/g)?.length, 2);
for (const item of multipleGroupHtml.match(/<button[^>]*>/g) ?? []) {
  assert.match(item, /data-variant="outline"/);
  assert.match(item, /data-size="lg"/);
}
assert.doesNotMatch(multipleGroupHtml, / (?:multiple|spacing|orientation|variant|size)=/);
const renderedGroupHtml = renderToString(
  createElement(ToggleGroup, {
    variant: "outline",
    size: "lg",
    spacing: 0,
    orientation: "vertical",
    render: createElement("div", null, createElement(ToggleGroupItem, { value: "bold" }, "Bold")),
  }),
);
const renderedGroupItem = renderedGroupHtml.match(/<button[^>]*>/)?.[0];
assert.ok(renderedGroupItem);
for (const attribute of ['data-variant="outline"', 'data-size="lg"', 'data-spacing="0"'])
  assert.ok(renderedGroupItem.includes(attribute), attribute);
assert.match(renderedGroupItem, /first:rounded-t-medium/);
assert.match(renderedGroupItem, /last:rounded-b-medium/);
assert.match(renderedGroupItem, /border-t-0/);
console.log("Packed Toggle states and compound ToggleGroup array selection SSR passed");

const defaultButtonHtml = renderToString(createElement(Button, null, "Save record"));
assert.match(defaultButtonHtml, /^<button /);
assert.match(defaultButtonHtml, /type="button"/);
assert.match(defaultButtonHtml, /data-slot="button"/);
assert.match(defaultButtonHtml, /bg-surface-raised/);
assert.match(defaultButtonHtml, /h-control-medium/);
assert.doesNotMatch(defaultButtonHtml, / disabled=|aria-busy="true"/);
const submitButtonHtml = renderToString(
  createElement(
    Button,
    {
      variant: "primary",
      size: "small",
      type: "submit",
      name: "intent",
      value: "save",
      form: "packed-form",
      formAction: "/save",
      isSelected: true,
      isFullWidth: true,
      iconBefore: createElement("svg", { "data-consumer-icon": "before" }),
      iconAfter: createElement("svg", { "data-consumer-icon": "after" }),
    },
    "Submit record",
  ),
);
for (const attribute of [
  'type="submit"',
  'name="intent"',
  'value="save"',
  'form="packed-form"',
  'aria-pressed="true"',
  'data-consumer-icon="before"',
  'data-consumer-icon="after"',
])
  assert.ok(submitButtonHtml.includes(attribute), attribute);
assert.match(submitButtonHtml, /formaction="[/]save"/i);
assert.match(submitButtonHtml, /w-full/);
assert.equal(submitButtonHtml.match(/Submit record/g)?.length, 1);
assert.doesNotMatch(
  submitButtonHtml,
  / (?:variant|size|isSelected|isFullWidth|iconBefore|iconAfter)=/i,
);

const loadingButtonHtml = renderToString(
  createElement(
    Button,
    {
      isLoading: true,
      className: (state) => (state.disabled ? "packed-blocked" : "packed-enabled"),
      style: (state) => ({ opacity: state.disabled ? 0.8 : 1 }),
      render: (props, state) =>
        createElement("button", { ...props, "data-consumer-disabled": String(state.disabled) }),
    },
    "Saving record",
  ),
);
for (const attribute of [
  'type="button"',
  'aria-busy="true"',
  'aria-disabled="true"',
  'data-loading=""',
  'data-consumer-disabled="true"',
  'tabindex="0"',
])
  assert.ok(loadingButtonHtml.includes(attribute), attribute);
assert.match(loadingButtonHtml, /packed-blocked/);
assert.match(loadingButtonHtml, /opacity:0.8/);
assert.doesNotMatch(loadingButtonHtml, / disabled=| isLoading=| focusableWhenDisabled=/i);
assert.equal(loadingButtonHtml.match(/Saving record/g)?.length, 1);
for (const isLoading of [false, true]) {
  const disabledButtonHtml = renderToString(
    createElement(Button, { disabled: true, isLoading }, "Unavailable"),
  );
  assert.match(disabledButtonHtml, / disabled=""/);
}
const customButtonHtml = renderToString(
  createElement(
    Button,
    {
      nativeButton: false,
      id: "packed-custom-action",
      render: createElement("div", { title: "Custom action", "data-consumer-render": "div" }),
    },
    "Run action",
  ),
);
assert.match(customButtonHtml, /^<div /);
assert.match(customButtonHtml, /role="button"/);
assert.match(customButtonHtml, /id="packed-custom-action"/);
assert.match(customButtonHtml, /data-consumer-render="div"/);
assert.match(customButtonHtml, /title="Custom action"/);
assert.doesNotMatch(customButtonHtml, / type=| nativeButton=/i);

const buttonLinkHtml = renderToString(
  createElement(
    "a",
    {
      href: "/records",
      className: buttonVariants({ variant: "secondary", size: "xsmall", className: "packed-link" }),
    },
    "Records",
  ),
);
assert.match(buttonLinkHtml, /^<a /);
assert.match(buttonLinkHtml, /href="[/]records"/);
assert.match(buttonLinkHtml, /h-control-xsmall/);
assert.match(buttonLinkHtml, /packed-link/);
assert.doesNotMatch(buttonLinkHtml, / role=| type=| tabindex=|aria-disabled=|data-slot=/);

for (const isLoading of [false, true]) {
  const iconButtonHtml = renderToString(
    createElement(IconButton, {
      label: "Add record",
      icon: createElement("svg", { "data-consumer-icon": "add" }),
      variant: "subtle",
      size: "small",
      isTooltipDisabled: true,
      isLoading,
      title: "Create record",
    }),
  );
  assert.match(iconButtonHtml, /^<button /);
  assert.match(iconButtonHtml, /type="button"/);
  assert.match(iconButtonHtml, /aria-label="Add record"/);
  assert.match(iconButtonHtml, /title="Create record"/);
  assert.doesNotMatch(iconButtonHtml, / (?:label|icon|variant|size|isTooltipDisabled|isLoading)=/i);
  if (isLoading) {
    assert.match(iconButtonHtml, /aria-busy="true"/);
    assert.doesNotMatch(iconButtonHtml, /data-consumer-icon="add"/);
  } else {
    assert.match(iconButtonHtml, /data-consumer-icon="add"/);
  }
}
console.log(
  "Packed Button actions, loading, native forms, IconButton labels and navigation recipe SSR passed",
);

for (const variant of ["default", "secondary", "destructive", "outline", "ghost", "link"]) {
  const badgeHtml = renderToString(createElement(Badge, { variant, title: variant }, variant));
  assert.match(badgeHtml, /<span /);
  assert.ok(badgeHtml.includes('data-slot="badge"'));
  assert.ok(badgeHtml.includes('data-variant="' + variant + '"'));
  assert.equal(typeof badgeVariants({ variant }), "string");
}
const defaultBadgeHtml = renderToString(createElement(Badge, null, "Brand"));
assert.match(defaultBadgeHtml, /data-variant="default"/);
assert.match(defaultBadgeHtml, /bg-brand-bold/);
const badgeLinkHtml = renderToString(
  createElement(
    Badge,
    {
      variant: "outline",
      id: "packed-badge",
      style: { paddingInline: "var(--ds-space-100)" },
      render: createElement("a", {
        href: "/records",
        "data-consumer-render": "anchor",
        style: { color: "var(--ds-color-text-brand)" },
      }),
    },
    createElement("svg", { "data-icon": "inline-start", "aria-hidden": true }),
    "Open record",
  ),
);
const packedBadgeLink = badgeLinkHtml.match(/<a [^>]*>/)?.[0];
assert.ok(packedBadgeLink);
for (const attribute of [
  'href="/records"',
  'data-slot="badge"',
  'data-variant="outline"',
  'id="packed-badge"',
  'data-consumer-render="anchor"',
])
  assert.ok(packedBadgeLink.includes(attribute), attribute);
assert.match(packedBadgeLink, /padding-inline:/);
assert.match(packedBadgeLink, /color:/);
assert.match(badgeLinkHtml, /data-icon="inline-start"/);
assert.match(badgeLinkHtml, /Open record/);
for (const tone of tones) {
  for (const appearance of ["subtle", "bold"]) {
    const statusHtml = renderToString(
      createElement(
        Badge,
        {
          variant: "secondary",
          tone,
          appearance,
          size: "xsmall",
          icon: createElement("svg", { "aria-hidden": true }),
        },
        "Status",
      ),
    );
    assert.match(statusHtml, /<span /);
    assert.match(statusHtml, /data-slot="badge"/);
    assert.ok(statusHtml.includes('data-tone="' + tone + '"'));
    assert.match(statusHtml, /rounded-full/);
    assert.match(statusHtml, /h-200/);
    assert.ok(statusHtml.includes("bg-" + tone + (appearance === "bold" ? "-bold" : "")));
    assert.doesNotMatch(statusHtml, / (?:tone|appearance|size|icon)=/);
  }
}
const renderedContent = renderToString(
  createElement(Badge, {
    variant: "secondary",
    tone: "success",
    icon: createElement("svg", { "aria-hidden": true }),
    render: createElement("a", { href: "/review" }, "Review status"),
  }),
);
assert.match(renderedContent, /Review status/);
assert.match(renderedContent, /data-icon="inline-start"/);
assert.ok(renderedContent.includes('href="/review"'));
for (const icon of [undefined, false, true]) {
  const content = renderToString(
    createElement(Badge, {
      icon,
      render: createElement("a", { href: "/review" }, "Rendered label"),
    }),
  );
  assert.match(content, /Rendered label/);
}
const neutralStatusHtml = renderToString(
  createElement(Badge, { variant: "secondary", tone: "neutral" }, "Category"),
);
assert.match(neutralStatusHtml, /bg-neutral/);
assert.doesNotMatch(neutralStatusHtml, /bg-brand-bold/);
console.log("Packed Badge variants, native/render composition and semantic Badge SSR passed");

const separatorHtml = renderToString(
  createElement(Separator, { id: "packed-separator", lang: "en" }),
);
assert.match(separatorHtml, /^<div /);
for (const attribute of [
  'id="packed-separator"',
  'lang="en"',
  'data-slot="separator"',
  'data-orientation="horizontal"',
  'role="separator"',
  'aria-orientation="horizontal"',
])
  assert.ok(separatorHtml.includes(attribute), attribute);
assert.doesNotMatch(separatorHtml, /tabindex=/);
const renderedSeparatorHtml = renderToString(
  createElement(Separator, {
    orientation: "vertical",
    className: (state) =>
      state.orientation === "vertical" ? "packed-vertical" : "packed-horizontal",
    style: (state) => ({
      marginInline: state.orientation === "vertical" ? "var(--ds-space-100)" : "0px",
    }),
    render: createElement("span", {
      className: "packed-rendered",
      style: { opacity: 0.5 },
      "data-consumer-render": "element",
    }),
  }),
);
assert.match(renderedSeparatorHtml, /^<span /);
for (const attribute of [
  'data-slot="separator"',
  'data-orientation="vertical"',
  'aria-orientation="vertical"',
  'data-consumer-render="element"',
])
  assert.ok(renderedSeparatorHtml.includes(attribute), attribute);
assert.match(renderedSeparatorHtml, /packed-vertical/);
assert.match(renderedSeparatorHtml, /packed-rendered/);
assert.ok(renderedSeparatorHtml.includes("margin-inline:var(--ds-space-100)"));
assert.ok(renderedSeparatorHtml.includes("opacity:0.5"));
const callbackSeparatorHtml = renderToString(
  createElement(Separator, {
    orientation: "vertical",
    render: (props, state) =>
      createElement("span", { ...props, "data-consumer-orientation": state.orientation }),
  }),
);
assert.match(callbackSeparatorHtml, /^<span /);
assert.match(callbackSeparatorHtml, /data-slot="separator"/);
assert.match(callbackSeparatorHtml, /data-consumer-orientation="vertical"/);
const decorativeSeparatorHtml = renderToString(createElement(Separator, { isDecorative: true }));
assert.match(decorativeSeparatorHtml, /role="(?:none|presentation)"/);
assert.match(decorativeSeparatorHtml, /aria-hidden="true"/);
assert.doesNotMatch(decorativeSeparatorHtml, /aria-orientation=/);
assert.doesNotMatch(decorativeSeparatorHtml, / (?:isDecorative|isdecorative|orientation)=/);
const explicitSeparatorHtml = renderToString(
  createElement(Separator, {
    isDecorative: true,
    role: "separator",
    "aria-hidden": false,
    "aria-orientation": "vertical",
  }),
);
assert.match(explicitSeparatorHtml, /role="separator"/);
assert.match(explicitSeparatorHtml, /aria-hidden="false"/);
assert.match(explicitSeparatorHtml, /aria-orientation="vertical"/);
console.log("Packed Separator semantics, state callbacks and render composition SSR passed");

const skeletonHtml = renderToString(createElement(Skeleton, { id: "packed-skeleton", lang: "en" }));
assert.match(skeletonHtml, /^<div /);
for (const attribute of [
  'id="packed-skeleton"',
  'lang="en"',
  'data-slot="skeleton"',
  'aria-hidden="true"',
])
  assert.ok(skeletonHtml.includes(attribute), attribute);
assert.match(skeletonHtml, /bg-skeleton/);
assert.doesNotMatch(skeletonHtml, / (?:shape|lines|width|height)=/);
const circleSkeletonHtml = renderToString(
  createElement(
    Skeleton,
    { shape: "circle", width: 24, style: { width: 40 }, "aria-hidden": false },
    "Circle placeholder",
  ),
);
assert.ok(circleSkeletonHtml.includes("width:40px"));
assert.ok(circleSkeletonHtml.includes("height:24px"));
assert.match(circleSkeletonHtml, /aria-hidden="false"/);
assert.match(circleSkeletonHtml, /Circle placeholder/);
const blockSkeletonHtml = renderToString(
  createElement(Skeleton, { shape: "block", width: "50%", height: "4rem" }),
);
assert.ok(blockSkeletonHtml.includes("width:50%"));
assert.ok(blockSkeletonHtml.includes("height:4rem"));
const multilineSkeletonHtml = renderToString(
  createElement(Skeleton, {
    lines: 3,
    width: 120,
    height: 8,
    id: "packed-skeleton-lines",
    title: "Loading record",
    className: "packed-wrapper",
    style: { width: 240, padding: 4 },
    "aria-hidden": false,
  }),
);
const skeletonDivs = multilineSkeletonHtml.match(/<div[^>]*>/g);
assert.equal(skeletonDivs?.length, 4);
const [skeletonWrapper, ...skeletonRows] = skeletonDivs;
for (const attribute of [
  'id="packed-skeleton-lines"',
  'title="Loading record"',
  'data-slot="skeleton"',
  'aria-hidden="false"',
])
  assert.ok(skeletonWrapper.includes(attribute), attribute);
assert.match(skeletonWrapper, /packed-wrapper/);
assert.ok(skeletonWrapper.includes("width:240px"));
assert.ok(skeletonWrapper.includes("padding:4px"));
assert.doesNotMatch(skeletonWrapper, /height:8px/);
for (const row of skeletonRows) {
  assert.ok(row.includes("width:120px"));
  assert.ok(row.includes("height:8px"));
  assert.match(row, /bg-skeleton/);
  assert.doesNotMatch(row, / id=| title=|packed-wrapper|padding:/);
}
const nativeSkeletonHtml = renderToString(
  createElement(Skeleton, { lines: 3 }, createElement("span", null, "Loading hint")),
);
assert.equal(nativeSkeletonHtml.match(/<div[^>]*>/g)?.length, 1);
assert.equal(nativeSkeletonHtml.match(/Loading hint/g)?.length, 1);
const emptySkeletonHtml = renderToString(createElement(Skeleton, { lines: 3, children: null }));
assert.equal(emptySkeletonHtml.match(/<div[^>]*>/g)?.length, 1);
const htmlSkeleton = renderToString(
  createElement(Skeleton, {
    lines: 3,
    dangerouslySetInnerHTML: { __html: "<span>Loading HTML</span>" },
  }),
);
assert.equal(htmlSkeleton.match(/<div[^>]*>/g)?.length, 1);
assert.match(htmlSkeleton, /<span>Loading HTML<[/]span>/);
console.log("Packed Skeleton native props, children, shape dimensions and multiline SSR passed");

assert.equal(Kbd.Group, KbdGroup, "Kbd.Group remains the exact exported group component");
const keyHtml = renderToString(
  createElement(
    Kbd,
    {
      label: "Command",
      id: "packed-key",
      title: "Shortcut modifier",
      lang: "en",
      dir: "ltr",
      className: "packed-key",
      style: { verticalAlign: "middle" },
    },
    "⌘",
  ),
);
assert.match(keyHtml, /^<kbd /);
for (const attribute of [
  'data-slot="kbd"',
  'id="packed-key"',
  'title="Shortcut modifier"',
  'lang="en"',
  'dir="ltr"',
  'aria-label="Command"',
])
  assert.ok(keyHtml.includes(attribute), attribute);
assert.ok(keyHtml.includes("vertical-align:middle"));
assert.doesNotMatch(keyHtml, / label=|tabindex=/);
assert.match(keyHtml, /⌘/);
const explicitKeyHtml = renderToString(
  createElement(Kbd, { label: "Command", "aria-label": "Meta key" }, "⌘"),
);
assert.match(explicitKeyHtml, /aria-label="Meta key"/);
assert.doesNotMatch(explicitKeyHtml, /aria-label="Command"/);
const chordHtml = renderToString(
  createElement(
    KbdGroup,
    { id: "packed-chord", "aria-label": "Command K", style: { verticalAlign: "middle" } },
    createElement(Kbd, { label: "Command" }, "⌘"),
    createElement(Kbd, null, "K"),
  ),
);
const chordRoot = chordHtml.match(/^<kbd[^>]*>/)?.[0];
assert.ok(chordRoot);
for (const attribute of ['data-slot="kbd-group"', 'id="packed-chord"', 'aria-label="Command K"'])
  assert.ok(chordRoot.includes(attribute), attribute);
assert.ok(chordRoot.includes("vertical-align:middle"));
assert.equal(chordHtml.match(/data-slot="kbd"/g)?.length, 2);
assert.equal(chordHtml.match(/id="packed-chord"/g)?.length, 1);
console.log("Packed Kbd native targets, labels and group compatibility SSR passed");

// Tooltip state stays separate from native trigger semantics; content portals are client-only.
const tooltipHtml = renderToString(
  createElement(
    TooltipProvider,
    { delay: 0, timeout: 300 },
    createElement(
      Tooltip,
      { defaultOpen: true },
      createElement(
        TooltipTrigger,
        {
          id: "review-action",
          delay: 20,
          closeDelay: 30,
          closeOnClick: false,
          disabled: true,
          "aria-label": "Review",
        },
        "Review",
      ),
      createElement(TooltipContent, null, "Review the selected record"),
    ),
  ),
);
assert.match(tooltipHtml, /<button[^>]*type="button"/);
assert.match(tooltipHtml, /data-trigger-disabled=""/);
assert.doesNotMatch(tooltipHtml, /<button[^>]* disabled=/);
assert.doesNotMatch(tooltipHtml, /(?:delay|closeDelay|closeOnClick)=/);
assert.doesNotMatch(tooltipHtml, /Review the selected record/);
const tooltipAnchorHtml = renderToString(
  createElement(
    Tooltip,
    null,
    createElement(
      TooltipTrigger,
      { render: createElement("a", { href: "/records", "data-native": "link" }) },
      "Records",
    ),
    createElement(TooltipContent, null, "Review records"),
  ),
);
assert.match(tooltipAnchorHtml, /<a[^>]*href="\/records"/);
assert.doesNotMatch(tooltipAnchorHtml, /role="button"|type="button"|tabindex="0"/);
const tooltipDisabledButtonHtml = renderToString(
  createElement(
    Tooltip,
    null,
    createElement(
      TooltipTrigger,
      { render: createElement("button", { disabled: true, type: "button" }) },
      "Unavailable",
    ),
  ),
);
assert.match(tooltipDisabledButtonHtml, /<button[^>]*disabled=""/);

const menuSsr = renderToString(
  createElement(
    DropdownMenu,
    { defaultOpen: true },
    createElement(DropdownMenuTrigger, { id: "packed-menu", disabled: true }, "Actions"),
    createElement(
      DropdownMenuContent,
      null,
      createElement(DropdownMenuItem, null, "Archive record"),
    ),
  ),
);
assert.match(menuSsr, /<button[^>]*type="button"/);
assert.match(menuSsr, /aria-haspopup="menu"/);
assert.match(menuSsr, /disabled=""/);
assert.doesNotMatch(menuSsr, /Archive record/);
console.log("Packed DropdownMenu native trigger, disabled state and client-only portal SSR passed");
