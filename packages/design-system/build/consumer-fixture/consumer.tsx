import { createRef, type ComponentProps } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  Avatar,
  Person,
  Combobox,
  Attachment,
  Alert,
  Accordion,
  Collapsible,
  Button,
  IconButton,
  buttonVariants,
  type ButtonProps,
  type IconButtonProps,
  Badge,
  badgeVariants,
  type BadgeProps,
  Separator,
  type SeparatorProps,
  Skeleton,
  type SkeletonProps,
  type SkeletonShape,
  Kbd,
  KbdGroup,
  type KbdProps,
  type KbdGroupProps,
  Composer,
  TaskRow,
  Item,
  Text,
  Input,
  Tabs,
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
  type HoverCardProps,
  type HoverCardTriggerProps,
  type HoverCardContentProps,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverContentProps,
  type PopoverHeaderProps,
  type PopoverTitleProps,
  type PopoverDescriptionProps,
  type PopoverCloseProps,
  DropdownMenu,
  ScrollArea,
  toast,
  type ToastOptions,
  LedgerProvider,
} from "@ledger/design-system";
const breadcrumbRefs = {
  nav: createRef<HTMLElement>(),
  list: createRef<HTMLOListElement>(),
  item: createRef<HTMLLIElement>(),
  link: createRef<HTMLAnchorElement>(),
  page: createRef<HTMLSpanElement>(),
  separator: createRef<HTMLLIElement>(),
  ellipsis: createRef<HTMLSpanElement>(),
};
const breadcrumb = (
  <Breadcrumb ref={breadcrumbRefs.nav} aria-label="Packed breadcrumb">
    <BreadcrumbList ref={breadcrumbRefs.list} start={1}>
      <BreadcrumbItem ref={breadcrumbRefs.item} value={1}>
        <BreadcrumbLink
          ref={breadcrumbRefs.link}
          render={<a href="/records" data-consumer-render="anchor" />}
          onClick={(event) => {
            const anchor: HTMLAnchorElement = event.currentTarget;
            void anchor.href;
          }}
        >
          Records
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator ref={breadcrumbRefs.separator} />
      <BreadcrumbItem>
        <button aria-label="More parent pages">
          <BreadcrumbEllipsis ref={breadcrumbRefs.ellipsis} />
        </button>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage ref={breadcrumbRefs.page} id="packed-record-page">
          Packed record
        </BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
);
void breadcrumb;
const avatars = (
  <Avatar.Stack size="medium" aria-label="Reviewers" ref={(node) => node?.focus()}>
    <Avatar name="Dana Whitlock" shape="square" hue="teal">
      <Avatar.Image src="/dana.png" onLoadingStatusChange={(status) => status === "loaded"} />
      <Avatar.Fallback delay={200} />
      <Avatar.Badge tone="success" ref={(node) => node?.focus()} />
    </Avatar>
    <Avatar.Count>+2</Avatar.Count>
  </Avatar.Stack>
);
void avatars;
const owner = <Person name="Dana Whitlock" title="Owner" />;
void owner;
const combo = (
  <Combobox.Root<string, true>
    multiple
    items={["React", "Vue"]}
    defaultValue={["React"]}
    onValueChange={(values) => values.map((value) => value.toUpperCase())}
  >
    <Combobox.Input
      render={<input aria-label="Framework" />}
      className={(state) => (state.open ? "text-brand" : "text-default")}
    />
    <Combobox.Content>
      <Combobox.List>
        {(item: string) => (
          <Combobox.Item key={item} value={item}>
            {item}
          </Combobox.Item>
        )}
      </Combobox.List>
    </Combobox.Content>
  </Combobox.Root>
);
void combo;
const compatibleCombo = (
  <Combobox
    ref={(input) => {
      input?.select();
    }}
    options={[{ value: "react", label: "React" }]}
    value="react"
    onChange={(value) => value.toUpperCase()}
  />
);
void compatibleCombo;
const attachment = (
  <Attachment.Group>
    <Attachment size="small" orientation="vertical">
      <Attachment.Media variant="image">
        <img src="/file.png" alt="Preview" />
      </Attachment.Media>
      <Attachment.Content>
        <Attachment.Title>file.png</Attachment.Title>
        <Attachment.Description>PNG</Attachment.Description>
      </Attachment.Content>
      <a
        href="/file.png"
        aria-label="Download file"
        className={buttonVariants({
          variant: "subtle",
          className:
            "absolute inset-0 z-10 h-full w-full rounded-medium bg-transparent p-0 hover:bg-transparent active:bg-transparent",
        })}
      />
      <Attachment.Actions>
        <Attachment.Action label="Remove file" icon={<svg />} />
      </Attachment.Actions>
    </Attachment>
  </Attachment.Group>
);
void attachment;
const alert = (
  <Alert role="note" data-testid="packed-alert">
    <Alert.Title id="packed-title">Import ready</Alert.Title>
    <Alert.Description>Review records.</Alert.Description>
    <Alert.Action>
      <Button>Review</Button>
    </Alert.Action>
  </Alert>
);
void alert;
const disclosures = (
  <>
    <Accordion
      type="multiple"
      defaultValue={["stable"]}
      onValueChange={(values) => values.map(String)}
    >
      <Accordion.Item value="stable">
        <Accordion.Header>
          <Accordion.Trigger>Details</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content forceMount>Retained</Accordion.Content>
      </Accordion.Item>
    </Accordion>
    <Collapsible defaultOpen>
      <Collapsible.Trigger>More</Collapsible.Trigger>
      <Collapsible.Content>Content</Collapsible.Content>
    </Collapsible>
  </>
);
void disclosures;
const options: ToastOptions = { description: "Saved" };
const result = toast.promise(Promise.resolve({ id: 42 }), {
  loading: "Saving",
  success: (record) => String(record.id),
  error: "Failed",
});
void result;
void options;
export const app = (
  <LedgerProvider>
    <Button name="save">Save</Button>
    <Composer label="Message" onSubmit={async () => {}} />
    <Item.Group>
      <TaskRow title="Review draft" completed onCompletedChange={() => {}} />
    </Item.Group>
    <Text as="label" htmlFor="consumer-name">
      Name
    </Text>
    <Input id="consumer-name" />
    <Tabs dir="rtl">{null}</Tabs>
    <ToggleGroup dir="ltr" defaultValue={["table"]} aria-label="View">
      <ToggleGroupItem value="table">Table</ToggleGroupItem>
      <ToggleGroupItem value="board">Board</ToggleGroupItem>
    </ToggleGroup>
    <DropdownMenu dir="rtl" trigger={<Button>Actions</Button>}>
      {null}
    </DropdownMenu>
    <ScrollArea dir="ltr">Content</ScrollArea>
  </LedgerProvider>
);
const packedSwitch = (
  <Switch
    size="sm"
    ref={createRef<HTMLElement>()}
    inputRef={createRef<HTMLInputElement>()}
    name="updates"
    value="yes"
    uncheckedValue="no"
    className={(state) => (state.checked ? "packed-checked" : "packed-unchecked")}
    style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
    render={(props, state) => <span {...props} data-consumer-checked={state.checked} />}
    onCheckedChange={(checked, details) => {
      if (checked && details.event.defaultPrevented) details.cancel();
    }}
  />
);
void packedSwitch;
const packedRadios = (
  <RadioGroup<number>
    defaultValue={1}
    ref={createRef<HTMLDivElement>()}
    inputRef={createRef<HTMLInputElement>()}
    name="priority"
    className={(state) => (state.readOnly ? "packed-readonly" : "packed-editable")}
    style={(state) => ({ padding: state.required ? 4 : 0 })}
    onValueChange={(value, details) => {
      value.toFixed();
      if (details.event.defaultPrevented) details.cancel();
    }}
  >
    <RadioGroupItem
      value={1}
      ref={createRef<HTMLElement>()}
      inputRef={createRef<HTMLInputElement>()}
    />
    <RadioGroupItem
      value={2}
      render={(props, state) => <span {...props} data-consumer-checked={state.checked} />}
    />
  </RadioGroup>
);
void packedRadios;
const packedCheckbox = (
  <Checkbox
    ref={createRef<HTMLElement>()}
    inputRef={createRef<HTMLInputElement>()}
    checked={false}
    indeterminate
    className={(state) => (state.indeterminate ? "packed-mixed" : "packed-binary")}
    style={(state) => ({ opacity: state.readOnly ? 0.8 : 1 })}
    render={(props, state) => <span {...props} data-consumer-mixed={state.indeterminate} />}
    onCheckedChange={(checked, details) => {
      const next: boolean = checked;
      if (!next) details.cancel();
    }}
  />
);
void packedCheckbox;

