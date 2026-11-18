# Google Workspace: Integration Guide

Source: https://help.vanta.com/en/articles/14977969-google-workspace-integration-guide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers.

## Overview 
If your team uses Google Workspace to manage employee accounts, this integration brings that identity data into Vanta automatically. Vanta syncs six types of directory data from Google Workspace: users, groups, group memberships, admin roles, role assignments, and the third-party apps your users have authorized with Google sign-in. Each sync brings in details like account status, 2-Step Verification enrollment, group membership, and admin role assignments, so your team keeps working in Google Workspace while Vanta handles evidence collection and compliance monitoring.
 
New to this integration? Start with the Google Workspace: Quickstart <https://help.vanta.com/en/articles/14977549-google-workspace-quickstart>! 
 

### What you can do with this integration: 
- 
Automatically verify that terminated employees have had their Google Workspace accounts deactivated. 
⚠️ Note: For this check to pass, the account must be suspended in Google Workspace with an explicit suspension reason recorded, or deleted entirely. Accounts suspended by an automated system process without a recorded reason are treated as active in Vanta.
- 
Track whether users have enrolled in 2-Step Verification (MFA).
- 
Confirm all Google Workspace accounts are linked to Vanta user records.
- 
Surface users and groups in access review workflows.
- 
Identify privileged users based on their Google Workspace admin roles and role assignments.
- 
Request and manage access to Google Workspace entitlements through Vanta's Access Requests workflow.
- 
Discover the third-party apps your users have authorized with Google sign-in, and surface them as vendors in Vanta, no manual vendor inventory required.

### Connection details 
 | 
Detail | 
Value
 | 
Connection type | 
OAuth 2.0. Vanta connects using a Google OAuth app through a short multi-step connection flow: choose whether to enable vendor discovery, authorize the connection with Google, then choose whether to sync your whole directory or only specific employees.
 | 
Access level | 
Read-only by default. If you enable vendor discovery, Vanta also requests the user security permission, which Google classifies as a write-level scope because Google publishes no read-only version of it. Vanta uses that permission exclusively to read the list of third-party apps your users have authorized. Vanta never revokes an app's access and never changes your directory, user accounts, or security settings.
 | 
Who should connect | 
A Google Workspace super administrator. Use a stable, monitored admin account rather than a personal employee account. The integration must be reconnected if the connecting account loses super admin access. For instructions on creating a dedicated service account with the minimum required permissions, see Creating a Service Account for the Google Workspace Integration <https://help.vanta.com/en/articles/11345689-creating-a-service-account-for-the-google-workspace-integration>.
 | 
Multiple Google Workspace organizations | 
Each Google Workspace domain is a separate connection in Vanta. Repeat the setup for each domain you want to monitor. 
 | 
Estimated setup time | 
Under 10 minutes
 
 

## What Vanta collects and why
This section covers the categories of data Vanta reads from Google Workspace and why each is collected. For details on how this data is used in specific Vanta workflows, see Use Cases and capabilities.
 

### Scope — What Vanta monitors
By default, Vanta reads from all active, non-archived user accounts in your Google Workspace domain, along with all groups and their memberships.
ℹ️ Note: If the sync filter is enabled (the "Sync only specific employees" option during setup), Vanta only monitors users who are members of the designated Google Workspace group. Only one group can be designated. Users outside that group will not appear in Vanta. See Configure group-based scoping for setup instructions.

### 

### What Vanta syncs
Vanta syncs six types of directory data from Google Workspace. The table below describes each category and how it's used in Vanta. It is not an exhaustive field list: Vanta reads what the granted permissions allow, and the exact fields synced may expand as the integration improves. For the complete, current list of fields, see the Google Workspace listing on the Integrations page in Vanta.
 
 | 
Data category | 
What it includes | 
Why Vanta collects it
 | 
Users | 
Account identity and profile details such as name, email, and job title, plus account status, suspension reason, 2-Step Verification enrollment, admin status, and login activity | 
Populates the personnel directory, powers the deprovisioning, MFA, and account-linking tests, and surfaces users in access reviews
 | 
Groups | 
The groups defined in your directory, including names and identifiers | 
Identifies groups in access reviews, Access Requests, and the sync filter
 | 
Group memberships | 
Which users belong to which groups | 
Populates group membership on user records and determines who is in scope when the sync filter is enabled
 | 
Admin roles | 
The admin roles defined in your Google Workspace directory | 
Identifies the privileged roles that exist in your environment
 | 
Role assignments | 
Which users hold which admin roles | 
Surfaces privileged users on user records, in access reviews, and in Access Requests
 | 
Third-party app grants | 
The apps your users have authorized with Google sign-in, including the app's identity and the permissions it was granted | 
Surfaces those apps as vendors for vendor discovery
ℹ️ Note: Third-party app grants are only synced if you enable vendor discovery during setup. Users who have never logged in will show no last login date, and archived Google Workspace accounts are excluded from sync.
 
 
 

### What Vanta does not collect
Vanta's access is limited to Google's Admin SDK Directory API, using the permissions you approve on the Google consent screen. Vanta does not request access to Gmail, Google Drive, Docs, or Calendar, so email content, files, sharing settings, and calendar data are never read. Vanta also never reads account passwords or authentication credentials. Personal Gmail accounts are not supported; only Google Workspace organizational accounts sync.
ℹ️ Note: Connecting Google Drive to Vanta for policy document storage is a separate integration from the Google Workspace integration covered in this guide. If your team stores policies in Google Drive and they are not appearing in Vanta, see the Google Drive Integration Guide.
Note on Shared Drives: The Google Drive integration syncs from Shared Drives named exactly vanta policies (for policy storage) and vanta documents (for evidence requests). The Google account used to authorize the integration must have write permission on those Shared Drives — read access or organizational membership alone is not sufficient. If policies are not appearing:
- 
Confirm the Shared Drive is named exactly vanta policies or vanta documents (lowercase, no extra characters).
- 
Confirm the connecting Google account has been added with write permission on the Shared Drive in Google Drive settings.
- 
Reconnect the Google Drive integration in Vanta.
 
 
 

## Prerequisites and readiness checklist 
Complete all items in this checklist before starting setup. 
 

### Confirm you have a supported Google Workspace edition
Vanta's Google Workspace integration requires access to the Admin SDK Directory API, which is available on the following editions:
- 
Google Workspace Business Starter, Standard, Plus
- 
Google Workspace Enterprise (all tiers)
- 
Google Workspace for Education
- 
Google Workspace for Nonprofits
Personal Gmail accounts (@gmail.com) are not supported.
 
