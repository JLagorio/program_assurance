# Read-Only and Restricted-View Roles

Source: https://help.drata.com/en/articles/15122885-read-only-and-restricted-view-roles
Collection: Settings › Role Administration
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Use this article to understand how Read-only and Restricted-view roles work, which roles are available, and how to assign them.

## Article text

💡 **New to roles in Drata?** Start with the[Roles and permissions overview](roles-and-permissions-overview-new-experience.md) before reading this article.

---

## How these roles work

Most Drata roles are available in up to three versions: a **base role**, a **Read-only** version, and a **Restricted-view** version. Each is a separate, assignable role — not a toggle or setting on an existing role.

| **Role type** | **What it does** |
|---|---|
| Base role | Full read and write access to all pages available to that role. |
| Read-only | Access to the same pages as the base role, but limited to viewing, filtering, and downloading. Users in this role cannot create, edit, or delete resources. |
| Restricted-view | Access limited to only the items the user owns or is assigned to.<br>Available for Control Manager and Risk Manager only. |

> **ℹ️ Note:** You can assign more than one role to the same user, as long as they are not variant of the same role family. For more information, refer to the following note.

> **⚠️ Known limitation:** Drata currently blocks assigning both the Read-only and Restricted-view variant of the same role (Control Manager or Risk Manager) to a user directly. However, both variants can still be added to a user through IdP group mapping, or may already exist on a user if they were assigned before this restriction was introduced. Because these two variants grant conflicting access — one gives read access to everything, the other limits access to only owned items — a user with both may end up with inconsistent permissions. We recommend reviewing any users with both roles assigned.

## Read-only roles

| **Role** | **What users can do** |
|---|---|
| Read-only Admin | View, filter, and download across the entire application |
| Read-only<br>Access Reviewer | View access reviews and applications |
| Read-only<br>Control Manager | View controls and related evidence |
| Read-only<br>Dev Ops Engineer | View Compliance as Code tasks, test results, and infrastructure findings |
| Read-only<br>Information Security Lead | View security posture, controls, and compliance evidence |
| Read-only Personnel Compliance Manager | View background checks, employee status, and personnel compliance |
| Read-only<br>Policy Manager | View and download policies |
| Read-only Risk Manager | View the risk register and risk details |
| Read-only<br>Risk Register Owner | View risks within the risk registers they own |
| Read-only<br>Trust Center Manager | View Trust Center insights, access requests, and settings |

### Restricted-view roles

| **Role** | **What users can access** |
|---|---|
| Restricted-view<br>Admin Control Manager | Only the controls they own or are assigned to for tasks or required approvals |
| Restricted-view<br>Risk Manager | Only the risks they own or are assigned to for task |

---

## Note for existing users

If your account previously used read-only or restricted access settings through role toggles, those users have been automatically migrated to the corresponding role.

## Related articles

- [Role Administration & RBAC](role-administration-rbac.md)
- [Control managers overview](control-managers-overview.md)
- [Drata MCP — Setup & Usage Guide](drata-mcp-setup-usage-guide.md)
- [Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md)
- [Manage user roles in Drata](manage-user-roles-in-drata.md)
