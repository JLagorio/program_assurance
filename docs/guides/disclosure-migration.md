# Accordion and Collapsible migration

The unreleased API separates two base components. Accordion owns a set of sections; Collapsible owns one independent boolean disclosure. There is no additional section pattern. The root, item, heading, trigger and content can be composed directly with existing Count, Button and layout primitives.

## New usage

```tsx
<Accordion type="multiple" defaultValue={["ownership"]}>
  <Accordion.Item value="ownership">
    <Accordion.Header>
      <Accordion.Trigger>Ownership <Count value={2} /></Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Owner information.</Accordion.Content>
  </Accordion.Item>
</Accordion>

<Collapsible defaultOpen>
  <Collapsible.Trigger asChild><Button>Additional details</Button></Collapsible.Trigger>
  <Collapsible.Content>Details.</Collapsible.Content>
</Collapsible>
```

## Compatibility

This is a deliberate API change for the next minor release; no release is published by these edits. Current application and package-story callers have been migrated. External consumers needing the former title/count/inset API can temporarily alias `LegacyCollapsible as Collapsible` and `LegacyAccordion as Accordion` in their imports. Those adapters preserve the previous implementation, including its default selection behavior and limitations, through the next minor release; removal requires a later changelog entry. They are deprecated and the Ledger lint identifies them for migration.

| Previous | Replacement |
| --- | --- |
| `Collapsible title={...}` | `Collapsible` with explicit `.Trigger` and `.Content` |
| `Collapsible.Group` | `Accordion type="multiple"` (old Group default) |
| Deprecated `Accordion` | `Accordion type="single" collapsible` (old Accordion default) |
| Title-based item identity | Required, explicit stable `Accordion.Item value` |
| Item `defaultOpen` inside a group | Root `defaultValue`, using item values |
| Group `headingLevel` | `Accordion.Header asChild` around the appropriate heading |
| `count` | Compose `Count` inside the trigger |
| `inset` / section borders | Token classes on trigger/content/item |
| Old `Accordion.Item title` | Explicit `.Item`, `.Header`, `.Trigger`, `.Content` |

Accordion root state is a discriminated union: single mode takes a string, multiple mode takes string arrays, and callbacks receive the corresponding type. A Collapsible inside an Accordion's content remains independent. Neither component inspects React children or infers identity from display text.

Native props and refs target the named part. `asChild` composes one child that must forward injected props and refs. Accordion.Trigger adds a decorative chevron by default, accepts a custom `indicator`, and lets the child supply the entire presentation in `asChild` mode. Collapsible.Trigger has no mandatory icon or title layout.

Both content components support `forceMount` to retain child state while closed content stays hidden and outside the tab order. Retained panels hide immediately instead of playing the exit animation. Ordinary panels animate before unmounting. Browser find in closed content is not implemented; Base UI's hidden-until-found capability is a separate future decision. Programmatic closure while focus is inside a panel must first move focus to an appropriate visible control.

## Validation

Components/Accordion and Components/Collapsible contain contract matrices and interaction stories covering controlled/uncontrolled selection, disabled states, keyboard behavior, ARIA associations, wrapped items, stable IDs through duplicate labels/reordering, refs, slotted buttons, independent nested disclosures, retained input state and hidden-control tab exclusion. The same contracts run in light and dark modes, with reduced motion in dark. Type fixtures reject invalid state combinations and missing item values. Packed consumer checks exercise the public exports, emitted declarations and server rendering.
