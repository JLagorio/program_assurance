# User Permissions by Product Area

Source: https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area
Collection: Team Compliance ; Team Compliance › Managing Users
Fetched: 2026-11-17

## Article text

✅ Feature availability: All plans include standard built-in user roles. Additional scoped roles and custom role-based access controls depend on your plan and enabled features. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
When you're logged in to Vanta, what you can see and do depends on your user role and any object assignments. This article breaks down permissions by product area so you can understand what each role can access and how to give users the right level of access.
 
 

## Getting started
What a user can see and do in Vanta depends on their user role and any object assignments:
- 
Collaborators can only access what they've been assigned to. To be assigned objects in Vanta, users need at least the Collaborator role. Not every product area supports object assignments.
- 
Object assignments can include inherited access—being assigned to a parent object may grant access to its mapped child objects, but not other objects. For example, a Control Owner inherits access to mapped tests and documents as child objects, but not to the framework, risks, or policies the control is mapped to.
- 
Admins and Editors have default access across product areas, and anything that requires Admin privileges is noted. View-only Admins have the same access as Admins but can’t take any actions without being assigned an object.
- 
Scoped roles are built-in roles tied to specific product areas, like Trust Admin or Privacy Manager. They’re available when the related product area or feature is enabled on your plan.
- 
Custom roles let you bundle specific permissions for users across product areas.
- 
Permissions are additive—a user's role and their object assignments work together. For example, a View-only Admin assigned as a Risk Scenario Owner can edit that scenario, even though their user role is view-only by default.
​
📖 Learn more: For details on custom-role based access (RBAC) permissions, see Custom User Roles <https://help.vanta.com/en/articles/11345585-creating-custom-roles>. For a complete list of user roles, see Managing User Roles <https://help.vanta.com/en/articles/11345385-managing-user-roles>.
 
 

## Assets
 

### Collaborators
 
Collaborators can't be granted access to Assets through object assignments. Assigning someone as an owner or group owner on an inventory item tracks responsibility but doesn't grant access.
 

### Editors and Admins
 
Editors and Admins can:
- 
View and manage inventory items and metadata, including bulk actions like tagging, assigning group owners, and updating descriptions.
- 
View, export, and manage code changes.
- 
View, export, refresh, and manage vulnerability monitoring, including deactivating and reopening vulnerabilities.
- 
View security alerts and manage alert monitoring state, including deactivating and reactivating monitoring.
 

### Common scenarios
- 
Assigning someone as an owner or group owner on an inventory item doesn't grant them access to Assets: To give someone access, assign them a role that includes Assets permissions, like Editor or a custom role with the relevant Assets permission sets enabled.
 
 

## Compliance
 

### Collaborators
 
Collaborators can access Compliance through object assignments. Permissions are granted to assigned objects only.
 | 
Object assignment | 
Permissions
 | 
Common Control Owner | 
Manage common control details, owners, control mappings, and comments. Manage all mapped controls.
 | 
Control Owner | 
Manage all mapped tests and documents, with the same permissions as Test and Document Owners, plus the ability to reassign their owners. Access does not extend to mapped policies, frameworks, or risks.
 | 
Test Owner | 
View test results and remediation instructions, create tasks and task automation, download test result data, and comment.
 | 
Document Owner | 
Renew, upload, and submit documents, create tasks, delete prior versions, and comment. Cannot edit the document name or description, assign approvers, or modify control mappings.
 | 
Policy Approver | 
View the policy, comment, view previously approved versions, and view mapped controls and tests. Can approve or request changes when it's their turn in the approval chain. Access reverts to view and comment only once the approval step is complete.
 | 
Information Request Owner | 
Upload evidence, share evidence for internal review, and post internal comments on requests. Owner permissions <https://help.vanta.com/en/articles/11345472-audits-page> setting determines additional auditor collaboration permissions, such as sharing evidence as audit ready or posting auditor comments. Cannot reassign request ownership or edit request metadata. 
 | 
Internal Auditor | 
Upload a request list, add or delete individual requests, edit request metadata, accept or flag requests, and comment on requests and controls. View-only access to population data. Cannot manage evidence, view internal comments, or assign request owners. Auditor permissions  override other permissions they may have within the audit they’re assigned to, such as assigning request owners or sharing evidence.
ℹ️ Note: Frameworks don't support object assignments, meaning Control Owners can't access the framework their control belongs to through that assignment. Framework access requires Audit Limited Editor, Editor, or Admin permissions.
 

