# Connecting Vanta & JumpCloud (SCIM)

Source: https://help.vanta.com/en/articles/17505809-connecting-vanta-jumpcloud-scim
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Through the Vanta and JumpCloud SCIM integration, you can use JumpCloud to manage your employees’ sign-in access to Vanta. The instructions in this article are specifically for configuring SCIM. This setup does not create personnel records on the People page or import devices into Vanta.
​
 

## Step 1: Enable SCIM in Vanta
- 
Open the Vanta console and click the gear icon on the top right corner
​
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859144531/8f1e9c54efad1eab0c0ae1817b7c/CleanShot+2025-12-01+at+13_45_51%402x.png?expires=1794967200&signature=9878207375ad098eaf54508f11ffcb48090d90cc56f043d6ddde511e657d062d&req=dSgiH8h6mYRcWPMW1HO4zeIaEslj1eqNiZ0iDdDxrAe3%2F4lKvZaYVr5FJHU%2F%0AAZT%2F%0A>
 
- 
Then click the Login and Security option on the left hand menu
​
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859146944/1d18b8da150279ac9e5aa4064e39/CleanShot+2025-12-01+at+13_47_07.png?expires=1794967200&signature=28689daba1425331a811f3b2a16987c997a066df199e3fc65be44a08041b8165&req=dSgiH8h6m4hbXfMW1HO4zQAAujFZ7K0U6pTff3aKPD%2Fx2l8MYRThv7PK8%2BCs%0ACLLu%0A>

​
- 
Scroll down to the User provisioning section and check Enable automatic provisioning. Then select Provision via SCIM to enable SCIM for your account, and click Apply to save the changes
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2724711141/2403401cc1a46e66ffd80e0945fc/CleanShot+2026-10-09+at+11_28_09%402x.png?expires=1794967200&signature=c183b9cc6929e28dec78e02815c938e210b8603de8b376c6ba65f6e57c5e1c15&req=diclEs5%2FnIBbWPMW1HO4zcGLncQBRSpZPDc3Sj44sZHwjBRPSl3vnfvPW9LS%0AY%2FZD%0A>
 
- 
You’ll see a message explaining that any users who cannot be provisioned through SCIM will need to be managed manually. This means that if a user is not in your SCIM directory, you’ll need to add or remove them from the Users & Permissions page to control their access to Vanta. Click Enable to continue:
​
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2724708505/79f5b438f5cf5369e2822713396e/CleanShot+2026-10-09+at+11_30_17%402x.png?expires=1794967200&signature=2beeedcfa860d6a2b4476444327e590a795cd207b9acff25af352a57d007fece&req=diclEs5%2BlYRfXPMW1HO4zdAKtA1MN%2BkBIQlFi7bu31nPo%2FGjQ3CkTcr%2FYTEa%0AvjxL%0A>

​
- 
Next right click and open the View the Admin Portal in a new tab
​
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859142196/2088425a0ae396d9b558cc6851fd/CleanShot+2025-12-01+at+13_44_38.png?expires=1794967200&signature=e5e9a0c62b870eddce503600ed174cf1717ff74e052c1357025b5ddcb8b491d4&req=dSgiH8h6n4BWX%2FMW1HO4zZx3tzcoL8KlJkwDclmqYopVfAkbh8NuUD%2FAtEh3%0AdyTY%0A>
 
- 
Search for JumpCloud and select it from the Select your identity provider drop-down menu. This will take you to a page with instructions on how to configure your Jumpcloud Application:
​
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2724727019/351ef3d51369580ec78d0ba893bb/CleanShot+2026-10-09+at+11_41_46%402x.png?expires=1794967200&signature=a328de659db4f9d02fdf4d08abf95d445a73f5e62d3f325e34236ac723dde9b6&req=diclEs58moFeUPMW1HO4zR0kAczDYANNr3F%2BUe8LHwR0gWOfoqh0tQqG0HlN%0APlmY%0A>
 
