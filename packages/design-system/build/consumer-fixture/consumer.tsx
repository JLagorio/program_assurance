import { createRef, type ComponentProps } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  type SelectProps,
  type SelectTriggerProps,
  type SelectValueProps,
  type SelectContentProps,
  type SelectGroupProps,
  type SelectLabelProps,
  type SelectItemProps,
  type SelectSeparatorProps,
  type SelectScrollUpButtonProps,
  type SelectScrollDownButtonProps,
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
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
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
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
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
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  type DropdownMenuProps,
  type DropdownMenuPortalProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuGroupProps,
  type DropdownMenuLabelProps,
  type DropdownMenuItemProps,
  type DropdownMenuLinkItemProps,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuRadioGroupProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuShortcutProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubTriggerProps,
  type DropdownMenuSubContentProps,
  Tooltip,
  type TooltipProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
  type TooltipContentProps,
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
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverContentProps,
  type PopoverHeaderProps,
  type PopoverTitleProps,
  type PopoverDescriptionProps,
  type PopoverCloseProps,
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
    <Accordion multiple defaultValue={["stable"]} onValueChange={(values) => values.map(String)}>
      <AccordionItem value="stable">
        <AccordionTrigger>Details</AccordionTrigger>
        <AccordionContent keepMounted>Retained</AccordionContent>
      </AccordionItem>
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
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>Actions</DropdownMenuTrigger>
      <DropdownMenuContent dir="rtl">
        <DropdownMenuItem>Export</DropdownMenuItem>
      </DropdownMenuContent>
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

type TooltipAction = { label: string };
const provider: TooltipProviderProps = { delay: 300, closeDelay: 100, timeout: 300 };
const root: TooltipProps<TooltipAction> = {
  trackCursorAxis: "x",
  disableHoverablePopup: false,
  actionsRef: createRef<{ close(): void; unmount(): void }>(),
  onOpenChange(open, details) {
    if (!open && details.reason === "outside-press") details.cancel();
    const event: Event = details.event;
    void event;
  },
};
const trigger: TooltipTriggerProps<TooltipAction> = {
  ref: createRef<HTMLButtonElement>(),
  payload: { label: "Save" },
  delay: 100,
  closeDelay: 50,
  closeOnClick: false,
  disabled: false,
  onClick(event) {
    const button: HTMLButtonElement = event.currentTarget;
    void button.form;
    event.preventBaseUIHandler();
  },
};
const content: TooltipContentProps = {
  ref: createRef<HTMLDivElement>(),
  side: "inline-end",
  sideOffset: ({ anchor }) => anchor.width / 10,
  alignOffset: ({ positioner }) => positioner.width / 10,
  className: (state) => (state.open ? "font-medium" : "font-regular"),
  style: (state) => ({ maxWidth: state.open ? 300 : 260 }),
  render: (props, state) => <div {...props} data-placement={state.side} />,
};
<TooltipProvider {...provider}>
  <Tooltip<TooltipAction> {...root}>
    {({ payload }) => (
      <>
        <TooltipTrigger {...trigger}>Save</TooltipTrigger>
        <TooltipContent {...content}>{payload?.label}</TooltipContent>
      </>
    )}
  </Tooltip>
</TooltipProvider>;
<TooltipTrigger render={<a href="/records" ref={createRef<HTMLAnchorElement>()} />} />;
<TooltipTrigger render={<span ref={createRef<HTMLSpanElement>()} tabIndex={0} />} />;
// @ts-expect-error Trigger adds hover/focus behavior, not useButton's nativeButton API.
<TooltipTrigger nativeButton={false} />;
// @ts-expect-error Content is composed as a separate part.
<Tooltip content="Save">
  <button>Save</button>
</Tooltip>;

