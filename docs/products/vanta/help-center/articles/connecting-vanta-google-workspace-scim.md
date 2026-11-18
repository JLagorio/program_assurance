# Connecting Vanta & Google Workspace (SCIM)

Source: https://help.vanta.com/en/articles/13232005-connecting-vanta-google-workspace-scim
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Through the Vanta and Google Workspace integration, you can create a connection to import your employees seamlessly into Vanta using the SCIM protocol. 
This integration requires a user with the Google Workspace Super Administrator permission in order to configure it. 
 Before you begin you must identify if you are going to be using only Vanta's default roles  <https://help.vanta.com/en/articles/11345385-assigning-user-roles-and-permissions> or if you will be using custom roles <https://help.vanta.com/en/articles/11345585-creating-custom-roles>. This is important because Vanta’s default roles can be assigned to entire groups during the integration setup, as long as users are already organized into groups that match their Vanta roles (for example, Admins in an Admin group, Editors in an Editor group, and so on).If this matches your setup and you are only using default roles, you can skip ahead to Step 3 to begin the connection process.  
 
This group-based method does not support custom roles. If you use any custom roles, you’ll need to start at Step 1 below to create a custom attribute in Google so those roles can be assigned to individual users. 
​
If your environment includes a mix of users with default roles and custom roles, we recommend placing users with default roles into role-based groups. This will make role assignment simpler and easier to manage later on and for your groups based on the default roles, you can specify which role a particular group is assigned during the setup process.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902180740/91668fff7139ea15c83b89727bbc/CleanShot%2B2025-12-24%2Bat%2B16_03_18.png?expires=1794967200&signature=8fddeb72d553a5c206f1e0957d1ba3a5a0895ef5abd739e46a7e501edfee4354&req=dSknFMh2nYZbWfMW1HO4zVw4pHSXWfYLbakeFgEF%2FHhckwUrk8lifAZktERa%0AQywCDBI9RyPd84cry84%3D%0A>

 If you prefer to manage all role assignments directly in Google Workspace—even when using Vanta's default roles—you can also begin from Step 1 below. 
 

## Step 1: Create Custom Attribute 
- 
Using a Super Admin account, log into your company's Google Workspace Admin Console
- 
From the left-hand navigation panel, select Directory then Users:
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902041286/9ae15930f69ec4413f5f4b8462f7/CleanShot+2025-12-24+at+13_14_16.gif?expires=1794967200&signature=45b05ec5e4c74e3512aa0d897d9db2c76affe729f0d2df2197968c20a93ec960&req=dSknFMl6nINXX%2FMW1HO4zfPGhrXAOVCMhavENGwjUQs%2FteWFTW3XY0HxRiOC%0Alx2A2BKN4TgQdqcT1MQ%3D%0A>
 
- 
Select More Options and choose Manage custom attributes:
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902041646/7b61d8008469834908ed312ca5ad/CleanShot+2025-12-24+at+13_14_26%402x.png?expires=1794967200&signature=bf2cac1b4364f964f80923487e2dd5c5a81ff1de5430fa55cb551071ecc2981e&req=dSknFMl6nIdbX%2FMW1HO4zQg2oP9P%2FLAcM5LZhXFaM6H2UGal%2BWxiRCahPxsm%0AVQsfMDY%2BbxDXCzz52BU%3D%0A>
 
- 
We will be creating a custom attribute in order to allow the User Roles to sync from Google Workspace to Vanta. See this Google Support article for more detail <https://support.google.com/a/answer/6208725#zippy=%2Cadd-a-new-custom-attribute>. 
​
- 
Click Add Custom Attribute and tittle the attribute with a descriptive name
- 
We recommend using a name that signifies its relation to assigning roles in Vanta:
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902048792/82dac18811dfe87cf22cbf877d4d/CleanShot%2B2025-12-24%2Bat%2B13_19_18-402x.png?expires=1794967200&signature=783cd1ada7f6891edc617fd75963800b39967360855ff8b2c07d6f42d063ff6f&req=dSknFMl6lYZWW%2FMW1HO4zTYoOhAVNq0xhs9MnzsDirb1%2BbX3I0cM6JYdnFFy%0Ag9XO%0A>
 
