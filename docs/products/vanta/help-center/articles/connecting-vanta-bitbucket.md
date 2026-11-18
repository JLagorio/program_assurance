# Connecting Vanta & Bitbucket

Source: https://help.vanta.com/en/articles/11345985-connecting-vanta-bitbucket
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Overview
The Bitbucket integration connects a Bitbucket Cloud workspace to Vanta over OAuth to monitor who has access to your workspace and how its repositories are protected. We import workspace members and pending invitations, repositories and their branch restrictions, and merged pull requests. Use it to run access reviews, show that code changes were reviewed, and catch accounts that should have been removed.
 
 

## Use cases and capabilities
- 
Personnel Matching: Match Bitbucket accounts to people in your personnel records.
- 
Access Reviews: Find accounts that stay active after someone leaves. We import each member's workspace permission, last access time, and account status.
- 
MFA Monitoring: Check that members have two-step verification turned on.
- 
Repository Protection Monitoring: Track how many approvals each repository requires before merging to the main branch, including the users and groups exempt from each branch restriction.
- 
Change Management Evidence: Verify that merged pull requests were approved and passed their builds.
- 
Invitation Review: Flag invitations that have been pending too long.
- 
Repository Sync Filters: Choose which repositories we sync: all of them, all except specific ones, or only specific ones.
⚠️ Note: We sync only the repositories that the connected Bitbucket account administers, because Bitbucket shows branch restrictions only to repository admins.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
User Accounts | 
Yes | 
Personnel matching, access reviews; includes workspace permission, last access time, and account status
 | 
Two-Step Verification Status | 
Yes (Bitbucket only) | 
MFA checks. We check Bitbucket two-step verification; Atlassian MFA is not supported for this test
 | 
Pending Invitations | 
Partial | 
Review of pending workspace invitations; not available for workspaces managed in Atlassian Administration
 | 
Repositories | 
Yes (administered repositories only) | 
Repository inventory and protection monitoring
 | 
Repository Sync Filters | 
Yes | 
Sync all repositories, all except specific ones, or only specific ones
 | 
Branch Restrictions | 
Yes | 
Required approvals before merging to the main branch, including users and groups exempt from a restriction; project-level inherited permissions are not available
 | 
Merged Pull Requests | 
Yes | 
Change management evidence: approvals and builds
 | 
Write Access to Bitbucket | 
No | 
Not supported – We only read data from Bitbucket
 | 
Access Offboarding | 
No | 
Not supported – Remove departed members' access directly in Bitbucket
 | 
Multiple Bitbucket Connections | 
Yes | 
A single Vanta org can connect multiple workspaces, one workspace per connection
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta account with permission to add or manage integrations.
- 
You have workspace admin access to the Bitbucket Cloud workspace you want to connect.
💡 Tip: Sign in with a dedicated workspace admin account rather than an individual's personal account, so the connection keeps working if that person's access changes or they leave your company.
 
 

## Explore the integrations page 
When you navigate to the Bitbucket integration, you'll land on its listing page, which includes five tabs that cover what you need to know before (and after) you connect.
- 
Overview — Start here. A summary of what the integration does, its top capabilities, and the prerequisites you'll need in place before connecting. When you're ready, select Connect to begin setup.
- 
API permissions — Exactly what access Vanta requests from Bitbucket: each permission's scope, whether it's read or write, and what data it covers, etc. Share this tab with your security team if they need to review access before you connect.
- 
Resource types — Every resource type Vanta imports from Bitbucket, down to the specific fields collected for each. Use this to understand exactly what data will show up in Vanta once connected.
- 
Automated tests — How many tests connecting Bitbucket unlocks and which frameworks and controls they map to (SOC 2, ISO 27001, etc.), plus the full list of tests by name. Useful for scoping compliance coverage ahead of an audit.
- 
Security — How Vanta protects the data it collects — encryption, data retention, access controls, and infrastructure. Visit Vanta's Trust Center <https://trust.vanta.com/> for the full picture.
When you’re ready to connect, continue to the setup guide below.
 
 
 

## Setup guide