### Audit Limited Editors, Editors, and Admins
 
Audit Limited Editors can:
- 
Frameworks: Manage all frameworks across the organization.
- 
Controls: Manage all common controls, controls, and tests across the organization.
- 
Policies: Manage all policies across the organization.
- 
Documents: Manage all documents across the organization.
- 
Audits: Within all audit engagements, assign Information Request Owners, upload evidence, share evidence for internal review, and post internal comments. Manage controls and population data visibility within audits. Cannot edit request metadata, post auditor-facing comments, or share evidence as audit ready (regardless of owner permissions <https://help.vanta.com/en/articles/11345472-audits-page> setting).
- 
Issues: Manage all issues across the organization.
In addition to the above, Editors and Admins can:
- 
Audits: Manage audits from the Audits page, including adding audits and editing audit settings. Collaborate with auditors, including posting auditor-facing comments and marking requests as audit ready (regardless of owner permissions <https://help.vanta.com/en/articles/11345472-audits-page> setting).
- 
Settings: Configure Compliance settings.
Only Admins can:
- 
Documents: Upload documents marked as sensitive and mark or unmark custom documents as sensitive. Configure the global document approval workflow in Compliance settings.
 

### Common scenarios
- 
Give someone access to specific tests or documents only: Assign the Collaborator role and add them as a Test Owner or Document Owner.
- 
Let a Control Owner see mapped policy contents: Control Owners can see which policies are mapped to their control, but Control Owner access doesn't grant access to policy contents. To give them access, assign the Editor role, create a custom role with Policies access, or add them to the policy approval workflow if they specifically need to participate in approvals.
- 
Let someone participate in a policy approval without broader Compliance access: Assign the Collaborator role and add them to the policy's approval chain. They don't need any object ownership or broader Compliance permissions to be a Policy Approver.
- 
Restrict access to sensitive documents to specific people: Mark the document as sensitive. Only Document Owners, Admins, and auditors can access sensitive documents—Editors cannot view or upload sensitive documents.
- 
Give someone access to all information requests in an audit: Assign the Audit Limited Editor role. Unlike an Information Request Owner, who can only manage evidence and comments on requests they're individually assigned to, an Audit Limited Editor can manage all requests, evidence, controls, and population data across audits—without needing to be assigned to each request individually.
 
 

## Customer Trust
 

### Collaborators
 
Collaborators can access Customer Trust through object assignments. Permissions are granted to assigned objects only.
 | 
Object assignment | 
Permissions
 | 
Knowledge Base Resource Owner | 
View the resource and version history, download the file, add a new file version, and modify tags and expiration date.
 | 
Knowledge Base Answer Library Owner | 
View the entry, modify the answer, modify tags and expiration date.
 | 
Questionnaire Owner | 
View and edit the questionnaire, add comments and questions, edit metadata, re-run answer generation, and edit the approver.
 | 
Questionnaire Response Owner | 
View, edit, and comment on an assigned response. Grants view-only access to the entire questionnaire and responses for context.
 

### Commitments Manager
 
Commitments Manager is a scoped role that appears when Customer Commitments is enabled on your plan—it grants Admin-level access within Commitments only.
 
Commitments Managers can:
- 
Commitments: Manage customer commitments, create new commitment types, view citations within commitments, and manage standard commitments.
- 
Contracts: Import contracts, view citations directly in contracts, manage underlying contracts, run contract analysis, and configure CLM integrations within Commitments settings.
 

### Trust Collaborators
 
Trust Collaborator is a scoped role that appears when Customer Trust is enabled on your plan. It grants users access to the following areas of Customer Trust without needing to be assigned to specific objects. You can also assign them the same objects a Collaborator can be assigned.
 
Trust Collaborators can:
- 
Knowledge Base: View the knowledge base across all resources and answer library entries.
- 
Trust Center: View all trust center content and manage external access to your organization's trust center.
- 
Questionnaires: View and edit all questionnaires and use the browser extension, but cannot be assigned as a questionnaire approver.
 

### Trust Admins, Editors, and Admins
 
Trust Admin is a scoped role that appears when Customer Trust is enabled on your plan. It grants Editor-level access within Customer Trust only.
 
Trust Admins, Editors, and Admins can:
- 
Knowledge Base: View and edit the knowledge base across all resources and answer library entries.
- 
Trust Center: Edit the trust center and its settings, including questionnaire settings and integrations. Fulfill trust center data deletion requests.
- 
Questionnaires: View, edit, comment on, and approve all questionnaires, including approving and editing approved answers, marking them complete, and deleting questionnaires. Be assigned as a questionnaire approver.
- 
Commitments: Manage customer commitments, create new commitment types, view citations within commitments, and manage standard commitments.
Only Admins and Commitments Managers can:
- 
Contracts: Import contracts, view citations directly in contracts, manage underlying contracts, run contract analysis, and configure CLM integrations within Commitments settings.
Only Editors and Admins can:
- 
Contracts: Connect CLM integrations from the Integrations page.
Only Admins can:
- 
Contracts: Open linked sources in contract analysis stored in other areas of Vanta, such as controls, policies, tests, documents, and the knowledge base.
 

### Common scenarios
- 
Give someone access to specific questionnaires only: Assign the Collaborator role and add them as a Questionnaire Owner on the relevant questionnaires. Or assign the Trust Collaborator role instead. They'll have default access to view and edit all questionnaires.
- 
Maintain specific knowledge base items only: Assign the Collaborator role and add them as a Resource Owner or Answer Library Owner on the specific items they need to maintain.
- 
Give someone access to approve questionnaires: Assign the Trust Admin role. Questionnaire approval can't be granted to a Collaborator or Trust Collaborator through object assignment.
- 
Give someone access to manage commitments and contracts: Assign the Commitments Manager role.
 
 

## Integrations
 

### Collaborators
 
Collaborators can't be granted access to Integrations through object assignments.
 

### Editors and Admins
 
Editors and Admins can:
- 
View and manage all integrations—except identity provider (IdP) integrations.
Only Admins can:
- 
Connect or manage identity provider (IdP) integrations.
 

### Common scenarios
- 
Give someone access to manage integrations without full Admin access: Assign the Editor role or create a custom role with Integrations set to view and edit. Admin access is only required for identity provider (IdP) integrations.
- 
Give a Collaborator access to a specific integration: Integrations don't support object assignments. To give someone access, assign the Editor role or a custom role with Integrations enabled.
 
 

## Personnel
 

### Collaborators
 
Collaborators can access Personnel through object assignments. Permissions are granted to assigned objects only.
 | 
Object assignment | 
Permissions
 | 
Application Approver | 
View all access requests for their assigned applications and approve or deny them.
 | 
Application Admin | 
View all approved access requests for their assigned applications and mark them as provisioned.
 | 
Application Reviewer | 
Submit an access review for assigned applications—upload access data, review accounts, and add evidence (cannot reassign or export). Access is granted once the review is started (cannot access drafts).
 | 
Deprovisioning Task Owner | 
View assigned deprovisioning tasks and confirm accounts as deprovisioned (cannot reassign owner).
ℹ️ Note: We updated our terminology from System to Application. For example, System Reviewer is now referred to as Application Reviewer.
 
ℹ️ Note: The Security Owner assigned on a vendor profile is automatically assigned as the Application Reviewer for that application when a draft access review is created, and as the Deprovisioning Task Owner for the application’s deprovisioning tasks. You can update those assignments as needed. Learn more
 

### Access Admins, Editors, and Admins
 
Access Admin is a scoped role that appears when Access Management features are enabled on your plan.
 
Access Admins can:
- 
Manage all tabs on the Access page.
- 
Create, start, complete, rename, export, or delete access reviews, and view the to-do list within an access review.
- 
Submit access reviews across all applications—upload access data, review accounts, and add evidence.
- 
Be assigned as Review Owner or Schedule Owner, in addition to Collaborator object assignments.
- 
Assign users as Application Reviewers on access reviews.
- 
View all tabs within Personnel settings and manage settings from the Access Reviews tab.
- 
View the People and Groups tabs on the People page (no access to the Background Checks tab).
- 
View a personnel record and manage the Access tab of the personnel record.
- 
View all tabs on the Computers page.
In addition to the above, Editors and Admins can:
- 
View applications by inherent risk score within an access review (since this requires Vendors access).
- 
Manage all tabs on the People page.
- 
Manage all tabs on the Computers page.
- 
Manage all tabs within Personnel settings.
 

### Common scenarios
- 
Assign someone to own all aspects of Access Management: Assign them the Access Admin role.
- 
Assign someone to approve access requests for specific applications: Assign them the Collaborator role and add them as an Application Approver for those applications.
- 
Assign someone to provision all access requests for a specific application: Assign them the Collaborator role, click Manage Applications from the Requests tab, and add them as an Application Admin to be automatically assigned to access requests for the application.
- 
Assign someone to all deprovisioning tasks for a specific application: Assign them the Collaborator role, go to the Vendors page, and add them as the Security Owner from within the vendor profile to be automatically assigned to deprovisioning tasks for the application.
- 
Assign someone to all access reviews for a specific application: Assign them the Collaborator role, go to the Vendors page, and add them as the Security Owner from within the vendor profile to be automatically assigned to access reviews for the application.
- 
Assign someone to an application within an access review: Assign them the Collaborator role and add them as the Application Reviewer for the application to be assigned to just that access review.
 
 

## Privacy
 

### Collaborators
 
Collaborators can't be granted access to Privacy through object assignments.
 

### Privacy Managers, Editors, and Admins
 
Privacy Manager is a scoped role that appears when a privacy framework is enabled on your plan—it grants Editor-level access within Privacy only.
 
Privacy Managers, Editors, and Admins can:
- 
Create, edit, search, filter, and archive processing activities in data inventory, including linking processing vendors and processors to processing activities.
- 
Create and manage privacy assessments, including impact assessments, and link them to processing activities.
- 
View and export your organization's ROPA.
- 
Manage privacy settings, including custom processing activity fields.
 

### Common scenarios
- 
Give someone access to privacy assessments only: Create a custom role with Data Inventory set to view and edit and Privacy Settings set to no access.
 
 

## Reports
 

### Collaborators
 
Collaborators can access Reports through object assignments. Permissions are granted to assigned objects only.
 | 
Object assignment | 
Permissions
 | 
Report Viewer | 
View the report and its report schedules. Cannot edit the report or share it with other users.
 

### Editors and Admins
 
Editors and Admins can:
- 
View and edit all reports.
- 
Duplicate and customize reports to create custom reports.
- 
Manage access and share reports.
- 
Create, edit, and delete report schedules.
- 
Delete custom reports. 
 

### Common scenarios
- 
Give someone access to one report only: Share the report directly with any user Collaborator or higher. They'll get view-only access to that specific report and can view its schedules, but can't edit the report or share it with other users. Note that reports can't be shared with Employees or Trust Collaborators.
- 
Give someone access to a report schedule: Users must already have access to the report before they can be added to a schedule. Share the report with them first, then add them to the schedule.
 
 

## Risk
 

### Collaborators
 
Collaborators can access Risk through object assignments. Permissions are granted to assigned objects only.
 | 
Object assignment | 
Permissions
 | 
Risk Scenario Viewer | 
View-only access to the risk scenario details and linked tasks.
 | 
Risk Register Viewer | 
View-only access to all risk scenarios and linked tasks in the register. Can search, filter, and export register data, and generate and export risk assessment reports. Cannot be selected as a risk assessment approver.
 | 
Risk Task Owner | 
View and update task details, add notes and upload files, mark complete, send reminders, change the due date, delete the task, and export. Cannot be selected as a risk assessment approver.
 | 
Risk Scenario Owner | 
Edit the scenario, complete risk assessments, create and edit linked tasks, approve risk assessments, reassign, archive, restore, and delete the scenario. Can be selected as a risk assessment approver.
 | 
Risk Scenario Manager | 
Everything a Risk Scenario Owner can do, plus manage who has access to the scenario.
 | 
Risk Register Manager | 
Everything a risk register viewer can do, plus edit scenarios and tasks, add, move, archive, restore, and delete scenarios, and assign Risk Scenario Owners within their register. Can be selected as a risk assessment approver.
 

### Editors and Admins
 
Editors and Admins can:
- 
View all risk registers, scenarios, and tasks across the organization.
- 
Create, rename, delete, and manage access to registers.
- 
Add, assign, move, archive, restore, or delete scenarios across the organization.
- 
Create and manage risk snapshots and reports, including auditor sharing on snapshots.
- 
Configure risk settings, including custom categories, custom fields, risk scoring rubrics, risk matrix color palette, recurring risk assessments, and auditor view.
 

### Common scenarios
- 
Give someone access to a task and its parent risk: Assign them as a task owner and a register viewer on the relevant register.
- 
Give someone access to one specific risk scenario: Assign them as the risk scenario owner on that scenario so they can complete the risk assessment without visibility into other risks.
 
 

## Settings
 

### Collaborators
 
Collaborators and above can access the Notifications, Language, and Interface pages in Settings. These pages are grouped under My Account. Collaborators can't access any other pages in Settings.
 

### Editors and Admins
 
Editors can access most pages in Settings. Pages where Editors have view-only access or no access are noted in the table below:
 | 
Settings page | 
Editor | 
Admin
 | 
Company > Notifications | 
✅ Edit access | 
✅ Edit access
 | 
Company > Information | 
✅ Edit access | 
✅ Edit access
 | 
Company > Billing | 
❌ No access | 
✅ Edit access
 | 
Company > Language | 
✅ Edit access | 
✅ Edit access
 | 
Company > Developer console | 
❌ No access | 
✅ Edit access
 | 
Company > Webhooks | 
❌ No access | 
✅ Edit access
 | 
Company > Tags | 
✅ Edit access | 
✅ Edit access
 | 
Company > AI | 
✅ Edit access | 
✅ Edit access
 | 
Access > User permissions | 
👁️ View-only access | 
✅ Edit access
 | 
Access > Roles | 
👁️ View-only access | 
✅ Edit access
 | 
Access > Teams | 
✅ Edit access | 
✅ Edit access
 | 
Access > Login and security | 
👁️ View-only access | 
✅ Edit access
 | 
Monitoring > Frameworks | 
✅ Edit access | 
✅ Edit access
 | 
Monitoring > SLAs | 
👁️ View-only access | 
✅ Edit access
ℹ️ Note: Pages grouped under Features contain settings for specific product areas. Editors typically have full access to these pages—any exceptions are noted in the relevant product area section of this article.
 

### Common scenarios
- 
Delegate user management without full Admin access: This isn't currently possible—managing users, roles, and user provisioning are Admin-only actions.
- 
Give Employees access to account settings: Employee roles can only access the following My Account pages: Language and Interface.
 
 

## Vendors (TPRM)
 

### Collaborators
 
Collaborators can access Vendors through object assignments. Permissions are granted to assigned objects only.
 | 
Object assignment | 
Permissions
 | 
Business Owner | 
View and edit most of the vendor’s details. Manage all of the vendor’s assessments and the Vanta Exchange access list, including adding their own email to access Vanta Exchange. (Employees can be assigned as Business Owners, but the assignment doesn’t grant access to Vendors.)
 | 
Assessment Owner | 
View and edit most of the vendor’s details. Manage all of the vendor’s assessments and the Vanta Exchange access list, including adding their own email to access Vanta Exchange.
 | 
Security Owner | 
Security Owners must have the Collaborator role or higher, but the assignment doesn’t grant access to Vendors. However, it may grant access to Access Management within Personnel. Learn more
⚠️  Note: Object assignments in Vendors require a TPRM add-on. You can assign the Editor role to grant access to Vendors if you don't have a TPRM add-on.
 

### Editors and Admins
 
Editors and Admins can:
- 
View and manage all vendors on the Vendors page, including assigning object owners, updating vendor status, changing framework or segment scope, and adding, exporting, merging, archiving, and deleting vendors.
- 
View and manage all vendor assessments on the Assessments page.
- 
Open the Vanta Exchange from within an assessment, without being on the access list.
- 
Access the Linked Risk Scenarios tab within a Finding.
- 
Access the Linked Apps, Monitoring, and Subprocessors tabs within a vendor profile.
- 
Access the Discovery tab on the Vendors page.
- 
Access the Overview and Monitoring pages in the Vendors navigation.
- 
View and manage all Vendors settings.
 

### Common scenarios
- 
Give someone access to a specific vendor only: Assign them the Collaborator role and add them as the Vendor Business Owner or Assessment Owner (requires TPRM add-on).
- 
Give someone org-wide Vendors access: Assign the Editor role, or a custom role with Vendors permissions set to view and edit.

## Images

- none
