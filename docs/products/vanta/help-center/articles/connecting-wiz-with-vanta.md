# Connecting Wiz with Vanta

Source: https://help.vanta.com/en/articles/11345611-connecting-wiz-with-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

## Overview
The Wiz integration connects your Wiz environment to Vanta, pulling cloud security findings directly into your compliance program. It is best suited for security and GRC teams that use Wiz to manage cloud vulnerabilities, and security issues, and who want those findings mapped to compliance controls automatically, without manual exports or context switching.
 
Estimated setup time: Under 10 minutes
 
 

## Capabilities
This integration pulls vulnerability data, security issues, and user account information from Wiz into Vanta so they can be tracked, mapped to compliance frameworks, and included in evidence collection. It gives your team a consolidated view of your Wiz vulnerabilities and issues alongside your compliance program.
 

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Vulnerability findings | 
Yes | 
Imported as vulnerabilities; filterable by severity and mapped to compliance controls
 | 
Security issues / alerts | 
Yes | 
Synced as security alerts. Open and In Progress issues of all severities are imported. Issues are only imported for resources that Vanta also imports as Wiz assets. 
 | 
User accounts | 
Yes | 
Imported for access reviews and personnel tracking
 | 
Asset data | 
Yes | 
Resources monitored for vulnerabilities, imported as assets
 
Note: These are fetched automatically when Vulnerability Management or Issues is enabled. 
 | 
Compliance framework mapping | 
Yes | 
Findings are automatically mapped to relevant compliance controls
 | 
Deprovisioning through Vanta | 
No | 
Write-back is not supported for this integration
 | 
Network / egress monitoring | 
No | 
Out of scope for this integration
 | 
Full access management data | 
No | 
Use an IDP or cloud provider integration for this
 
 

## Data synchronization 
 | 
Data type | 
Refresh frequency
 | 
Vulnerability data | 
Every 8 hours
 | 
Security issues | 
Every 24 hours
 | 
User accounts | 
Approximately hourly
 | 
Asset data | 
Approximately hourly
 
 

## Prerequisites
Before starting setup, confirm the following:
- 
You have a Vanta admin account.
- 
You have an active Wiz subscription with administrative access.
- 
You have created a Wiz service account with the following permissions:
- 
read:resources - Read graph resources
- 
read:users - Read user details, list all users
- 
read:issues - Read an issue, list issues
- 
read:reports - Read reports
- 
create:reports - Create reports
- 
read:vulnerabilities - Read vulnerabilities
- 
read:cloud_accounts - Read cloud accounts
- 
read:user_accounts - Read user accounts
- 
read:threat_issues - Read a threat, list threats
- 
You know your Wiz tenant region (for example: us1, us2, eu1, eu2).
💡 Tip: For best results, grant only the scopes listed here. 
⚠️ Note: If your Wiz service account is scoped to a specific Wiz project rather than all resources, the integration may fail to connect or may not fetch all data. The recommended approach is to grant the service account access to all Wiz resources and projects, then use the optional Project ID field in Vanta to filter down to a specific project.
 
 
 

## Setup guide

## Step 1: Find the Wiz integration in Vanta
- 
In Vanta, go to Integrations and click Add integration. For more information, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Search for Wiz and click on the integration tile.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2472644839/6aa13562ab777d9c16b4f2ec58f2/0f385de9-5f0c-4fcb-b733-e6021368f0bc?expires=1794967200&signature=2486f0fa59f3f83abd4435d7d1eec77316aa67db349ab9423cf7a5043fac2d4a&req=diQgFM96mYlcUPMW1HO4zUZN7QR76TAWHUB6NbtPlWxKo7EU6KkqJwfmUJEQ%0A9P2Zt3MS87Dui28X%2FqU%3D%0A>
 
 

## Step 2: Select the Wiz products you want to sync
Choose which Wiz data you want to pull into Vanta: 
- 
Vulnerability Management - Syncs vulnerability findings and asset data
- 
Issues - Syncs security alerts and issues
- 
User Accounts - Syncs Wiz user account data
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2756906245/32ec49ea90330954f6dea044a36d/31ec44f9-b6a9-4f21-b810-160bf338bdd6?expires=1794967200&signature=bd2ce70f3d4fa5c4794a9ff72bba5ae3d546d50c9631a898229a6d22008a5243&req=diciEMB%2Bm4NbXPMW1HO4zXxS5e3SdszjJ%2BXGI5zrQv%2BRwRJgBza%2Frnn7P1MG%0AweZvSETbKWqNWL0j9%2FM%3D%0A>
ℹ️ Note: You can enable one or more products. Each product corresponds to a specific data type in Vanta and requires the relevant permissions on your Wiz service account.
 

