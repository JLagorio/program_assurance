import { createRef } from "react";
import type { ComponentProps } from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  Spinner,
  Toaster,
  Toast,
  ToastProvider,
  ToastPortal,
  ToastViewport,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  createToastManager,
  toast,
  TextLink,
  Shell,
} from "@ledger/design-system";

<Card
  ref={createRef<HTMLDivElement>()}
  size="sm"
  aria-labelledby="card-title"
  title="Native tooltip"
>
  <CardHeader ref={createRef<HTMLDivElement>()}>
    <CardTitle ref={createRef<HTMLDivElement>()}>
      <h2 id="card-title">Review</h2>
    </CardTitle>
    <CardDescription ref={createRef<HTMLDivElement>()}>Details</CardDescription>
    <CardAction ref={createRef<HTMLDivElement>()}>
      <button type="button">Edit</button>
    </CardAction>
  </CardHeader>
  <CardContent
    ref={createRef<HTMLDivElement>()}
    tabIndex={-1}
    onFocus={(event) => event.currentTarget.scrollIntoView()}
  >
    Body
  </CardContent>
  <CardFooter ref={createRef<HTMLDivElement>()}>Footer</CardFooter>
</Card>;
<Empty ref={createRef<HTMLDivElement>()} size="compact" role="region">
  <EmptyMedia ref={createRef<HTMLDivElement>()} variant="icon" aria-hidden>
    <svg ref={createRef<SVGSVGElement>()} />
  </EmptyMedia>
  <EmptyHeader ref={createRef<HTMLDivElement>()}>
    <EmptyTitle ref={createRef<HTMLDivElement>()}>No records</EmptyTitle>
    <EmptyDescription ref={createRef<HTMLDivElement>()}>Add one.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent ref={createRef<HTMLDivElement>()}>
    <button type="button">Add</button>
  </EmptyContent>
</Empty>;
<Spinner
  ref={createRef<SVGSVGElement>()}
  id="loading"
  aria-label="Saving"
  strokeWidth={3}
  delay={300}
  onClick={(event) => {
    const svg: SVGSVGElement = event.currentTarget;
    void svg;
  }}
/>;
const manager = createToastManager<{ recordId: string }>();
const toastId: string = manager.add({ title: "Saved", timeout: 0, data: { recordId: "PRG-1041" } });
manager.update(toastId, { description: "Ready" });
manager.close(toastId);
const promised: Promise<{ id: number }> = toast.promise(Promise.resolve({ id: 42 }), {
  loading: "Saving",
  success: (record) => ({ title: String(record.id) }),
  error: "Failed",
});
void promised;
<Toaster timeout={6000} limit={2} toastManager={manager} />;
<ToastProvider toastManager={manager}>
  <ToastPortal>
    <ToastViewport
      ref={createRef<HTMLDivElement>()}
      dir="rtl"
      aria-label="Exports"
      style={{ maxWidth: 280 }}
    >
      <Toast
        toast={{ id: "record", title: "Saved" }}
        ref={createRef<HTMLDivElement>()}
        swipeDirection="left"
        className={(state) => (state.expanded ? "font-medium" : "font-regular")}
      >
        <ToastContent ref={createRef<HTMLDivElement>()}>
          <ToastTitle ref={createRef<HTMLHeadingElement>()} />
          <ToastDescription ref={createRef<HTMLParagraphElement>()} />
          <ToastAction
            ref={createRef<HTMLButtonElement>()}
            onClick={(event) => event.currentTarget.focus()}
          >
            Undo
          </ToastAction>
          <ToastClose ref={createRef<HTMLButtonElement>()} aria-label="Dismiss" />
        </ToastContent>
      </Toast>
    </ToastViewport>
  </ToastPortal>
</ToastProvider>;
function NativeToastProps(props: ComponentProps<typeof ToastPrimitive.Provider>) {
  return <Toaster {...props} />;
}
void NativeToastProps;
<TextLink ref={createRef<HTMLAnchorElement>()} href="/records" target="_blank" rel="noopener">
  Records
</TextLink>;
<TextLink render={<a ref={createRef<HTMLAnchorElement>()} href="/records" />}>Records</TextLink>;
<Shell.AppLogo
  name="Ledger"
  ref={createRef<HTMLSpanElement>()}
  render={<a href="/" ref={createRef<HTMLAnchorElement>()} />}
/>;
<Shell.SideNav.Item ref={createRef<HTMLAnchorElement>()} href="/records" isActive>
  Records
</Shell.SideNav.Item>;
<Shell.SideNav.Item render={<button ref={createRef<HTMLButtonElement>()} type="button" disabled />}>
  Add
</Shell.SideNav.Item>;
// @ts-expect-error Compose native viewport props on ToastViewport.
<Toaster position="top-left" />;
// @ts-expect-error Use native timeout instead of Sonner duration.
toast.add({ title: "Saved", duration: 1000 });
// @ts-expect-error The native manager exposes add with a type.
toast.success("Saved");
// @ts-expect-error Native render replaces Slot asChild.
<TextLink asChild />;
// @ts-expect-error Native render replaces Slot asChild.
<Shell.AppLogo name="Ledger" asChild />;
// @ts-expect-error Native render replaces Slot asChild.
<Shell.SideNav.Item asChild>Records</Shell.SideNav.Item>;
// @ts-expect-error Compose CardHeader parts instead of configured description props.
<CardHeader description="Old configured header" />;
// @ts-expect-error The old compound body is removed.
<Card.Body>Body</Card.Body>;
// @ts-expect-error Actions belong in EmptyContent.
<Empty action={<button>Add</button>} />;
// @ts-expect-error Spinner refs target the SVG.
<Spinner ref={createRef<HTMLDivElement>()} />;
