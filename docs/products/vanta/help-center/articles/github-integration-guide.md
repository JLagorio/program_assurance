# GitHub: Integration Guide

Source: https://help.vanta.com/en/articles/14845240-github-integration-guide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Version Control Systems
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 

## Overview
If your team uses GitHub for code review and repository management, this integration brings that activity into Vanta automatically. Vanta lets compliance monitoring happen in the background without pulling anyone out of their workflow. Vanta reads your repository settings, pull request history, org membership, and vulnerability alerts directly from GitHub — so your team keeps working in GitHub while Vanta handles the evidence collection.
 
This integration guide covers setup instructions for GitHub Cloud (Free, Team, and Enterprise Cloud on github.com). All other sections of this guide (including data collection, test behavior, permissions, limitations, and troubleshooting) apply to all GitHub connection types.
 
New to this integration? Start with the GitHub: Quickstart <https://help.vanta.com/en/articles/14844982-github-quickstart> for a 5-minute setup walkthrough (GitHub Cloud).
 

### What you can do with this integration: 
- 
Automatically verify branch protection is enforced.
- 
Track whether code changes are reviewed before deployment.
- 
Monitor open vulnerabilities and SLA compliance.
⚠️ Note: Dependabot must be enabled in your GitHub organization before Vanta can pull alert data. 
- 
Track security issues as compliance evidence.
- 
Keep access data current for reviews.

### Connection details
 | 
Connection type | 
GitHub App installation: Vanta connects using a GitHub App, not a personal access token or OAuth.
 | 
Access level | 
By default, Vanta requests read-only access. During Cloud setup, you can optionally grant read and write access to enable automated task tracking and resolution features. Write access is not required for compliance monitoring.
 | 
Who should connect | 
A GitHub Organization Owner is required to install GitHub Apps and access organization member data. We recommend choosing someone with a stable role, as the integration will need to be reconnected if their Owner access is removed.
 | 
Multiple GitHub organizations | 
Each GitHub org is a separate connection in Vanta. Repeat the setup for each org you want to monitor. If you need to connect the same org to more than one Vanta account, use the Cloud (Custom App) connection type. This option is only visible to Vanta workspace accounts — contact Vanta Support if you need access.
 | 
Estimated setup time | 
~5 minutes (GitHub Cloud); ~20–30 minutes (Enterprise Server or Enterprise Cloud with data residency).

### Identify your GitHub type
Before connecting, confirm which GitHub variant your organization uses. Selecting the wrong type is a common setup error. 
 | 
GitHub Type | 
URL Pattern | 
Select this in Vanta
 | 
GitHub Cloud (Free, Team, Enterprise Cloud) | 
github.com | 
Cloud
 | 
Enterprise Server (self-hosted) | 
github.yourcompany.com <http://github.yourcompany.com> or any self-hosted URL  | 
Enterprise server (self-hosted)
This connection is not available on Vanta’s Gov Cloud region. 
 | 
Enterprise Cloud with data residency | 
yourcompany.ghe.com | 
Enterprise Cloud (with data residency)
 | 
GitHub Cloud (Custom App) | 
github.com <https://github.com>, but you need to connect the same org to multiple Vanta accounts  | 
Cloud (Custom App)
This option is only visible to accounts that are part of a Vanta workspace. If you don’t see it and expect to, contact Vanta Support. 
 | 
💡 Tip: Not sure which one you have? If you log into GitHub at github.com using your work email, you are on GitHub Cloud. If you access GitHub at a custom company URL, you are on Enterprise Server or Enterprise Cloud with data residency.
 
 

## What Vanta collects and why
This section covers the data Vanta reads from GitHub and why each field is collected. For details on how Vanta uses the data within specific workflows, including branch protection tests, vulnerability management, and access reviews, see the Use Cases and Capabilities section.  
 

### Scope - What Vanta monitors 
Vanta reads from all repositories and org-level data the GitHub App can access. Repository scope is set during initial connection and can be adjusted at any time in your GitHub App settings.
 
Repository scope note: If you selected Only selected repositories during setup, Vanta will only monitor those repos. Repositories added to your org after the initial connection won’t be monitored automatically unless you switch to All repositories or manually add them in GitHub. Archived repositories are automatically excluded from Vanta’s monitoring and will not appear in test results.
 

### Repositories
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Repository name | 
Full name including org prefix | 
Identifies the repo within Vanta tests and evidence
 | 
Visibility | 
Public, private, or internal | 
Used to scope monitoring and flag publicly visible repos
 | 
Default branch | 
The branch GitHub designates as default | 
Used as the fallback evaluation branch if no production branch is set
 | 
Production branch | 
Value of the vanta_production_branch_name custom property, if set | 
Determines which branch Vanta evaluates for compliance tests
 | 