## Step 3: Enter your Wiz credentials
- 
Enter your Connection Name (this will help you differentiate between multiple connections to the same Wiz integration). 
- 
Optionally, enter a Project ID if you want to limit data syncing to a specific Wiz project. This must be the project's UUID, not the project's display name. Leave blank to fetch data from all accessible projects in your organization.
- 
Select your Tenant Region (for example: us1, us2, eu1, eu2).
- 
Enter your Wiz Client ID and Client Secret from your Wiz service account.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2472649295/b921cfdb592d8e0012fc4c40997c/5ba95356-f5e7-4b7f-bbf0-8752443cb4b3?expires=1794967200&signature=96770ee33e4f862f402bcd330e4f339019306bb221070c5bcaa9a4e3d9e54bbd&req=diQgFM96lINWXPMW1HO4zbKR5kVnJD7Y3gDJM7qsd8%2FQw6AGzALt2reAggyT%0AxpUqhvQ4EvqVKof0wYw%3D%0A>
 
 

## Step 4: Confirm the connection
- 
After saving your credentials, the Wiz integration should appear as Connected in your Vanta integrations list.
- 
Vanta begins an initial sync immediately. Depending on the volume of data in your Wiz environment, the initial sync may take several minutes to complete.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2472652717/353b16fe8179bb8edef4dc8cb295/image.png?expires=1794967200&signature=3b280d7d45df03a20cbc76d34db82b1a6432daa523eb0a6c20e355fe0925c887&req=diQgFM97n4ZeXvMW1HO4zbm3xc9k1HbsqC%2F8rBEpyR3jESX31TuqZ3sGxx8w%0ACbMtXK8v698a7vZd7vo%3D%0A>
 
 

## Permissions

### Read access
Vanta uses the service account credentials you provide to read vulnerability findings, security issues, user accounts, and asset data from Wiz. 
 

### Write access
There is no write access. Vanta does not modify, reassign, or delete any data in Wiz.
 
 

## Troubleshooting and FAQs

### Connection fails: permissions or validation error
- 
Likely cause: The Wiz service account is missing one or more required permissions, has extra permissions beyond what is listed, or the incorrect tenant region was entered.
- 
How to confirm: Double-check that the service account has exactly these scopes: read:resources, read:users, read:issues, read:reports, create:reports, read:vulnerabilities, read:cloud_accounts, read:user_accounts, read:threat_issues. Confirm the tenant region matches your Wiz environment (for example, us1 or eu2, not a custom domain or subdomain). Extra or incorrectly named scopes can cause validation errors even when the intended permissions are present.
Fix: Update the service account in Wiz to match the required scopes exactly, then re-enter credentials in Vanta.
 

### The integration is connected but no data is appearing
- 
Likely cause: No Wiz products were selected during setup, the service account is scoped to a specific project that does not contain data, or the initial sync has not completed.
- 
How to confirm: In Vanta, go to Integrations, find the Connected Wiz integration, click Manage and then Edit. Confirm that at least one product (Vulnerability Management, Issues, or User Accounts) is selected. Check that the integration status shows Connected and not a pending or error state.
- 
Fix: If no products are selected, edit the integration to enable the desired data types. If the service account is project-scoped, follow the recommended approach in Prerequisites.
 

### Connection fails with an "invalid characters" error
- 
Likely cause: The client secret contains invisible formatting characters. This can happen when copying the secret from a rich-text source like a PDF, email, or password manager that adds hidden characters.
- 
How to confirm: Look for an error message that says "Client secret contains invalid characters."
- 
Fix: Open a plain-text editor (like Notepad or TextEdit in plain-text mode), paste the client secret there, then re-copy it from the plain-text editor and paste it into Vanta. If the issue persists, retype the secret manually in Vanta.

## Images

- [image 01] ../../images/ux/integrations/connecting-wiz-with-vanta--01.png
- [image 02] ../../images/ux/integrations/connecting-wiz-with-vanta--02.png
- [image 03] ../../images/ux/integrations/connecting-wiz-with-vanta--03.png
- [image 04] ../../images/ux/integrations/connecting-wiz-with-vanta--04.png
