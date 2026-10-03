import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type {
  ToastManager as BaseToastManager,
  ToastManagerAddOptions,
  ToastManagerUpdateOptions,
  ToastObject,
} from "@base-ui/react/toast";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";

import { tokenValue } from "../generated/tokens";
import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { Button } from "./button";
import { Spinner } from "./spinner";

/**
 * What a toast is about, which picks its icon. The kit's tone words and Base UI's are both
 * accepted: `information` is `info` and `danger` is `error`, and the manager stores Base UI's.
 */
export type ToastType =
  "success" | "information" | "info" | "warning" | "danger" | "error" | "loading";

type Typed<Options> = Omit<Options, "type"> & { type?: ToastType | undefined };

/** A toast to add: Base UI's options with a typed `type`. */
export type ToastOptions<Data extends object = Record<string, unknown>> = Typed<
  ToastManagerAddOptions<Data>
>;
/** Changes to a toast already shown. */
export type ToastUpdateOptions<Data extends object = Record<string, unknown>> = Typed<
  ToastManagerUpdateOptions<Data>
>;
/** What `promise` shows while the work runs, when it resolves and when it rejects. */
export type ToastPromiseOptions<Value, Data extends object = Record<string, unknown>> = {
  loading: string | ToastUpdateOptions<Data>;
  success:
    string | ToastUpdateOptions<Data> | ((result: Value) => string | ToastUpdateOptions<Data>);
  error:
    string | ToastUpdateOptions<Data> | ((error: unknown) => string | ToastUpdateOptions<Data>);
};

/**
 * The kit's toast manager: Base UI's, with Ledger's defaults applied as a toast is added or
 * changed. A toast with an action does not time out, since its action must stay reachable; an
 * error stays eight seconds. An explicit `timeout` always wins.
 */
export type ToastManager<Data extends object = Record<string, unknown>> = Omit<
  BaseToastManager<Data>,
  "add" | "update" | "promise"
> & {
  add: <T extends Data = Data>(options: ToastOptions<T>) => string;
  update: <T extends Data = Data>(id: string, updates: ToastUpdateOptions<T>) => void;
  promise: <Value, T extends Data = Data>(
    promise: Promise<Value>,
    options: ToastPromiseOptions<Value, T>,
  ) => Promise<Value>;
};

/** An error's timeout when the caller sets none: long enough to read a sentence and act on it. */
const ERROR_TIMEOUT = 8000;

const baseType = (type: string | undefined) =>
  type === "information" ? "info" : type === "danger" ? "error" : type;

/** Ledger's defaults on one set of options. `added` is true for a new toast, false for an update. */
function withDefaults<O extends { type?: string | undefined }>(options: O, added: boolean): O {
  const next: Record<string, unknown> = { ...options };
  if ("type" in options) next["type"] = baseType(options.type);
  const has = (key: string) => Object.hasOwn(options, key) && next[key] !== undefined;
  if (next["actionProps"] && !has("timeout")) next["timeout"] = 0;
  if (next["type"] === "error" && added && !has("timeout")) next["timeout"] = ERROR_TIMEOUT;
  return next as O;
}

type PromiseStep<Value> = ToastPromiseOptions<Value>["success"];
function stepWithDefaults<Value>(step: PromiseStep<Value>, type: "success" | "error") {
  const apply = (value: string | ToastUpdateOptions) =>
    withDefaults({ ...(typeof value === "string" ? { description: value } : value), type }, true);
  return typeof step === "function" ? (result: Value) => apply(step(result)) : apply(step);
}

/** Base UI's methods with Ledger's defaults in front of them. */
function ledgerMethods<M extends Pick<BaseToastManager, "add" | "update" | "promise">>(base: M) {
  return {
    add: (options: ToastOptions) =>
      base.add(withDefaults(options, true) as ToastManagerAddOptions<object>),
    update: (id: string, updates: ToastUpdateOptions) =>
      base.update(id, withDefaults(updates, false) as ToastManagerUpdateOptions<object>),
    promise: <Value,>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) =>
      base.promise(promise, {
        loading: options.loading as string | ToastManagerUpdateOptions<object>,
        success: stepWithDefaults(options.success, "success") as never,
        error: stepWithDefaults(options.error as PromiseStep<unknown>, "error") as never,
      }),
  };
}

/** A manager for a stack of its own; pass it to a Toaster's `toastManager`. */
export function createToastManager<
  Data extends object = Record<string, unknown>,
>(): ToastManager<Data> {
  const base = ToastPrimitive.createToastManager<Data>();
  return { ...base, ...ledgerMethods(base) } as unknown as ToastManager<Data>;
}

/** The nearest provider's toasts and methods, with Ledger's defaults, for a stack drawn by hand. */
export function useToastManager<Data extends object = Record<string, unknown>>(): Omit<
  ToastManager<Data>,
  " subscribe"
> & { toasts: ToastObject<Data>[] } {
  const base = ToastPrimitive.useToastManager<Data>();
  // Base UI's methods are stable while its toasts change; the kit's keep that, so a caller can
  // depend on `add` without re-running an effect every time a toast comes or goes.
  const { add, update, promise } = base;
  const methods = useMemo(() => ledgerMethods({ add, update, promise }), [add, update, promise]);
  return useMemo(
    () =>
      ({ ...base, ...methods }) as unknown as Omit<ToastManager<Data>, " subscribe"> & {
        toasts: ToastObject<Data>[];
      },
    [base, methods],
  );
}

