# Connecting Vanta & Checkr

Source: https://help.vanta.com/en/articles/15212640-connecting-vanta-checkr
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

✅ Feature availability: The Checkr access management integration is now available for Vanta Government  <https://www.vanta.com/solutions/government>customers.

## Overview
The Checkr integration connects your Checkr account to Vanta to support two distinct compliance workflows: background check verification (connected via OAuth) and access management (connected via SCIM bearer token). These are two separate connections; you can set up one or both, depending on which workflows are relevant to your compliance program. 
 
This integration is most useful for teams using Checkr to run employee background checks as part of their hiring process and who need to demonstrate background check compliance to auditors. 
 
Estimated setup time: 10-20 minutes (longer if SCIM enablement requires coordination with Checkr support)
 
 

## Use cases and capabilities
- 
Background check verification: Vanta pulls candidate background check records from Checkr and uses them to power an automated test. This test checks whether each employee whose role requires a background check has a completed check on file. Employees without a completed background check will fail this test, making it easy to identify gaps without manual review.
ℹ️ Note: Vanta retains completed background check records even if Checkr removes them from their API due to data retention policies, so historical compliance evidence is preserved.
- 
Access management (SCIM): Vanta syncs user accounts from Checkr's access management system. Role data may also be available depending on your account configuration. This data appears in Vanta's access review workflows, giving you visibility into who has access to Checkr and at what permission level.

### Capabilities summary
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Background Check Records | 
Yes | 
Automated test: "Background checks on new hires"
 | 
Background Check Status | 
Yes | 
Determines pass/fail on the background check test
 | 
Candidate-to-Employee Matching | 
Yes | 
Links Checkr candidates to Vanta personnel records
 | 
User Accounts (SCIM) | 
Yes | 
Access reviews, personnel tracking
 | 
Groups (SCIM) | 
No | 
Checkr’s SCIM API does not support group data
 | 
Roles (SCIM) | 
Partial | 
Role data may not be available for all accounts – contact Vanta support if roles are not appearing in access reviews
 | 
User Provisioning / Deprovisioning | 
No | 
Vanta does not write back to Checkr
 
 

## Prerequisites 
Before starting setup, confirm the following: 
- 
You have a Vanta admin account. 
- 
You have an active Checkr account with admin-level access. 
- 
You are able to authorize OAuth applications in Checkr (typically requires account admin access). 
For access management connection: 
- 
SCIM must be enabled on your Checkr account. This is not enabled by default–you need to contact Checkr support to request it. 
- 
Once SCIM is enabled, Checkr will provide you with: 
- 
A SCIM bearer token
- 
A SCIM URL in the format
 
 

## Setup guide 

### Connect Checkr for Background Checks (OAuth)

### Step 1: Find the Checkr integration in Vanta
- 
In Vanta, go to Integrations. 
- 
Search for Checkr in the Available tab. 
- 
Click View details, then click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2410107331/a3b4b0c2da506e7777ca808973da/c53dc544-39a8-4de9-bf5c-4a823eafd8d8?expires=1794967200&signature=b0d98f800dc840504a82931e7fb55d4053546114ad22f3d6e4bc04db9d27700c&req=diQmFsh%2BmoJcWPMW1HO4zbGYWnkgtg8w3kERZpJy9rOBiOOH3Y2sOYizGxOd%0Al0h07iXIo%2BCvlsK7fdo%3D%0A>

### Step 2: Authorize the connection
- 
In the connection modal, click Add Connections.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2410108667/0cdc6e6494ba7ae0df630062897d/e5982e17-1d0e-41df-af30-91611c5745ae?expires=1794967200&signature=98a16c5df104863fb6c82123c8780dd6554b3edd8f86b4616ba1d02ddd84d8f6&req=diQmFsh%2BlYdZXvMW1HO4zfptMBDkEVGQSWJB3QqjHwaRZCZBza6DdohdY%2Fy5%0AqI%2Bq9tvD%2FRXxelbJzEQ%3D%0A>
- 
In the next modal, click Connect Checkr. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2410110499/a2c43e68b32355f290e8e38ace80/98646f29-eee2-445d-a116-b08a09520a14?expires=1794967200&signature=58bdce47e55a44f8af6e8b4748e36495bb03aea95ff4df6a684008a7fdfbd2c8&req=diQmFsh%2FnYVWUPMW1HO4zXOmE%2BUTc527wor7m6UZUvSD5OEvH0Dq9Mu0G%2BYB%0AYZr%2B%2FGegYDdNpe%2FM1ys%3D%0A>
- 
Vanta redirects you to Checkr’s authorization page. 
- 
Log in with your Checkr admin account, if prompted. 
- 
Review the permissions Vanta is requesting and approve the connection. 
- 
Checkr redirects you back to Vanta automatically.