- 
Do not close this tab, we will be configuring an application in JumpCloud next and will need values from the Admin portal for said application. 
​

## Step 2: Enable Provisioning on your Application
You need to have an existing application. If you haven’t created an application, you’ll need to first create a custom SAML application in JumpCloud. JumpCloud only supports configuring SCIM provisioning in an existing SAML application
- 
Go to your application, select the Provisioning tab
​
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735356180/3e55c0962a28dce37c5187499eb3/CleanShot+2026-10-12+at+15_44_47%402x.png?expires=1794967200&signature=66d6bf15d8f65c1cabd8c3c5700757763a8a7ba24d9e3133b64b09ee662224ff&req=dickE8p7m4BXWfMW1HO4zRO8yZ2i8KBWS7tpYQ3H2eYRiQ2TAu4MeoUX1hLV%0AVmXO%0A>

​
- 
Next go back to the WorkOS Admin portal tab and move on to step 2. You will be presented with your base url and token key. You will copy these and paste these into the appropriate fields in JumpCloud: 
​
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2724750784/29abefa83bf2adec445b0def1125/CleanShot+2026-10-09+at+11_51_42%402x.png?expires=1794967200&signature=f23da6cac6277d9fd5f48daf064cdfc538eec12228d0dd61e38449c85c54dc6f&req=diclEs57nYZXXfMW1HO4zYdVwejW9VVSCOTB3hueXNt5Nu3zmt9HJM1ngsEd%0ASkR7%0A>
 
 
- 
Copy the values from the WorkOS Admin Portal, then head back to JumpCloud and scroll down to Configuration Settings. Under API Type, select SCIM API, then paste the WorkOS values into their corresponding fields.
​
​
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2737844339/afcface168cc0c7ba8d263854f52/CleanShot+2026-10-12+at+14_48_35%402x.png?expires=1794967200&signature=2cd189fe9f9ec8fd310259118e37974f79cf12b07679bbbdf785c54cc2143a70&req=dickEcF6mYJcUPMW1HO4zSaidQqBHh%2FIzKA4yomxl3CFDwqCLx735Q1vOh0%2B%0A1mS7%0A>

​ 
- 
Next, scroll down to the Test User Email field and enter an email you can use for testing. Then do the same for the Test User Group Name, Source User, and Source User Group fields.
​
​
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735215811/461b1d8911379780a232b417e80b/CleanShot+2026-10-12+at+14_48_35%402x.png?expires=1794967200&signature=2ce2d1193dbf98dab004a55f18a26bdb25136ad8225034d692d47af4350561fb&req=dickE8t%2FmIleWPMW1HO4zbTNVC0SdSYGEN609nuvc1Y46vlnecVfppWUCyiZ%0AaYyN%0A>

​
​
- 
Click Test Connection.
- 
You should see a message that says, “Connection successful. Follow the next steps to finalize the integration.”nIf you do not see this message, double-check that the values you entered are correct.
​
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2724759058/f52ff61f984559bd8293f8f7f270/CleanShot+2026-10-09+at+11_50_30%402x.png?expires=1794967200&signature=7dd70b605f20aa1ca01fee2b132855cdb68681f8a0b8a92ab22a19c98d35be71&req=diclEs57lIFaUfMW1HO4zVN9Bkr5USDLgx3%2FOsbvyb%2BNRywhvrlBiFomPnsw%0A2tiF%0A>

​
 

## Step 3: Configure Custom Attribute 
You can use a custom attribute in JumpCloud to automatically assign Vanta roles based on the JumpCloud groups a user belongs to.This step is optional. 
 
