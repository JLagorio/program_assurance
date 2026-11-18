# Integrating Vanta & PingOne Identity Provider

Source: https://help.vanta.com/en/articles/11345641-integrating-vanta-pingone-identity-provider
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Through the Vanta and PingOne integration, you can connect your employees seamlessly into Vanta.

## 1. Create the PingOne Custom Administrator Role
- 
Log into PingOne, go to Directory, followed by Administrator Roles, and click the Custom Roles tab.
- 
Select Add Custom Role.
- 
For Initial Permissions, select “No permissions” as the basis for the new role.
- 
Provide a name (we suggest “Vanta Worker App Roles”)
- 
In the Assignable by field, select the roles allowed to assign this role to others. Usually, this is “Environment admin.”
- 
Select Next.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756881/c61fbfa449f088ec0fe4e7ef7096/34591516395796?expires=1794966300&signature=9930fc73367f0537b0a96578ed90ac3f65093a2e4934c779d4ec9b961f7c8bbe&req=dSUmEM57m4lXWPMW1HO4zV56s1b2KSeRKJNOMRavwlY9qy69OO4tOEOCWP0T%0AQYshz2sqh2Cf5kRiCNw%3D%0A>
- 
Mark the “Automatically include essential permissions (recommended)” option
- 
Enable the following permissions:
- 
Read Group
- 
Read User
- 
Read User Linked Accounts
- 
Read Application
- 
Click Next and confirm that you have only the above permissions and essential permissions enabled.
- 
Click Save.

## 2. Create the PingOne Worker Application
- 
Log in to the PingOne <https://apidocs.pingidentity.com/pingone/tutorial/v1/api/#create-an-admin-worker-app-connection> admin console.
- 
Select Applications followed by Applications.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756890/4a28b95dfa0beaf138d220042219/34591516398356?expires=1794966300&signature=c03e9cd2b1bfdd8c593bf0b8551d7f655bc6a2a8e1f4cd85736e745f07d96321&req=dSUmEM57m4lWWfMW1HO4zTzk0vNSU0zEBsmlrrZOuO28zWUr%2BPrlOzx%2Bqccm%0A8PL3Z49om6oFgEh2mJ0%3D%0A>
- 
Click the + icon next to Applications to add a new app.
- 
Provide an Application Name (we suggest Vanta Worker App), and select Worker as the Application Type.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756885/59823b16ab39c1764a978b636b85/34591513014164?expires=1794966300&signature=a82fca1f5a8860c281348a9c302ab95878587c5104f12b087081f1fdcecd6b61&req=dSUmEM57m4lXXPMW1HO4zXrAk03cCup6%2F8W7TjqHToqI6HNNn0j44zrxlcpT%0AUUZf2DHi7u2SZnw9e%2Fc%3D%0A>
- 
Click Save.
- 
Click the toggle in the upper right-hand corner to enable the application.
- 
The Environment ID, Worker app Client ID, and Worker app Client Secret are displayed; they will be used on the Vanta Integration Page.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756882/546792758a28bdb3affd5f3fd893/34591513017876?expires=1794966300&signature=d0d8695d59c2cbe6f3fce310a285fcacf2c35c4d47a85597d729122c17888da0&req=dSUmEM57m4lXW%2FMW1HO4zUwxv866WoXZZQhOQ9je%2BECrTA3usBcbxgHy3riQ%0AW1akK%2BySYdfqcIstFVo%3D%0A>
- 
Select the Roles tab, and click Grant Roles.
- 
Expand the Vanta API Roles entry. On the desired environment, click the
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756905/0527cc7887c539e9e7f936327f43/34591513021332?expires=1794966300&signature=34156abc6cc419bd1662c66a97e69150852f9fb5f3f890475d657eda94ae90e7&req=dSUmEM57m4hfXPMW1HO4zWfM8Sa0Ngdj%2FiYTp51Ov6T0eb5ot0X7V8AiJG8O%0AOJ0U%0A>
icon and select the Vanta Worker app. If you have already created the Vanta SAML SSO App, select this as well.
- 
Click Confirm
- 
Click Save 

