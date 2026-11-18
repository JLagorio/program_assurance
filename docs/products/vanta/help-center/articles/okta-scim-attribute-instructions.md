# Okta SCIM Attribute Instructions

Source: https://help.vanta.com/en/articles/11345645-okta-scim-attribute-instructions
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

If you're using SCIM to manage both users and Teams, we recommend using Assignments to automate role assignments and Push Groups to sync Team memberships.
 
When setting this up in Okta, Vanta recommends creating a new SCIM application rather than using the pre-existing Vanta SSO app, as the SSO app does not support Push Groups functionality. Using a dedicated SCIM app ensures full compatibility with group synchronization and team management in Vanta.
 
 

## Map user roles with custom attributes in Okta
- 
Follow the Directory Sync setup instructions until Step 3: Set up Attribute Mapping. This is where we will map an Okta attribute to the Vanta rbac_role_id attribute. In this example, we will use a custom attribute named vanta_role.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757928/78f7fb05389c6136a6edb0fa1ace/27632283509524?expires=1794966300&signature=269eac900cde33116e1a543602a2932e775b4efc1631793b508c21a85cc89416&req=dSUmEM57mohdUfMW1HO4zVyRRTGWtRuPQTRJ45cBRAHRX%2BP2Gpf4GfM0mwR0%0A4kW4zG2Y4lvaO0alu14%3D%0A>
- 
First, let's set up the role attribute in Okta.
- 
In your Okta account, go to Directory, followed by Profile Editor, and find your app.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757932/ac413c2057d227563eb48f77f8b1/28318895017364?expires=1794966300&signature=0a29a1a46da830894039e19f087951c227c9ad71a0049cde151ee3fb57dc0cc2&req=dSUmEM57mohcW%2FMW1HO4zU0Rx0%2Fdh7vNjNC06jb92V2DztiJpBw77AQQGRiR%0ARdTn%0A>
- 
Click + Add attribute
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757938/697aaabd12a4f5b9942165a93153/28318887150740?expires=1794966300&signature=ef9a1a0f72576cd1e7d87018adb1e72401561b249a072c13f2b8abddf7528214&req=dSUmEM57mohcUfMW1HO4zXF3Uc%2FguzZXX9gOYlLcL3e1DH%2FP5vBaNFF79zE3%0A3T%2B6amUdiG6al7qyc2k%3D%0A>
- 
In the modal that opens, fill in the attribute properties.
- 
Set the Variable name and External name to the name you've chosen for your custom attribute
- 
The External namespace must beurn:ietf:params:scim:schemas:core:2.0:User
- 
Select Define enumerated list of values and fill in the attribute members with each Vanta role you want to enable through SCIM.
- 
If you leave the type of attribute as Personal, then when you assign a user to the application, you will be able to select their role.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757926/e753293fb7dbb2a418cfa17dd0e4/27632311323668?expires=1794966300&signature=e8a1fdce2f96c5b672384d7df3c71689bf50afa56b6ae797544b7fa57e8403de&req=dSUmEM57mohdX%2FMW1HO4zW9P5EcxlDNJEBUUr%2BgN6lDG4HKRyMm4ts6yBPjx%0Aspya5Gst5dEPEpA%2Bsuw%3D%0A>
- 
If you prefer, you may also make it a Group attribute and a group for each role. When you assign each group to the application, set the attribute under the role you wish to assign to the group.
​

## 
Provision teams using push groups in Okta
You can automatically provision users into the correct Vanta Teams using SCIM and Push Groups from Okta. This helps keep your team structure in sync with your identity provider and ensures each user gets the right access levels based on their assigned group.
 
To get started, make sure:
- 
Okta is connected as your Identity Provider (IdP)
- 
Enabled SCIM provisioning in your Login & Security settings
- 
Follow the Connect Vanta & Okta guide <https://help.vanta.com/en/articles/11345654> if you haven't done that yet.
 

### Navigate to your SCIM App in Okta
Make sure you're using the Vanta SCIM app, not the Vanta SSO app—the SSO app does not support Push Groups.
- 
From the Okta Admin Console, go to Applications
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757970/76bca70e7bf368d80467b76ba002/36660698069908?expires=1794966300&signature=52ffceb8eaf8b3c98407c6aa71e8c5c3d5345b311450bcd008fe19aa2b2a8762&req=dSUmEM57mohYWfMW1HO4zV4OkYUnTgvgV6uWy%2Bdj5iZWp2OQ9n1bIxUw8Jsd%0AAPtM%0A>
- 
Click Browse Catalogue and select the SCIM 2.0 Test App (OAuth Bearer Token) or your existing SCIM app connected to Vanta.
- 
Click Add Integration
- 
Complete the setup steps, then click Done

### Configure SCIM API Integration in Okta
- 
In Okta, open your Vanta application
- 
Go to the Provisioning tab
- 
Click Configure API Integration
- 
Check Enable API Integration
- 
In Vanta's Admin Portal, copy the SCIM API Endpoint and Bearer Token
- 
Paste these into Okta
- 
Click Test API Credentials to confirm the connection
- 
Click Save
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757960/19bf885cadc7628abdc18be5a386/36660698072724?expires=1794966300&signature=a2e069fa769bb62f26772f11e8591c152e828038d319a217bf8e3785d71d0923&req=dSUmEM57mohZWfMW1HO4zVW4lCOpE5GpcLz8fz2R03pjWOOoJ4APZhoAyfsd%0AbomJfv4LX4wGb9qeVx0%3D%0A>
 

### Assign Users to Teams with Push Groups
To map Okta groups to Vanta Teams, you'll use Push Groups. This ensures that each group in Okta creates or syncs to a matching team in Vanta.
- 
In Okta, navigate to Groups and create team-specific groups that reflect your Vanta team structure (e.g., "Security Team" or "Engineering")
- 
Add users to the appropriate groups in Okta
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757971/d998f68321717da9144d21c6b803/36660698073748?expires=1794966300&signature=6c851a1a11facb4da7989f2c9530fac7c9a88ea6063fc0da95f6fcb679e82c98&req=dSUmEM57mohYWPMW1HO4zRXWu2F3rbjKDW75tDU7l%2BYkRCbI3U1BLrcIVQj1%0Aog8z%0A>
- 
Go back to your SCIM app in Okta
- 
Under Push Groups, select Push Groups to SCIM App
- 
Choose each group you want to sync and push them
- 
Once synced, Vanta will automatically create matching teams and assign users accordingly

## Images

- [image 01] ../../images/integrations/workos/okta-scim-attribute-instructions--01.png
- [image 02] ../../images/integrations/okta/okta-scim-attribute-instructions--02.png
- [image 03] ../../images/integrations/okta/okta-scim-attribute-instructions--03.png
- [image 04] ../../images/integrations/okta/okta-scim-attribute-instructions--04.png
- [image 05] ../../images/integrations/okta/okta-scim-attribute-instructions--05.png
- [image 06] ../../images/integrations/okta/okta-scim-attribute-instructions--06.png
- [image 07] ../../images/integrations/okta/okta-scim-attribute-instructions--07.png
