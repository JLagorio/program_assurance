# Connecting Vanta & Duo

Source: https://help.vanta.com/en/articles/14136547-connecting-vanta-duo
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview 
Vanta integrates with Duo to sync user, administrator, group, and role data from your Duo environment on a recurring basis. This integration gives you centralized visibility into Duo so you can monitor who has access, verify that deprovisioning is completed when personnel leave, streamline access review and request workflows, and optionally deactivate eligible Duo accounts during employee offboarding, all from within Vanta. 
 
Estimated setup time: Less than 10 minutes.
 

## How it works
Vanta connects to Duo and syncs user, role, and group data on a recurring basis. This data powers the following workflows within Vanta:
- 
Automated compliance tests - Vanta verifies whether Duo accounts are linked to active employees and flags accounts belonging to terminated personnel that have not yet been deactivated so you can take action.
- 
Access Reviews - Synced users are surfaced in Vanta’s Access Reviews. Approvers can validate whether access remains appropriate, confirm least-privilege alignment, and generate audit-ready evidence.
- 
Access Requests - Duo entitlements (group and admin roles) are imported into Vanta. Requesters can submit access requests, approvers can review those requests with appropriate context, and system administrators can track provisioning activity.
- 
Automated deprovisioning - If enabled, Vanta can deactivate eligible Duo 2FA user and administrator accounts during employee offboarding.
 

## Prerequisites
To connect the Duo integration, you must have:
- 
A Vanta administrator account
- 
A Duo account with the Owner administrator role (only Owners can create Admin API applications in Duo)
- 
Access to the Duo Admin Panel
- 
A Duo plan that includes Admin API access
- 
A Duo Admin API application configured with the following permission grants:
- 
For read-only syncing:
- 
Grant administrators - Read
- 
Grant resource - Read
- 
To enable automated deprovisioning through Vanta, also grant:
- 
Grant administrators - Write
- 
Grant resource - Write
⚠️ Note: Customers who do not enable automated deprovisioning can continue using the read-only setup.
 
 

## Connect the integration

## Step 1: Locate the Duo integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Duo. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2517282804/bc4f7b9251e202d29b4373a06da7/image.png?expires=1794967200&signature=eb9e07de298fc57e214e2a568dda8b61bc097b5b652ab321c4464d79a286e794&req=diUmEct2n4lfXfMW1HO4zXHgdTvbQpIMot0SQUGv4hp8GxRt0izndJ39YPsX%0AZmDkcY2RcVXYUORFUZY%3D%0A>
 
 

## Step 2: Create an Admin API Application in Duo 
As indicated in the connection modal, you must create a new application in Duo to integrate with Vanta.
- 
Log into your Duo admin panel <https://duo.com/docs/administration>.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2183410988/265f2322ceef0f41e2a2970f467a/ae2d17dd-fa51-4742-89df-cda51a21a049?expires=1794967200&signature=9668ecd1a3ebed08eafab0db1ce55f8ef589fad30853c51f370b30c378447dbc&req=diEvFc1%2FnYhXUfMW1HO4zW1kcTlatpmz2qkmII%2Fl3M0mEsgJYMRj6WrBiD28%0AZfunWmncuRZ%2BOlRPkpY%3D%0A>
- 
Navigate to Applications > Applications to view all installed applications. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2183411933/7e4feb1f874a3f09fb452b0d4dd1/67839da9-f045-4adc-a70e-1ca2f1f04b08?expires=1794967200&signature=fee20a3bdffb0e5de2d1cf9195b6db2bc2872466a5d1673628933f0fe41347cc&req=diEvFc1%2FnIhcWvMW1HO4zRNA%2Beq7KnBwjWZNcOItx%2BPfN%2BuI%2F%2F%2FAgj26g%2BFf%0AOLvhbt0NdMQPZCj5R%2Fs%3D%0A>
- 
Click Add application. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2183415167/28773fc681bcb02beb9162984a1d/d49de87e-a1f1-4474-b4de-4591166628cc?expires=1794967200&signature=166bff12adcdf19866accc2666c14ba919a52062d7a3f895f68a19180930a8a8&req=diEvFc1%2FmIBZXvMW1HO4zWREXxfNGOT5GUTtjf8nwg0Iv9zcWtzO%2F%2BJ7L0eP%0AxGNwVCpoQaPcxXbecVs%3D%0A>
- 
In the application catalog, search for Admin API.
- 
Only Owner administrators can create this type of application.
- 
Click Add to create a new Admin API application.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2517284866/89eef4fb2240ccd835093220e5c4/8c585347-cbe5-4d2d-adf8-b3eec15b4207?expires=1794967200&signature=5e31a10de7a37d7e750841fba9834a5d66924e4f6996b9827a6172003c7f4c2c&req=diUmEct2mYlZX%2FMW1HO4zaLi6yjiFVRSJus%2BF4K86JWPlUOdT1YxUVsKW3Kd%0ArjdlwxPL6qFBRihxr18%3D%0A>
 