## 3. Connecting the Integration in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for PingOne. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
If you want PingOne to populate the people page, turn the toggle on.
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756912/30a6e33010498f15b9e5b54ded03/34591516405140?expires=1794966300&signature=ec64b75e7be565e805ec5ec343f90551e24dc3b382732c125a87231c8b23a9a3&req=dSUmEM57m4heW%2FMW1HO4zWEWkVKVyqEleRm7SyGnr%2BoK3iSxBQMg4e8hfF3E%0Ay77U%0A>
- 
Click Continue
- 
If you want to enable SSO with PingOne, create the SAML Application in PingOne by following the steps on section 3.1.
- 
Fill out the required information
- 
Client ID is the Vanta Worker App Client Id
- 
Client Secret is the Vanta Worker App Client Secret
- 
Environment ID is the Vanta Worker App Client Secret environment id
- 
Vanta SAML App ID is the Vanta SAML SSO App Id
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756907/5c3376f665831b485b34e1fe3759/34591513024532?expires=1794966300&signature=04f9368136d9823e4724441e14c2e7b7fd00ebc063c78f057e4f9f451eff6977&req=dSUmEM57m4hfXvMW1HO4zUiXxzWiKdAeJikRKLVBrN6rht7cz4GAH1v4cRl1%0AVvdpGN%2BagGcVHFmethI%3D%0A>
- 
Click Validate and store.

## 3.1 Create the PingOne SAML SSO Application
- 
Log in to the PingOne admin console.
- 
Select Applications followed by Applications.
- 
Click Add Application and select New SAML Application.
- 
Click the + icon next to Applications to add a new app.
In the Application Name field, enter an application name (we suggest “Vanta SAML SSO App”), and select “SAML Application” as the Application Type.
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756919/3e2161032f65c634b276d98cbf67/34591513028756?expires=1794966300&signature=922a14294b3103c63066ce21493cb35cb5407cb4bd1fcabda3650bec6d7270e1&req=dSUmEM57m4heUPMW1HO4zVAzs3oSts8Qv8HoX9LYfQxPkK3yFT1HaYJfl16q%0AEXByhh35uwX%2BuqmXJDU%3D%0A>
- 
Click Configure
- 
On the SAML Configuration section, select Manually Enter
- 
Fill the ACS URLs and Entity ID fields from what the Vanta Integration Page provides
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756928/b9253f24f00975c5a6b27ae9c318/34591513030164?expires=1794966300&signature=94b42a681bb143dc81fb3fa833ab9a428ee1157c7a39fbabfeaf200064313e8a&req=dSUmEM57m4hdUfMW1HO4zZ%2BOnsZAMtgqnBSDwdtg0WXn3j0dQxnHsTNEriN1%0Al%2FHkY88qwyWJu3IRZME%3D%0A>
- 
Click Save
- 
On the open drawer, click the Configuration tab and then the pencil icon.
- 
For the Signing Section, change it to Sign Assertion & Response.
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756944/27078d32633b92fc0742556a0b32/34591513031956?expires=1794966300&signature=54b743f704cec9878e79aef0b4f20a27d21bf3fea86865e9aeff446fb2eb9f56&req=dSUmEM57m4hbXfMW1HO4zfgoyrtljtwfbwZVj4%2FQqOZQ22WVzBzqI6QP0mPl%0A4jZTz1QmReiaRpKGIG8%3D%0A>
- 
Click Save
- 
On the same drawer, click on the Attribute Mappings tab and then on the pencil icon.
​
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756938/769816d7b731e31c7e12dcc77083/34591513038228?expires=1794966300&signature=e59f4ebb7aea39936c5f06cc34aac7a7ef06399a66ea06209656a7397ca86d1b&req=dSUmEM57m4hcUfMW1HO4zaWRp6P%2BQCoOuB6Kq%2FDAywEezrI5O5MFMLRlZ9s9%0A4%2BMa%0A>
- 
Change the saml_subject to Email Address.
- 
Click Save
- 
Click on the toggle to enable the App and copy the ID, and it will be used on the Vanta Integration Page
​​
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756950/2c3c611951700dd9ac9706610fa5/34591513040404?expires=1794966300&signature=08a2f0d2c4c429047aa2791c9abecd135e200bc702d4e30fa910c1d8804e40bb&req=dSUmEM57m4haWfMW1HO4zTbG%2BJl3JOcMDAnuavjlGu1fl35S24Q0HyiXiH6y%0AvqWf%0A>

## Images

- [image 01] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--01.png
- [image 02] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--02.png
- [image 03] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--03.png
- [image 04] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--04.png
- [image 05] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--05.png
- [image 06] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--06.png
- [image 07] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--07.png
- [image 08] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--08.png
- [image 09] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--09.png
- [image 10] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--10.png
- [image 11] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--11.png
- [image 12] ../../images/integrations/pingone/integrating-vanta-pingone-identity-provider--12.png