Fork status | 
Whether the repo is a fork | 
Used to apply appropriate scoping for forked repositories
 | 
Branch protection rules (classic) | 
Enforcement settings including whether admins are included, required approvals, and required status checks | 
Powers the branch protection and code review automated tests
 | 
GitHub Rulesets | 
Active rulesets that apply to the production or default branch, including required approval counts | 
Combined with classic rules to determine the effective required approval count
 | 
Vulnerability alerts enabled | 
Whether Dependabot alerts are turned on for the repo | 
Determines whether Vanta can pull vulnerability data for this repo

### Pull requests
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Merge status | 
Whether the PR was merged (not just closed) | 
Only merged PRs are evaluated — open or closed-without-merge PRs are excluded
 | 
Target branch | 
The branch the PR was merged into | 
Used to confirm the PR targeted the production or default branch
 | 
Approval count | 
Number of unique approving reviews on the pull request | 
Evaluated against the required approval count for the branch
 | 
Author | 
The GitHub user who opened the PR | 
Used to confirm the approver is a different person than the author
 | 
Approver(s) | 
The GitHub user(s) who approved the PR | 
Used to confirm review happened before merge
 | 
Merge timestamp | 
When the PR was merged | 
Used for incremental sync — Vanta only fetches PRs merged since the last sync
ℹ️ Note: Bot-authored PRs (such as those from Dependabot or Renovate) are evaluated under the same rules as human-authored PRs.
ℹ️ Note: If a pull request author's GitHub account has been deleted, Vanta records the author as ghost (GitHub's default placeholder for deleted accounts). This may appear in your PR evidence as an unknown or unlinked user. No action is needed — this is expected behavior when a GitHub account no longer exists.

### Organization members and collaborators
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Username | 
GitHub handle | 
Identifies the account within Vanta
 | 
Public email address | 
The email set as public on the GitHub profile | 
Used to match the GitHub account to a Vanta user record
 | 
Role | 
Admin or member | 
Surfaces privileged accounts for access review
 | 
MFA status | 
Whether multi-factor authentication is enabled | 
Powers MFA compliance tests
 | 
Collaborator type | 
Organization member vs. outside collaborator | 
Used to distinguish internal users from external contributors
⚠️ Note: Vanta can only read public email addresses from GitHub profiles. If a user's email is set to private in GitHub, Vanta won’t be able to match their account to a Vanta user automatically. The user will need to set a public email or be mapped manually.

### Dependabot vulnerability alerts
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Severity | 
Low, medium, high, or critical | 
Used to categorize alerts and apply the correct SLA tier
 | 
Affected package | 
The dependency with the vulnerability | 
Identifies what needs to be updated or remediated
 | 
Alert status | 
Open or resolved (including fixed, dismissed, or auto-dismissed) | 
Determines whether the alert counts as an active finding in Vanta
 | 
Alert creation date | 
When Dependabot first flagged the vulnerability | 
Establishes when the SLA clock started
 
Dependabot must be enabled in your GitHub org before Vanta can collect alert data. Vanta cannot retroactively pull alerts that existed before Dependabot was enabled.
 

### Pending organization invitations
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Invitee | 
The email or username the invitation was sent to | 
Identifies the account with a pending invitation
 | 
Invitation status | 
Whether the invitation is still pending | 
Used in access review workflows to surface unaccepted invitations

### GitHub issues (security-labeled)
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Title | 
Issue summary | 
Identifies the security task being tracked
 | 
Status | 
Open or closed | 
Determines whether the task is resolved in Vanta
 | 
Label(s) | 
All labels applied to the issue | 
- 
Used to identify which issues Vanta should import
- 
By default, issues must include the security label
- 
You can configure a different label in the GitHub integration settings on the Integrations page in Vanta
 | 
Creation date | 
When the issue was opened | 
Establishes when the work was logged
 | 
Resolution date | 
When the issue was closed | 
Used to determine whether the issue was resolved within your policy SLA

### What Vanta does not collect
 | 
Not collected | 
Notes
 | 
Repository code or file contents | 
Vanta never reads the contents of your code
 | 
Commit history | 
Individual commits are not collected
 | 
GitHub Actions or CI/CD pipeline data | 
Workflow runs and pipeline configurations are not collected
 | 
Issue comments | 
Comments on GitHub Issues are not synced
 | 
Private email addresses | 
Only public GitHub profile emails are readable; private emails cannot be used for account matching
 | 
SSH keys or personal access tokens | 
Not collected
 | 
GitHub Projects (project boards) | 
Board and project configuration data are not collected
 | 
Due dates on issues | 
Not collected
 | 
Story points or custom fields on issues | 
Not collected
 | 
Organization billing or license data | 
Not collected
 | 
Wiki content | 
Not collected
 
 

