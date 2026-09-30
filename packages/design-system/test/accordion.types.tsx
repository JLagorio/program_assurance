import { createRef } from "react";
import { Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../src/index";

// Every Accordion part takes Base UI's state function for className as well as a string
// (Components/Accordion Parts checks that it applies).
<Accordion className={(state) => (state.disabled ? "opacity-disabled" : undefined)} />;
<AccordionItem value="a" className={(state) => (state.open ? "py-025" : "py-050")} />;
<AccordionTrigger className={(state) => (state.open ? "text-subtle" : undefined)} />;
<AccordionContent className={(state) => (state.open ? "pb-025" : "")} />;

// The heading around the trigger takes its own props, ref and render; icon replaces the chevron.
const heading = createRef<HTMLHeadingElement>();
<AccordionTrigger headerProps={{ ref: heading, render: <h4 />, className: "pt-050" }} />;
<AccordionTrigger headerProps={{ className: (state) => (state.open ? "pt-050" : undefined) }} />;
<AccordionTrigger icon={<Plus />} />;
<AccordionTrigger icon={null} />;
// @ts-expect-error The heading is configured through headerProps, not a separate level prop.
<AccordionTrigger headingLevel={2} />;
