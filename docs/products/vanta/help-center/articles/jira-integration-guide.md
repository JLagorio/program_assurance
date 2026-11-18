# Jira: Integration Guide

Source: https://help.vanta.com/en/articles/14441707-jira-integration-guide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Workflow and Ticketing Tools
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 

## Overview 
Jira is one of Vanta's most powerful and widely used integrations. If your team already lives in Jira, this integration lets you keep working there while Vanta handles the compliance tracking in the background.
Terminology Note: In Jira, work items are called issues (sometimes “tickets”). In Vanta, those Jira issues appear as tasks linked to tests and other workflows. In addition, "projects" has been rebranded to "spaces" in some Atlassian versions. 
Vanta reads issue data from your Jira projects to gather compliance evidence and track remediation progress. It can also create Jira issues and post comments to issues directly from the Vanta platform. Once an issue is resolved in Jira, Vanta automatically reflects that so your engineers never need to log into Vanta to close out compliance work.
 
This integration guide covers Jira Cloud only. 
⚠️ Note: Vanta is rolling out a new Jira connection experience to all customers. If you click Connect and see a Jira listing page with a connection guide that starts with Select features, follow the steps in this guide. If you see a side drawer with a Link Jira window instead, you're still on the earlier experience, so follow the steps in Earlier connection experience below. References to write access in this guide mean the same thing as turning on Task creation.
 
 
Want the fastest way to get started? Go to the Jira Quickstart <https://help.vanta.com/en/articles/14323221-jira-quickstart>! 
 

## What you can do with this integration: 
- 
Pull security issues into Vanta automatically — Tag Jira issues with the security label (or a custom label you configure), and Vanta will automatically import them. This gives you a centralized view of all tracked security work without manual evidence uploads.
- 
Prove SLA compliance to your auditor – Vanta records when each security issue was created and when it was resolved. This lets your auditor verify that security work was completed within your stated SLA, no spreadsheets or screenshots needed.
💡 Tip: If label-based filtering doesn't fit your workflow, you can use Jira Query Language (JQL) instead. When you set your sync filters, select the JQL option for a category (in the new setup flow, it's labeled "Use JQL instead of labels") to write a custom query for identifying issues. This is available for security, incident, offboarding, and vendor procurement task types.
- 
Create Jira issues directly from Vanta tests — When a compliance test fails, you can generate a Jira issue in a few clicks. Vanta pre-populates it with what's failing, which test it relates to and the associated controls, and step-by-step remediation instructions so the assignee has everything they need without back-and-forth.
- 
Automate issue creation with workflows in Vanta — Set up a workflow so that every time a specific test falls into a Failing state, Vanta automatically creates a Jira issue. Vanta checks for existing open issues before creating a new one. If an open, unresolved issue for that test already exists, it will not create a duplicate. 
- 
Track offboarding access issues — When an employee is offboarded, Vanta can track whether an access removal issue exists in Jira and whether it was resolved within your SLA. Vanta links the issue to the departing employee using their email address in the issue title or description. 
- 
Track incident management and resolution — Use Jira to manage your incident response workflow and let Vanta automatically pull in those issues as compliance evidence, helping you prove to auditors that incidents are being addressed and resolved per your policy.
- 
Run access reviews on your Jira accounts — Vanta imports your Jira users, groups, and group memberships so you can match accounts to people, run access reviews, and catch accounts that stay active after someone leaves.
- 
Turn vendor review work into procurement requests — If you have Advanced Vendor Risk Management, Vanta can create a procurement request for each Jira work item your team opens to review a vendor.
- 
Automate ticket creation for document renewals — Set up a single workflow that automatically creates a Jira issue whenever a document is approaching its renewal date or needs remediation. Unlike test-level automation (which is configured per test), document automation applies globally to all documents at once. See Automated Ticket Creation for Documents <https://help.vanta.com/en/articles/14855960-automated-ticket-creation-for-documents> for setup instructions. 

## Connection details: 
 | 
Connection type | 
OAuth
 
Vanta reads issue data from Jira and can create issues if you turn on Task creation. Access reviews and task tracking are always on. Task creation is optional, and Vanta asks for write permissions only if you turn it on. Task creation is required if you want to create Jira issues from Vanta, enable automatic task creation workflows for tests, or enable automated ticket creation for documents. It also enables sprint and epic selection when creating issues. If you're still on the earlier connection experience, you choose Read only or Read and write instead of selecting features.
 | 
Supported products | 
Jira Cloud 
 | 
Who should connect | 
A Jira user with Browse Projects permission on the projects you want to monitor. In the new connection experience, the user also needs the Browse users and groups global permission. If you turn on Task creation, the user also needs Create Issues permission.
 
We recommend using a dedicated service account (e.g., [email protected]) rather than a personal account, since the integration authenticates as this user. If their access is later revoked or their permissions change, the integration will break. A dedicated service account with a real, monitored email inbox protects against this.
 | 
Multiple Jira instances | 
Vanta supports connecting multiple Jira Cloud sites. If your organization uses more than one Jira Cloud instance, you can connect each one separately.
 | 
Estimated setup time | 
10–20 minutes for initial connection; additional time for label and workflow configuration.
 | 
Manual sync | 
If you need to force a resync, reconnect the integration or contact Support. 
 
 

## Jira for Government
Jira for Government (Gov) is a dedicated integration for teams running Jira on Atlassian Government Cloud. Like standard Jira, it's a task management integration first: it pulls in issues as compliance evidence, tracks security work, incidents, offboarding, and vendor procurement tasks, and can create or link Jira issues directly from Vanta. It also syncs Jira user accounts for access reviews. The difference from standard Jira is entirely in how it connects, through Atlassian's government-authorized cloud environment instead of standard Atlassian Cloud, not in what it does once connected.
 
If your organization uses Atlassian Government Cloud, use this integration instead of the standard Jira integration described above. The two are connected, configured, and managed separately, and appear as separate integration cards in Vanta.
 

## What you can do with Jira for Gov
- 
Track security issues as compliance evidence — Tag Jira issues with the security label (or a custom label you configure), and Vanta automatically imports them as tracked tasks.
- 
Track incident management and resolution — Use Jira to manage your incident response workflow and let Vanta pull in those issues as compliance evidence.
- 
Track offboarding access issues — When an employee is offboarded, Vanta can track whether an access removal issue exists in Jira and whether it was resolved within your SLA.
- 
Tag vendor procurement issues — Use task-tracker labels or JQL to identify vendor procurement work for tracking in Vanta.
- 
Create Jira issues directly from Vanta tests — When a compliance test fails, generate a Jira issue pre-populated with what's failing and remediation instructions.
- 
Automate issue creation with workflows — Set up a workflow so that a failing test automatically creates a Jira issue, the same way standard Jira does.
- 
Sync Jira user accounts for access reviews — Vanta tracks Jira for Government accounts on the Access page and reflects offboarding once an account is removed.
All of this works the same way it does in standard Jira Cloud — the same label/JQL configuration, the same status and priority mapping, and the same test coverage, just running against your Atlassian Government Cloud tenant instead.
 

## How Jira for Gov differs from Jira Cloud
 | 
Aspect | 
Jira Cloud | 
Jira for Government
 | 
Hosting | 
Standard Atlassian Cloud | 
Atlassian Government Cloud
 | 
Authentication | 
OAuth 2.0 via Atlassian Cloud | 
OAuth 2.0 via Atlassian Government Cloud
 | 
Multiple sites | 
Supported | 
Supported
ℹ️ Note: User account syncing is not unique to Jira for Government. Standard Jira Cloud syncs the same account data. It's documented in this section because it isn't covered elsewhere in this guide yet, not because it's Gov-specific.
 
 
 

## Connection details 
 | 
Connection type | 
OAuth 2.0 — Vanta reads issue and user account data from Jira for Gov, and can optionally create issues if you grant write access. 
​
Choose access level: 
​
Read-only: Vanta can read user information, projects, and issues for compliance evidence and status tracking, but cannot create Jira issues. 
​
Read and write: Required if you want to create Jira issues from Vanta or enable automatic task creation workflows for tests.
 | 
Supported products | 
Jira on Atlassian Government Cloud
 | 