Why this matters: Google's Admin Directory API is not available on personal accounts. Only organizational domains managed through a Google Admin console expose the directory, group, and role data Vanta needs.
 

### Confirm you are a Google Workspace super administrator
Only super administrators can authorize Vanta's OAuth application to read users, groups, and role data across the domain. 
- 
To confirm you are a super admin: log in to admin.google.com <https://admin.google.com>, go to Account > Admin roles, and confirm your account holds the Super Admin role. Limited admin roles (such as Groups Admin or User Management Admin) cannot authorize all permissions. 
- 
If you are not a super admin, ask a current super admin to complete the connection, or request a role elevation before retrying.
 

### (if applicable) Confirm Vanta is trusted in your Google Workspace domain 
If your Google Workspace domain has policies restricting which third-party applications can request OAuth access, Vanta's OAuth application must be marked as trusted before setup. If this is not done, the connection will fail with a 400: admin_policy_enforced error.
 
To check and configure: 
- 
In Google Admin, go to Security > Access and data control > API Controls: admin.google.com/ac/owl <https://admin.google.com/ac/owl>.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353826109/d93026f2944fca08a07e0ad8710a/7d15b90a-44f8-4726-9d9e-168b20a3cfcf?expires=1794967200&signature=5e889b96a9763d591e9dc706b0df0638a9d1cd5564bfc87639a45e711205fa3d&req=diMiFcF8m4BfUPMW1HO4zdmHnmpbyz3GxJIcgUNgeprdlR9ahdjDyDE%2BCNGV%0AJbHyH%2BaSer4vpSIo6Gg%3D%0A>
- 
Click Manage third-party app access.
- 
Select Configure new app > OAuth app name or Client ID.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353826724/87a0b587ea42f10c302d9618e8c7/270eaf20-4dac-415a-b8cd-338fecb42159?expires=1794967200&signature=e6668112ecb6c0c5b67baefe09a03b1b1ceac27afc9a4e2ef09eff56815e2c47&req=diMiFcF8m4ZdXfMW1HO4zSGK6Ijl%2ByVIwkAcZ0UlWnMIR4wU%2F%2BqS66%2BOpUmm%0A1E%2FaHqsZK3Itm%2Foswhc%3D%0A>
- 
Search for and add all three Vanta Client IDs. Each covers a different Vanta capability in your Google environment:
- 
690752614462-i765709385cocut1thvutg8aml4l0ss8 (signing in to Vanta with Google)
- 
690752614462-g1vko8gp5d1b4c521e98gi3fufhs0lr4 (the Google Drive integration, used for policy document storage)
- 
690752614462-31jfcl6lc2i88eege2k464jcutq6rg8j (the Google Workspace integration covered in this guide)
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353829760/0586fd2e8d0af60bb0dd010c327e/240b1b2b-1db9-4d3a-b878-c59e05e92902?expires=1794967200&signature=bcd308e26fb57188bf1c9fd4bc2b398dfde7da894824313b9768f412a33796c4&req=diMiFcF8lIZZWfMW1HO4zQ2B7pja57cVKFn3Svzcm8ThXmmkb4g%2BQorFwHd7%0AbxBWHr71nTO2eiHWqeI%3D%0A>
- 
Search for and select all of the Client IDs and click SELECT. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353829960/b3931b3cc4917f20a0d3f2c5fd65/5365d954-ade8-41a1-86a6-741a8d83db76?expires=1794967200&signature=6783fd147a124ccf4b046d68fa027c6bf832359d07a554c7c0f745230a72dd28&req=diMiFcF8lIhZWfMW1HO4zeXSd22xM7Gq6WX45fKTn1rSzXpOPqo1hSAuRzd%2B%0AD9DUjA36eXTASuGodcM%3D%0A>
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353830378/b78a6fb018ae3d4b33c5e763610a/b92505f3-21db-458c-9f43-7733eee4d643?expires=1794967200&signature=a36193cd6c44206f4b59561d5b0555cc87e3b3a371b9c8b4ede38e96caf1b07d&req=diMiFcF9nYJYUfMW1HO4zeG0WiUkpohABDnpaQvg223y1mj9iZrFAOGLxi5v%0AsPE1WC0CIzeu%2BI2Urh0%3D%0A>
- 
Mark each as Trusted and click Configure.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353830662/3ee5ab1c4b8907a7bcd321803979/0fe32a92-03a1-4723-8ceb-27edf908d6e9?expires=1794967200&signature=5946da3e1536fa213d25de8264f1c225e502a875365280d710654d314e780599&req=diMiFcF9nYdZW%2FMW1HO4zSo51We0Z2yHSGQexB9Kmuld3hgaEtJqCcZJdioL%0AQvHGrpa9F9Ss2LNYBB8%3D%0A>
Why this matters: Google Workspace domains with restricted OAuth policies will block Vanta's connection attempt even if the connecting account has full super admin privileges.
 

### (Optional) Decide whether you want vendor discovery
During setup, you'll choose whether to enable vendor discovery ("Discover apps used with Google sign-in"). Enabling it lets Vanta surface the third-party apps your users have authorized with Google sign-in as vendors, and adds the user security permission to the connection. Declining it keeps the connection fully read-only; only vendor discovery is affected. Deciding this before you start setup, and confirming your organization is comfortable granting the user security permission if you opt in, will make the connection flow quicker.
 

### (Optional) Prepare your sync filter group before connecting
If you want Vanta to track only a subset of users (for example, to exclude contractors or service accounts), you can enable the sync filter during setup ("Sync only specific employees"). The setup flow expects a Google Workspace group named exactly Vanta containing the users you want synced, so create and populate that group before connecting. You can switch to a differently named group after connecting; see Configure group-based scoping for naming requirements.
 
For a full breakdown of the permission Vanta requests and what each one enables, see Permissions.
 
 

### Readiness checklist - quick reference
- 
You have a supported Google Workspace edition (Business, Enterprise, Education, or Nonprofits, not personal Gmail).
- 
You are a Google Workspace super administrator.
- 
You have Vanta admin access.
- 
Your domain's OAuth access policies do not block third-party app connections or Vanta has been marked as Trusted using the steps above.
- 
(Optional) You've decided whether to enable vendor discovery, and can approve the user security permission if opting in.
- 
(Optional) A Google Workspace group named Vanta exists and is populated if you want to use the sync filter to limit which users Vanta monitors.
- 
The account completing setup is stable and will retain super admin access long-term.
 

