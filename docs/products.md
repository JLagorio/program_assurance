# Products, configurations and variants

Products are the systems that get assessed. A product (Missile A) has an element tree of subsystems and components that is tracked, broken down and reused; it has configurations that make it slightly different (ground launch, air launch, each with its own launch subsystem); and a variant is what a program makes of a configuration plus the customer's own requirements. The library holds the first two. The third lives in the program, where it is assessed.

## Vocabulary

| Say | Meaning |
| --- | --- |
| **Product** | The stable identity in the library (`products`): code, name, description, active or retired. |
| **Version** | One published or draft state of the product's element tree and configuration membership (`product_revisions`). A published version is immutable; a program pins the exact version it was created from. **New version** copies the current tree and memberships into the next draft. |
| **Element** | One node of the tree in a version (`product_elements`): a subsystem or a component, with the same types as nested systems. An element may be pinned to a component of a published Components library version; its type then follows the component. |
| **Configuration** | A named way the product is built (`product_configurations`, stable across versions). Which elements it includes is explicit membership per version (`product_configuration_elements`); a child is only in a configuration its parent is in. An element that is in one configuration only is that configuration's own subsystem. |
| **Variant** | A program system created from a configuration: the boundary carries `product_revision_id` and `product_configuration_id`, each inherited element carries `product_element_id`. Customer-specific elements sit beside them with no lineage. The product record's **Variants** tab lists them across programs by reading the systems. |

There is no library-level variant record. Customer-specific content stays out of the library and lives where it is assessed; when a customer variant must be reused across programs, save it as a configuration.

## Authoring

`/library/products` is the register; a product's record has a version switcher and four tabs.

- **Structure**: the element tree with Element, Code, Type, Library (the pinned definition and version) and Configurations (the memberships, or "All configurations"). In a draft version the row menu offers Edit, Add subsystem, Add component, Add from library… and Remove; the toolbar adds an element or one from the library. The element sheet carries the identity, a checkbox per active configuration (all ticked by default for a new element; a configuration the parent is not in is disabled; unticking cascades to the elements inside), and the library facts when pinned.
- **Configurations**: code, name, description, member count, variant count and state. New configuration includes every element of a draft version by default; a late configuration can include the missing elements from its row menu; Retire keeps history and stops new variants.
- **Variants**: Program, Variant (the system), Configuration, Version, and inherited versus added element counts.
- **Versions**: every version with Open version.

**Publish version** needs at least one element and one active configuration. **Export OSCAL** on a published version downloads a component-definition (below).

## What a program inherits

Reusable assessed content rides on the Components library. A product is structure plus configuration: a product element pinned to a library component brings that component's claimed control set exactly as Add from library does, seeded into the variant's draft SSP where the control is in the baseline and recorded as a library assignment with per-claim targets.

In the wizard's Systems & components step, **From a product…** picks a published version and one of its active configurations. The members of the configuration become the elements of a new system, parents remapped, library pins kept with the rationale "Inherited from Product vN · Configuration"; the system is named after the product and configuration and typed as a platform; its categorization and program profile are chosen on its sheet like any other system. Inherited elements can be removed (pruning is subtree-wise) and customer-specific elements added anywhere; the review's **From products** section shows inherited, removed and added counts. An existing program adds a variant the same way from the System tab (**From a product…**, then the dialog naming, categorizing and baselining it) through `add_program_system`, which shares `create_program_system` with the wizard.

The server checks the lineage: the version must be published and the product active; the configuration must belong to the product and be active; every inherited element must be in the version and the configuration, once, with its product type, its product pin and its place under its product parent. Lineage columns on `systems` are written only by these commands.

## OSCAL

A published product version exports as an OSCAL 1.2.2 component-definition (`product_component_definition`): `metadata` names the product and version; `components` has one component per element (uuid = the element id; type from the pinned component or the element type; props under `urn:program-assurance:product` carry the element code, type, position, parent, the pinned defined component and its definition code and version; a link `rel="library-version"` points at the library version; `control-implementations` carry the pinned component's claims per catalog, with `implementation-status` and `coverage` props and statement-level claims as `statements`); `capabilities` has one capability per configuration with `incorporates-components` listing its members. The document is built on demand and validated against the pinned NIST schema in `scripts/tests/fixtures/oscal-component-definition-1.2.2.schema.json`. The program's variant is the OSCAL SSP's system; the export does not claim SSP conformance.

## Validation

`npm run test:products` runs `scripts/test-products-backend.mjs` (authoring guards, publish freeze, lineage written only by the command, wizard v3 with pruning and a customer element, rejections without writes, `add_program_system` receipts, `copy_product_revision`, the schema-valid export) and `scripts/test-products.mjs` (the library authoring flow, a wizard variant, the lineage on the program tree, the rails and the Variants tab, and a second variant added post-create) against the local stack with the app on port 8080. `src/lib/product-items.test.ts` covers the item builder and the expansion. Every test record lives in a disposable workspace.