Who should connect | 
A Jira user with Browse Projects permission on the projects you want to monitor. If you enable write access, the user also needs Create Issues permission. As with standard Jira, we recommend using a dedicated service account rather than a personal account.
 | 
Multiple Jira for Gov instances  | 
Vanta supports connecting multiple Atlassian Government Cloud sites. If your organization uses more than one, you can connect each one separately. Jira Commercial and Jira for Gov connections are separate and not interoperable. If you use both, you'll manage them as distinct connections.
 | 
Estimated setup time | 
10-20 minutes for initial connection; additional time for label and workflow configuration. 
 
 

## Setup guide
 

### Step 1: Connect Jira for Gov in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Jira for Government. It appears as its own integration card, separate from the standard Jira integration.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550405806/82b120bea76d43e31319dadc7d0f/image.png?expires=1794967200&signature=497c590cc2b54ca4a6a60e48140e66e59e9abac1d224d0b850564b27989bb4ff&req=diUiFs1%2BmIlfX%2FMW1HO4zUdRO55Xmx0f5rXaxSmFnCPMt8qcxxfQJiqWvof3%0At6F2mu8tqZyW6GTOynI%3D%0A>
- 
Click Add Jira Credentials. 
- 
In the connection modal, choose your access level: read-only, or read and write.
- 
Click Connect Jira for Government. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550408807/e763e11df13209f7a00ed51dcee2/image.png?expires=1794967200&signature=58efb4180b1ca2f8c46438eba22328a789b646e3a181bfaef8abee314fcda450&req=diUiFs1%2BlYlfXvMW1HO4zd%2BgqcciN7b15%2BQOgv2jYqeClL1aVOh0N%2BrarI4e%0AQ0h8KDIi2bA2%2FvPgl5o%3D%0A>
 

### Step 2: Authorize the connection
- 
You'll be directed to sign in through Atlassian Government Cloud.
- 
Review the requested permissions and click Accept.
- 
Select the correct Atlassian Government Cloud organization from the picker if you have access to more than one. Vanta connects to whichever organization you select here, so double check this if you manage multiple AGC tenants.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550427767/98debe07044f4bcd3f6f5c9fc7cb/image.png?expires=1794967200&signature=637b019d48e95a7d6a4a077f72858b6d1ea11e30efb9582f35793b8130a85d35&req=diUiFs18moZZXvMW1HO4zUGlY7uW%2FSkOfQZe15tKvRamtEpwI4JBCOyeXPvA%0AQLuIlmisRFIc8AtOgMw%3D%0A>
- 
You should see a redirect back to Vanta with Jira for Government showing as Connected.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2550430354/a3fd06a433fe239eda5a65c7bddc/image.png?expires=1794967200&signature=b1a38ee98c6dc95c22f300ca7f59538002ee29e4b4ad8837797a52847c834d08&req=diUiFs19nYJaXfMW1HO4zaR%2FRXiv5ZhW9Tk4rbzpb9Qn4DPi6rwGX3%2BLFzbT%0ABObbQTUIWwLcf%2F7m1eg%3D%0A>
 

### Step 3: Label your security issues in Jira
- 
Vanta tracks any Jira issue labeled security (lowercase) by default, the same as standard Jira. Labels are case-sensitive, so a capitalized variant like Security won't be picked up unless you add it explicitly. Add the security label to any issue you want Vanta to pick up as compliance evidence. To use a different label, go to Vanta > Integrations > Jira for Government > Manage > Task Tracking Labels.
 
 
 
 
 

## Permissions
 
Jira for Gov follows the same least-privilege approach as standard Jira. Read-only access is granted by default; write access is optional and customer-selected.
 

### Read access
By default, Vanta requests read-only access: offline access for refresh tokens, read access to the Jira user directory for account syncing, and read access to Jira issues, projects, and metadata.
 

### Write access
If you enable write access, Vanta also requests write access to Jira work, used for creating and updating issues from Vanta, along with read access to Jira Software board and project metadata. If your Jira project uses Jira Software, Vanta additionally requests read and write access to epics and sprints, used for agile metadata during task creation.
 

## 
 

## What Vanta collects and why 
This section covers the data fields Vanta reads from Jira and why each is collected. For details on how Vanta uses this data within specific workflows including security task tracking, offboarding, and incident management see the use cases and capabilities section.
ℹ️ Note: For the current list of resource types Vanta imports from Jira and the permissions it requests, see the Jira listing on the Integrations page in Vanta. The tables below describe the main fields Vanta uses for compliance tracking.
 

## Data collected 

### Scope - What Vanta monitors 
Vanta reads from all Jira projects the connecting user has Browse Projects permission for. Note that Vanta connects to projects, not boards — if your team works from a board that aggregates issues across multiple projects, Vanta's data collection is scoped to the underlying projects, not the board. 
 
Project scope note: Vanta can pull in matching issues from any Jira projects the connected Jira user can browse. If you want to limit which projects Vanta can read from, restrict that user's Jira project permissions (recommended), or use JQL-based targeting (advanced).
 | 
Data point | 
What Vanta collects | 
Why it’s collected
 | 
Title | 
Issue's summary field | 
Identifies the security issue or task being tracked
 | 
Assignee | 
User assigned to the issue | 
Surfaces ownership of remediation work in Vanta
 | 
Status | 
Current Jira workflow status | 
Determines whether the task is open, in progress, or complete
 | 
Priority | 
Jira's default priority values (Highest, High, Medium, Low, Lowest) OR P0/P1/P2/P3 labels if applied | 
Maps to Vanta's priority tiers for SLA tracking and test reporting
 | 
Tags/labels | 
All labels applied to the issue | 
Used to identify which issues Vanta should track (based on your label configuration)
 | 
Description | 
Issue description/body
  | 
Collected but not prominently displayed in the Vanta UI. Used primarily for specific workflows such as offboarding issue matching.
 | 
Created at  | 
Issue creation timestamp | 
Establishes when the work began on an issue
 | 
Resolution date | 
The date the issue was resolved in Jira | 
Used to determine whether the issue was resolved within your policy's SLA
 | 
Last updated | 
Timestamp of the most recent change to the issue | 
Used for incremental sync–Vanta only re-fetches recently changed issues 
 | 
Project | 
The Jira project the issue belongs to | 
Used to scope data collection and organize tasks in Vanta
Note: Vanta reads issue data from any Jira project the connecting user has access to, subject to your label and project configuration. Data from projects the connecting user cannot access will not appear in Vanta.
 

## What Vanta does not collect or sync
To avoid confusion, the following are explicitly not included in the Vanta and Jira sync:
 | 
Not supported | 
Notes
 | 
Issue comments | 
Vanta doesn’t import Jira comments into Vanta. For Jira attachment-based evidence upload, Vanta may add confirmation comments on the Jira issue. 
 | 
Attachments | 
Not synced (except via the dedicated evidence upload Preview feature)
 | 
Sprint assignments | 
Not read from Jira during sync. However, when creating a new Jira issue from Vanta (with write access enabled), you can assign the issue to a sprint.
 | 
Story points | 
Not collected
 | 
Board or backlog configuration | 
Not collected
 | 
Jira user license or billing data | 
Not collected
 | 
Custom Jira statuses | 
Vanta maps by status category, not status name. Any status in Jira's Done category will be treated as resolved in Vanta, regardless of what you've named it. Statuses in any other category (To Do, In Progress) are treated as not resolved.
 | 
Custom required fields beyond the supported set | 
Vanta will prompt for many required custom fields. If Jira requires a field type Vanta can’t collect, issue creation may still fail. Use a simpler Jira project or adjust Jira field requirements.
 
 

## Prerequisites and readiness checklist 
Before connecting Jira to Vanta, complete every item in this checklist. Skipping these steps is the leading cause of connection failures and permission errors.
 
Who should connect: A Vanta admin, using an Atlassian account that can browse the projects you want Vanta to read. In the new connection experience, the account also needs the Browse users and groups global permission. An Atlassian Organization Admin may need to enable User Installed Apps first, but the connecting account doesn't need Jira admin access.
- 

