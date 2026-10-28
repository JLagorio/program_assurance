import { useId, useState, type ComponentProps, type ReactNode, type Ref } from "react";
import { Bookmark, Check, Copy, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Alert, AlertAction, AlertDescription } from "../components/alert";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogContentProps,
} from "../components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Field, FieldLabel, FieldSet } from "../components/field";
import { Input } from "../components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import { cn } from "../lib/cn";
import { Text } from "../primitives/text";

/** Presentation only: view definitions, destinations, permissions and storage stay in the host. */
export type SavedViewItem = {
  id: string;
  name: string;
  description?: string | undefined;
  /** Host-provided sharing label, such as Private or Shared. */
  visibilityLabel?: string | undefined;
  favorite?: boolean | undefined;
  /** Missing capabilities are omitted, never inferred from ownership or a role. */
  canEdit?: boolean | undefined;
  canDuplicate?: boolean | undefined;
  canDelete?: boolean | undefined;
  /** Keeps an unavailable view readable, with the reason beside it. */
  disabledReason?: string | undefined;
};

/** Override the visible and accessible words for another language. */
export type SavedViewLabels = {
  title: string;
  saveCurrent: string;
  manage: string;
  loading: string;
  empty: string;
  find: string;
  noMatches: string;
  retry: string;
  edit: string;
  duplicate: string;
  delete: string;
  favorite: string;
  unfavorite: string;
  close: string;
  cancel: string;
  name: string;
  visibility: string;
  replaceSettings: string;
};
const defaultLabels: SavedViewLabels = {
  title: "Saved views",
  saveCurrent: "Save current view",
  manage: "Manage saved views",
  loading: "Loading views…",
  empty: "No saved views yet.",
  find: "Find saved views",
  noMatches: "No views match this search.",
  retry: "Retry",
  edit: "Edit",
  duplicate: "Duplicate",
  delete: "Delete",
  favorite: "Favorite",
  unfavorite: "Unfavorite",
  close: "Close",
  cancel: "Cancel",
  name: "Name",
  visibility: "Visibility",
  replaceSettings: "Replace settings with the current view",
};
type ViewCollection = {
  views: readonly SavedViewItem[];
  selectedId?: string | undefined;
  loading?: boolean | undefined;
  /** A failed read keeps the supplied views available. */
  error?: string | undefined;
  onRetry?: (() => void) | undefined;
  /** Host-owned compatibility or scope notice. */
  notice?: string | undefined;
  onApply: (id: string) => void;
  onCreate?: (() => void) | undefined;
  labels?: Partial<SavedViewLabels> | undefined;
};

export type SavedViewPickerProps = Omit<ComponentProps<"span">, "children" | "onSelect"> &
  ViewCollection & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onManage?: (() => void) | undefined;
    disabled?: boolean | undefined;
    disabledReason?: string | undefined;
    /** The native root ref is a span; this ref reaches its menu button for focus restoration. */
    triggerRef?: Ref<HTMLButtonElement> | undefined;
  };

