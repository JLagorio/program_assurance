# Connecting Vanta & Bamboo HR

Source: https://help.vanta.com/en/articles/11345684-connecting-vanta-bamboo-hr
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

BambooHR has a complex permission model. You'll need to select a user to link BambooHR in Vanta. The connection relies on OAuth, which means the connecting user will need to be signed into BambooHR when adding the connection in Vanta. You should decide if you'd like to use an existing BambooHR employee, or create a non-employee BambooHR user for the integration. If you use an existing employee, keep in mind that you will need to reconnect BambooHR in Vanta in the event that the connecting employee leaves.

Vanta needs at minimum View Only permissions to specific details in BambooHR. Due to this, the access component of this setup is important.
 
You have two options for access level:
- 
Using Full Admin access level
or
- 
Creating a Custom access level
If you opt to create a Custom access level, these View Only settings are required:
​
​Personal Tab:
- 
Basic Info
- 
View Only: Status, First Name, Last Name
- 
Contact
- 
View Only: Work Email
- 
View Only: Home Email
Job Tab:
- 
View Only: Hire Date
- 
Employment Status
- 
View Only: Date
- 
View Only: Employment Status
- 
View Only: Employment Status: Date
- 
Job Information
- 
View Only: Job Title
- 
View Only: Reporting to
- 
View Only: Department
Time Off Tab:
- 
Set All Fields to View Only
See About Themselves
- 
Should Employees be able to see their own information?
- 
Yes, Allow Access
- 
Which Access Level should apply?
- 
Equal Access
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524007365/7ec61f69e5aaa44d1587236134ab/image.png?expires=1794967200&signature=c439c1f57559369647c04709f75c92e7eeb2fd4e5513daf7b914d107076e8e43&req=diUlEsl%2BmoJZXPMW1HO4zZZ%2BBLoDb8ljewNnGIfCJevRLwmMasMGn2sNznlJ%0AenL6swuE3jCzjBYxHX8%3D%0A>
 
 
 

## Integrating with BambooHR
- 
In Vanta, go to the Integrations page, click Add integration, and search for BambooHR. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765105/6416592448118660b817daab5430/28359682888596?expires=1794967200&signature=ec4f22be95dbd41585e0fb1f53c6babf393166f25d5d3a9935a59bbd5bb3b35e&req=dSUmEM54mIBfXPMW1HO4zWVyGvQUpCPVJUI4Vq%2BtZiT5gPzWIzR7wHLD2LFk%0AWk2ncuIfeg%2BeNaZoQ0A%3D%0A>
- 
A pop-up modal will appear; enter your BambooHR subdomain address. This can be copied from the address bar when you are logged in to BambooHR. The text just before .bamboohr.com is your domain.
This should look like youraccount.bamboohr.com
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765104/bf90acdff5c87cd739d829ae2219/23131609274388?expires=1794967200&signature=2748f4f04a49d1ec9d80260d2f7dd8b32b98dd6af64bcec076d729651a3af10c&req=dSUmEM54mIBfXfMW1HO4zfLg5BF6hPHig2Tq9rYyJPWnaagqp%2Bv7ISrsdxtY%0A57zjihWRMZb4ECwM1OU%3D%0A>
- 
Click Connect BambooHR
- 
The pop-up modal will prompt to select a date to import people. By setting this date, Vanta will import any users who were active or termed after the date.
- 
For example: if you set the date to October 30th, 2020, Vanta would import all users who left the company after October 30th, 2020, as well as any active users.
- 
Once the date has been selected, hit save. It can take a few hours for the information to fully sync.
 

## Why does the 'Merge HR Data' option show no employee data?
When BambooHR is connected to Vanta, HR profiles with matched emails are automatically synced. The 'Merge HR data' section only shows profiles from BambooHR with email addresses not already linked in Vanta. If this section appears empty, all emails have already been merged.
 

## Resolving BambooHR Accounts Not Appearing in Vanta
For an account to appear in Vanta for linking to BambooHR:
 
- 
Ensure there is a Vanta profile for the user. If not:
- 
Add the user to your IdP (e.g., Okta), which will sync with Vanta within a few hours.
- 
Or, manually create a profile by navigating to People > +Add a person in Vanta. These steps enable proper synchronization and visibility of BambooHR accounts.
 

## Post-Change Requirements After Switching to BambooHR
After switching to BambooHR, ensure:
- 
The emails match between BambooHR and Vanta. Mismatched emails may require manual linking of user profiles.
- 
No additional post-change cleanup is needed if the data matches correctly.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765118/4b99e71c0a6a2231ab1e656509b6/28359682895892?expires=1794967200&signature=b80863c714f1d2b271b441379419f42a4b1cc0860db161a838b5471b2957d8d1&req=dSUmEM54mIBeUfMW1HO4zU4VV9dZaj%2BjylYYeU5xeg42gg8AiYi8%2BL0wBcki%0AKBfUpmImJ3DU1JtrL5w%3D%0A>
 

## Reconnect BambooHR in Vanta
If the BambooHR user who initially set up the integration leaves your organization (or is about to) you can easily reconnect BambooHR in Vanta. Here's how you can do this:
- 
Sign in to your BambooHR account with the user you'd like to reconnect the integration with.
- 
Sign in to your Vanta account, and navigate to the Integrations page: https://app.vanta.com/integrations <https://app.vanta.com/integrations>
- 
On the Connections page, scroll down to Human Resources/Payroll, select the (...) menu, and click Reconnect
- 
This will open the window where you set your subdomain for Vanta, enter your BambooHR address, which should look like "youraccount.bamboohr.com <https://youraccount.bamboohr.com>" and click Connect BambooHR
- 
You will then see a popup where you may select a date to import people. By setting this date, Vanta will import any users who were active or termed after the date. You'll want to select the same date you had set before to ensure the same users stay in the account.
- 
Once the date has been selected, hit save.
 

## Resolving Connection Failures
Connection failures between BambooHR and Vanta may arise due to the following: 1. Browser Cookies and Cache Clear your browser cookies and cache prior to connecting BambooHR with Vanta, then attempt reconnecting. 2. Account Type and Permissions Verify you are using an account with at least View Only permissions for the following BambooHR data:
- 
Personal Tab:
- 
Basic Info: Status, First Name, Last Name (View Only).
- 
Contact: Work Email (View Only).
- 
Job Tab:
- 
Hire Date (View Only).
- 
Employment Status: Date, Employment Status (View Only).
- 
Job Information: Job Title, Department (View Only).
- 
Other Settings:
- 
"See About Themselves": Allow employees to view their data.
- 
"Which Access Level should apply?": Full Admin Access or Custom Access with the above settings. If issues persist, ensure screenshots of permissions are available for further diagnostic purposes.

## Images

- [image 01] ../../images/integrations/bamboo-hr/connecting-vanta-bamboo-hr--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-bamboo-hr--02.png
- [image 03] ../../images/integrations/bamboo-hr/connecting-vanta-bamboo-hr--03.png
- [image 04] ../../images/integrations/bamboo-hr/connecting-vanta-bamboo-hr--04.png