- 
Ensure the info type is 'Text', and the visibility is set to Organization, and the Number of Values is set to 'Single':
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902047910/f495855d47d4aaf0385ec9be8603/CleanShot+2025-12-24+at+13_21_53%402x.png?expires=1794967200&signature=2a9c37f044a2a204d86f7e2b0225027ae260ef0a2fff1105e3e658c0b1ab176d&req=dSknFMl6moheWfMW1HO4zegjopxCBsLHcSZWTlJVSOkIOb0DsVExFh6dxc0y%0AR2Zj%0A>
 
- 
Select ADD:
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902049955/1591b15718b4cc0e541f3d7a2b6f/CleanShot+2025-12-24+at+13_25_00%402x.png?expires=1794967200&signature=5ec2ea7c71d523189e32bbd7bc11cd87667a5738f5513a8aa8f89f4d5541001b&req=dSknFMl6lIhaXPMW1HO4zR9gR4dmvl9CVL%2FBExp3QxIaBRoRSegVc3mDqWcU%0A6wQUDvQVWTpXyPHjWpA%3D%0A>
 
 

## Step 2: Assign Role to Users
Google Workspace does not allow custom attribute values to be assigned through groups, so roles must be set per user, either directly in the Google Workspace Admin Console or by using a CSV file for bulk updates. 
 
By default, all users are assigned the Employee (unprivileged) role unless a more privileged role is specified via group membership during setup or a custom attribute. This means you only need to assign roles to users who require more privileged access, such as Collaborator, Editor,  Administrator, or a custom role. 
​
Again, all of your users who use a Vanta Default role should be in groups based on their role, so you can assign the role directly to the group during the setup process. Your users with custom roles should also be in their own group with the added step of having to set the custom attribute for them so Vanta can grant them the appropriate role. 
 
For this step you need to identify these users who will have a custom role assigned, move them to a group based on said role, and update their custom attributes to reflect that role. 
​
Like mentioned before setting this attribute is only necessary for users with custom roles. However, if you prefer to manage all role assignments through Google Workspace, then every user with a privileged role needs to have their custom attribute set. 
​
- 
When specifying group names or assigning roles, refer to the roles already set up in Vanta. You can find them by clicking the gear icon in the top-right corner, selecting Login & Security, and then opening the Roles tab under User Provisioning.
​
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902185643/829b3ca439e8821494d037982c48/CleanShot%2B2025-12-24%2Bat%2B13_30_27-402x.png?expires=1794967200&signature=9e4835c0ea6dc07af8abdfc9b05e87aad8a3310b37a3acefb5cfda31829bb5f1&req=dSknFMh2mIdbWvMW1HO4zfC1RXQxtwKVNoQQZPU%2BZrsvEbKYdeYMQEE9%2B%2F5R%0AjVwv%0A>
 
 
- 
To assign a role via a custom attribute, you will need to use the role’s Role ID (shown in the second column) as the attribute value. Each user should have the Role ID of the role they need.
​
​
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902186649/e128b5e5eb106e7234eb34ecf0db/CleanShot+2025-12-24+at+16_15_49.png?expires=1794967200&signature=996e1d37a37228c032acf53eacab7253e92dbc8a5d855614a8e27155ffe7b5fa&req=dSknFMh2m4dbUPMW1HO4zU99rqh4cIwNpN%2FHgMwNYCpY2zp%2B8byKSVgI6qcl%0Aj9PP%0A>
 
- 
For example if we want to assign the user "Admin Admin" the administrator role via the custom attribute:
​
- 
You would need to select them from the directory, and click user details once their profile page loads: 
​
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902073681/cc4b5bcaf98dcad3febeb1e7757a/CleanShot%2B2025-12-24%2Bat%2B13_47_02-402x.png?expires=1794967200&signature=ccd5e12e18ade165ad37b8e1b52fdf0511d9fffd8b751d89e10d61833f22f2ae&req=dSknFMl5nodXWPMW1HO4zScF8wQGfOcQr64cjwlFFffNtvXzXxeFlQdfEMwR%0A4dGA%0A>

​
- 
From there scroll down to the custom attribute you created and add the Admin role ID value from Vanta to their custom attribute and click save
​
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902085229/2a72ead76f804eb68103a9e66e4e/CleanShot+2025-12-24+at+14_01_51%402x.png?expires=1794967200&signature=4a8c0ec1f1e3e70bfb4b264a6bba341df27196d9b69b78f9ac7bb00dc4cb1d60&req=dSknFMl2mINdUPMW1HO4zcQcpmTn3MHeoAmLeVz63EsccR15UQBnpi95LzxU%0ASG8D%0A>
 
