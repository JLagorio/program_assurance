# Connecting Vanta & Okta (SCIM)

Source: https://help.vanta.com/en/articles/12976668-connecting-vanta-okta-scim
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Through the Vanta and Okta SCIM Integration, you can create a connection to import your employees seamlessly into Vanta. 
 

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
Scroll to the User provisioning table and click the Enable Toggle to turn on SCIM for your account 
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859139758/8759e975362b52839143c835c21f/CleanShot+2025-12-01+at+13_43_07.png?expires=1794967200&signature=9306bf0c9a80635b979b0013c1ed9cf58c6133843ec6404969fa4023c97c967d&req=dSgiH8h9lIZaUfMW1HO4zUOxZhmdTrc7ixaxMZXqw3cE7IhxYOmi3NQdTp1S%0AsvCp%0A>
 
- 
Next right click and open the View the Admin Portal in a new tab
​
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859142196/2088425a0ae396d9b558cc6851fd/CleanShot+2025-12-01+at+13_44_38.png?expires=1794967200&signature=e5e9a0c62b870eddce503600ed174cf1717ff74e052c1357025b5ddcb8b491d4&req=dSgiH8h6n4BWX%2FMW1HO4zZx3tzcoL8KlJkwDclmqYopVfAkbh8NuUD%2FAtEh3%0AdyTY%0A>
 
- 
Search for Okta and select it from the Select your identity provider drop-down menu. This will take you to a page with instructions on how to configure your Okta Application:
​
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859149635/8b4296745016879d04123e890dbd/CleanShot+2025-12-01+at+13_48_56.png?expires=1794967200&signature=48854a272595beeba0e4275c9a1848ec2353d98000eb2df71d23658125941860&req=dSgiH8h6lIdcXPMW1HO4zRYGs2zvb%2BV1SXjLWbh6VXLfNYKWZ0ZOySlix%2FlC%0ARbW6%0A>
 
- 
Do not close this tab, we will be configuring an application in Okta next and will need values from the Admin Console for said application. 
​

## Step 2: Create SCIM Application in Okta
 
If you have already setup an Okta SSO Application from the Marketplace (see example below):
​
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2006015088/f7f69212081531902107eafce2fc/CleanShot+2026-01-29+at+15_53_32%402x.png?expires=1794967200&signature=46bb73943b36be3326c2ddc59218264ae9b56ded2b66c192a4d28d60d975cbf1&req=diAnEMl%2FmIFXUfMW1HO4zWJBeNIuiKwR0ghWH6lIDcMgM2P3hPZhOhSaWVxb%0AnRMai6DxUjwk%2FRDwbXs%3D%0A>

You have the ability to use the existing Vanta SSO app for user provisioning, but it has limited functionality. Vanta strongly recommends creating a dedicated SCIM app instead, because the SSO app does not support Push Groups. 
​
A dedicated SCIM app enables full support for group sync and team management in Vanta.If you want to continue without Push Groups, skip creating a new SCIM app and proceed to Step 3. To follow the recommended setup, complete the steps below: 
- 
As an Okta Admin, log into your company's Okta account in a new Tab
- 
From the left-hand navigation panel, select Applications
- 
Select Browse App Catalog
- 
Search for SCIM 2.0 Test App (OAuth Bearer Token) application and select it 
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859151686/d616cfa117fb587af58617375f68/CleanShot+2025-12-01+at+13_50_08.png?expires=1794967200&signature=4caf1ae52e4802ee36cb374436f9bc7b7f7a5ed36e6c1d67c80e3e49bb961578&req=dSgiH8h7nIdXX%2FMW1HO4zXjQZYlLCD487jF7MbZeTXUIFejkgjeqbiFdYInR%0Az6LlroYT1yk28Hch4WQ%3D%0A>
 
