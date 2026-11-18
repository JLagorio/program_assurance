# How to change Azure Devops Read/Write Permissions

Source: https://help.vanta.com/en/articles/11345775-how-to-change-azure-devops-read-write-permissions
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Version Control Systems
Fetched: 2026-11-17

## Article text

This article explains how to update the read/write permissions for your Azure DevOps integration in Vanta.
⚠️ Note: Changing your access level requires re-authenticating via Microsoft Entra ID. You will need an account with admin consent permissions in your Entra tenant to complete this process. Relinking will NOT cause data loss. 
 
Contact your IT or Entra administrator if you are unsure.
 

## Before you begin
Confirm you are an organization owner in Azure DevOps. An easy way to verify this is to navigate to your Azure DevOps organization page and confirm that Organization Settings is visible in the sidebar. If it is not, you may not have the required access.
 

## Instructions
- 
In Vanta, go to the Integrations page and search for Azure DevOps. 
​
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760831/8591124700ff99e7679dbca076bb/19593343368724?expires=1794967200&signature=aef8cfb8ef43e1035eea7839526b1d1fae484d460f9b6bf437ab0dc2dc26eb9b&req=dSUmEM54nYlcWPMW1HO4zSIVoQCdAomIfo23VGMw27dsE4081WHzgQBKbWqy%0AluEK%0A>
- 
Select Manage, then Edit. 
- 
Click the pencil icon next to the connection you want to update permissions for. 
- 
You will see the current access level selected: 
- 
Enable read access only: Vanta can monitor repositories, users, and work items
- 
Enable read and write access: additionally allows Vanta to create work items in Azure DevOps from within the platform
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2450582084/a332d33b03799a72cfca0e95f51d/19593408282132?expires=1794967200&signature=4a91f0f02e15559fd1e4d08c4cab3401a8b77f9d27adbf5aa6dcb134d9cfd824&req=diQiFsx2n4FXXfMW1HO4zdtouY%2BPL4y2W6SRxbDtOt6oeRL9Co7ZnPuz5HRI%0A9Pf%2FmIC2ooJFEGC%2BXxs%3D%0A>
- 
Select the access level you want and proceed to the next step. 
- 
(Optional) If your organization uses a specific Microsoft Entra ID tenant, check Use specific tenant ID and enter your Tenant ID. 
💡Tip: To find your Tenant ID: in the Azure Portal, go to Microsoft Entra ID > Overview.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760828/9770b7dd0695a9ea0391173480ab/19593427205268?expires=1794967200&signature=1a8a8adb83c1619f18df9c46368193293ffaa561b70a5402757f644a0d64f9e9&req=dSUmEM54nYldUfMW1HO4zX1GOkloL1mfXMJ1tyB65uxhqLsHzenqoOXH%2FU6S%0AO8%2BUZWhM%2FJtFMGSy6z0%3D%0A>
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760829/a010a9af07412aafc9e4b66f0a59/19593259784724?expires=1794967200&signature=7f081b4afde204c51c374300448c1b24fe3256726c2d7a4ad9652339f1329715&req=dSUmEM54nYldUPMW1HO4zSlbBBUAl59zBdoD712rk9aCf37GJvMrL%2BgECY7Z%0Asc%2B9e3Fsa5g1Dzqd4rI%3D%0A>
- 
Now click Connect Azure DevOps, which will bring you to Microsoft Azure. If you are not signed in already, you will be prompted to sign in with your Microsoft Account, and then the page will redirect you back to Vanta. If you are signed in already in another tab, you will be redirected back to Vanta and presented with a menu like below:
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760840/5a437f91c7994f82ec2c2c1a1ade/19593745665428?expires=1794967200&signature=ec1a34fc39e7b3baa525e08f02da99427e7d9d5325eb3bf5fdfe247bbb92e96f&req=dSUmEM54nYlbWfMW1HO4zWz72Nv9mzO%2F%2F0YNBPtWbAktd0sOGGakVAyYVIjc%0A79h5%0A>
- 
From here, you can select your organization and finish linking by choosing the organization you want Vanta monitoring from the drop-down menu. Once you've completed this, click Link Azure DevOps account.
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760843/cb830370602a1f7c5cc368f5e8ed/19593794851988?expires=1794967200&signature=81c1215853264feeb6a4e7c0b21ee291c8926e21b74398ee86c5b0c87b945946&req=dSUmEM54nYlbWvMW1HO4zYZ95RyOZzpTdj7jndricAecJdDGn5PitpYhZNqF%0A6Baw%0A>
ℹ️ Note: To connect successfully, you must have access to all repositories in the selected organization.
- 
Once complete, you will see a success message confirming the updated permissions. 
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760845/288be72070a29046f9c3534595b8/19593829774100?expires=1794967200&signature=b57467205dbbd844e90cd096d5ae21f2875107cc9914c3f38bc09baa8edbb4fa&req=dSUmEM54nYlbXPMW1HO4zYPW7Vq%2Ff74c64r%2FDsUdIpyS4%2F1jLK129dQUXY4T%0Az%2B7%2B%0A>

## Images

- [image 01] ../../images/ux/integrations/how-to-change-azure-devops-read-write-permissions--01.png
- [image 02] ../../images/ux/integrations/how-to-change-azure-devops-read-write-permissions--02.png
- [image 03] ../../images/ux/integrations/how-to-change-azure-devops-read-write-permissions--03.png
- [image 04] ../../images/ux/integrations/how-to-change-azure-devops-read-write-permissions--04.png
- [image 05] ../../images/ux/integrations/how-to-change-azure-devops-read-write-permissions--05.png
- [image 06] ../../images/ux/integrations/how-to-change-azure-devops-read-write-permissions--06.png
- [image 07] ../../images/ux/integrations/how-to-change-azure-devops-read-write-permissions--07.png
