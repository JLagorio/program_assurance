# Roles and permissions overview (New Experience)

Source: https://help.drata.com/en/articles/13578465-roles-and-permissions-overview-new-experience
Collection: Settings › Role Administration
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Use this article to understand which role to assign and what access each role provides in the new experience.

## Article text

Admins can assign one or more roles to a user. Each role grants access to specific areas of the workspace.

**Note:** Admins have full read and write access across all areas of the workspace.

## How roles work

- Roles are **predefined access bundles**
- Users can have **multiple roles**
- Access is **additive**
- Some roles provide **read-only or restrictive** access/view

## Roles and descriptions

Use this section to decide **which Drata role best fits a user’s responsibilities**.

**Roles and descriptions table**

The following table outlines general page permissions. It does not include Settings or My Drata pages. Please review the following bullet points for more information.

- 🔒 **Admin-only actions **Only Admins can grant remote access to Drata Support.
- Only **Admin**, I**nformation Security Lead, and Workspace Manager** can grant remote access to the Drata Support team.
- In general, **Organization settings are Admin-only**.
   - However, some settings under the Organization section are accessible to specific roles based on responsibility. These exceptions are intentional:
      - **Workflows: **Accessible to Workspace Managers
      - **Personnel Compliance > Human Resources: **Accessible to Personnel Compliance Managers
      - **Ticket Automation: **Accessible to DevOps Engineers
- **All roles** expect risk register owner can access the **My Drata** page to view their own information and activity.
- **All roles** can access and manage their **personal settings**, such as notifications and language preferences.

| **Role** | **Description** | **Pages Available to Access ** |
|---|---|---|
| Admin | Full access to all areas. Can manage users and roles. | All Pages |
| Access Reviewer | Reviews and validates user access to ensure appropriate permissions and least-privilege access. | Access Reviews page<br>Connections page (Read Only) |
| Control Manager | Maintains controls, supporting evidence, and control-related tasks. | Control page<br>Events page<br>Evidence page<br>Test Library page<br>Monitoring page<br>Tasks (only General, Controls, Evidence Renewals) page |
| DevOps Engineer | Manages technical integrations, monitoring, and infrastructure-related evidence and findings. | Monitoring > Compliance as Code <br>Most of all Connections pages<br>Some parts of Control page<br>Dashboard page<br>Events page<br>Evidence page (Read only)<br>Frameworks page<br>Test Library page<br>Monitoring page |
| Information Security Lead | Manages security posture, controls, evidence, and security reporting across the workspace. | Assets page<br>Monitoring page > Pipeline tab<br>Parts of Connections page<br>Controls page<br>Dashboard page<br>Events page<br>Evidence page<br>Remote access permission<br>Test Library page<br>Monitoring page<br>Personnel page<br>Policies page<br>Parts of Risks pages<br>Task page<br>Vulnerabilities page<br>Vendors page |
| Knowledge Base | Manages and maintains internal knowledge base content and documentation. | Open Knowledge Base |
| Personnel Compliance Manager | Manages personnel-related compliance tasks, employee status, and onboarding and off-boarding workflows. | Personnel page<br>Tasks (only Policy Renewals) page |
| Policy Manager | Creates, updates, publishes, and manages company policies. | Policies page |
| Risk Manager | Manages risk assessments, risk treatment, and ongoing risk management activities. | All the Risks pages<br>Tasks (only General or Risks) page<br>Vendors page |
| Risk Register Owner | Owns and maintains the risk register, including creating, updating, and tracking risks. | Most of all Risks pages<br>Tasks (only General or Risks) page |
| Workspace Manager | Manages day-to-day workspace configuration, including assets, vendors, integrations, and operational setup.<br>⚠️ **The Workspace Manager role cannot be combined with other roles in the same workspace.** | Access Reviews page<br>Assets page<br>Audits page<br>Monitoring page > Pipeline tab<br>Parts of Connections page<br>Controls page<br>Dashboard page<br>Events page<br>Evidences page<br>Monitoring page<br>Personnel page<br>Risks pages (Except pages that manage risk register)<br>Task page<br>Vendor page<br>Vulnerabilities page |
| Internal Auditor | Reviews audit evidence, controls, and compliance status for internal audit purposes. | Audit Hub (only Internal Auditor pages) |
| Trust User | Allows access to SafeBase through SSO links.<br>This role does not grant additional Drata privileges.<br>Note: A user’s SafeBase role will differ from their Drata role because Drata and SafeBase use different RBAC systems. | Allows access to SafeBase through SSO links |

## Role combinations to avoid

Some role combinations should not be assigned to the same person because they can create permission conflicts or reduce separation of duties.

- **Admin + broader admin-style roles:** This combination is typically unnecessary because the Admin role already includes the permissions available through broader administrative access.
- **Workspace Manager + any other role in the same workspace:** The Workspace Manager role cannot be combined with other roles in that same workspace. If Workspace Manager is assigned, the other workspace roles in that workspace are automatically removed.
- **Trust Center Reviewer + Admin / Information Security Lead / Workspace Manager / Trust Center Manager:** This combination should be avoided because the Trust Center Reviewer role may take precedence, which can limit the user to reviewer-only permissions.
- **Control Manager + Internal Auditor:** This combination can create a practical conflict depending on the workflow. In the internal audit experience, Internal Auditors can review evidence and manage requests, but they cannot upload or delete evidence during that phase. If the same person is expected to both manage controls and evidence and act as the internal auditor, it can create confusion or reduce separation between operating the control and reviewing it.

## Related articles

- [Role Administration & RBAC](role-administration-rbac.md)
- [Drata MCP — Setup & Usage Guide](drata-mcp-setup-usage-guide.md)
- [Manage user roles in Drata](manage-user-roles-in-drata.md)
- [Audits page overview (New Experience)](audits-page-overview-new-experience.md)
- [Read-Only and Restricted-View Roles](read-only-and-restricted-view-roles.md)
