# Controlling Scope Through Microsoft Entra

Source: https://help.vanta.com/en/articles/11345767-controlling-scope-through-microsoft-entra
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Vanta's Microsoft Entra integration enables you to control which employees are automatically marked in and out of scope in Vanta by managing Vanta O365 app assignments within Microsoft Entra.
 
Be sure to consult with Support and your auditor to validate the set of accounts that should and should not be managed by Vanta.
 
 

##  Prerequisites
- 
Works with all Microsoft Entra ID plans. Assigning a group (rather than individual users) to the Vanta O365 app requires Microsoft Entra ID P1 or P2.
- 
At least the Cloud Application Administrator role in Microsoft Entra to manage app assignments. (Connecting the integration itself requires Global Administrator; managing assignments afterward does not.)
- 
Users to be synced must be User Type Member; User Type Guest will not sync.
 
 

## Two ways to enable Entra-controlled scoping
You can turn on Entra-controlled scoping at two points:
- 
During setup: when connecting Microsoft Entra, the Set sync filters step includes the checkbox Only sync selected users from Entra. Checking it means Vanta imports only the users assigned to the Vanta O365 app.
- 
After connecting: from the Integrations page, select Configure Scope on the Microsoft Entra integration and enable the IdP scoping toggle (see Enable the feature in Vanta below).
⚠️ Note: Assign users to the Vanta O365 app before enabling scoping. If you enable the filter during setup before anyone is assigned to the app, your first sync will import no users. If in doubt, leave the setup checkbox unchecked, complete the assignment steps below, then enable scoping afterward.
 
 

## Configure Entra app assignments
- 
Sign in to the Microsoft Entra admin center <https://entra.microsoft.com/> and go to Entra ID > Enterprise apps > All applications.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705921728/f98049c6c1fadce24ddec1db4e0d/31223827963668?expires=1794967200&signature=37663ebf5136e07d530aec152de55830c06a25081f5886239e4bda8c63332b7a&req=dicnE8B8nIZdUfMW1HO4zSTjWwD5lIpp8taFYtC5q2Gv2r0kOc8BjwT4s2Di%0ACo%2BIyDFbASZxp2W%2FWnk%3D%0A>
- 
Search for Vanta O365 and select it. If more than one result appears, select the most recent. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705922014/09bacdd6bdd8cbae664dc1c4633c/31223827965332?expires=1794967200&signature=e9fe9bf7c4c7bfe45cf3ed3a9e2bdcb8fc984de0de01c5c9f9a5a925204df1f7&req=dicnE8B8n4FeXfMW1HO4zZsWt5ShYXOFUmxPWnIogr%2FPgaE%2FdqkqEaBaTyYj%0Ak6fx5DHFD9yfX5xAGq0%3D%0A>
- 
Select Users and groups, then select Add user/group. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705922220/b3bb9007fd2872c294b07fd5b5dc/31223843537044?expires=1794967200&signature=489e4b10fa14ff5e865afe21ecbc9fa19e9afb19e41cadcd05ceab89a07e4572&req=dicnE8B8n4NdWfMW1HO4zXKt1V3dshK5eZkqTo96nsXVsBewDjIRJ%2BlDgMDO%0ARh7fFYeXO4ieesisDSA%3D%0A>
- 
On the Add Assignment pane, choose the users (or group) you want Vanta to import, then select Assign.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705923018/fba938539bf7973b5dc989572025/31223827968916?expires=1794967200&signature=a06c8de08342bf7bee85c9a26ffe0658c893abd7689ec69c5166a77edfb8d308&req=dicnE8B8noFeUfMW1HO4zX7dqDS%2BRSc1PoMG33iIl7kp5od8D%2FTAqH0tAnZl%0AX287AXQWFhOPTxK9in8%3D%0A>
 
 

## Validate account assignments
- 
Verify that the list of employees and groups assigned to the Vanta app reflects your desired scoping preferences.
- 
Vanta recommends creating an automated provisioning process to assign the Vanta app to new employees, or at least ensuring that you have a documented process.
 
 
 