- 
Select Add Integration
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859152860/362cc8e5b05daa44f5fe9d50644e/CleanShot+2025-12-01+at+13_50_54.png?expires=1794967200&signature=601c22e89176eb9e5c9a6095a8a34a9ccf99109749d646573f5cfff3c6a2a1cf&req=dSgiH8h7n4lZWfMW1HO4zYLyEnlLV09YoQz4XJkW4WoX%2B4WbrhxHNL5w0sia%0Ardy2uEIqT1m%2B%2F%2F7cV14%3D%0A>
 
- 
Title the App integration name
- 
We recommend using a name that signifies its relation to Vanta
- 
Select Next
​
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859155350/cba2db72a5366c26ded80d98e7cd/CleanShot+2025-12-01+at+13_52_21.png?expires=1794967200&signature=24a795e2d035ed8e380ab2ac194bdf161f844cb6da9858c81e53304544a4f650&req=dSgiH8h7mIJaWfMW1HO4zVgxVcin3JCsIaaEd8uj1CsDdMgB5N7CM7R2KSlY%0A9RIZ%0A>
 
- 
Many applications will work with the default configuration that is set on your new application. You should be able to leave the Sign-On Options as default and click done.
​
- 
 If you require any additional configuration for your directory, such as configuring attribute statements, do so on the Sign-On Options page.
When you have completed configuring the application, click Done.  

​
 

## Step 3: Configure the API Integration in Okta
- 
In Okta go to your application, select the Provisioning tab and then click Configure API Integration.
​
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859168935/2aee61cb9811b4965edae2f05de1/CleanShot+2025-12-01+at+14_00_02.png?expires=1794967200&signature=d2aaa458c4d2ba276051b0d06226e4d71f7fb33384ed6bcf20d762e66d8180cf&req=dSgiH8h4lYhcXPMW1HO4zfMphDtQXGuIiJD4oFO0peMBjaBvVtpJcISzP1qZ%0ANCW4%0A>

​
- 
Next select the Enable API Integration option.
​
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859180624/87c695eaad05869e480dc3dfe8d1/CleanShot+2025-12-01+at+14_06_25%402x.png?expires=1794967200&signature=e0234e4d8d247aa17fb27b35b03a25fbaaedc17514b4e2ba58a4a354cac75783&req=dSgiH8h2nYddXfMW1HO4zb9lPbtAPEVn2NyyNUmsNcaY6DF41vvOD8AuRsaz%0Aho5V%0A>
 
 
- 
 Head back to the Admin Portal tab (from Step 1)  and in that menu head to step 2. On the bottom of the page you should be able to locate the SCIM 2.0 Base Url and OAuth Bearer Token fields. 
​
​
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859173788/8eef60bcbf22d6e7bc72c0bde93c/CleanShot+2025-12-01+at+14_02_20.png?expires=1794967200&signature=a9de0a1e273750616eb084639dcca75d73edc73538c46e805f5354c072fdfa96&req=dSgiH8h5noZXUfMW1HO4zQKQn%2F8hSWAg15x8IBZMeX6PvIrxdDhhus3DBHq%2F%0AIin3%0A>

​
​
- 
Copy the values below and paste them into their respective fields in the Okta admin console
​
​
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859175233/6f22de244bf79040f3cfe6a8c61a/CleanShot+2025-12-01+at+14_03_24.png?expires=1794967200&signature=2403106b45e8cb9f20ebcd2d5843f205dc902fe548fc0a9db7fd31b8cce20183&req=dSgiH8h5mINcWvMW1HO4zYTmRbrBCb3%2BqrDC05slfGWWTpGaIHzpkSC5SlUg%0APVL7%0A>

​ 
- 
Click the test API Credentials button
- 
You should see a "SCIM 2.0 Test App (OAuth Bearer Token) was verified successfully!" message. If you do not please confirm the values you provided are correct.  
​
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859185986/ca486407182409638c342f3df64f/CleanShot+2025-12-01+at+14_09_32.png?expires=1794967200&signature=24e70442a284f1996e28f6cd55c111fecf20fc9a8bbe96f22f71ce1f256c0378&req=dSgiH8h2mIhXX%2FMW1HO4zctT2iXw0Ihd1PiMqniE8BRed25EmK7MG13PBZCF%0AnoCX%0A>
 
