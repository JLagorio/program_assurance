# Connecting Vanta & CyberArk

Source: https://help.vanta.com/en/articles/12143423-connecting-vanta-cyberark
Collection: Team Compliance ; Team Compliance › Employee Onboarding & Offboarding
Fetched: 2026-11-17

## Article text

Vanta integrates with CyberArk to sync employee and group data, helping you automate onboarding and offboarding workflows. By pulling real-time identity information, Vanta ensures only current employees retain access to company systems. This simplifies access reviews and supports your compliance requirements.
 
Estimated setup time: Less than 15 minutes
 

## How It Works
Vanta integrates with CyberArk to sync employee and group data, helping you monitor access and support automated onboarding and offboarding workflows. By pulling real-time identity information, Vanta helps ensure that only current employees retain access to company systems simplifying access reviews and supporting compliance requirements.
Please Note: Vanta connects to CyberArk through Merge.dev <https://www.merge.dev?utm_source=chatgpt.com>, a third-party integration platform. Merge securely pulls employees and groups from CyberArk into Vanta.
 

## Use Cases
Connecting CyberArk to Vanta will enable you to:
- 
Sync employees and groups from CyberArk into Vanta
- 
Monitor and manage personnel access in real time
- 
Ensure only active employees retain access to company systems
- 
Simplify access reviews and compliance requirements
 

## Requirements
- 
CyberArk administrator account
- 
Vanta administrator account
 

## Install the Integration
Log in to the CyberArk Admin Portal via your organization’s tenant URL.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1706022910/fdcf57235752071b195bca0bb0a6/10e9fca6-1687-4292-957a-a05439f48014?expires=1794967200&signature=665eefb108e02ba776feb7f66f933fb5417f4bf26d4833194744a1b4581a81fd&req=dScnEMl8n4heWfMW1HO4zbaPj3Uz4zqtWYTFrY6OdhCqjcx6Jd40ujHCALz%2B%0AAtAOWTY7hHKzEm6GmKk%3D%0A>
 
Switch to the Admin Portal view by clicking the grid symbol next to Identity User Portal and selecting Admin Portal.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1706023136/83da97c18d8d9cd7bddfb0ad7cf5/e842e186-eed0-41b8-babc-7be8b1f67ee5?expires=1794967200&signature=308c97a92f3c3a3e19897e266632db44f75521b993a59760b833c68f34ea5828&req=dScnEMl8noBcX%2FMW1HO4zeJzuCd5YbeRvyFUtUCOeuUDMRVw04gvv9Rg%2BN6G%0Al2Bs%2FOdtweZiG8DOeQw%3D%0A>
 
Navigate to Core Services > Roles.
- 
Select Add Role in the top left corner.
- 
Name your role SCIM Client and click Save. You’ll be redirected to the new role’s settings page.
- 
Under Administrative Rights, click Add, search for and select User Management, then click Save.
Please note: Select User Management, not Read Only User Management.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1706023955/5831d1bd636289e9ff70443add34/c2734617-e5a2-4d70-aa90-da2c3168322c?expires=1794967200&signature=3371a0dfdf7f8ee9f0f2420d2c0e1da77883a1c283b0c45ba276ba1ba69a4ef0&req=dScnEMl8nohaXPMW1HO4zZE0imMfc7cmqTz%2BqWnLozDHVm6Y82UsIDXXP6Pe%0A32jImgDQEXGlo15R2e8%3D%0A>
 
Navigate to Apps & Widgets > Web Apps.
- 
Click Add Web Apps in the top right corner.
- 
On the Custom tab, next to OAuth2 Client, click Add.
- 
In the Add Web App screen, click Yes to add the application.
- 
Click Close to return to the OAuth2 client configuration screen.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1706024540/ba3ebe34ee07bdc2e5533d8f5999/5ad6e677-bf47-4826-9223-e612b6376aae?expires=1794967200&signature=1fef207297f3d4b3477bb78dae3ac35e1c89a834f7e919bc75688b08131b6edf&req=dScnEMl8mYRbWfMW1HO4zUY0j0ZEaJlqBftvBmc%2Fg9BmaSHkEH6aXP9b%2FHhd%0A%2B9cW3nmKxwKVqmJsPOU%3D%0A>
 