- 
Another option is to export a CSV from Google, populate the role values for the desired users, and then re-upload the file to perform a bulk update. 
- 
Google provides documentation on this process with additional details. <https://support.google.com/a/answer/40057?hl=en&fl=1&sjid=8735962860013659859-NC>
- 
If you encounter any issues while using this method, you may need to manually assign the role IDs as a workaround, or reach out to Google Support for assistance, as this functionality is managed by Google.
 

## Step 3: Configuring SCIM
This step assumes that your users have been organized into role-based groups and if you are using custom roles, the users with said roles have been assigned their roles via the custom attributes configured in Step 1. 
- 
Head to Vanta and head to the settings page by clicking the gear icon on the top right, selecting Login & Security from the second left hand menu and going to the User provisioning table to turn on SCIM 
​
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902087810/fd82d693627cae1cdcae93b40442/CleanShot+2025-12-24+at+14_05_19%402x.png?expires=1794967200&signature=c055c79866eb41122cd1f846cc49effab60ddc9695e83f10c6f1276c896b3a0c&req=dSknFMl2moleWfMW1HO4zcOH6m1URoZ1f7Y4Qya1wk4BqthhF1qvJVs2jgbj%0AsnZu%0A>
 
- 
Select Google Workspace
​
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902089422/a6ae1657191d259c21d5a209e8df/CleanShot+2025-12-24+at+14_07_11%402x.png?expires=1794967200&signature=afe8c058fc9dff5c7dfbf0e7773106ec9ff28f3c7702f44eb11d6f3c33b11474&req=dSknFMl2lIVdW%2FMW1HO4zeIYPhMK0FMW4Urh0BYqI1QQEjbMl0FLqy7hLA%2F%2B%0ACbQ%2F%0A>
 
- 
Enter your domain name and click Allow Access or choose the second option if you want to choose from all Google Workspace accounts:
​
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902090157/238ae8ec1c1ac6afda05ec10b4d3/CleanShot+2025-12-24+at+14_07_48%402x.png?expires=1794967200&signature=b7b1f4e208db142e4ccb4371a14318b9a43cbea2f61d04964cc2b932bd6de0f6&req=dSknFMl3nYBaXvMW1HO4zZo42aMBwdccC4DRMO3%2Fu3yH%2Bgx6%2FxOEv9WHJSGE%0AOTdu%0A>
 
- 
Grant Access to your Workspace
​
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902090776/4d4c573d4cef410bdbeaf287160b/CleanShot+2025-12-24+at+14_08_51%402x.png?expires=1794967200&signature=d76c737f02431770803c980b06d86e973614de3998f212f3503b9121ff8c0db5&req=dSknFMl3nYZYX%2FMW1HO4zdUYxpwUPZ4D%2FqVY0eJJOGotqikPbfxY3ByIpP6n%0AP3zg%0A>
 
- 
If you setup a custom attribute, you will then need to search for it under customSchemas and select it in order to let Vanta know what attribute to check to determine a user's role. Once selected chose save custom attribute. 
​
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902092687/94423c37f0c5e30a4593c2abb841/CleanShot+2025-12-24+at+14_11_11%402x.png?expires=1794967200&signature=72ccce26c31b66da2eddaab4e3c846cc74ae450e2fe42ff34996863f8d1a0326&req=dSknFMl3n4dXXvMW1HO4zWh9RFpULGlhMKVWAgralAsiBHixrqQsnZ4bukby%0Ae07%2F%0A>
 
- 
If you did not setup a custom attribute, leave it blank and click save custom attribute.
- 
If you did setup a custom attribute but do not see it, please confirm there is a value to the custom attribute to at least 1 person. It can take up to 30 or more minutes for this change to sync through. 
​
- 
Next select the groups you want to sync from google workspace, you can select individual groups or an option to sync all groups:
​
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902096740/1727de12a0dd9f8de923c53f21ab/CleanShot+2025-12-24+at+14_14_26%402x.png?expires=1794967200&signature=f609bdd2f58a19d084f97768f48c72c3f2ac6d810333b86e682d92db40d2884f&req=dSknFMl3m4ZbWfMW1HO4zXPaB3nK8LyRovhx9Zh5K0cg5mxKVbvfHqIZgfVl%0AYW0X%0A>
 