- 
Click Save and then head back to the Admin Portal tab in your browser. 
 

## Step 4: Configure Provisioning Actions
- 
In the admin portal go to step 3
​
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223415144/52cf86c7319807e1676e28238187/CleanShot+2026-03-31+at+13_13_34%402x.png?expires=1794967200&signature=b2c6b7965d6d4db5a0bb7000bc60ef0aa611108c16c5d9fdf6bab56aae5e2fbd&req=diIlFc1%2FmIBbXfMW1HO4zWMXuoMmre7JAmx6JMko8uuOrRC4DstmE2XMkaiu%0At4hS%0A>
 
- 
 This will require you to go to Okta, head back to the Applications page and search then select the SCIM App you created or the Vanta SSO App if you are using it to provision users.
- 
Select the Provisioning Tab and then Select the To App tab in the left navigation menu.
- 
 Click Edit
​
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859245341/d4a701c74e8ef3fe0a8fe4a5e664/CleanShot-2B2025-12-01-2Bat-2B14_39_34.png?expires=1794967200&signature=19eca5d7ce1a06a0ba2cd5954c90c681077d3b5190f5f92c753142c558050f97&req=dSgiH8t6mIJbWPMW1HO4zdHWIDRcQJ%2Brkym8dq8ZK8loUM3nbJCoF0Y7PwGp%0AVH76%0A>
 
- 
Enable the following actions and Select Save:
- 
Create Users
- 
Update User Attributes
- 
Deactivate Users
 
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223388081/8994250bdb8f1c93ea33c171c308/CleanShot-2B2025-12-01-2Bat-2B14_45_02.png?expires=1794967200&signature=e51e76934224eed486714b7b60f895652b2ed5313e8409d2d09f46c7ddfd9087&req=diIlFcp2lYFXWPMW1HO4zSsRWeGY8XJDceb3c4azWooTcQq1C%2Fxo%2BH3y5yWM%0AYSujglzaGOtWFNQAip8%3D%0A>
 
- 
Head back to the Admin Portal tab and click the continue button on the bottom of the screen
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223426453/8acc041a702eb7d792c7681903d6/CleanShot+2026-03-31+at+13_16_23%402x.png?expires=1794967200&signature=6ffe4f2a4a76baf1b55553b72d42cef5ca7303f5f67088134885354d9e9bd3fd&req=diIlFc18m4VaWvMW1HO4zX4KJOrdJiMuqnuT9nXLl2E6jGo6j%2FLXVhKN4p%2Bq%0AJpA7JSG7lDLSPzpP5bU%3D%0A>
 
 

## Step 5: Configure Custom Attribute in Okta
- 
The Admin portal is going to prompt you to Assign People and Groups to the app. Do NOT do this yet, the custom attribute needs to be setup first.
- 
Return to Okta and on the left hand menu under Directory select Profile Editor and search for your application:
 
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859202930/975ac2dab7768b5be1ed6fae47df/CleanShot+2025-12-01+at+14_18_48.png?expires=1794967200&signature=bd3588ee4c7670c79b887522961722f7d7941cc041894eb6e6fc099d9e5a4b1a&req=dSgiH8t%2Bn4hcWfMW1HO4zbUiZPLJT3KjWWZHj3yzSoqzpnfqKKP8hDENh1Ns%0A1Yv1iMEnj8GWAo5S%2BPc%3D%0A>
 
- 
Select the +Add Attribute button 
[image 20]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859205783/7563a51f59255bb083c288c00b33/CleanShot+2025-12-01+at+14_20_47.png?expires=1794967200&signature=00a88adb4269e52522fe1f657209d787d63253aea94f2498c09d1da76438465a&req=dSgiH8t%2BmIZXWvMW1HO4zWo0I1mdu%2FjMiYPEZKvUn%2F%2BxtinbDW2c9bN7undh%0ASQNVTztFt4pAGfA9Isg%3D%0A>
 
