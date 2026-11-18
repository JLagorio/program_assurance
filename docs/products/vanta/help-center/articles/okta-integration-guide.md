# Okta: Integration Guide

Source: https://help.vanta.com/en/articles/15082003-okta-integration-guide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

## Overview
If your team uses Okta to manage employee access, this integration brings that identity data into Vanta automatically. Your team keeps working in Okta. Vanta handles the rest (evidence collection, access reviews, and compliance monitoring) using the user directory, group memberships, roles, MFA enrollment, application assignments, and password policies it reads directly from your org.
 
Want the fastest way to get started? Go to the Okta: Quickstart <https://help.vanta.com/en/articles/15062074-okta-quickstart>.
 

### What you can do with this integration
- 
Automatically verify that terminated employees have had their Okta accounts deactivated.
- 
Track whether users have enrolled in MFA and which factor types they are using.
- 
Confirm all Okta accounts are linked to Vanta personnel records.
- 
Surface users, groups, roles, and applications in access review workflows.
- 
Request and manage access to Okta entitlements through Vanta's Access Requests workflow.
- 
Use Okta password policies as audit evidence for SOC 2, ISO 27001, and similar frameworks.

### Three separate Okta integrations, one Okta tenant 
We support three distinct Okta integrations, each configured independently: 
 | 
Integration | 
What it does | 
Okta-side setup
 | 
Okta API (this guide) | 
Syncs users, groups, roles, apps, and policies into Vanta for monitoring and reviews | 
Okta API Services app
 | 