## Explore the integration page 
When you navigate to the Google Workspace integration, you'll land on its listing page, which includes five tabs that cover what you need to know before (and after) you connect.
- 
Overview — Start here. A summary of what the integration does, its top capabilities, and the prerequisites you'll need in place before connecting. When you're ready, select Connect to begin setup.
- 
API permissions — Exactly what access Vanta requests from Google Workspace: each permission's scope, whether it's read or write, and what data it covers, etc. Share this tab with your security team if they need to review access before you connect.
- 
Resource types — Every resource type Vanta imports from Google Workspace, down to the specific fields collected for each. Use this to understand exactly what data will show up in Vanta once connected.
- 
Automated tests — How many tests connecting Google Workspace unlocks and which frameworks and controls they map to (SOC 2, ISO 27001, etc.), plus the full list of tests by name. Useful for scoping compliance coverage ahead of an audit.
- 
Security — How Vanta protects the data it collects — encryption, data retention, access controls, and infrastructure. Visit Vanta's Trust Center <https://trust.vanta.com/> for the full picture.
When you’re ready to connect, continue to the setup guide below.
 
 
 

## Setup guide
Here are the steps to connect. 
 

### Step 1: Open the Google Workspace integration in Vanta
- 
Go to the Integrations page and click Add Integration. 
- 
Search for Google Workspace, then click the integration card. 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2675265176/00b628c7d0b2cb3e9ca7db080b15/image.png?expires=1794967200&signature=a4526219f309eba298f1b5ad9f857a4adbfa73df14c0bd2e07a8d64e39c818da&req=diYgE8t4mIBYX%2FMW1HO4ze9%2FqSKNx8eb78i8GyDxVpD%2BLwxQkrQ%2BnZKq2HGk%0ARiQ%2FfWYAHTZve6IP9uo%3D%0A>
- 
A detailed integration listing page will open. To learn more about this experience, review Explore the integration page section. 
- 
Click Connect.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2675280290/36a6fd7739714cdcb7572212ca51/image.png?expires=1794967200&signature=ddd94075df64659a258423c9b95f8ac9b847a83e901ce634e5466b9093bb8a36&req=diYgE8t2nYNWWfMW1HO4zXiUmGC9juPq5Oenzblq65FlUJ9d4wiIZQeXzdTS%0AqKSf90YVkwU7slDNzo8%3D%0A>
 

### Step 2: Select features
The first step of the connection flow asks which features you want to enable for your Google Workspace integration. 
- 
To have Vanta discover the third-party apps your users have authorized with Google sign-in and surface them as vendors, check Discover apps used with Google sign-in.
- 
If you leave this unchecked, the connection is fully read-only and only vendor discovery is affected; users, groups, group members, admin roles, and role assignments all sync normally.
- 
Click Save to continue.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2675286218/4633b4dafe8b8e370b741ea87c5a/image.png?expires=1794967200&signature=cbae6febc7fecbba2267e144efe4db4e9fa88d77f120e1fad206bde69627c133&req=diYgE8t2m4NeUfMW1HO4zaVFFyBmoOVs2jZg4tZ2Np1flL2T3HJZJ448nXej%0AOztihXGg7qTJfsqVROg%3D%0A>
ℹ️ Note: Enabling vendor discovery adds the user security permission to the connection. Google classifies this permission as write-level because no read-only version of it exists, but Vanta only ever uses it to read the list of apps your users have authorized. Vanta never revokes an app's access and never changes users' security settings. Discovered apps appear on the Vendors page under the Discovery tab; see [Adding and Managing Vendors].
 
 

### Step 3: Connect and authorize with Google
- 
Click Connect. Vanta redirects you to Google's OAuth consent screen.
- 
Sign in with your Google Workspace super administrator account.
- 
Review the requested permissions. If you did not enable vendor discovery, Google shows three read-only directory permissions (users, groups, and admin roles). If you enabled vendor discovery, Google shows a fourth permission, which appears on the consent screen as Manage data access permissions for users on your domain.
- 
Click Allow to complete the OAuth flow.
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2675302171/21e6a55f117e66c5c42d75bdf9f8/image.png?expires=1794967200&signature=67813777b59cf0edd0de4c6607a12768c569b50b733ca81b2c037fdd3719c396&req=diYgE8p%2Bn4BYWPMW1HO4zY1s5X5CeP07%2BYkHqlBV8fenGjJBwNfXewSjaAQB%0AWBL%2BfCrZU38pb7yUhiw%3D%0A>
 
⚠️ Note: To add vendor discovery after connecting without it, you'll need to edit the integration's features and complete the Google authorization again so the additional permission can be granted.
 

### Step 4: Set sync filters
The final step controls which users Vanta imports: 
- 
To sync your entire directory, leave Sync only specific employees unchecked. You can still manually choose which users appear on the People page and in audit scope after connecting.
- 
To have Vanta import only a subset of users, check Sync only specific employees. Vanta will import only users who are members of a Google Workspace group named exactly Vanta, so create and populate that group in Google Workspace before finishing this step. You can switch to a differently named group after connecting; see Configure the sync filter.
- 
Click Save to finish setup. 
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2675306848/e392e65cf30297fab18c9018dbde/image.png?expires=1794967200&signature=cb9926faec39cf3a357c1abe4bce66060b09e9f5f6844eda95cc6ba7da622bdd&req=diYgE8p%2Bm4lbUfMW1HO4zVJqaSpLxbvmSUXdmxihV7Kvwj6jU1UABOu%2Bn%2BpU%0AGyBNAStmpxzOqzcrB98%3D%0A>
⚠️ Note: If the sync filter is enabled and the designated group is missing or empty when Vanta syncs, the integration will disconnect and you'll need to reconnect it. Make sure the group is populated before finishing setup.
 

### Step 5: Confirm the connection
- 
After saving, Google Workspace appears as Connected and Vanta opens the integration's management page, where you can watch the initial sync progress, see how many resources have synced, and review fetch history.
- 
Allow up to one hour for the initial sync to complete.
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2675309002/20268f236717b40aa50075b13469/image.png?expires=1794967200&signature=6799511154ac70fc85b22d1d58eaecf7ce64a195f234863242cb1de73353109b&req=diYgE8p%2BlIFfW%2FMW1HO4zcGcAvJGddedO8921%2Bory2JZb6oiZUDvOpSyzpmj%0AFiv7509frZO8P0OLkVM%3D%0A>
💡 Tip: The Vanta agent is available alongside the connection flow. You can ask it questions as you connect, like why a specific permission is requested or how to create the sync filter group in Google Workspace.
 
 
 

