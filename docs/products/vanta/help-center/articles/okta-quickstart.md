# Okta: Quickstart

Source: https://help.vanta.com/en/articles/15062074-okta-quickstart
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Connect Okta to Vanta so the users, groups, roles, applications, and password policies your team manages in Okta automatically power compliance tests, access reviews, and access requests.
⚠️Note: This is one of three separate Okta integrations. Each uses a different Okta app and must be set up independently:
- 
Okta API integration (this guide): syncs directory data into Vanta.
- 
Okta SSO: lets users log in to Vanta through Okta. See Okta: Integration Guide <https://help.vanta.com/en/articles/15082003-okta-integration-guide> > Enable SSO. 
- 
Okta SCIM: provisions users and groups from Okta into Vanta. See Connecting Vanta & Okta (SCIM) <https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim>.
Setting up one does not configure the others. If a step here says "the Vanta API app," it is not the same as the Vanta SAML app (SSO) or your SCIM app.
 

## What you'll do (~15 minutes)
- 
Create an Okta API Services app and grant read-only scopes (~6 min)
- 
Enter your Okta Domain and Client ID in Vanta (~2 min)
- 
Paste Vanta's public key URL back into Okta and validate (~5 min)
 

## Before you begin
Confirm all of the following before starting:
- 
You are an Okta Super Administrator in the org you want to connect. This role is required both to create the API app and to assign the Super Administrator role to it — without the role assignment, Vanta cannot sync role data and validation will fail.
- 
You have Vanta admin access.
- 
You know your Okta Domain (e.g., company.okta.com). Vanta explicitly rejects Okta admin URLs (e.g., company-admin.okta.com) and will return a validation error if you enter one.
💡 Tip: With multiple Vanta workspaces,  you do not need to create a new Okta API app for each Workspace. A single Okta API app URL can connect to all of your Vanta Workspaces. Run the Vanta-side steps once per Workspace using the same Okta app.
 

## Setup guide

### Step 1: Create the Okta API Services app

## 
- 
Log in to Okta as a Super Administrator.
- 
Go to Applications > Applications > Create App Integration.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375002282/0e0f969e9da07e0ba360a9014443/9dae386d-50d3-474f-952e-696708f22439?expires=1794967200&signature=14b425001242eed1d335027c7254c7c9fce360e6eaad46809700b3aedacf818a&req=diMgE8l%2Bn4NXW%2FMW1HO4zVvGg0kc3AQS1wdVZ%2FeYG0p0tD3pI%2Ffzhpdah8uE%0ATkOC22OETSM9w3MPDYk%3D%0A>
- 
Select API Services, click Next, name the app something that identifies it (e.g., Vanta API), and click Save.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375002851/f109e617e9b85c5e4a95c05c9cf1/2eb39f50-ec9f-400d-974e-59d50bc26b03?expires=1794967200&signature=f65f650a4e11ebf10875e43e181dd5ccc842c256faa1aefd9a615955a2598d8d&req=diMgE8l%2Bn4laWPMW1HO4zf76%2F2G3DhiDpZWjRkYw2sNQNMS4xVTLi8qS%2BkoY%0Arf9qaw1KxBNXMIpnLWk%3D%0A>
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375004095/eb89e7d87f53c13c51a5a74745cd/762b349b-e1d5-473a-ac6c-89bb786fc847?expires=1794967200&signature=954da54d30477a9fc9cd8bd9256a87650b6cf41203c247559ec29a2f7ab407d1&req=diMgE8l%2BmYFWXPMW1HO4zWW87baDc816awqCg%2Bu%2BsZnx3Dh%2Bw1AvK3m7GYt5%0Al4Vmsn07jpaceqOnZjQ%3D%0A>
 
 

### Step 2: Configure scopes, DPoP, and the Super Administrator role