If you prefer, you can just import the groups and handle the role mapping later in WorkOS instead. You can skip this step if you plan to use that method.
- 
Scroll down to go to Export Attribute Mapping section and then click the drop down menu.
​
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735221824/b2fc53ab4a5f0a87f0d5703c1d36/CleanShot+2026-10-12+at+14_51_00.gif?expires=1794967200&signature=4b47deab546c8ff31386ca0ea2db3904991dc2893735a10cba26ed9e35962fae&req=dickE8t8nIldXfMW1HO4zYTfSEiw%2BtGm6TWvqqffftTlJJjtLlYEkz1gWFpT%0AJrLd%0A>
  
- 
 Click the Edit button 
​
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735234170/8c37d7f601da5f006e6e885d7792/CleanShot+2026-10-12+at+14_55_17%402x.png?expires=1794967200&signature=378a2ae4a22daaecca96df0a2ae5b8c7a9fe662ab7e950ef318d25cc6912f1b0&req=dickE8t9mYBYWfMW1HO4zWW1SLsc7YhbbYzSraIi%2FuNXGnj44HbmObY4bd6C%0AGTOo%0A>

​
​
- 
Scroll down and select +Add Attribute: 
​
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735236118/75206d8897a9da2e6ecd14a5c3fe/CleanShot+2026-10-12+at+14_55_56%402x.png?expires=1794967200&signature=97b763a409b7e0f516dba949e2a0a3373754700b3637a5a707c32e1cd8e4acf4&req=dickE8t9m4BeUfMW1HO4zRszBl77QCXOruZnlRdRSOFP93BPYKDzpVbywxlE%0ACuc6%0A>

​
- 
 Then select expression:
​
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735259822/295243647ae244ada1bfe3b0a875/CleanShot+2026-10-12+at+15_06_18%402x.png?expires=1794967200&signature=d81c14efcb8527110b27e564da556862b6cf06980ba72208c8c728b7e1c3ba63&req=dickE8t7lIldW%2FMW1HO4zYFT3Ge0xVKOYDprZ9fgfLLKrYn7vVMGa1KYdykP%0AAfvO%0A>

​
- 
On the SCIM Attribute column click the box and select Custom User Attribute:
​
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735260920/33ebd3950b36316f0fbf6d85a061/CleanShot+2026-10-12+at+14_58_34%402x.png?expires=1794967200&signature=229687d60bdd17e6717e2a1460a4f579d4fd4c62301cf5d78f633ae08bf1f447&req=dickE8t4nYhdWfMW1HO4zR5oNu2Cf0FGmn%2Bb7uAshCV0mnfS0elA%2BGUs6h3J%0AFxPi%0A>
 
 
- 
Enter the role of the custom attribute
- 
We will use rbac_role_id for this example but you can name it whatever you like: 
​
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735247647/84929c40c6902008b67041f793f7/CleanShot%2B2026-10-12%2Bat%2B14_59_27-402x.png?expires=1794967200&signature=b78b2a41dbe4bf976e43152bb8584b9f67383d4f89f95eced18db2fa29aaf607&req=dickE8t6modbXvMW1HO4zRW6VtOvv5hwT3v%2F0D0dVt%2BDhjYg3LgG4YpU8nR7%0AJLgF%0A>
 
- 
For the JumpCloud Attribute  box you will enter a modified version of this expression:
​isMemberOfAny(jcGroups, "GROUP_ONE") ? "RBAC_ROLE_VALUE" :
isMemberOfAny(jcGroups, "GROUP_TWO") ? "RBAC_ROLE_VALUE" :
isMemberOfAny(jcGroups, "GROUP_THREE") ? "RBAC_ROLE_VALUE" :
"0000005ddeface0000000003"
 
 
- 
JumpCloud reads the expression from top to bottom and uses the first group the user matches. So if someone belongs to multiple groups, whichever group is listed first will take priority. 
​
​
- 
Replace GROUP_ONE, GROUP_TWO, and GROUP_THREE in the expression above with your actual JumpCloud group names. We recommend organizing the groups based on the role users should have in Vanta, for example one group for Admins, another for Editors, and so on.
​
​
- 
Replace each RBAC_ROLE_VALUE with the correct Vanta role value. You can find these under Login and Security → User provisioning → Roles in Vanta.
​
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735287557/f650fb7d41024735994e27148f7f/CleanShot+2026-10-12+at+15_16_22%402x.png?expires=1794967200&signature=080923da2cf64ccdea265c6443bf531279d8046d3ea17f79e7a9bda058b848ca&req=dickE8t2moRaXvMW1HO4zdKW0OJxHDWs5mRkDBF%2BC9B4lY0yOVYj1WCB5%2BNP%0Aasl6%0A>

