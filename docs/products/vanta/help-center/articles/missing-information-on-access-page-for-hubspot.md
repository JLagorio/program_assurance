# Missing information on Access Page for HubSpot

Source: https://help.vanta.com/en/articles/11345831-missing-information-on-access-page-for-hubspot
Collection: Audit Readiness ; Audit Readiness › Security Posture Best Practices
Fetched: 2026-11-17

## Article text

Administrators may notice that the Role, MFA, Created, and Deactivated columns have a '-' rather than the associated information. This is not a bug and is an expected behavior.

## MFA & Creation Date Attributes
Regarding the MFA and Creation date attribute, these are not shown due to them not being returned in the API. We execute these two API requests to fetch HubSpot users and their roles:
- 
GET /settings/v3/users to fetch users and their role IDs
- 
GET /settings/v3/users/roles to fetch role information
Both from here: https://developers.hubspot.com/docs/api/settings/user-provisioning <https://developers.hubspot.com/docs/api/settings/user-provisioning>

## Role Attribute
Regarding the roles attribute, our team is working to add support for this, which will display the roles accordingly in Vanta. If this is possible and the work is complete, this article will be updated to reflect this if it is implemented, but we do not have a timeline to provide as to when this would be complete.

## Deactivated Attribute
Regarding the Deactivation status, Vanta cannot detect HubSpot accounts that have been deactivated due to API limitations. This means if an account exists in HubSpot, Vanta will show the user as active no matter the status. This can cause delays in completing offboarding tasks for former employees. See this article below on steps to take to resolve this:
‎Trigger off-boarding for HubSpot Accounts <https://help.vanta.com/en/articles/11345990>

## Images

- none
