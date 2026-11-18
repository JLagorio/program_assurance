# Controlling Scope through PingOne

Source: https://help.vanta.com/en/articles/11345640-controlling-scope-through-pingone
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

Vanta's PingOne integration enables you to control which employees should be automatically marked in and out of scope in Vanta via PingOne by granting the Vanta application access to users in PingOne, and by enabling scoping via PingOne.
Please note: It is important to consult Support and/or your auditor to validate the set of employees that should and should not be managed in Vanta.
 Ensure the Vanta app is configured correctly in PingOne
- 
Please follow the instructions here. <https://help.vanta.com/en/articles/11345641>

## 1. Create Groups in PingOne
- 
Log into PingOne.
- 
Go to Directory and select Groups.
- 
Click the + icon to create a new Group.
- 
The group name is essential; it must include "Vanta" as a standalone, capitalized word. It does not need to start with Vanta. Valid examples: Vanta Scoped Users, Engineering Vanta.
- 
These groups will be used for scoping purposes within Vanta.
- 
Click Save.
- 
On the opened drawer, click the Users tab and add the users you would like to be scoped in Vanta.
- 
Click Save.
​​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756853/c99fb715c6c442db704d6548e410/34592247389972?expires=1794967200&signature=8e464c40744b1136181c3c3d2a7a410d4dacb3fc41525578dd4faa20af83e66d&req=dSUmEM57m4laWvMW1HO4zc1DU%2F2x3P48WSp%2Fw4CKyut1eKdnkZtyuP4Iai%2Bo%0AU01c%0A>

## 2. Enable IdP Scoping in Vanta
- 
Select Integrations from the left-hand navigation panel.
- 
From the Connected tab, find PingOne under Identity Providers.
- 
Click on Configure scope.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756855/010f946a58d3e52b4a6d989da44f/34592208891540?expires=1794967200&signature=2e400f339dbf09e40e5ad05718e7f329f175e5941dcc253eaaf719153c230ee0&req=dSUmEM57m4laXPMW1HO4zcWLj20rZgySxlu%2FuaDgMsxC%2B58es3PyfMCFZyIV%0Ae%2BpvKbdOxJp6%2Brvh8jA%3D%0A>
- 
Turn on the toggle next to Controlling scope through PingOne.
- 
Vanta's PingOne integration allows you to control which employees should be automatically marked in and out of scope in Vanta through PingOne by granting the Vanta application access to users in PingOne and enabling scoping through PingOne.
- 
Select the IdP Group you would like to scope your users by.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756852/9143ad134cd7b09928ae628170e1/34592208895636?expires=1794967200&signature=cb6f5f14c8b09cfafc51e0b609b70c784de4062574d3ffeb518cf85a35871c5f&req=dSUmEM57m4laW%2FMW1HO4zTsFbxvrNpkfk8Olw%2BaTBCavCd6T%2FCgIISx2jRX3%0AlAht94Fmfmlhk0carsU%3D%0A>
- 
Select Publish changes.
Once this feature is enabled, all employee scoping will be managed through PingOne, and the scoping toggle in Vanta will be disabled. Vanta will update the scope status for IdP accounts on the following data fetch, which happens hourly.

## Images

- [image 01] ../../images/integrations/pingone/controlling-scope-through-pingone--01.png
- [image 02] ../../images/ux/integrations/controlling-scope-through-pingone--02.png
- [image 03] ../../images/ux/integrations/controlling-scope-through-pingone--03.png