## Prerequisites and readiness checklist
Complete all items in this checklist before starting setup. 
 
Who should connect: A Vanta admin, using a GitHub account that holds Organization Owner status in the GitHub org you want to connect. Org Owner access is required to install the Vanta GitHub App and read org member data. Standard members and outside collaborators cannot complete this setup.
 

### Confirm you have a GitHub Organization (not a personal account) 
Vanta connects to GitHub Organizations, not personal accounts. If you install the Vanta app on a personal account, the connection will fail with an Internal Server Error.
- 
To confirm you have an org: log into GitHub and look for your organization name in the left-hand sidebar under Your organizations. If you only see your personal username, you don’t have an org set up.
- 
Personal accounts cannot be used as a workaround. If your team works out of a personal account, you will need to create a GitHub Organization before connecting.
Why this matters: GitHub's API surfaces org-level data — membership, roles, and repository settings — only at the organization scope. Personal accounts do not expose this data.
 

### Confirm you are an Organization Owner
Only GitHub Organization Owners can install GitHub Apps and access org member information.
To check your role:
- 
Go to your GitHub organization page
- 
Click People in the top navigation
- 
Find your account — your role will show as Owner or Member. If you are listed as a Member, ask a current Owner to either elevate your role or complete the Vanta connection on your behalf.
Why this matters: If the connecting user is not an Org Owner, the GitHub App installation will fail, and Vanta won’t be able to read member data, roles, or MFA status.
 

### (Strongly recommended) Use a stable Owner account 
The GitHub App is installed and authenticated under the account that completes the setup. If that person later loses their Organization Owner role or leaves the company, the integration may need to be reconnected.
 
We recommend that the connecting account be tied to a stable, monitored identity — ideally a shared admin or service account used for tool integrations — rather than a personal employee account.
 
Why this matters: If the connecting user's Owner access is revoked or their GitHub account is deactivated, Vanta's authentication will break and syncs will stop until the integration is reconnected under a valid Owner account.
 

### Uninstall any previous Vanta GitHub app (if reconnecting)
If your organization has previously connected to Vanta and you are reconnecting — for example, after a credential issue or a workspace migration — you must uninstall the existing Vanta GitHub App before starting the setup again. See How to uninstall the Vanta Application from GitHub <https://help.vanta.com/en/articles/11345929-how-to-uninstall-the-vanta-application-from-github> to learn more.
 

### For Enterprise Server only - Add Vanta’s IP to your allowlist 
If your GitHub Enterprise Server instance has an IP allowlist enabled, you must add Vanta's IP address before attempting to connect. If you skip this step, the connection will fail with a Bad credentials error even if your credentials are correct.
To find Vanta's IP address:
- 
While connecting GitHub in Vanta, the second page of the connection flow will list Vanta’s IP address on the right panel. 
To add it in GitHub Enterprise:
- 
Go to your org's Settings > Security > IP allow list
- 
Add Vanta's IP address
- 
Save
Why this matters: GitHub Enterprise's IP allowlist blocks all inbound requests from addresses not explicitly approved — including Vanta's sync requests.
⚠️ Note for Enterprise Server: You must install the GitHub App at the Organization level, not the Enterprise level. Installing at the enterprise level causes OAuth redirect errors and the connection won’t complete.
 

### For Enterprise Cloud with data residency only - Contact Vanta Support before setup 
If your organization is on GitHub Enterprise Cloud with data residency (your GitHub URL ends in .ghe.com), this connection variant requires Vanta to enable a feature on your account before the setup option is visible. In addition, this requires Enterprise Owner status (not just Organization Owner). 
- 
Contact Vanta Support and request enablement for Enterprise Cloud with data residency.
- 
Do not attempt to connect using the standard Cloud option — it won’t work for .ghe.com domains.
Why this matters: This variant uses a different connection flow that is not enabled by default. Starting the wrong flow will result in a failed connection.
 

### (Optional but recommended) Enable Dependabot in GitHub
If you want Vanta to monitor open vulnerabilities and track SLA compliance, Dependabot must be enabled in your GitHub organization before connecting.
To enable Dependabot:
- 
In GitHub, go to your org's Settings > Security > Code security and analysis
- 
Enable Dependabot alerts
- 
Optionally enable Dependabot security updates if you want GitHub to automatically open PRs for fixes
Why this matters: Vanta pulls vulnerability data from Dependabot's alert API. If Dependabot is not active, Vanta has nothing to read — vulnerability tests will show no data rather than passing or failing.
 

### (Optional) Set up your production branch before connecting
If your repositories use a production branch with a name other than your default branch (for example, release or production instead of main), configure the vanta_production_branch_name custom property in GitHub before connecting.
This ensures Vanta evaluates the correct branch from the first sync.
 
