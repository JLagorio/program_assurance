# Azure SCIM Attribute Instructions

Source: https://help.vanta.com/en/articles/11345646-azure-scim-attribute-instructions
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Important: Configure role mapping before enabling SCIM
 
Enabling SCIM provisioning will overwrite existing Vanta user roles based on your configured attribute mappings.
 
Before turning on provisioning, ensure that your IdP users are correctly mapped to Vanta using the rbac_role_id attribute - especially for Admin users. If role mapping is not configured properly, Admin users will lose access when SCIM sync runs.
 
We strongly recommend:
- 
Confirming your rbac_role_id mappings are correctly set for all required roles
- 
Verifying at least one group/user is mapped to the Vanta Admin role
- 
Testing provisioning with a non-admin user before enabling it for all users

## Set Up User-Specific Provisioning Using Microsoft Entra App Roles
With Vanta, you can assign user-specific roles by connecting Microsoft Entra App Roles to Vanta roles using SCIM. This setup is perfect for admins who want more control over what users can access in Vanta, based on their role in your identity provider. Once configured, users will be automatically assigned the correct role in Vanta when they're added to the app in Entra with no manual updates needed.
- 
Follow the Directory Sync setup instructions until Step 4: Set up application attribute mapping.
- 
This is where we will map an Entra attribute to the Vanta rbac_role_id attribute. In this example, we will use userType.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758012/b49ba5f6ba40c94bbe7a874b65a7/27632153347860?expires=1794967200&signature=aef152f81992dd9bfc559a394a3127f152da121c88fc4ae8166d9160157a5292&req=dSUmEM57lYFeW%2FMW1HO4zXZFs7m6oPWC61kuVWvpL2%2BiHNFS3RAbePZu9ffz%0AtJEtrAy0INwCIy39QkY%3D%0A>
- 
Update the Directory Provider Value attribute_name to userType
- 
In Azure, go to your app's Users and groups section and click on application registration.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758008/348f56ec243a8b41ad7e026a6e4d/27632153350548?expires=1794967200&signature=889761617ae6e0142e05b434984ecd93a7fe3c9f11cef6c98d927770b97d69ba&req=dSUmEM57lYFfUfMW1HO4zaJznGAqzSVisXl1yS5xpxGR0IqWcChCyo5x8ZGL%0AVjXkZk8Bf90K5pant%2F8%3D%0A>
- 
In the App Roles page, click Create App Role.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758005/9e20fcad8169420991f6e5ece19d/27632153351444?expires=1794967200&signature=be3df2f34b9eb747144b688fbdaa7de52f5904690f9808e56fabb0509088be31&req=dSUmEM57lYFfXPMW1HO4zUmn%2FRcJjD%2BM8L9RutmF02qhyE07ikcRhinw8axc%0Az50WC2bEaztU2dfZ9Ro%3D%0A>
- 
Create an app role for each Vanta role you want to enable through SCIM. Give it a descriptive name and value (we will map these to role IDs in the next step).
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758004/e6f78e42d7e307046bf112b673c6/27632125315604?expires=1794967200&signature=b6ab2eb134c6294b4c69c6fc087c664adc70a5e217bfd978789485fb8275aea5&req=dSUmEM57lYFfXfMW1HO4zQwTv%2Fz2HcHoZUzzw%2FNAoSH6pZSrIjEVMMtTE5lz%0ADYDTVSfw8qbeHCG3Dco%3D%0A>
- 
Return to your application and go to the Provisioning section.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758022/2cae82b5cce270b8da66810658fa/27632125317524?expires=1794967200&signature=624f312bdc09c80a7b3d1a37bff530652c6ac72880fa03791f7ee7ac60ae91db&req=dSUmEM57lYFdW%2FMW1HO4zWGR1AC35Diyi32oh14i%2Fu9dwIUQAChfi9NGqRBu%0AmtLCLUlBdEkGTlpqYag%3D%0A>
- 
Go to Provisioning followed by Mappings and click on Provision Microsoft Entra ID Users.
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758023/a99b9389fb98ced7ced6a5168c79/27632125319316?expires=1794967200&signature=383fba0adb3e7c6eb349ac069b282490005a8ee0d050c3b8b7cdf352cfa27a5b&req=dSUmEM57lYFdWvMW1HO4zXDsG1xKoJY72or83OoYZQpvXZDa%2F%2FZraxeApUXa%0AfInkkgfPYPL0gOkwyTw%3D%0A>
- 
Click Add New Mapping
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758028/f8db53da4fe4f0420c07fabadf4a/27632125322772?expires=1794967200&signature=fb181c3bf5a4b2cf9619e5244161deca546408624d5c44eb89bc6fefa25dd722&req=dSUmEM57lYFdUfMW1HO4zScj0dJJQm0xJhnrFEYVSzmIjErG4gK9oINZ%2FivI%0AWQiejGAR1P6TVrdEK1M%3D%0A>
- 
Select Mapping type: Expression and Target attribute: userType 
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758027/13037538a47d54ebc7abad110b6a/27632153360532?expires=1794967200&signature=78df7ad9d8bb2a4b1b8e4f92a887f6b8bd9e035509f5fcf761d88c2223607259&req=dSUmEM57lYFdXvMW1HO4zU8r%2F6p%2B%2B7B89BT8JybDyLNRwHaKgzhC51Wi2wpK%0AJhP9%2BXTepppS6CuYb1Q%3D%0A>
- 
For the expression, we will set up an if-else that maps App Role Assignment to Vanta role ID, using the values from the Vanta UI:IIF(SingleAppRoleAssignment([appRoleAssignments])="Vanta admins", 

"0000005ddeface0000000001", 

IIF(SingleAppRoleAssignment([appRoleAssignments])="Vanta trust collaborators", 

"0000005ddeface0000000008", 

"0000005ddeface0000000003"

)

)
- 
In this example, we assign the Admin role if the assignment is to "Vanta admins," the Trust Collaborator role if it is to "Vanta trust collaborators," and the Employee role otherwise. If you are mapping additional roles, you may add extra clauses to the if-else.
- 
Assign roles to your users by returning to the Users and Groups section and clicking Add user/group.
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758035/2596eda26b978dfe8448a2207e83/27632125328532?expires=1794967200&signature=fb9fc3d8735b58515f17afad237f7b30e8221798fec695c9543f31ffc81cf694&req=dSUmEM57lYFcXPMW1HO4zXwt0BaFr09gRtB0T%2B06ZsdKVXZBFKELeln8hrxk%0AYzTf17ChON3h7bKUi1c%3D%0A>
- 
You will be prompted to select an app role assignment for the users you add.
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758033/4ed5750fd663675c8570ac82804b/27632125328916?expires=1794967200&signature=5b491515f707100b7ca69107eeb55527fe430014a1c9b2927b5ed9be4ab15267&req=dSUmEM57lYFcWvMW1HO4zWAjeDd6teIkXcgTkO57E8tfD2PBS0xtlVjqKzV7%0AWfxM9SWF%2F0WjartAu7k%3D%0A>
- 
Return to the WorkOS setup instructions to complete setup.

