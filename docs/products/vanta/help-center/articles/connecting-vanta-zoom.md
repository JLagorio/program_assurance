# Connecting Vanta & Zoom

Source: https://help.vanta.com/en/articles/11345758-connecting-vanta-zoom
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
Vanta integrates with Zoom to sync user and role data so you can monitor access, run compliance tests, conduct access reviews, manage access requests, and deprovision users directly from Vanta (when enabled).
 
Estimated setup time: Less than 5 minutes
Feature availability: This article discusses Access Management features, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 

## Use Cases
Vanta connects to Zoom using OAuth and syncs user and role data on a recurring basis. This integration powers four workflows in Vanta: 
- 
Automated compliance tests - Vanta checks that Zoom accounts are linked to active employees and that access is deprovisioned when personnel leave. This reduces the manual effort of verifying offboarding and provides test results that can be used as compliance evidence.
- 
Access Reviews - Synced users and roles appear in Vanta's Access Reviews workflow. Reviewers can confirm whether access is still appropriate, validate least-privilege alignment, and generate audit-ready evidence — without leaving Vanta.
- 
Access Requests - Zoom entitlements are imported into Vanta, making them available when submitting and reviewing access requests. Requesters can select a specific access level, approvers can review the request with role context, and administrators can track provisioning activity.
- 
Automated Deprovisioning - When an employee is offboarded in Vanta, their Zoom account can be deactivated directly from Vanta without requiring manual action in Zoom. This requires the connected Zoom account to have an Admin or Owner role and for the deprovisioning permission to be granted during setup. For a full walkthrough of the offboarding workflow, see Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>.
 

## Capabilities
The Zoom integration supports the following resources and workflows within Vanta:
- 
Users — Used for Access Reviews, Access Requests, and Automated Tests
- 
Roles/Entitlements — Used for Access Reviews and Access Requests
- 
Access Deprovisioning — Allows deactivation of users directly from Vanta (requires Admin or Owner role)
 | 
Resource | 
Supported | 
Usage
 | 
Users | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>
 | 
Roles/Entitlements | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Access Deprovisioning | 
✅ | 
Deactivate users directly from Vanta (requires Admin/Owner role)
 

## Prerequisites
Before connecting the Zoom integration, confirm you have the following: 
- 
Vanta administrator account
- 
Zoom account with an Admin or Owner role in your organization (required for both connection and automated access deprovisioning)
 | 
Important: Zoom only supports one active Vanta connection per Zoom organization. Connecting the same Zoom account again will break the existing connection. To update an existing connection, use the edit (pencil) icon instead of creating a new one.
 

## Setup guide
- 
To connect, go to the Integrations page, click Add integration, and search for Zoom. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205738186/7af0a566c7a07287a65385771868/b312a99b-3f80-4e84-89a5-8d3ee0637d3f?expires=1794967200&signature=2473dd2f6910c2b2194c71b635c50d7ce81184f5d45e384c12cc48b5841c3aae&req=diInE859lYBXX%2FMW1HO4zYTKZ3rj8mlGJg8zv7jO%2B8L%2FgsUgbep39XCuNup7%0A6eeHQ1u9SZmqEHOooHE%3D%0A>
- 
Click Add Connections. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205739361/1c9db4531fbcf4e52386d78a8457/0ec0eeb2-ab80-483d-a5da-86f318031134?expires=1794967200&signature=f20773b7e3da7bd8fc468f0c852c06416cf4822a0df80663f604199e41f98974&req=diInE859lIJZWPMW1HO4zQse%2B7P6TO9JMh4lYRRx8R8lR86L%2BM5EbIXO5CqQ%0As2xxVxswXpwn%2FC9mBaw%3D%0A>
- 
Click Connect Zoom. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205740696/17ca19cc62cc9828184414fc16a1/48375351-47e2-4729-bbd7-8d79783b3cee?expires=1794967200&signature=c7891d0fa83f63892a72a8be189020df5aab9afeab5b8d299285a1e93f1ff949&req=diInE856nYdWX%2FMW1HO4zRWEVMs7OcYB2K64mPAIahO10VdzIs%2FWq4YxL32Z%0ABtPSZjZ%2BS0kyeXsHjYE%3D%0A>
- 
You will be redirected to Zoom's authorization page. Log in using your Zoom account with Admin or Owner permissions.
- 
Review the permissions Vanta is requesting: 
- 
View users - required
- 
View roles - required
- 
Update a user's activation status - optional, but required to enable automated deprovisioning
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205743985/b0288d90ca85d5c016971c57c6e3/3e27c4d1-6ece-4eb5-bbb4-c308a2627898?expires=1794967200&signature=6be121a9ff4d63ee8e6a82406c199c7e771705d081bbd9dc3a33eaa82c238516&req=diInE856nohXXPMW1HO4zesuFyFZHhSr5GlD3wiY%2FhCGstQT%2FPNvfiTTxcWI%0AfDKCRtAp3ugA3CwVkjM%3D%0A>
- 
Click Connect to Zoom to authorize Vanta. 
- 
After authorization, you will be directed back to Vanta. The connection is now active. 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205745824/924e56776f9d6e2618a10b8c6aac/54e2c6b5-e3c6-4c81-a78e-1e80be27934a?expires=1794967200&signature=d6f8d2f24bcb1f26a8276023d4fbfe76417049feb3d6b6c430995f2e4ef6ff1c&req=diInE856mIldXfMW1HO4zUmXRHp6uH5N7zmMpRYyMZzYqijY9FHa9%2BnvRz3A%0AB6RQe5mcgNAb6P9QsKM%3D%0A>
 
 