​
- 
For example this expression below: 
​isMemberOfAny(jcGroups, "CHRIS_SCIM_ADMIN") ? "0000005ddeface0000000001" : isMemberOfAny(jcGroups, "CHRIS_SCIM_EDITORS") ? "0000005ddeface0000000002" : "0000005ddeface0000000003"

Anybody in the CHRIS_SCIM_ADMIN  is assigned the Vanta Admin role. Anyone in the CHRIS_SCIM_EDITORS  is assigned the Vanta Editor role. Anyone who does not match either group is assigned the Vanta Employee role. 
​ 
- 
Click Update once you have pasted your expression in
​
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735257105/68c818623d32263d75106cdf7b43/CleanShot+2026-10-12+at+15_05_15%402x.png?expires=1794967200&signature=4cfd81dba6ed019ed03a0f01a8ec4781f250f846b3139c1d24837e060e4c7060&req=dickE8t7moBfXPMW1HO4zYPdrW3rhWJnO7uwgH9pUrmgBFlnA2sjWJizp3F2%0AW8%2F1%0A>
 
 

## Step 4: Assigning SCIM application in JumpCloud
You can now add your User Assignments for SCIM Provisioning:
- 
Select the User Groups tab and then click the checkbox to assign the app to your desired groups and hit save once complete.
​
- 
If you chose not to set up a custom attribute, you’ll need to select the JumpCloud groups you want to map to each Vanta role. We recommend organizing the groups based on the access users should have in Vanta, for example one group for Admins, another for Editors, and so on.
​
[image 20]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735377057/eb6e05d0f61cd3d7692e860b8c0a/CleanShot+2026-10-12+at+15_22_42%402x.png?expires=1794967200&signature=2015732d8c70e6dc5778386b4d9afeed2cf00000dafe7f640a4fe79df413c37a&req=dickE8p5moFaXvMW1HO4zf%2FD9xwHYsAlajDO%2F4ZwDRyxlirY4y%2FXM5i4Ihk4%0AN6ZJ9mI6tPAbZm%2BV4zw%3D%0A>
 
- 
Next head back to WorkOS and click Continue 
​
[image 21]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735313675/f0fa9ee983b8363db8f046cb7378/CleanShot+2026-10-12+at+15_28_24%402x.png?expires=1794967200&signature=2fd7a33b1c2935be512ac38a897e8458434275a5284e24d3fa8892b008e2cef7&req=dickE8p%2FnodYXPMW1HO4zZXk%2BCh6mSz4fyz1mqC9jb9yxAfE2gEoNbXXfh8g%0A8M4i%0A>

​
 
 

## Step 5: Select Custom RBAC Attribute 
If you did not configure a custom attribute continue to step 6. If you did setup a custom attribute please continue. 
- 
On step 4 of WorkOS, select the dropdown menu on the Directory provider value field, and look for the custom attribute you created earlier:

​
[image 22]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735316654/f6a6bc3a7b0c119ca0ea73e35dd6/CleanShot+2026-10-12+at+15_29_26%402x.png?expires=1794967200&signature=585c92ca1a81d2a6ab8e896fc27c674a7cada77f3d3af619515d3c55e5eb3b47&req=dickE8p%2Fm4daXfMW1HO4zZ2z65HOvc6gLCQp8WUq5wnLWE4gq2yRuG2%2FsYGL%0AbDUi%0A>

