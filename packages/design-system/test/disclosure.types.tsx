import { createRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../src/index";

const button = createRef<HTMLButtonElement>();
const content = createRef<HTMLDivElement>();
<Accordion value={["a"]} onValueChange={(values) => values.map(String)} keepMounted />;
<Accordion multiple value={["a"]} onValueChange={(values) => values.map(String)} />;
<AccordionItem value="stable-id" ref={content} />;
<AccordionItem />;
<AccordionTrigger ref={button} aria-label="Details" render={<button type="button" />} />;
<AccordionContent ref={content} keepMounted />;
<Collapsible open onOpenChange={(open) => Boolean(open)} ref={content} />;
<CollapsibleTrigger ref={button}></CollapsibleTrigger>;
<CollapsibleContent ref={content} keepMounted={true}></CollapsibleContent>;
// @ts-expect-error Multiple selection must use arrays.
<Accordion multiple value="a" />;
// @ts-expect-error Single selection also uses an array.
<Accordion value="a" />;
// @ts-expect-error Selection mode is configured with multiple.
<Accordion type="single" />;
// @ts-expect-error Base UI does not expose the Radix collapsible policy.
<Accordion collapsible />;
// @ts-expect-error Selection belongs to the root, not an item.
<AccordionItem value="a" defaultOpen />;
// @ts-expect-error Trigger composition uses render.
<AccordionTrigger asChild />;
// @ts-expect-error Mounted panels use keepMounted.
<AccordionContent forceMount />;
// @ts-expect-error A Collapsible controls a boolean, not a selection array.
<Collapsible open={["a"]} />;