- 
Set the Data type to string
​
[image 21]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859213622/8c010275093e92e307b895c30dc1/CleanShot+2025-12-01+at+14_25_32.png?expires=1794967200&signature=682b27348c0b92ab7418c6136c88459c04c78c0187cb55d219b357ea4a8a5e33&req=dSgiH8t%2FnoddW%2FMW1HO4zTaFlU80SkIC7v4ON92hoJfF5vEHKnuVYAFrr6Dc%0Ajvz3%0A>
 
- 
For the display name enter a human readable label so administrators can understand what this attribute is used for. 
​
- 
For variable name. and external name, we recommend using a name that signifies its relation to Vanta such as vanta_roles or rbac_role_id. Make note of this variable name as we will need it in a later step. 
​
[image 22]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859210173/80458dc44f25dbbcce70da880822/CleanShot+2025-12-01+at+14_23_07.png?expires=1794967200&signature=366abe8b5a860666bc4c23fc2d3348cedbfd6f3e2419fe09354f966d49bbf5a3&req=dSgiH8t%2FnYBYWvMW1HO4zQGH%2F6hkmHNDFDWlQQLleww5jS%2FKfWNfjlrleA%2Fi%0AP9Uf%0A>

​
- 
Next enter urn:ietf:params:scim:schemas:core:2.0:User for the External namespace field
​
[image 23]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859215398/7156838cd94b2559091731446596/CleanShot+2025-12-01+at+14_26_19.png?expires=1794967200&signature=91a9c34bb846766fdf2a9f83214b78dec6b769857100ff4214bb2d3f8f35c42b&req=dSgiH8t%2FmIJWUfMW1HO4zfc7j11O6zdKIWLbsuxg2WppEHppFvW55oqV8Br4%0AMJ9C%0A>
 
- 
Enter a description (optional) similar to the Display Name field this should be human readable and clear so administrators know what this attribute is used for.
​
- 
Next select the checkbox for Define enumerated list of values
 
[image 24]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859216417/e468cbf9cab028cd7ed5289b3549/CleanShot+2025-12-01+at+14_26_55.png?expires=1794967200&signature=d268ac7db6f34a4b59ed2a5d9c864db30d4fbd5a7eea201f97a0b60fe4532148&req=dSgiH8t%2Fm4VeXvMW1HO4zTpUG4taZMCilj2l0Gf8%2FVY37BHlfEue2%2Ba%2B5mic%0APKMY%0A>
 
- 
You will then have to enter a role name followed by a roleID value for each role you expect to assign to users. 
​
[image 25]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859221018/17648104a0b6f6c5aa72ad9795b6/CleanShot+2025-12-01+at+14_29_15.png?expires=1794967200&signature=207982aef2efb8e16871e9d9a695b95c3e5240865f705005c9912fb0baf0fd4c&req=dSgiH8t8nIFeUfMW1HO4zfaHlxuCvTcH8THe5%2FuZx3LNPYiw2gXRDjiQmMUS%0A4DE1%0A>
 
- 
You can find the role names, and their IDs by going back into Vanta, clicking the Gear Icon in the top right, then selecting Login and security for the left hand menu and selecting the "Roles" tab in the User provisioning table: 
​
[image 26]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859220434/66c4d914524debcbe40bd1851a6c/CleanShot+2025-12-01+at+14_28_38.png?expires=1794967200&signature=8fe7f99eb8a886dc9e23c0b050a0302314a4bad12f4e88a4ae5d1da26e7db149&req=dSgiH8t8nYVcXfMW1HO4zdD4xPnPozQpNZGfHHrM6LYDRSVpJkPIIwhFbT44%0AvnTs%0A>
 
- 
You do not need to add every single role, only the roles you expect to grant to your users. 
- 
At a minimum the Admin role needs to be granted to prevent administrators from being locked out of Vanta. 
​
[image 27]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859224412/d2b964b84cc2dacace2dbc389ac8/CleanShot+2025-12-01+at+14_31_02.png?expires=1794967200&signature=f5da82dc2c9ebf00599920be5a18637f6a741d82198941c0209e861bebd77d87&req=dSgiH8t8mYVeW%2FMW1HO4zV4GLv0Ap77ymQsAhbqUqx5yp54hd7dyqyOyWYh%2B%0AssgZ%0A>
 