To set it:
- 
In GitHub, go to your org's Settings > Custom properties.
- 
Create a property named vanta_production_branch_name.
- 
Set the value to your production branch name.
 
 
 
 

### Readiness Checklist — Quick Reference
Before proceeding to setup, confirm all of the following:
- 
You have a GitHub Organization (not a personal account)
- 
You have Organization Owner role in that GitHub org
- 
You have Vanta admin access
- 
If reconnecting: the previous Vanta GitHub App has been uninstalled from your org
- 
(Enterprise Server only) Vanta's IP address has been added to your GitHub Enterprise IP allowlist
- 
(Enterprise Server only) You will install the app at the Organization level, not the Enterprise level
- 
(Enterprise Cloud with data residency only) You have contacted Vanta Support to enable this variant on your account
- 
(Optional) Dependabot is enabled in your GitHub org if you want vulnerability scanning
- 
(Optional) vanta_production_branch_name custom property is set if your production branch differs from your default branch
- 
The account completing setup is stable and will retain Owner access long-term
 
 

## Setup guide
Here are the steps to connect. 
 

### Step 1: Open the GitHub integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for GitHub. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338188229/5f88ae59e418b7416b3d88de8ecb/fa4d51db-cb5b-4cd4-8265-f78454c70d42?expires=1794967200&signature=98ac85f22f19920d6f60cac01340906cca938b05ee6de77980ec0e270e15012c&req=diMkHsh2lYNdUPMW1HO4zfvGI8TKif%2BESkzesJaaOG69bs1CEu94ZC0U0kVu%0A2qKbl%2BK0%2BmFh8os62I8%3D%0A>
 

### Step 2: Select your GitHub type (this setup flow covers GitHub Cloud)
- 
Before proceeding, confirm which GitHub variant your organization uses. Then click Next. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338194933/1f027771d293b936828a24821448/12e0e5f8-fefa-472e-99d5-f0faaa81237d?expires=1794967200&signature=063e62dfeeec7a21b067d36e47756deddcd75ad1f52ea78d8cb175e3628ee3d1&req=diMkHsh3mYhcWvMW1HO4zSMdZvg9%2Frk3IRqpfmfywCdO9WO%2FSK%2FZ5iS%2BdK%2BY%0A4CZ%2FMCDP0ERRDpal2Rs%3D%0A>
- 
Make sure the products you want to integrate with Vanta are toggled on. Click Next.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338195992/72b29876a59fe984e5f6a5ebd6ba/7b13deea-0aba-44c4-a71e-47815f1cfa1d?expires=1794967200&signature=ba854cd223ef2443a048d490be42e607a74962d9b86592b61614573743018c2d&req=diMkHsh3mIhWW%2FMW1HO4zT0%2FqyQ%2BhwpQd0OHy753owJR94mPDTzoEUP%2FIUJi%0AQNFbBL2FrglfbtBur58%3D%0A>
- 
Choose your permissions (either Read access only or Read and write access). Click Connect GitHub.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338196948/b76f0009e751d8294aa3984fd0ff/4672e8df-649a-4cb6-886f-3e721e6d024b?expires=1794967200&signature=6d664ad9d4872bd1359965088f25c2770f5eae00a058eb64b68f43bb5da1bc7c&req=diMkHsh3m4hbUfMW1HO4zaRsSbaypYKj102lMkKzMQCijYyrn02DUbAzTPPm%0ABnoWkauGx1AWsM8f0IM%3D%0A>
- 
A new browser tab will open for you to sign into GitHub. 
- 
Sign into GitHub.
- 
On the next screen, select where you want to install the Vanta GitHub integration from the list.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338198961/fd52dad8a683c95408d8529af5a9/62f7dbb1-d219-45c1-93fa-a66fd7b614d3?expires=1794967200&signature=cb4a869409465a9d239d282f1f40746fd3be1b0ab451f58552b9404f9cbd72fd&req=diMkHsh3lYhZWPMW1HO4zXhAxgd1BWtC1p11YfSfzcDTxQCiJ0qyBXeuJRlR%0AFG%2BOiODfIhR9Qqtqhp0%3D%0A>
 

### Step 3: Choose repository access
- 
Select which repositories Vanta can access.
Which option should you choose? 
- 
All repositories (recommended): Vanta monitors all current and future repos in your org automatically. No maintenance required when new repos are added.
- 
Only selected repositories: Vanta monitors only the repos you specify. If new repos are added to your org later, you must manually add them in GitHub App settings — they won’t be picked up automatically.
- 
Click Install. 
- 
The flow will redirect back to Vanta with GitHub showing as Connected.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2338202463/0b7b20a1842ee8487b7d2f747c1c/43c190a6-7917-45a8-9013-0733212dd939?expires=1794967200&signature=5b96a3ad1e9f92de25bad6379077a818d960cfcd026c4b24331edd63be903d7e&req=diMkHst%2Bn4VZWvMW1HO4zbLTr%2Fn30%2FuvjbyhmMaC8g7XHKzkRbodPvXb2Rv%2F%0AU48fzPIP7OAMInEZ66c%3D%0A>
 
