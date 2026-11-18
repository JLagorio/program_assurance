# Connecting Vanta & Tailscale

Source: https://help.vanta.com/en/articles/11707697-connecting-vanta-tailscale
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
The Vanta integration connects to the Tailscale API over OAuth and imports your Tailscale user accounts into Vanta on a regular schedule, so those accounts can be included in access reviews and deprovisioning checks alongside your other systems. It is best suited for teams that use Tailscale <https://tailscale.com/> to manage VPN access to their network.
 
Estimated setup time: 5 minutes
 

## 

## Use cases and capabilities 
- 
Access reviews: Tailscale accounts synced into Vanta appear as reviewable accounts, so reviewers can confirm access is still appropriate without a manual export from Tailscale.
- 
Deprovisioning checks: Vanta checks whether Tailscale accounts are deactivated once the associated personnel record is marked as terminated, and can optionally suspend the account automatically — see Automated deprovisioning below.
- 
Account linking: Vanta matches Tailscale accounts to personnel records by login name (email), so linked and unlinked accounts are visible ahead of a review.
⚠️ Note: This is an Access integration only. Vanta does not read or monitor Tailscale devices, ACLs, DNS settings, or network configuration. See the capabilities table below for what's in and out of scope.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it's used in Vanta
 | 
User accounts | 
Yes | 
Personnel/access-review matching, deprovisioning checks
 | 
Account role | 
Yes | 
Displayed on the account record (Owner, Admin, Network Admin, IT Admin, Billing Admin, Auditor, Member)
 | 
Account status | 
Yes | 
Filters which accounts sync (Active only, by default); powers deprovisioning checks
 | 
Last seen / created date | 
Yes | 
Displayed on the account record
 | 
Suspended flag | 
Partial (limited availability) | 
Only populated if your workspace has this feature enabled; otherwise not set
 | 
Shared / external users | 
Optional | 
Only included if User Type is set to Shared or All (defaults to Member only)
 | 
Multiple tailnets | 
Yes | 
Connect and manage more than one tailnet independently
 | 
Automated deprovisioning | 
Optional (opt-in) | 
Vanta can automatically suspend a Tailscale account when the associated employee is offboarded — see below
 | 
MFA status | 
No | 
Not exposed by the Tailscale API endpoint this integration uses
 | 
Devices / nodes | 
No | 
Not read by this integration
 | 
Groups, ACLs, network policy | 
No | 
Not read by this integration
 
 

## Prerequisites
Before starting steup, confirm the following:
- 
You have a Vanta admin account.
- 
You have an Owner or Admin account in Tailscale (needed to create a trust credential in the admin console).
- 
You know your Tailnet ID, if you manage more than one tailnet and want to connect a specific one.
💡 Tip: Most single-tailnet customers can skip the Tailnet ID. Leave the default and Vanta will target your tailnet automatically.
 
 

##  Setup guide