### Step 1: Find the Bitbucket integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Bitbucket. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
On the Bitbucket listing page, click Connect.
 

### Step 2: Sign in to Bitbucket
- 
The connection experience opens and explains what we read: the members, repositories, pull requests, and pending invitations of the Bitbucket workspace you select next. It also explains that we ask for repository admin access because Bitbucket shows branch restrictions only to repository admins, and that we never write to Bitbucket. Click Connect to go to Bitbucket.
- 
Sign in to Bitbucket with an Atlassian account that is an admin of the workspace you want to connect.
- 
If you've approved Vanta before, Bitbucket may skip the permissions screen. Otherwise, review the access Vanta is requesting, then click Accept. For what each permission is used for, see Permissions.
- 
Bitbucket returns you to Vanta. 
 

### Step 3: Choose workspace
- 
Choose which Bitbucket workspace this connection covers. We monitor only the workspace you pick. In Workspace, select the workspace you want to monitor. The list shows every workspace your account can access.
- 
Click Save. We check your admin access. If you're not an admin of the workspace, select another workspace or reconnect with an admin account.
ℹ️ Note: To monitor another workspace, connect Bitbucket again as a separate connection. Each connection covers one workspace.
 

### Step 4: Set sync filters
Choose which repositories in this workspace we sync. We sync only repositories your account administers. This choice doesn't change which workspace members and pending invitations we import.
- 
In Repositories to sync, choose one option:
- 
All repositories: We sync every repository you administer, including ones created later.
- 
All except the ones I pick: Pick the repositories to leave out in Repositories to skip. New repositories sync automatically.
- 
Only the ones I pick: Pick the repositories to sync in Repositories to sync. New repositories don't sync until you add them.
- 
If you choose All except the ones I pick or Only the ones I pick, pick at least one repository, or choose All repositories.
- 
Click Save.
ℹ️ Note: You can change your selection later by editing the connection. Changes apply from the next sync. We stop syncing a repository and its pull requests from that point if you leave it out, and if you add a repository back, we sync it again.
 

## Step 5: Confirm the connection
- 
After you save your sync filters, you'll see a message confirming that you're connected, and we start importing data.
 
 

## Permissions

### Read access
Bitbucket asks you to approve the following access when you connect. Each permission links to Bitbucket's documentation for that scope.
- 
Account: We read workspace members, their permissions, two-step verification status, last access times, and account status, plus pending invitation email addresses, to monitor who has access to your workspace.
- 
Repositories: We read repository names, visibility, main branches, branching models, and project keys to check how your repositories are protected.
- 
Pull requests: We read pull request titles, authors and reviewers, approvals, and build statuses to verify that code changes were reviewed before merging.
- 
Administer repositories: We read branch restrictions and required approval counts. Bitbucket shows these only to repository admins.
ℹ️ Note: Bitbucket's permissions screen also lists your account's primary email address and your workspace's project settings. We don't read either today.
 

### Write access
We never write to Bitbucket. We request "Administer repositories" only to read and test branch restrictions, because Bitbucket has no read-only permission for them.
 
 

## Troubleshooting and FAQs

### The Bitbucket MFA test is failing
- 
Likely cause: The user enabled Atlassian MFA instead of Bitbucket two-step verification. Our Bitbucket integration specifically checks Bitbucket two-step verification, and Atlassian MFA is not currently supported for this test.
- 
How to confirm: In Bitbucket, go to your account settings and check whether two-step verification is turned on under Personal settings > Security. Compare your page to the Bitbucket and Atlassian examples below.
- 
Fix: Enable two-step verification directly in Bitbucket: 
- 
Go to your Bitbucket account settings.
- 
Under Settings, select Personal settings.
- 
Under Security, choose Two-step verification.
- 
Turn on two-step verification.

### Repositories are not showing up in Vanta
- 
Likely cause: We import only the repositories that the connected Bitbucket account administers, and only the ones your sync filters include. Repositories are missing when the account that connected the integration is not a workspace admin or an admin of those repositories, or when the repository is excluded by your sync filters.
- 
How to confirm: In Bitbucket, check that the connected account is a workspace admin and has admin access to the missing repositories. Then review the sync filters on your Bitbucket connection.
- 
Fix: Reconnect with a workspace admin account, give the connected account admin access to the missing repositories, or update your sync filters to include them. We pick up the change on the next sync.