## 
On the new app page: 
- 
Go to the Okta API Scopes tab and grant only these six read-only scopes:
- 
okta.appGrants.read
- 
okta.apps.read
- 
okta.groups.read
- 
okta.policies.read
- 
okta.roles.read
- 
okta.users.read
⚠️ Note: Do not add scopes outside this list. Vanta validates that the granted scopes exactly match what it needs and will report unexpected scopes as an error.
- 
On the General tab, under Client Credentials, click Edit and uncheck Require Demonstrating Proof of Possession (DPoP) header in token requests.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375007784/1c0e09484a982d957e3815ea7c11/7b2149e1-f5a3-4851-af9d-c4a49d55b2bf?expires=1794967200&signature=4ebea46e43b7dae673f44ab4adad161c43989642f13123f3436194adb3fd179a&req=diMgE8l%2BmoZXXfMW1HO4zYkqi8pNEqZw%2FWGo3BoLAY6Op5mA9aD1jTNBok%2F3%0AkwJMWOaNurbWXjMt1r0%3D%0A>
⚠️ Note on known Okta bug: After you save, reload the page and confirm this box is still unchecked. The setting sometimes silently reverts on first save.
- 
Still on the General tab, assign the Super Administrator role to the app (under Admin Roles or the assignments section, depending on your Okta version).
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375016252/aa41f24e86a4ed39f1d7b460dfd0/f66ab34b-82a1-41e9-8d99-1a959132a8cc?expires=1794967200&signature=827f20de377913747355eeb97df7c48cd7fa7d342cc69711454561f5ff72d7d1&req=diMgE8l%2Fm4NaW%2FMW1HO4zbb7p5XrOWpxalFqNSEX1iBHv7Vo0U8J7QoW1xDs%0AJGy5MEkZwl5L7PEVe5Y%3D%0A>
ℹ️ Note: The Super Administrator role must be assigned to the app itself — not just to your user account. See Before you begin for details.
- 
Still on the General tab, copy your Client ID (you’ll need it in the next step). Your Okta Domain is the URL you use to log in to Okta (e.g., company.okta.com), not the admin URL. 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375016559/e00486ef60db4b4cc8245b64bb7e/f9cf8619-9ec7-443c-b331-d1791068ef98?expires=1794967200&signature=e30ed9e0f80b4168be1cbb7959c1c59a5861cf165086db710a083595a3060d50&req=diMgE8l%2Fm4RaUPMW1HO4zVDHbu6E0mOzvTc0iDpKgRgTymEDBa4Q628L2L%2Bu%0Ai55eSlVsn3UrqJsVne0%3D%0A>
 
 

### Step 3: Start the connection in Vanta

## 
- 
In Vanta, go to the Integrations page, click Add integration, and search for Okta. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
Paste your Okta Domain (e.g., company.okta.com) and Okta Client ID into the fields, and click Next.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375102929/b1a44b4c8cad979f8746e6772a1b/e410e554-379f-4a7a-9a53-71157a999c94?expires=1794967200&signature=787b1d2230649afbb64795d30f5fea3aa4afc7facb6670b497ac5eb847816679&req=diMgE8h%2Bn4hdUPMW1HO4zZZBsLxnNnRMMEyqE7QVe30ip8TA3nZA6KYf%2BfD9%0AVg7kqYBNDVO0kDFqoJA%3D%0A>
- 
A modal with a public key URL will appear. Copy this URL — you will need it in Okta in the next step. Do not click Validate yet.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375104188/ce4e844aa4e0c3f41b5393f0373b/dcdf5dfe-6d81-47be-8ef6-81178d214e50?expires=1794967200&signature=68ac29d7bebfb29abe82847fe76d9f2dccba4999e0db48c7e8cfe8feb6dac5c2&req=diMgE8h%2BmYBXUfMW1HO4zTShB245INqSGPiC%2BASPLis5yfv9PSGuItMkiHHU%0AerWUWFjKQcTKvFl%2B%2FRM%3D%0A>
 

### Step 4: Add Vanta's public key URL to Okta

## 
- 
Return to your Okta API app and go to the General tab > Edit.
- 
Under Client credentials, select Public Key / Private Key.
- 
Under Public Keys, select Use a URL to fetch keys dynamically.
- 
Paste the URL you copied from Vanta into the field and click Save.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375108094/8e225cafd364fa8f01e9d543600b/40c7fff9-3dca-4643-bf0b-437044103dd2?expires=1794967200&signature=fca2cc41640dc6e538a15c649b7c9a8ffd9c3c3052b1059d1119490321c9865a&req=diMgE8h%2BlYFWXfMW1HO4zfgUNJOqiksqbfNgJ7tYmVDzaJRV9OY0aNbpLJyM%0A6uGXEE8itDWMNWSk3AQ%3D%0A>
 
 