- 
Lastly you need to select the Attribute type, this is telling Okta where the role will be specified. This is either done individually on a users profile directly, or at the group level.  
- 
We suggest adding it at the group level for less overhead.
​
[image 28]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859226607/2d4d570c2dd328156b24afd551cd/CleanShot+2025-12-01+at+14_32_23.png?expires=1794967200&signature=060613a269eb1ed44a90b91db3b79b301d4a1e49f781a653207fab0858883e4c&req=dSgiH8t8m4dfXvMW1HO4zVKZS61k%2FT6abcE%2BSGWGZju7p5zAvARtqi8ssNNz%0AMviO%0A>
 
- 
Click Save once complete

##  
 

## Step 6: Assigning SCIM application in Okta
You can now add your User Assignments for SCIM Provisioning:
- 
Go to your SCIM application in Okta
- 
Select the Assignments tab and click Assign. 
- 
From there, assign the Okta application to the proper users/groups 
- 
We recommend organizing groups based on the roles users will have in Vanta. For example, place all administrators in one group, all editors in another, and so on. 
[image 29]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859265688/92bd3cd0d9cfd98881b892105667/CleanShot+2025-12-01+at+14_54_28.png?expires=1794967200&signature=635bd877e68879e680764b64cf38270815ed2c777ad9137246a7af4b54383016&req=dSgiH8t4mIdXUfMW1HO4zSd8RAjrMFYqT9LaD7zUZXtEeL85PTNfX3KWOpRR%0ArM3cyMZ9P64QBioNuN0%3D%0A>
 
- 
When assigning the application to groups, you will need to scroll down to select the role that users in this group should receive. This role is passed to Vanta through the custom attribute you configured earlier in the setup process. For example, assigning the application to a group named Vanta-Admins will grant those users the Admin role via the vanta_roles attribute.
​
[image 30]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859267869/a3868b30b8262dfac5684b87142b/CleanShot+2025-12-01+at+14_55_43.png?expires=1794967200&signature=66ce57958489644744cfaa39910108e3ace1c44a09782c7cd1ece64bb05f6512&req=dSgiH8t4molZUPMW1HO4zSthwVeaxOewlg2GwP7H8BpOQ53esznQ5wBNN3Ei%0A91zr%0A>
 
- 
Next, configure group priority. You can do this by going to the Assignments tab, selecting groups and then dragging the desired groups up or down.
​
[image 31]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2006054838/f9c98fc4c647dd43e89286cf79f4/CleanShot%2B2026-01-29%2Bat%2B13_50_21.gif?expires=1794967200&signature=719a38d19fe61968d4105773ad10500d04c34326779dd867b56550c29e4c4468&req=diAnEMl7mYlcUfMW1HO4zfXUo6ZaUN4h1lxxgFrbHVa88E3GjdA1TqYkshbC%0AWSwy%0A>
 
- 
This is needed because If the application is assigned to multiple groups and some employees belong to more than one group, the priority value is used to decide which role they are assigned.
​
- 
Best practice is to have the group that is assigned the highest-privileged role (Administrator) have a priority of 1, followed by the group with the next highest-privileged role at 2, and so on. Groups with lower-privileged roles should have lower priority—for example, the Employee group would have the lowest priority, and should be last in the ordering, followed by the Collaborator group with the second-lowest priority and so on. 
​
- 
Once complete head over to the Admin Portal tab and click the continue button to head over to Step 5.
​
[image 32]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223438871/a135426cce358c55ba400bda16f3/CleanShot+2026-03-31+at+13_21_36%402x.png?expires=1794967200&signature=e0f61991119462b8979adaf185400d2457d06f5ac15387da73f0e9ed9690f92d&req=diIlFc19lYlYWPMW1HO4zXp%2B7KH%2B9hUSCODL%2Bq79dpIgaJiqzXNnD%2B3CQ4Pa%0Aw4lH%0A>
 
 

