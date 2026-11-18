# Dynamic IdP Groups: Google

Source: https://help.vanta.com/en/articles/11345665-dynamic-idp-groups-google
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Using the Dynamic IdP groups functionality reduces the time spent creating groups and manually adding or removing members in two places. Now, you will be able to work with the groups that have already been made within Google and use them for workflows and assignments within Vanta!

## What are Groups?
- 
Multiple users with similar responsibilities, tasks, or job descriptions can be grouped.
- 
Groups can then assign Task sets to multiple users, making it easier to manage which tasks are assigned to specific people.

## Permissions
- 
To leverage the connection between Vanta and Google, the user connecting to Google Workspace must have Groups Reader permissions to import groups.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766550/3e5ef9c21346bc4537f74ccab978/11666787950356?expires=1794967200&signature=9ffbf6cf01fac7718b0b46c0308330aeb5803c147300edcf69fda9cc48dc0cb9&req=dSUmEM54m4RaWfMW1HO4zUcYFdsw2To9xbSrir9IwxrVlkSml9FJ125LzOno%0AzSHN2Gkob9Mez2nlUjs%3D%0A>
 

## Importing Groups from Google
- 
Google must be connected through the Integrations page as your IdP to use the dynamic group functionality.
- 
Select +Add Group and then Add from identity providers from the People > Groups page
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766567/ffe2e80ee7b785389069ef561297/35977451499796?expires=1794967200&signature=155dceb8ee9f64e8ea0acb949a03f9b3de6fb15b021f67b90f32431bed1a4716&req=dSUmEM54m4RZXvMW1HO4zdfzSZph%2B%2Fc%2FBsqzyJpYSglNwsUmS4i0aT1R2Tfr%0APgU0y7icL8OI1MLQVpk%3D%0A>
- 
From here, you will be asked to select which groups you would like brought Into Vanta.
- 
Select the check box next to the group name to signify they should be imported.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766572/ac61bcae866574407a9e3bca9941/35977438588820?expires=1794967200&signature=6181be27e3881e8a33322ba4fc1b1118f8dec46d185d627e03d4eef4d46dd8d9&req=dSUmEM54m4RYW%2FMW1HO4zZ0%2FZ7tbT014Cn8PYtMYQLzPenXG8OY6Po6aTlJM%0AHZVrXVUtR0v1y8yj0hA%3D%0A>
- 
Once you have selected, click Add groups in the lower right-hand corner.
- 
Choose a task set from the drop-down to be assigned to each group
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766555/47274a2e35fa00c1fec7162d9a55/15927802710164?expires=1794967200&signature=5d3ed264b5392db36c3cd8168456a916dc0e65454c8403b82a4b6b34fc9bb6b9&req=dSUmEM54m4RaXPMW1HO4ze3crRZ61iACJefpvH8mz7Jc85Smt%2B2FWWtEm8%2Fr%0AQFuf6xNnuPm5nELyceI%3D%0A>
- 
Click Next
- 
Could you review your import? If you would like to make changes, select Back. If you are ready to import into Vanta, you can choose Import Groups.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766583/ada52d86148c46659bcfd8922206/15927808640916?expires=1794967200&signature=a45c70aa1e86cb559d9ad549c55365a59c4f8c520a746dcfba3a359fa346bcdd&req=dSUmEM54m4RXWvMW1HO4zZGw0CnZQam7ma8aNafJM40ufrcmFfCQ922wfDmJ%0AlNkSVwqRc1sjhYR81AA%3D%0A>
- 
The newly imported groups will appear on your groups' list as Created by Google.
- 
Task Sets for an identity provider imported group can be updated similarly to any other list or group.
​​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766585/77b3b594aef7c4183f57693f9dbc/15927890833044?expires=1794967200&signature=309f097fa01905c4ec261b89a48ec0bf50e1cf4315ada70cece0f33ffbc2782d&req=dSUmEM54m4RXXPMW1HO4zTVSR7RHk8sjq8o%2BwHSWwMG%2BEKOdRfuMxBtAmPS8%0ArkmzYMjNWA24HhtM5Tc%3D%0A>
 

## Updating Groups in Google
- 
When adding or removing <https://support.google.com/a/answer/10284003?hl=en> users from groups within Google, that information will automatically be updated and reflected in Vanta.
- 
If you don't see the changes reflected right away, select Refresh data to force the update
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
Once a user is assigned to a group through Google, their group cannot be reassigned from within Vanta.
- 
To control the user's group through Vanta, remove the user from the Google-created group or delete the imported group in Vanta.
- 
If you rename a group imported from Google, the name change must be made within Google. Once saved, the name change will also be reflected in Vanta.
​

## Removing Imported Groups
- 
The imported group will need to be deleted to remove a Google group import.
- 
To delete a group, open the Groups page and select the Google-imported group you would like to remove
- 
Select the options menu (...), and select Delete Group
- 
When this happens, all existing identity provider group users are reassigned to their prior Vanta groups, and the identity provider group is removed from Vanta. If needed, The group can always be re-imported if the admin changes their mind.
​
Please keep in mind that:
- 
We do not support IdP groups with more than 8,000 employees. Users will not see groups with more than 8,000 employees show up in the UI when importing groups.
- 
We don't support fetching more than 10,000 groups for our Google IdP group integration due to rate limits imposed by Google. If a user has 10,000+ groups, only the first 10,000 will be available for import.
- 
Changes from identity providers are only reflected when resources are refreshed on a two-hour cadence. Customers can also trigger these refreshes from the group's drawer on the group's page.
- 
A person can belong to multiple imported IdP groups at the same time, and receives task set assignments from every group they belong to. Tasks are combined across all their groups, not replaced.
- 
If a person exists in more than one connected identity provider (for example, both Google and Okta), IdP group membership is calculated using their primary IdP only, not aggregated across every connected IdP.

## Images

- [image 01] ../../images/integrations/google-workspace/dynamic-idp-groups-google--01.png
- [image 02] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--01.png
- [image 03] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--02.png
- [image 04] ../../images/ux/personnel/dynamic-idp-groups-google--04.png
- [image 05] ../../images/ux/personnel/dynamic-idp-groups-google--05.png
- [image 06] ../../images/ux/personnel/dynamic-idp-groups-google--06.png