type MenuPayload = { id: string };
const menuRootProps: DropdownMenuProps<MenuPayload> = {
  modal: false,
  loopFocus: false,
  orientation: "vertical",
  highlightItemOnHover: false,
  actionsRef: createRef<{ close(): void; unmount(): void }>(),
  onOpenChange(open, details) {
    if (!open) {
      details.cancel();
      details.preventUnmountOnClose();
    }
    const event: Event = details.event;
    void event;
  },
};
const menuTriggerProps: DropdownMenuTriggerProps<MenuPayload> = {
  ref: createRef<HTMLButtonElement>(),
  payload: { id: "record" },
  openOnHover: true,
  delay: 200,
  render: (props, state) => <button {...props} data-opened={state.open} />,
};
const menuContentProps: DropdownMenuContentProps = {
  ref: createRef<HTMLDivElement>(),
  side: "inline-end",
  sideOffset: ({ anchor }) => anchor.width / 10,
  alignOffset: ({ positioner }) => positioner.width / 10,
  finalFocus: () => document.getElementById("record-action"),
  className: (state) => (state.open ? "font-medium" : "font-regular"),
  style: (state) => ({ width: state.open ? 240 : 200 }),
};
const menuPortalProps: DropdownMenuPortalProps = {
  container: createRef<HTMLDivElement>(),
  keepMounted: true,
};
const menuGroupProps: DropdownMenuGroupProps = { ref: createRef<HTMLDivElement>() };
const menuLabelProps: DropdownMenuLabelProps = { inset: true, ref: createRef<HTMLDivElement>() };
const menuItemProps: DropdownMenuItemProps = {
  inset: true,
  variant: "destructive",
  nativeButton: true,
  render: <button type="button" ref={createRef<HTMLButtonElement>()} />,
  closeOnClick: false,
  onClick: (event) => event.preventBaseUIHandler(),
  className: (state) => (state.highlighted ? "font-medium" : "font-regular"),
};
const menuLinkProps: DropdownMenuLinkItemProps = {
  href: "/records",
  target: "_blank",
  rel: "noreferrer",
  ref: createRef<HTMLAnchorElement>(),
  render: <a />,
};
const menuCheckboxProps: DropdownMenuCheckboxItemProps = {
  checked: true,
  onCheckedChange: (_, details) => details.cancel(),
};
const menuRadioGroupProps: DropdownMenuRadioGroupProps = {
  value: "date",
  onValueChange: (_, details) => details.cancel(),
};
const menuRadioProps: DropdownMenuRadioItemProps = { value: "date", closeOnClick: true };
const menuSeparatorProps: DropdownMenuSeparatorProps = { ref: createRef<HTMLDivElement>() };
const menuShortcutProps: DropdownMenuShortcutProps = {
  ref: createRef<HTMLSpanElement>(),
  title: "Command E",
};
const menuSubProps: DropdownMenuSubProps = { defaultOpen: false };
const menuSubTriggerProps: DropdownMenuSubTriggerProps = {
  inset: true,
  delay: 100,
  render: <div />,
};
const menuSubContentProps: DropdownMenuSubContentProps = {
  side: "inline-end",
  style: (state) => ({ minWidth: state.open ? 160 : 128 }),
};
<DropdownMenu {...menuRootProps}>
  {({ payload }) => (
    <>
      <DropdownMenuTrigger {...menuTriggerProps} />
      <DropdownMenuContent {...menuContentProps}>
        <DropdownMenuGroup {...menuGroupProps}>
          <DropdownMenuLabel {...menuLabelProps}>{payload?.id}</DropdownMenuLabel>
          <DropdownMenuItem {...menuItemProps}>
            Archive<DropdownMenuShortcut {...menuShortcutProps}>E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuLinkItem {...menuLinkProps}>Open</DropdownMenuLinkItem>
          <DropdownMenuCheckboxItem {...menuCheckboxProps}>Owner</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup {...menuRadioGroupProps}>
          <DropdownMenuRadioItem {...menuRadioProps}>Date</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator {...menuSeparatorProps} />
        <DropdownMenuSub {...menuSubProps}>
          <DropdownMenuSubTrigger {...menuSubTriggerProps}>Share</DropdownMenuSubTrigger>
          <DropdownMenuSubContent {...menuSubContentProps} />
        </DropdownMenuSub>
      </DropdownMenuContent>
      <DropdownMenuPortal {...menuPortalProps} />
    </>
  )}
</DropdownMenu>;
// @ts-expect-error Compose the trigger as a separate part.
<DropdownMenu trigger={<button />} />;
// @ts-expect-error Action selection uses onClick; onSelect is not the menu's activation callback.
<DropdownMenuItem isSelected />;

