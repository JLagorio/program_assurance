# Connecting Vanta & Semgrep

Source: https://help.vanta.com/en/articles/15705377-connecting-vanta-semgrep
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Vulnerability Scanners
Fetched: 2026-11-17

## Article text

## Overview
The Semgrep integration connects your Semgrep deployment to Vanta using a read-only API token, importing code analysis results so Vanta can monitor your application security posture and run automated compliance tests. Engineering and security teams using Semgrep for SAST, secrets detection, or SCA can use this integration to track those results automatically in their compliance program.
 
Estimated setup time: Under 5 minutes
 
 

## Use cases and capabilities
This integration pulls Semgrep code findings, secrets, supply chain vulnerabilities, project data, and scan history into Vanta. Once connected, your Semgrep results power automated tests covering vulnerability management, secrets remediation tracking, and scan frequency compliance — without manual reporting or data exports.
- 
Code vulnerability management: SAST findings from your Semgrep scans are surfaced in Vanta as security alerts, categorized by severity. Vanta tracks whether they are being addressed within your SLA windows.
- 
Secrets detection tracking: Secrets findings (for example, hardcoded credentials or API keys detected in your code) are imported as security alerts and tracked through the same SLA-driven remediation workflows.
- 
Supply chain vulnerability management: Software composition analysis (SCA) findings from your third-party dependencies are imported as vulnerabilities and tracked through Vanta's vulnerability management pipeline.
- 
Scan coverage and frequency monitoring: Semgrep project and scan records are imported so Vanta can verify that your repositories are being scanned regularly.
ℹ️ Note: For code (SAST) findings, statuses open, reviewing, or fixing are imported. For secret findings, only open status is imported. Fixed and ignored findings are excluded. Projects with no defined branch, prefixed with local_scan/, or where branch names do not match what Vanta has stored are not tracked.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Semgrep Projects | 
Yes | 
Tracked as vulnerability monitoring targets (code repositories)
 | 
SAST code findings | 
Yes | 
Surfaced as security alerts; tracked by severity (critical, high, medium, low)
 | 
Secrets findings | 
Yes | 
Surfaced as security alerts; tracked by severity
 | 
SCA / supply chain findings | 
Yes | 
Tracked as vulnerabilities in the vulnerability management pipeline
 | 
Scan history | 
Yes | 
Used to verify scan recency and coverage per project
 | 
Scan frequency monitoring | 
Yes | 
Configurable window
 | 
Multiple Semgrep connections | 
Yes | 
Each connection requires its own API token and account name
 | 
Write access / remediation actions | 
No | 
Read-only — we do not modify Semgrep data
 | 
Local scans | 
No | 
Projects prefixed with local_scan/ are not imported
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have a Semgrep account with access to the organization whose results you want to import.
- 
You have permission in Semgrep to create an API token. The token inherits the permissions of the user who creates it, so use an account with full organization access.
💡 Tip: Your API token must have access to exactly one Semgrep deployment. If the token has access to zero or more than one deployment, data sync will fail after connecting. Use a separate token for each Semgrep organization.
 
 

## Setup guide

### Step 1: Create a Semgrep API token
- 
Log in to your Semgrep account at https://semgrep.dev/ <https://semgrep.dev/>.
- 
Navigate to Settings > Tokens (https://semgrep.dev/orgs/-/settings/tokens <https://semgrep.dev/orgs/-/settings/tokens>).
- 
Click Create new token.
- 
Give your token a name (for example, Vanta) and leave only Web API checked.
- 
Copy the token. You will paste it into Vanta in the next step.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524287510/8fa09f6dc8d5353dfdb5bc024731/fc822ec8-c649-445c-89fd-eb4b86d48009?expires=1794967200&signature=51676280f97373639a825477a19e1320f8dea2b0366479dc18b16e9e5df82acf&req=diUlEst2moReWfMW1HO4zU7j4MAZIvTKp%2FcWC055oCy8piwVKLXMnz2Pvar%2F%0AT1k6jmcfz8k40JXOrik%3D%0A>
💡 Tip: Store the token somewhere safe before closing the page. Semgrep only displays it once.

### Step 2: Add the token in Vanta
- 
In Vanta, go to Integrations and click Add integration.
- 
Search for Semgrep and click the integration tile.
- 
Click Connect.
- 
Enter an Account name. This is the display name Vanta uses to identify this connection. It is especially useful if you add multiple Semgrep connections later.
- 
Paste your token into the API token field.
- 
Click Validate and store.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524288790/6f744881e7a5017e72eaa2f6316d/306bd000-7620-44d6-a593-9cba9f435cf3?expires=1794967200&signature=7e1976416caad1bd6a632694857b91aabf0cdf0bf46a4306359093940eec36bb&req=diUlEst2lYZWWfMW1HO4zVD3LeQnxfvNlH79CMZ6fwMExNbkrerhX4H3HzIg%0AkyX6NiYdB3fbwDS7tzE%3D%0A>
 

### Step 3: Confirm the connection
After saving, the Semgrep integration should appear as Connected in your Vanta integrations list. We begin an initial sync immediately. Once data has been imported, your Semgrep resources and related tests appear in Vanta.
 

### Add another Semgrep connection
You can connect more than one Semgrep account by repeating these steps. 
- 
Go to Integrations and find the connected Semgrep integration
- 
Click Manage and select Edit 
- 
Click Add Connection in the Semgrep Connections modal. 
All connections can be edited or removed individually.
 
 

## Permissions

### Read access
We use the API token you provide to read your Semgrep deployment details, projects, code findings, secrets, supply chain findings, and scan history through the Semgrep Web API.
 

### Write access
There is no write access. We do not modify or delete any data in your Semgrep account.
 
 

## Troubleshooting and FAQs

### Data is not syncing 
- 
Likely cause: Your API token has access to zero or more than one Semgrep deployment. We require exactly one deployment per connection.
- 
Fix: Generate a new API token from an account with access to exactly one deployment and reconnect.

### Vanta is not showing findings from some of my projects
- 
Likely cause: The project has no primary or default branch configured in Semgrep; the project name starts with local_scan/; or there is a branch name mismatch between what Semgrep returns and what we have stored for that asset.
- 
Fix: Confirm each project has a defined branch and that branch names are consistent. 

### The integration shows as disconnected or needs reconnection
- 
Likely cause: The API token was revoked or expired in Semgrep.
- 
Fix: Generate a new API token and update the connection in Vanta by navigating to Integrations, finding the Semgrep connection, and editing the credential.

## Images

- [image 01] ../../images/integrations/semgrep/connecting-vanta-semgrep--01.png
- [image 02] ../../images/integrations/semgrep/connecting-vanta-semgrep--02.png