export const toast: ToastManager = createToastManager();

export type ToastProviderProps = Omit<ToastPrimitive.Provider.Props, "toastManager"> & {
  /** A manager from `createToastManager`, or Base UI's own. */
  toastManager?: ToastManager | BaseToastManager | undefined;
};
export type ToasterProps = ToastProviderProps;

export function ToastProvider({ toastManager, ...props }: ToastProviderProps) {
  return (
    <ToastPrimitive.Provider
      {...props}
      {...(toastManager ? { toastManager: toastManager as BaseToastManager } : {})}
    />
  );
}

export function ToastPortal(props: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal {...props} data-slot="toast-portal" />;
}

/** Native viewport props and ref, including custom placement, direction and accessible name. */
export function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  const { t, direction } = useLedgerLocale();
  return (
    <ToastPrimitive.Viewport
      aria-label={t("notifications")}
      dir={direction}
      className={classes("toast-viewport pointer-events-none fixed outline-none", className)}
      {...props}
      data-slot="toast-viewport"
    />
  );
}

export function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      className={classes(
        // The root takes the swipe, so it does not select; its title and description do.
        "toast-root pointer-events-auto absolute bottom-0 end-0 w-full origin-bottom rounded-large border border-default bg-surface-overlay font-body text-default shadow-overlay outline-none select-none focus-visible:outline-focused",
        className,
      )}
      {...props}
      data-slot="toast"
    />
  );
}

export function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      className={classes(
        "flex h-full items-center gap-100 overflow-hidden p-150 transition-opacity duration-moderate ease-standard data-behind:opacity-0 data-expanded:opacity-100 motion-reduce:transition-none",
        className,
      )}
      {...props}
      data-slot="toast-content"
    />
  );
}

/** Selectable, so an error message or a record code can be copied; a swipe that starts on the text does not dismiss. */
export function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-base-ui-swipe-ignore=""
      className={classes("font-medium select-text", className)}
      {...props}
      data-slot="toast-title"
    />
  );
}

/** Selectable, as the title is. */
export function ToastDescription({ className, ...props }: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-base-ui-swipe-ignore=""
      className={classes("font-body-small text-subtle select-text", className)}
      {...props}
      data-slot="toast-description"
    />
  );
}

/** Native actionProps supply the label and handler. Close explicitly when the action should dismiss. */
export function ToastAction({
  className,
  render = <Button variant="secondary" size="small" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      render={render}
      className={classes("shrink-0", className)}
      {...props}
      data-slot="toast-action"
    />
  );
}

export function ToastClose({
  className,
  children,
  render = <Button variant="subtle" size="small" />,
  ...props
}: ToastPrimitive.Close.Props) {
  const { t } = useLedgerLocale();
  return (
    <ToastPrimitive.Close
      aria-label={t("close")}
      render={render}
      className={classes("size-300 shrink-0 p-0", className)}
      {...props}
      data-slot="toast-close"
    >
      {children ?? <X aria-hidden className="size-icon-small" />}
    </ToastPrimitive.Close>
  );
}

const icons = {
  success: <CircleCheck aria-hidden className="size-icon-medium icon-success" />,
  error: <CircleAlert aria-hidden className="size-icon-medium icon-danger" />,
  warning: <TriangleAlert aria-hidden className="size-icon-medium icon-warning" />,
  info: <Info aria-hidden className="size-icon-medium icon-information" />,
  loading: <Spinner size="medium" isDecorative />,
};

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();
  return toasts.map((item) => {
    const type = baseType(item.type);
    return (
      <Toast key={item.id} toast={item}>
        <ToastContent>
          {type && type in icons ? (
            <span className="shrink-0">{icons[type as keyof typeof icons]}</span>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-025 break-words">
            <ToastTitle />
            <ToastDescription />
          </div>
          <ToastAction />
          <ToastClose />
        </ToastContent>
      </Toast>
    );
  });
}

/** A short window (dimension.query.shortWindow, the Shell's and the overlays' threshold) keeps two
    toasts, so the open stack stays inside it. */
const shortWindowQuery = () => `(height < ${tokenValue("dimension.query.shortWindow")})`;
const SHORT_LIMIT = 2;
function subscribeShortWindow(change: () => void) {
  const query = window.matchMedia(shortWindowQuery());
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const isShortWindow = () => window.matchMedia(shortWindowQuery()).matches;
const notShortOnServer = () => false;
function useShortWindow() {
  return useSyncExternalStore(subscribeShortWindow, isShortWindow, notShortOnServer);
}

/**
 * Mount once near the root. The kit's manager, with Ledger's five-second timeout and four visible
 * toasts (two in a window under 30rem tall); a toast with an action never times out and an error
 * stays eight seconds.
 */
export function Toaster({
  children,
  toastManager = toast,
  timeout = 5000,
  limit = 4,
  ...props
}: ToasterProps) {
  const short = useShortWindow();
  return (
    <ToastProvider
      toastManager={toastManager}
      timeout={timeout}
      limit={short ? Math.min(limit, SHORT_LIMIT) : limit}
      {...props}
    >
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}