### Step 3: Confirm the connection
After authorization, the Checkr background check integration should appear under the Connected tab in Vanta. An initial sync begins immediately. Background check data typically appears in Vanta within a few minutes, though larger accounts may take longer.
 

### Connect Checkr for Access Management (SCIM)
⚠️ Note: SCIM must be enabled on your Checkr account before completing these steps. Contact Checkr support to request your SCIM bearer token and SCIM URL if you have not already.

### Step 1: Find the Checkr Access integration in Vanta
- 
In Vanta, go to Integrations. 
- 
Search for Checkr Access in the Available tab. 
- 
Click View details, then click Connect.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2410118166/f6c8103bb8893570369de99b928c/07a64fb4-e9f3-4267-817a-a5d031d0b880?expires=1794967200&signature=9b1a586579ae009e68ea9ba7f4504da38bcd92935c9a86e4cf04a1a0b35a883a&req=diQmFsh%2FlYBZX%2FMW1HO4zbnqLEiKS3%2FFGoB6g5TDORGLGjF%2FJsq00G2npXPY%0AzYDL280CHFLBxrS4Bkk%3D%0A>
 

### Step 2: Enter your SCIM credentials
- 
In the connection modal, enter your SCIM bearer token.
- 
Enter your SCIM URL (provided by Checkr — format: https://accessmanagement.checkr.com/api/scim/v2/accounts/{your-account-id}).
- 
Click Validate and store credentials.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2410119614/7b61dc62115108d5321e0414ade4/a5d66a5e-775f-4cee-9e6f-30e2b5f31f66?expires=1794967200&signature=76d3d962cbeee962562865987ead1a1354a8759781ba18216f3bae35e328976f&req=diQmFsh%2FlIdeXfMW1HO4zWtprgUQmVBhc%2BacpDI2As3IFyP7TBGz%2BeJsg25h%0AsoMapXKb%2B3thkvYm4G4%3D%0A>
 

### Step 3: Confirm the connection
After authorization, the Checkr access management integration should appear under the Connected tab in Vanta. An initial sync begins automatically. User accounts and roles will appear in Vanta’s access review workflows once the sync completes.
 
 

## Permissions

### Background Check Connection (OAuth)
- 
Vanta reads candidate records and background check report statuses from Checkr.
- 
This access is read-only. Vanta does not create, modify, or delete any data in Checkr.

### Access Management Connection (SCIM)
- 
Vanta reads user accounts, groups, and role assignments from Checkr's user directory.
- 
This access is read-only. Vanta does not provision, deprovision, or modify users in Checkr
 
 

## Troubleshooting and FAQs

### The background check integration shows as disconnected
- 
Likely cause: The OAuth authorization was revoked in Checkr, the access token has expired, or the Checkr account used to authorize the connection no longer has the required access.
- 
How to confirm: Go to Integrations in Vanta and check the status of the Checkr connection.
- 
Fix: If it has disconnected, there will be a View error button. Click that button and then click Reconnect to complete the OAuth authorization flow again using a Checkr admin account.

### Employees are failing the background check test but checks appear complete in Checkr
- 
Likely cause: This typically happens when the email address in Checkr does not match any email address (including personal or HRIS-sourced emails) associated with the employee's record in Vanta, or when the candidate's name differs significantly between systems. 
- 
How to confirm: Check whether the email address and name on the Checkr candidate record exactly match the employee's record in Vanta.
- 
Fix: Update the email or name in the relevant system to ensure they match. After the next sync, the match should resolve and the test result should update.

### Background check data is not appearing after setup
- 
Likely cause: The Checkr account used to authorize the connection may not have access to the candidate records you expect, or the initial sync is still in progress.
- 
How to confirm: Wait up to 30 minutes after setup. If no data appears, confirm the authorizing Checkr account has admin-level access to the relevant candidate records.
- 
Fix: If the account permissions are correct and data still does not appear, disconnect and reconnect the integration using a Checkr account with full admin access.

### User accounts are missing from access reviews after SCIM setup
- 
Likely cause: The SCIM bearer token or SCIM URL entered during setup may be incorrect, or the token may have expired since setup.
- 
How to confirm: Go to Integrations in Vanta and check the status of the Checkr access management connection. If there is an error, the token or URL may need to be re-entered.
- 
Fix: Obtain a fresh SCIM bearer token and SCIM URL from Checkr and re-enter them in the Vanta integration settings.

### Roles are not visible for Checkr users in access reviews
- 
Likely cause: Role data may not be available from your Checkr SCIM configuration.
- 
How to confirm: Check whether roles are assigned to users in Checkr's access management system.
- 
Fix: Contact Vanta support to confirm whether role syncing is active for your account. If roles are assigned in Checkr but not appearing in Vanta, Vanta support can investigate.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-checkr--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-checkr--02.png
- [image 03] ../../images/integrations/checkr/connecting-vanta-checkr--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-checkr--04.png
- [image 05] ../../images/integrations/checkr/connecting-vanta-checkr--05.png
