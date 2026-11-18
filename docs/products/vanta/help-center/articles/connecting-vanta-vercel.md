# Connecting Vanta & Vercel

Source: https://help.vanta.com/en/articles/11345731-connecting-vanta-vercel
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

The Vercel integration connects your Vercel teams to Vanta using an access token, enabling user account syncing for access reviews and project import for your Vanta inventory. It is best suited for teams that host applications on Vercel and need to track who has access to them.
 
Estimated setup time: 5-10 minutes
 
 

## Use cases and capabilities
- 
User Account Tracking: Connect Vercel and we automatically sync your team members, including each member’s role, to support personnel tracking and access review workflows.
- 
Access Reviews: Run access reviews on your Vercel team members and find accounts that stay active after someone leaves your organization.
- 
Inventory: We import your Vercel projects into your Vanta inventory so you can keep an up-to-date record of the applications your organization hosts.
⚠️ Note: Vanta imports Access and Inventory together. You cannot turn either capability off on its own.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Team Members | 
Yes | 
Personnel tracking, access reviews
 | 
Member Roles | 
Yes | 
Displayed on Vercel accounts in Vanta
 | 
Linked Git Logins | 
Yes | 
GitHub, GitLab, and Bitbucket logins linked to each member
 | 
SSO and Directory Sync IDs | 
Yes | 
SSO, directory sync, and identity provider user IDs linked to each member
 | 
Projects | 
Yes | 
Inventory (surfaced as PaaS apps)
 | 
Project Configuration | 
Yes | 
Project settings imported with each project
 | 
Environment Variables | 
Partial | 
Variable names and managed store types only. We never store variable values.
 | 
Multiple Vercel Connections | 
Yes | 
A single Vanta org can connect multiple Vercel tokens
 | 
Per-Capability Toggles | 
No | 
Not supported. Access and Inventory are always imported together.
 | 
Automated Deprovisioning | 
No | 
Not supported. Use Vanta’s built-in offboarding workflows.
 | 
Vanta Gov | 
No | 
Not supported. The integration is available in the commercial cloud only.
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have a Vercel account that can view the members of every team you want to sync.
- 
Tokens from accounts that cannot view a team’s members will fail to connect.
💡 Tip: Create the token from a dedicated Vercel account instead of a person’s own account, so the connection keeps working if their access changes. Decide in advance whether you want to sync every team the account belongs to (a Full Account token) or a single team.
 
 

## Explore the integrations page 
When you navigate to the Vercel integration, you'll land on its listing page, which includes five tabs that cover what you need to know before (and after) you connect.
- 
Overview — Start here. A summary of what the integration does, its top capabilities, and the prerequisites you'll need in place before connecting. When you're ready, select Connect to begin setup.
- 
API permissions — Exactly what access Vanta requests from Vercel: each permission's scope, whether it's read or write, and what data it covers, etc. Share this tab with your security team if they need to review access before you connect.
- 
Resource types — Every resource type Vanta imports from Vercel, down to the specific fields collected for each. Use this to understand exactly what data will show up in Vanta once connected.
- 
Automated tests — How many tests connecting Vercel unlocks and which frameworks and controls they map to (SOC 2, ISO 27001, etc.), plus the full list of tests by name. Useful for scoping compliance coverage ahead of an audit.
- 
Security — How Vanta protects the data it collects — encryption, data retention, access controls, and infrastructure. Visit Vanta's Trust Center <https://trust.vanta.com/> for the full picture.
When you’re ready to connect, continue to the setup guide below.
 
 
 
 

## Setup guide

### Step 1: Find the Vercel integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Vercel. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2766277110/3df969fc7071f275d2b55c064f9e/image.png?expires=1794967200&signature=530f1ec9124e7fc863d0e754a74a1c14718ceae23ee8ca072f7da053ba9e32f3&req=dichEMt5moBeWfMW1HO4zRM1nl8Jrsv5Z4ZvO8dKOycgtTGKsbjR0UNjaceL%0AWbfSm4t63yuKknwEF10%3D%0A>
 

### Step 2: Create an access token in Vercel
- 
Sign in to Vercel and go to the Account Tokens page <https://vercel.com/account/tokens>.
- 
Enter a name for the token, such as Vanta.
- 
In Scope, select one of the following:
- 
Full Account: We import members and projects for every team the account belongs to.
- 
A single team: Select the team, then select All Projects. We import that team’s members and projects.
- 
In Expiration, select No Expiration. If the token expires, we stop syncing Vercel.
- 
Click Create, then copy the token. Vercel does not show it again after you close the window.
⚠️ Note: Project-scoped tokens are not supported.
 

