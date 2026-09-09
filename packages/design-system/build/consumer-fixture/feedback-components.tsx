import { createRef } from "react";
import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";
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
<Toaster
  ref={createRef<HTMLElement>()}
  id="exports"
  duration={6000}
  visibleToasts={2}
  theme="dark"
  dir="rtl"
  offset={{ top: 24 }}
  mobileOffset={16}
  hotkey={["altKey", "KeyN"]}
  swipeDirections={["left"]}
  toastOptions={{ closeButtonAriaLabel: "Dismiss", classNames: { title: "font-medium" } }}
/>;

function NativeSonnerProps(props: ComponentProps<typeof Sonner>) {
  return <Toaster {...props} />;
}
void NativeSonnerProps;
// @ts-expect-error Compose CardHeader parts instead of configured description props.
<CardHeader description="Old configured header" />;
// @ts-expect-error The old compound body is removed.
<Card.Body>Body</Card.Body>;
// @ts-expect-error Actions belong in EmptyContent.
<Empty action={<button>Add</button>} />;
// @ts-expect-error Spinner refs target the SVG.
<Spinner ref={createRef<HTMLDivElement>()} />;
