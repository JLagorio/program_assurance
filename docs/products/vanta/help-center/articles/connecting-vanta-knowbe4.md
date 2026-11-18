# Connecting Vanta & KnowBe4

Source: https://help.vanta.com/en/articles/11345683-connecting-vanta-knowbe4
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 
Vanta's KnowBe4 integration syncs completed training from selected training campaigns from KnowBe4 to Vanta.
Vanta accesses the KnowBe4 Reporting API with read-only permissions, and syncs assigned trainings to users profiles to automatically update their security task set in Vanta.
- 
Admins can set up the KnowBe4 connection and select which training campaigns they want to track in Vanta for which standards.
- 
Onboarding settings will automatically update to reflect that KnowBe4 is the chosen method for SAT and track training.

## Obtaining your KnowBe4 Reporting API Key
- 
KnowBe4’s Reporting API feature is limited to specific plans, and is required to successfully connect Vanta's KnowBe4 integration.
- 
For instructions on creating the Reporting API, please see KnowBe4's instructions on Creating a Reporting API Token <https://support.knowbe4.com/hc/en-us/articles/115016090908#CREATING>

## Setting up KnowBe4
- 
In Vanta, go to the Integrations page, click Add integration, and search for KnowBe4. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect
- 
Paste your generated Reporting API Token and select Store token
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764910/432d3ecb504e7d8cc14b5a47db5b/20292430300948?expires=1794967200&signature=b4edd1fbd554116be16d1ea297967896ee88d0f7418a9eaf238807f6feedf74d&req=dSUmEM54mYheWfMW1HO4zSbsX1Jbe5on6LMffBi%2BPrWANGKq0JYMNbVTQez2%0ACM1v65UtoUKbMY7cAmo%3D%0A>
- 
Use the Choose a Campaign dropdown to select which campaigns you'd like to track in Vanta
- 
Campaigns are pulled from your KnowBe4 account and you can include both inactive and active campaigns.
- 
Keep in mind that only annual recurring tasks are fully supported. As you can bring in monthly campaigns, this will reset the requirement every month.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764915/a13cd7cba6aee44711f5f351a472/20292405259412?expires=1794967200&signature=d836c43964d6ad000c8238ceefeb8b56b9356bd11bf070e49f035053fb3e7aef&req=dSUmEM54mYheXPMW1HO4zf9P0PdFEfIeZSvSb%2FYtif8JOUaqmgU18Dy%2FACZB%0AddVhRnNiAFWG%2FkDnD%2Fg%3D%0A>
- 
Associate each campaign with a Vanta SAT type to indicate which campaign fulfills each training requirement. You can add as many available KnowBe4 campaigns as you like and associate each campaign with multiple types of requirements & standards. Associate the campaign by selecting the checkbox:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764909/7d4c36f486fe252067e878a10e31/20292405260692?expires=1794967200&signature=6e78992af6124785dc1b5bca819e2d984fe3542282fd8a704f7f1606c61a5d31&req=dSUmEM54mYhfUPMW1HO4zSacmCBp%2Bt6emgpwPqG%2FLDxIs%2BGZwdwlTH7tuAm4%0AIIja75VhQPAD%2FAO%2BsOA%3D%0A>
- 
Click Save to complete the connection flow.
- 
To make updates or modifications, admins can go to the Integrations page, locate KnowBe4 under the Connected tab, and click Manage:
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764934/6b5d825ee59a77bc0cf8fb2e5c40/20292405260948?expires=1794967200&signature=458b024bdfcec05c593ff5516d2fd377e6c0cb6079612d5cf9045dad02af9dac&req=dSUmEM54mYhcXfMW1HO4zftMT%2Fse%2BGMPWEeRLmo%2FjV7XW2K1it9Wd8njA7vL%0Ao8FrhKXJaHFD1KYhovQ%3D%0A>
- 
Admins can visit the People page to monitor each employee's progress by clicking on a specific user name
​
- 
KnowBe4 users are associated with individual Vanta employees by email. Employees' emails must match between KnowBe4 and Vanta in order for trainings to be linked to the correct profile in Vanta. (See Error: Users not showing as passed for KnowBe4 security awareness training <https://help.vanta.com/en/articles/11345916>)
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764938/0d5bb285329b5f4078952bf087d4/32867710370708?expires=1794967200&signature=01e4e58fd59e4f1c0f6eb78f3e14a22df208cc9959c12bad95ab3559065725a2&req=dSUmEM54mYhcUfMW1HO4zSzvBhBlsEtjseX18Aj6i9vSCrBOdWHvKoa3fZpX%0AxaksZQw0NP1tkRD%2FpDE%3D%0A>

## Enable Security and privacy training requirement
To track training as part of your employees onboarding and recurring tasks, Security and privacy trainings must be enabled in Task Sets.
Vanta will automatically detect if an external SAT provider is connected, and will select custom by default
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764936/ab52c5a4c08da79e515d228471e4/27576854093204?expires=1794967200&signature=d31b8d1aabc3f04b802b06f92861f63d4d6ea79064486fb9015b16f142965197&req=dSUmEM54mYhcX%2FMW1HO4zUt418oIGUx9oZSWkYOZJX13vxzBhfkx68W6gKVy%0AyBpvvI04CwiP9E%2B4Jdg%3D%0A>
- 
It is not currently possible to enable a combination of Vanta provided SAT training and third-party SAT provider training.

## Sending Training Reminders
Reminder notifications for users to be notified of training campaigns must be set up within KnowBe4. Vanta is currently unable to support reminder notifications for third-party security training integrations. See KnowBe4's Training Campaign Notifications guide for further instructions <https://support.knowbe4.com/hc/en-us/articles/115010848868>

## Disconnecting KnowBe4
- 
Please keep in mind that if KnowBe4 is disconnected from Vanta, all associated task completion information will also be removed from Vanta

## Images

- [image 01] ../../images/integrations/knowbe4/connecting-vanta-knowbe4--01.png
- [image 02] ../../images/integrations/knowbe4/connecting-vanta-knowbe4--02.png
- [image 03] ../../images/integrations/knowbe4/connecting-vanta-knowbe4--03.png
- [image 04] ../../images/integrations/knowbe4/connecting-vanta-knowbe4--04.png
- [image 05] ../../images/ux/personnel/connecting-vanta-knowbe4--05.png
- [image 06] ../../images/ux/settings/connecting-vanta-knowbe4--06.png