### Step 3: Enter the token in Vanta
- 
On the Connect Vercel page, paste your token into the Access Token field.
- 
Click Connect.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2766283057/9bb28b4b7ce5c7f82589f8d0ba8f/image.png?expires=1794967200&signature=fa595989955a989d1af51f7a290763d6d858f82437ebef2ef5f3a3ba0bdd0f9d&req=dichEMt2noFaXvMW1HO4zZ4clpdgfr5QiR57a3BvFxESwFzhTAv3CJa3lEGr%0AlRimuctQRnGyySRks8A%3D%0A>
 
 

### Step 4: Set sync filters
- 
After you click Connect, Vanta shows the Set sync filters step. It explains that you can choose which Vercel projects Vanta imports and that team members are always imported.
- 
In the Projects to sync field, start typing to search for a project, then select it. You can select as many projects as you want.
- 
To import every project, leave the field empty.
- 
Click Save.
⚠️ Note: If you select projects, we import only those projects. New projects you create in Vercel won’t appear in Vanta until you add them to this list. We always import your team members, regardless of your project selection.
 
 

### Step 5: Confirm the connection
- 
After connecting, the Vercel integration should appear as Connected in your Vanta integrations list.
- 
We begin an initial sync immediately after setup completes.
ℹ️ Note: New connections are named after your token and its scope, for example Vanta - All Teams or Vanta - Marketing. Connections created before this update keep their original name, which is the token name only. If you need to connect additional Vercel tokens, you can add multiple Vercel connections from the same integrations page.
 
 

## Permissions

### Read access
We use the token you provide to read your Vercel teams, team members, and projects. Specifically, we read:
- 
User identifiers, names, usernames, and email addresses
- 
Linked GitHub, GitLab, and Bitbucket logins
- 
SSO, directory sync, and identity provider user IDs
- 
How each member joined the team, including any Git repository and commit
- 
Team names, team membership, and roles
- 
Project names and configuration
- 
Environment variable names and managed store types (we never store values)

### Write access
We do not have write access to your Vercel account. We do not create, modify, or delete any Vercel teams, members, projects, or environment variables.
 
 

## Troubleshooting and FAQs

### Vanta says Vercel didn’t accept the token
- 
Likely cause: The token is expired, deleted, or incomplete (for example, part of the token was cut off when copying).
- 
How to confirm: Go to the Account Tokens page <https://vercel.com/account/tokens> in Vercel and check that the token exists and has not expired.
- 
Fix: Create a new token following Step 2 and enter it in the Access Token field.

### Vanta couldn’t read the members of a team
- 
Likely cause: The Vercel account that created the token cannot view that team’s members.
- 
How to confirm: Sign in to Vercel with the same account and check whether you can open the team’s Members page.
- 
Fix: Create a token from an account that can view the team’s members, or scope a new token to a team where the account has that access. Then reconnect.

### The token can’t read the team it’s scoped to
- 
Likely cause: The token is scoped to a single team, but All Projects was not selected, or the creating account lost access to the team.
- 
How to confirm: In Vercel, open the token’s settings and check its scope.
- 
Fix: Create a new token scoped to a team you can access, with All Projects selected.

### The token’s account isn’t on any team
- 
Likely cause: The Vercel account that created the token does not belong to a team, so there are no members to import.
- 
How to confirm: In Vercel, check whether the account is a member of at least one team.
- 
Fix: Create a token from an account that belongs to your team, then reconnect.

### Members from some teams are missing in Vanta
- 
Likely cause: The token is scoped to a single team, so we only import members and projects for that team.
- 
How to confirm: In Vercel, open the token’s settings and check whether Scope is set to one team or Full Account.
- 
Fix: Create a new token with Full Account scope, or connect a separate token for each additional team.

### Vercel stopped syncing
- 
Likely cause: The token expired or was deleted in Vercel.
- 
How to confirm: Go to the Account Tokens page <https://vercel.com/account/tokens> in Vercel and check whether the token still exists and is active.
- 
Fix: Create a new token with No Expiration following Step 2, then update the Vercel connection in Vanta with the new token.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-vercel--01.png
- [image 02] ../../images/integrations/vercel/connecting-vanta-vercel--02.png
