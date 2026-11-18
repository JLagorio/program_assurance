# Salesforce Integration Permissions:

Source: https://help.vanta.com/en/articles/16862970-salesforce-integration-permissions
Collection: Trust Management ; Trust Management › Customer Trust ; Trust Management › Customer Trust › Trust Center Integrations
Fetched: 2026-11-17

## Article text

This article covers the permissions required for the Salesforce integration. For instructions on connecting the integration and configuring auto-approval, NDA bypass, and tag-based access, see Connecting Trust Centers & Salesforce <https://help.vanta.com/en/articles/11345449-connecting-trust-centers-salesforce>.
 

## Before you start
Your Salesforce edition must include API access. Enterprise, Unlimited, and Developer editions include it by default; Professional Edition requires the API access add-on; Essentials does not support API access. If your edition doesn't include API access, the integration can't connect regardless of how permissions are configured.
 
 

## Quick reference
 | 
Capability | 
Salesforce permissions required
 | 
Core features: viewer data enrichment, automated access approvals, NDA bypass, Customer Trust Accounts automation, tag-based access control | 
Read access on Accounts, Contacts, and Users (see field details below)
 | 
Revenue Tracking | 
Core permissions, plus read access on Opportunity fields
 | 
Lead Creation | 
Create permission on Leads, plus edit access on Lead fields
 | 
Salesforce Task creation | 
Access Activities and Edit Tasks system permissions, plus edit access on Task fields
Connecting the integration also requires the Approve Uninstalled Connected Apps permission on the account that approves the OAuth app.
 
 

## How the integration's access works
When you connect Salesforce, Vanta requests OAuth scopes that include the api scope. Per Salesforce's OAuth documentation, the api scope allows API access to the account of the logged-in user who authorizes the connection.
 
Because the api scope inherits the connecting user's access, the integration can read and write whatever that user can. To limit the integration's access, we recommend creating a separate service user in Salesforce with only the permissions described in this article, and connecting with that user. When creating the service user, make sure it can read the User object in addition to Accounts and Contacts. This is a commonly missed permission (see Core feature permissions below).
⚠️ Note: If you're currently logged into your own Salesforce account, you may need to log out before clicking Connect Salesforce in order to link with the service user.
 
 

## Core feature permissions
The following permissions enable the integration's core capabilities:
- 
Augmenting viewer data in Activity and Access Requests for contacts found in Salesforce
- 
Automated access approvals
- 
NDA bypass
- 
Customer Trust Accounts automation (account linking and CRM account sync)
- 
Tag-based access control
ℹ️ Note: These core permissions are required for the Salesforce integration whether or not you use Trust Center.
We recommend granting read access to all non-sensitive default fields on these objects so functionality doesn't break if the integration requests additional information in the future. The minimal required permissions are:
 | 
Object | 
Object permissions | 
Field permissions (read access)
 | 
Account | 
Read | 
Name, Type, OwnerId
 | 
Contact | 
Read | 
Email, AccountId, Name
 | 
User | 
Read | 
Name, Email
The User permissions are required because Vanta looks up the Account owner's name and email when matching viewers to your Salesforce records. If the service user can't read the User object, contact and account lookups can fail even when Account and Contact permissions are correctly configured.
 
If you've configured optional features, also grant read access to:
- 
The boolean Account field used in your account-level auto-approval condition
- 
Any Account fields mapped to tag categories for tag-based access control
- 
Any fields used in your Customer Trust Accounts sync configuration
A note on mapped field types
 
Tag-based automation only supports string fields. If a mapped tag field is a different type, tags for that category won't populate. Tag values sync from Salesforce once per day.
 
 

## Revenue tracking
To use Revenue Tracking reporting features, the integration needs the core permissions above plus read access to Opportunity objects. We recommend granting read access to all non-sensitive default Opportunity fields. The minimal required field permissions are:
 
Opportunity 
 | 
Object | 
Object permissions | 
Field permissions (read access)
 | 
Opportunity | 
Read | 
Name, AccountId, CloseDate, IsWon, Amount*, StageName*, CurrencyIsoCode (if multi-currency is enabled)
You can specify custom fields for opportunity stage and revenue from the Trust Center settings page.
 
Lead Creation
 
Vanta Trust Center can create leads in Salesforce for viewers who aren't found in your Salesforce records. Vanta writes the viewer's email, first and last name, and company. To use this capability, grant:
 | 
Object | 
Object permissions | 
Field permissions (edit access)
 | 
Lead | 
Create | 
Email, Name, Company
 
 

## Salesforce task creation
Vanta Trust Center can push Trust Center activity to Salesforce as Tasks, related to the matching Contact and Account. To use this capability, grant:
 | 
Permission type | 
Required
 | 
System permissions | 
Access Activities, Edit Tasks
 | 
Task field permissions (edit access), via Profile > Field-Level Security > Task | 
Comments, Related To, Name
 
 

## Troubleshooting permission issues
If a feature isn't working, missing field-level permissions are the most common cause. Missing permissions typically won't produce an error message; the affected feature simply won't work as expected. Symptoms and their most likely cause:
- 
Viewers aren't matching to Salesforce records: missing read access on Contact fields, or on the User object (see Core feature permissions)
- 
Tags aren't populating: missing read access on the mapped Account field, or the mapped field isn't a string type
- 
Leads or Tasks aren't being created: missing Create permission or field edit access on the Lead or Task object
If the integration disconnects entirely and prompts you to reconnect, the OAuth token itself was invalidated (for example, the service user was deactivated or its password reset). Reconnect with a user that has the permissions in this article.

## Images

- none