## Step 7: Push Groups
This is only available if you created a new SCIM application instead of using the existing Vanta SSO app. If you used the Vanta SSO App, please go to Step 9.
​
- 
Return to Okta, and go to your SCIM Application. Select the Push Groups tab in the top navigation menu. Click the Push Groups button. Select Find groups by name.
 
[image 33]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859280441/ec2051757f3c584fda0131b36303/14341745-9fa9-4b2b-98e2-9d30be06216c.png?expires=1794967200&signature=67ec5e5ae117105e6ccaf72b0f7c4d5065cc37aa04c5268d4f5d933ac183c525&req=dSgiH8t2nYVbWPMW1HO4zcgGXLhQAO3Ag0dDwGdMMlmif1TboZOjZNWWfx%2FX%0AUZhs%0A>
 
- 
Locate your desired group, select it and click Save to push your group to Vanta. Repeat for all other groups. 
 
[image 34]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859282120/5cf3112e3c7c9a4782bdded80cc1/4e19000a-bd97-41e1-83dd-b3e2e0dc0c8c.png?expires=1794967200&signature=0cde18320823cf8bce850ff9032c159392e186027e6bd557f43f25356c54f4d0&req=dSgiH8t2n4BdWfMW1HO4zTItm6WP8T8H0YDtuicSHKjGCOHo%2B6XGg7iEsYHR%0AcbUd%0A>
 
- 
Once complete, go back to the Admin Portal and click continue to move on to Step 6
​
[image 35]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223443401/6c1884f1dcbad46720edd800bc25/CleanShot+2026-03-31+at+13_23_23%402x.png?expires=1794967200&signature=2bc5526cd565c8345253dbef7623a041e2e08fe2fd396c93b4e6b2a420ad520e&req=diIlFc16noVfWPMW1HO4zbrkZw0D2Bkt8QO8ZiAB3TEsVLTtlTmWB3NIjrWZ%0AHWsu%0A>
 
 

## Step 8: Specify Custom Attribute in Work OS Admin Portal
- 
Vanta automatically receives basic user details like name and email, so you don’t need to configure those. You will, however, need to add a custom attribute to your SCIM application in Okta. Vanta uses this attribute to determine which role to assign to each user or group.
- 
You created this attribute back in step 5 of these instructions. 
- 
You will paste the attribute name you set in Okta in the Directory Provider Value field in Step 6 in the Admin portal
 
[image 36]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223452953/d01b2057d032d73c25c80613d08a/CleanShot+2026-03-31+at+13_25_51%402x.png?expires=1794967200&signature=423eced4ced3d334cc9e26eca1f4c0840a70cc88f8122fd757a8fb197002d4c3&req=diIlFc17n4haWvMW1HO4zd7zdOh%2FIkJKPOLu0cBH0OtK%2B4TG3LQ9XqoQ9xrb%0ArigFZ5mXj7YMcIDqH%2Bg%3D%0A>
 
- 
Select Save Custom Attributes 
- 
Once complete, you can then head to the Admin Portal tab and click the continue button to move on to step 7.
​

## Step 9: Map Groups to Roles in Admin Portal (Optional)
- 
WorkOS allows you to map the groups fetched from Okta to specific roles in Vanta.
- 
We will skip this since a custom attribute was setup specifically for role assignments
​
[image 37]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2223478117/600382ed5948f9fb0b005e33d68c/CleanShot+2026-03-31+at+13_34_03%402x.png?expires=1794967200&signature=3f41a876fa1c8534e8ba8c5b220cfcfef535b56fafb1e46e9e8566b9450f5995&req=diIlFc15lYBeXvMW1HO4zRlUjsUOcW%2BPtyHCuFvJ9n%2FJ%2FLAdnA1ni0qCY1r%2F%0AuRGh%0A>
 

## 
Step 10: Test Directory Connection
- 
After testing the directory connection you should see a green checkmark along with a green Active status.
 