const toggle = (
  <Toggle
    ref={createRef<HTMLButtonElement>()}
    variant="outline"
    size="sm"
    defaultPressed
    aria-label="Bold"
    className={(state) => (state.pressed ? "packed-pressed" : "packed-unpressed")}
    style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
    render={(props, state) => <button {...props} data-consumer-pressed={state.pressed} />}
    onPressedChange={(pressed, details) => {
      const next: boolean = pressed;
      const event: Event = details.event;
      if (!next && event.defaultPrevented) details.cancel();
    }}
  >
    <svg aria-hidden />
  </Toggle>
);
type PackedFormat = "bold" | "italic";
const toggleGroup = (
  <ToggleGroup<PackedFormat>
    ref={createRef<HTMLDivElement>()}
    multiple
    defaultValue={["bold"]}
    variant="outline"
    size="lg"
    spacing={0}
    orientation="vertical"
    loopFocus={false}
    aria-label="Formatting"
    className={(state) => (state.multiple ? "packed-multiple" : "packed-single")}
    style={(state) => ({ padding: state.orientation === "vertical" ? 4 : 0 })}
    render={(props, state) => <div {...props} data-consumer-orientation={state.orientation} />}
    onValueChange={(values, details) => {
      const next: PackedFormat[] = values;
      if (!next.length) details.cancel();
    }}
  >
    <ToggleGroupItem
      value="bold"
      ref={createRef<HTMLButtonElement>()}
      render={<button title="Bold formatting" />}
      className={(state) => (state.pressed ? "packed-bold" : "packed-plain")}
      style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
      onClick={(event) => {
        const button: HTMLButtonElement = event.currentTarget;
        void button.name;
        event.preventBaseUIHandler();
      }}
    >
      Bold
    </ToggleGroupItem>
    <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
  </ToggleGroup>
);
const toggleClasses: string = toggleVariants({ variant: "outline", size: "default" });
// @ts-expect-error Base UI group selection is an array, including single selection.
const scalarToggleGroup = <ToggleGroup value="bold" />;
void [toggle, toggleGroup, toggleClasses, scalarToggleGroup];