### A new repository isn't syncing
- 
Likely cause: Your connection is set to Only the ones I pick, so new repositories don't sync until you add them. It can also happen if the connected account isn't an admin of the new repository.
- 
How to confirm: Review the sync filters on your Bitbucket connection, and check the connected account's access to the repository in Bitbucket.
- 
Fix: Edit the connection and add the repository, or switch to All repositories or All except the ones I pick so new repositories sync automatically.

### A repository I excluded is still showing in Vanta
- 
Likely cause: Sync filter changes apply from the next sync.
- 
How to confirm: Check when your most recent sync ran.
- 
Fix: Wait for the next sync. If the repository is still there afterward, contact Vanta support.

### Pending invitations are not showing up in Vanta
- 
Likely cause: Bitbucket doesn't share pending invitations for workspaces managed in Atlassian Administration (admin.atlassian.com), so we can't read them for those workspaces.
- 
How to confirm: Check whether your Bitbucket workspace is managed from Atlassian Administration.
- 
Fix: Review pending invitations in Atlassian Administration instead. The rest of the workspace keeps syncing.

### Bitbucket didn't grant Vanta a required permission
- 
Likely cause: Bitbucket didn't grant one or more of the permissions we require. The message names the missing permission, for example: Bitbucket didn't grant Vanta the "Administer your repositories" permission.
- 
How to confirm: The message lists exactly which permissions are missing.
- 
Fix: Reconnect and approve access. If this happens again, contact Vanta support.

### The connected account isn't an admin of this workspace
- 
Likely cause: The connected account doesn't have admin access to the workspace you selected. If we can read part of the workspace, the message also lists what we can't read, such as members or pending invitations.
- 
How to confirm: Check the account's role in the workspace in Bitbucket.
- 
Fix: Choose another workspace, or reconnect as a workspace admin.

### I see "Bitbucket didn't let Vanta read" a repository or pull request detail
- 
Likely cause: Bitbucket wouldn't let us read one item, such as a repository's branch restrictions or a pull request's builds, during a sync. The rest of the workspace keeps syncing.
- 
How to confirm: Check that the connected account is still a workspace admin in Bitbucket.
- 
Fix: We try again on the next sync. If the message keeps appearing after confirming admin access, contact Vanta support.

### I see "We're having some trouble getting data"
- 
Likely cause: We are unable to fetch data from your Bitbucket workspace. The most common cause is missing or insufficient workspace or repository administrator permissions for the connected account.
- 
How to confirm: In Bitbucket, check that the connected account is a workspace admin and has admin access to your repositories.
- 
Fix: Reconnect with a workspace admin account, or grant the connected account the missing admin permissions in Bitbucket.

### I see "Bitbucket couldn't find" a repository or pull request detail
- 
Likely cause: The item was deleted or moved in Bitbucket while a sync was running.
- 
How to confirm: Check in Bitbucket whether the repository or pull request was recently deleted or moved.
- 
Fix: No action is needed. We try again on the next sync. If the message keeps appearing, contact Vanta support.

### Project-level branch permissions are not showing
- 
Likely cause: Bitbucket's API does not currently support determining whether a repository has inherited branch permissions from the project level. As a result, project-level branch permissions may not appear for individual repositories.
- 
How to confirm: In Bitbucket, check whether the branch permissions you expect are defined at the project level rather than on the repository.
- 
Fix: This is a known limitation in Bitbucket with no fix on our side. You can learn more in this Bitbucket Community post and track the issue in Atlassian's public Jira ticket:
- 
Bitbucket Community Post <https://community.atlassian.com/forums/Bitbucket-questions/Bitbucket-Cloud-API-Project-level-branch-permissions-not-Repo/qaq-p/2605108>
- 
Atlassian Jira issue (BCLOUD-22732) <https://jira.atlassian.com/browse/BCLOUD-22732>

## Images

- none