[image 38]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859286791/1d169549d7e2fdb80ec62d0e09c9/CleanShot+2025-12-01+at+15_07_11.png?expires=1794967200&signature=3976259aa1df4cb0377d0bdba9551b9f1248a5f41a33abe6cd46945d38d0a802&req=dSgiH8t2m4ZWWPMW1HO4zeYQsu%2FUuYLI2dszkjWKy21ARnYldREi%2BrXye7xP%0AA5m9rPaxWZE9mlYRu1U%3D%0A>
 

##

## Images

- [image 01] ../../images/ux/my-work/connecting-vanta-jumpcloud-scim--01.png
- [image 02] ../../images/ux/settings/connecting-vanta-jumpcloud-scim--02.png
- [image 03] ../../images/ux/settings/connecting-vanta-okta-scim--03.png
- [image 04] ../../images/ux/settings/connecting-vanta-jumpcloud-scim--05.png
- [image 05] ../../images/integrations/okta/connecting-vanta-okta-scim--05.png
- [image 06] ../../images/integrations/okta/connecting-vanta-okta-scim--06.png
- [image 07] ../../images/integrations/okta/connecting-vanta-okta-scim--07.png
- [image 08] ../../images/integrations/okta/connecting-vanta-okta-scim--08.png
- [image 09] ../../images/integrations/okta/connecting-vanta-okta-scim--09.png
- [image 10] ../../images/integrations/okta/connecting-vanta-okta-scim--10.png
- [image 11] ../../images/integrations/okta/connecting-vanta-okta-scim--11.png
- [image 12] ../../images/integrations/okta/connecting-vanta-okta-scim--12.png
- [image 13] ../../images/integrations/okta/connecting-vanta-okta-scim--13.png
- [image 14] ../../images/integrations/okta/connecting-vanta-okta-scim--14.png
- [image 15] ../../images/integrations/okta/connecting-vanta-okta-scim--15.png
- [image 16] ../../images/integrations/okta/connecting-vanta-okta-scim--16.png
- [image 17] ../../images/integrations/okta/connecting-vanta-okta-scim--17.png
- [image 18] ../../images/integrations/okta/connecting-vanta-okta-scim--18.png
- [image 19] ../../images/integrations/okta/connecting-vanta-okta-scim--19.png
- [image 20] ../../images/integrations/okta/connecting-vanta-okta-scim--20.png
- [image 21] ../../images/integrations/okta/connecting-vanta-okta-scim--21.png
- [image 22] ../../images/integrations/okta/connecting-vanta-okta-scim--22.png
- [image 23] ../../images/integrations/okta/connecting-vanta-okta-scim--23.png
- [image 24] ../../images/integrations/okta/connecting-vanta-okta-scim--24.png
- [image 25] ../../images/integrations/okta/connecting-vanta-okta-scim--25.png
- [image 26] ../../images/ux/settings/connecting-vanta-okta-scim--26.png
- [image 27] ../../images/integrations/okta/connecting-vanta-okta-scim--27.png
- [image 28] ../../images/integrations/okta/connecting-vanta-okta-scim--28.png
- [image 29] ../../images/integrations/okta/connecting-vanta-okta-scim--29.png
- [image 30] ../../images/integrations/okta/connecting-vanta-okta-scim--30.png
- [image 31] ../../images/integrations/okta/connecting-vanta-okta-scim--31.gif
- [image 32] ../../images/integrations/okta/connecting-vanta-okta-scim--32.png
- [image 33] ../../images/integrations/okta/connecting-vanta-okta-scim--33.png
- [image 34] ../../images/integrations/okta/connecting-vanta-okta-scim--34.png
- [image 35] ../../images/integrations/okta/connecting-vanta-okta-scim--35.png
- [image 36] ../../images/integrations/okta/connecting-vanta-okta-scim--36.png
- [image 37] ../../images/integrations/okta/connecting-vanta-okta-scim--37.png
- [image 38] ../../images/integrations/okta/connecting-vanta-okta-scim--38.png