const buttonRef = createRef<HTMLButtonElement>();
const customButtonRef = createRef<HTMLDivElement>();
const buttonProps: ButtonProps = {
  variant: "primary",
  size: "small",
  isSelected: true,
  isFullWidth: true,
  type: "submit",
  name: "intent",
  value: "save",
  form: "packed-form",
  formAction: "/save",
};
const nativeButton = (
  <Button
    {...buttonProps}
    ref={buttonRef}
    iconBefore={<svg />}
    iconAfter={<svg />}
    onClick={(event) => {
      const target: HTMLButtonElement = event.currentTarget;
      target.checkValidity();
      event.preventBaseUIHandler();
    }}
  >
    Save
  </Button>
);
const renderedButton = (
  <Button
    ref={buttonRef}
    render={(props, state) => <button {...props} data-consumer-disabled={state.disabled} />}
    isLoading
    focusableWhenDisabled
    className={(state) => (state.disabled ? "packed-blocked" : "packed-enabled")}
    style={(state) => ({ opacity: state.disabled ? 0.8 : 1 })}
  >
    Saving
  </Button>
);
const customButton = (
  <Button nativeButton={false} render={<div ref={customButtonRef} data-consumer-render="div" />}>
    Custom action
  </Button>
);
const buttonLink = (
  <a
    href="/records"
    ref={createRef<HTMLAnchorElement>()}
    className={buttonVariants({
      variant: "secondary",
      size: "xsmall",
      isSelected: false,
      isFullWidth: true,
      className: "packed-navigation",
    })}
  >
    Records
  </a>
);
const iconButtonProps: IconButtonProps = {
  label: "Add record",
  icon: <svg />,
  variant: "subtle",
  size: "small",
  isTooltipDisabled: true,
};
const iconButton = (
  <IconButton
    {...iconButtonProps}
    ref={(node) => {
      const target: HTMLButtonElement | null = node;
      target?.checkValidity();
    }}
    render={<button title="Create record" />}
    className={(state) => (state.disabled ? "packed-blocked-icon" : "packed-ready-icon")}
    style={(state) => ({ opacity: state.disabled ? 0.8 : 1 })}
    onClick={(event) => {
      const target: HTMLButtonElement = event.currentTarget;
      void target.form;
      event.preventBaseUIHandler();
    }}
  />
);
// @ts-expect-error Button composition uses render; navigation uses a styled native link.
const oldSlottedButton = <Button asChild />;
// @ts-expect-error IconButton follows the same render contract as Button.
const oldSlottedIconButton = <IconButton asChild label="Add" icon={<svg />} />;
// @ts-expect-error Icon-only controls require an accessible label.
const unlabelledIconButton = <IconButton icon={<svg />} />;
void [
  nativeButton,
  renderedButton,
  customButton,
  buttonLink,
  iconButton,
  oldSlottedButton,
  oldSlottedIconButton,
  unlabelledIconButton,
];