## Create a service account (strongly recommended)
- 
Create a dedicated service user for the Jira connection (e.g., [email protected]) and grant it the permissions above.
- 
This is a recommended practice, not a hard requirement. Using a dedicated service user protects the integration if the connecting person leaves the company or has their Jira access changed. Use a real, monitored email inbox for the service account. 
​
- 

## Enable User Installed Apps in Atlassian Organization Settings
- 
In admin.atlassian.com:
- 
Select your organization
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2233959222/6e4d06c67a1b1af0307f7b6cc68b/46bdf0b0-dd10-45a1-be86-d49ed09a9723?expires=1794967200&signature=976466298b7639e3473dd65e8cd3ff725d065d2b7c264497be79fe3b809a7592&req=diIkFcB7lINdW%2FMW1HO4zWWMDRAvlY6Hy0TuOtL5qxjguyKwMRQxYLBLeRQ9%0AeGuK%0A>
- 
Expand Apps → Sites, then select your site
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2233959849/1214e30ef8acb76459ce99f3e5e0/4a575cf2-0b2a-4295-bf1a-09c52e2fba89?expires=1794967200&signature=b5c89e38e2c0c418e7fd07edf58f3de957b7d9b46c24209a37c6da0ca576ce8a&req=diIkFcB7lIlbUPMW1HO4zRqluKssCybvJADm5264SxLI6xSSW%2BT31yWIKxnR%0Af5MZ%0A>
- 
Click Connected apps → Settings
- 
Set User Installed Apps to Allowed - (In some versions of Atlassian, this appears as turning off Block user apps)
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2233961301/b43dff30d67200bc1b5ce80b1089/caa23e02-980b-4169-bc10-648bbf2d3787?expires=1794967200&signature=6a094fa75eba893a5b7cbc003fffad4da6881b785c405e5e8e700d24c38df11a&req=diIkFcB4nIJfWPMW1HO4zZumRPcxGg3IYRy9eewFqvY%2FTcATYbBcyb1JqkK9%0A3e2G%0A>
- 
Save
- 
Why this matters: If User Installed Apps is not enabled, the Accept button during the OAuth flow will be greyed out and the connection cannot be completed. This setting requires Atlassian Organization Admin access.
- 
Note: Navigation options may vary depending on your Atlassian version. The goal is to locate Connected Apps → Settings under your organization's site. For example, if you’re on Atlassian’s improved user management experience, go to Products → Select your site → Connected apps → Settings instead.
​
- 

## Grant Jira permissions - connecting user 
- 
Permissions vary by project type. To identify your project type, check the Type column on the Projects page in Jira.
Note: Terminology has evolved at Atlassian and these may be referred to as "Spaces" in some versions. 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2233971676/78013ac5a6aea15be902fff3d479/c361fa1e-e4f3-4b99-bf0d-ce36eb5c1e04?expires=1794967200&signature=89c9e3434f4813d19e31699895c5f287b53a6c5fd1eb8b0c3d09b420b697aa7a&req=diIkFcB5nIdYX%2FMW1HO4zV%2FPH%2B4z0tqHmRi%2BtdCxp4fmx7YqyQqhIShAxX%2F%2B%0AB0FFO58rckDJursP3%2Bk%3D%0A>
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2233970277/9036b734fdc5774cb9a79e7acb41/53bc94b1-65dc-43bd-8549-80419f2d6061?expires=1794967200&signature=4431420dc66b1673d5d6ec9d4fbaf6ac06fdeb61349007d2d53c6ff5d7096520&req=diIkFcB5nYNYXvMW1HO4zaqRWT6hz%2FpoanE2XMYmR0CxNOe%2BOnfH0g3SeRAl%0AG23g3rVPB8A3uZHyQRw%3D%0A>
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2233970623/f716238c33a4938de0e947f3b415/c26e41a1-d161-4249-b864-5def60979e1a?expires=1794967200&signature=841f085e298a82e436dda956bcedcd01268a7acdecb5db75557247d0b04ba956&req=diIkFcB5nYddWvMW1HO4za5WVfBdtuCenBKD2qxdU1Q53maEI6ZNUHYTbyc%2B%0AEzgBlEz69hP0R0LqRl8%3D%0A>
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2233970961/72dbec05863eaa920b78ec798fbf/20de7207-db85-48c5-93dc-5c8d7e598894?expires=1794967200&signature=73534181f6c2c98c08d684341674c5701229c2b39817919cf60d2b959b5b7bd6&req=diIkFcB5nYhZWPMW1HO4zXiNISrJ3agL2btCN3bI6SkFWeT9x0bTrmlE9kJc%0AKz%2Fdl%2Fsa1qf7dJ67g8E%3D%0A>

### Global permission 
When you choose your Jira site, Vanta checks that the connecting account has the Browse users and groups global permission. Without it, setup stops with a message asking you to grant the permission. Vanta uses it to import your Jira users and groups for access reviews.

### 

