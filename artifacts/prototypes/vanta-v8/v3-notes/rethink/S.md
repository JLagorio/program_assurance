# Lane S: the system and its components

Read `SP/vanta/v3r/CONTEXT.md`, then `SP/vanta/v3r/MODEL.md`, and follow both. Your files: `SP/vanta/proto/mod-zzzz-v3-8s-system.js` and `.css` (CSS prefix `k3s-`), and `SP/vanta/v3r/S/`. Build name `v3r-S`.

## What Josef said
> we have boundary, interconnections, ports & protocols, composition, host & proivders all kind of saying and doing similar things. then we have an element show page? like is that supposed to be a compoennt? and then when i view an element which should be called compoennt and lets say i want ot add software or firmare, i cant. if i want to edit the controls i cant. theres an open in controls button which is stupid. i add controls here. i add requimenets here.

Five menu pages and a read-only "element" page become **one place, System, and one record, the component, on which the work is done.**

## Build
**1. `system`: the list.** Vanta's Inventory shape (`SP/vanta/v3r/ref/tracking-inventory-in-vanta--01.jpg`).
- Header: System; primary Add component; More (Export, Open SSP section 5).
- Tabs: Components (count) · Connections (count).
- Rail: INSIDE THE BOUNDARY: All components, then each subsystem with its count. OUTSIDE THE BOUNDARY: Host system, Providers, Connected systems.
- One or two cards, only if they lead somewhere: the authorization in force and what it covers; needs attention (a component behind its library version, a provider with no authorization, connections without an agreement), each a filter.
- Table: Component (name over what it is, its code), Kind, Software & firmware (count, or current → proposed version), Controls, Requirements, Open findings, Owner. A row opens the component's page.
- View switch List · Boundary. **Boundary** is the bubble Josef described ("whatever is in the bubble is included in the ATO or IATT"): the old Boundary page's drawing, inside this page; a box opens its component, a line its connection. Keep its authorization choice (ATO, Block 1.1, IATT).

**2. `system-connections`.** One row a connection: From, To, Interface, Protocols and ports, Direction, Crosses the boundary, Agreement (and its state). Interconnections and Ports & protocols are this one table: a connection to an outside system carries its agreement, and ports are a connection's rows. A row opens the connection's panel: its facts, Ports and protocols (Add port: protocol, port, direction, PPSM state), Agreement (link a document or evidence, or say none is needed and why), the two components. Add connection.

**3. `component--<code>`: the record.** The same page for the system's root, a subsystem, an LRU, the host system, a provider and a connected system; the tabs it shows depend on its kind.
- Breadcrumb System › its subsystem › it. Title, code, a chip for where it stands (Inside the boundary, Host system, Provider, Connected system). Fact line: owner (assign in place), built from which library component and version. Primary `Add` as a menu: Software or firmware, Hardware, Connection, Controls, Requirement, Component inside. More: Edit component, Remove component.
- Tabs with counts: Overview · Software & firmware · Connections · Controls · Requirements · Findings. A subsystem also has Components (what is inside it, with Add component).
- **Overview:** completion for this component (its objectives with evidence, or its controls satisfied), needs attention as filters into its own tabs, its next step, and Details. "1 version behind: Take version 2" is done **here** (the first V3 sent the reader to Host & providers; the command is the earlier lane W's: `SP/vanta/v3/W/notes.json`, `fact("mc2")`).
- **Software & firmware:** rows the component owns: Item, Kind (Software, Firmware, Hardware), Version, Supplier, SBOM (parts, open CVEs), Baseline (Block 1, Block 1.1 proposed). Add item, edit, remove. The inventory's assets are this component's hardware rows.
- **Connections:** this component's rows of the Connections table, with Add connection (the other end from a picker of components and outside systems).
- **Controls:** the controls placed here: Control, Responsibility (Inherited from F-16 Block 70, Hybrid, This system), Implementation (Written, Not written), Status, Owner; a family rail when there are many. Add controls: the picker over the baseline's controls not yet here. A row opens the control's panel on this component (see MODEL, "What the lanes share"), where its implementation here is written and its responsibility changed. Remove from this component, from the row.
- **Requirements:** the requirements allocated here. Add requirement: the picker over the program's requirements not yet here, its first line Create requirement (statement, the control it maps, chosen from this component's controls). A row opens the requirement's existing panel. Remove allocation.
- **Findings:** open issues, findings and vulnerabilities on this component, each opening its panel.
- A **host or provider** page: Overview (its own authorization and expiry), Controls offered (what it offers, what WS-X90 takes as Inherited or Hybrid, change it here), Connections. A provider with no authorization says so once, on its page and on the controls that lean on it.

**4. Fold.** `boundary`, `interconnections`, `ppsm`, `composition…`, `hosts…`, `inheritance`, `inventory…` and the old record pages (`rec--v7p-el--…`, `rec--v2h-prov--…`, `rec--v8b-ic--…`, `rec--sys-asset--…`) open their new home (a component's page, the Connections tab, the Boundary view). Publish the facts MODEL lists for you.

## It works when (your walk asserts each)
1. System → a subsystem in the rail filters in place → Mission Computer's row → its page, in one click, the program menu still there and System marked.
2. Software & firmware → Add item (Firmware, MC-FW 5.0) → the row is there; the tab's count and System's row follow; edit its version; remove it.
3. Controls → Add controls → choose two → both rows are there and the count follows; open one, write its implementation for this component, close, reopen: it is kept; `fact("componentsOf", code)` includes this component. Remove one.
4. Requirements → Add requirement → Create requirement → it is in the tab, mapped to the control chosen.
5. Connections → Add connection to another component with a protocol and a port → it shows on both components, on System's Connections tab and in the Boundary view. A connection to an outside system with no agreement is counted under needs attention, and linking an agreement clears it.
6. System → Add component (inside Mission Computing Subsystem) → its page opens, empty, each tab offering its Add; it is in the rail's count and the Boundary view.
7. F-16 Block 70's page: what it offers and what WS-X90 takes; change one control from Inherited to Hybrid there, and the component's Controls tab reads the same.
8. Mission Computer → Take version 2 on its own page.
9. Each folded address lands where it should; Back from a component returns to System with the rail choice kept.
10. A created program (lane P's; `SP/vanta/v3/P/walk.mjs` shows how to make one) shows its own components or an empty System with Add component, never WS-X90's.

## Not yours
The control's panel and the baseline (lane C), gates and the Overview (lane O), the Requirements and Findings registers themselves (second wave). Where you need one of them and it is not in your build, fall back as MODEL says.
