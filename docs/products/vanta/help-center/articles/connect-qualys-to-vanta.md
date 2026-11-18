# Connect Qualys to Vanta

Source: https://help.vanta.com/en/articles/11345946-connect-qualys-to-vanta
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Prerequisites
Below is the guide to creating a service user for Vanta. This guide is also available in the first step of the connection modal on the Vanta Integrations Page <https://app.vanta.com/integrations?state=available&integration-dialog=qualys&flow=add&step=service-user-setup>. Visit this link <https://www.loom.com/share/f044b4a98c6749ef8b8c45872746823c?sid=58c80109-9d7d-416c-9dcf-c44f2e51644c> for a Video Walkthrough of the service account creation process.
You'll need a dedicated email for this service account
- 
Go to the Qualys VMDR tool.
You can find your app URL on this page <https://qualysguard.qualys.com/portal-help/en/admin/user/add_new_user_from_vm.htm>.
- 
Go to the USERS tab in the menu at the top, as shown in the video.
- 
Click on the "New" button and then select the "User" option.
- 
Fill the general information form with the following unless indicated otherwise:
First Name: Vanta
Last Name: Integration
Title: – (hyphen)
Phone: – (hyphen)
Address 1: – (hyphen)
Country: United States of America
Email Address: Enter the dedicated email address for the service account.
State: California
- 
In the Locale section:
Language: English
Date Format: ISO Format (yyyy-mm-dd)
Time Zone: (GMT -08:00) United States, California (Pacific Standard Time)
- 
In the User Role section:
User Role: Reader
Allow Access to: Check both API and GUI options.
Business Unit: Select the business unit you want to be monitored.
- 
In the Notifications section, set everything to None, off, or No notification, depending on available options.
- 
Save your new user.
- 
Check your email inbox for incoming emails from Qualys, follow their instructions, and return to this page once you've received a password.
- 
Make sure to log in to your newly created user and complete the user registrations before proceeding. 
 

## Procedure
Once you've created your Service Account in Qualys, Enter its credentials in the last section of Step 1 in the connection flow.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762258/17ada333b72a6630431a20a7819e/15522317410452?expires=1794967200&signature=1046507a639a7ef49fc653ec154fd8064317b278ea8429741e9249c5ef8c220e&req=dSUmEM54n4NaUfMW1HO4zW9JAowYlbeYGnjOc9zSENcuhmOQcM09cRh1zyus%0A15uAd%2BCNfc3r%2FtX6MgE%3D%0A>
- 
Click Next, and you should now be able to select your region.
- 
Use this Guide <https://www.qualys.com/platform-identification/> to determine your Platform Identifier.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762259/12d30e356298786427671be75b83/15522274894356?expires=1794967200&signature=a435ae0174590030cea2d36514a74ce69631cab82a16b251c3ed436529741807&req=dSUmEM54n4NaUPMW1HO4zS9xTyeIwwiQibJx1VQoXHocarWXKYJLmDsI6W1E%0ASSByfBCZUGgXhTC3okQ%3D%0A>
- 
Once selected, you will now see Qualys as a connected integration.
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762257/d288bda002f38a1b017e0e03c311/15522413835028?expires=1794967200&signature=e876a8cba3e9e3b835dcce00ce701f5f4fdfaa5fbdd12f26cc502d8eab011c00&req=dSUmEM54n4NaXvMW1HO4zR%2BclpLh5bOg6n8rOZE%2FkXimvgZNZpQyxGanpNe1%0Aj97b%0A>
 
- 
As well as see your accounts pulled in on the Access page.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762261/24986f254a3d6ea2174e757491d5/15522722280852?expires=1794967200&signature=4d02c1229b8194969e46469e61881cb0a16876baf0a6f978b1481fa8bd73123d&req=dSUmEM54n4NZWPMW1HO4zWH5heIDr20jFl1E2KsfyJjZVBFlPfP93QfIybfw%0AUURRuus7p%2FzHUhPis%2Fg%3D%0A>
 

## Tests and Controls for Qualys
Vanta automates 10 tests
- 
Critical vulnerabilities identified in packages are addressed (Qualys Container Security)
- 
Critical vulnerabilities identified in packages are addressed (Qualys VMDR)
- 
High vulnerabilities identified in packages are addressed (Qualys Container Security)
- 
High vulnerabilities identified in packages are addressed (Qualys VMDR)
- 
Low vulnerabilities identified in packages are addressed (Qualys Container Security)
- 
Low vulnerabilities identified in packages are addressed (Qualys VMDR)
- 
Medium vulnerabilities identified in packages are addressed (Qualys Container Security)
- 
Medium vulnerabilities identified in packages are addressed (Qualys VMDR)
- 
Qualys accounts associated with users
- 
Qualys accounts are deprovisioned when personnel leave
Vanta helps pass 14 controls
- 
Access control
- 
Access established, reviewed, and modified
- 
Access reviews conducted
- 
Access revoked upon termination
- 
Access rights
- 
CUI systems are protected during HR changes, such as termination or transfer
- 
Comprehensive Access Management In Place
- 
Identity and Credential Management
- 
Identity management
- 
Logical Access - Account De-Activation
- 
System access is restricted to authorized Access only
- 
Terminated user access removed
- 
Termination procedures established
- 
Users, processes, and devices are authenticated before Access is granted

## Images

- [image 01] ../../images/integrations/qualys/connect-qualys-to-vanta--01.png
- [image 02] ../../images/integrations/qualys/connect-qualys-to-vanta--02.png
- [image 03] ../../images/ux/integrations/connect-qualys-to-vanta--03.png
- [image 04] ../../images/ux/access/connect-qualys-to-vanta--04.png