## Set Up Team-Specific SCIM Provisioning in Microsoft Entra (Azure AD)
To sync Teams from Microsoft Entra to Vanta using SCIM, you'll need to use Dynamic Groups or Security Groups paired with provisioning settings in your Entra enterprise application. Follow these steps to ensure your Entra group syncs into Vanta:
Go to your Enterprise Application connected to Vanta
- 
Navigate to Microsoft Entra Admin Center
- 
Select Enterprise applications
- 
Choose the app you've configured for SCIM (e.g., Vanta SCIM Provisioning)
Create and Assign Entra Groups
- 
In Microsoft Entra, go to Enterprise Applications
- 
Select the SCIM app you just connected to Vanta
- 
Click Users and Groups
- 
Select + Add user/group
- 
Choose a Security Group or Dynamic Group
- 
Assign the group to the app
These groups will be provisioned to Vanta as Teams
Confirm SCIM provisioning is enabled
- 
Go to Provisioning
- 
Under Mappings, select Provision Azure Active Directory Groups
- 
Make sure Group mappings are configured to send the group display name and members
Sync Group Membership to Vanta as Teams
- 
Once provisioning runs, each assigned group will appear in Vanta as a Team
- 
Members of the group in Entra will automatically be assigned to the corresponding Team in Vanta
Important Notes:
- 
The Team name in Vanta will mirror the group's display name in Entra
- 
Users can be part of multiple groups and will appear in multiple Vanta Teams
- 
Provisioning may take a few minutes to reflect changes use the Provision on Demand option to trigger immediately if needed
This configuration is especially useful for managing large organizations or role-based permissions, ensuring that Vanta's Team structure reflects your identity provider's setup without manual effort.

## Images

- [image 01] ../../images/integrations/workos/azure-scim-attribute-instructions--01.png
- [image 02] ../../images/integrations/azure/azure-scim-attribute-instructions--02.png
- [image 03] ../../images/integrations/azure/azure-scim-attribute-instructions--03.png
- [image 04] ../../images/integrations/azure/azure-scim-attribute-instructions--04.png
- [image 05] ../../images/integrations/azure/azure-scim-attribute-instructions--05.png
- [image 06] ../../images/integrations/azure/azure-scim-attribute-instructions--06.png
- [image 07] ../../images/integrations/azure/azure-scim-attribute-instructions--07.png
- [image 08] ../../images/integrations/azure/azure-scim-attribute-instructions--08.png
- [image 09] ../../images/integrations/azure/azure-scim-attribute-instructions--09.png
- [image 10] ../../images/integrations/azure/azure-scim-attribute-instructions--10.png