const badgeRef = createRef<HTMLSpanElement>();
const badgeAnchorRef = createRef<HTMLAnchorElement>();
const badgeVariant: ComponentProps<typeof Badge>["variant"] = "ghost";
const badge = (
  <Badge
    ref={badgeRef}
    variant={badgeVariant}
    id="packed-badge"
    title="Native title"
    aria-invalid
    onClick={(event) => {
      const span: HTMLSpanElement = event.currentTarget;
      void span;
    }}
  >
    Native
  </Badge>
);
const badgeLink = (
  <Badge variant="link" render={<a ref={badgeAnchorRef} href="/records" rel="bookmark" />}>
    <svg data-icon="inline-end" aria-hidden />
    Record
  </Badge>
);
const badgeCallback = (
  <Badge render={(props) => <span {...props} data-consumer-render="callback" />} />
);
const nullVariant = <Badge variant={null} />;
const classes: string = badgeVariants({ variant: "destructive", className: "w-fit" });
const semanticClasses: string = badgeVariants({
  variant: "secondary",
  tone: "success",
  appearance: "subtle",
  size: "xsmall",
});
const statusProps: BadgeProps = {
  variant: "secondary",
  tone: "warning",
  appearance: "bold",
  size: "xsmall",
  icon: <svg aria-hidden />,
  children: "Needs review",
};
const statusBadge = <Badge {...statusProps} ref={badgeRef} title="Review needed" />;
const semanticOutline = (
  <Badge variant="outline" tone="success" size="xsmall" icon={<svg aria-hidden />}>
    Verified
  </Badge>
);
const semanticLink = (
  <Badge variant="link" tone="warning" render={<a href="/review" />}>
    Review
  </Badge>
);
const brandBadge = (
  <Badge tone="brand" appearance="subtle">
    Preview
  </Badge>
);
// @ts-expect-error Tone uses the documented palette.
const unknownTone = <Badge tone="purple" />;
// @ts-expect-error Badge supports the two documented densities.
const unknownSize = <Badge size="large" />;
// @ts-expect-error A badge always has a documented density.
const nullSize = <Badge size={null} />;
// @ts-expect-error Emphasis is subtle or bold.
const unknownAppearance = <Badge appearance="outline" />;
// @ts-expect-error Badge preserves the six reference variants.
const unknownVariant = <Badge variant="success" />;
// @ts-expect-error Anchor attributes belong on the element passed through render.
const spanHref = <Badge href="/records" />;
void [
  badge,
  badgeLink,
  badgeCallback,
  nullVariant,
  classes,
  semanticClasses,
  statusBadge,
  semanticOutline,
  semanticLink,
  brandBadge,
  unknownTone,
  unknownSize,
  nullSize,
  unknownAppearance,
  unknownVariant,
  spanHref,
];