## Verification and Validation
After completing setup, employees will appear in Vanta within approximately 30 minutes. Navigate to the People section or the relevant Access Review in Vanta to confirm users are populating. 
 
Note: To enable automated access deprovisioning (deactivating users directly from Vanta), the account used to establish the connection must have an Admin or Owner role in your Zoom organization. This role is verified during the initial connection and on token refresh.
 
 

## Permissions

## Read Access
Vanta reads user account data and role assignments from Zoom to power compliance tests, access reviews, and access request workflows. This access is read-only (unless deprovisioning is enabled). 
- 
User data
- 
Used to confirm that only active employees retain system access and that terminated employees are deprovisioned promptly. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows Vanta to display available users when tracking or assigning access.
- 
User role and entitlement data
- 
Used to ensure employees are assigned appropriate roles, validate least-privilege access, and confirm that high-privilege roles (such as Admin or Owner) are granted only to authorized personnel. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows requesters to select from the correct set of roles and enables approvers to review the specific level of access being requested.

## Write Access
When access deprovisioning is enabled, Vanta can:
- 
Deactivate Zoom users if the following conditions are met: 
- 
The connected Zoom account has an Admin or Owner role 
- 
The permission to update user activation status was granted during the OAuth authorization flow
Note: Vanta does not modify roles, create users, or make any other changes to your Zoom organization.
 

## Reconnecting the integration to update scopes
- 
In Vanta, navigate to the Connected Integrations tab, search for Zoom and click Manage. 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205749807/6b3d80efa2b79bf53aa5261154df/135a1b9e-235e-44da-82ea-d94fe85793d5?expires=1794967200&signature=7c8b5f172d87515e226c9a29e98bdda5de3ba6ade3a9f7609a8fce88bdce1526&req=diInE856lIlfXvMW1HO4zVUUAoM6kUPtgP%2BAN12dHL2EhfhkjR3YMvn5pJlv%0Auagmt%2BYQ7kxBpmWLykQ%3D%0A>
- 
Click the edit (pencil) icon and complete the reconnection process. 
Note: Do not click delete. This will delete your credentials and associated data. 
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2205752595/33ceb7c0076d8fef0388bbe0d0aa/f6074d1c-0b89-48c7-90da-c7d43e087185?expires=1794967200&signature=cf82bf1507d203f6ada2864e6cd7b4c7ef6220b7039d72758cf494e151e15138&req=diInE857n4RWXPMW1HO4zSGbnkyOuKv8tFHJ%2BvPwVUIMZc4dVFZHgfpVhu6g%0Ab%2BE2FZqzoGjc%2FLWNJZQ%3D%0A>
 
 

## Troubleshooting 
This section outlines common issues that may occur when connecting or managing the Zoom integration.
 

## Missing users in Vanta
Issue: You do not see all organization users in Vanta
- 
Vanta syncs users from the /users endpoint.
- 
Ensure that all users are properly added to your Zoom organization.
- 
Data syncs approximately every 30 minutes. If a user was recently added, allow time for the next sync cycle.

## Reconnect the integration
Issue: Your Zoom connection has expired or is no longer valid
- 
Reconnect the Zoom integration in Vanta and try again. 
- 
Use an account with Admin or Owner permissions when reconnecting.

## Insufficient permissions
Issue: Your Zoom account does not have sufficient permissions.
- 
This may occur if your admin access level has changed.
- 
To resolve:
- 
Confirm that your Zoom account still has an Admin or Owner role.
- 
Confirm that the Vanta app connected to your Zoom organization has granted user:update:status:admin scope.

## Something went wrong
Issue: We could not complete this action because required user information is missing or incorrect.
- 
Verify that the user exists in Zoom and has valid account data. 
- 
If the issue persists, contact Vanta Support.

## Zoom is temporarily unavailable
Issue: Zoom is currently unavailable
- 
This is a temporary issue on Zoom’s side. Wait a few minutes and try again.

## Deprovisioning Failed
Issue: Failed to deactivate a user from the Zoom organization
- 
To resolve:
- 
Confirm that the connected account still has an Admin or Owner role.
- 
Confirm that the Vanta app connected to your Zoom organization has granted the user:update:status:admin scope. 
- 
Verify whether the user has already been deactivated from Zoom.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-zoom--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-zoom--02.png
- [image 03] ../../images/integrations/zoom/connecting-vanta-zoom--03.png
- [image 04] ../../images/integrations/zoom/connecting-vanta-zoom--04.png
- [image 05] ../../images/integrations/zoom/connecting-vanta-zoom--05.png
- [image 06] ../../images/ux/integrations/connecting-vanta-zoom--06.png
- [image 07] ../../images/ux/integrations/connecting-vanta-zoom--07.png