/** A toolbar menu for applying a view, saving the current settings or opening management. */
export function SavedViewPicker({
  views,
  selectedId,
  open,
  onOpenChange,
  loading = false,
  error,
  onRetry,
  notice,
  onApply,
  onCreate,
  onManage,
  disabled,
  disabledReason,
  triggerRef,
  labels: overrides,
  className,
  ...props
}: SavedViewPickerProps) {
  const labels = { ...defaultLabels, ...overrides };
  return (
    <span
      {...props}
      className={cn("inline-flex min-w-0 max-w-full", className)}
      data-slot="saved-view-picker"
    >
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger
          render={
            <Button
              ref={triggerRef}
              size="small"
              variant="subtle"
              iconBefore={<Bookmark />}
              disabled={disabled}
              disabledReason={disabledReason}
              truncate
            >
              {labels.title}
            </Button>
          }
        />
        <DropdownMenuContent>
          {loading && <DropdownMenuItem disabled>{labels.loading}</DropdownMenuItem>}
          {error && (
            <DropdownMenuItem onClick={onRetry} disabled={!onRetry} description={error}>
              {labels.retry}
            </DropdownMenuItem>
          )}
          {!loading && !error && views.length === 0 && (
            <DropdownMenuItem disabled>{labels.empty}</DropdownMenuItem>
          )}
          {views.map((view) => (
            <DropdownMenuItem
              key={view.id}
              onClick={() => onApply(view.id)}
              aria-current={view.id === selectedId ? "true" : undefined}
              disabledReason={view.disabledReason}
              description={[view.visibilityLabel, view.description].filter(Boolean).join(" · ")}
            >
              {view.id === selectedId && <Check aria-hidden />}
              {view.name}
            </DropdownMenuItem>
          ))}
          {notice && <DropdownMenuItem disabled>{notice}</DropdownMenuItem>}
          {(onCreate || onManage) && <DropdownMenuSeparator />}
          {onCreate && (
            <DropdownMenuItem onClick={onCreate}>
              <Plus aria-hidden />
              {labels.saveCurrent}…
            </DropdownMenuItem>
          )}
          {onManage && <DropdownMenuItem onClick={onManage}>{labels.manage}…</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

export type SavedViewManagerProps = Omit<ComponentProps<"div">, "children" | "title" | "onSelect"> &
  ViewCollection & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description?: string | undefined;
    /** Blocks commands and dismissal while a host operation is in flight. */
    pending?: boolean | undefined;
    /** Only favorite commands are busy; other views remain usable. */
    favoritePending?: boolean | undefined;
    onEdit?: ((id: string) => void) | undefined;
    onDuplicate?: ((id: string) => void) | undefined;
    /** Requests deletion. The host owns confirmation and the destructive operation. */
    onDelete?: ((id: string) => void) | undefined;
    onFavoriteChange?: ((id: string, favorite: boolean) => void) | undefined;
    /** Application feedback, including failures while applying or changing a view. */
    feedback?: ReactNode;
    /** Put host confirmation overlays here so they nest inside this dialog's focus scope. */
    children?: ReactNode;
    finalFocus?: DialogContentProps["finalFocus"];
  };

/** A searchable list of authorized saved views and their host-supplied capabilities. */
export function SavedViewManager({
  views,
  selectedId,
  open,
  onOpenChange,
  description,
  pending = false,
  favoritePending = false,
  loading = false,
  error,
  onRetry,
  notice,
  onApply,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onFavoriteChange,
  feedback,
  children,
  finalFocus,
  labels: overrides,
  className,
  ...props
}: SavedViewManagerProps) {
  const labels = { ...defaultLabels, ...overrides };
  const [search, setSearch] = useState("");
  const shown = views.filter((view) =>
    `${view.name} ${view.description ?? ""}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  return (
    <Dialog
      open={open}
      pending={pending}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSearch("");
      }}
    >
      <DialogContent finalFocus={finalFocus}>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogBody>
          <div
            {...props}
            className={cn("flex min-w-0 flex-col gap-200", className)}
            data-slot="saved-view-manager"
            aria-busy={loading || pending || undefined}
          >
            {feedback}
            {error && (
              <Alert tone="danger">
                <AlertDescription>{error}</AlertDescription>
                {onRetry && (
                  <AlertAction>
                    <Button size="small" onClick={onRetry} disabled={pending}>
                      {labels.retry}
                    </Button>
                  </AlertAction>
                )}
              </Alert>
            )}
            {notice && <Text color="color.text.subtle">{notice}</Text>}
            <Input
              type="search"
              aria-label={labels.find}
              placeholder={labels.find}
              value={search}
              onValueChange={setSearch}
              disabled={pending}
            />
            {loading && <Text role="status">{labels.loading}</Text>}
            {!loading && !error && shown.length === 0 && (
              <Text role="status" color="color.text.subtle">
                {views.length ? labels.noMatches : labels.empty}
              </Text>
            )}
            {shown.length > 0 && (
              <ul className="flex min-w-0 flex-col gap-150" aria-label={labels.title}>
                {shown.map((view) => (
                  <li
                    key={view.id}
                    aria-label={view.name}
                    className="flex min-w-0 flex-col gap-100 rounded-medium border border-default p-100"
                  >
                    <div className="flex min-w-0 items-center gap-100">
                      <Button
                        variant="subtle"
                        truncate
                        className="min-w-0 flex-1"
                        disabled={pending}
                        disabledReason={view.disabledReason}
                        isSelected={view.id === selectedId}
                        onClick={() => onApply(view.id)}
                      >
                        {view.name}
                      </Button>
                      {view.visibilityLabel && <Badge>{view.visibilityLabel}</Badge>}
                    </div>
                    {view.description && <Text color="color.text.subtle">{view.description}</Text>}
                    {view.disabledReason && (
                      <Text color="color.text.subtle">{view.disabledReason}</Text>
                    )}
                    <div className="flex flex-wrap items-center gap-100">
                      {onFavoriteChange && (
                        <Button
                          size="small"
                          variant="subtle"
                          iconBefore={<Star />}
                          aria-pressed={view.favorite ?? false}
                          disabled={pending || favoritePending}
                          onClick={() => onFavoriteChange(view.id, !view.favorite)}
                        >
                          {view.favorite ? labels.unfavorite : labels.favorite}
                        </Button>
                      )}
                      {view.canEdit && onEdit && (
                        <Button
                          size="small"
                          variant="subtle"
                          iconBefore={<Pencil />}
                          disabled={pending}
                          onClick={() => onEdit(view.id)}
                        >
                          {labels.edit}
                        </Button>
                      )}
                      {view.canDuplicate && onDuplicate && (
                        <Button
                          size="small"
                          variant="subtle"
                          iconBefore={<Copy />}
                          disabled={pending}
                          onClick={() => onDuplicate(view.id)}
                        >
                          {labels.duplicate}
                        </Button>
                      )}
                      {view.canDelete && onDelete && (
                        <Button
                          size="small"
                          variant="subtle"
                          iconBefore={<Trash2 />}
                          disabled={pending}
                          onClick={() => onDelete(view.id)}
                        >
                          {labels.delete}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle">{labels.close}</Button>} />
          {onCreate && (
            <Button iconBefore={<Plus />} onClick={onCreate} disabled={pending}>
              {labels.saveCurrent}
            </Button>
          )}
        </DialogFooter>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export type SavedViewDraft = {
  name: string;
  visibility: string;
  replaceSettings: boolean;
};
export type SavedViewVisibility = {
  value: string;
  label: string;
  disabledReason?: string | undefined;
};
export type SavedViewEditorProps = Omit<
  ComponentProps<"form">,
  "children" | "onSubmit" | "onChange" | "title"
> & {
  open: boolean;
  /** The host may keep the editor open while it asks to discard unsaved changes. */
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | undefined;
  value: SavedViewDraft;
  onValueChange: (value: SavedViewDraft) => void;
  onSubmit: () => void;
  submitLabel: string;
  visibilityOptions: readonly SavedViewVisibility[];
  showReplaceSettings?: boolean | undefined;
  pending?: boolean | undefined;
  error?: string | undefined;
  labels?: Partial<SavedViewLabels> | undefined;
  finalFocus?: DialogContentProps["finalFocus"];
  /** Host confirmation overlays are nested here; persistence and discard policy stay outside. */
  children?: ReactNode;
};

/** Controlled naming/sharing form. Failed saves retain the host's draft and focus. */
export function SavedViewEditor({
  open,
  onOpenChange,
  title,
  description,
  value,
  onValueChange,
  onSubmit,
  submitLabel,
  visibilityOptions,
  showReplaceSettings = false,
  pending = false,
  error,
  labels: overrides,
  finalFocus,
  children,
  id,
  className,
  ...props
}: SavedViewEditorProps) {
  const generatedId = useId();
  const formId = id ?? generatedId;
  const labels = { ...defaultLabels, ...overrides };
  return (
    <Dialog open={open} pending={pending} onOpenChange={onOpenChange}>
      <DialogContent finalFocus={finalFocus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogBody>
          <form
            {...props}
            id={formId}
            className={cn("min-w-0", className)}
            data-slot="saved-view-editor"
            onSubmit={(event) => {
              event.preventDefault();
              if (!pending && value.name.trim()) onSubmit();
            }}
          >
            <FieldSet disabled={pending}>
              <div className="flex min-w-0 flex-col gap-200">
                {error && (
                  <Alert tone="danger">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Field>
                  <FieldLabel>{labels.name}</FieldLabel>
                  <Input
                    value={value.name}
                    onValueChange={(name) => onValueChange({ ...value, name })}
                    maxLength={100}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>{labels.visibility}</FieldLabel>
                  <Select
                    value={value.visibility}
                    onValueChange={(visibility) => {
                      if (typeof visibility === "string") onValueChange({ ...value, visibility });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {visibilityOptions.find((option) => option.value === value.visibility)
                          ?.label ?? value.visibility}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {visibilityOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabledReason={option.disabledReason}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {showReplaceSettings && (
                  <Field orientation="horizontal">
                    <Checkbox
                      checked={value.replaceSettings}
                      onCheckedChange={(replaceSettings) =>
                        onValueChange({ ...value, replaceSettings: replaceSettings === true })
                      }
                    />
                    <FieldLabel>{labels.replaceSettings}</FieldLabel>
                  </Field>
                )}
              </div>
            </FieldSet>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle">{labels.cancel}</Button>} />
          <Button
            variant="primary"
            type="submit"
            form={formId}
            disabled={!value.name.trim()}
            isLoading={pending}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
        {children}
      </DialogContent>
    </Dialog>
  );
}