### (Optional) Configure the sync filter
If you want Vanta to track only a subset of users in your domain, you can enable the sync filter during setup or configure it after connecting.
ℹ️ Note on when to use this feature: Group-based scoping is commonly used to limit Vanta's compliance monitoring to a specific population — for example, full-time employees only — and exclude contractors, vendors, or service accounts that should not be tracked for compliance purposes.
There are two ways to set up the sync filter:
- 
During setup: Check Sync only specific employees on the Set sync filters step. Vanta will import only members of a Google Workspace group named exactly Vanta, so that group must exist and be populated before you finish connecting.
- 
After connecting: Configure or change the sync filter from the integration's scope settings, where you can also select a differently named group (see naming rules below).
If you only need to exclude a small number of individual accounts rather than a group, you can do this without setting up group scoping: go to Personnel > People > click on the user you want to exclude > click the three dot button > select Set as service account.
ℹ️ Note: The service account setting does not apply to every test. The MFA on Google Workspace test evaluates the account data synced from Google Workspace and does not consider this setting, so accounts marked as service accounts can still fail it. To exclude non-human accounts from that test, use group-based scoping or deactivate monitoring for the affected accounts. See Resolve ‘MFA on Google Workspace’ Test <https://help.vanta.com/en/articles/11345534-resolve-mfa-on-google-workspace-test>.
 
 

### Step 1: Create a group in Google Workspace
- 
In Google Workspace, go to Directory > Groups.
- 
Click Create group.
- 
Name the group following the required convention (see naming rules below).
- 
Add the users you want Vanta to monitor as members.
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353858701/7cf4e39a0de14bc6370f0e9a6742/653bea36-8c7c-47d8-ad93-e2e182965954?expires=1794967200&signature=e1428a5f55c280ac023d5c390fde035af312e8f4a13699eef87db91c075afbfb&req=diMiFcF7lYZfWPMW1HO4zSKfUGJXAyjbpFUHv6uQNdhrG4TbzhPrmz9awO78%0Ag4MCmyyUp9FKapti30I%3D%0A>
 
Group naming rules: 
- 
The group name must include Vanta (capital V) as a standalone word. It does not need to begin with Vanta.
- 
✅ Valid examples: Vanta, Vanta Full Time Employees, Acme Corp Vanta, Vanta-Contractors.
- 
❌ Invalid examples: vanta employees (lowercase v), Vantage Users (Vanta is not a standalone word here), VantaEmployees and Vanta_Employees (Vanta is joined to other characters), Compliance Users (no "Vanta" in the name).
- 
Any group whose name includes Vanta as a standalone word will appear as a selectable option in Vanta's scoping configuration.
- 
If you enable the sync filter during setup rather than after connecting, name the group exactly Vanta, since the setup flow looks for that group by default.
 

### Step 2: Enable or change the sync filter in Vanta
- 
In Vanta, go to Integrations. Search for Google Workspace.
- 
Click the 3 dot button and select Configure scope.
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2675202552/867e4ef092221dcf7931736a23e8/image.png?expires=1794967200&signature=97d604bc812b54bf1176ed3ec4addae7334987400abcbf1504abf3b45562ef80&req=diYgE8t%2Bn4RaW%2FMW1HO4zQjEW07rUywljdbKD1dU6p095hyspoj6ZpoZpIhV%0AmlBr1z7twTGCSBsFG4E%3D%0A>
- 
Confirm your scoping group is fully populated with the correct users.
- 
Review your current compliance scope so you understand what will change.
- 
Notify your compliance team before making changes during an active audit cycle.
- 
Enable the toggle next to Control scope with GSuite. 
- 
In the modal Turn on IdP scoping with GSuite, select your group from the dropdown. 
- 
Click Publish changes.
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353861981/5be68a49a5186bfc3a94b2feb016/35e79a99-6589-4b2a-ad42-12a894808f36?expires=1794967200&signature=f6e637940a202b9c8a14902d4f9227bb4391dec607472d0f505dcb6a0e061994&req=diMiFcF4nIhXWPMW1HO4zbudHXSFuI9F2K1%2BxTy8tHMIRMEXBRnw2xrG0Nkm%0AOxNQX2%2BbdYcXkIuej9g%3D%0A>
ℹ️ Note: If you do not select a group from the dropdown, Vanta will default to looking for a group named exactly Vanta.
 
Once scoping is turned on: 
- 
Only users who are members of the designated group will be synced into Vanta.
- 
Users outside the group will not appear in Vanta.
- 
Scope updates take effect on the next hourly sync.
- 
Vanta admin accounts are kept in scope by default, even if they are not members of the scoping group.
⚠️ Note: If the scoping group is empty or contains no valid users at the time of a sync, the integration will automatically disconnect. Ensure the group is populated before enabling this setting.
ℹ️ Note on nested and dynamic groups: Vanta reads direct members of the scoping group only. If your organization uses nested Google Groups (groups whose members are themselves other groups), members of those sub-groups will not automatically be included in scope — they must be direct members of the designated scoping group. This also applies to dynamically-managed groups: membership is evaluated at the time of each sync based on who is directly listed. If you rely on nested or dynamic group structures, audit the direct membership of your scoping group before enabling this setting.
 
 
 

### Using group-based scoping within Vanta Workspaces <https://help.vanta.com/en/articles/11345386-vanta-workspaces>
If your organization uses Vanta Workspaces, you can create multiple Google Workspace groups (one per Workspace) to scope distinct sets of users per Workspace. This option is only available to organizations using Vanta Workspaces and is not available for standard single-workspace accounts. Review Getting Started with Vanta Workspaces <https://help.vanta.com/en/articles/11345360-getting-started-with-workspaces> for more information.
 
 