ℹ️ Notes:
- 
If you selected Only selected repositories and repos are missing from Vanta later: Go to GitHub > Org Settings > Installed GitHub Apps > Vanta > Repository access and add them manually.
- 
If the authorization screen did not appear: Confirm you are signed into the correct GitHub account in your browser before retrying.
 
 

## Verification and Validation
After setup, confirm the following to verify the integration is connected and data is syncing correctly.
ℹ️ Note: Allow 24–48 hours for the initial sync before checking. Large organizations with 700+ repositories may take longer. If you check before the sync completes, data may appear incomplete — this is normal.
- 
Integration is active — In Vanta, go to your Integrations page and confirm GitHub shows a Connected status. If the status shows as Disconnected, confirm the Vanta GitHub App is still installed in your org (GitHub > Org Settings > Installed GitHub Apps). If the app has been uninstalled or revoked, reconnect the integration.
- 
Repositories are syncing — In Vanta, go to Tests and filter by the GitHub integration. Version control tests (such as branch protection and code review tests) should show repository data. If no repositories appear after 48 hours, confirm the Vanta GitHub App has access to the expected repos. If you selected Only selected repositories during setup, verify those repos are included in the app's access settings in GitHub.
- 
Pull request data is appearing — Open the GitHub code changes were approved or provided justification for exception test in Vanta. Merged pull requests to your production or default branch should appear as evaluated records. 
- 
Org members are pulling in — Go to the People section in Vanta. GitHub org members and outside collaborators should appear as accounts. If members are missing, confirm the connecting user holds Organization Owner status — member data is not accessible to non-Owners. If accounts appear but are not linked to Vanta users, confirm the affected users have a public email set on their GitHub profiles that matches their email in Vanta.
- 
Vulnerability alerts are appearing (if Dependabot is enabled) — go to Vulnerabilities in Vanta. Dependabot alerts from your GitHub org should appear, organized by severity. If no alerts appear after 48 hours, confirm that Dependabot is enabled in your GitHub org settings (GitHub > Org Settings > Security > Code security and analysis). Vanta cannot pull alerts if Dependabot is inactive.
- 
Security issues are pulling in (if GitHub Issues is configured) — Open a security-related test in Vanta and go to the Tasks tab. GitHub Issues tagged with your security label should appear as linked tasks. If no issues appear, confirm the label is spelled correctly.
 
 
 

## Use cases and capabilities
The GitHub integration powers three functional areas in Vanta: version control compliance, vulnerability scanning, and security issue tracking. It also syncs people and access data used across Vanta's access review and automated test workflows.
 

### Capabilities summary
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Org members | 
Yes | 
Automated tests, access reviews, People section, evidence collection
 | 
Outside collaborators | 
Yes | 
Automated tests, access reviews, evidence collection
 | 
Repositories | 
Yes | 
Automated tests including Branch protection tests, evidence collection
 | 
Branch protection rules (classic) | 
Yes | 
Automated tests including Ensure branch protection rules are enforced for administrators (GitHub), GitHub code changes has automated checks enabled, and required reviews; evidence collection
 | 
GitHub Rulesets | 
Partial | 
Required approval counts only — admin enforcement not supported. 
 | 
Pull requests / code reviews | 
Yes | 
Automated tests including Application changes reviewed and GitHub code changes were approved or provided justification for exception, evidence collection
 | 
Dependabot vulnerability alerts | 
Yes | 
Vulnerability tracking, automated tests, evidence collection
 | 
Pending org invitations | 
Yes | 
Access review workflows
 | 
GitHub Issues (security-labeled) | 
Yes | 
Security issue tracking, evidence collection
 | 
GitHub Actions / CI/CD pipelines | 
No | 
Not collected
 | 
Commit history | 
No | 
Not collected
 

### Branch protection compliance 
Vanta reads your repository settings to evaluate whether branch protection is correctly configured on your production or default branch.
 
What this powers in Vanta:
- 
Ensure branch protection rules are enforced for administrators (GitHub) test — Verifies that admins are subject to the same branch protection rules as other contributors. Passes when classic branch protection rules are active and admin enforcement is enabled.
- 
GitHub code changes has automated checks enabled test — Verifies that each merged PR either had automated checks (such as CI runs) pass before merge, or has a documented justification for the exception.
What you get: 
Continuous evidence that your branch configuration meets your compliance requirements, without manual screenshots or exports.
⚠️ Note: If your organization uses GitHub Rulesets instead of classic branch protection rules, the Ensure branch protection rules are enforced for administrators (GitHub) test cannot be automatically evaluated. Vanta cannot determine whether admin bypass protections are enforced through Rulesets without elevated write permissions. If you use Rulesets exclusively, Vanta recommends either deactivating this test or maintaining classic branch protection rules alongside your Rulesets. See Limitations for full details.
 