## Step 3: Configure application permissions
Once the Admin API application is created: 
- 
Locate the Details section. This contains the values required by Vanta. 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2183420115/2577b17a4d40e42f718fefee895a/352bd3e7-a5be-4e6f-81fd-f7d9ea7f1f29?expires=1794967200&signature=b5e98c3bf721e3c4f56eeca083fa0118310bb15f4784bbb09a1b412fccab94c4&req=diEvFc18nYBeXPMW1HO4zSUn%2BHocjfc5n3h5v2qYMMcK2hXuyzEfgwAp0jgP%0AJekfFsAGgazzy3v1rJU%3D%0A>
- 
Ensure the following permissions are granted for read-only syncing: 
- 
Grant Administrators – Read
- 
Grant Resource – Read
- 
To enable automated deprovisioning through Vanta, also grant: 
- 
Grant Administrators - Write
- 
Grant Resource - Write
Without the Read permissions, Vanta will not be able to retrieve Duo account data. Without the Write permissions, Vanta can still sync Duo data but cannot deactivate Duo accounts during employee offboarding.
⚠️ Note: Write permissions allow Vanta to update Duo user and administrator status only for automated deprovisioning when the feature is enabled in Vanta.
 | 
⚠️ Note: If only “Grant resource-Read” is enabled, Vanta will sync 2FA users but will not sync administrator accounts or their roles. Both Read permissions are recommended for full visibility. 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2517286332/71f129cb4629b42f5f1e254cfdf8/c4c711ee-4486-4d99-9f81-4bd0866ef4c3?expires=1794967200&signature=9681a121cf98d70235c18167430fd06b46075c00eb7272fc2a8ca3c851c947ce&req=diUmEct2m4JcW%2FMW1HO4zVklKRcIrpHALVeXgmZ%2BAU9xjixrAxJpwkDn6A3M%0AsV5Xx8aSeVWH%2FBOdPE8%3D%0A>
 

## Step 4: Complete the connection in Vanta
- 
Copy the following values from Duo: 
- 
Integration Key
- 
Secret Key
- 
API Hostname
- 
Return to the Vanta and paste the values into the corresponding fields in Vanta 
- 
If you want Vanta to deactivate eligible Duo accounts during employee offboarding, select Enable automated deprovisioning. 
- 
Click Validate and store to complete the connection
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2517275475/b4d3ff818c585bb1ae1dbd995692/ff63f129-c7cd-411b-bb07-c61335c2d967?expires=1794967200&signature=aae5f6cadc18093aaad1a5a3b4c7b84438dba511df220ec6fe879bcdd720e960&req=diUmEct5mIVYXPMW1HO4zUzjrwvZgiHIAIJqU1VS9e%2BJBU2AmA6VAVr8EemX%0AXXCoqR%2FBAQTwn8cgN5k%3D%0A>
Once credentials are validated, the integration connects successfully and Vanta begins syncing data.
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2183430023/34e66cea33de5190af8fd219a72f/e9619d03-607a-4698-bb42-a079451307d2?expires=1794967200&signature=9eb8f434b05ffa41d22fb46b5218afa63299e110a5d327b3a8124894ceb8887c&req=diEvFc19nYFdWvMW1HO4zXAA7Bh1RIDuyVIj5%2BIAVzP0A2RBYNTqr%2FXmW4tP%0Aw7QJxhlIfnsV0NPTWlM%3D%0A>
 

## Capabilities
The Duo integration supports the following resources and workflows within Vanta: 
- 
Users — Used for Access Reviews, Access Requests, and Automated Tests
- 
Groups — Supported for 2FA users and used in Access Reviews and Access Requests
- 
Roles/Entitlements — Supported for admin users and used in Access Reviews and Access Requests
- 
Last Login — Used in Access Reviews and Access Requests
 | 
Resource | 
Supported | 
Used for 
 | 
Users (2FA) | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>, Automated Deprovisioning﻿
 | 
Users (Admins) | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>, Automated Deprovisioning﻿
 | 
Groups | 
✅(For 2FA Users) | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>﻿
 | 
Roles/Entitlements | 
✅(For Admin users) | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>﻿
 | 
Last Login | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>

## Permissions
Vanta accesses the following data from the Duo Admin API <https://duo.com/docs/adminapi>: 
 