## Verification and validation
After setup, confirm the following to verify the integration is connected and data is syncing correctly. 
Note: allow up to one hour for initial sync before checking. 
- 
The overview and activity pages show sync activity — After connecting, open the Google Workspace integration from the Integrations page. The overview page shows how many resources have synced and the fetch history, so you can confirm the initial sync is progressing. 
- 
Integration is active — In Vanta, go to the Integrations page and confirm Google Workspace shows a Connected status with a recent sync timestamp. If the status shows Disconnected, confirm the connecting admin account is still active with super admin privileges in Google Workspace, and if the sync filter is enabled, confirm the designated group is populated (an empty sync filter group disconnects the integration).
- 
Users are syncing — Go to the People section in Vanta. Google Workspace users should appear and be linked to personnel records. If users are missing, check whether the sync filter is enabled and confirm the expected users are members of the designated Google Workspace group.
- 
Compliance tests are populating — Go to Tests in Vanta. The MFA, deprovisioning, and account linking tests should show data. If tests show no data after the initial sync period, confirm the integration status and check for permission issues.
- 
Groups are appearing — Google Workspace groups should be visible in access review workflows and on user records. If groups are missing, confirm the view groups permission was granted during OAuth setup.
- 
Third-party apps are appearing — If you enabled vendor discovery, go to Vendors in Vanta. Apps your users have authorized with Google sign-in should appear on the Discovery tab. If vendor data is absent, confirm vendor discovery was enabled during setup and the additional permission was granted on the Google consent screen.
- 
Admin roles are appearing on user records — Admin role names should be visible on user records in Vanta after the initial sync completes.
 
 

## Use cases and capabilities 
The Google Workspace integration powers five functional areas in Vanta: personnel management, automated compliance testing, access reviews, access requests, and third-party app discovery. 
 

### Quick reference
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Users | 
Yes | 
Personnel management, Access Reviews, Access Requests, Automated Tests
 | 
Groups | 
Yes | 
Access Reviews, Access Requests, user scoping
 | 
Roles / Entitlements | 
Yes  | 
Access Reviews, Access Requests, user records
 | 
Last login | 
Yes | 
Access Reviews, account activity checks
 | 
MFA enrollment status | 
Yes | 
Automated Tests
 | 
Account suspension / deactivation status | 
Yes | 
Automated Tests, Personnel lifecycle
 | 
Third-party app discovery | 
Yes (requires enabling vendor discovery at setup) | 
Vendor management
 | 
User profile photos | 
Yes | 
Personnel profiles in Vanta
 | 
Role assignments | 
Yes | 
Access Reviews, Access Requests, user records

### Personnel management and lifecycle
 
Vanta imports active users from your Google Workspace domain and links them to personnel records. After each sync, Vanta reconciles user data with your people directory, updates user statuses, and flags accounts that need attention.
 
