# Accordion and Collapsible migration

Accordion coordinates sections; Collapsible owns one independent boolean disclosure. Both now follow shadcn's Base UI parts. Use the family pages for the complete contracts: [Accordion](../../packages/design-system/src/stories/components/Accordion.mdx) and [Collapsible](../../packages/design-system/src/stories/components/Collapsible.mdx).

```tsx
<Accordion multiple defaultValue={["ownership"]}>
  <AccordionItem value="ownership">
    <AccordionTrigger>Ownership <Count value={2} /></AccordionTrigger>
    <AccordionContent>Owner information.</AccordionContent>
  </AccordionItem>
</Accordion>

<Collapsible defaultOpen>
  <CollapsibleTrigger render={<Button />}>Additional details</CollapsibleTrigger>
  <CollapsibleContent keepMounted>Details.</CollapsibleContent>
</Collapsible>
```

| Former API                                        | Current composition                                     |
| ------------------------------------------------- | ------------------------------------------------------- |
| `Collapsible title={...}`                         | `CollapsibleTrigger` and `CollapsibleContent` children  |
| `Collapsible.Group` / `Accordion type="multiple"` | `Accordion multiple` with explicit item values          |
| `Accordion type="single"`                         | `Accordion` with array `value`/`defaultValue`           |
| `Accordion.Item/.Trigger/.Content`                | `AccordionItem/AccordionTrigger/AccordionContent`       |
| `Collapsible.Trigger/.Content`                    | `CollapsibleTrigger/CollapsibleContent`                 |
| Title-based identity or item `defaultOpen`        | Stable item values and root `defaultValue`              |
| `count`, title actions, `inset`, borders          | Children and token classes                              |
| `asChild`                                         | `render` with an element accepting the merged props/ref |
| `forceMount`                                      | `keepMounted`                                           |
| Radix `data-state` selectors                      | Base UI `data-open` / `data-closed`                     |

AccordionTrigger owns its heading wrapper. Single and multiple selection both use arrays, including an empty array for no selection. Cancel a change through the callback's event details when a workflow requires an open section.

Retained closed panels remain hidden and outside the tab order. `hiddenUntilFound` allows browser find-in-page to reveal content where supported. If application code closes a panel while focus is inside it, move focus to a visible control first.

The unused LegacyAccordion/LegacyCollapsible adapters have been removed in this unreleased breaking batch. Application and package callers use the current parts. No version bump or release is implied; the [changelog](../../packages/design-system/CHANGELOG.md) records the removal.