const separatorRef = createRef<HTMLDivElement>();
const renderedSeparatorRef = createRef<HTMLSpanElement>();
const separatorProps: SeparatorProps = {
  orientation: "vertical",
  isDecorative: false,
  id: "packed-separator",
  "aria-label": "Details",
};
const separator = (
  <Separator
    {...separatorProps}
    ref={separatorRef}
    onClick={(event) => {
      const target: HTMLDivElement = event.currentTarget;
      void target;
    }}
  />
);
const separatorCallbacks = (
  <Separator
    ref={(node) => {
      const target: HTMLDivElement | null = node;
      void target;
    }}
    className={(state) => {
      const orientation: "horizontal" | "vertical" = state.orientation;
      return orientation === "vertical" ? "self-stretch" : "w-full";
    }}
    style={(state) => ({ marginInline: state.orientation === "vertical" ? 4 : 0 })}
  />
);
const renderedSeparator = (
  <Separator
    orientation="vertical"
    render={<span ref={renderedSeparatorRef} data-consumer-render="element" />}
  />
);
const callbackSeparator = (
  <Separator
    render={(props, state) => {
      const orientation: "horizontal" | "vertical" = state.orientation;
      return <div {...props} data-consumer-orientation={orientation} />;
    }}
  />
);
const decorativeSeparator = <Separator isDecorative role="none" aria-hidden />;
// @ts-expect-error Separator preserves the primitive's two orientations.
const invalidSeparatorOrientation = <Separator orientation="diagonal" />;
void [
  separator,
  separatorCallbacks,
  renderedSeparator,
  callbackSeparator,
  decorativeSeparator,
  invalidSeparatorOrientation,
];

const skeletonRef = createRef<HTMLDivElement>();
const skeletonShape: SkeletonShape = "circle";
const skeletonProps: SkeletonProps = {
  shape: skeletonShape,
  width: 24,
  height: "2rem",
  id: "packed-skeleton",
  lang: "en",
  dir: "rtl",
  "aria-hidden": false,
  children: "Loading",
};
const skeleton = (
  <Skeleton
    {...skeletonProps}
    ref={skeletonRef}
    onClick={(event) => {
      const target: HTMLDivElement = event.currentTarget;
      void target;
    }}
  />
);
const multilineSkeleton = (
  <Skeleton
    lines={3}
    width="75%"
    height={8}
    ref={(node) => {
      const wrapper: HTMLDivElement | null = node;
      void wrapper;
    }}
    title="Loading record"
    className="packed-skeleton"
    style={{ width: 240 }}
    onPointerDown={(event) => {
      const wrapper: HTMLDivElement = event.currentTarget;
      void wrapper;
    }}
  >
    <span>Loading hint</span>
  </Skeleton>
);
// @ts-expect-error Skeleton retains its four documented shapes.
const invalidSkeletonShape = <Skeleton shape="triangle" />;
void [skeleton, multilineSkeleton, invalidSkeletonShape];

const keyRef = createRef<HTMLElement>();
const groupRef = createRef<HTMLElement>();
const keyProps: KbdProps = {
  label: "Command",
  id: "packed-key",
  lang: "en",
  "aria-label": "Meta key",
};
const groupProps: KbdGroupProps = {
  id: "packed-chord",
  "aria-label": "Command K",
  style: { verticalAlign: "middle" },
};
const key = (
  <Kbd
    {...keyProps}
    ref={keyRef}
    onClick={(event) => {
      const element: HTMLElement = event.currentTarget;
      void element;
    }}
  >
    ⌘
  </Kbd>
);
const chord = (
  <KbdGroup
    {...groupProps}
    ref={groupRef}
    onPointerEnter={(event) => {
      const element: HTMLElement = event.currentTarget;
      void element;
    }}
  >
    {key}
    <Kbd>K</Kbd>
  </KbdGroup>
);
const compatibleChord = (
  <Kbd.Group
    ref={(node) => {
      const element: HTMLElement | null = node;
      void element;
    }}
    title="Alternative shortcut"
  >
    <Kbd>esc</Kbd>
  </Kbd.Group>
);
const emptyKey = <Kbd />;
// @ts-expect-error Keyboard text is not an anchor and does not accept href.
const invalidKeyLink = <Kbd href="/shortcuts">K</Kbd>;
void [key, chord, compatibleChord, emptyKey, invalidKeyLink];

