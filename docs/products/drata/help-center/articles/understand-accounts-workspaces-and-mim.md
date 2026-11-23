# Understand Accounts, Workspaces, and MIM

Source: https://help.drata.com/en/articles/17232884-understand-accounts-workspaces-and-mim
Collection: Getting Started › Workspaces
Updated: 2026-09-30
Fetched: 2026-11-22
Description: Use this article to decide how to represent your organization in Drata before creating or reorganizing Workspaces.

## Article text

A Workspace is a distinct operating and audit environment within your Drata Account. Use Workspaces when different parts of your organization need separate compliance scope, ownership, access, systems, personnel, or audit operations.

A Workspace is not intended to be an arbitrary level in your company hierarchy. You do not need a separate Workspace for every department, product, region, or reporting line. Create a separate Workspace when the separation changes how compliance is operated or audited.

## Understand the levels in Drata

### Account

Your Account represents your company-level relationship with Drata. It is the top-level boundary for your organization and the place where you manage the Drata environment as a whole.

### Workspace

A Workspace represents a specific operating environment within your Account. A Workspace can have its own compliance scope, frameworks, controls, tests, connections, owners, and operating cadence.

Some information can be deliberately linked across Workspaces. Other information remains specific to the Workspace where it was created or configured.

### Multiple-Instance Management (MIM)

Use MIM when you need to manage genuinely separate Drata instances or Accounts. MIM is not the default way to represent departments or business units that should operate within one company-level Account.

## When to use a single Workspace

Use one Workspace when:

- The same team owns the compliance program.
- The same people need access to the same compliance data.
- The same systems and evidence support the applicable frameworks.
- The same controls, tests, and operating cadence apply across the organization.
- Separating the work would create duplication without a meaningful audit or access boundary.

A single Workspace is usually the simplest choice for an organization that is building its first compliance program or operating one centrally managed program.

## When to use multiple Workspaces

Use multiple Workspaces when one or more of these boundaries are important:

- **Audit scope:** different business units, products, or entities are assessed separately.
- **Ownership:** different teams are accountable for operating controls and resolving findings.
- **Access:** users should see or manage only the compliance work for a particular environment.
- **Systems and evidence:** different environments rely on different connections, personnel populations, or evidence sources.
- **Operating cadence:** different groups run compliance activities on different schedules.
- **Customer or regulatory separation:** separate environments must be managed independently even though they belong to the same broader organization.

Create the smallest number of Workspaces that gives you the separation you actually need. More Workspaces increase the number of places where configuration, testing, evidence review, and administration may need to occur.

## When not to use multiple Workspaces

Do not create Workspaces only to represent:

- Every department or reporting line.
- Every product name when the same compliance team operates the program.
- Every geography when the same audit scope and access model apply.
- Temporary project teams.
- Minor differences in how a control is assigned.

If the primary need is reporting, ownership, or filtering—not a separate operating or audit boundary—start with one Workspace and use the appropriate ownership or reporting features instead.

## What can be shared across Workspaces?

Cross-Workspace behavior is intentional rather than universal:

- Controls can be linked across selected Workspaces.
- Control information can be managed across linked controls.
- Policies can be mapped across relevant linked controls.
- Evidence Library evidence can be mapped across relevant controls.
- Test instances and monitoring behavior remain associated with their individual Workspace contexts.
- Other resources may remain Workspace-specific or Account-wide depending on the resource.

## Quick decision guide

| **If you need to…** | **Use…** |
|---|---|
| Represent the company-level Drata environment | Account |
| Separate compliance scope, ownership, access, systems, or audit operations | Workspace |
| Reuse the same control program across selected Workspaces | Linked controls |
| Manage genuinely separate Drata instances or Accounts | MIM |

## Related articles

- [Navigate the Workspaces Dashboard (Beta)](navigate-the-workspaces-dashboard-beta.md)
- [Evidence Overview](evidence-overview.md)
- [Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md)
- [Identify What Can Be Shared Workspace Resources](identify-what-can-be-shared-workspace-resources.md)
- [Hosted Technology Vendors: What to Collect and How Drata Can Help](hosted-technology-vendors-what-to-collect-and-how-drata-can-help.md)
