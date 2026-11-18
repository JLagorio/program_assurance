# Using one Vanta Login for Multiple Domains

Source: https://help.vanta.com/en/articles/11345766-using-one-vanta-login-for-multiple-domains
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Vanta allows login emails to be associated with multiple active Vanta users in different domains. The same email can now be added to other domains as an active user via IdP resource fetch or manual user creation! Users can now choose which instance to log into if they are a member of multiple Vanta instances. 
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764364/2760eef249c947669067340b9f94/15545797435284?expires=1794967200&signature=0fa5466f328c15e46a136d16fd9a78dd0ee997093ad07b04ca0efbc17a431475&req=dSUmEM54mYJZXfMW1HO4zeGJvQdhwoDbkFXIlcZVbIVNUufeZTYq2mdfSv29%0A%2B6vGnSAFaH1tVktsffw%3D%0A>
After logging in, you can switch instances or accounts by clicking on the company logo at the top left and selecting a different account.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764362/13384ac81ca69503487fc588fce8/5407309441172?expires=1794967200&signature=857106df10d57c32bb72735521c810c3abaf1b83ffb5734dc2666f3bcde7c7a1&req=dSUmEM54mYJZW%2FMW1HO4zRmOa8EffGbe0N2VvnzMtReuGUDccHjklC2836eo%0AsYW3ScVLKaftz4HdWho%3D%0A>
Multi-instance login and switching are only supported if the user signs in via the email login link flow:
- 
Vanta does not permit multiple active users in the same domain to share an email.
- 
Due to security concerns, Vanta does not support logging into multiple accounts via identity providers.
- 
Vanta Device Monitor will continue to be associated with and report information for only one instance.
- 
Contractors with the Vanta Device Monitor installed and access to multiple instances can select which instance their agent will report to during agent registration.

## Frequently asked questions
Will this enable Vanta domains to use the same Identity provider account for multiple Vanta instances?
- 
Yes, if the same identity provider instance is connected to multiple domains, then users from those domains will be able to log into either account. Suppose an identity provider instance is shared between domains. In that case, we still encourage customers to scope out users as appropriate so that users are only in the domain relevant to them.
How does Vanta detect or remediate multiple active users with the same email appearing in the instance?
- 
This will be surfaced via the "Identity Provider linked to Vanta" test failing.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764365/53d03bf7aa835eeb529367000eef/5505713665428?expires=1794967200&signature=1413edf032ac1af17d6ce897dcf768b051e6ae9250a7a5f25b7c6700e70cee53&req=dSUmEM54mYJZXPMW1HO4zUNb2wim45wFlQflySHkMU3LmdWiSUvjD32J8Owt%0AALafOYa3%2FKQDkDz6nNQ%3D%0A>
- 
This issue can be remediated with the following steps:
- 
Ensure that the old user with the email is correctly deactivated.
- 
It will vary case by case, but this is often due to an HR User record getting incorrectly linked to a past employee. Unlinking the HR User is the fix if this is the case.
- 
The new user will be brought in on the subsequent resource fetch, and the test should start passing.
Do users need to be admins to log into multiple domains? Or will this work for regular employees as well?
- 
When logging in, regular employees can select between domains if their email is associated with users in multiple domains.
- 
Please note that we will show the domain switcher and user account menu for users in multiple domains who get redirected to the onboarding page. If a regular user lands on the onboarding page in domain A, but would like to switch to domain B, they will be able to change as expected by using the user account menu.

## Images

- [image 01] ../../images/ux/other/using-one-vanta-login-for-multiple-domains--01.png
- [image 02] ../../images/ux/workspaces/using-one-vanta-login-for-multiple-domains--02.png
- [image 03] ../../images/ux/tests/using-one-vanta-login-for-multiple-domains--03.png