type PreviewPayload = { title: string };
const hoverCardProps: HoverCardProps<PreviewPayload> = {
  onOpenChange(open, details) {
    if (open && details.reason === "trigger-focus") details.cancel();
  },
};
const hoverTriggerProps: HoverCardTriggerProps<PreviewPayload> = {
  href: "/records/preview",
  payload: { title: "Preview record" },
  delay: 100,
  closeDelay: 200,
  ref: createRef<HTMLAnchorElement>(),
  onClick(event) {
    const anchor: HTMLAnchorElement = event.currentTarget;
    void anchor.href;
  },
};
const hoverContentProps: HoverCardContentProps = {
  ref: createRef<HTMLDivElement>(),
  side: "inline-end",
  sideOffset: ({ anchor }) => anchor.height / 2,
  align: "start",
  dir: "rtl",
  className: (state) => (state.open ? "text-brand" : "text-default"),
  style: (state) => ({ width: state.open ? 300 : 256 }),
  render: (props, state) => <div {...props} data-consumer-side={state.side} />,
};
const hoverCard = (
  <HoverCard<PreviewPayload> {...hoverCardProps}>
    {({ payload }) => (
      <>
        <HoverCardTrigger {...hoverTriggerProps}>Preview record</HoverCardTrigger>
        <HoverCardContent {...hoverContentProps}>{payload?.title}</HoverCardContent>
      </>
    )}
  </HoverCard>
);
void hoverCard;

const popoverInputRef = createRef<HTMLInputElement>();
const popoverTriggerRef = createRef<HTMLButtonElement>();
const popoverProps: PopoverProps<PreviewPayload> = {
  modal: "trap-focus",
  onOpenChange(open, details) {
    if (!open && details.reason === "outside-press") details.cancel();
  },
};
const popoverTriggerProps: PopoverTriggerProps<PreviewPayload> = {
  ref: popoverTriggerRef,
  payload: { title: "Filter records" },
  className: (state) => (state.open ? "text-brand" : "text-default"),
  onClick(event) {
    const button: HTMLButtonElement = event.currentTarget;
    void button.form;
  },
};
const popoverContentProps: PopoverContentProps = {
  ref: createRef<HTMLDivElement>(),
  initialFocus: popoverInputRef,
  finalFocus: (interaction) => (interaction === "touch" ? false : popoverTriggerRef.current),
  side: "inline-start",
  sideOffset: ({ anchor }) => anchor.height / 2,
  style: (state) => ({ width: state.open ? 320 : 288 }),
  render: (props, state) => <div {...props} data-consumer-side={state.side} />,
};
const popoverHeaderProps: PopoverHeaderProps = {
  ref: createRef<HTMLDivElement>(),
  title: "Filters",
};
const popoverTitleProps: PopoverTitleProps = {
  ref: createRef<HTMLHeadingElement>(),
  render: <h3 />,
};
const popoverDescriptionProps: PopoverDescriptionProps = { ref: createRef<HTMLParagraphElement>() };
const popoverCloseProps: PopoverCloseProps = {
  ref: createRef<HTMLButtonElement>(),
  disabled: false,
};
const popover = (
  <Popover<PreviewPayload> {...popoverProps}>
    {({ payload }) => (
      <>
        <PopoverTrigger {...popoverTriggerProps}>Filters</PopoverTrigger>
        <PopoverContent {...popoverContentProps}>
          <PopoverHeader {...popoverHeaderProps}>
            <PopoverTitle {...popoverTitleProps}>{payload?.title}</PopoverTitle>
            <PopoverDescription {...popoverDescriptionProps}>Refine records.</PopoverDescription>
          </PopoverHeader>
          <input ref={popoverInputRef} aria-label="Search records" />
          <PopoverClose {...popoverCloseProps}>Apply</PopoverClose>
        </PopoverContent>
      </>
    )}
  </Popover>
);
void popover;
