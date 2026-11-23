# Role Administration & RBAC

Source: https://help.drata.com/en/articles/8319053-role-administration-rbac
Collection: Settings › Role Administration
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Find your assigned roles and learn the available roles.

## Article text

> 💡 Using the new Drata experience? Refer to **[Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md) or [Change or remove a user's role (New experience)](manage-user-roles-in-drata.md)** for updated steps and screenshots.

Drata uses **role-based access control (RBAC)** to assign users access based on their responsibilities. Each role includes a specific set of permissions that determine what features and data a user can access within the Drata application.

## How permissions work

- **Read-only roles** let users view information (and download it where applicable), but they can’t make any changes.
- If a user has **multiple roles**, Drata automatically applies the role with the **highest level of access**, unless otherwise specified.
- The **highest permission level always takes precedence**, ensuring users have the most appropriate access based on their assigned roles.

## Find your assigned role

To find your assigned role:

- Check the email you received with your login credentials, or
- Look for an email with the subject line **“You have been added as”**, which indicates your role and includes additional details.

## Available roles

- **Admins and Guest administrators**. Guest administrators have the same permissions as admins. To learn more, go to [Admins overview](https://help.drata.com/en/articles/8859072-admins-overview).
   - Only Admins have access to the Role Administration page and are the only users who can assign users to roles, change role assignments, or remove users from roles.
- **Information security leads**. To learn more, go to [Information security leads overview](information-security-leads-overview.md).
   - **Note:** If you have assigned the Administrator role to a user, there is no need to also assign the Information security lead role to that same user. Administrators can already do all of the things an Information security lead can do.
- **DevOps Engineer role**. To learn more, go to [DevOps Engineer overview.](devops-engineer-overview.md)
- **Control managers**. To learn more, go to [Control managers overview](control-managers-overview.md).
- Personnel compliance managers. To learn more, go to [Personnel compliance managers overview](personnel-compliance-managers-overview.md).
- **Policy managers**. To learn more, go to [Policy Managers overview](policy-managers-overview.md).
- **Risk managers**. To learn more, go to [Risk managers overview](risk-managers-overview.md).
- **Workspace managers**. To learn more, go to [Workspace managers overview](https://help.drata.com/en/articles/8332694-rbac-workspace-manager-role).
- **Access reviewers**. To learn more, go to [Access reviewers overview](access-reviewer-overview.md).
- **Trust Center manager** (includes a Read-only option). To learn more, go to [Trust Center manager overview](trust-center-managers.md).
- **Trust Center reviewer** (no Read-only option). To learn more, go to [Trust Center reviewer](trust-center-reviewers.md).
   - This role gives targeted access to the Requests tab within Trust Center. Users with this role can view, approve, and deny Trust Center private document access requests. ⚠️ If a user is assigned Admin, Information security lead, Workspace manager, or Trust Center manager role, the Trust Center reviewer role may take precedence, only allowing for Trust Center reviewer permissions.
- **Trust User**
   - Allows access to SafeBase through SSO links.
   - This role does not grant additional Drata privileges.
   - Note: A user’s SafeBase role may differ from their Drata role because Drata and SafeBase use different RBAC systems.

## Roles and Permissions

The sections below specify the permissions for each of Drata’s predefined roles. The ✅ under each role indicates the role has access to the permission.

| **Permission** | **Description** | **Admin** | **Information Security Leads** | **DevOps Engineer** | **Risk Managers** | **Workspace Managers** | **Control Managers** | **Personnel Compliance Managers** | **Policy Managers** |
|---|---|---|---|---|---|---|---|---|---|
| Assets: Assets page | Read lets people view the list of assets and their details. Write lets them edit vendor details and complete report reviews. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Audit Hub: Audit Hub page | Read lets people view the page, which shows all active and completed audits, and download pre-audit packages. There’s no write access. | ✅<br>**Admin** |  |  |  | ✅ **Workspace Managers** |  |  |  |
| Audit Hub: Auditor List page | Read lets people view the Auditor List, which shows auditors your organization has worked with in Drata. Write lets them add or delete auditor profiles from the auditor list. | ✅<br>**Admin** |  |  |  | ✅ **Workspace Managers** |  |  |  |
| Audit Hub: Audit pages | Read lets people view individual audit pages, including requests, assigned auditors, and audit resources. Write lets them assign auditors, work on auditor requests, change request status, and create audits in Audit Hub. Other write permissions are usually required to complete requests. | ✅<br>**Admin** |  |  |  | ✅ **Workspace Managers** |  |  |  |
| Company Settings: Company Info page | Read lets people view the Company Info page. Write lets them edit details. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Company Settings: Key Personnel Info page | Read lets people view the Key Personnel Info page. Write lets them edit details. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Company Settings: Language page | Read lets people view the Language (default) page. Write lets them change it. People can always change their own language setting. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Company Settings: Role Administration page | Read lets people view the Role Administration page. Write lets them assign people to roles. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Company Settings: Human Resources page | Read lets people view the Human Resources page. Write lets them edit details. | ✅<br>**Admin** |  |  |  |  |  | ✅<br>**Personnel Compliance Managers** |  |
| Company Settings: Internal Security page | Read lets people view the Internal Security page. Write lets them edit settings. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Company Settings: Notifications page | Read lets people view the Notifications page. Write lets them create, edit, and delete automated notifications for the organization. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Company Settings: Ticket Automation page | Read lets people view the Ticket Automation page. Write lets them create, edit, and delete ticket rules. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Company Settings: Vendor Questionnaire page | Read lets people view the Vendor Questionnaire page and individual questionnaires. Write lets them create, edit, and delete questionnaires. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Company Settings: API Keys page | Read lets people view the API Keys page and API documentation. Write lets them create new API keys. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Connections: Connections page | Read lets people view the page, which shows active and available connections. Write lets them add, edit and delete connections. | ✅<br>**Admin** |  |  |  | ✅ **Workspace Managers** |  |  |  |
| Connections: Manage Accounts | Read lets people view the connected infrastructure, observability, and version control accounts. Write lets them manage the accounts. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Connections: View Findings | Read lets people view results from the connected vulnerability scanning. Write lets them resync the connected vulnerability scanning. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Controls: Controls page | Read lets people view the Controls page, including all controls and their details. Write lets them edit details, change the scope of controls, create controls, and be assigned as a control owner. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** | ✅<br>**Control Managers** |  |  |
| Dashboard: Dashboard page | Provides the most essential alerts, trends, and tasks needed to give a holistic view of your organization’s risk and compliance posture. There’s no write access. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Event Tracking: Event Tracking page | Read lets people view all events, their details, and download raw evidence. There’s no write access. | ✅<br>**Admin** | ✅ **Information Security Leads** | ✅ **DevOps Engineer** |  | ✅ **Workspace Managers** | ✅<br>**Control Managers** |  |  |
| Evidence Library: Evidence Library page | Read lets people view all evidence uploaded and their details. Write lets them edit details and add evidence to the Evidence Library. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** | ✅<br>**Control Managers** |  |  |
| Frameworks: Frameworks page | Read lets people view the Frameworks page, individual framework pages, requirements, and details. Write lets them modify requirements, change scopes, and create custom frameworks. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Help: Remote access permission | Write lets people grant or revoke remote support access for all personnel in the Help menu. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Monitoring: Monitoring page | Read lets people view the Monitoring page, including all tests, their details, and raw test evidence. Write lets them run tests, manage test notification preferences, and map controls to tests. Mapping controls requires Controls page write permission. | ✅<br>**Admin** | ✅ **Information Security Leads** | ✅ **DevOps Engineer** |  | ✅ **Workspace Managers** | ✅<br>**Control Managers** |  |  |
| My Settings: Notifications page | Read lets people view their notifications. Write lets them turn on/off their notifications. | ✅<br>**Admin** | ✅ **Information Security Leads** | ✅ **DevOps Engineer** | ✅<br>**Risk Managers** | ✅ **Workspace Managers** | ✅<br>**Control Managers** | ✅<br>**Personnel Compliance Managers** | ✅<br>**Policy Managers** |
| My Settings: Language page | Read lets people view their language preference. Write lets them set their language preference. | ✅<br>**Admin** | ✅ **Information Security Leads** |  | ✅<br>**Risk Managers** | ✅ **Workspace Managers** | ✅<br>**Control Managers** | ✅<br>**Personnel Compliance Managers** | ✅<br>**Policy Managers** |
| Personnel: Personnel page | Read lets people view the Personnel page, the personnel list, status, and details. Write lets them edit personnel details and take actions related to personnel. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  | ✅<br>**Personnel Compliance Managers** |  |
| Policy Center: Policy Center page | Read lets people view all policies and download them. Write lets them create policies, edit policies details, take actions based on responsibility, and adjust related notifications in personal settings. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  | ✅<br>**Policy Managers** |
| Quick Start: Quick Start page | At the start of your Drata journey, you will work through each step within the Quick Start Guide in order to prepare to onboard your employees and configure the system for your compliance journey. | ✅<br>**Admin** |  |  |  |  |  |  |  |
| Risk Assessment: Risk Assessment page | Read lets people view status for all assessment sections. Write lets them complete assessments and assign others who also have Risk Assessment page write permission. | ✅<br>**Admin** | ✅ **Information Security Leads** |  | ✅<br>**Risk Managers** | ✅ **Workspace Managers** |  |  |  |
| Risk Management: Risk Management page | Read lets people view risks, insights, and the details of both. Write lets them edit risks, add and treat risks, create tickets, assign risk owners, and map controls to risks. Mapping controls requires Controls page write permission. | ✅<br>**Admin** |  |  | ✅<br>**Risk Managers** | ✅ **Workspace Managers** |  |  |  |
| Security Report: Security Report page | Read lets people view and download the security report to share with potential customers, auditors or board members. Write lets them edit the security report settings and turn on/off sharing of the report. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  |  |  |  |  |
| Tasks: General | Read lets people view general tasks. Write lets people edit details about the task and mark the task complete. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** | ✅<br>**Control Managers** |  |  |
| Tasks: Controls | Read lets people view control tasks. Write lets people edit details about the task and mark the task complete. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** | ✅<br>**Control Managers** |  |  |
| Tasks: Evidence renewals | Read lets people view evidence renewal tasks based on the evidence renewal date. Write lets people manage the evidence itself. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** | ✅<br>**Control Managers** |  |  |
| Tasks: Policy renewals | Read lets people view policy renewal tasks based on the policy renewal date. Write lets people manage the policy itself. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  | ✅<br>**Policy Managers** |
| Tasks: Vendor reminders | Read lets people view vendor reminder tasks based on the reminder date. Write lets people manage the vendor itself. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Trust Center: Trust Center page | Read lets people view the Trust Center page, incoming access requests, and domains that have access. Write lets them manage access requests and domain. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Trust Center: Trust page editor | Write lets people customize the Trust page. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Trust Center: Trust page settings | Read lets people access and view Trust Center settings. Write lets them edit Trust Center settings. | ✅<br>**Admin** | ✅ **Information Security Leads** |  |  | ✅ **Workspace Managers** |  |  |  |
| Vendors: Vendors page | Read lets people view the list of vendors and their details. Write lets them edit vendor details, complete report reviews, and add vendors. | ✅<br>**Admin** | ✅ **Information Security Leads** |  | ✅<br>**Risk Managers** | ✅ **Workspace Managers** |  |  |  |

## Role combinations to avoid

Some role combinations should not be assigned to the same person because they can create permission conflicts or reduce separation of duties.

- **Admin + broader admin-style roles:** This combination is typically unnecessary because the Admin role already includes the permissions available through broader administrative access.
- **Workspace Manager + any other role in the same workspace:** The Workspace Manager role cannot be combined with other roles in that same workspace. If Workspace Manager is assigned, the other workspace roles in that workspace are automatically removed.
- **Trust Center Reviewer + Admin / Information Security Lead / Workspace Manager / Trust Center Manager:** This combination should be avoided because the Trust Center Reviewer role may take precedence, which can limit the user to reviewer-only permissions.
- **Control Manager + Internal Auditor:** This combination can create a practical conflict depending on the workflow. In the internal audit experience, Internal Auditors can review evidence and manage requests, but they cannot upload or delete evidence during that phase. If the same person is expected to both manage controls and evidence and act as the internal auditor, it can create confusion or reduce separation between operating the control and reviewing it.

Want to know more about the Workspace Manager role? Learn more [here](workspace-manager-overview.md).

Want to know more about the Guest Administrator role? Learn more [here](manage-guest-administrators.md).

## Related articles

- [ClickUp Integration Guide](clickup-integration-guide.md)
- [Drata MCP — Setup & Usage Guide](drata-mcp-setup-usage-guide.md)
- [Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md)
- [Manage user roles in Drata](manage-user-roles-in-drata.md)
- [Read-Only and Restricted-View Roles](read-only-and-restricted-view-roles.md)
