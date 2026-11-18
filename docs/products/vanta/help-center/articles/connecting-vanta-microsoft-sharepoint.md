# Connecting Vanta & Microsoft SharePoint

Source: https://help.vanta.com/en/articles/11345634-connecting-vanta-microsoft-sharepoint
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Prerequisites & Required Permissions
 

## Microsoft 365 role required
Connecting the SharePoint integration requires tenant-wide admin consent in Microsoft 365. The person completing the connection must have one of the following roles:
- 
Global Administrator
- 
Application Administrator
Admin consent is only needed once during initial setup. After that, admin access is not required for day-to-day syncing.
 

## Vanta role required
In Vanta, the user connecting the integration must have an Admin or Editor role (or a custom role that includes Integrations permissions).
 

## How authentication works
Vanta's SharePoint integration uses OAuth with a Client Credentials grant flow (app-only authentication). This means:
- 
No named user credentials are stored after setup
- 
During the consent process, a "Vanta SharePoint" Enterprise Application is automatically created in your Azure AD tenant under Azure Portal > Enterprise Applications
- 
Ongoing syncs authenticate as the Enterprise Application -- no individual user account is required
A dedicated service account (rather than a personal admin account) is recommended best practice to ensure the integration isn't disrupted if an employee leaves.
 

## What permission Vanta requests
Vanta requests the Sites.Read.All Microsoft Graph API permission. This allows Vanta to read documents across SharePoint site collections in your tenant.
 
Why this permission? Microsoft does not currently offer a more granular permission scope for the type of access the integration requires. This is a Microsoft API limitation, not a Vanta-specific requirement.
 

## What Vanta actually accesses
Despite the tenant-wide scope of Sites.Read.All, Vanta's application is built to only read content from two specifically named folders at the root of the selected site's default Documents library:
- 
Vanta Policies
- 
Vanta Documents
No content from other folders or sites is synced. During sync setup, you select which SharePoint site to use; Vanta then limits its reads to the designated folders within that site.
💡Tip: To further reduce risk, consider creating a dedicated SharePoint site specifically for Vanta, isolated from sensitive or proprietary content, and only place compliance-relevant documents in the designated folders.
 
 

## Integrating with Microsoft SharePoint
- 
In Vanta, go to the Integrations page, click Add integration, and search for SharePoint. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect.
- 
Review the permission information and connection information.
- 
Select Connect SharePoint.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761559/cc24ea26345289e599690bd7646a/16393343884436?expires=1794967200&signature=4373333ed17d4e72578629debeb0868114e1d7f182e717e7e7f59e3c2d48a7ea&req=dSUmEM54nIRaUPMW1HO4zQZOpiOk837Bl6nPiPfoWO3WycEW%2Br0NJvL4HgrQ%0AMPWugmHfJkY31xqDx4U%3D%0A>
- 
Login to your Microsoft SharePoint account and accept the terms of the integration.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516761558/11a51a9c85a02dafbf33f2cf464d/16393350829460?expires=1794967200&signature=c073604fe649a1ad5cab71048a9ad89dcb32d9b63abb8616369330d183652326&req=dSUmEM54nIRaUfMW1HO4zXFh1xiT38wpvDirX8xuEm9HMNzllWqrWYyY%2Bacp%0A6WKEuO8DLThdUM%2B3O7U%3D%0A>
- 
Once connected, you can begin syncing your policies from SharePoint into Vanta.
SharePoint policy sync is read-only and relies on supported Vanta folders in the selected site's default Documents library. 
 
When selecting a SharePoint site during sync, Vanta retrieves all SharePoint sites linked to the connected SharePoint credential.
- 
If you type a search term, only sites that match will appear. This happens in the UI when you enter the name of the site where your Vanta Policies or Vanta Documents folder exists.
- 
If you don’t enter a search term, Vanta will return all available sites.
For instructions on syncing policies, please see Syncing Policies from Microsoft SharePoint <https://help.vanta.com/en/articles/11345633>. 
 
SharePoint can also be used to sync contracts into Vanta for Customer Commitments <https://help.vanta.com/en/articles/13931299-managing-customer-commitments>.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-microsoft-sharepoint--01.png
- [image 02] ../../images/integrations/microsoft-sharepoint/connecting-vanta-microsoft-sharepoint--02.png
