import { useFieldRootContext } from "@base-ui/react/internals/field-root-context";
import { Upload } from "lucide-react";
import {
  useContext,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { useLedgerLocale, type LedgerLocale } from "../lib/locale";
import { formatFileSize } from "./attachment";
import { FieldSetStateContext, FieldStateContext } from "./controls";
import { FieldError } from "./field";
import { FileTrigger, acceptAttribute, type FileTriggerProps } from "./file-trigger";

/* A region files can be dropped on, with a FileTrigger inside for the keyboard, a screen reader and
   a touch screen, which cannot drag. Dropped and chosen files go through the same check: the
   accepted types, the size limit and, without `multiple`, one file. Accepted files go to
   `onSelect`, where the caller shows them as Attachment rows and uploads them; each refused file
   gets a message, shown in the zone as the Field's FieldError (so it describes the button and marks
   the Field invalid) and announced with the result, politely, since focus stays on the button. */

/** Why a file was refused: not an accepted type, over `maxSize`, or one of several where one is allowed. */
export type FileRejectionReason = "type" | "size" | "count";

export type FileRejection = {
  file: File;
  reason: FileRejectionReason;
  /** What the zone shows and announces, from the locale: "notes.docx is not an accepted file type." */
  message: string;
};

export type DropZoneProps = Omit<ComponentProps<"div">, "onSelect" | "title" | "children"> & {
  /**
   * The accepted types, as the file input's `accept`: media types (`application/pdf`), wildcards
   * (`image/*`) and extensions (`.csv`). Checked on every drop and choice. Any file by default.
   */
  accept?: string | readonly string[] | undefined;
  /** The largest accepted file, in bytes, checked per file. Write it in decimal units (`50_000_000` is 50 MB) so the message matches a "50 MB" hint. No limit by default. */
  maxSize?: number | undefined;
  /** Accepts several files at once. One by default; several dropped then are all refused. */
  multiple?: boolean | undefined;
  /** Refuses drops and disables the trigger. A Field's or FieldSet's `disabled` also reaches it. */
  disabled?: boolean | undefined;
  /** Called with the accepted files of each drop or choice, when there is at least one. */
  onSelect?: ((files: File[]) => void) | undefined;
  /** Called with the refused files of each drop or choice, when there is at least one. */
  onReject?: ((rejections: FileRejection[]) => void) | undefined;
  /** The instruction for a pointer. "Drag a file here", or "Drag files here" with `multiple`. While files are dragged over the zone it reads "Drop the file to add it". */
  title?: ReactNode | undefined;
  /** The trigger's label. "Choose a file", or "Choose files" with `multiple`. */
  triggerLabel?: ReactNode | undefined;
  /** The trigger button, to move focus to it after a removal or a failed submit. */
  triggerRef?: Ref<HTMLButtonElement> | undefined;
  /** Replace the upload icon, or `null` for none. Decorative. */
  icon?: ReactElement | null | undefined;
  /** Under the title: the constraints, as a FieldDescription ("PDF or image, up to 50 MB each"). */
  children?: ReactNode | undefined;
};

/** The accept list, lower case, one entry per type. */
function acceptList(accept: DropZoneProps["accept"]) {
  return (acceptAttribute(accept) ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** Whether a file matches the accept list the way the file input reads it. */
function accepts(file: File, list: string[]) {
  // `*` and `*/*` accept anything, as they do on the input.
  if (!list.length || list.includes("*") || list.includes("*/*")) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return list.some((entry) =>
    entry.startsWith(".")
      ? name.endsWith(entry)
      : entry.endsWith("/*")
        ? type.startsWith(entry.slice(0, -1))
        : type === entry,
  );
}

function check(
  files: File[],
  { accept, maxSize, multiple }: Pick<DropZoneProps, "accept" | "maxSize" | "multiple">,
  locale: LedgerLocale,
) {
  const { t } = locale;
  if (!multiple && files.length > 1)
    return {
      accepted: [] as File[],
      rejected: files.map((file) => ({
        file,
        reason: "count" as const,
        message: t("fileCountRejected"),
      })),
    };
  const list = acceptList(accept);
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    if (!accepts(file, list))
      rejected.push({ file, reason: "type", message: t("fileTypeRejected", { name: file.name }) });
    else if (maxSize !== undefined && file.size > maxSize)
      rejected.push({
        file,
        reason: "size",
        message: t("fileTooLarge", {
          name: file.name,
          size: formatFileSize(maxSize, { locale: locale.locale }),
        }),
      });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

/** A drag that carries files, as opposed to text or a link dragged across the page. */
const carriesFiles = (event: DragEvent<HTMLElement>) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

/** What a click on the zone's own surface leaves alone: a control inside it. */
const INTERACTIVE = 'a[href], button, input, select, textarea, label, [role="button"], [tabindex]';

/**
 * A drop region with a FileTrigger inside. Checks `accept`, `maxSize` and `multiple` on every drop
 * and choice, hands the accepted files to `onSelect`, shows each refusal as the Field's FieldError
 * and announces the result. Put it in a Field: the FieldLabel names the trigger, and a
 * FieldDescription among its children says the constraints and describes the trigger. A click on
 * the zone's surface opens the picker too, for a pointer.
 */
export function DropZone({
  accept,
  maxSize,
  multiple = false,
  disabled,
  onSelect,
  onReject,
  title,
  triggerLabel,
  triggerRef,
  icon,
  children,
  className,
  onClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: DropZoneProps) {
  const locale = useLedgerLocale();
  const { t } = locale;
  const fieldRoot = useFieldRootContext();
  const field = useContext(FieldStateContext);
  const fieldSet = useContext(FieldSetStateContext);
  const input = useRef<HTMLInputElement | null>(null);
  const errorId = useId();
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const resolvedDisabled = Boolean(
    disabled || fieldRoot.disabled || field?.disabled || fieldSet?.disabled,
  );
  const messages = [...new Set(rejections.map((rejection) => rejection.message))];
  const invalid = messages.length > 0 || fieldRoot.state.valid === false;

  const receive = (files: File[]) => {
    const { accepted, rejected } = check(files, { accept, maxSize, multiple }, locale);
    setRejections(rejected);
    if (accepted.length) onSelect?.(accepted);
    if (rejected.length) onReject?.(rejected);
    const added =
      accepted.length === 1
        ? t("fileAdded", { name: accepted[0]!.name })
        : accepted.length > 1
          ? locale.formatPlural(accepted.length, {
              one: t("filesAddedOne"),
              other: t("filesAddedOther"),
            })
          : "";
    announce([added, ...new Set(rejected.map((rejection) => rejection.message))].join(" "));
  };

  const endDrag = () => {
    depth.current = 0;
    setDragging(false);
  };

  return (
    <div
      {...props}
      data-slot="drop-zone"
      data-dragging={dragging ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      data-disabled={resolvedDisabled ? "" : undefined}
      className={cn(
        "group/drop-zone relative flex min-w-0 flex-col items-center gap-100 rounded-medium border border-dashed border-input p-300 text-center font-body text-default",
        // The hover surface gives way to the drag's, whatever the pointer's hover state during a drag.
        "cursor-pointer transition-colors duration-fast ease-standard motion-reduce:transition-none not-data-[disabled]:not-data-[dragging]:hover:bg-neutral-subtle-hovered",
        "data-[invalid]:not-data-[dragging]:border-danger",
        // Dragging over the zone changes its border from dashed to solid as well as its colour, and
        // its title, so the state survives forced colours and does not rest on colour alone.
        "data-[dragging]:border-solid data-[dragging]:border-selected data-[dragging]:bg-selected",
        // The hint's subtlest text is under 4.5:1 on the selected surface in dark mode; subtle is not.
        "data-[dragging]:[&_[data-slot=field-description]]:text-subtle",
        // Disabled keeps its words legible (they are not a control, so no contrast exemption covers
        // them); the border, the icon, the cursor and the disabled trigger say it is unavailable.
        "data-[disabled]:cursor-not-allowed data-[disabled]:border-disabled",
        "[&_[data-slot=field-description]]:text-center",
        className,
      )}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        const control = (event.target as Element).closest(INTERACTIVE);
        if (control && event.currentTarget.contains(control)) return;
        input.current?.click();
      }}
      onDragEnter={(event) => {
        onDragEnter?.(event);
        if (!carriesFiles(event)) return;
        event.preventDefault();
        if (resolvedDisabled) return;
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (!carriesFiles(event)) return;
        // Taking the drag keeps the browser from opening a file dropped on a disabled zone.
        event.preventDefault();
        event.dataTransfer.dropEffect = resolvedDisabled ? "none" : "copy";
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        if (!carriesFiles(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (!carriesFiles(event)) return;
        event.preventDefault();
        endDrag();
        if (resolvedDisabled) return;
        const files = Array.from(event.dataTransfer.files);
        if (files.length) receive(files);
      }}
    >
      {icon === null ? null : (
        <span
          data-slot="drop-zone-icon"
          aria-hidden="true"
          className="flex icon-subtle group-data-[dragging]/drop-zone:icon-selected group-data-[disabled]/drop-zone:icon-disabled [&>svg]:size-icon-medium"
        >
          {icon ?? <Upload />}
        </span>
      )}
      <span
        data-slot="drop-zone-title"
        className="font-medium group-data-[dragging]/drop-zone:text-selected"
      >
        {dragging
          ? t(multiple ? "dropFilesRelease" : "dropFileRelease")
          : (title ?? t(multiple ? "dropFilesHere" : "dropFileHere"))}
      </span>
      {children}
      <FileTrigger
        ref={triggerRef as FileTriggerProps["ref"]}
        inputRef={input}
        accept={accept}
        multiple={multiple}
        disabled={resolvedDisabled}
        // A refusal marks the trigger invalid even where the Field's own `invalid` says otherwise,
        // and describes it outside a Field too; inside one, Base UI already lists the error.
        aria-invalid={messages.length ? true : undefined}
        aria-describedby={messages.length && !field ? errorId : undefined}
        onSelect={receive}
      >
        {triggerLabel}
      </FileTrigger>
      {messages.length ? (
        <FieldError id={errorId}>
          {messages.map((message) => (
            <span key={message} className="block break-words">
              {message}
            </span>
          ))}
        </FieldError>
      ) : null}
    </div>
  );
}
