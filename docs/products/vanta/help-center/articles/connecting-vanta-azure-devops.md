# Connecting Vanta &  Azure DevOps

Source: https://help.vanta.com/en/articles/11345631-connecting-vanta-azure-devops
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

⚠️ Note: The Azure DevOps integration previously authenticated via Azure DevOps OAuth. This legacy OAuth flow is no longer supported. The integration now uses Microsoft Entra ID for authentication. If you connected Azure DevOps prior to this change, see Relinking existing credentials below.
 
To link Azure DevOps with Vanta, follow the steps below. The integration supports both read-only and read+write access, and connects to one Azure DevOps organization per credential. Multiple credentials can be added to connect additional organizations.
 

## Prerequisites
Before connecting, confirm you have the following: 
- 
Organization Owner access in Azure DevOps
- 
Administrator access in Vanta
- 
A Microsoft account with permission to authorize the connection in your Azure DevOps tenant
- 
If your organization requires admin consent for third-party app registrations, you will need an account with Entra ID admin consent permissions
 
 

## Permissions
Vanta requests the following permissions based on your chosen access level: 
 | 
Access level | 
Permissions
 | 
Read only | 
Work items (read), Code (read), User entitlements (read)
 | 
Read + write | 
Work items (read/write), Code (read), User entitlements (read) 
 
 

## Setup guide
- 
In Vanta, go to the Integrations page, click Add integration, and search for Azure DevOps. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
A pop-up modal will appear. Choose your access level:
- 
Read only: Vanta can monitor repositories, users, and work items.
- 
Read + write: additionally allows Vanta to create work items in Azure DevOps from within the platform.
- 
(Optional) If your organization uses a specific Microsoft Entra ID tenant, enter your Tenant ID in the provided field. If you are unsure, you can leave this blank and Vanta will authenticate against your primary tenant.
💡 Tip: To find your Tenant ID in the Azure Portal, go to Microsoft Entra ID → Overview.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2438147790/1f0f825fa86ff47628fa834bd14d/77d99236-11fa-463c-b4d3-aaf2868a4941?expires=1794967200&signature=ffb8d7b9695f535e218c0df12a2a13b19306e5fb96f9efc767717a6db9306c43&req=diQkHsh6moZWWfMW1HO4zSHuntI0bvw%2Bx1gyzBLb%2FtkQ7EKZGm07CiNMKpyc%0ALxoJqm0r7ReTGlU3WLs%3D%0A>
- 
Select Connect Azure DevOps.
- 
You will be redirected to Microsoft to authorize the connection. Sign in and approve the requested permissions.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2438153117/abc861293ed3afa3ad305809f5a8/de4b954b-8214-430e-9ab7-26d6f6050f96?expires=1794967200&signature=9e1c28049ba966e3a545f0e064e9482566f4e019374073c9973ff43babaaca60&req=diQkHsh7noBeXvMW1HO4zbDr38IJqOXYkFkNpHgYxr9njTrt5FJDKuOCJSx8%0AanELTm%2BZ9sQ6XiAUbQ0%3D%0A>
⚠️ Note: If your organization requires admin consent for third-party app registrations, you will need an Entra ID admin account to approve the permissions. Contact your IT administrator if you are unable to complete this step.
- 
If multiple Azure DevOps organizations are associated with your account, select the organization you wish to connect from the dropdown.
ℹ️ Note: Each credential connects to one organization. To connect additional organizations, repeat this process to add another credential. To connect successfully, you must have access to all repositories in the selected organization.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2438157167/0291ba918efe767e23e1436a6734/d79052a8-a5eb-435b-b08e-65c6989cc23f?expires=1794967200&signature=1ab4e347375f55a81422618923259152cf108fd05687520fad1115c5188c95b2&req=diQkHsh7moBZXvMW1HO4zZnkbTrvfbUDzA86wViPgZor0LNZguiA43FzxTyv%0AuN6ndNh82TfyY%2FcA4Ek%3D%0A>
- 
Select Link Azure DevOps account to complete the connection.
Depending on the number of resources, it may take some time for them to populate after connecting. You will see a message confirming they are loading — this can be left to run in the background.
 
 

## Relinking existing credentials
If your Azure DevOps integration was connected before the Entra ID migration, your existing credentials use the legacy OAuth flow, which is no longer supported. To continue using the integration without disruption, you will need to relink your credentials:
- 
Navigate to Integrations and find the Azure DevOps integration.
- 
Click Manage, then Edit.
- 
Follow the connection steps above to re-authenticate via Microsoft Entra ID.
⚠️ Note: You will need an account with admin consent permissions in your Microsoft Entra ID tenant to complete the relink.
 

## 

## Common Issues

### No resources visible after scan completes
If no resources appear after the scan has finished, check the following:
- 
Confirm you are the organization owner in Azure DevOps, not just a project admin. Navigate to your Azure DevOps home page and confirm Organization Settings is visible in the sidebar. See Azure's support article <https://learn.microsoft.com/en-us/azure/devops/organizations/settings/add-team-administrator?view=azure-devops&tabs=preview-page> for help with account roles.
- 
Ensure the project's Version Control is set to Git. Vanta does not support TFVC at this time.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2438163529/53de6cf0a95c02fac11e3700c256/13901732187668?expires=1794967200&signature=15b6c4b364bf88c5992da342af912fdd0d927e22590c993f4d8c990bd9942956&req=diQkHsh4noRdUPMW1HO4zamYL8tsckKqlHvA1oX0JModyCTuZTj%2B0iciLqCO%0Af8B96XkT5io1YJVRbbM%3D%0A>
 

### Unable to complete authentication/consent
Completing the connection requires an account with permission to grant admin consent in your Microsoft Entra ID tenant. If you see a prompt indicating admin approval is required, contact your IT or Entra administrator.
 

### Connecting additional organizations
Each credential connects to one Azure DevOps organization. To monitor multiple organizations, return to the Integrations page, find Azure DevOps, and add a new credential for each additional organization.
 

### Credentials showing as invalid after the migration
If your credentials are flagged as invalid, your connection may be using the legacy OAuth flow. Follow the steps in Relinking existing credentials above to re-authenticate via Entra ID.

## Images

- [image 01] ../../images/integrations/azure-devops/connecting-vanta-azure-devops--01.png
- [image 02] ../../images/integrations/azure-devops/connecting-vanta-azure-devops--02.png
- [image 03] ../../images/integrations/azure-devops/connecting-vanta-azure-devops--03.png
- [image 04] ../../images/integrations/azure-devops/connecting-vanta-azure-devops--04.png