- 
If you did not configure a custom attribute you will need to specify which role to assign to each of your selected groups. This is why it is important to have predefined groups for your desired roles. For example in the screenshot below the Vanta Employees (SCIM) group has every user who should be assigned the employee role, and we will assign that role to said group:
​
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902172890/1d37cdb5f6d3bae331eeef607bf6/CleanShot+2025-12-24+at+15_55_22.png?expires=1794967200&signature=3b22c07214da5730c12918118255786fa2dbbbcb52217e16e8b831879ae5fa95&req=dSknFMh5n4lWWfMW1HO4zXus0xE4Dhx8wVljnP34vn9JmRsaYUMB9dgaf8ZP%0AkTVW%0A>

If some users will get default Vanta roles while others are assigned custom roles, and you haven’t set the default roles through attributes, you can assign the default roles at this step. Keep in mind that custom roles won’t appear in the dropdown menu—this is why you set up a custom attribute. For groups containing users with a custom role, you can leave the role option set to “Not Assigned.”
​
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902170551/b5301a12fd680e3aecba3e412460/CleanShot+2025-12-24+at+15_50_04.png?expires=1794967200&signature=eb7c405f163faaeaf17492155d85e1aeae5b8ad2dc9bb1c3c7d41f0d3ad701e3&req=dSknFMh5nYRaWPMW1HO4zeQtsKuWkuFiYNt3AuAuDNv4g4a3FQ4bDckGc1e0%0Am9AG%0A>

​
- 
Once complete, click continue
​
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902177046/54a73c23573ffa2866b7296fa06f/CleanShot+2025-12-24+at+16_01_36.png?expires=1794967200&signature=f37cf031e1df635f8295b6d97abfa264ab55f84858b29ea8b70f7f8c4abf9d47&req=dSknFMh5moFbX%2FMW1HO4zR0UPr%2B8EO4w6g%2FRM7wfcsLVPnM0dD8b7nUD3fUy%0ATQ41%0A>

​
- 
Click next and select Start sync:
​
[image 20]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902097425/4cd05cd9a9f693741bbd5795cf56/CleanShot+2025-12-24+at+14_14_36%402x.png?expires=1794967200&signature=a7d468e00fb19da8bd53cbbad6cf090afd0b4b4f59ca8775f842a5ddfdb7026c&req=dSknFMl3moVdXPMW1HO4zaLTs8zqYPiK0IESWr8j%2F27m7iFVAYA76s9lcHa2%0A%2BLdq%0A>

​
- 
Once complete you can click view directory to see the user count and group count:
​
[image 21]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1902127999/d790302899a4b4aff9cbb6522b40/CleanShot+2025-12-24+at+14_52_58%402x.png?expires=1794967200&signature=dcd9fbd964d82ec08c851c213e54dd5b6e64b91b2849475308e74547639aacae&req=dSknFMh8mohWUPMW1HO4zYjLbfImx6onoWQn%2F7IOhx46TiTtI3G2vh2REGLb%0ANM7J%0A>
 
- 
If your administrators do NOT have access to Vanta it is likely due to the fact they are in a group that does not have the Administrator role assigned to it, or their custom attribute does not  have that value set.

## Images

- [image 01] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--01.png
- [image 02] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--02.gif
- [image 03] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--03.png
- [image 04] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--04.png
- [image 05] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--05.png
- [image 06] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--06.png
- [image 07] ../../images/ux/settings/connecting-vanta-google-workspace-scim--07.png
- [image 08] ../../images/ux/settings/connecting-vanta-google-workspace-scim--08.png
- [image 09] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--09.png
- [image 10] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--10.png
- [image 11] ../../images/ux/settings/connecting-vanta-google-workspace-scim--11.png
- [image 12] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--12.png
- [image 13] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--13.png
- [image 14] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--14.png
- [image 15] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--15.png
- [image 16] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--16.png
- [image 17] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--17.png
- [image 18] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--18.png
- [image 19] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--19.png
- [image 20] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--20.png
- [image 21] ../../images/integrations/google-workspace/connecting-vanta-google-workspace-scim--21.png