On the Settings page, complete the following field:
- 
Application ID: Any value (for example, scim_oauth_client). This ID is required during the Vanta linking flow.
On the General Usage page, select:
- 
Client ID Type: Check both Confidential and Must be OAuth Client.
​
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1835668234/5b92c0010521b4523f343229d1aa/CleanShot+2025-11-17+at+18_19.png?expires=1794967200&signature=dd433d0aa8a72598bb3917a84336ffc7ebf7594813fd225554f8b1c22465d809&req=dSgkE894lYNcXfMW1HO4zT46I9Pf5LpDioE1aOOI0Imqgu%2FWpgZcxuXKI9mm%0ASQzl%0A>

On the Tokens page, Select the token type and Auth methods:
- 
Token Type: JwtRS256
- 
Auth methods: Client Creds
- 
Access token lifetime: 5 hours
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1835668552/865372acfe3e2adbe69cd9f02ed4/CleanShot+2025-11-17+at+18_19+2.png?expires=1794967200&signature=8940c9f475e23baeeb6170121b52b800ad927c448bac36561ea4a4734e273032&req=dSgkE894lYRaW%2FMW1HO4zXc%2FMr%2FN6NNkIJpGhRg2JRyinHz8NWzaDz5u2o78%0Apwkv%2BSdh9qNT5L1thGs%3D%0A>

​
On the Scope page, click Add and create a new scope:
- 
Name: SCIMAPIScope
- 
Allowed REST APIs: add an entry with the text scim ( exact text required )
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1706025385/d379521ee0372eb90b2000954638/3ba51d82-ff0c-4b31-acf0-4c360d27e543?expires=1794967200&signature=9301a0b2d395305748a47125a85bc4383128d829ac8a1ef15f9334607f4b02cb&req=dScnEMl8mIJXXPMW1HO4zdA4ktHq6TAQuKSJzZM5yYwhwUeRk6imNl5fIMnA%0AxRuCmJIL3Wht%2FHWLzg0%3D%0A>
 
Navigate to Core Services > Users.
- 
Select Add User in the top right corner. Complete the following fields:
- 
Login name: This value + @merge becomes your username and Client ID
- 
Display name: Any value you choose
- 
Password: This becomes your password and Client Secret
- 
Check Is OAuth confidential client under Status. The email field will gray out, and Is Service User will auto-check
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1706025856/adcf12f3e8159dc754200ae80e7f/1a03298a-6d1e-4983-ad22-d2c1ab1c9d3a?expires=1794967200&signature=238cb97622300dd86bf34365b021f6dae66a5280be2e79b707e77e2c5f0c82ce&req=dScnEMl8mIlaX%2FMW1HO4zSthaSDSTlD%2Fb7ySttPzCdbonpTWakWN3KlGFO8e%0AL34AzLIjxOCLR5%2BESgE%3D%0A>
 
Return to Core Services > Roles and open the SCIM Client role.
- 
Under Members, click Add, and add your newly created user. Select Save.
 
In Vanta, start the CyberArk linking flow by clicking CyberArk on the integrations page.
 
Enter the following:
- 
The tenant URL you use to log into CyberArk
- 
The Application ID you created
- 
Your Client ID and Client Secret/Password
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1706030372/07134772a089792ed451df324c97/ca52bf39-1417-46f0-b2a3-a3faa2329188?expires=1794967200&signature=3c370c29efebe733d491316508346a6e3a8ecf3bb3e7fc1fd82b3426542efd59&req=dScnEMl9nYJYW%2FMW1HO4zVhkXq4AI38Fpk62iCtZyeU2a9WK114E1CZ%2BELGe%0AV7%2FeCV9uuMzrsD%2Bfgl8%3D%0A>
Please note: Employees will appear in Vanta within 30 minutes.
 

## Permissions
Vanta accesses the following data from CyberArk:
 
Vanta will be able to view:
- 
Data about your users
- 
Data about your employees
Vanta will be able to do:
- 
Vanta does not have write permission

## Images

- [image 01] ../../images/integrations/cyberark/connecting-vanta-cyberark--01.png
- [image 02] ../../images/integrations/cyberark/connecting-vanta-cyberark--02.png
- [image 03] ../../images/integrations/cyberark/connecting-vanta-cyberark--03.png
- [image 04] ../../images/integrations/cyberark/connecting-vanta-cyberark--04.png
- [image 05] ../../images/integrations/cyberark/connecting-vanta-cyberark--05.png
- [image 06] ../../images/integrations/cyberark/connecting-vanta-cyberark--06.png
- [image 07] ../../images/integrations/cyberark/connecting-vanta-cyberark--07.png
- [image 08] ../../images/integrations/cyberark/connecting-vanta-cyberark--08.png
- [image 09] ../../images/integrations/cyberark/connecting-vanta-cyberark--09.png
