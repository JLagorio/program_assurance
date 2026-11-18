# Connecting Vanta & Calendly

Source: https://help.vanta.com/en/articles/13548532-connecting-vanta-calendly
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 
Vanta integrates with Calendly to monitor and manage user access to your tools. By synchronizing access data, Vanta helps ensure that only active employees retain access and that access is promptly removed when personnel leave—supporting automated compliance workflows, streamlined access reviews, and structured access requests.
 
Estimated setup time: Less than 5 minutes
 
 

## How it works
Vanta connects to Calendly and synchronizes user and role data on a recurring basis. This data powers four key workflows within Vanta:
- 
Automated compliance tests - Vanta verifies that Calendly accounts are linked to active employees and are deprovisioned when personnel leave the organization.
- 
Access Reviews - Synced users are surfaced in Vanta’s Access Reviews. Approvers can validate whether access remains appropriate, confirm least-privilege alignment, and generate audit-ready evidence.
- 
Access Requests - Calendly entitlements are imported into Vanta. Requesters can submit access requests for specific access levels, approvers can review requests with appropriate context, and system administrators can track provisioning.
- 
Automated Deprovisioning - When an employee is offboarded in Vanta, their Calendly access can be revoked directly from Vanta. This requires the connected Calendly account to have an Admin or Owner role. For a full walkthrough of the offboarding workflow in Vanta, refer to Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>.
 

## Use cases
Connecting Calendly to Vanta enables you to:
- 
Monitor and manage personnel access to Calendly
- 
Ensure that only active employees retain access to company systems
- 
Simplify access reviews and support compliance requirements
- 
Automatically remove user access through Vanta (requires an Admin or Owner role in Calendly)
 

## Requirements
To connect the Calendly integration, you must have: 
- 
A Vanta administrator account
- 
A Calendly account with an Admin or Owner role in your organization (required for both connection and automated access deprovisioning)
 

## Connect the integration
- 
In Vanta, go to the Integrations page, click Add integration, and search for Calendly. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
​ 
- 
Click Connect.
​
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2108110794/03fea79795054dc88bb011b8332b/66cfe3ad-6919-44f4-be36-4f962305b3a9?expires=1794967200&signature=a5db0978ed743989d0f0589c453f2ef9745d77b9c5acd401de85c193bba4888f&req=diEnHsh%2FnYZWXfMW1HO4zXwrts%2FPjjn88FU2UdbQiD4M8951CtAi3ri0lIZH%0AbLe5%0A>
 
- 
Click Connect Calendly.
​
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2108112496/92e29ba6c462f9dbdb1606130028/d146c58c-51ee-42ae-a9f2-30bf23e5a03e?expires=1794967200&signature=66025516b610009feeaea2269128fe9cb65d5056fe7825fc217d34a76594b7dc&req=diEnHsh%2Fn4VWX%2FMW1HO4zc1uqwkibYDzialaps5g3urWBXq87tvRvxVvh3Cz%0AnZO%2B%0A>
 
- 
You will be redirected to Calendly's authorization page. Log in using your Calendly account with Admin or Owner permissions.
​
- 
Review the requested permissions and click Connect to Calendly to authorize Vanta.
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2108114121/03c27fde363f84f9e766fe2afad5/b9677d9f-e45e-4fe3-b7a2-2ced3af20ad3?expires=1794967200&signature=6e466092326468c535cf995bb18912d023456f5260713100d43e2093835aaae8&req=diEnHsh%2FmYBdWPMW1HO4zbi5%2BA6lFhj%2B%2FzlaQOrQulE%2F0tXUO%2BQxsjGB9lB1%0ActNv%0A>
 
- 
After authorization, you will be redirected back to Vanta.
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2108115169/3d874872bcb6dd194dcdf71cdd9e/784d137e-c921-4e88-aafc-5ac5e4b7930b?expires=1794967200&signature=31e3bbe6baf79037aca59aaba44f985a20bfd919d62fed8881e4bb7bf6aa9ec6&req=diEnHsh%2FmIBZUPMW1HO4zb5u4ZVSNkpfFVcHKAvE6bWiF9dlm0Bs%2BkP15gpC%0AP4zu%0A>
 
Employees will appear in Vanta within approximately 30 minutes.
 
Note: To enable automated access deprovisioning (removing users directly from Vanta), the account used to establish the connection must have an Admin or Owner role in your Calendly organization. This role is verified during the initial connection and on each token refresh.
 
 

## Capabilities
 | 
Resource | 
Supported | 
Usage
 | 
Users | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>
 | 
Groups | 
❌ | 
Not supported by Calendly API
 | 
Roles/Entitlements | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Last Login | 
❌ | 
Not provided by Calendly API
 | 
Access Deprovisioning | 
✅ | 
Remove users directly from Vanta (requires Admin/Owner role)
 

## Permissions
Vanta accesses the following data from the Calendly API:
 

### Read Access
Vanta can access: 
- 
User data
- 
Used to confirm that only active employees retain system access and that terminated employees are deprovisioned promptly. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows Vanta to display available users when tracking or assigning access.
- 
User role and entitlement data
- 
Used to ensure employees are assigned appropriate roles, validate least-privilege access, and confirm that high-privilege roles (such as Admin or Owner) are granted only to authorized personnel. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows requesters to select from the correct set of roles and enables approvers to review the specific level of access being requested.

### Write Access
When access deprovisioning is enabled, Vanta can: 
- 
Remove organization members from Calendly (this action is only available if the connected Calendly account has an Admin or Owner role)
 

## Related articles
- 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>
- 
Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
- 
Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>
- 
Calendly User Management Documentation <https://help.calendly.com/hc/en-us/articles/227569908-User-management>
 

## Troubleshooting FAQ
This section outlines common issues that may occur when connecting or managing the Calendly integration. 
 

### Missing users in Vanta
Issue: You do not see all organization users in Vanta 
- 
Vanta syncs users from the /organization_memberships endpoint. Ensure that all users are properly added to your Calendly organization. Data syncs approximately every 30 minutes. If a user was recently added, allow time for the next sync cycle.

### Reconnect the integration 
Issue: Your Calendly connection has expired or is no longer valid
- 
Reconnect the Calendly integration in Vanta and try again. Be sure to use an account with Admin or Owner permissions when reconnecting.

### Insufficient permissions
Issue: Your Calendly account does not have sufficient permissions to perform this action 
- 
This may occur if your admin access level or subscription plan has changed. 
- 
To resolve: 
- 
Confirm that your Calendly account still has an Admin or Owner role
- 
If the target user is the Organization Owner, they cannot be removed directly
- 
If the user is the Organization Owner, first transfer ownership to another user in Calendly (this will demote the current Owner to Admin). You can then remove the user through Vanta.

### Something went wrong 
Issue: We could not complete this action because required user information is missing or incorrect
- 
Verify that the user exists in Calendly and has valid account data. If the issue persists, contact Vanta Support.

### Calendly is temporarily unavailable
Issue: Calendly is currently unavailable
- 
This is a temporary issue on Calendly’s side. Wait a few minutes and try again.

### Deprovisioning Failed
Issue: Failed to remove a user from the Calendly organization
- 
To resolve: 
- 
Confirm that the connected account still has an Admin or Owner role
- 
Verify whether the user has already been removed from Calendly

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-calendly--01.png
- [image 02] ../../images/integrations/calendly/connecting-vanta-calendly--02.png
- [image 03] ../../images/integrations/calendly/connecting-vanta-calendly--03.png
- [image 04] ../../images/integrations/calendly/connecting-vanta-calendly--04.png