### Step 1: Create a trust credential in Tailscale
- 
In the Tailscale admin console, go to Settings > Trust credentials. (Vanta's Connect flow may still link you to this page under its older name, OAuth clients — it's the same page.)
- 
Click + Credential, then select OAuth.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2538676707/4b7b29cfdf83db0a90bc30dde46e/image.png?expires=1794967200&signature=c2ee5a4a74b8c079ba649462e169df8d430edfc4ac9c49f714cc21477122c155&req=diUkHs95m4ZfXvMW1HO4zeogHysEVkctmDw%2F1GlJmx721g39OlIJtwPp2k%2Bc%0AEcXLjlJAQqZ8K4t6rUU%3D%0A>
- 
On the Scopes step:
- 
Grant Users > Read (read-only connection) or Users > Read and Write (if you're also setting up automated deprovisioning).
- 
Leave all other scopes (devices, DNS, etc.) unchecked.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2538678862/01dbb746e002577bb21c496dc994/image.png?expires=1794967200&signature=d3c7c8451fc1373697b06f5a0e6006a1199822785cbd6ebf4823b5bdaec4e8fe&req=diUkHs95lYlZW%2FMW1HO4zU0801RDu6zXNg1ydFZW8Y4xJaqWfF576eCVY4V3%0ASiNG4a3K58LGiK7hRiA%3D%0A>
⚠️ Note: Vanta validates the credential's scope on connection. Granting extra scopes will cause the connection to fail.
- 
Click Generate, then copy the Client ID and Client secret.
⚠️ Note: Tailscale only shows the client secret once. Copy it somewhere safe before closing the credential screen. You cannot retrieve it again. (Unlike the client secret, scopes on an existing credential can be edited later from the Trust credentials page, so you can add the Write scope afterward if you decide to enable automated deprovisioning).
 

### Step 2: Connect in Vanta
- 
In Vanta, go to the Integrations page and click Add integration. 
- 
Search for Tailscale, click the integration card, and then click Connect.
- 
Enter your Client ID and Client secret.
- 
Optionally adjust:
- 
Organization Name (Tailnet ID): defaults to -, which automatically targets your own tailnet. Only change this if you manage multiple tailnets and want to connect a specific one. Tailscale previously called this field "Organization"; tailnets created before October 2025 may still show it as a "Legacy ID."
- 
User Type: defaults to Member. Choose Shared or All only if you also need to review external users associated with your tailnet through Tailscale's sharing feature.
- 
User Status: defaults to Active only (pre-selected in a multi-select list). Add additional statuses (Idle, Suspended, Needs Approval, Over Billing Limit) if your access reviews need to cover accounts in those states.
- 
Click Validate and store. Tailscale should appear as Connected on the Integrations page.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2538685352/76a672309d389ccc2bf1fef4f9b7/image.png?expires=1794967200&signature=259dd134bd2eddd26ef60643ad2e827762e2c9bd668a661bdb7f1567eb592823&req=diUkHs92mIJaW%2FMW1HO4zdJj%2B0dkXWVev%2B6isfnEYtUCjHbc8nmnv0VHPx7D%0AVHIZz6SQhc%2FLKOEbtcg%3D%0A>
 
 

### Connecting multiple tailnets
A single Vanta account can connect multiple tailnets. Go to Integrations > Tailscale > Manage > Edit > Add Tailnet to add another connection. Each tailnet is configured independently, with its own Client ID, Client secret, Organization Name, User Type, and User Status.
 
 

## Automated deprovisioning (optional)
This feature is opt-in and applies per connection. Existing connections are unaffected unless you enable it.
ℹ️ Note: Vanta only ever suspends accounts. It never permanently deletes a Tailscale user, and a Tailscale admin can restore a suspended account at any time.
- 
In the Tailscale admin console, go to Settings > Trust credentials and open the credential you use for Vanta.
- 
Enable Write on the Users scope (in addition to the existing Read scope), then Save.
- 
In Vanta, go to Integrations > Tailscale > Manage, re-test the credential, and enable the deprovisioning opt-in.
⚠️ Note: If you include Suspended in your User Status setting (see Step 2 above), suspended accounts continue to appear in Vanta's inventory instead of dropping out of sync , which means they won't be picked up by automated deprovisioning detection. If you want offboarded accounts to be detected as deprovisioned automatically, don't include Suspended in User Status.
 
 

## Permissions

### Read access
We use the OAuth credential you provide to call Tailscale's List Users endpoint and read: account ID, display name, login name (email), role, status, created date, and last-seen date, for users matching your User Type and User Status settings.
 

### Write access
By default, we have no write access to your Tailscale account. If you opt into automated deprovisioning, we gain permission to suspend a Tailscale account during offboarding. We never delete accounts, and we never use write access for anything other than suspension.
 
 

## Troubleshooting and FAQs

### The connection fails with an invalid credentials error
- 
Likely cause: The Client ID or Client secret entered in Vanta is incorrect, or the credential was revoked in Tailscale.
- 
How to confirm: In Tailscale, go to Settings > Trust credentials and confirm the credential still exists and is active.
- 
Fix: Generate a new trust credential in Tailscale following Step 1 above, and re-enter the Client ID and secret in Vanta.

### The connection fails with an invalid scope error
- 
Likely cause: For a read-only connection, the trust credential wasn't created with exactly the Users: Read scope — either that scope is missing, or additional scopes were granted. (If you've opted into automated deprovisioning, Vanta expects Users: Read and Write together).
- 
How to confirm: In Tailscale, check the scopes assigned to the credential you're using.
- 
Fix: In Tailscale, open the credential under Settings > Trust credentials and edit its scopes to grant only Users: Read (or Read and Write, if you're using automated deprovisioning). Scopes can be edited on an existing credential, so you don't need to create a new one, then re-test the connection in Vanta.

### Deprovisioning shows a "scopes not granted" error
- 
Likely cause: Automated deprovisioning is turned on in Vanta, but the Tailscale credential doesn't have the Users: Write scope granted, or the opt-in hasn't been re-confirmed since the scope was added.
- 
How to confirm: In Tailscale, open the credential under Settings > Trust credentials and confirm Write is enabled on the Users scope.
- 
Fix: Enable Write on the Users scope, save, then go to Vanta's Tailscale integration settings and re-test the credential so Vanta can confirm the new scope.

### The connection fails with an invalid organization name / tailnet not found error
- 
Likely cause: The value entered in Organization Name doesn't match an existing tailnet.
- 
How to confirm: Check your tailnet identifier in Tailscale under Settings > General.
- 
Fix: Update the Organization Name field in Vanta to match, or leave it as the default - if you only manage one tailnet. Note: if this error occurs during a background sync on an already-connected integration (for example, if the tailnet is renamed or deleted after initial setup), Vanta automatically unlinks the credential and you'll need to reconnect. During initial setup, this error is returned as a validation message instead.

### Some Tailscale users aren't showing up in Vanta
- 
Likely cause: Their account status doesn't match your User Status setting (Active only, by default), or they're a Shared/external user while User Type is set to Member.
- 
How to confirm: Check the user's status and type in the Tailscale admin console, and compare against your Vanta integration's User Status and User Type settings.
- 
Fix: Add the relevant status to User Status (for example, add Idle to cover recently offboarded accounts), or change User Type to Shared or All to include external users.

## Images

- [image 01] ../../images/integrations/tailscale/connecting-vanta-tailscale--01.png
- [image 02] ../../images/integrations/tailscale/connecting-vanta-tailscale--02.png
- [image 03] ../../images/integrations/tailscale/connecting-vanta-tailscale--03.png
