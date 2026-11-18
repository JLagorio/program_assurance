# JumpCloud SCIM Attribute Instructions

Source: https://help.vanta.com/en/articles/11345644-jumpcloud-scim-attribute-instructions
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

## Prerequisites
JumpCloud requires SAML to be configured for the application before SCIM can be enabled in Vanta <https://help.vanta.com/en/articles/11345647-enabling-scim-in-vanta>. Make sure SAML is set up for your JumpCloud application prior to configuring SCIM in Vanta.
 
For additional context, see JumpCloud’s SCIM requirements <https://workos.com/docs/integrations/jumpcloud-scim/2-select-or-create-your-jumpcloud-application> as documented by WorkOS. 
 

## Provision Vanta RBAC Roles Using JumpCloud Groups
With JumpCloud, you can assign Vanta's built-in RBAC roles by using JumpCloud groups. This setup helps ensure that your team members have the correct permissions in Vanta.
- 
JumpCloud does not currently support custom SCIM attributes. Because of this, Vanta is unable to fully support syncing RBAC roles from JumpCloud—in particular, we are unable to support syncing custom roles at this time.
- 
Skip step 4 of the WorkOS instructions- we will not use the custom attribute with JumpCloud, so you can leave the Directory Provider Value field blank and move on to step 5.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757794/647ee45f36fe6f561ef7ab175c43/27632411691156?expires=1794967200&signature=92b39d07e683c7924782ce27adbc6921074c1f17c08d41716f0f5d4823e1dd89&req=dSUmEM57moZWXfMW1HO4zWpZe9OVWuJmyfQcVONfi53R%2Bn4pQb5p9ypRpoHs%0AQvm%2BZccv0dAzA1rOZ%2BI%3D%0A>
- 
Instead, assign to built-in RBAC role IDs through JumpCloud, place your users in JumpCloud groups according to the RBAC roles they should have, and assign those groups to the Vanta SCIM app.
- 
Next, contact the Vanta team and let us know which group corresponds to which built-in RBAC role. We will map the groups to role IDs.

## Setting Up Team-Specific SCIM Provisioning in JumpCloud
If you're using JumpCloud groups to assign roles and want to reflect those groups as Teams in Vanta, follow these steps:
Enable SCIM in Vanta
- 
Go to your Settings page in Vanta
- 
Select Logins & Security
- 
Scroll to the SCIM section
- 
Click Enable
This will take you to the WorkOS setup flow.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757798/f8458f92df8ed8708e2c53d7bf17/36670557536916?expires=1794967200&signature=3c2bcbc9d74afa8507450320e67eb82ce90dffe7a56e2c9b48c27d5b3e0efbc1&req=dSUmEM57moZWUfMW1HO4zRHHXB9s4OY6BmLqdEjQyWT%2Br1d3E0bYwJzvTWRu%0A1w3nT%2F3cv%2BXMp0LQf7U%3D%0A>

### Select JumpCloud as your provider
- 
In the WorkOS window that opens, select JumpCloud
- 
You’ll be prompted to create a JumpCloud application that WorkOS can connect to
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757792/fd35e8947751984acbad7207478d/36670600322068?expires=1794967200&signature=7951417ee75fe9d6988de20c6458ddfbf5cc963b088d508a8008a6353dc914ba&req=dSUmEM57moZWW%2FMW1HO4zb%2Fy8hVFHMwnK%2BWs4N7%2F2nUwCjhb090kB7w4Lg%2Bk%0AEBe2d0H1Fwr3UvE78cM%3D%0A>

### Set up the JumpCloud SAML App
- 
In JumpCloud, go to SSO Applications
- 
Choose SAML and set up the app (you can name it something like "Vanta SCIM")
- 
Save your changes
- 
JumpCloud does not support custom SCIM attributes, so skip step 4 in the WorkOS setup
- 
Leave the Directory Provider Value field blank and move to the next step
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757805/a2eb716fafa25521f1694763d1dd/36670600325012?expires=1794967200&signature=ad425f6c0f51e9d499d70450578ce8ff3e9d760e2ade4720718a1493f783a444&req=dSUmEM57molfXPMW1HO4zWgZdCDOkLqJ2oCMfQ9MDnmX7o2C%2FnnNDRK0SKf5%0AuPYbZr2TnTtrywX7gHg%3D%0A>
Create or confirm JumpCloud groups
- 
From the JumpCloud Admin Console, go to User Groups
- 
Create groups based on how you want to assign RBAC roles in Vanta (e.g., Security Team, Vanta Editors)
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757809/7dee5636cf83487bfcfd939e1190/36670600328212?expires=1794967200&signature=a0f82bde9b4d451403772ee4c4fcf2a32b6d9774c0d7c41b88380de17b0894ed&req=dSUmEM57molfUPMW1HO4zewgK4xcrBmnxZDaFFGP388%2BMESV1xeUpRNTc8XO%0AYRv0j6uFuZQqhHQzoZo%3D%0A>
Assign users to the appropriate groups
- 
Add users to the appropriate JumpCloud groups based on their function or department
Sync groups with the SCIM application
- 
In Applications, select the SCIM app connected to Vanta
- 
Go to the Group Management section
- 
Select the groups you want to sync to Vanta
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757810/1fda9cf185aa55c40e34bdaa06b9/36670600330132?expires=1794967200&signature=b8ce6ff03b50c905c0be79eae4d174ec65d4944f5f76148511d1b502b784d31e&req=dSUmEM57moleWfMW1HO4zQHe9sL2oBq%2Frbj7xjaRILKQaaYmmbWVzF%2B%2Fu6u0%0AB1jAionHHgqdV1brVQA%3D%0A>
Provision and confirm in Vanta
- 
Run the SCIM sync
- 
Go to the Teams page in Vanta to confirm each JumpCloud group appears as a Team
- 
Users will be grouped under the team that matches their assigned JumpCloud group
How Vanta handles groups as teams
Because JumpCloud only supports provisioning of users via groups, and groups are also used to create Vanta Teams, you will see a Vanta Team for each RBAC role. For example, if you have a JumpCloud group used to assign users to the Editor role called “Vanta Editors”, that group will also appear as a Team on the Teams page in Vanta.
If you're using Vanta for GRC and plan to provision users via SCIM, make sure that all personnel you want to monitor are included. These users should be assigned the Employee role. Since Teams in Vanta only allow users with the Collaborator role or higher, your Employee group (which will appear as a Team) may show errors noting that users don’t have access and that’s expected.

## Images

- [image 01] ../../images/integrations/workos/jumpcloud-scim-attribute-instructions--01.png
- [image 02] ../../images/ux/settings/jumpcloud-scim-attribute-instructions--02.png
- [image 03] ../../images/integrations/workos/jumpcloud-scim-attribute-instructions--03.png
- [image 04] ../../images/integrations/jumpcloud/jumpcloud-scim-attribute-instructions--04.png
- [image 05] ../../images/integrations/jumpcloud/jumpcloud-scim-attribute-instructions--05.png
- [image 06] ../../images/integrations/workos/jumpcloud-scim-attribute-instructions--06.png
