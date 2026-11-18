# Connecting Vanta & Anthropic's Claude Console

Source: https://help.vanta.com/en/articles/12418852-connecting-vanta-anthropic-s-claude-console
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
Vanta integrates with Anthropic to sync user account data from your Anthropic Developer Console organization. Synced accounts are used to run automated compliance tests, power Access Reviews, and support Access Requests in Vanta.
- 
Connection method: Claude Console Admin API key. Console admin keys have no selectable scopes.
- 
Most useful for: Security and compliance teams monitoring user access to the Anthropic API platform. 
- 
Estimated setup time: Less than 10 minutes.
ℹ️ Note: Vanta supports the Anthropic Claude Console (platform.claude.com), an API platform for building. It does not support Claude.ai, which is a separate chat subscription product with a distinct portal, user base, and API key type.
 

## Use cases and capabilities
 | 
Resource | 
Supported | 
Used in
 | 
Users | 
✅  | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests
 | 
Roles (as account metadata) | 
✅  | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Groups | 
❌ | 
 
 | 
Last login | 
❌ | 
 
 | 
MFA status | 
❌ | 
 
 

## Automated compliance tests
Connecting Anthropic enables two automated tests in Vanta: 
- 
Anthropic accounts associated users: Vanta verifies that every synced Anthropic account is linked to a known, active employee.
- 
Anthropic account deprovisioned when employees leave: Vanta verifies that Anthropic accounts are removed when an employee is terminated or leaves the organization.

## Access reviews
Synced Anthropic accounts appear in Vanta's Access Reviews workflow. Reviewers can see each user's name, email address, and assigned role. Completed reviews serve as audit evidence.
- 
Note: Roles are displayed as metadata on each account. They cannot be selected as formal entitlements in Access Request flows. 

## Access requests 
Anthropic accounts are included in Vanta's Access Requests workflow, allowing teams to track and manage provisioning.
- 
Note: Role-based entitlement selection within Access Request flows is not supported for this integration.
 

## Prerequisites
Before connecting, confirm you have all of the following:
- 
Vanta: administrator permissions
- 
Anthropic Claude Console: An account with the admin organization role — the only role that can create Admin API keys
- 
Admin API Key: Generated from the Claude Console with the prefix sk-ant-admin01-
 | 
⚠️ Note: This integration requires an Admin API key, not a standard Anthropic API key. Standard API keys have the prefix sk-ant-api… and will be rejected by Vanta with a generic "Invalid API Key" error, even if the key is otherwise valid. See Troubleshooting for details.
 

## Setup guide

## Step 1: Generate an Admin API Key in Anthropic’s Claude Console 
- 
Go to platform.claude.com and sign in with an admin account.
- 
Then go to Settings > Admin keys, or go directly to platform.claude.com/settings/admin-keys.
- 
Select Create key.
- 
Choose a key expiration. The integration stops syncing when the key expires, so pick a window that matches your rotation process and plan to reconnect Vanta with a new key before then.
- 
Copy the key and store it securely. You will not be able to view it again after closing this dialog.
- 
Confirm the key begins with sk-ant-admin01- before proceeding. If it begins with sk-ant-api…, you have generated a standard API key (return to the beginning of Step 1 and generate an Admin API key instead).
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1745156005/920b6a033cd121e09683886d4442/e039df4c-2f12-420c-a102-2c22b9934ea7?expires=1794967200&signature=555061ed0f4179ce96852e88edd966faea465b4a285dc44d00fe138f756e9f92&req=dScjE8h7m4FfXPMW1HO4zYLZGd20s72W2EbEHUnUf7jNPTFbBp24UM9CyOUS%0Amcwgrpjr9luMyeMjjWM%3D%0A>
 

## Step 2: Connect the integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Anthropic. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect. 
- 
Paste your Admin API key into the API Key field.
- 
Select Validate and store credentials. 
- 
Vanta will validate the key immediately. If validation fails, see the Troubleshooting section.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1745156246/4ac8c7ebbfca89afa3a66a9902c8/ab32c3df-ce67-46ec-a43a-cf533d499024?expires=1794967200&signature=6bfd76912160c04c6019b6e53ef96c30e90faeaa1fa75023acacbd056e608afe&req=dScjE8h7m4NbX%2FMW1HO4zVYXzKcMHT%2BZsyRwza5hVZ9hTazsoGdV%2FvnRC3OV%0Aw51s3mvMuuYfhHZYzLw%3D%0A>
 
 

## Verification and validation
After connecting, confirm the integration is functioning correctly:
- 
In Vanta, navigate to Integrations and confirm Anthropic shows a Connected status.
- 
Navigate to your accounts or people view in Vanta and filter by Anthropic to confirm user accounts are populating.
- 
Cross-reference a sample of accounts against your Anthropic Claude Console organization to confirm names, emails, and roles match.
What is normal: 
- 
Accounts appear with name, email, role, and creation date populated.
- 
Last login, MFA status, and group membership fields are empty. This is expected behavior for this integration.
What to investigate: 
- 
Fewer accounts than expected → confirm you are comparing to Claude Console users at platform.claude.com, not Claude.ai users (these are separate populations and only Claude Console users sync to Vanta).
- 
No accounts after the expected sync window → check that the integration status shows Connected and that the Admin API key has not been revoked.
 

## Permissions
Vanta connects using a Claude Console Admin API key. These keys have no selectable scopes and carry full Admin API access; Vanta uses it only to read your organization's users.
 

## Vanta can read:
- 
User accounts (name, email, role, account creation date)
- 
Used to run automated compliance tests, populate Access Reviews, and support Access Requests

## Vanta cannot write:
- 
Vanta has no write permissions to Anthropic. It cannot create, modify, or delete users or any other data in Anthropic.
 

## Troubleshooting and FAQs 

## Issue 1: "Failed to validate Anthropic credentials. Invalid API Key."
Likely cause: A standard API key (sk-ant-api...) was entered instead of an Admin API key (sk-ant-admin...). These are different key types in the Anthropic Claude Console. Standard API keys do not have permission to call the Admin API and will always be rejected by Vanta, even if the key is valid and active.
 
How to confirm: Check the prefix of the key you entered.
- 
Admin API key: sk-ant-admin... ✅
- 
Standard API key: sk-ant-api... ❌
Fix:
- 
Go to platform.claude.com/settings/admin-keys.
- 
Generate a new Admin API key (not a standard API key).
- 
In Vanta, navigate to the Anthropic integration and re-enter the new key.
 

## Issue 2: Setup steps lead to Claude.ai instead of Claude Console
Likely cause: Anthropic operates two separate products. The Vanta integration requires the Claude Console at platform.claude.com. Customers with Claude.ai Enterprise subscriptions may navigate to their Claude.ai admin panel at claude.ai instead — that portal does not have Admin API keys and is not compatible with this integration.
 
How to confirm: Check the URL you are navigating to. Admin API keys can only be generated at platform.claude.com/settings/admin-keys.
 
Fix: Navigate to platform.claude.com — not claude.ai — and follow the Setup Guide above.

## Images

- [image 01] ../../images/integrations/anthropic/connecting-vanta-anthropic-s-claude-console--01.png
- [image 02] ../../images/integrations/anthropic/connecting-vanta-anthropic-s-claude-console--02.png