type SelectOwner = { id: number; name: string };
const selectRoot: SelectProps<SelectOwner> = {
  name: "owner",
  form: "record",
  required: true,
  autoComplete: "off",
  readOnly: false,
  inputRef: createRef<HTMLInputElement>(),
  defaultValue: { id: 1, name: "Dana" },
  itemToStringLabel: (owner) => owner.name,
  itemToStringValue: (owner) => String(owner.id),
  isItemEqualToValue: (a, b) => a.id === b.id,
  actionsRef: createRef<{ unmount(): void }>(),
  onValueChange(value, details) {
    const id: number | undefined = value?.id;
    if (id === 2) details.cancel();
  },
  onOpenChange(open, details) {
    if (!open && details.reason === "outside-press") details.cancel();
  },
};
const selectTrigger: SelectTriggerProps = {
  ref: createRef<HTMLButtonElement>(),
  size: "sm",
  id: "owner-trigger",
  style: (state) => ({ width: state.open ? 240 : 200 }),
  className: (state) => (state.disabled ? "font-regular" : "font-medium"),
  render: (props, state) => <button {...props} data-selected={state.value?.id} />,
};
const selectValue: SelectValueProps = {
  ref: createRef<HTMLSpanElement>(),
  placeholder: "Choose owner",
  children: (value: SelectOwner | null) => value?.name ?? "Choose owner",
};
const selectContent: SelectContentProps = {
  ref: createRef<HTMLDivElement>(),
  alignItemWithTrigger: false,
  side: "inline-end",
  dir: "rtl",
  sideOffset: ({ anchor }) => anchor.width / 10,
  alignOffset: ({ positioner }) => positioner.width / 10,
  finalFocus: createRef<HTMLButtonElement>(),
  style: (state) => ({ minWidth: state.open ? 240 : 200 }),
};
const selectGroup: SelectGroupProps = { ref: createRef<HTMLDivElement>() };
const selectLabel: SelectLabelProps = { ref: createRef<HTMLDivElement>() };
const selectItem: SelectItemProps = {
  ref: createRef<HTMLDivElement>(),
  value: { id: 1, name: "Dana" },
  label: "Dana",
  disabled: false,
  className: (state) => (state.selected ? "font-medium" : "font-regular"),
  onClick: (event) => event.preventBaseUIHandler(),
};
const selectSeparator: SelectSeparatorProps = { ref: createRef<HTMLDivElement>() };
const selectUp: SelectScrollUpButtonProps = { ref: createRef<HTMLDivElement>(), keepMounted: true };
const selectDown: SelectScrollDownButtonProps = {
  ref: createRef<HTMLDivElement>(),
  keepMounted: true,
};
<Select {...selectRoot}>
  <SelectTrigger {...selectTrigger}>
    <SelectValue {...selectValue} />
  </SelectTrigger>
  <SelectContent {...selectContent}>
    <SelectGroup {...selectGroup}>
      <SelectLabel {...selectLabel}>Owner</SelectLabel>
      <SelectItem {...selectItem}>Dana</SelectItem>
    </SelectGroup>
    <SelectSeparator {...selectSeparator} />
    <SelectItem value={null}>Unassigned</SelectItem>
    <SelectScrollUpButton {...selectUp} />
    <SelectScrollDownButton {...selectDown} />
  </SelectContent>
</Select>;
<Select<number, true>
  multiple
  defaultValue={[1]}
  onValueChange={(values, details) => {
    const numeric: number[] = values;
    if (numeric.length === 0) details.cancel();
  }}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value={1}>One</SelectItem>
  </SelectContent>
</Select>;
// @ts-expect-error Root owns state; native layout belongs on Trigger.
<Select width={200} />;
// @ts-expect-error Trigger follows shadcn's size names.
<SelectTrigger size="small" />;

const tabsRoot: TabsProps = {
  ref: createRef<HTMLDivElement>(),
  defaultValue: 1,
  orientation: "vertical",
  dir: "rtl",
  render: <section aria-label="Record" />,
  className: (state) => (state.orientation === "vertical" ? "gap-200" : "gap-100"),
  style: (state) => ({ opacity: state.tabActivationDirection === "none" ? 1 : 0.9 }),
  onValueChange(value, details) {
    if (value === 2 && details.reason === "none") details.cancel();
  },
};
const tabsList: TabsListProps = {
  ref: createRef<HTMLDivElement>(),
  variant: "line",
  activateOnFocus: true,
  loopFocus: false,
  "aria-label": "Record views",
  className: tabsListVariants({ variant: "line" }),
};
const tabsTrigger: TabsTriggerProps = {
  ref: createRef<HTMLButtonElement>(),
  value: 1,
  disabled: false,
  className: (state) => (state.active ? "font-medium" : "font-regular"),
  onClick: (event) => event.preventBaseUIHandler(),
};
const tabsPanel: TabsContentProps = {
  ref: createRef<HTMLDivElement>(),
  value: 1,
  keepMounted: true,
  render: (props, state) => <section {...props} data-inactive={state.hidden} />,
};
<Tabs {...tabsRoot}>
  <TabsList {...tabsList}>
    <TabsTrigger {...tabsTrigger}>Overview</TabsTrigger>
    <TabsTrigger value={2} nativeButton={false} render={<a href="/record?tab=history" />}>
      History
    </TabsTrigger>
  </TabsList>
  <TabsContent {...tabsPanel}>Overview content</TabsContent>
</Tabs>;
<Tabs value={null} />;
// @ts-expect-error Activation belongs on TabsList as activateOnFocus.
<Tabs activation="automatic" />;
// @ts-expect-error Use aria-label on the tablist.
<TabsList label="Views" />;
// @ts-expect-error Counts belong in children.
<TabsTrigger value="overview" count={2} />;
// @ts-expect-error Composition uses render.
<TabsContent value="overview" asChild />;
