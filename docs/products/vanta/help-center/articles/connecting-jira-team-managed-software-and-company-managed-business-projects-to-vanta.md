# Connecting Jira Team-managed Software and Company-managed Business Projects to Vanta

Source: https://help.vanta.com/en/articles/11346037-connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

There are two types of projects in Jira; one type is team-managed software, and the other is company-managed business software. You can see this under the type column on the projects page in Jira.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767571/f589d9a16f00424b0d0ca061a149/13071731506836?expires=1794967200&signature=2a2f284cd9d71e661296fa42caf35302135e90203e5a6c31f703d8442b5dc80e&req=dSUmEM54moRYWPMW1HO4zXLMBRK79yuD6aiXg1gPTdsiW%2Bahw9ptPCYAkNZX%0AeCse70Ci7MmtiIsUE6c%3D%0A>

This is important because connection steps differ depending on the type of Jira project you want to monitor in Vanta. This article will outline the steps needed to grant permissions for two kinds of projects.
 

## Prerequisites
- 
Administrator privileges in Jira and Vanta
 

## Procedure for a Company-Managed Business Project
- 
Go to the projects page in Jira and hover over the company-managed software project you want to connect to Vanta. Click on the[…] and then click on Project Settings
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767577/f5f7b91fdbf0f451337baa8b1056/13071740451604?expires=1794967200&signature=81a77caa094123d9894b74f792a5f9e7eb583d9240e1b5d4abed406760ae2073&req=dSUmEM54moRYXvMW1HO4zTHE0TeHGSHLVLfQeLW4OBKj%2BCs2HmRa5oAXX1Ot%0AW7B8mXiHKkPXDC5E8rU%3D%0A>
 
- 
You should be taken to the project settings page, where you now click on Permissions.
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767575/140aa4762284afa06c03f5da9345/13071740680980?expires=1794967200&signature=4276a2dc4329c0778651cc3797c90ac4d5bd642f1cdba8c094d1969a1e2f16cc&req=dSUmEM54moRYXPMW1HO4zWScoHqRRSVUjZd3j%2BWsFQQy3kO7IfCMOuZ8bgyH%0A%2B%2BNNFt1mC8eqBcbcviE%3D%0A>
 
- 
Next, click on Actions(with the gear icon) on the top right, and then select the first option, Edit Permissions. 
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767574/72d2e79a7958201f48f6ebeb8d01/13071768437012?expires=1794967200&signature=97d91aaafaa0dbf48c187640cba1b1a5783f651d633d3f5d6f9abe528988f435&req=dSUmEM54moRYXfMW1HO4zbV%2BZddQn%2BFuOpJQQ5tZGWbmkHgteTwDiMRJuJAV%0AIYxxukTyVbn8%2FwEQHO8%3D%0A>
 
- 
You will be taken to a page listing permissions.
- 
Scroll down until you see Browse Projects.
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767582/d55eee64ea77bb57282b0743c2a5/13071897133076?expires=1794967200&signature=e59222edfb4ec2e9c420bc94913196b719b2e28ed86ee652ff6e8792de23bede&req=dSUmEM54moRXW%2FMW1HO4zZDViQTQfq7AgaTdpav4nmyacOTXjDrbhymnMwZB%0AP1gPnXtPZ8uA9A6HhJU%3D%0A>
 
- 
We will need to grant the account used to connect Jira to Vanta this permission. You must do this to be able to pull in this project. To begin this process, click Update.
 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767583/5e62d91f5637370f1f85c7013805/13071841806484?expires=1794967200&signature=dbe79ff62f02dbd65fd382d2eb36370625be358e713e9f127bca7409c03cc9b2&req=dSUmEM54moRXWvMW1HO4zfXehKrPBGRzIdBoVOS8Cps56x%2BdXkAJ92cNCKf0%0AEL33hA0E3Lp7lztEkYw%3D%0A>
 
- 
And then click the checkbox next to Single User on the checklist that pops up on the screen:
 
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767585/f671bd3e051b6bcf277c95425300/13071869347860?expires=1794967200&signature=d2b8852ed4fb2ce95ba2558a4b6cfc89b40f0fb78f4066af434600f640f958da&req=dSUmEM54moRXXPMW1HO4zVebFmJfzMaaI1wOE8pMFzSCARtY5myh3jDJ4wxJ%0Aio4wSQeWismVvtbvuy0%3D%0A>
 
- 
You will now see a search box where you can search for the administrator account you will use to connect Jira to Vanta and select it.
 
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767584/ee0925818498b107afa4086c1219/13071841960724?expires=1794967200&signature=63092efe925c30f127711668cef73cf0393f74a90ac76f9d740a9ac262bf09c7&req=dSUmEM54moRXXfMW1HO4zcHUrYPDz8NLFluibXteHWLGStoZzvU79mAWy4yP%0AMDVLF2mdXRd5%2BjC2aTc%3D%0A>
 
- 
Click Update to save, and you should see a Done! message with a green checkmark on the top left of the screen:
 
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767592/15f96cf11ecc4b4dbf0402d42146/13071892486420?expires=1794967200&signature=08ba15c32c0855ffa95912fb9d4a324d54fed7cc300433af6fdf45d494babb79&req=dSUmEM54moRWW%2FMW1HO4zZq5hY3bUJaNxxbGDgcG%2FJfhWVgPkJrTAYyK9vnv%0Aoo08SFKjJi7w8bP%2BnpQ%3D%0A>
 