## Read access: 
Vanta can access: 
- 
User data (2FA): 
- 
Used to monitor which employees have Duo access and to identify accounts belonging to terminated personnel that have not yet been deactivated — so you can take action in Duo.
- 
Users with a status of disabled or pending deletion are automatically excluded from the sync. 
- 
In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows Vanta to display available users when tracking or assigning access.
- 
User data (Administrator accounts): 
- 
Used to monitor which employees have administrative access to Duo and to verify that high-privilege admin roles (for example, Owner) are granted only to authorized personnel.
- 
Only administrators with Active status are synced. 
- 
Requires the Grant administrators — Read permission on the Admin API application. 
- 
In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows requesters to select from the correct set of admin roles and enables approvers to review the level of access being requested.
- 
User group data
- 
Used to validate least-privilege access and confirm that group-based access controls align with compliance requirements.
- 
Group membership is derived from the Duo Admin API user data — specifically, the groups associated with each 2FA user.
- 
In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this enables approvers to see which groups grant access and map access levels to entitlements.
- 
User role and entitlement data
- 
Used to verify that employees are assigned appropriate roles, validate least-privilege access, and confirm that high-privilege roles are granted only to authorized personnel.
- 
In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows requesters to select from the correct set of roles and enables approvers to review the level of access being requested.

## Write access: 
- 
Vanta does not write to Duo unless automated deprovisioning is enabled for the integration.
- 
When automated deprovisioning is enabled, Vanta can update Duo user and administrator account status to deactivate accounts during employee offboarding.
- 
Vanta does not create Duo users, groups, applications, or settings.
- 
Users synced from an upstream directory such as Entra ID, Active Directory, or SCIM may need to be deprovisioned in that directory instead of Duo.

## Troubleshooting and FAQs
This section outlines common issues that may occur during setup. It is not an exhaustive list but focuses on the most frequent points of failure.
 

### Q: Does Vanta automatically deprovision (disable or delete) users in Duo?
A: Yes, if automated deprovisioning is enabled for the Duo integration. Vanta deactivates eligible Duo 2FA users and Duo administrator accounts during employee offboarding by updating their Duo account status. Vanta does not permanently delete Duo accounts.
 
If automated deprovisioning is not enabled, Vanta remains read-only. It monitors and surfaces Duo account data so you can identify accounts that need to be deprovisioned, but the actual deactivation or removal must be done directly in Duo or via your existing offboarding workflows.
 

### Q: Do I need to grant additional Duo permissions to enable automated deprovisioning? 
A: Yes. Read-only syncing requires Grant administrators - Read and Grant resource - Read. Automated deprovisioning also requires Grant administrators - Write and Grant resource - Write.
 
If you already connected Duo with read-only permissions, update the existing Admin API application in Duo to add the Write permissions, then edit the Duo integration in Vanta, enable automated deprovisioning, and validate and store the credentials again.
 

### Q: Which Duo accounts can Vanta deactivate? 
A: Vanta can deactivate eligible Duo 2FA user accounts and Duo administrator accounts that are synced into Vanta. Duo users and Duo administrators are separate account types in Duo; if the same person has both types of access, each account is evaluated separately. Duo Owner administrators cannot be disabled through the Duo API.
 

### Q: What if a Duo user is managed by Entra ID, Active Directory, or SCIM? 
A: Some Duo users are managed by an upstream directory. Duo may block direct deactivation of those users through the Duo Admin API. If this happens, Vanta will show that the account is managed by a synced directory. Deactivate the user in the source directory, then sync Duo again.
 

### Q: Which Duo user statuses are synced?
A: For 2FA users, all statuses except disabled and pending deletion are synced. For admin users, only those with Active status are synced. 
 

### Q: Where do groups come from?
A: Group membership is derived from the Duo Admin API user data — specifically, the groups associated with each 2FA user.
 

### Q: Why aren't admin users, roles, or groups appearing in Vanta after connecting Duo?
A: This usually means the Grant administrators — Read permission was not enabled on the Admin API application in Duo. Vanta checks for this permission before attempting to fetch admin data — if it's not present, Vanta will still sync 2FA users but will skip admin accounts and their roles entirely. 
 
To fix this:
- 
Log into the Duo Admin Panel.
- 
Navigate to Applications → Application Catalog and open your Admin API application. 
- 
Enable Grant administrators — Read.
- 
Vanta will pick up the change on the next sync cycle. If data still does not appear, disconnect and reconnect the integration in Vanta to force a fresh sync.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-duo--01.png
- [image 02] ../../images/integrations/duo/connecting-vanta-duo--02.png
- [image 03] ../../images/integrations/duo/connecting-vanta-duo--03.png
- [image 04] ../../images/integrations/duo/connecting-vanta-duo--04.png
- [image 05] ../../images/integrations/duo/connecting-vanta-duo--05.png
- [image 06] ../../images/integrations/duo/connecting-vanta-duo--06.png
- [image 07] ../../images/integrations/duo/connecting-vanta-duo--07.png
- [image 08] ../../images/integrations/duo/connecting-vanta-duo--08.png
- [image 09] ../../images/ux/integrations/connecting-vanta-duo--09.png