What this powers in Vanta:
- 
Personnel directory: Google Workspace users appear in the People section, linked to Vanta personnel records.
- 
Lifecycle tracking: User status changes (active, suspended, terminated) are reflected in Vanta after each sync.
- 
Account linking: New users detected in Google Workspace are automatically matched to existing personnel records where possible.
⚠️ Note: Offboarding requires action in both Google Workspace and Vanta: Suspending or deleting a user in Google Workspace updates their status in your Google directory, but does not automatically complete their offboarding in Vanta. After the next hourly sync picks up the account change, you must also offboard the user in Vanta (People > [user] > Select the checkbox next to their name > Offboard. The Offboard button appears on a user’s profile in Vanta once the sync detects that their Google Workspace account has been suspended or deleted. If the button is not visible, the sync has not yet picked up the account change. Wait for the next hourly sync and check again. Until both steps are complete, the user will remain in your compliance scope and continue to appear in compliance tests.

### Connecting Google Workspace alongside another identity provider (e.g., Okta, OneLogin)
If you connect Google Workspace in addition to another IdP, the same person may appear as two separate records in Vanta — one from each integration. To prevent or resolve this:
- 
Set IdP precedence: Go to the Integrations page, find any connected IdP, click Manage, and select Change IdP precedence. This determines which identity provider controls user state for people who appear in both.
- 
Control which IdPs populate the People page: Each connected IdP has a populate the People page toggle when you click on the Configure scope button. If only one IdP should be creating personnel records, disable this setting on the other.
- 
If duplicates already exist: Contact Vanta Support for help resolving duplicate records.
Scope notes:
- 
Only active, non-archived accounts are synced.
- 
If the sync filter is enabled, only users in the designated group are tracked.
 
 
 
 
 

### Automated compliance tests
 
Google Workspace data powers the following automated tests in Vanta:
- 
Google Workspace accounts deprovisioned when personnel leave: This checks that terminated employees have deactivated Google Workspace accounts.
Sample test page:
​
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2353884624/912a5daf86cba834941c93803537/dc2b4be0-2394-42e6-8d46-931053afa2ed?expires=1794967200&signature=a5a53552b86960357fbe4716ffa340894828575358de219bbcb699f6beb1d3ba&req=diMiFcF2mYddXfMW1HO4zbop6gqpvn%2F9AHiE668YOyhsNnYvhdI2pdF8u5qY%0AF1O%2Fmz%2FKbJto%2BAUiVWA%3D%0A>
- 
MFA on Google Workspace: This verifies whether users have enrolled in 2-Step Verification. It passes when all in-scope users have MFA enabled on their individual accounts.
- 
This test evaluates the account data synced from Google Workspace. Marking a user as a service account on the People page does not exclude them from this test. To exclude non-human accounts, use group-based scoping or deactivate monitoring for them on the test.
- 
Google Workspace accounts associated with users: This checks that all synced Google Workspace accounts are linked to a Vanta user record. Flags accounts without an identified owner.
Scope notes:
- 
Test results update after each hourly sync, not in real time.
- 
For guidance on resolving the MFA test, including how to enforce 2-Step Verification in Google Admin, see Resolve 'MFA on Google Workspace' Test <https://help.vanta.com/en/articles/11345534-resolve-mfa-on-google-workspace-test>.
 
 
 

### Access reviews
 
Google Workspace users and groups appear in Vanta's access review workflows.
 
What this powers in Vanta:
- 
User access reviews: All synced Google Workspace accounts appear for review, so your team can confirm who has access and flag accounts that need cleanup or reassignment
- 
Group-level visibility: Group memberships are surfaced alongside individual user records
Scope notes:
- 
Access reviews reflect the most recently synced data, not real-time directory state.
- 
If the sync filter is enabled, only users within the designated group appear.
⚠️ Note: Google Workspace exposes group membership, admin status, and (when enabled) admin console role assignments — but not granular app-level entitlements. If per-application permission data is needed, a supplemental HRIS or IdP integration may provide it.
 
 
 
 

### Access requests
 
Google Workspace users, groups, and admin roles are available in Vanta's Access Requests workflow.
 
What this powers in Vanta:
- 
Entitlement requests: Users can request access to specific Google Workspace groups or admin roles through Vanta.
- 
Approver context: Approvers can see what access is being requested and what it grants before approving. 
- 
Access tracking: Admins can track provisioning requests and maintain a record of access grants.
Scope notes:
- 
Google Workspace admin roles and role assignments sync automatically with the connection, so they're available in Access Requests without additional setup.
- 
For more information on Access Requests, see Managing Access Requests in Vanta <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>.
 
 
 

### Third-party app discovery
 
If vendor discovery is enabled, Vanta reads the OAuth tokens authorized by users in your domain to identify third-party applications connected to your Google Workspace environment.
 
How discovery works: 
Vanta detects apps that individual users in your domain have authorized via OAuth — these are applications that a user has granted permission to access their Google account data (e.g., "Sign in with Google" or granting a third-party tool access to calendar or drive data). These user-consented OAuth apps appear automatically on the Discovery tab in Vanta without requiring manual vendor inventories.
 
What Vanta does not detect:
- 
Admin-installed apps that do not use user-level OAuth tokens (e.g., Google Marketplace apps installed domain-wide by an admin without per-user consent)
- 
Apps authorized by suspended users — suspended user tokens are excluded by design
What this powers in Vanta:
- 
Vendor discovery: Third-party apps appear in Vanta's vendor management section without requiring manual vendor inventories.
- 
App-to-user mapping: Each app record shows which users in your domain have authorized it.
Investigating a flagged app:
To see more detail about an app that Vanta has discovered, go to Google Admin > Security > Access and data control > API Controls > App Access Control. There you can see which users have authorized the app, what scopes were granted, and whether the app is trusted, limited, or blocked in your domain.
 
Removing an app from Discovery:
To dismiss an app from the Discovery tab in Vanta, locate it on the Discovery tab and dismiss it. This removes the app from Vanta's Discovery view only — it does not revoke the app's OAuth access in Google Workspace. To revoke access, you must do so separately in Google Admin.
 
Scope notes:
- 
Discovery is scoped to active (non-suspended) users only.
- 
Requires vendor discovery to be enabled during setup, which adds the user security permission to the connection.
- 
If vendor discovery was not enabled, no vendor data will appear in Vanta. To add it later, edit the integration's features and complete the Google authorization again.

## 
 
 
 
 

## Limitations and edge cases
The following are known constraints of Vanta's Google Workspace integration.
 
 | 
Limitation | 
Detail | 
Workaround
 | 
The sync filter supports only one group
  | 
Only one Google Workspace group can be designated for the sync filter. Users outside that group will not be synced.
  | 
Ensure all relevant users are members of the single scoping group.
 | 
Empty scoping group triggers auto-disconnect | 
If scoping is enabled and the designated group has no valid members at sync time, the integration disconnects automatically. | 
Ensure the scoping group is populated before enabling scoping. 
 | 
Scoping group names must include "Vanta" | 
Only groups whose names include "Vanta" as a standalone, capitalized word appear as selectable options in Vanta's sync filter configuration. If the sync filter is enabled during setup, Vanta looks for a group named exactly Vanta; differently named groups can be selected after connecting. The name does not need to begin with Vanta.
  | 
Rename your group so that Vanta appears as its own word anywhere in the name. See Configure the sync filter for details.
 
 | 
Temporary Google suspensions are not treated as deactivations | 
A user suspended by a Google system process without a recorded suspension reason appears as active in Vanta. | 
Ensure your offboarding process suspends accounts with an explicit reason, or deletes the account entirely.
 | 
MFA detection does not work when users authenticate through an external SAML provider | 
If users access Google Workspace through a separate identity provider such as Okta, Vanta cannot detect whether MFA is enforced at the SAML layer. Affected users may fail the MFA test even if MFA is enforced elsewhere. | 
Enforce MFA directly in Google Workspace, or note this limitation when reviewing test results. For guidance on resolving the MFA test, see Resolve 'MFA on Google Workspace' Test <https://help.vanta.com/en/articles/11345534-resolve-mfa-on-google-workspace-test>.
 | 
Sync is not real-time | 
Changes in Google Workspace are reflected in Vanta after the next scheduled sync, not immediately. Syncs run hourly. | 
Wait for the next hourly sync cycle.
 | 
Vanta cannot deprovision users in Google Workspace | 
Vanta does not suspend or delete Google accounts. Offboarding must be completed directly in Google Workspace. | 
Follow your standard offboarding process in Google Workspace.
 | 
Third-party app discovery is scoped to active users only | 
Apps authorized by suspended users are not included in vendor discovery results. | 
No workaround — suspended user tokens are excluded by design.
 | 
Vanta platform admin accounts may bypass group scoping | 
By default, users who are Vanta platform admins are kept in scope regardless of Google Workspace group membership. | 
No action needed — this is intentional to prevent Vanta admin accounts from being accidentally excluded from compliance coverage.
 | 
SCIM-based provisioning is a separate configuration | 
This integration uses API-based polling, not SCIM. For SCIM-based user provisioning from Google Workspace into Vanta, a separate setup is required. | 
See Connecting Vanta & Google Workspace (SCIM)  <https://help.vanta.com/en/articles/13232005-connecting-vanta-google-workspace-scim>for the SCIM provisioning setup.
 | 
Group-based scoping reads direct members only | 
When a Google Workspace group is used for scoping, Vanta includes only users who are direct members of that group. Members of nested groups (groups whose members are themselves other groups) are not included unless they are also direct members of the top-level scoping group. Dynamically-managed groups follow the same rule — membership is evaluated at the time of each sync, and only direct membership counts. | 
Ensure all users who need to be in compliance scope are added as direct members of the designated scoping group, not just members of a sub-group. Audit direct membership before enabling scoping.
 | 
Vendor discovery can't be added without re-authorizing | 
If vendor discovery was not enabled during setup, enabling it later requires editing the integration's features and completing the Google authorization again, so the additional user security permission can be granted.
  | 
Decide whether you want vendor discovery before connecting. If adding it later, a super admin will need to complete the Google consent flow again.
 
 
 
 
 

## Permissions
This section covers what access is required to connect Google Workspace to Vanta, what permissions Vanta requests, and what Vanta does with that access.
 

### Vanta access requirements
 | 
Permission | 
Required for
 | 
Vanta admin | 
Connecting, reconnecting, and managing the Google Workspace integration
 

### Google Workspace: connecting user requirements
 | 
Requirement | 
Required or optional | 
What happens without it
 | 
Super administrator role in Google Workspace | 
Required | 
The OAuth flow cannot grant the required directory permissions. The connection will fail or return incomplete data.
 

### Google Workspace: what Vanta requests
What Vanta requests depends on one choice you make during setup: whether to enable vendor discovery. Every connection includes three read-only directory permissions. Enabling vendor discovery adds a fourth.
 
 | 
Permission | 
When it's requested | 
What it enables
 | 
View users in your directory (read-only) | 
Always | 
User sync. Without it, the integration cannot function.
 | 
View groups in your directory (read-only) | 
Always | 
Group and group membership sync, the sync filter, and group-based Access Requests.
 | 
View admin roles and assignments (read-only) | 
Always | 
Admin roles and role assignments on user records, in access reviews, and in Access Requests.
 | 
User security / OAuth token data | 
Only if vendor discovery is enabled | 
Reading the list of third-party apps your users have authorized with Google sign-in, so they surface as vendors.
 
 

### Write access
Vanta does not write to your Google Workspace directory. All data collection is read-only, and if you don't enable vendor discovery, every permission Vanta requests is classified read-only by Google.
⚠️ Note on the user security permission: If you enable vendor discovery, Vanta requests the user security permission, which allows Vanta to list the third-party apps each user has authorized with their Google account. Google publishes no read-only version of this permission — the same permission also allows revoking those authorizations and changing users' security settings. Vanta only reads the list: it never revokes an app's access and never changes a user's security settings. If you decline vendor discovery, only vendor discovery is affected; users, groups, group members, admin roles, and role assignments sync through separate read-only permissions.
 
 
 
 
 
 

## Troubleshooting and FAQs
Common questions and issues you may encounter when setting up or using Vanta’s Google Workspace integration, along with recommended solutions.
 
Before contacting Support, collect the following to reduce resolution time:
- 
The connecting user's Google Workspace account email and admin role
- 
Your Google Workspace domain name
- 
A screenshot of any error message shown in Vanta or during the Google consent flow
 

### Connection and setup 
Q: The connection failed after I approved the Google consent screen (no specific error shown)
Cause 1: The Google account used to connect is not a super administrator.
- 
Log in to admin.google.com <https://admin.google.com> to confirm your admin role. If you cannot access the full admin console, your account may have a limited admin role.
- 
Ask a current super admin to complete the connection, or request a role elevation before retrying.
Cause 2: Domain policies are blocking the connection but no error code was shown.
- 
In Google Admin, go to Security > Access and data control > API Controls and confirm Vanta is marked as Trusted. See the admin_policy_enforced entry above for the full resolution steps.
Escalate if: The connecting account is a confirmed super admin, Vanta is trusted in Google Admin, and the failure persists after retrying.
 
Q: The integration disconnected unexpectedly
Cause 1: The connecting admin account was suspended, deactivated, or lost super admin privileges. Alternatively, the OAuth token was revoked.
- 
Confirm the connecting account is still active with super admin status in Google Admin.
- 
If the account was deactivated, reconnect using a different active super admin account.
- 
To prevent recurrence: use a stable shared admin account rather than a personal employee account. See Creating a Service Account for the Google Workspace Integration <https://help.vanta.com/en/articles/11345689-creating-a-service-account-for-the-google-workspace-integration> for setup instructions.
Escalate if: The integration reconnects successfully but disconnects again within 24 hours.
Cause 2: The sync filter is enabled and the designated group was missing or empty at sync time. Vanta disconnects the integration automatically in this case.
- 
Confirm the sync filter group exists in Google Workspace and contains valid, active members.
- 
Repopulate or recreate the group, then reconnect the integration.
 
Q: I made changes in Google Admin Console. Do I need to reconnect the integration? 
A: If you have made any of the following changes in Google Workspace since the integration was first connected, reconnect the integration in Vanta to ensure the updated configuration is picked up:
- 
Modified the admin role of the account used to connect the integration
- 
Changed your domain's OAuth trust settings or app access policies (e.g., updated App Access Control)
- 
Restructured org units or changed user permissions in ways that affect Vanta's directory access
Fix: In Vanta, complete the OAuth flow again with a current Super Admin account. 
Escalate if: The reconnection fails, or the integration disconnects again within 24 hours of reconnecting.
 
Q: My group is not appearing in the sync filter dropdown
Cause: The group name does not include Vanta as a standalone, capitalized word.
- 
Confirm Vanta appears as its own word. It can appear anywhere in the name, so both Vanta Employees and Acme Corp Vanta will appear in the dropdown.
- 
Confirm the V is capitalized. Group names are matched case-sensitively.
- 
Confirm Vanta is not joined to other characters. VantaEmployees and Vanta_Employees will not be recognized, but Vanta Employees and Vanta-Contractors will.
- 
Rename the group in Google Workspace, then reopen Configure scope in Vanta.
Escalate if: The group name meets all of the above and it still does not appear after a full sync cycle.
 

### Users and data
Q: Users are missing from Vanta after the initial sync
- 
Step 1: Confirm whether the sync filter is enabled in your Vanta integration settings.
- 
Step 2: If the sync filter is enabled, confirm the missing users are members of the designated Google Workspace group.
- 
Step 3: Confirm the missing users are not archived in Google Workspace — archived accounts are excluded from sync by design.
- 
Step 4: Wait for the next hourly sync and check again.
Escalate if: Scoping is not enabled, users are active and not archived, and they are still missing after two full sync cycles.
 
Q: Third-party apps are not appearing in vendor management
- 
Step 1: Confirm vendor discovery was enabled when the integration was connected. If it wasn't, edit the integration's features to enable Discover apps used with Google sign-in, then complete the Google authorization again so the additional permission can be granted.
- 
Step 2: If vendor discovery is enabled, confirm the permission was actually granted: in Google Admin, go to Security > Access and data control > API Controls > App access control and confirm Vanta holds the user security permission.
Escalate if: The permission is confirmed as granted and vendor data is still absent after a full sync cycle.
 
Q: A rehired employee is showing as terminated in Vanta even though they're active in Google Workspace.
Cause: When a previously offboarded employee is re-added or unsuspended in Google Workspace, the next sync will detect them as active, but their previous offboarding record in Vanta may still be in place.
Fix: Go to People > find the user > click on their name. In the side panel (drawer) that opens, click Reset offboarding. This resets the offboarding record to its initial state and deletes any completed offboarding checklist tasks. The user will then re-enter your compliance scope on the next sync, provided the Google Workspace account is active and in the correct scoped group.
Escalate if: The Reset offboarding button is not visible on the user's profile, or the user does not return to active status after resetting and waiting for a full sync cycle.
 
Q: Can I trigger a manual sync or force a refresh? 
A: There is no user-facing button to manually trigger a Google Workspace sync. Syncs run automatically on an hourly schedule. Changes made in Google Workspace (new users, suspensions, group membership updates) will be reflected in Vanta after the next scheduled sync — typically within 1 hour. 
Escalate if: The data has not updated after two full sync cycles (~2 hours). 
 
Q: We have a 30-day deletion policy in Google Workspace. How should we handle offboarding in Vanta?
A: Many organizations suspend a departing employee's Google Workspace account on their last day, then automatically delete it after 30 days (to allow time for data transfer, legal holds, etc.). This works well with Vanta, but the order matters:
- 
Day 0 (last day): Suspend the user in Google Workspace. Do not delete yet.
- 
Next sync: Vanta detects the suspension and transitions the user to terminated status.
- 
Complete offboarding in Vanta: Go to People > select the user > Offboarding tab > complete all offboarding tasks.
- 
Day 30: Your automatic deletion policy runs as normal. Since offboarding is already complete in Vanta, this has no impact on your compliance posture.
⚠️ Note: If you skip the suspension and go straight to deletion at 30 days, the user disappears from the Google Workspace directory entirely. Vanta can no longer detect a status change, and the offboarding flow may become inaccessible. Always suspend immediately at offboarding — then delete on your normal schedule.

### Compliance tests
Q: The MFA test is failing for users who have MFA enabled
- 
Step 1: Confirm the affected users have 2-Step Verification actively enrolled on their individual Google accounts — not just enforced at the org policy level. Enforcement requires the user to log in and complete setup before it is active.
- 
Step 2: If users authenticate through an external SAML provider such as Okta, Vanta cannot detect MFA enforced at the SAML layer. Only MFA enforced directly in Google Workspace is visible to this integration.
- 
Step 3: Allow at least one full hourly sync cycle after enrollment before checking test results.
For step-by-step instructions on enforcing MFA in Google Admin and confirming it is active per user, see Resolve 'MFA on Google Workspace' Test <https://help.vanta.com/en/articles/11345534-resolve-mfa-on-google-workspace-test>.
Escalate if: Users have confirmed MFA enrollment directly in Google Workspace and the test is still failing after two full sync cycles.
 
Q: The MFA test is still failing for accounts I marked as service accounts
Cause: The MFA test uses the account data synced from Google Workspace. It does not consider the service account setting on the People page.
- 
Option 1: Deactivate monitoring for the affected accounts on the test. You can reactivate monitoring at any time.
- 
Option 2: Use group-based scoping to keep the accounts out of Vanta. See Configure the sync filter.
Escalate if: The accounts are out of scope or deactivated and the test is still failing after two full sync cycles.
 
Q: The deprovisioning test is failing for terminated employees
Cause: The employee's Google Workspace account was not suspended with an explicit suspension reason, or was not suspended at all.
⚠️ Do not hard-delete a user in Google Workspace before completing their offboarding in Vanta. If a user is deleted from Google Workspace before being offboarded in Vanta, their record will no longer appear in subsequent syncs — and you will not be able to complete the standard offboarding workflow in Vanta. If this has already occurred, contact Vanta Support.
- 
Step 1: In Google Admin, check the terminated user's account status and confirm whether a suspension reason is recorded.
- 
Step 2: Ensure your offboarding process suspends the user's account with an explicit reason, or deletes the account entirely. Temporary system suspensions without a recorded reason are treated as active in Vanta.
Recommended sequence: 
- 
Suspend the user's account in Google Workspace with an explicit suspension reason recorded.
- 
Wait for the next hourly sync and confirm the user appears as deactivated in Vanta.
- 
Complete offboarding in Vanta: People → [user] → Offboard. The Offboard button appears on a user's profile in Vanta once the sync detects that their Google Workspace account has been suspended or deleted. If the button is not visible, the sync has not yet picked up the account change — wait for the next hourly sync and check again.
- 
Once Vanta shows the user as offboarded, you may delete the account from Google Workspace if needed.
Escalate if: The account is confirmed as suspended with an explicit reason and the test is still failing after a full hourly sync cycle.
 
Q: MFA status is not showing for some users
Cause: Users who have never logged in to their Google account will not have MFA status data. MFA status is only recorded after the user completes initial login and MFA setup.
Fix: Ask the affected users to log in and complete MFA enrollment. Status will reflect in Vanta on the next hourly sync.
 
Q: An offboarded user is still appearing as active in Access Reviews
Cause: Offboarding a user in Vanta removes them from your personnel scope, but does not automatically deactivate their associated monitored accounts (such as their Google Workspace account record). If these accounts are not manually marked as deactivated after offboarding, they will continue to surface in Access Review workflows as active accounts requiring review.
Fix: After offboarding a user in Vanta, navigate to their profile and locate any monitored accounts still showing as active. Mark each one as deactivated.
Escalate if: Monitored accounts are not visible on the user's profile after offboarding has been completed.

## Images

- [image 01] ../../images/integrations/google-workspace/google-workspace-integration-guide--01.png
- [image 02] ../../images/integrations/google-workspace/google-workspace-integration-guide--02.png
- [image 03] ../../images/integrations/google-workspace/google-workspace-integration-guide--03.png
- [image 04] ../../images/integrations/google-workspace/google-workspace-integration-guide--04.png
- [image 05] ../../images/integrations/google-workspace/google-workspace-integration-guide--05.png
- [image 06] ../../images/integrations/google-workspace/google-workspace-integration-guide--06.png
- [image 07] ../../images/ux/integrations/google-workspace-integration-guide--07.png
- [image 08] ../../images/ux/integrations/google-workspace-integration-guide--08.png
- [image 09] ../../images/integrations/google-workspace/google-workspace-integration-guide--09.png
- [image 10] ../../images/integrations/google-workspace/google-workspace-integration-guide--10.png
- [image 11] ../../images/integrations/google-workspace/google-workspace-integration-guide--11.png
- [image 12] ../../images/integrations/google-workspace/google-workspace-integration-guide--12.png
- [image 13] ../../images/integrations/google-workspace/google-workspace-integration-guide--13.png
- [image 14] ../../images/ux/integrations/google-workspace-integration-guide--14.png
- [image 15] ../../images/ux/integrations/google-workspace-integration-guide--15.png
- [image 16] ../../images/ux/tests/google-workspace-integration-guide--16.png