### Code review tracking
Vanta checks merged pull requests on your production or default branch to confirm each one was reviewed before it was merged.
 
What this powers in Vanta:
- 
Application changes reviewed test — Checks your repository's branch protection settings to verify that at least one approval is required before code can be merged to the default or production branch. Vanta reads required approval counts from both classic branch protection rules and GitHub Rulesets, and applies the highest count across both.
- 
GitHub code changes were approved or provided justification for exception test — Evaluates each merged pull request individually to confirm it was either approved by someone other than the author, or has a documented justification for why it was merged without approval.
What you get: 
Automated evidence that code changes go through peer review before reaching production — one of the most commonly requested controls in SOC 2 and ISO 27001 audits.
 
Scope notes:
- 
Only PRs merged to the production or default branch are evaluated.
- 
Bot-authored PRs (such as those from Dependabot or Renovate) are evaluated under the same rules as human-authored PRs.
- 
Vanta fetches PRs incrementally — only new merges since the last sync are pulled in each cycle. 

### Vulnerability management
Vanta pulls Dependabot alerts from your GitHub organization and tracks them against your policy SLA.
 
What this powers in Vanta:
- 
Vulnerability tests (by severity) — Tracks open Dependabot alerts at low, medium, high, and critical severity levels. Each severity tier has its own test and SLA threshold, configured in Vanta.
- 
Vulnerability tracking workflows — Surfaces open alerts with creation dates so you can demonstrate to auditors that vulnerabilities are being identified and resolved within your stated timeframes.
What you get: 
A continuously updated view of open vulnerabilities in your GitHub repos, with SLA tracking handled by Vanta rather than tracked manually.
 
Scope notes:
- 
Dependabot must be enabled in your GitHub org before Vanta can pull alert data.
- 
SLA timelines are set within Vanta, not within GitHub.
- 
To stop Vanta from monitoring Dependabot alerts — for example, if you use a separate vulnerability scanner — disable the Dependabot-specific tests in Vanta.

### Security issue tracking
Vanta monitors GitHub Issues tagged with a security label and imports them as compliance evidence.
 
What this powers in Vanta:
- 
Security task tracking — Labeled issues appear as tracked tasks in Vanta. When an issue is closed in GitHub, Vanta reflects that resolution automatically.
- 
SLA evidence — Vanta records when each issue was created and when it was resolved, giving auditors a verifiable record that security work is being tracked and completed.
What you get: 
Engineers can manage security tasks entirely in GitHub. Vanta picks them up automatically — no duplicate entry or manual uploads required.
 
Scope notes:
- 
Labels are case-sensitive. 
- 
The label must be applied to the issue in GitHub — Vanta does not create or modify labels.
- 
This is a separate workflow from vulnerability scanning. Vulnerabilities come from Dependabot; security issues come from labeled GitHub Issues.

### People and access data
Vanta syncs organization members, outside collaborators, and pending invitations from your GitHub org.
 
What this powers in Vanta:
- 
Access reviews — GitHub accounts appear in Vanta's access review workflows so your team can confirm who has access and flag accounts that need review or removal.
- 
Automated tests — People data powers tests that evaluate MFA compliance and account ownership.
- 
People section — GitHub accounts are linked to Vanta user records by matching the public email address on the GitHub profile to the email in Vanta.
What you get: 
An up-to-date view of who has access to your GitHub org, surfaced directly in Vanta's access review and compliance workflows.
 
Scope notes:
- 
Vanta can only match GitHub accounts to Vanta users if the GitHub profile has a public email address set. Accounts with private emails will appear in Vanta but won’t be automatically linked to a user record.
- 
Outside collaborators are synced separately from org members and are visible in access review workflows.
- 
Pending org invitations that have not yet been accepted are also surfaced for review.
 
 
 

## Limitations and edge cases
The following are known constraints of Vanta’s GitHub integration that may affect compliance tests, user matching, and repository monitoring workflows. 
 | 
Limitation | 
Detail | 
Workaround
 | 
GitHub Rulesets — admin enforcement test | 
The Ensure branch protection rules are enforced for administrators (GitHub) test requires classic branch protection rules. Vanta cannot read admin bypass status through Rulesets without write access, so this test will always fail in a Rulesets-only configuration. | 
Deactivate the test and provide manual evidence, or maintain classic branch protection rules alongside your Rulesets.
 | 