- 
If you want to be able to create and assign issues on the test page, you will need also to grant the account the following permissions:
- 
Create Issues
- 
Assign Issues
- 
Assignable User
- 
They are in the same list of permissions as the Browse Projects permission from step five under Issue Permissions.
 
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767594/bdf8f00c55d8770539e16457e95d/13071892670100?expires=1794967200&signature=7a2cce35ad51ae850c5551256ddc63f829d6664db7c97f9409440072751fbc03&req=dSUmEM54moRWXfMW1HO4zcVC2mnLvrsBfbif7FyqxRHLobzPxGem8b%2BsfZkM%0AGmnV%2B7Htt7INEI8Olc4%3D%0A>
 
- 
You would repeat the same steps by clicking Update, checking Single User, and selecting the administrator account you are using to connect Jira to Vanta. You can re-connect Jira to your Vanta instance if you don't want to grant these permissions. 
 

## Procedure for a Team-Managed Software Project
- 
Go to the projects page in Jira and hover over the team-managed software project you want to connect to Vanta. Click on the[…] of the project, then click on Project settings:
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767596/ab1de43272f2e3a31c908fc4a251/13072520557844?expires=1794967200&signature=a07b408f104cfdb71eaf5eb4158c97712546987753983dd5dbeb5aec64a360a5&req=dSUmEM54moRWX%2FMW1HO4zfKdNMqSapNmatbbVAKHGCa3H3sYoOI0UvVxSEGa%0A5il0V7IrZ0tfPFlQ8Cs%3D%0A>
 
- 
You will be redirected to the project settings page. Select Access from the left-hand menu:
 
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767599/f3890ca46599fb9352066222f810/13072508919572?expires=1794967200&signature=5ba47e5f6928ecd020a92c88d562e27247f8fbb69085f7fd53f0c7baf5a70b99&req=dSUmEM54moRWUPMW1HO4ze44azKZbsXWs%2F6XQse6L%2F10RkZenXWPx6TWEs4r%0AAgUUGEUDjj%2FQIHAeQAM%3D%0A>
 
- 
Click the blue Add People button in the top right
 
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767618/3660b8521d846ec704e90440913f/13072556254228?expires=1794967200&signature=42a525a85064c16aef7d0a171db5465fcad8fd3e38bdc0e4dcff6fedb8a493b3&req=dSUmEM54modeUfMW1HO4zT1NeVSWD8qFdHgu3Zq6cjJ8VrTfjQ4DsRN5KupA%0AOPFvD1gE2ne8IFhu3G4%3D%0A>
 
- 
Now, you can search for the Jira account you will be logged into when connecting Jira to Vanta. This should be an administrator account:
 
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767630/fedc2c17638cb8af2f7b53a2588f/13072558098068?expires=1794967200&signature=35d3f4e73ffe3a951c4a24244fd0f544cbe511a7339a36c3b2c694155abd8e81&req=dSUmEM54modcWfMW1HO4zZFjn%2BCPzcgc14zUTfHvn6RxHNgt9b3nL%2BW5CywW%0Ak1pyGIcLms8qc4H7ZEc%3D%0A>
 
- 
Now, set this user's role as either a viewer or a member. Choose viewer if you do not desire to grant Vanta write permissions; this means you will lose the ability to create Jira tickets from the test page in Vanta.
 
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767636/13f02bbca254dd833f8b64b33e86/13072565322004?expires=1794967200&signature=0e8ad87e669c116ba74b1fcb17d108604b78ddf3609219f3f34283ce6b7fbae5&req=dSUmEM54modcX%2FMW1HO4zbhzuve0L9RW%2BiOLavwuCUoEpTN9iRYCu3O1%2BtxY%0A51wbsP0GCbNL3wKFZ%2Fo%3D%0A>
 
- 
Choose a member if you would like to be able to create issues in Jira from a test page in Vanta:
 
[image 16]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767643/c0c2c7c32473215bf77c34fb53cd/13072567398036?expires=1794967200&signature=0fbc385a45fb4a4c3dee710eadf1ff841d7f06c0fdc9bde2301bbdedcf83abde&req=dSUmEM54modbWvMW1HO4zUu1O5NlJDaU57jDTZrsZ7n%2BHBuVY7uexFXL2Ddg%0AjFR0UF3ZkoadYuj1Y5I%3D%0A>
 
- 
Click Add to save the changes:
 
[image 17]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767652/e690bbbe39953ae9adda49736d18/13072569162388?expires=1794967200&signature=2ae731f8f91e3657ac765c9a4ab3aed93a2224c2ceba666c0efde8542181860b&req=dSUmEM54modaW%2FMW1HO4zcEA3AAKm%2BNo7eY%2Fx3hmgSwFfsJDXm7ZXTif%2BZmW%0Aw8Imda2VgXvxBHAJzpw%3D%0A>
- 
You can now go ahead and re-connect your account.

## Images

- [image 01] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--01.png
- [image 02] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--02.png
- [image 03] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--03.png
- [image 04] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--04.png
- [image 05] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--05.png
- [image 06] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--06.png
- [image 07] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--07.png
- [image 08] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--08.png
- [image 09] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--09.png
- [image 10] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--10.png
- [image 11] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--11.png
- [image 12] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--12.png
- [image 13] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--13.png
- [image 14] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--14.png
- [image 15] ../../images/ux/tests/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--15.png
- [image 16] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--16.png
- [image 17] ../../images/integrations/jira/connecting-jira-team-managed-software-and-company-managed-business-projects-to-vanta--17.png
