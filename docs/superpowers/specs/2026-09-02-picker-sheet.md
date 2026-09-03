# PickerSheet: choosing many from hundreds

Date: 2026-09-02. From item 9 of `2026-09-02-ui-patterns-audit.md`. Josef: a Combobox will not hold up when a system has hundreds of requirements and the question is which of them apply to one element. The reference is HubSpot's association panel; the neighbours are Airtable's "link to record" and Salesforce's lookup.

## The question it answers

"Which of these many belong on this one?" The one is known (an element, a requirement, a control set); the many are a table's worth, found by attribute, not by name. That is the opposite of the pickers the kit had (Combobox, Command, DatePicker), which find one record you can already name.

## The shape

A `Sheet` with two frames, both the same sheet.

**Frame one chooses.** The toolbar is a search field and the filters; it does not scroll. The body is a `Table` with sortable `Table.Header`s and `Table.Selection`; the header row is sticky. Selection survives search and filters, so a reader can gather across several searches. The footer reads the count ("12 chosen of 340", with Clear), then Cancel, then the one action, named in full: **Continue with 12** when the chosen rows need fields, **Allocate 12 to Flight computer** when they do not.

**Frame two fills in the fields the model requires** (responsibility, coverage, the bounded claim): the chosen rows as a compact table with `Editable` cells, and a defaults row in the toolbar slot that applies one value to all. Never a form per row. The back chevron returns to frame one with the selection intact. The footer's action is the verb: **Allocate 12 to Flight computer**.

"Does not apply, because" is a row action in frame two, so the applicability walk (today `ApplicabilityModal`, one obligation at a time) becomes a mode of the picker rather than a separate dialog.

## What the kit owns and what the app owns

The kit owns the frame: `PickerSheet` in patterns, with `search`, `filters`, `toolbar`, `selected`, `total`, `onClear`, `action`, `secondary` and `onBack`. The app owns the columns, the rows, the sort, the selection set and the per-row fields, because they are the model's.

## Where it serves

Requirements onto an element (the tree's kebab, replacing the Combobox in "Allocate a requirement"); elements onto a requirement (coverage); controls into a set (the tailoring pane's two Comboboxes); controls that derive requirements; evidence onto work (today `RecordPicker`, a Command.Dialog, which stays right for finding one by name).

## Calls made without asking, for Josef to overturn in one reading

1. Frame one's action is **Continue** when fields follow and the verb when they do not; the count is always in the label.
2. The defaults row applies to every chosen row and each cell can then differ; there is no "apply to selected only".
3. The kit does not know what "does not apply" means; it is a row action the app adds, with the reason as an Editable cell.