Personal accounts not supported | 
Vanta connects to GitHub Organizations only. Installing with a personal account will return an error. | 
A GitHub Organization must be created before connecting to Vanta.
 | 
User matching requires a public GitHub email | 
Vanta matches GitHub accounts to Vanta users by public email address only. Users with private GitHub emails will appear in Vanta but won’t be automatically linked to their Vanta record. | 
Ask the user to set a public email in their GitHub profile settings, or map the account manually in Vanta.
 | 
New repos not auto-added in selected repos mode | 
If you chose Only selected repositories during setup, repos added to your org after the initial connection won’t be monitored automatically. | 
Switch to All repositories in GitHub App settings, or add new repos manually each time one is created.
 | 
Bot-authored pull requests | 
Vanta evaluates bot PRs (Dependabot, Renovate, etc.) under the same approval requirements as human PRs. If bot PRs are failing the GitHub code changes were approved or provided justification for exception test, it is because they were merged without approval from a non-author and have no documented justification. | 
Adjust your approval workflow or add a justification in Vanta for bot-authored PRs that are intentionally merged without review.
 
 
 

## Permissions

## 

### Vanta permission
 | 
Permission | 
Required for
 | 
Vanta Admin | 
Connecting, reconnecting, and managing the GitHub integration

### GitHub permissions: installing user
 | 
Permission | 
Required or optional | 
What happens without it
 | 
Organization Owner role | 
Required | 
The GitHub App cannot be installed and org member data cannot be read

### GitHub App permissions: what Vanta requests 
 | 
Permission | 
Scope | 
Required or optional | 
What happens without it
 | 
Administration | 
Repository | 
Required | 
Branch protection rules and security settings cannot be read. Branch protection tests won’t evaluate correctly.
 | 
Checks | 
Repository | 
Required | 
Vanta cannot determine whether automated CI checks ran on PRs before merge.
 | 
Commit statuses | 
Repository | 
Required | 
Commit-level status checks cannot be read.
 | 
Dependabot alerts | 
Repository | 
Required
Note: If Dependabot is not enabled in your GitHub org, this permission will have no effect | 
Vulnerability alerts won’t appear in Vanta. Vulnerability tests will show no data.
 | 
Issues | 
Repository | 
Required for security issue tracking | 
GitHub Issues won’t be pulled into Vanta task tracking workflows.
 | 
Pull requests | 
Repository | 
Required | 
Merged PR approval data cannot be read. Code review tests — including Application changes reviewed and GitHub code changes were approved or provided justification for exception — won't evaluate.
 | 
Administration | 
Organization | 
Required | 
Organization-level settings and configurations cannot be read. 
 | 
Members | 
Organization | 
Required | 
Org membership, roles, and MFA status cannot be read. People data won’t appear in Vanta.

### Write access
By default, Vanta requests read-only access. If you granted write access during setup, Vanta may create or modify GitHub Issues for task tracking purposes. Write access does not allow Vanta to modify code, branch settings, or repository configuration.
 

### Key behaviors
- 
Permissions are tied to the connecting user's Owner status. If the connecting user loses their Organization Owner role, Vanta will lose access to org member data and may be unable to sync. No reconnect prompt is shown automatically — the integration will silently return incomplete data until it is reconnected under a valid Owner account.
- 
To reconnect or change the connecting account: Go to Integrations > GitHub > Manage, then follow the reconnection flow. 
- 
If the GitHub App is uninstalled from your org, the integration will stop syncing immediately. Reinstall the app and reconnect in Vanta to restore it.
 
 
 

## Troubleshooting and FAQs
Common questions and issues you may encounter when setting up or using Vanta's GitHub integration, along with recommended solutions.
 
Before contacting Support, please collect the following to expedite resolution time:
- 
The connecting user's GitHub username and email
- 
Your GitHub organization name
- 
Your GitHub variant (Cloud, Enterprise Server, Enterprise Cloud with data residency)
- 
The domain of your GitHub instance (Enterprise Server only)
- 
A screenshot of any error message
 

### Connection and setup

### Q: I see an Internal Server Error when connecting
Cause 1: The Vanta GitHub App was installed on a personal account instead of an organization.
- 
In GitHub, go to Settings > Applications > Installed GitHub Apps, find Vanta, and click Uninstall.
- 
Return to Vanta and restart the connection.
- 
When prompted, select your company organization, not your personal account.
Cause 2: Your GitHub Enterprise instance has an IP allowlist enabled that is blocking Vanta.
- 
Add Vanta's IP address to your allowlist at Org Settings > Security > IP allow list.
- 
Retry the connection.
Escalate if: Neither cause applies and the error persists after retrying.