### Step 5: Validate the connection 

## 
- 
Return to the Vanta modal and click Validate.
- 
On success, you'll be returned to the Integrations page with Okta shown as Connected.
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2375110520/d97c4618ad2bdd77fec9d8355e76/eba8c90f-ce3b-4e92-b936-411be84dcc7a?expires=1794967200&signature=9b75c65f150566b9a6000d0de640692d70319f4e9bcccc648ac63c2ea5187f5b&req=diMgE8h%2FnYRdWfMW1HO4zXtxtQO%2FeHELDM5DZiGO44eudInBlDgp7KBAoDLx%0ADQJUEyphgaNQpgixLA4%3D%0A>
 
 
 

## Verify your connection
Changes made in Okta, including adding new users or updating groups, are not real-time and can take up to an hour to appear in Vanta. This is expected behavior. 
- 
Okta should appear under the Connected tab on your Integrations page.
- 
Users synced from Okta will appear in the People section in Vanta.
- 
Compliance tests powered by Okta data will populate under Tests.
- 
Okta password policies will appear under Inventory > Password Policies.
 

## Troubleshooting

### Validation failed with a role or scope error
- 
Likely cause: The Super Administrator role was not assigned to the API app, or one or more required scopes are missing or extra. 
- 
Fix: In Okta, open the app and assign the Super Administrator role. Confirm all six required scopes are granted under Okta API Scopes — and that no extra scopes are present. Retry Validate in Vanta.

### Validation fails even after granting scopes and assigning the role
- 
Likely cause: The DPoP setting silently re-enabled itself after save (known Okta bug), or your Okta Domain is pointing at an admin URL. 
- 
Fix: Reload the Okta app page and confirm Require Demonstrating Proof of Possession (DPoP) header in token requests is still unchecked. In Vanta, confirm the domain is your regular Okta domain (company.okta.com), not the admin URL (company-admin.okta.com).

### Users are missing from Vanta after the initial sync
- 
Likely cause: IdP scoping may be enabled, which limits which users Vanta tracks to those assigned to the Vanta SAML app in Okta.
- 
Fix: Go to Integrations > Okta > Configure scope and check whether Control scope with Okta is enabled. If it is, confirm the expected users or groups are assigned to the Vanta SAML app in Okta. If it is not, wait for the next hourly sync and re-check. See the Integration Guide  <https://help.vanta.com/en/articles/15082003-okta-integration-guide>for scoping details.

### Groups are not appearing in Vanta
- 
Likely cause: Groups do not sync automatically from the Okta API integration. You either need to import them manually via Dynamic IdP Groups, or set up the separate Okta SCIM integration and use Push Groups. 
- 
Fix: To import groups without SCIM, go to People > Groups > Add Group > Add from identity providers. To push groups automatically from Okta, set up [Okta SCIM] and use the Push Groups tab — SSO alone will not sync groups.

### A user is shown as terminated in Vanta but is active in Okta
- 
Likely cause: Vanta uses your HRIS, not Okta, as the source of truth for employment status. If the HRIS has a user marked as terminated, Vanta reflects that regardless of Okta status. 
- 
Fix: Check the user's status in your HR system. If they should be active, update them in the HRIS first — the change will propagate to Vanta on the next sync.
 

## Additional resources
For complete configuration, data reference, scoping options, SSO and SCIM setup, and full troubleshooting, see the Okta: Integration Guide <https://help.vanta.com/en/articles/15082003-okta-integration-guide>.

## Images

- [image 01] ../../images/integrations/okta/okta-integration-guide--01.png
- [image 02] ../../images/integrations/okta/okta-integration-guide--02.png
- [image 03] ../../images/integrations/okta/okta-integration-guide--03.png
- [image 04] ../../images/integrations/okta/okta-integration-guide--04.png
- [image 05] ../../images/integrations/okta/okta-quickstart--05.png
- [image 06] ../../images/integrations/okta/okta-quickstart--06.png
- [image 07] ../../images/integrations/okta/okta-integration-guide--07.png
- [image 08] ../../images/integrations/okta/okta-integration-guide--08.png
- [image 09] ../../images/integrations/okta/okta-integration-guide--09.png
- [image 10] ../../images/ux/integrations/okta-integration-guide--10.png
