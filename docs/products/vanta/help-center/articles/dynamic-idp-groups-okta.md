# Dynamic IdP Groups: Okta

Source: https://help.vanta.com/en/articles/11345666-dynamic-idp-groups-okta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Using the Dynamic IdP groups functionality reduces the time spent creating groups and manually adding or removing members in two places. Now, you will be able to work with the groups that have already been made within Okta and use them for workflows and assignments within Vanta.
 

## What are Groups?
- 
Multiple users with similar responsibilities, tasks, or job descriptions can be grouped.
- 
Groups can then assign Task Sets to multiple users, making it easier to manage which tasks are assigned to specific people.

## Importing Groups from Okta
- 
Select +Add Group and then Add from identity providers from the People > Groups page
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766641/a3cd27922cff18ddb96bc4bde6b5/35977373776276?expires=1794967200&signature=d930b5e19653cb10334852ea0634cb38e106e478a409664215d3bc4008e3a481&req=dSUmEM54m4dbWPMW1HO4zVOeXG91i6ysbtKZLHlT8Qcs1C1eZaWW%2BOV25dmQ%0A4Qm92DvhAjodAU%2Bhl0Y%3D%0A>
- 
From here, you will be asked to select which groups you would like brought Into Vanta.
- 
Select the check box next to the group name to signify they should be imported.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766639/42ec2efdc915c1c3906c45b2ba05/35977353389716?expires=1794967200&signature=3a7ab4785931afe3f76c56680091980ef2e69a32ed3841ada328368889c737ca&req=dSUmEM54m4dcUPMW1HO4zR%2BRW3pVeH2Xv6VP1wgrLnxsNFSUW5tY38scLyem%0AD94k7LjLKNJJtb4VRjQ%3D%0A>
- 
Once you have selected, click Add groups in the lower right-hand corner.
- 
Choose a task set from the drop-down to be assigned to each group
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766645/6d3ef7ee7f81138c8420ebb3bdb5/15933697396628?expires=1794967200&signature=23efae6f33746f2e9bec2680ae72842098826ed4c5e361cb3b94d8e54fce315c&req=dSUmEM54m4dbXPMW1HO4zYaQFGfl3CF3NB8OW%2Bez3wo47%2BL8XDrLBioee0eW%0AtF%2B4slFGZnwzjz7m9no%3D%0A>
- 
Click Next
- 
If you would like to make changes, select Back. If you are ready to import into Vanta, you can choose Import Groups.
- 
The newly imported groups will now appear on your groups' list as Created by Okta
- 
Tasks sets for an identity provider imported group can be updated similarly to any other list or group.
​​

## Updating Groups in Okta
- 
When adding or removing <https://help.okta.com/oie/en-us/Content/Topics/users-groups-profiles/usgp-groups-main.htm> users from groups within Okta, that information will automatically be updated and reflected in Vanta.
- 
If you don't see the changes reflected immediately, select Refresh data to force the update.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766643/d4e53d859eb8bee0212f2c7a0b2c/27502977124116?expires=1794967200&signature=d9ac8cc685290026c255b54e3bb7b4294c32fda63c517895bdcee1019e0a27d7&req=dSUmEM54m4dbWvMW1HO4zSrdEpQd%2B67FQzpf2ojqONzv6Z6%2FEwsyGQ4xZ6Hp%0AYd5UJlTcVIIGd3Q3YoE%3D%0A>
⚠️ Note:  If you use imported IdP groups to assign Personnel tasks, permanently deleting an employee from your IdP may remove their group memberships from Vanta.
 
If the employee is deleted before their Vanta offboarding is complete, their group-specific tasks and access-removal requirements may no longer appear. To ensure the correct requirements remain assigned:
- 
Suspend, deactivate, or block sign-in for the employee instead of permanently deleting their IdP account.
- 
Confirm that the employee appears as Terminated in Vanta.
- 
Complete the employee’s offboarding requirements in Vanta before permanently deleting their IdP account.
 
 

## Reassigning Groups
- 
Once a user is assigned to a group through Okta, that group can only be reassigned to other Okta groups they are members of in the Edit details section of the People page <https://app.vanta.com/people> drawer <https://app.vanta.com/people>.
- 
To control the user's group through Vanta, remove the user from the Okta-created group or delete the imported group in Vanta.
- 
If you rename a group imported from Okta, the name change must be made within Okta. Once saved, the name change will also be reflected in Vanta.

## Removing Imported Groups
- 
The imported group must be deleted to remove an Okta group import.
- 
To delete a group, open the Groups page and select the Okta-imported group you would like to remove
- 
Select the options menu (...), and select Delete Group
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516766669/5bb22e80072cee885ec323435620/27502993557524?expires=1794967200&signature=69d11723ae4d28e7e4e7356bdf3b9d0b2400a65f40f3133dab7d17035f1e4cc5&req=dSUmEM54m4dZUPMW1HO4zS%2B%2B9Vw4mcK2OS1lAyX91nqQbwzkKSnTT0USTy5z%0ARZaafzZzLGiGr8aktjI%3D%0A>
- 
When this happens, all existing identity provider group users are reassigned to their prior Vanta groups, and the identity provider group is removed from Vanta. The group can always be re-imported if the admin changes their mind.
​
Please keep in mind that:
- 
We do not support IdP groups with more than 8,000 employees. Users will not see groups with more than 8,000 employees show up in the UI when importing groups.
- 
We only support fetching at most 10,000 groups for our Okta IdP group integration due to rate limiting imposed by Okta. If a user has 10,000+ groups, only the first 10,000 will be available for import.
​
- 
Changes from identity providers are only reflected when resources are refreshed on a two-hour cadence. Customers can also trigger these refreshes from the group's drawer on the group's page.
- 
A person can belong to multiple imported IdP groups at the same time, and receives task set assignments from every group they belong to. Tasks are combined across all their groups, not replaced.
If a person exists in more than one connected identity provider (for example, both Okta and Google), IdP group membership is calculated using their primary IdP only, not aggregated across every connected IdP.
​

## Images

- [image 01] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--01.png
- [image 02] ../../images/ux/personnel/dynamic-idp-groups-entra-office-365--02.png
- [image 03] ../../images/ux/personnel/dynamic-idp-groups-okta--03.png
- [image 04] ../../images/ux/personnel/dynamic-idp-groups-okta--04.png
- [image 05] ../../images/ux/personnel/dynamic-idp-groups-okta--05.png