### Q: I see a Bad credentials error
- 
Confirm the Vanta GitHub App is still installed: GitHub > Org Settings > Installed GitHub Apps.
- 
If the app is missing, reinstall it by returning to Vanta and reconnecting.
- 
If the app is present but the error persists, confirm Vanta's IP address is in your GitHub Enterprise IP allowlist.
- 
If the connecting user's Owner status was removed, reconnect using a valid Owner account.
Escalate if: The app is installed, the IP allowlist is correct, and the error continues.

### Q: The integration disconnected unexpectedly
Cause: The connecting user’s GitHub Owner status was revoked, or the GitHub App was uninstalled from the org. 
- 
Confirm the Vanta app is still installed in GitHub: Org Settings > Installed GitHub Apps.
- 
If it has been removed, reinstall by reconnecting in Vanta.
- 
To prevent recurrence: use a stable service account for the connection rather than a personal account.
Escalate if: The integration reconnects but disconnects again within 24 hours.
 

### Repositories and data

### Q: Repositories are not appearing in Vanta
- 
Step 1: Confirm which repository access mode you selected during setup: All repositories or Only selected repositories.
- 
Step 2: If Only selected repositories was chosen, go to GitHub > Org Settings > Installed GitHub Apps > Vanta > Repository access and confirm the expected repos are included.
- 
Step 3: If you recently added new repos to your org and are in selected repos mode, they won’t be added automatically. Add them manually in GitHub App settings.
- 
Step 4: Allow up to 24–48 hours for changes to reflect in Vanta after updating repo access.
Escalate if: Repository access is correctly configured and repos are still missing after 48 hours.

### Q: What happens if a repository is deleted or renamed in GitHub? 
- 
Renamed: Repository names are tracked by ID, not name. A renamed repo will continue to appear in Vanta and will update to the new name on the next sync.
- 
Deleted: Vanta will no longer receive data for the deleted repo after the next sync. Historical test results tied to that repo will remain in Vanta as a record but won’t be updated.

### Q: Does Vanta monitor forked repositories? 
A: Vanta collects fork status as a data point but does not treat forked repos differently from other repositories in scope. If a forked repo is within your connected repository access, it will be monitored like any other repo.
 

### Branch protection and tests

### Q: The Ensure branch protection rules are enforced for administrators (GitHub) test is still failing after I configured my rules.
Work through these steps in order: 
- 
Step 1: Confirm your organization is using classic branch protection rules, not GitHub Rulesets. Go to Repository Settings > Branches to check. Rulesets cannot satisfy this test.
- 
Step 2: Confirm the rules are applied to the correct branch: either your production branch (if vanta_production_branch_name is set) or your default branch.
- 
Step 3: Confirm admin enforcement is explicitly enabled on the branch protection rule.
- 
Step 4: Wait for the next sync cycle. Changes take up to 24–48 hours to reflect in Vanta.
Escalate if: Classic rules are active, admin enforcement is on, and the test is still failing after 48 hours.

### Q: PR approvals are not being counted correctly
- 
Confirm which branch Vanta is evaluating. Check if vanta_production_branch_name is set correctly for affected repos.
- 
If you use both classic branch protection rules and Rulesets, Vanta applies the highest required approval count across both. Confirm this matches your expectations
- 
Allow up to 24–48 hours for recent changes to sync.
 

### User matching

### Q: GitHub users are appearing in Vanta but are not linked to their Vanta records. 
Cause: Vanta matches GitHub accounts to Vanta users by public email address. Users with private GitHub emails cannot be matched automatically.
Fix: 
- 
Ask the user to go to their GitHub profile settings and set a public email that matches their email in Vanta.
- 
If a public email cannot be set, map the account manually in Vanta.

### Q: Does Vanta use SSO identity or GitHub’s verified email to match users? 
A: No. Vanta uses only the public email on the user's GitHub profile. SSO-linked identities and GitHub's internally verified emails are not used for matching.
 

### Vulnerabilities

### Q: Dependabot alerts are not appearing in Vanta
- 
Step 1: Confirm Dependabot is enabled in your GitHub org: Org Settings > Security > Code security and analysis > Dependabot alerts.
- 
Step 2: If Dependabot was just enabled, allow up to 24–48 hours for the first set of alerts to sync.
- 
Step 3: Confirm the affected repositories are within Vanta's connected repository scope
Escalate if: Dependabot is enabled, repositories are in scope, and no alerts appear after 48 hours.
 
 
 
 

​

## Images

- [image 01] ../../images/ux/integrations/github-integration-guide--01.png
- [image 02] ../../images/ux/integrations/github-integration-guide--02.png
- [image 03] ../../images/ux/integrations/github-integration-guide--03.png
- [image 04] ../../images/ux/integrations/github-integration-guide--04.png
- [image 05] ../../images/integrations/github/github-integration-guide--05.png
- [image 06] ../../images/integrations/github/github-integration-guide--06.png