Okta SSO (this guide) | 
Lets users log in to Vanta via Okta | 
Vanta SAML app (from Okta's catalog)
 | 
Okta SCIM <https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim> | 
Provisions and deprovisions users and groups from Okta into Vanta | 
SCIM 2.0 app (or the Vanta SAML app, with limitations)
Setting up one does not configure the others. If login works but groups are missing, or if users are provisioning but roles don't surface, the cause is almost always that only one of the three integrations has been configured.
 

### Connection details 
 | 
Detail | 
Value
 | 
Connection type | 
OAuth 2.0 with private key (default) — JWT client assertion signed with a private key, exchanged at /oauth2/v1/token. API Token (SSWS) is also supported as an alternate auth method.
 
Use API Token authentication only if your environment restricts OAuth app creation or if you're connecting a legacy instance. For all new connections, use OAuth with private key.
 | 
Access level | 
Read-only. Vanta makes no writes to Okta. 
 
Curious what data Vanta reads from Okta? See the What Vanta collects and why section. 
 | 
Who should connect | 
An Okta Super Administrator. This role is required to create the API app and to assign the Super Administrator role to the app.
 | 
Multiple Vanta Workspaces | 
Each Vanta Workspace requires its own Okta API app. Vanta generates a unique dynamic public-key URL per Workspace, and an Okta API app supports only one such URL at a time. Connecting a second Workspace to the same app overwrites the first Workspace's URL and breaks that connection.

### 
 

## What Vanta collects and why 
This section covers the data Vanta reads from Okta and why each field is collected. For how this data powers specific Vanta workflows, see Use cases and capabilities.
 

### Scope — what Vanta monitors
By default, Vanta reads all users in your Okta org, their factor enrollments, their role assignments, all applications, and the users assigned to those applications. Password policies configured in Okta are also collected. 
ℹ️ Scoping note: If IdP scoping is enabled, Vanta only monitors users assigned to the Vanta SAML app in Okta. See Controlling Scope Through Okta <https://help.vanta.com/en/articles/11345660-controlling-scope-through-okta>. 

### Users
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
User ID | 
Unique Okta user identifier | 
Matches users across workflows and prevents duplicates
 | 
Email (login) | 
Primary account email | 
Links the user to Vanta personnel records
 | 
First name, last name, display name | 
Name fields from the profile | 
Populates personnel records
 | 
Title | 
Job title from profile | 
Populates personnel profiles
 | 
Employee number | 
From profile (if set) | 
Supports HRIS-to-IdP matching
 | 
Account status | 
Current status (active, suspended, deactivated) | 
Drives deactivation tests and personnel lifecycle
 | 
Activation time | 
Timestamp | 
Populates personnel records
 | 
Last login time | 
Timestamp of most recent login | 
Surfaces in access reviews
 | 
Creation time | 
When the account was created | 
Populates personnel records
 | 
MFA enrollment | 
Whether MFA is enabled on the account | 
Powers the MFA compliance test

### MFA factors (per user)
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Factor ID | 
Unique identifier | 
Deduplicates factors
 | 
Factor type | 
e.g., Okta Verify, WebAuthn, SMS | 
Surfaces which factors users have enrolled
 | 
Status | 
Active or pending | 
Confirms the factor is actually enrolled, not just provisioned

### Admin roles (per user)
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Role ID | 
Unique identifier | 
Deduplicates roles
 | 
Role label and type | 
e.g., SUPER_ADMIN, READ_ONLY_ADMIN | 
Surfaces privileged access
 | 
Status | 
Role status | 
Confirms the role is active
 | 
Assignment type | 
Direct or via group | 
Shows how the role was granted
 | 
Created, last updated | 
Timestamps | 
Supports access review timelines
 | 
Description | 
Role description | 
Human-readable context

### Groups
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Group ID | 
Unique identifier | 
Deduplication and scoping
 | 
Group name | 
Display name | 
Identifies the group in Vanta workflows
 | 
Member list | 
User IDs of members | 
Powers group-based access reviews and IdP group imports
ℹ️ Note on Groups and the API integration: The Okta API integration pulls group metadata, but groups do not automatically populate into Vanta's People > Groups view. To surface Okta groups as Personnel Groups, import them via Dynamic IdP Groups for Okta <https://help.vanta.com/en/articles/11345666-dynamic-idp-groups-for-okta>. Alternatively, Okta SCIM <https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim> with Push Groups creates Teams, which serve a different purpose. 

### Applications (vendors)
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
App ID | 
Unique identifier | 
Deduplicates vendors
 | 
Label, name | 
Display name and internal name | 
Identifies the vendor
 | 
Sign-on mode | 
How users authenticate to the app | 
Context for vendor review
 | 
Creation time, last updated | 
Timestamps | 
Supports vendor lifecycle
 | 
Assigned users | 
User IDs with access | 
Maps vendors to users for review
 | 
Assigned groups | 
Groups with access | 
Maps vendors to groups

### Password policies
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Policy ID, name | 
Identifier and display name | 
Identifies the policy in Vanta
 | 
Max password age | 
Expiration setting | 
Audit evidence
 | 
Minimum password length | 
Length requirement | 
Audit evidence
 | 
Character requirements (lowercase, uppercase, numbers, symbols) | 
Complexity rules | 
Audit evidence
 | 
Password reuse rules | 
Reuse restrictions | 
Audit evidence
See Tracking Password Settings for Okta <https://help.vanta.com/en/articles/11345642-tracking-password-settings-for-okta-in-vanta> for how to attach these policies to vendors for audit evidence.
 

### Authentication policies (access policies)
✅ Feature availability: Authentication policy data is being rolled out progressively. If you do not see this data in your account, it may not yet be enabled for your workspace.
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Policy type | 
e.g., ACCESS_POLICY, MFA_ENROLL, OKTA_SIGN_ON | 
Identifies the kind of authentication policy
 | 
Policy name | 
Display name of the policy | 
Identifies the policy in Vanta workflows
 | 
Rules | 
Each rule's status (active or inactive), name, actions (e.g., allow or deny, verification method), and conditions (e.g., device registration, managed status) | 
Powers phishing-resistant MFA, biometric MFA, and device trust compliance tests

### Org-level security configuration (FedRAMP Moderate)
ℹ️ Note: This data is collected only for workspaces enrolled in FedRAMP Moderate. It requires the two additional OAuth scopes listed in the Permissions section (okta.authenticators.read and okta.threatInsights.read).
 | 
Data point | 
What Vanta collects | 
Why it's collected
 | 
Active authenticators | 
For each enabled authenticator: ID, key (e.g., webauthn, okta_verify), name, status, and type | 
Powers phishing-resistant MFA and biometric MFA compliance tests
 | 
ThreatInsight action | 
Current ThreatInsight setting: none (disabled), audit (log only), or block (log and block) | 
Powers the ThreatInsight suspicious IP blocking compliance test
 
 
 

### What Vanta does not collect or do 

## 
 | 
What | 
Detail
 | 
User passwords | 
Never read
 | 
Authentication session tokens | 
Not accessed
 | 
Write access to your Okta org | 
Vanta does not create, modify, or delete any data in Okta 
 | 
Provisioning changes from Vanta back to Okta | 
The integration is read only 
 
To provision users into the Vanta app in Okta, set up Okta SCIM <https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim> separately 
 
 

## Prerequisites and readiness checklist
Complete all items in this checklist before starting setup. 
 

### Confirm you are an Okta Super Administrator 
This role is required for two reasons: 
- 
Only Super Administrators can create API Services apps with the scopes Vanta needs.
- 
Vanta requires the Super Administrator role to be assigned to the API app itself in order to read role data. Without this, role information will not sync and validation will return a role-related warning.
ℹ️ Note: Whether Super Administrator is required depends on the integration type. For the Okta API integration covered in this guide, Super Administrator is required. SSO and SCIM may work with more limited roles.
 

### Confirm your Okta Domain, not the admin URL
Vanta validates the connection URL and explicitly rejects Okta admin URLs (e.g., company-admin.okta.com). Use your standard Okta domain, which typically looks like company.okta.com or company.oktapreview.com.
 

### Decide which Okta integrations you need 
Before starting, decide which of the three you need:
- 
Just directory monitoring? Okta API integration only (this guide).
- 
Directory monitoring + login to Vanta via Okta? Okta API + Okta SSO (this guide).
- 
Directory monitoring + automated user/group provisioning? Okta API + Okta SCIM <https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim>.
All three? All three must be set up independently.
- 
Running Okta alongside another identity provider (Google Workspace, Entra, etc.)? See Integrating Multiple Identity Providers <https://help.vanta.com/en/articles/11345659-integrating-multiple-identity-providers> before connecting either one.
 

### (Optional) Prepare your scoping assignment
If you want Vanta to track only a subset of Okta users, plan your scoping approach before connecting. See Configure IdP scoping for naming and assignment requirements.
 

### Confirm the connecting admin will retain Super Administrator access
The account used to complete this setup should retain Super Administrator access in Okta on an ongoing basis. If that account later loses Super Administrator status, a current Super Administrator will need to step in for any future changes to the API Services app such as updating scopes, rotating credentials, or modifying role assignments.
 
 
 
 
 

### Readiness checklist - quick reference 
- 
You are an Okta Super Administrator.
- 
You have Vanta admin access.
- 
You know your standard Okta Domain (not the admin URL).
- 
You've decided which of the three Okta integrations you need.
- 
(Optional) You've planned your scoping approach if you don't want to sync all users.
- 
The admin account completing setup will retain Super Administrator privileges long-term.
 
 

## Setup guide 
Here are the steps to connect. 
 

### Step 1: Create the Okta API Services app 
- 
Log in to Okta as a Super Administrator.
- 
Go to Applications > Applications > Create App Integration.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380865486/d786a77fc9322634327752df28b1/5b2f1640-5ae7-483d-93f9-3a2c14009172?expires=1794967200&signature=53b8946439249365fc99e416d5470de97960c03ecafcc8f6338891d2cdfc066c&req=diMvFsF4mIVXX%2FMW1HO4zRANGmyS6biUqUxxJv3l%2F%2BzePXjX8YzWuvXEtuMd%0ADrgAIGZs9PqC6mXFCIs%3D%0A>
- 
Select API Services and click Next.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380865840/ec4f27365f8151f08cdce0a41ce6/c359e045-71e5-4d02-85d8-3ddbcecfc5fe?expires=1794967200&signature=4d29ecb9712f045f33fd72f49358aa93f713a8915f84d9d78a0a43760d8b0c8b&req=diMvFsF4mIlbWfMW1HO4zRwNYH4Lpnjtp3erCoXC4tY5oZt0jKuzNnePxMhu%0AyVgWqx62%2BK%2F1BU5exQU%3D%0A>
- 
Name the app (e.g., Vanta API) and click Save.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380866179/7b09987f5af0539182befbda925e/4c9b1498-9e7d-4ada-8fdb-64601ad9b797?expires=1794967200&signature=eeb81a45538715d22926882d1b1fdea89eaab37412092054bbb99c505e9057e6&req=diMvFsF4m4BYUPMW1HO4zfhwgTJ1CcBUiluLyOq6jvcsjt8efQ287l0TKRUa%0AVY9OGmqE1nC3BVPkqCE%3D%0A>
 

### Step 2: Configure scopes, DPoP, and the Super Administrator role 
- 
On the Okta API Scopes tab, grant only these six read-only scopes:
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
⚠️ Note: Do not add scopes outside this list. Vanta validates that the granted scopes exactly match the expected set and will report both missing and unexpected scopes as errors.
- 
On the General tab, under Client Credentials, click Edit and uncheck Require Demonstrating Proof of Possession (DPoP) header in token requests.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380870509/ac5f4faad03cc1ce32f786d398b0/b1d68b27-5259-440d-b30b-015e13ca060d?expires=1794967200&signature=d31c3f7bcdde67d04d6075511ef13a9ff4df271793868d6cfd5b9ca43228e26c&req=diMvFsF5nYRfUPMW1HO4zWzpjYvm1WztNaFj4Inmz96NNEprQhykZysNkVE9%0AC19kN61HmJ%2Bhc14BSEo%3D%0A>
⚠️ Note on a Known Okta bug: After saving, reload the page and confirm the box is still unchecked. The setting can silently revert on first save.
- 
Assign the Super Administrator role to the app.
- 
Still on the General tab, copy your Client ID. You will need it in the next step. Your Okta Domain is the URL you use to sign in to Okta (e.g., company.okta.com), not the admin URL (company-admin.okta.com). Vanta will reject the admin URL and return a validation error.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380872708/16d522cc4e59ce95098a3d0cf863/0dea9551-9418-477b-a5df-2b96e2e4b78b?expires=1794967200&signature=f957244093767edaf2e56d7d72c1a2be47e6c7620fc5ade453930fe4ab4fa8e6&req=diMvFsF5n4ZfUfMW1HO4zdKsthqciAjFCWWMUE%2BgVmTl3cAZQDm3uih6ieNR%0AOuFMHxXzX%2FT%2BJufrn0E%3D%0A>
 

### Step 3: Start the connection in Vanta
- 
In Vanta, go to Integrations, search for Okta, then click Connect.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380874795/ec97747f005248297e75962c501d/597fd12b-1e8d-4834-b9c5-ed5232341bae?expires=1794967200&signature=2da5fc383e8d7a8b2d056675347bca6ca44a2ebfb7ff933f6f6e649168d61cd0&req=diMvFsF5mYZWXPMW1HO4zRXUNGvRw9vVMq8V86VTDFibIGMNNP4AahiUjFn1%0A0%2BselPgot37BK9CXonI%3D%0A>
- 
Paste your Okta Domain and Okta Client ID, then click Next.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380874987/3a6575837ef2e0884b98686f15df/5a2cbbab-5180-48f7-989e-fffa1205df88?expires=1794967200&signature=afb3f3812b77d56cc4910b10f28cbdc09728accb0025298a7a80575617f14a13&req=diMvFsF5mYhXXvMW1HO4zX4HLbKkBazFTI3RsaEGql4roP98H1slGqa2eT4H%0AmDMVPW%2BQHuJZf26pZ68%3D%0A>
- 
Copy the public key URL from the modal. Do not click Validate yet.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380877146/85d40219af6f51fefe36faa18eaa/834f8187-31e1-4004-9587-4ee3507638d3?expires=1794967200&signature=9e4f9ac07d1c00adacb98fa816c60d5dca6706a8da93defd599e6694e94f98db&req=diMvFsF5moBbX%2FMW1HO4zXxk%2F8IpsSXnBiUlWNDop19E2L17jsajPS4r2Euy%0AOAZGPV%2FAASZqwbUkqlE%3D%0A>
 

### Step 4: Add Vanta's public key URL to Okta
- 
Return to your Okta API app, go to General > Edit.
- 
Under Client authentication, select Public Key / Private Key.
- 
Under Public Keys, select Use a URL to fetch keys dynamically.
- 
Paste the URL from Vanta and click Save.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380878870/10e4b2fc254f894a58d1e34f986b/b2d85480-b3df-49d8-b564-adcdc6aab518?expires=1794967200&signature=9991a6de061e1774ae999cdfca934ba9102af1875d27fe127a0725800be8cfaf&req=diMvFsF5lYlYWfMW1HO4zZX9BIVajCpDbIC66EhMdyTHmI8Olt2N1q6WSei3%0AbPPgdhfGDR%2FIGog9ZgI%3D%0A>
 

### Step 5: Validate in Vanta 
Return to the Vanta modal and click Validate. Okta should now appear as Connected on the Integrations page.
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380880354/149e44a35fbc50af4e938dc8c640/876c5567-783f-4b09-aece-5934980c3535?expires=1794967200&signature=31c482fa8737adb2faae0db5ecfe4d9047cd6718b66884dfe849515dfcd410b8&req=diMvFsF2nYJaXfMW1HO4zRNygB2tOs4183PRB2ZJHxCl6ImHabE7sxm9mPYX%0Anx6mlyzc7Y6RzNCTNTg%3D%0A>
 
 
 

### Alternate: API Token (SSWS) authentication

## 
Vanta also supports API Token authentication as an alternative to OAuth with private key. If you connect using an API Token, credentials are sent as Authorization: SSWS {token} rather than via JWT exchange. Token-based setup is supported for backward compatibility. New connections should use OAuth with private key, as described in the steps above.
 
 

### Optional Configurations

### Configure IdP scoping
 
By default, Vanta imports all users from Okta. To limit which users appear in Vanta (for example, to exclude contractors or service accounts), use IdP scoping.
⚠️ Note: IdP scoping uses the Vanta SAML app in Okta as its scope boundary, regardless of whether you are enabling SSO login. If you have not installed the Vanta SAML app yet, complete the Enable SSO steps below first, then return here. You do not need to enable SSO login to use scoping. The SAML app install is the only requirement.
How it works: When IdP scoping is enabled, Vanta treats the Vanta SAML app in Okta as the source of truth for scope. Only users assigned to that SAML app in Okta will sync into Vanta.
 
Setup:
- 
In Okta, open the Vanta SAML app and go to the Assignments tab.
- 
Assign the Vanta app to the users or groups you want in Vanta's scope.
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380890635/08d01dd7d9612c1fb3d0cb0e8a97/de9bcffe-9cbc-4dc1-9ecb-a6e84de26a37?expires=1794967200&signature=8e62e861ed29dd1c62f342d79e121c4aaee8e34c9fcbd32c970ae6985c7ab942&req=diMvFsF3nYdcXPMW1HO4zfH4t2jQ7wZRNtqkZVWduKdE%2BC3CxPCbPGhHvbxt%0AtKrwDqHwZfWrDTZJC0o%3D%0A>
- 
In Vanta, go to Integrations > Okta > Configure scope and enable Control scope with Okta.
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380890958/28191097d34bec789581eee5f5e4/b3f8922e-eb5e-47ec-a0f7-2c0c99b8c3e5?expires=1794967200&signature=f5ba5192b797595c5389e6b40784a2054e2ea2a2a327a787f0e3b34cc98999d0&req=diMvFsF3nYhaUfMW1HO4zcB2iIW8PgSlQ4EQD17QaPicy%2F7dnODnn7JghWV2%0ASkWj816PtLpFKm3bqR0%3D%0A>
⚠️ Note: Scoping interacts with offboarding. If your offboarding process removes users from the Vanta group in Okta, those users will disappear from Vanta — including terminated employees you may still need for audit evidence. To preserve audit visibility, either keep terminated users assigned to the Vanta group in Okta (while deactivating them), or disable scoping and manage scope directly in Vanta.
For full details, see Controlling Scope Through Okta <https://help.vanta.com/en/articles/11345660-controlling-scope-through-okta>.
 
 

### Enable SSO (log in to Vanta via Okta)
 
⚠️ Note: Before setting up SSO, you must enable Auto-provision Employee portal accounts in Vanta. Go to Settings > Login and Security > User Provisioning and turn this on. Then, set Okta as a personnel source using one of the two options below. If this step is skipped, you will see the error: "This Okta integration is setup but login is disabled."
To set Okta as a personnel source: 
Option 1 (Recommended): 
- 
Go to Integrations
- 
Find Okta and click Manage
- 
Select Edit personnel monitoring
- 
Check the box to enable the integration as a personnel source
- 
Click Save
Option 2: 
- 
Go to Settings > Personnel > Setup
- 
Under Personnel source, click Add another source
- 
Select Okta
The API integration does not enable login to Vanta through Okta. To allow users to log in via Okta, install the Vanta SAML app separately:
- 
In Okta, go to Applications > Browse App Catalog, find Vanta, and click Add Integration.
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380894560/fcea76058c0a15de16089dd149bd/f71ed7b1-36f1-4b3e-9f62-cd7d683e0a0f?expires=1794967200&signature=74d070717aee6080c944df72c7249b843981566a9b236878352dcc2fbef18292&req=diMvFsF3mYRZWfMW1HO4zeBYRmL4oQ8WijsktZyLYKh83Wh9kWZtwWADlBMH%0AT3cX7WaP0ljpv%2Bpn29g%3D%0A>
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380894914/904f00b09519bbbb44127c3d81df/9ba6dbde-29c3-4643-ad55-3c8b7777ff2f?expires=1794967200&signature=29a6610d160f750673f239dbc3460d0d21c05fe6b6dd43c531d76a73a0b04fe6&req=diMvFsF3mYheXfMW1HO4zdZS66YSHe4UDjTNM44j%2FxHPsgjHCxMjZGxBJhma%0AZQCAMHUSHnIgm8jNM1w%3D%0A>
- 
In Vanta, copy your Domain ID from the Okta integration page.
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380895289/bb2236f217199f7a0dd7e9f57d2f/6d6fcbf1-aa9d-4bb8-957b-1721ad42592e?expires=1794967200&signature=76c55cc041636be90d4750d3417a2f638383ad5e1ecd2c490460f4b5873d4999&req=diMvFsF3mINXUPMW1HO4zZs3uEQuxXeMVDLbmJIu3VIP94ocl6t4K66dllfN%0AsYSJqz7TWqLweHLxTyo%3D%0A>
- 
In Okta, open the Vanta app, go to Sign On > Edit, paste the Domain ID into Advanced Sign-on Settings, and click Save.
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380895833/3efdf8e077eebb5b5d4d4694436b/f32bb599-3e51-4daa-b9fc-1336cae184cf?expires=1794967200&signature=30f2f02d619c0675685b4e7adb9a748925b6a8e62d1c81c27e2a2bd349704ed3&req=diMvFsF3mIlcWvMW1HO4zTjIqzfAw%2BwglU%2Bo8zuADo2pVuGZruFyB7au6Iil%0AVgpn59BncAa%2Bn3nSfDw%3D%0A>
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380896205/401470a83938a67589d4d8ead080/2cb3492e-c203-42fa-9694-aac05537ec7c?expires=1794967200&signature=c7314e891b8fdb18215f4c83a50630cfff5280b0964e384e2f675ab756f64738&req=diMvFsF3m4NfXPMW1HO4zZG%2Ff76NTVpnIXZxv5UDCQojT0LBeKLrDmu8huQQ%0ALVGjbqxg45QNfzR9WC0%3D%0A>
- 
Go to Assignments and assign the Vanta app to the users or groups who should be able to log in.
- 
Return to Vanta and click Connect app to finish linking.
 
 

### Migrating Okta SSO from Vanta Commercial to Vanta Gov
 
⚠️ Note: This applies only if your organization is migrating from Vanta Commercial to Vanta Gov. It affects the Vanta SAML app (used for SSO login) only, not the Okta API integration or SCIM.
If you use Okta for SSO and your organization is migrating to Vanta Gov, you need to update the Region field on the Vanta app in Okta so SSO authentication redirects to your new Vanta Gov environment (app.vanta-gov.com) instead of Vanta Commercial (app.vanta.com).
 
Before you begin:
- 
Confirm with your Customer Success Manager or [email protected] that your organization's Vanta Gov environment is provisioned and ready.
- 
You have sufficient Okta admin access to edit the app's Sign On settings.
- 
The Vanta SAML app is already installed for SSO (see Enable SSO above if not).
To update the Region field:
- 
Log in to Okta as an admin.
- 
Go to Applications > Applications and open the Vanta app (the SAML app used for SSO login).
- 
Go to the Sign On tab and click Edit.
- 
Under Advanced Sign-on Settings, find the Region field and change its value to Gov.
- 
Click Save.
Verify: have a test user log in to Vanta through Okta. A successful login should redirect to app.vanta-gov.com rather than app.vanta.com.
 
Troubleshooting
SSO still redirects to Vanta Commercial after saving
- 
Likely cause: the change didn't save, or a browser session is cached. 
- 
Fix: reopen the Vanta app's Sign On settings in Okta and confirm Region is still set to Gov. Have the user clear their session or try an incognito window, then retry.
SSO login fails entirely after the update
- 
Likely cause: your organization's Vanta Gov environment isn't fully provisioned yet. 
- 
Fix: contact your CSM or [email protected] to confirm migration status before making further changes. Affected users can log in with email and password in the meantime, if available.
 

### How Vanta validates Okta SSO logins
 
Understanding this can save time when troubleshooting a login failure:
- 
Vanta matches users by email address only, read from the NameID field of the SAML assertion Okta sends. No other Okta attributes (name, groups, roles) are used during SSO login itself, only for the API and SCIM integrations covered elsewhere in this guide.
- 
Email matching is case-insensitive. If Okta sends [email protected] and Vanta has [email protected] on file, the login will succeed.
- 
The SP Entity ID (Audience) and ACS URL for the Okta catalog integration are fixed values, not per-connection. If you're comparing what's configured in your Okta app against what Vanta expects, the Audience URI is https://www.vanta.com/sso/saml <https://www.vanta.com/sso/saml> and the ACS URL follows the pattern https://app.vanta.com/auth/login/okta/callback?domainId={your <https://app.vanta.com/auth/login/okta/callback?domainId=%7Byour> Domain ID}.
- 
There is no grace period on certificate validation. If Okta's signing certificate is rotated and Vanta's stored copy isn't updated to match, SSO login fails immediately for all users on the next attempt.
 
 

### What happens when a user's email changes in Okta
 
If a user's email changes in Okta and Vanta continues to recognize it as the same person, their existing profile is updated in place: policy acceptances, completed training, and other compliance history stay with that profile. If the change instead results in a new or separate profile, for example after a rehire, a role change, or an Okta tenant migration, see Having Multiple "Users" in Vanta for the Same Person <https://help.vanta.com/en/articles/11345591-having-multiple-users-in-vanta-for-the-same-person> to understand whether that's expected or something to resolve.
 

### Enable SCIM (provision users and groups from Okta)
 
The API integration does not provision users from Okta into Vanta. To automatically provision users, groups, and roles, set up the separate SCIM integration. SCIM requires a dedicated SCIM 2.0 app in Okta (the Vanta SSO app can be used, but does not support Push Groups).
 
For full SCIM setup including custom role attributes, group priority, and Push Groups, see Connecting Vanta & Okta (SCIM) <https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim>.
 
 

### Import Okta groups into Vanta (without SCIM) 
 
If you don't want to run SCIM but want Okta groups to power task assignments in Vanta, use the Dynamic IdP Groups feature to import groups on demand. See Dynamic IdP Groups for Okta <https://help.vanta.com/en/articles/11345666-dynamic-idp-groups-for-okta>.
ℹ️ Note on Group limits: Dynamic IdP Groups supports up to 10,000 groups per org (Okta rate limit). Groups with more than 8,000 members will not appear as selectable in the UI.
 
 
 
 

### Multiple Vanta Workspaces
 
If your organization uses Vanta Workspaces, each Workspace requires its own Okta API app. You cannot reuse the same app across Workspaces, since each Workspace generates a unique dynamic public-key URL and an Okta API app supports only one at a time. Repeat the full setup (including Steps 1–5) to create a separate Okta app for each Workspace.
 
If you want to scope users differently per Workspace, you can create multiple Vanta apps in Okta (label must contain Vanta) and assign different users or groups to each. Vanta will prompt you to pick which app to connect during setup.
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380901483/93665fef7937fc3205ede575b6cb/ad2b8b76-71b4-41a6-a39c-80bfdfc95506?expires=1794967200&signature=26673cb244b2574ea879920e6afc652d4e4d1ba5b904b9956a80e3364f1ad216&req=diMvFsB%2BnIVXWvMW1HO4zbiRDi3rckGLIsPExVIkPogiVvGGRg7jzjascvcH%0Ar5OH4R84uUzerOcyUQk%3D%0A>
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2380901584/be401633efb6f4dbbe958ef0f6d9/a411b42c-4681-41be-a77a-e0d0c2214f8c?expires=1794967200&signature=3426f41a290b027895a88755ab9475ae1f0479ef01a5479a885e12ac4119ab5c&req=diMvFsB%2BnIRXXfMW1HO4zeVK2f0KkpoqznWyqKNPvhBvr7D5kMumu%2F9DEoFY%0AAyhY%2BC8Qe%2F%2Bn%2BPbdFJQ%3D%0A>
 
 
 

## Verification and validation
After setup, confirm the following to verify the integration is connected and data is syncing.
- 
Integration is active — Go to Integrations and confirm Okta shows Connected with a recent sync timestamp.
- 
Users are syncing — Go to People. Okta users should appear and be linked to personnel records.
- 
Compliance tests are populating — Go to Tests. The MFA, deprovisioning, and account linking tests should show data.
- 
Roles are visible on users — Open a user's profile. Okta admin roles should appear. If they don't, check that the Super Administrator role is assigned to the API app in Okta.
- 
Applications are appearing — Go to Vendors or Inventory. Okta-managed apps should appear.
- 
Password policies are appearing — Go to Inventory > Password Policies. Okta password policies should appear.
 
 

## Use cases and capabilities
The Okta integration powers five functional areas in Vanta: personnel management, automated compliance testing, access reviews, access requests, and password policy evidence.
 

### Quick reference
 | 
Resource / Capability | 
Supported | 
How it's used in Vanta
 | 
Users | 
Yes | 
Personnel, access reviews, access requests, automated tests, evidence collection
 | 
Groups | 
Yes  | 
Access reviews, access requests
 | 
Admin roles  | 
Yes (requires Super Administrator role assigned to the Okta app) | 
Surfaces privileged access on the Access page; powers access reviews and access requests
 | 
Applications | 
Yes | 
Access reviews, access requests
 | 
MFA enrollment | 
Yes | 
Automated tests, evidence collection
 | 
Account status / deactivation | 
Yes | 
Automated Tests, offboarding and deprovisioning tracking
 | 
Password policies | 
Yes | 
Audit evidence via vendor configuration
 | 
User provisioning (Okta → Vanta) | 
Via SCIM only | 
Separate setup
 | 
SSO login to Vanta | 
Via Vanta SAML app only | 
Separate setup

### Personnel management and lifecycle 
 
Vanta uses Okta as a live source of identity data, syncing user profiles, account status, group memberships, admin role assignments, MFA enrollment, and application access on a regular basis.
 
What this powers in Vanta:
- 
People section: Okta accounts are matched to Vanta user records by email address and appear on the People page with account status, role assignments, and MFA enrollment visible.
- 
Access reviews: Synced users, groups, and roles surface in Vanta's access review workflows so reviewers can confirm whether access is still appropriate.
- 
Automated tests: User data powers the core Okta compliance tests (detailed below).
What you get:
A continuously updated view of who has access, what level of access they have, and whether their account status is current, without any manual exports or spreadsheet maintenance.
⚠️ Note: Vanta's source of truth for employment status is your HRIS, not Okta. If a user is active in Okta but marked as terminated in your HRIS, Vanta will show them as terminated. This is by design. If a user appears terminated in Vanta when you expect them to be active, check their status in your HR system first.
⚠️ Note: Do not deactivate users directly in Vanta if Okta SCIM is connected. SCIM will re-sync them as active on the next cycle. Deactivate in Okta (and in your HRIS if connected); Vanta will pick up the change on the next sync.
 
 
 

### Automated compliance tests
 
Okta data powers several automated compliance tests in Vanta (depending on your framework and configuration). Each test runs on a continuous basis and updates as Vanta syncs new data from your org. The following section captures a couple of the key tests: 

### Test 1 - MFA on Okta
Vanta checks whether every in-scope Okta user account has at least one active MFA factor.
 
What this powers in Vanta: 
- 
MFA on Okta test: Passes when all in-scope Okta users have at least one MFA factor in ACTIVE status. Fails when one or more non-suspended users who have logged in have no active MFA factor.
Note: Newly created Okta accounts are given a grace period (Account Setup SLA) before being evaluated. The grace period is configurable in Vanta.
 
Scope notes:
- 
Users who have never logged in to Okta are not evaluated and will pass the test.
- 
Suspended Okta accounts always pass this test (they appear in results but cannot fail).
- 
Deactivated Okta accounts are not included in the test data.
- 
Non-human/service accounts are excluded.
- 
MFA enrollment alone is not sufficient — the factor must be in ACTIVE status in Okta. Factors in a pending state will not satisfy the test.

### Test 2 - Okta accounts are associated with active users in Vanta
Vanta checks whether each active Okta account can be matched to a known, active user in Vanta.
 
What this powers in Vanta:
- 
Okta accounts are associated with active users test -- Passes when every active Okta account is linked to an active Vanta user record. Fails when an active Okta account cannot be matched to any user, or is matched to a user who is marked as terminated.
What you get:
Evidence that all accounts in your Okta org are owned by known, active employees, a core requirement for demonstrating least-privilege access and proper access controls.
 
Scope notes:
- 
Matching is done by email address. If an Okta account's email does not match any Vanta user record, it will appear as an unlinked account and may fail this test.
- 
Service accounts and shared accounts that are not associated with a specific person can be marked as Not a Person in Vanta to exclude them from this test.
- 
Contractor and vendor accounts should either be linked to a Vanta user record or marked appropriately. Leaving them unlinked will cause test failures.
 
 

### Access reviews
 
Okta data surfaces in Vanta's access review workflows, giving reviewers the context they need to confirm whether access is still appropriate for each user.
 
What this powers in Vanta:
- 
Users: All active Okta users appear in access reviews with their account status, role assignments, group memberships, and application access visible to reviewers.
- 
Groups: Okta groups appear in access reviews when synced via Dynamic IdP Groups or SCIM push. Without one of these configured, group data will not be available for review. See Import Okta groups and Enable SCIM for setup details.
- 
Roles / Entitlements: Admin role assignments from Okta are surfaced so reviewers can flag accounts with elevated privileges that may no longer be appropriate.
- 
Applications: Application assignments from Okta are visible, allowing reviewers to confirm each user's app access is still needed.
What you get:
A structured, auditable record of who reviewed access, what they confirmed, and when, built directly from live Okta data rather than manually assembled spreadsheets.
 
Scope notes:
- 
Vanta links Okta accounts to Vanta user records by email address for display in access reviews. Accounts that cannot be matched to a user record will appear as unlinked and may require manual resolution before the review can be completed.
- 
Access reviews reflect data from the most recent sync. If a change was made in Okta within the last hour, it may not yet be reflected in the review.
- 
Reviewers do not need Okta access to complete a review in Vanta.
 
 

### Access requests
 
Okta entitlements (groups, roles, and applications) can be surfaced in Vanta's access request workflows, allowing employees to request access and approvers to review with full context.
 
What this powers in Vanta:
- 
Entitlement catalog: Okta groups, roles, and applications synced to Vanta appear as requestable entitlements. Requesters choose from the available entitlements, and approvers see what level of access is being requested before deciding.
- 
Provisioning tracking: Once a request is approved, Vanta tracks whether the access was provisioned in Okta. Without SCIM, provisioning must be completed manually by an Okta admin. With SCIM connected, provisioning can be automated.
What you get:
A documented, auditable trail of who requested access, who approved it, and when it was provisioned, without requiring any changes to how your team manages access in Okta.
 
Scope notes:
- 
Entitlements only appear in the access request catalog if they have been synced to Vanta. Groups require Dynamic IdP Groups or SCIM push to sync. Roles and applications sync automatically with the API integration.
- 
Without SCIM, access provisioning after approval must be completed manually in Okta. Vanta will track the request status but will not provision access on its own.
- 
Access requests require the Vanta Access Requests feature to be enabled for your workspace.
 
 

### Password policy evidence
 
Vanta reads your Okta password policies and surfaces them in the Vanta inventory, providing auditors with documented evidence that password requirements are defined and enforced.
 
What this powers in Vanta:
- 
Inventory / Password Policies: Okta password policies appear under Inventory in Vanta, including policy name, minimum length, complexity requirements, and lockout settings.
- 
Compliance evidence: The synced policies serve as evidence for controls that require documented password standards, including those in SOC 2, ISO 27001, and HIPAA.
What you get:
- 
Automated password policy evidence pulled directly from Okta, without screenshots, manual uploads, or policy documents that go stale between audits.
Scope notes:
- 
Vanta reads the password policies assigned to your default Okta groups. If you have multiple policies assigned to different user populations, all policies synced by the API will appear in Vanta.
- 
For more details on how Vanta tracks and displays password settings, see Tracking Password Settings for Okta in Vanta. <https://help.vanta.com/en/articles/11345642-tracking-password-settings-for-okta-in-vanta>
 
 

### Offboarding and deprovisioning
 
When an employee leaves your organization, Vanta uses Okta data to verify that their access was removed promptly and completely. This is one of the most commonly audited controls and one of the highest-value use cases for the Okta integration.
 
What this powers in Vanta:
- 
Deprovisioning test: The Okta accounts are deprovisioned when personnel leave test continuously checks whether terminated users still have active Okta accounts.
- 
Offboarding workflows: When a user is marked as terminated in Vanta (via HRIS sync or manual update), Vanta evaluates their Okta account status and flags any accounts that have not been deactivated.
- 
Audit evidence: The timestamp of when a user was terminated and when their Okta account was deactivated is captured and available as evidence.
What you get:
A verifiable, timestamped record that access was removed when it should have been, with no manual evidence collection required.
 
Scope notes:
- 
Without SCIM, deprovisioning in Okta must be completed manually by an Okta admin. Vanta tracks the status but does not trigger deactivation. See Enable SCIM for automated deprovisioning.
- 
If a terminated user's Okta account needs to remain temporarily active (for example, to preserve an inbox or complete an offboarding task), document the exception in Vanta. See Offboarding a User in Vanta While Keeping an Inbox Active <https://help.vanta.com/en/articles/11345606-offboarding-a-user-in-vanta-while-keeping-an-inbox-active> for guidance.
- 
Vanta treats Okta account statuses of Deprovisioned (which Okta shows after deletion), Suspended, and Deactivated as successfully offboarded.
- 
If your organization uses SCIM, deprovisioning can be triggered automatically from Vanta when a user is terminated, removing the manual step. See Enable SCIM for setup details.
 
 
 
 

## Limitations and edge cases
 | 
Limitation | 
Detail | 
Workaround
 | 
Vanta cannot write to Okta | 
The integration is read-only. Vanta cannot deprovision users, assign roles, or push groups to Okta. | 
For provisioning, use Okta SCIM. For offboarding, deactivate users in Okta (and HRIS), not in Vanta.
 | 
HRIS overrides Okta for employment status | 
A user active in Okta but terminated in the HRIS will appear terminated in Vanta. | 
This is by design — use your HRIS as the source of truth.
 | 
Groups don't auto-sync from the API integration | 
Vanta reads group data from Okta, but groups must be explicitly added in Vanta before they’re used for access reviews.  | 
Use Dynamic IdP Groups, or set up SCIM with Push Groups.
 | 
Dynamic IdP Groups caps at 10,000 groups | 
N/A  | 
If you have more than 10,000 groups, only the first 10,000 are selectable.
 | 
Groups with more than 8,000 members will have their member list truncated to 8,000 users | 
This is a performance limit that may affect completeness of group-based access reviews.  | 
Split large groups, or use SCIM.
 | 
MFA detection is based on Okta factor enrollment | 
If users authenticate to Okta via a federated IdP, Vanta cannot see MFA enforced at that layer. | 
Enforce MFA directly in Okta, or note the limitation in audit context.
 | 
Okta admin URLs are rejected | 
Vanta validates and rejects admin URLs like company-admin.okta.com. | 
Use your standard Okta domain (company.okta.com).
 | 
One Okta app per org for API integration | 
Each Vanta Workspace requires its own Okta API app, because each Workspace has a unique dynamic public-key URL and an Okta API app can only have one such URL configured at a time. Connecting a second Workspace to the same app overwrites the first Workspace's URL and breaks that connection. | 
Create a separate Okta API app for each Vanta Workspace you want to connect. (Multiple Okta apps can still connect into a single Vanta Workspace.)
 
 

## Permissions
This section covers what access is required to connect Okta to Vanta. 
 

### Vanta access requirements
 | 
Permission | 
Required for
 | 
Vanta admin | 
Connecting, reconnecting, and managing the Okta integration

### Okta: connecting user requirements
 | 
Requirement | 
Required or optional | 
What happens without it
 | 
Super Administrator role in Okta | 
Required | 
The API Services app cannot be created with the required scopes, or the Super Administrator role cannot be assigned to the app (which blocks role sync).

### Okta: OAuth scopes
 | 
Scope | 
Required or optional | 
What happens without it
 | 
okta.users.read | 
Required | 
User data cannot be read. The integration will not sync.
 | 
okta.groups.read | 
Required | 
Group data cannot be read. Group-based workflows will not work.
 | 
okta.roles.read | 
Required | 
Admin role data cannot be read. Roles will not appear on user records.
 | 
okta.apps.read | 
Required | 
Application data cannot be read. Apps will not appear as vendors.
 | 
okta.appGrants.read | 
Required | 
Scope validation fails.
 | 
okta.policies.read | 
Required | 
Password policies will not sync.

### Additional scopes for FedRAMP Moderate
These additional scopes are required for FedRAMP Moderate environments when enabled by Vanta. Your Vanta account team will confirm if these apply to your workspace.
 | 
Scope | 
Required or optional
 | 
okta.authenticators.read | 
Required for FedRAMP Moderate
 | 
okta.threatInsights.read | 
Required for FedRAMP Moderate

### Admin role on the API app
 | 
Permission | 
Required or optional | 
What happens without it
 | 
Super Administrator role assigned to the API Services app | 
Required | 
Role data cannot be read; a warning is returned and role-based access reviews/requests will be incomplete.
 

### Write access
Vanta does not write to Okta. All API calls are read-only. No user or configuration changes are made.
 
 

## 
 

## Troubleshooting and FAQs
Common questions and issues you may encounter when setting up or using Vanta’s Okta integration, along with recommended solutions. 
ℹ️ Note: Before contacting Support, collect the connecting admin's Okta account email, your Okta domain, and a screenshot of any error shown in Vanta or during validation.

### Connection and setup

### Q: Validation fails with a scope mismatch error
- 
Cause: The granted scopes in Okta do not exactly match what Vanta expects. Both missing scopes and unexpected extra scopes are reported. 
- 
Fix: In Okta, open the API Services app's Okta API Scopes tab. Confirm that exactly the six required scopes are granted (plus the two FedRAMP scopes if applicable) and no others. Remove any extras. Retry Validate in Vanta.

### Q: Validation fails with a role-related error or warning
- 
Cause: The Super Administrator role was not assigned to the API Services app. Without it, Vanta cannot read role data. 
- 
Fix: In Okta, open the API app and assign the Super Administrator role. Retry Validate.

### Q: Validation fails with a DPoP or token error
- 
Cause: DPoP is enabled on the API app. Vanta does not produce DPoP headers. 
- 
Fix: In Okta, open the API app > General > Client Credentials > Edit and uncheck Require Demonstrating Proof of Possession (DPoP) header in token requests. Reload the page after saving and confirm the box is still unchecked — a known Okta bug can silently re-enable it. Retry Validate.

### Q: Validation fails and my domain is being rejected
- 
Cause: You entered an Okta admin URL (e.g., company-admin.okta.com). Vanta rejects admin URLs. 
- 
Fix: In Vanta, replace the domain with your standard Okta domain (e.g., company.okta.com) and retry.

### Q: Users see "Vanta was not able to login via Okta"
- 
Cause: Vanta could not validate the SAML response from Okta. The most common causes are an Okta signing certificate that was rotated without updating Vanta, or an incomplete SAML app configuration.
- 
Fix: In Vanta, go to Integrations > Okta > Manage > Edit and re-add the SSO integration. Confirm the Domain ID is pasted into the Vanta SAML app's Advanced Sign-on Settings in Okta. If your Okta admin recently rotated the app's signing certificate, this is the most likely cause. Reconnect the integration in Vanta to pick up the new certificate. Affected users can log in with their email and password in the meantime.

### Q: A user authenticates successfully in Okta but Vanta shows "Account not found" 
- 
Cause: Vanta could not match the email Okta sent to an active Vanta user record. This most often happens after a user's email address changed in one system but not the other.
- 
Fix: Confirm the user's email is identical in both Okta and Vanta (case differences are fine, but the email itself must match exactly). If the user's email recently changed, update it in Vanta and confirm the change synced. If the emails already match and the error persists, contact Vanta Support.

### Q: Do I need to map any custom attributes for Okta SSO to work? 
No. SSO login only reads the user's email address from the SAML assertion. Attribute mapping is only relevant for the separate SCIM integration, which handles provisioning, not login. See Okta SCIM Attribute Instructions <https://help.vanta.com/en/articles/11345645-okta-scim-attribute-instructions> if you're configuring SCIM. 
 

### Q: Sync is slow or intermittently fails for our large Okta organization 
- 
Cause: Very large Okta organizations can occasionally trigger Okta's own API rate limits during a sync. Vanta includes retry and throttling behavior to reduce how often this happens, but if Okta rate-limits a request, some data may take longer to refresh, and in some cases a fetch may fail and retry on the next scheduled sync rather than completing immediately.
- 
Fix: This typically resolves on its own on a later sync cycle. If your organization consistently experiences slow or failing syncs, contact Vanta Support.
 

### Users and data

### Q: Can Vanta match a user by their secondary or alternate Okta email? 
Vanta matches Okta users by a single email value from the Okta profile, using the primary email by default. There is no automatic fallback to a secondary or alternate email if the primary doesn't match a Vanta user record. In some cases, your integration can be configured to use the Okta username/login value instead of the primary email, if that's the value your organization expects Vanta to treat as the user's email. Contact Vanta Support to discuss whether this applies to your setup.

### Q: Users are missing from Vanta after the initial sync
- 
Step 1: Check whether Control scope with Okta is enabled at Integrations > Okta > Configure scope. 
- 
Step 2: If scoping is enabled, confirm the missing users are assigned to the Vanta SAML app in Okta (Assignments tab). 
- 
Step 3: Confirm the users are active and not deactivated in Okta. 
- 
Step 4: Wait for the next sync and re-check.

### Q: A user appears terminated in Vanta but is active in Okta
- 
Cause: Vanta uses your HRIS, not Okta, as the source of truth for employment status.
- 
Fix: Check the user's status in your HR system. Update there first — the change will propagate to Vanta on the next sync.

### Q: I lost admin access after enabling SCIM
- 
Cause: SCIM reassigned your role based on Okta group mappings, and the group containing your admin role is at a lower priority than a lower-privilege group. 
- 
Fix: In your SCIM app in Okta, go to Assignments > Groups and drag the group with the highest-privilege role (Admin) to priority 1, followed by lower-privilege groups. Confirm admin roles are explicitly mapped via your SCIM custom attribute. See Connecting Vanta & Okta (SCIM) <https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim> for the full group-priority workflow.

### Q: I see the same person twice in Vanta with different emails
- 
Cause: Duplicate personnel records from multiple IdPs or email aliases. 
- 
Fix: If you run more than one identity provider, see Integrating Multiple Identity Providers <https://help.vanta.com/en/articles/11345659-integrating-multiple-identity-providers> to set IdP precedence and control which IdP populates the People page, which resolves most duplicate-creation cases going forward. For duplicates that already exist, Vanta Support can merge them. Email Support with the duplicate user emails. 
- 
This can also happen after a rehire, a contractor-to-employee transition, or a migration to a new Okta tenant. In these cases, having separate profiles is often expected and correct for audit purposes, not a problem to fix. See Having Multiple "Users" in Vanta for the Same Person <https://help.vanta.com/en/articles/11345591-having-multiple-users-in-vanta-for-the-same-person> to understand when separate profiles are appropriate, and how to request a merge from Vanta Support in the cases where one is actually needed.
ℹ️ Note on duplicate users across IdPs: If you have Okta plus another identity provider, or users with aliases across systems, Vanta may create duplicate personnel records. See Integrating Multiple Identity Providers <https://help.vanta.com/en/articles/11345659-integrating-multiple-identity-providers> to configure precedence and prevent this going forward. Merging existing duplicates requires Vanta Support — contact [email protected].

### Q: Groups are not appearing in Vanta
- 
Cause: Groups do not automatically populate from the API integration. Either Dynamic IdP Groups has not been used, or SCIM is not set up with Push Groups. 
- 
Fix: To import groups without SCIM: People > Groups > Add Group > Add from identity providers.
- 
To push groups automatically: Set up Okta SCIM <https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim> and enable Push Groups in a dedicated SCIM 2.0 app (not the Vanta SSO app — it doesn't support Push Groups).

### Q: I added a user to Okta and they aren't showing up in Vanta yet
- 
Cause: Sync is not real-time. 
- 
Fix: Wait up to 1 hour. If the user still isn't showing after a full hour, check scoping and the user's Okta status.

### Q: I don't see roles when creating an access level in Vanta
- 
Cause: Either the okta.roles.read scope is missing, or the Super Administrator role is not assigned to the API app. 
- 
Fix: In Okta, confirm both. Retry validation in Vanta.

### Compliance tests

### Q: The MFA test is failing for users who have MFA enabled
- 
Step 1: Confirm the affected users have at least one active factor enrolled in Okta (not just a pending factor). 
- 
Step 2: If users authenticate to Okta through a federated IdP, Vanta cannot detect MFA enforced at that layer — only MFA factors in Okta are visible. 
- 
Step 3: Allow at least one full hourly sync after enrollment before re-checking.

### Q: Enabling Okta SSO didn't enforce MFA for Vanta login
- 
Cause: SSO handles authentication routing; MFA is a separate Okta authentication policy. 
- 
Fix: Configure MFA enforcement in Okta's Security > Authentication policies for the Vanta SAML app. SSO alone does not enforce MFA.

### Offboarding and lifecycle

### Q: I deactivated a user in Vanta but they came back as active
- 
Cause: Okta SCIM re-synced them from Okta. Vanta is not the source of truth for user state when SCIM is connected. 
- 
Fix: Deactivate the user in Okta (and in your HRIS if connected). Vanta will reflect the change on the next sync. Do not deactivate SCIM-provisioned users directly in Vanta.

### Q: How do I offboard a user while keeping their inbox active?
Okta and OneLogin both support suspending users without deactivating them, which lets Vanta mark them as ex-employees while preserving account data. See Offboarding a User in Vanta while Keeping an Inbox Active <https://help.vanta.com/en/articles/11345606-offboarding-a-user-in-vanta-while-keeping-an-inbox-active>.

## Images

- [image 01] ../../images/integrations/okta/okta-integration-guide--01.png
- [image 02] ../../images/integrations/okta/okta-integration-guide--02.png
- [image 03] ../../images/integrations/okta/okta-integration-guide--03.png
- [image 04] ../../images/integrations/okta/okta-integration-guide--04.png
- [image 05] ../../images/integrations/okta/okta-integration-guide--05.png
- [image 06] ../../images/ux/integrations/okta-integration-guide--06.png
- [image 07] ../../images/integrations/okta/okta-integration-guide--07.png
- [image 08] ../../images/integrations/okta/okta-integration-guide--08.png
- [image 09] ../../images/integrations/okta/okta-integration-guide--09.png
- [image 10] ../../images/ux/integrations/okta-integration-guide--10.png
- [image 11] ../../images/integrations/okta/okta-integration-guide--11.png
- [image 12] ../../images/ux/integrations/okta-integration-guide--12.png
- [image 13] ../../images/integrations/okta/okta-integration-guide--13.png
- [image 14] ../../images/integrations/okta/okta-integration-guide--14.png
- [image 15] ../../images/integrations/okta/okta-integration-guide--15.png
- [image 16] ../../images/integrations/okta/okta-integration-guide--16.png
- [image 17] ../../images/integrations/okta/okta-integration-guide--17.png
- [image 18] ../../images/integrations/okta/okta-integration-guide--18.png
- [image 19] ../../images/integrations/okta/okta-integration-guide--19.png
