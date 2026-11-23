# Admins overview

Source: https://help.drata.com/en/articles/13604014-admins-overview
Collection: Settings › Role Administration
Updated: 2026-11-10
Fetched: 2026-11-22

## Article text

## What is the Admin role?

The Admin role is the **highest level of access** in Drata. Admins have unrestricted, full access to every part of the application — no additional roles need to be assigned.

This role is designed for people who are responsible for managing your organization's compliance program in Drata. Typically, this includes your compliance leads, security officers, IT administrators, or anyone who needs to oversee users, settings, connections, and the full compliance workflow.

### Why does the Admin role exist?

Drata is built around role-based access control (RBAC), which means different users have different levels of access depending on their responsibilities. The Admin role sits at the top of that hierarchy — it exists so that a designated set of people in your organization can manage everything: invite users, assign roles, configure settings, run audits, and maintain the full compliance lifecycle without running into access restrictions.

## Admin role: Key facts

| **Key facts** | **Details** |
|---|---|
| **Access level** | Highest — unrestricted access to the entire application |
| **Read-only access** | Only if enabled |
| **Needs other roles assigned** | No — Admin access supersedes all other roles |
| **Can remove themselves** | No — Admins cannot remove themselves from the Admin role |
| **Workspace access** | Automatic access to all workspaces |
| **Who can assign it** | Only existing Admins |

## Admin role and multiple roles: What you need to know

If a user already has one or more roles in Drata (for example, Control Manager and Risk Manager) and you assign them the Admin role, the **Admin role takes over**. Because the Admin role provides unrestricted access to everything, the other roles become redundant. The user will have Admin-level access across the entire application.

There is no need to remove the existing roles — assigning Admin is sufficient to grant full access.

> **⚠️ Important:** If an Admin assigns the Workspace Manager role to themselves, it removes their Admin privileges — blocking them from making further role changes. Another Admin must remove the Workspace Manager role and reassign the appropriate role.

## Actions only Admins can do

The following actions are **exclusively available to Admins**. No other role can perform them:

- **Assign, change, or remove any user role** — including assigning the Admin role itself or read-only/restricted-view roles.
- **Access Role Administration** — the full Role Administration page is Admin-only
- **Access Quick Start** — the Quick Start onboarding page is only visible to Admins
- **Full access to all sections/pages of Organization/Company Settings** — Other roles have limited access to the Settings page.

**Pages accessible to Admin-only (no other role):**

| **New Experience ** | **Where it lives in New Experience** | **General description** |
|---|---|---|
| **Organization details** | Settings → Organization details | Set and update your company's name, address, company size, industry, and other foundational details that Drata uses across your compliance program |
| **Organization details → Key Personnel tab** | Settings → Organization details | Designate the key people in your organization (e.g. CEO, Security Lead, Privacy Officer) that are referenced in compliance frameworks and audit documentation |
| **Language**<br>(org-level) | Settings → Language<br>*Under Organization; Not Personal* | Set the default language for the entire organization within Drata |
| **Role administration** | Settings → Role administration | Assign, change, and remove roles for all users in your organization; configure read-only access and restricted view settings |
| **Personnel compliance → Internal Security tab** | Settings → Personnel compliance | Configure internal security policies and requirements for personnel, such as background check and security training expectations |
| **Notification rules**<br>(org-wide) | Settings → Notification rules | Set up and manage org-wide notification rules that determine when and how users are alerted about compliance events, tasks, and deadlines |
| **Ticket automation** | Settings → Ticket automation | Configure automated ticket creation rules so that compliance tasks and findings are automatically synced to your project management tools (e.g. Jira, Linear) |
| **API keys** | Settings → API keys | Generate and manage API keys that allow external tools and integrations to connect to and interact with your Drata account |
| **Quick Start** | Side navigation (Top page) | A guided checklist of onboarding activities designed to help your organization get up and running in Drata — covering connections, personnel setup, control mapping, and more |

To compare Drata roles, refer to [Drata RBAC Matrix](roles-and-permissions-overview-new-experience.md).

To manage Drata roles, refer to [change or remove Drata roles](manage-user-roles-in-drata.md).

## Related articles

- [Google Workspace Integration Guide](google-workspace-integration-guide.md)
- [Role Administration & RBAC](role-administration-rbac.md)
- [PeopleFluent Integration Guide](peoplefluent-integration-guide.md)
- [Quick Start Guide](quick-start-guide.md)
- [Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md)
