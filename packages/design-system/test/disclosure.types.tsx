import { createRef } from "react";
import { Accordion, Collapsible } from "../src/index";

const button = createRef<HTMLButtonElement>();
const content = createRef<HTMLDivElement>();
<Accordion type="single" value="a" onValueChange={(value) => value.toUpperCase()} />;
<Accordion type="multiple" value={["a"]} onValueChange={(values) => values.map(String)} />;
<Accordion.Item value="stable-id" ref={content} />;
<Accordion.Trigger ref={button} aria-label="Details" />;
<Accordion.Content ref={content} forceMount />;
<Collapsible open onOpenChange={(open) => Boolean(open)} ref={content} />;
<Collapsible.Trigger ref={button} />;
<Collapsible.Content forceMount ref={content} />;
// @ts-expect-error Multiple selection must use arrays.
<Accordion type="multiple" value="a" />;
// @ts-expect-error Single selection must use a string.
<Accordion type="single" value={["a"]} />;
// @ts-expect-error Only single mode has a collapsible policy.
<Accordion type="multiple" collapsible />;
// @ts-expect-error Stable item identity is required.
<Accordion.Item />;
// @ts-expect-error Selection belongs to the root, not an item.
<Accordion.Item value="a" defaultOpen />;
// @ts-expect-error A Collapsible controls a boolean, not a selection array.
<Collapsible open={["a"]} />;
