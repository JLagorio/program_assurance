# Dynamic IdP Groups: Entra (Office 365)

Source: https://help.vanta.com/en/articles/11345904-dynamic-idp-groups-entra-office-365
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Using the Dynamic IdP groups functionality reduces the time spent creating groups and manually adding or removing members in two places. Now, you will be able to work with the groups that have already been made within Office 365 and use them for workflows and assignments within Vanta!
 

## What are Groups?
- 
Multiple users with similar responsibilities, tasks, or job descriptions can be grouped.
- 
Groups can then assign Task sets to multiple users, making it easier to manage which tasks are assigned to specific people.
 

## Prerequisites
- 
To leverage the connection between Vanta and Entra (Office 365), the Vanta O365 Integration app must be assigned to the desired employees & groups you wish to manage in your Entra ID Admin Center
Please see Controlling Scope Through Entra (Office 365) <https://help.vanta.com/en/articles/11345767> to configure your account before importing IdP groups
 

## Importing Groups from Entra (Office 365)
- 
Select +Add Group and then Add from identity providers from the People > Groups page
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759933/62a1d2dc201c7a2e89f55af16f00/35977934702740?expires=1794967200&signature=62ff8b921684122294c858b1ac3a4bdaf8e82ede828cfede5835479813d4353a&req=dSUmEM57lIhcWvMW1HO4zaJQH5Sa%2FAq8Qhb%2BwjCFhmYeU%2BURF44KdOpzcV4J%0AjFbbd%2BFcbJ3zpomxEy8%3D%0A>
 
- 
From here, you will be asked to select which groups you would like brought Into Vanta.
- 
Select the check box next to the group name to signify they should be imported.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759935/d0a8ec756c57b8a4b5fcaa6db736/35977904647188?expires=1794967200&signature=5d8ec40ce953bdd71a44c591a1c61f276e553ccee24d2ffd436478eb9497829b&req=dSUmEM57lIhcXPMW1HO4zUtiij4QRuwVw6%2FeU0Zw5cQNJnLlRPsnq4JvDTKb%0Anj3nANCOLRa3PiTrJcw%3D%0A>
 
- 
Clicking on the group will allow you to view all detected members
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759932/2191e14f997cfb5c59c7b3148372/33279825389972?expires=1794967200&signature=ecb5a48f854798112bd6b7e1d4d1a286b99606338615aa1a778492249e139d10&req=dSUmEM57lIhcW%2FMW1HO4zRIDV53%2FSxWpnwuY8SlYL1RRYpqxzL%2FK8jIiI7KI%0A%2FPutOY84II89Dtmeo%2BM%3D%0A>
- 
Once you have selected, click Add Group in the lower right-hand corner.
- 
Click on the newly created group to assign onboarding/offboarding tasks. To apply an exisiting task set, click on the action button represented as 3 dots
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759936/ef6814584dc450b1405c259f96fd/33279825390484?expires=1794967200&signature=91da060cba911d920742c30975b44f336527c85207e8ffacc2127ffd1a09e9ae&req=dSUmEM57lIhcX%2FMW1HO4zeiXyJ354e3phkKgN20a4uVfmSSYckzTrR0TEpAO%0AuLbd%2FJ6BgvIOd2EHLH0%3D%0A>
- 
Click Save
- 
The imported groups will appear on your groups' list with the Source as  Entra (Office 365)
- 
Task sets for an identity provider imported group can be updated similarly to any other list or group.
 

## Updating Groups in Entra (Office 365)
- 
When adding or removing <https://learn.microsoft.com/en-us/microsoft-365/admin/email/create-edit-or-delete-a-security-group?view=o365-worldwidesince> users from groups within Entra, that information will automatically be updated and reflected in Vanta on the next sync.
- 
If you don't see the changes reflected immediately, select the action button represented by 3 dots, then click Refresh groups from Entra (Office 365) to force the update.
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759957/ef0eb77f31ceb4b72f3dc707d83d/33279825391252?expires=1794967200&signature=9ea491311eacdf9c05e98993289b1c3679813da9a19a0e41bf29636bf97480c9&req=dSUmEM57lIhaXvMW1HO4zfQrhvMruAabd0yVE6Qyo0BgQKM%2BXE91piZQFIsf%0AEIQBDc5zijbAdsMvnrM%3D%0A>
⚠️ Note: If you use imported IdP groups to assign Personnel tasks, permanently deleting an employee from your IdP may remove their group memberships from Vanta.
 
If the employee is deleted before their Vanta offboarding is complete, their group-specific tasks and access-removal requirements may no longer appear. To ensure the correct requirements remain assigned:
- 
Suspend, deactivate, or block sign-in for the employee instead of permanently deleting their IdP account.
- 
Confirm that the employee appears as Terminated in Vanta.
- 
Complete the employee’s offboarding requirements in Vanta before permanently deleting their IdP account.
 
 

## Reassigning Groups
- 
Once a user is assigned to a group through Entra (Office 365), their group cannot be reassigned from within Vanta.
- 
To control the user's group through Vanta, remove the user from the Entra (Office 365) created group or delete the imported group in Vanta.
- 
If you rename a group imported from Entra Office 365, the name change must be made within Entra ID and Office 365. Once saved, the name change will also be reflected in Vanta.
 

## Removing Imported Groups
- 
The imported group must be deleted to remove an Office 365 group import.
- 
To delete a group, open the Groups tab and select the Entra (Office 365) imported group you would like to remove
- 
Select the options menu represented by 3 dots, and select Delete
- 
When this happens, all existing identity provider group users are reassigned to their prior Vanta groups, and the identity provider group is removed from Vanta. The group can always be re-imported if the admin changes their mind.
 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759967/e8c02d85793e72442c1dde52882f/33279825391764?expires=1794967200&signature=06e58c7c1dee56abf8e04890c14accc44fc4aaf43fbf66e97b460bbb1e6caff1&req=dSUmEM57lIhZXvMW1HO4zWMaWS3UMKSKfB7g%2Fwf6y5xIbY1DlTHI9%2BonmRZ%2F%0ARG3EhkCNukTvZRSIov0%3D%0A>
 

## Please keep in mind that:
- 
We do not support IdP groups with more than 8,000 employees. Users will not see groups with more than 8,000 employees show up in the UI when importing groups.
- 
We don't support fetching more than 10,000 groups for our Entra (Office 365) IdP group integration due to rate limits imposed by Microsoft. If a user has 10,000+ groups, only the first 10,000 will be available for import.
- 
Changes from identity providers are only reflected when resources are refreshed on a two-hour cadence. Customers can also trigger these refreshes from the group's drawer on the group's page.
- 
Suppose a user is in multiple groups in their identity provider, and both groups are imported within Vanta. In that case, we place the user into the last imported group in Vanta by default. This can subsequently be changed from the people page by editing the group for a user.

## Images

- [image 01] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--01.png
- [image 02] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--02.png
- [image 03] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--03.png
- [image 04] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--04.png
- [image 05] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--05.png
- [image 06] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--06.png