​
- 
Once selected, click continue to move on to step 6
​
[image 23]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735319348/f257410809ad754d0e44652ac0b7/CleanShot+2026-10-12+at+15_30_55%402x.png?expires=1794967200&signature=1d9299a84fbf804fc50b554653e0f80f3cfba47d4eec8f23afd87c5ba651cc7f&req=dickE8p%2FlIJbUfMW1HO4zd7GXtYOr%2BUPQHxwHARPIBdroY72K7tiQXSanawy%0AeOzd%0A>

​

## Step 6: Map Groups to Roles in Admin Portal 
- 
WorkOS allows you to map the groups synced from JumpCloud to specific roles in Vanta. Click continue to skip this step if you are using a custom attribute. 
​
[image 24]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735323775/307dcecba2a031d200dba9421169/CleanShot%2B2026-10-12%2Bat%2B15_31_36-402x.png?expires=1794967200&signature=4104bb37170bf798443b1e0387f00e2f5a89d2727f89d7981585bb839a137a84&req=dickE8p8noZYXPMW1HO4zZYA91EyGyl1uA%2FMvjXRvo%2Fu6Vyxo85Iqm7QEA3B%0A0jEn%0A>

​
- 
If you chose not to set up a custom attribute, you’ll need to map the Vanta roles to the groups synced from JumpCloud. This method does not support custom Vanta roles.
​
[image 25]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735327775/41c48af33c46aadd9640192a5dea/CleanShot+2026-10-12+at+15_34_09.gif?expires=1794967200&signature=2a43abcec0d9f573dfd52e92bdd71c6f75c0782d5129c33c58409edacc2fa11a&req=dickE8p8moZYXPMW1HO4zXeedEEC%2B%2ByPITV9kjaO7MoA1lTaTO%2Fq%2FxTxzKTB%0Acehb%0A>
 
- 
Click continue to move on to the next step after you complete your mapping. 
​
 

## 
Step 7: Sync your Directory Connection
- 
Click the start sync button to finish the setup of SCIM 
[image 26]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2735353933/e26dc83d2c5c0967148489f1407c/CleanShot+2026-10-12+at+15_42_38%402x.png?expires=1794967200&signature=d4235d0b65c674777634dc8d8698a7eafe0bce6f6820e52b9a5668d8ac8b2366&req=dickE8p7nohcWvMW1HO4zTIPCa%2B%2FkEOx4e0FRbowvSc4BsJzKuFocGgJk89T%0Aa74hE8XnzyuR%2Bcjt2o8%3D%0A>
 

##

## Images

- [image 01] ../../images/ux/my-work/connecting-vanta-jumpcloud-scim--01.png
- [image 02] ../../images/ux/settings/connecting-vanta-jumpcloud-scim--02.png
- [image 03] ../../images/ux/settings/connecting-vanta-jumpcloud-scim--03.png
- [image 04] ../../images/ux/settings/connecting-vanta-jumpcloud-scim--04.png
- [image 05] ../../images/ux/settings/connecting-vanta-jumpcloud-scim--05.png
- [image 06] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--06.png
- [image 07] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--07.png
- [image 08] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--08.png
- [image 09] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--09.png
- [image 10] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--10.png
- [image 11] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--11.png
- [image 12] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--12.gif
- [image 13] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--13.png
- [image 14] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--14.png
- [image 15] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--15.png
- [image 16] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--16.png
- [image 17] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--17.png
- [image 18] ../../images/ux/settings/connecting-vanta-jumpcloud-scim--18.png
- [image 19] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--19.png
- [image 20] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--20.png
- [image 21] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--21.png
- [image 22] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--22.png
- [image 23] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--23.png
- [image 24] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--24.png
- [image 25] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--25.gif
- [image 26] ../../images/integrations/jumpcloud/connecting-vanta-jumpcloud-scim--26.png