### Company-managed projects
Grant the following at Project’s (Space's) Settings → Permissions:
 | 
Permission | 
Required for
 | 
Browse projects  | 
Reading issue data (required)
 | 
Create issues | 
Creating issues from Vanta (required for write features)
 | 
Assign issues | 
Assigning issues from Vanta (required for write features)
 | 
Assignable user | 
Appearing as an assignee option in Vanta (required for write features)
 | 
Modify reporter | 
Selecting a reporter when creating issues from Vanta (optional — if the connecting user lacks this permission, the Reporter field will not appear in the issue creation modal)
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2233995021/b5d5fb2f9d90eb70fbe5799c91ba/27ce66b2-e962-4427-ad0d-214bb58e8008?expires=1794967200&signature=66312c150acc24339b77081045aaa6d09c09a233b12d1aa8dafdb2599af718c6&req=diIkFcB3mIFdWPMW1HO4zVvaw3on5W1y0zewIpxy%2B%2BDqkP3kmSMzikAuebYN%0Albd2DWrNdVoY9IQW%2FqE%3D%0A>
 

### Team-managed projects 
Add the connecting user to the project with the appropriate role in Project’s (Space's) settings → Access:
 | 
Role | 
What Vanta can do
 | 
Member | 
Read data and create/assign issues (recommended)
 | 
Viewer | 
Read data only
Vanta cannot create issues
Note: Vanta can connect with Browse Projects permission alone. Create Issues, Assign Issues, and Assignable User are only required if you want to create and assign issues from Vanta's test pages.
 

## Readiness Checklist - quick reference
- 
You have Vanta administrator access.
- 
User Installed Apps is set to Allowed in Atlassian admin.
- 
The connecting Jira user has Browse Projects permission on all projects Vanta should monitor.
- 
(New connection experience) The connecting Jira user has the Browse users and groups global permission.
- 
(If you turn on Task creation) The connecting Jira user Create Issues, Assign Issues, and Assignable User permissions.
- 
(Optional) A dedicated service account has been created and granted the required permissions.
- 
You know which project type(s) you are connecting (company-managed vs. team-managed).
 
 

## Setup Guide
Here are the steps to get connected. These steps cover the new connection experience. If you see the earlier side drawer instead, use Earlier connection experience below.
 

## Step 1: Connect Jira in Vanta 
- 
In Vanta, go to the Integrations page, click Add integration, and search for Jira. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.  This opens the connection guide.
- 
On the Select features screen, access reviews are always on. Choose what else you want Vanta to do with Jira. Vanta requests only the permissions those features need.
- 
Task tracking: Track the Jira work items your team uses for security and incident work, and whether they're resolved within your SLAs.
- 
Task creation: Create Jira work items from Vanta to track remediation work. Turn this on if you want to create Jira issues from Vanta tests or use automated ticket creation. Vanta asks for write permissions only if it's on.
- 
Click Save.  
 

### How to find your Atlassian site URL: 
Note: You may have a different version of Atlassian which may cause variation in the following setup steps or website screenshots.
- 
Click on the 4-square icon in Atlassian.
- 
Expand Jira.
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234124363/729129be5c5405da22ffd2ba6533/c17713c6-79be-41ea-9ec2-8888bf63c09a?expires=1794967200&signature=520654d47201977caba0b80a27f7d66e5da1dcf21af74537503ce761eb537f8c&req=diIkEsh8mYJZWvMW1HO4zbFcxpxrh4PjE8%2Frxws9Abj7wcV752hoARYmHh3t%0Ax0OL%0A>
- 
Select the organization you want to connect.
- 
That brings you to Jira. The URL there contains the site URL needed for the connection modal in Vanta.
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234125678/bf8569462528df657599265ae535/7430a43b-2418-4db0-9fe5-3a5bccded011?expires=1794967200&signature=42260c177a453f849d32aae2eb32275a03b8c790d3b5e813b4db35ef00964fb0&req=diIkEsh8mIdYUfMW1HO4zX2mRM6zHlWIdgJ87lVBaF1DKAlNrIZQcC6sZFA9%0Axsgg%0A>
 

## Step 2: Set up procurement requests (Advanced Vender Risk Management only)
If you have Advanced Vendor Risk Management, Vanta asks whether to turn Jira work items for vendor reviews into procurement requests. If you don't see this screen, continue to Step 3.
- 
Toggle on Create procurement requests from Jira work items. Vanta creates a procurement request for each work item that matches the labels or JQL query you set. This is off by default, and you can change it any time after connecting.
- 
Click Save.
 

## Step 3: Sign into Atlassian
- 
Click Connect. 
- 
Vanta sends you to Atlassian. 
- 
Sign in, select your Jira site in the Install app on dropdown, and review the permissions Vanta requests. 
- 
Click Accept. Atlassian returns you to Vanta automatically.
ℹ️ Note : 
- 
If the Accept button is greyed out, make sure you've enabled User Installed Apps in Atlassian Organization Settings, then retry. 
- 
If you manage multiple Atlassian sites, make sure you authorize the correct one.
 

## Step 4: Choose your Jira site 
Each connection monitors one Jira site. To monitor more than one site, add each as a separate Jira connection.
- 
In Jira site, select the site you want Vanta to monitor, then click Save. 
- 
If Vanta says the connected account can't browse users, groups, or projects on that site, grant the missing permission (see Prerequisites) or choose another site.
 

## Step 5: Set sync filters
Choose which Jira work items Vanta tracks in the projects your Atlassian account can browse, including matching work items created later. For each category, Vanta tracks the work items that match any of the labels or the JQL you set.
- 
Security, Incident management, and Incident resolution each need at least one label or a JQL query. Vanta suggests security, incident-management, and incident-resolution, or you can type your own.
- 
Access offboarding is optional. Leave it empty to skip it.
- 
Vendor procurement appears only if you turned on procurement requests in Step 2.
- 
Labels are case-sensitive and can't contain spaces, quotes, or backslashes. A label entered as Security won't match security.
- 
To use JQL instead, select Use JQL instead of labels for that category and enter a query, for example labels = "security" OR priority = Highest. Leave out ORDER BY. Vanta sorts results itself and won't save a query that includes it.
- 
Click Save. You'll leave the connection guide and see You're connected. 
 

## Step 6: Label your security issues in Jira 
Vanta tracks Jira issues that carry the labels you entered at Set sync filters in Step 5. Labels are case-sensitive, so add the label to your Jira issues exactly as you entered it. If you connected using the earlier experience, Vanta also tracks issues labeled security or Security by default.
- 
Open an issue in Jira.
- 
In the Labels field, add your security label (for example, security).
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234308800/311a8bdf6f352cd1879ccc4848d9/5e6d08bd-4436-4868-b2c2-f39b54d1bed4?expires=1794967200&signature=247783a32e7383da013e8d00b516e66edcda57d32a279f3de5f2823d169a3b34&req=diIkEsp%2BlYlfWfMW1HO4zWNr%2FMgFy1kLL4JON4Iz%2Bv2v6NFLige8P6BgooXR%0AK7Pz%0A>
- 
Repeat for any other issues you want Vanta to track.
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234310675/ba31e173ae56970f2bf15de734e6/00cb4c20-59ca-48fc-82d0-65278216e8d8?expires=1794967200&signature=e2e4dfc133b66c73e67db363e8243f8c78317b49fb28eb0cab59fb3d6c2ff1ac&req=diIkEsp%2FnYdYXPMW1HO4za4VXfkBATf0uPqo%2FJI8duH2sWh6dUuk2svThLOJ%0A8QAP%0A>
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234310428/9fa382dd02fb2ce7693eb58fd769/6223506c-0304-4708-9c35-0ebeee57b113?expires=1794967200&signature=00268b0c509544a818ba73daf98e108f52b2fec2e2a4b9837d96623b40c885dd&req=diIkEsp%2FnYVdUfMW1HO4zXNtlqrBVyQnOJqWaFeLWk5RaRsmTV1iSV2VVJtc%0ARkGM%0A>
 | 
Tip: You can add the security label to issues in bulk using Jira's bulk edit feature. You can also add it to new issues going forward as part of your team's workflow.
Need to change your labels? In the new experience, edit your connection (see "Edit your Jira connection" below). In the earlier experience, go to Vanta → Integrations → Jira → Manage → Task Tracking Labels.
 

### Labels vs. JQL
Most teams should start with labels: add a label like security to the Jira issues you want Vanta to track, and configure that same label in Vanta.
 
If you need more control (for example, to filter by issue type or custom fields within your selected project), you can use a JQL rule instead of labels.
 
Example JQLs:
- 
Only Bugs: issuetype = Bug
- 
Bugs with a label: issuetype = Bug AND labels = security
- 
By priority: priority = High AND labels = security
- 
Leave out ORDER BY. Vanta sorts results itself.
 

## Step 7: Verify tasks are appearing in Vanta
- 
In Vanta, navigate to Tests and filter the All resource monitoring tab by integration. 
- 
Select Jira as the integration filter.
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234315058/3e390fa251eac7889a5413e21aac/76113153-560d-4092-9489-c61780ef8632?expires=1794967200&signature=0c8eb29405a3e5d1bce33880441d66e6c711f770cdd9ce7354af892b6c927f16&req=diIkEsp%2FmIFaUfMW1HO4zWOCqgXR5Qbrj%2BbIz8ux5%2FDtKaIlzkRbSiWmJDPZ%0ApfW8%0A>
- 
Then click on any security-related test that appears (e.g. a test that tracks whether security issues are resolved within your SLA).
- 
You’ll land on the results tab by default. 
- 
If Jira issues with your configured label are being pulled in, you’ll see them listed under a header like “{18} issues need remediation." 
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234316093/f2a0c97207609c5cee0c0e33ad55/d4d6c823-7395-4acd-8849-62bbd832803e?expires=1794967200&signature=bbc417bfb19c209a8228f467c00145373e56649287eea4920e8044b7d5a9884f&req=diIkEsp%2Fm4FWWvMW1HO4zWSEN%2BeESUA4PLRMYTwOEJab2aTjz3NEA5rwjjtt%0ARFOw%0A>
[image 20]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234315878/1317da8a48eec6e51ea11185f093/bd618164-4a5b-4b6f-8d1a-fa08b759ef1b?expires=1794967200&signature=fb28ae4d8c068020276cbbd99f623e76afd63dabe0407df09d0ffd9135338042&req=diIkEsp%2FmIlYUfMW1HO4zfrBYTN%2FyY2hpVzPALAePyAzKRQ9azbuEJg%2FdIq4%0AyP9q%0A>
Don't see anything yet? Sync is not instant. Most issues appear within 1-2 hours of connecting, though it can take longer for very large Jira instances.
Notes:
- 
Vanta pulls matching issues across any Jira projects the connected user can browse. To limit scope, restrict that user’s Jira project permissions or use JQL targeting.
- 
If a project you expect is missing: Either the connecting user does not have Browse Projects permission for that project, or it was added to Jira after the connection was established. Reconnecting the integration will refresh the project list.
- 
If no data appears after the initial sync window: Confirm the connecting user has Browse Projects permission for the expected projects and that those projects contain issues with your configured labels. See the troubleshooting section for a full diagnostic guide.
 

## Edit your connection
You can change a Jira connection's features, site, and sync filters at any time.
- 
In Vanta, go to Integrations and open Jira from your connected integrations.
- 
Open the Settings tab and find the connection you want to change.
- 
Click the three dots next to the connection, then click Edit.
- 
Vanta walks you through the setup steps again: Select features, Choose your Jira site, and Set sync filters. Update whatever you need.
- 
Click Save.
⚠️ Note: Editing a connection takes you back through the setup steps, and your previous selections may not carry over. Review each step before you save to confirm the values are what you want.
If you connected with Task creation off and later want to turn it on, edit the connection and complete the setup steps again. Because Task creation needs additional Atlassian permissions, you'll be asked to sign in to Atlassian and approve access again.
 
 

## Earlier connection experience
If you click Connect and see a side drawer with a Connected Jira Credentials window instead of a Jira listing page, use the steps below. Vanta is rolling out the new connection experience to all customers, and these steps will be removed from this guide once the rollout is complete.
 

### Step 1: Connect Jira in Vanta
- 
Go to Integrations, click Add integration, and search for Jira. 
- 
Click Connect, then click Add Jira Credentials. 
- 
In the Link Jira window, choose your access level: 
- 
Read and write (recommended): lets you create Jira issues from Vanta tests. 
- 
Read only: Vanta monitors existing Jira issues but can't create new ones.
- 
Enter your Atlassian site URL. To find it, click the 4-square icon in Atlassian, expand Jira, and select your organization. The URL in your browser is your site URL. 
- 
Click Connect Jira.

### Step 2: Authorize the connection
- 
On the Atlassian screen, make sure the correct organization is selected in the Use app on dropdown.
- 
Review the requested permissions and click Accept.
- 
Atlassian returns you to Vanta, where Jira shows as Connected.
When you're connected, continue with Step 6 (label your security issues in Jira) above.
 
 
 
 

## Verification and validation 
After setup, confirm the following to verify and validate that the integration is connected. 
 
Note: allow time for the initial sync before checking. The first sync may take several minutes depending on the number of Jira issues.
- 
Integration is active — In Vanta, go to your Integrations page and confirm Jira shows a Connected status. If the status shows as Disconnected, verify that the connecting user's Jira access has not been revoked and that User Installed Apps is still enabled in Atlassian admin.
- 
Security tasks are pulling in — Open a security test in Vanta and go to the Tasks tab. Jira issues with your configured label should appear as linked tasks.
- 
Issue creation works (requires write access) — From any failing test, go to the Tasks tab and create a Jira issue. Confirm it appears in your target Jira project with the test name in the summary and remediation instructions in the description. If you see a prompt to enable write access instead, the integration was connected in read-only mode — reconnect with write access enabled.
- 
Status syncs back — Resolve an issue in Jira (move it to a status in the Done category). After the next sync cycle (typically within 30–60 minutes), confirm its status has updated to resolved in Vanta.
- 
Automation is active (if configured) — Tests with active workflows show an Automated workflow button (with a bolt icon) in the test detail page header, under the Task automation metadata label. If automatic issue creation fails, Vanta displays a warning: "There was an error creating a Jira task. Contact support for help." This can happen if the connecting user's permissions have changed, the target project was deleted, or required fields were added after the workflow was configured.
 
 

## Use cases and capabilities
This section covers each Jira integration use case: what it does, how it works, and how to configure it. Shared behaviors (how Vanta reads status, determines resolution, and maps priority) are defined once in the quick reference section below and apply across all use cases. 
 

## Quick reference
 | 
Use case | 
What it does | 
Key requirement 
 | 
Security task tracking | 
Pulls labeled Jira issues into Vanta as compliance evidence | 
Issues must carry your configured label (default: security)
 | 
Manual issue creation | 
Create Jira issues from failing tests with pre-populated context | 
Write access enabled on the Jira connection
 | 
Automatic issue creation | 
Auto-creates a Jira issue when tests fail | 
Write access + workflow configured per test
 | 
Automated document renewal ticketing | 
Auto-creates a Jira issue when documents are due soon or overdue | 
Write access + workflow enabled in Document hub settings 
 | 
Offboarding access tracking | 
Tracks whether access removal issues exist and are resolved within SLA | 
Departing employee’s email in issue title or description
 | 
Incident management tracking | 
Tracks incident management and resolution issues as compliance evidence | 
Issues must carry your configured incident labels

## Reference: How Vanta reads Jira data 
These behaviors apply to all use cases. They are defined here once and referenced throughout. 
 

## How Vanta determines an issue is resolved
Vanta marks an issue as resolved if either of the following is true:
- 
The issue has a Resolution Date set in Jira, or
- 
The issue's status category is Done
Either condition is sufficient. A custom status like Verified and Closed will be treated as resolved as long as its category is set to Done in your Jira workflow configuration.
 

## How Vanta maps Jira status
Vanta reads the status category assigned to your Jira issue (not the custom status name) and maps it to one of these display statuses:
 | 
Jira status category | 
Examples | 
Vanta task status
 | 
To Do | 
Open, Backlog, To Do | 
Open
 | 
In Progress | 
In Progress, In Review, In Development | 
In progress
 | 
Done | 
Done, Closed, Resolved (or issue has a Resolution Date) | 
Completed 
Why this matters: Jira lets you create unlimited custom workflow statuses, but every status must belong to one of three categories: To Do, In Progress, or Done. Vanta maps from the category, not the name. This way, a custom status like "Awaiting QA" maps to "In progress" as long as it's assigned to the In Progress category in your Jira workflow settings.
 
Note: The "In progress" status in Vanta only appears for Jira-linked tasks. Native Vanta tasks show only Open or Completed.
 
If a custom status isn't mapping correctly, go to Jira → Project Settings → Workflow and confirm the category assignment for that status.
 

## Universal status behaviors for all use cases
Regardless of which use case you're using, the following behaviors apply: 
- 
Status reflects automatically. When an issue is resolved in Jira, Vanta picks this up on the next sync cycle and marks the associated task as completed, no action needed in Vanta.
- 
Regression is handled. If a resolved issue regresses and the test fails again, Vanta surfaces it. If you have automatic issue creation configured, a new Jira issue is created automatically.
- 
No duplicates. Vanta will never create a new issue if an open, unresolved linked issue for that test already exists at the test level.
 

## How Vanta determines priority 
Vanta checks for priority in the following order: 
- 
Jira’s default priority field: if a standard Jira priority value is present, Vanta uses this fixed mapping (see chart below). 
- 
P0–P3 labels: if no default Jira priority value is present, Vanta checks for a P0, P1, P2, or P3 label in the issue's Labels field as a fallback. Note: P4 is only available through the default priority field mapping; the label-based fallback supports P0 through P3 only.
- 
Unrecognized priority names — custom priority names (e.g., "P1 - Critical" or "Urgent") are not recognized and will return null, even if the Jira priority field appears filled. To fix:
- 
Option 1: Rename your Jira priority values to match the default names above
- 
Option 2: Use a Jira Automation rule to automatically add a P0–P3 label when a custom priority is assigned (e.g., "If Priority = Critical, then add label p0")
 | 
Jira priority | 
Vanta priority
 | 
Highest | 
P0
 | 
High | 
P1
 | 
Medium | 
P2
 | 
Low | 
P3
 | 
Lowest | 
P4
The mapping is fixed and cannot be customized in Vanta. 
 

## How SLA is calculated
Vanta measures SLA compliance using two timestamps pulled directly from Jira:
- 
Created At — when the issue was created in Jira
- 
Resolution Date — when the issue was resolved
The elapsed time between these two timestamps is compared against the SLA timeframe defined in your Vanta SLA settings.
Important: Vanta evaluates whether the issue was resolved within the SLA window — not whether active work happened during that time. An issue created on day 1 but not worked on until day 28 of a 30-day SLA will still show as SLA-compliant if resolved by day 30. Conversely, an issue that remains open on day 31 will show as SLA-breached regardless of how much work was done.

## Security task tracking
Vanta monitors your Jira projects for issues carrying a specific label and surfaces them as security tasks within your test results. This is the core compliance use case for the Jira integration.
 

### How Vanta identifies security tasks:
By default, Vanta tracks Jira issues with the security label. You can configure a custom label or multiple labels in Vanta's Task Tracking Labels settings. Vanta only tracks issues that carry a recognized label — issues without a matching label are ignored regardless of project or content.
 
[image 21]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234339870/f2a6bfd8affde6d2e36378807237/d139df57-3146-4d1c-9426-88da2826c025?expires=1794967200&signature=2aa378d128e664ef96a0840e3252451b27fb2c9be7ed03ed32d1951d332b3ae8&req=diIkEsp9lIlYWfMW1HO4zTizZ7ID%2B8AWMSI2QULTC4fosTujnDZz%2BaNK71LU%0AaZ0EFBivjcfQ%2B2brpUA%3D%0A>
 
To change your configured label: 
- 
Go to the Integrations page in Vanta
- 
Search for Jira and click View Details. 
- 
Then click Manage. 
[image 22]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234340539/18db4160597069b3c07e1fd8597e/5dffbeb3-0964-44a9-87ae-c20fcf85348c?expires=1794967200&signature=a5f287490c28430d572154ecf03f526a7a84816848bfd0a34bb2d12d01a4ac96&req=diIkEsp6nYRcUPMW1HO4zX1TcOI9NU%2BAFH5wPBjOJn9kvyXJGYmSB1Ci6Vy6%0ANj%2FH%0A>
- 
Then click Task Tracking labels.
[image 23]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234340941/5cad2790fd8942f822bdf11a8d75/a02aa136-cafd-4ad2-962d-7ac591db0821?expires=1794967200&signature=0818773b6215925a2423e4d86eeb33d82702b95cd1943a000bb71a2b11707968&req=diIkEsp6nYhbWPMW1HO4zbLfxnGsHU%2Bk6Fu5XIbDPUQLY4qjCpVuMnMunMMh%0AV%2FDr%0A>
- 
In the modal, enter all labels you want Vanta to use to track security issues. 
- 
Click Save. 
Where tasks appear in Vanta: 
- 
Security tasks linked to Jira issues appear in the Tasks tab on the relevant test page.

### 
 

## Manual issue creation from tests
When you create a Jira issue from a Vanta test page, Vanta pre-populates it with the context needed for the assignee to act immediately. 
 

## What Vanta populates at creation:
- 
Summary: the name of the failing test
- 
Description: what's failing, remediation instructions, and up to 10 failing resources
- 
A link back to the Vanta test
- 
Assignee (if selected)
- 
Project (based on your selection)

## Creation options:
- 
One issue for the entire test
- 
Individual issues per failing item within a test

## How to create an issue from Vanta: 
- 
Navigate to the test detail page for the failing test and open the Tasks tab. 
- 
Click the Create task button. A modal will open. 
- 
Select your Jira connection (if you have multiple Jira credentials connected). 
- 
Choose the Project where the issue should be created. 
- 
Choose the Issue Type (e.g. Bug, Task, Story). 
- 
Optionally set an Assignee, Reporter, Due Date, and (if available for your Jira project) Epic and Sprint.
- 
The summary and description are pre-populated by Vanta based on the failing test details. 
- 
Click Create. Vanta creates the issue in Jira and links it back to the test in Vanta. 
- 
On success, a confirmation toast appears. The new issue will appear in the Tasks tab with a link to the Jira issue. 
Note: If your organization has Jira Software access, Epic and Sprint fields will be available during issue creation. If not, a banner explains that those fields require Jira Software permissions.
Fields not currently supported in Vanta’s Jira task creation: 
- 
Story points
- 
Any Jira fields that are required in your Jira project but not supported in Vanta’s creation form (in those cases, Jira may block creation)
Reporter note: By default, Jira sets the reporter to the Jira user that connected the integration. If you want to choose a different reporter, the connected Jira user needs the MODIFY_REPORTER permission in the relevant Jira projects. If the connecting user lacks this permission on a given project, the Reporter field will not appear in the creation modal.
 

## Automatic issue creation
 
Vanta can create Jira issues automatically when tests fail with no manual action required after initial configuration.
 

### How to set up automatic issue creation
- 
Navigate to the test you want to automate in Vanta.
- 
Select the Tasks tab within the test.
- 
Click the automated setup button.
- 
Configure the following fields: project, issue type, assignee, and optionally epic and sprint (if available, these require Jira Software and may not appear for all project types).
- 
Save the workflow.

### Trigger condition
An issue is created automatically when all of the following are true:
- 
The test is in a Failing state (automation does not trigger on Needs Attention tests).
- 
No open, unresolved Jira issue linked to that test already exists at the test level.
If an open linked issue exists at the test level, Vanta does not create a duplicate. It waits until the existing issue is resolved or deleted before creating a new one if the test fails again.
 
Entity-level vs test-level: If open issues exist but are all linked to individual failing resources within the test (not to the test itself), Vanta will still create a new issue at the test level.
 
A new issue is also created if a previously linked issue is deleted in Jira, not just resolved.
 

### How to identify auto-created issues
Tests with active workflows show an Automated workflow button (with a bolt icon) in the test detail page header, under the Task automation metadata label.
 

### Reopened issue behavior
If a previously resolved Jira issue is moved back to an open or in-progress status: 
- 
Vanta detects the status change on the next sync cycle
- 
The task returns to an open state in Vanta
- 
A new automated issue will not be created because an open linked issue now exists at the test level
 | 
Note: If the automation setup button appears disabled after filling all visible fields, ensure your Jira project doesn't have standard fields (like Reporter or Priority) set as required without defaults.
📖 Learn more: Looking for document renewal automation? The automatic issue creation described above applies to tests and is configured per individual test. For documents, Vanta offers a separate global workflow that automatically creates Jira issues when any document is approaching its renewal date or needs remediation. This is configured in Document hub settings, not on individual document pages. See Automated Ticket Creation for Documents <https://help.vanta.com/en/articles/14855960-automated-ticket-creation-for-documents> for full setup instructions.
 
 
 

## Offboarding access tracking
 
Vanta tracks whether a Jira access removal issue exists for each offboarded employee and whether it was resolved within your SLA.
 

### How Vanta links a Jira issue to a departing employee
Vanta looks for the departing employee's email address in one of two places:
- 
Anywhere in the issue's title
- 
Anywhere in the issue's description, using the format: Access task for: EMAIL_ADDRESS
At least one of these must be present for Vanta to associate the issue with the correct employee. If neither is present, the issue will not be linked and the offboarding check will show as incomplete.
 
In addition to label-based tracking, JQL queries can be used to define more custom targeting rules (for example, pulling issues from a specific Jira project regardless of label). 
 

### How Vanta determines the issue is resolved
Same as the shared reference above: Vanta marks it resolved if either a Resolution Date is set or the status category is Done.
 

### SLA tracking
Vanta uses the Created At and Resolution Date timestamps to calculate whether the access removal issue was resolved within your policy's defined SLA window.
 

### Tests powered by offboarding tracking
- 
Ensure offboarded users have an associated access issue
- 
Ensure access issues are resolved within the stated SLA

### Offboarding a Jira user account
When the Jira integration is connected, all Jira user accounts are tracked on Vanta's Access page. To trigger offboarding for a Jira account in Vanta, you must remove the account from Jira, not suspend it.
 
Suspending a Jira account does not trigger offboarding in Vanta. Suspended accounts can be reactivated, which means access has not been fully removed. There is no workaround. Removal is required.
 

### How to remove a Jira user account: 
- 
Go to admin.atlassian.com and select your organization.
[image 24]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234364671/49052f48dc663090a29fd3c4ede5/18d1fe86-81f3-45e9-99e0-0ff48ca72a88?expires=1794967200&signature=5d76709befed9f85ce1b82cea5a4202e054c8cd7ace70658e338c40295da4ff9&req=diIkEsp4mYdYWPMW1HO4zViacSVNpbFc8wsUWUrAWBGr1xrYGeZWoTKFmbGq%0Arveq%0A>
- 
Select Directory from the top-level menu.
[image 25]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234365041/a695831c9df52bcd04eb1152fa7d/303b62b6-dcb0-4316-9088-4fa449b681ec?expires=1794967200&signature=5718b209e40972da114de8b72719cf9005fc6ee70aef2da7abe8db7f0a3e5782&req=diIkEsp4mIFbWPMW1HO4zWOH%2FDegrzKHN%2BZW2sQFyfyUW%2Bo%2FaQA%2Fql69yOc6%0A9VFa%0A>
- 
You should be taken to a page listing your users — if not, select Users from the left-hand menu.
[image 26]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234365407/87a1fea8ab29f67425d88112e892/a1dfb6e5-236d-4362-9d6f-0842dcf9618f?expires=1794967200&signature=28f5fbc3d5d8b0f40b4789dda481b3d30b4156b09339a577d20163689700a50f&req=diIkEsp4mIVfXvMW1HO4zaz%2B6mBQspjOAZCNEepIRPPO6suzg3dHAhiOqJ9k%0Ad40d%0A>
- 
Find the user you wish to offboard and click their avatar or click ... → Show Details. 
[image 27]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234365712/8239d9903abc39aa54092122df2a/e49af55b-8166-483e-8512-a7a07091cbb7?expires=1794967200&signature=9e14bd92719519021e589a62877e975d4352fe0486eb154b299f2ab46d45dc6f&req=diIkEsp4mIZeW%2FMW1HO4zTxqmQsK4AN%2FimbLFgvvoKzXZopG6UlfuMB1zpKF%0A0glo%0A>
- 
On the details page, click ... again and select Remove user.
[image 28]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234365990/4ad21959b556dcfd0137bbac8d61/93f03038-9daf-4ea1-a5d4-4ae74650993b?expires=1794967200&signature=59769d0ddcb973a534f354004f72e72a9e43ea4e9e2dac2b96fd4a46a0b73735&req=diIkEsp4mIhWWfMW1HO4zeflQ66kCCv6nKB5jnJ%2B4FPPJm%2Fg64pRQVvU6xuu%0A%2F%2Fpb%0A>
- 
You should see: The account removed from your Jira instance. Vanta will reflect the offboarding on the Access page after the next sync cycle.
 | 
Shared or service accounts: If an account should not be fully removed (e.g., a shared service account), an administrator can mark it as Not a Person in Vanta. When an actual person begins using the account again, an administrator can re-assign it.
 
 
 

## Incident management tracking
 
Vanta tracks Jira issues used to manage and resolve security incidents, recording when each was opened and closed.
 
Vanta supports two distinct task types for incidents, each with its own configurable label:
- 
Incident Management: tracks issues related to the incident response process
- 
Incident Resolution: tracks issues related to the final fix or remediation

### How Vanta identifies incident issues
You configure which issues Vanta should track using labels or JQL queries in Vanta's Task Tracking Labels settings (the same place you configure security labels). Vanta only pulls in issues that match your configured criteria.
 

### How Vanta determines an incident is resolved
Same as the shared reference above: Resolution Date or status category Done.
 

### Tests powered by incident tracking
- 
Incident Resolution Tasks Completed
- 
Incident Management Tasks Completed
 | 
Why this matters for auditors: Auditors expect incidents to occur. What they need to see is that when an incident was identified, it was managed and resolved according to your documented incident response policy. The timestamp data Vanta collects from Jira provides this evidence automatically.
 
 
 
 
 
 
 
 

## Limitations and edge cases 
The following are known constraints of Vanta's Jira integration that may affect automated issue creation and user offboarding workflows.
 
 | 
Limitation | 
Detail | 
Workaround
 | 
One issue per test (automated) | 
Automated issue creation creates one issue per failing test — not one per individual failing resource. The issue description includes details for up to 10 failing resources, but all are grouped into a single issue. | 
Create individual issues manually from the test page, which supports per-item issue creation.
 | 
Automated issue description is truncated | 
When an automated issue is created, the description includes a maximum of 10 failing resources. If the test has more than 10 failures, the remaining items are not listed in the Jira issue. | 
Review the full list of failures on the test detail page in Vanta.
 | 
Automation only triggers on Failing tests | 
Automated issue creation does not trigger on Needs Attention tests — only on Failing tests. | 
Monitor Needs Attention tests manually and create issues from the test page if needed.
 | 
Jira account must be deactivated or removed for offboarding recognition | 
Vanta checks the Jira account’s active status to determine whether access has been removed for terminated personnel. Accounts must be deactivated or deleted in Jira for Vanta to recognize them as deprovisioned. If a terminated user's Jira account remains active, the "Jira accounts deprovisioned when personnel leave" test will fail. | 
Deactivate or delete the user’s Jira account. Vanta will recognize the change on its next sync. 
 
 
 

## Permissions
For step-by-step instructions on granting these permissions, see prerequisites and readiness section.
 

## Vanta permissions
 | 
Permission | 
Required for
 | 
Vanta Admin | 
Connecting, reconnecting, and managing the Jira integration
 

## Jira permissions: company-managed projects
 | 
Permission | 
Required or optional | 
What happens without it 
 | 
Browse Projects | 
Required | 
No data from this project appears in Vanta. No error is shown — the project is silently skipped.
 | 
Create Issues | 
Required for write features | 
Issue creation from Vanta fails with an error when attempting to create in that project.
 | 
Assign Issues | 
Required for write features | 
Issues are created without an assignee
 | 
Assignable User | 
Required for write features | 
The connecting user cannot be selected as an assignee option in Vanta
 | 
MODIFY_REPORTER | 
Optional | 
The Reporter field does not appear in the issue creation modal. All Vanta-created issues default the reporter to the connecting user.

## Jira permissions: team-managed projects
 | 
Role | 
What Vanta can do | 
What’s limited
 | 
Member | 
Read data, create issues, assign issues | 
(full access)
 | 
Viewer | 
Read data only | 
Cannot create or assign issues. No error is shown, the option is simply unavailable. 

## Key behaviors: 
- 
Permissions are tied to the connecting user. Vanta can only access what that user can access in Jira. If their permissions change, the integration is affected immediately — no restart or reconnect is needed for the change to take effect.
- 
To reconnect or update the connecting user without losing existing data and configurations: go to Integrations → Jira → Manage, then follow the reconnection flow.
 
 
 
 
 

## Troubleshooting and FAQs 
Common questions and issues you may encounter when setting up or using Vanta's Jira integration, along with recommended solutions.
Before contacting Support: To reduce resolution time, collect the following before reaching out: 
- 
The connecting user’s email address
- 
Your Atlassian site URL 
- 
The affected project name or key
- 
A screenshot of any error message

## Archived projects 
Q: If a project is archived, does Vanta continue displaying previously synced issues?
A: Jira's API does not return issues from archived projects. Previously synced issues remain in Vanta's database as historical data, but they will not be updated on subsequent sync cycles. They should continue to appear in historical task records but will become stale.
 

## Deleted issues
Q: What happens to a deleted Jira issue in Vanta?
A: When a Jira issue is deleted in Jira, Vanta can no longer retrieve it from the Jira API. On the next sync cycle, the task will show as Not found in Vanta.
 
Q: If a deleted issue was linked to a passing compliance test, does the test revert to failing?
A: No. Test results in Vanta are determined entirely by the test's own evaluation logic (e.g., whether the required evidence or configuration is in place) — they are not affected by the status of linked tasks. Deleting an issue only impacts whether Vanta considers the failure as having an active remediation task — not whether the test passes or fails.
 

## Historical sync on first connection
Q: Does Vanta pull all historical issues?
A: Yes — on first sync, Vanta pulls all matching issues regardless of creation date. Subsequent syncs are incremental and only fetch recently updated issues 
 
Q: If an issue was created, resolved, and closed before the integration was connected, will Vanta recognize it as completed historical evidence?
A: Yes. A resolved issue fetched during the initial sync will have its resolution date present, and Vanta will recognize it as completed historical evidence.
 

## Renamed or moved projects
Q: If a project is renamed or its key changes, does the connection break?
A: No. Jira project IDs are stable across renames and key changes. The connection continues working without any action.
 

## Connection and setup
Q: The Accept button is greyed out during OAuth
- 
A: Go to admin.atlassian.com → your site → Connected apps → Settings
- 
Improved user management experience: Products → select your site → Connected apps → Settings
- 
Set User Installed Apps to Allowed
- 
Return to Vanta and retry the connection
Escalate if: User Installed Apps is already set to Allowed and the button is still greyed out.
 
Q: Error: "No resources for fetch where we require at least one resource" or "OAuth grant has no accessible resources" 
- 
Cause: The wrong Atlassian account was used during authorization, or a cached session is connecting to the wrong site.
- 
Disconnect the Jira integration in Vanta
- 
Open an incognito or private browser window
- 
Reconnect via Integrations → Jira → Manage → Edit → Connect Jira
- 
Sign in as the correct connecting user and confirm you're authorizing the correct Atlassian site
Escalate if: The error persists after retrying in incognito with the correct account.
 
Q: The Jira integration disconnected unexpectedly 
- 
Cause: The connecting user's password, MFA, or Jira access changed.
- 
Reconnect via Integrations → Jira → Manage → Edit → Connect Jira.
- 
Prevent recurrence: Use a dedicated service account to connect the integration so personal account changes don't affect it.
Escalate if: The integration reconnects but disconnects again with 24 hours. 
 
Q: Setup says the connected account can't browse users, groups, or projects, or can't reach the site
- 
Cause: The Atlassian account you signed in with is missing a permission, or doesn't have access to the site you chose.
- 
Grant the account the Browse users and groups global permission and Browse Projects on at least one project Vanta should monitor, then try again.
- 
You can also choose a different Jira site, or reconnect with an Atlassian account that has access.
Escalate if: The account has the permissions and the error persists. 
 
Q: My JQL query won't save
- 
Cause: The query contains ORDER BY, or Jira can't parse it. 
- 
Remove ORDER BY (Vanta sorts results itself) and check the query for syntax errors.
Escalate if: The query is valid in Jira's own search and Vanta still rejects it. 
 

## Issue creation
Q: Issue creation fails with a required fields error
- 
Vanta automatically detects required custom fields for your target Jira project and surfaces them in the creation modal. Fill them in and click Create.
- 
If a field type is not supported by Vanta:
- 
Option 1: Make the field optional in Jira → Project Settings → Fields
- 
Option 2: Use a dedicated Jira project with no custom required fields as your Vanta destination, then use a Jira Automation rule to route or enrich issues after creation
Escalate if: The field cannot be made optional and the field type is unsupported. 
 
Q: The reporter on Vanta-created issues can't be changed
- 
Cause: The connecting user needs the MODIFY_REPORTER permission on the target project. You may also need to reconnect the integration for the change to take effect.
- 
Grant MODIFY_REPORTER in Jira → Project Settings → Permissions
- 
Reconnect the integration: Integrations → Jira → Manage → Edit → Connect Jira
- 
Note: MODIFY_REPORTER must be granted in every Jira project you intend to create issues in, not just one. 

## Sync and status
Q: Security tasks are not appearing in Vanta. Work through these steps in order before escalating: 
- 
Step 1: Check the label. The issue must have the security label (or your configured custom label) in Jira's Labels field, not in a comment, description, or custom field.
- 
Step 2: Check Browse Projects permission. The connecting user needs Browse Projects permission on every project you want Vanta to monitor. Go to Jira → Project Settings → Permissions to verify.
[image 29]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234408379/e514c5f467ffc17e166c9d96fe09/bade8f7a-9cab-4f40-84e9-2ba0d0107969?expires=1794967200&signature=07cb7e8d12a637e3061b1e4e4f94d46b4398f2835f93120f92bb265d05d28837&req=diIkEs1%2BlYJYUPMW1HO4za6GbtpL5p6oYkq06tLVdZwJov7rP3n6w3W%2FVJHU%0Ah4Pj%0A>
- 
Step 3: Check for an Issue Security Scheme. Go to Jira → Project Settings → Issue Security. If a scheme is active, the connecting user must have explicit access within the scheme. Browse Projects alone is not sufficient for restricted issues. This is the most commonly missed step.
[image 30]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2234408634/c5a1cd56f24bb33fe42cc71e5fb4/298f1386-2c9d-4160-b82d-dd6fb58d7384?expires=1794967200&signature=09e53e59526b9db58342f3962176d7920b67004fbef20a8d6576a2524ad22250&req=diIkEs1%2BlYdcXfMW1HO4zT23PLIcNhWr%2BT9Ph2JB0sjAbSuTKt3k6KFAdvcn%0Adjn1%0A>
- 
Step 4: Confirm projects, not boards. Vanta connects to Jira projects, not boards. If you're expecting issues from a board that spans multiple projects, confirm the connecting user has Browse Projects permission on every underlying project.
- 
Step 5: Reconnect in incognito. If all steps above check out, try reconnecting in an incognito or private browser window to rule out cached session data.
 
Escalate if: All steps check out and tasks still aren’t appearing after 60 minutes.

## Offboarding
Q: An offboarded employee isn't being linked to their access issue or still showing as active. 
 
This issue has two distinct causes. Work through them in the following order: 
 
Cause 1: The account was not deactivated or removed
- 
Accounts must be deactivated or deleted in Jira for Vanta to recognize them as deprovisioned. If the account is still active, the "Jira accounts deprovisioned when personnel leave" test will fail.
- 
Fix: Deactivate or remove the account from Jira entirely via admin.atlassian.com → Directory → Users → find user → Deactivate or Remove user. See Offboarding a Jira User Account in the Use Cases section <https://help.vanta.com/en/articles/14441707-jira-integration-guide#> for the full step-by-step.
Cause 2: The access issue isn’t linked to the employee
- 
Vanta links issues to employees using their email address. Confirm it appears in one of these two places:
- 
Anywhere in the issue title — e.g., Offboard access for [email protected]
- 
Anywhere in the issue description — using the format: Access task for: [email protected] (note: Vanta looks for a valid email address anywhere in the title or description. The recommended format is Access task for: EMAIL_ADDRESS.)
- 
The link will register on the next sync cycle after the email is added. 
If neither fix resolves it – sync delay
Offboarding changes may take longer than standard sync cycles to appear in Vanta due to rate limits and organization size. Wait a few hours before escalating.
 
Escalate if: More than a few hours have passed and the account still shows as active. Contact Vanta Support and include a screenshot confirming the account no longer exists in your Jira instance.

## Images

- [image 01] ../../images/ux/integrations/jira-integration-guide--01.png
- [image 02] ../../images/integrations/jira/jira-integration-guide--02.png
- [image 03] ../../images/integrations/jira/jira-integration-guide--03.png
- [image 04] ../../images/integrations/jira/jira-integration-guide--04.png
- [image 05] ../../images/integrations/jira/jira-integration-guide--05.png
- [image 06] ../../images/integrations/jira/jira-integration-guide--06.png
- [image 07] ../../images/integrations/jira/jira-integration-guide--07.png
- [image 08] ../../images/integrations/jira/jira-integration-guide--08.png
- [image 09] ../../images/integrations/jira/jira-integration-guide--09.png
- [image 10] ../../images/integrations/jira/jira-integration-guide--10.png
- [image 11] ../../images/integrations/jira/jira-integration-guide--11.png
- [image 12] ../../images/integrations/jira/jira-integration-guide--12.png
- [image 13] ../../images/integrations/jira/jira-integration-guide--13.png
- [image 14] ../../images/integrations/jira/jira-integration-guide--14.png
- [image 15] ../../images/integrations/jira/jira-integration-guide--15.png
- [image 16] ../../images/integrations/jira/jira-integration-guide--16.png
- [image 17] ../../images/integrations/jira/jira-integration-guide--17.png
- [image 18] ../../images/ux/tests/jira-integration-guide--18.png
- [image 19] ../../images/ux/tests/jira-integration-guide--19.png
- [image 20] ../../images/ux/tests/jira-integration-guide--20.png
- [image 21] ../../images/integrations/jira/jira-integration-guide--21.png
- [image 22] ../../images/ux/integrations/jira-integration-guide--22.png
- [image 23] ../../images/integrations/jira/jira-integration-guide--23.png
- [image 24] ../../images/integrations/jira/jira-integration-guide--24.png
- [image 25] ../../images/integrations/jira/jira-integration-guide--25.png
- [image 26] ../../images/integrations/jira/jira-integration-guide--26.png
- [image 27] ../../images/integrations/jira/jira-integration-guide--27.png
- [image 28] ../../images/integrations/jira/jira-integration-guide--28.png
- [image 29] ../../images/integrations/jira/jira-integration-guide--29.png
- [image 30] ../../images/integrations/jira/jira-integration-guide--30.png