## Enable the feature in Vanta
If you didn't enable scoping during setup:
- 
Open the Integrations page and find the Microsoft Entra integration.
- 
Select the three-dot menu. 
- 
Select Configure Scope.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705932058/6594887e93543376ca265768c24a/image.png?expires=1794967200&signature=13118337088f4faf182320bfa3f900f7630b586a2af983c61f6b2fd47abfde3c&req=dicnE8B9n4FaUfMW1HO4zXP8Zeo4xfrSzxd9%2B2TXvW3qbXM1AWfb4CdB%2BrmB%0AzfC6%2FPxRraeMKsVrZbw%3D%0A>
- 
Enable the Control scope with Office toggle.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2705933652/938aec226afe9419ad59fa910073/image.png?expires=1794967200&signature=5e07120a6baf20e89260a5af242813b8a6cc67c6cd3d3493e7a745980064d178&req=dicnE8B9nodaW%2FMW1HO4zQ1W%2FBdT%2F4Mc3JLcq0o061aTZuAxPgEF7hrK3QEc%0AtS8CzSa8YKSddoi6hOI%3D%0A>
- 
Once this feature is enabled, all user scope is managed through Microsoft Entra, and the scoping toggle in Vanta is disabled. Vanta updates the scope status for IdP accounts on the next data fetch.
 
 

## Using Entra groups for Vanta Workspaces
Please note, the steps below only apply to customers who are utilizing Vanta's <https://help.vanta.com/en/articles/11345386> Workspaces <https://help.vanta.com/en/articles/11345386> feature. If you do not have workspaces, this article section does not apply to you. If you are using Vanta Workspaces, you can create groups to scope in different sets of users for each Workspace.
- 
Sign in to the Microsoft Entra admin center <https://entra.microsoft.com/> and go to Entra ID > Enterprise apps > All applications.
- 
Open Vanta O365 and view the employees listed in Users and groups. To use the group scoping feature, the employees must first be assigned to the Vanta app.
- 
Go to Entra ID > Groups and click New group to create the group you will use to scope users in and out of Vanta. The group name must include Vanta as a standalone word, capitalized. It does not need to start with Vanta. For example, Vanta Employees, Acme Corp Vanta, and Vanta-Contractors are all valid. Names where Vanta is joined to other characters, such as VantaEmployees or Vanta_Employees, will not be recognized.
- 
Assign the group to the subset of employees in the Vanta O365 app that you want to scope in.
Once you finish creating the group, you can enable IdP scoping in Vanta. When you toggle IdP scoping, you'll have the option to select which group to scope by.
 
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764428/0b64016e4705892bb7b756264618/31223843538196?expires=1794967200&signature=19b19402ef63efaebef7abde4c7ee45d54e75146e2b3bb7bce705c6446724f65&req=dSUmEM54mYVdUfMW1HO4zeGlgEIbVAWrAzCz65LBOl7qmX24IACg0%2Fmh1AQc%0A3GVE%2FlrJe56vOpUtf5E%3D%0A>
 
Once this feature is enabled, all user scope is managed through the selected Entra group, and the scoping toggle in Vanta is disabled. Vanta updates the scope status for IdP accounts on the next data fetch.
 
⚠️ Note: When Entra-controlled scoping is enabled, accounts who are removed from the Vanta application in Microsoft Entra will be marked as out of scope in Vanta, which may potentially also mark associated personnel as out of scope.
 
If your offboarding process removes accounts from the Vanta application assignment manually before deactivating or deleting the accounts, those accounts and associated personnel will no longer be visible in Vanta for audit review. To ensure terminated employees remain visible for compliance purposes, consider:
- 
Keeping accounts belonging to terminated personnel assigned to the Vanta application in Microsoft Entra until audit evidence has been collected, and do not remove application assignment BEFORE deactivating or deleting the accounts.
- 
Disabling Entra-controlled scoping and managing scope directly in Vanta (see How do I Mark Resources Out of Scope? <https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope>).

## Images

- [image 01] ../../images/integrations/azure/controlling-scope-through-microsoft-entra--01.png
- [image 02] ../../images/integrations/azure/controlling-scope-through-microsoft-entra--02.png
- [image 03] ../../images/integrations/azure/controlling-scope-through-microsoft-entra--03.png
- [image 04] ../../images/integrations/azure/controlling-scope-through-microsoft-entra--04.png
- [image 05] ../../images/ux/integrations/controlling-scope-through-microsoft-entra--05.png
- [image 06] ../../images/ux/integrations/controlling-scope-through-microsoft-entra--06.png
- [image 07] ../../images/ux/integrations/controlling-scope-through-microsoft-entra--07.png
