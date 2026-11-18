# Syncing Policies from Microsoft SharePoint

Source: https://help.vanta.com/en/articles/11345633-syncing-policies-from-microsoft-sharepoint
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

To leverage this integration, Microsoft SharePoint must first be connected <https://help.vanta.com/en/articles/11345634> through the integrations page within Vanta.
 

## Sync Policies in Vanta
After adding the 'Vanta policies' folder to your document library, the next step is to sync the policies into Vanta.
- 
Navigate to the Policies page in Vanta.
- 
Create a custom policy, or select Start from the list of policies on the page.
- 
From the policy editor page, select Sync a file.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1524271203/74a3a2167f374f4c25eb1ec851d5/Screenshot+2025-05-14+at+12_58_50%E2%80%AFPM.png?expires=1794967200&signature=f4ae05ad8eb772bc22d8d669a10230625ef2ded008ab92d825bc98a65b17d72c&req=dSUlEst5nINfWvMW1HO4zTujB7h0bT93SDGS66efdTk8Aaq%2FTrmLBv9WPnYY%0AlGYhPIL%2FHJfbAuxuTLc%3D%0A>
 
- 
Select SharePoint from the dropdown. Choose the site that the policy is in from the secondary dropdown.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1524273403/de659d7da79fe1b0616f32ce95d1/Screenshot+2025-05-14+at+1_00_41%E2%80%AFPM.png?expires=1794967200&signature=86f4f37048d302436cb598d3ac7294f04c47cb09f3bc9baba5d8ae67305ff657&req=dSUlEst5noVfWvMW1HO4zXslchDbAz8PantE%2FacopT1qEZnBT8PGSWkGMFEz%0APx2npOoWCZuyb%2BTEAR0%3D%0A>
 
- 
Vanta will automatically sync from your site’s default document library. If you don’t enter a search term, Vanta will return all available sites.
- 
The supported folder must be at the top level of the selected site’s default Documents library. If the folder is nested inside another folder, Vanta won’t find it.
- 
SharePoint policy sync is read-only. Vanta can sync files from SharePoint into Vanta, but it can’t write approved policies back to SharePoint or update files in SharePoint.
Please Note: At this time, you can’t choose a custom folder name. Only Vanta Documents or Vanta Policies are supported.The synced folder must live in the default Documents library and Vanta will only look for Vanta Documents or Vanta Policies within it.
- 
A separate Vanta Documents or Vanta Policies folder must be created and set up for each individual SharePoint site you intend to sync.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1524401466/8d0e7023bf0b97c34e49e5ba1158/Screenshot+2025-05-14+at+1_04_16%E2%80%AFPM.png?expires=1794967200&signature=d52c3c72f578397f5dd17291961ec46b23510fc77bd712c4675a29c21ad8d11c&req=dSUlEs1%2BnIVZX%2FMW1HO4zVNau5%2BVD00PEr4TKPVGSSWHfCesSwcF35NINHxd%0Ady3p06fbOY0mjhFN2Xs%3D%0A>
 

## Edit a Policy in SharePoint
- 
When needed, edit the policy in SharePoint.
- 
Vanta regularly fetches any synced policies and will detect when a change has been made, triggering the approval flow.
Policies are synced from SharePoint into Vanta once an hour, but will not affect any previously approved policies.
 
Please Note: The SharePoint sync will only work with .docx files and .pdf files. If the files are of another file type, it will show a "No results found" message.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1524416649/b9c71d6cdf0bc3ef44dc63798e04/Screenshot+2025-05-14+at+2_25_06%E2%80%AFPM.png?expires=1794967200&signature=102123611a504689b01e20645410780538db3cfa9753b90fa027c583bdd04052&req=dSUlEs1%2Fm4dbUPMW1HO4zW4Ve8gOzdLz2SFG7gy55MQrb0pMZ6OAS7M6%2BsFQ%0A1tSOQTEkmhMjEg6CFxM%3D%0A>
- 
Once a .docx file is uploaded to the folder, the Microsoft document will load as an option.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1524418767/444df427c9cb2523559b63928369/Screenshot+2025-05-14+at+1_04_16%E2%80%AFPM.png?expires=1794967200&signature=5577f17206de86bdf5947680d8ac6226ac51d28e6981a2a41b828d8f9c6da995&req=dSUlEs1%2FlYZZXvMW1HO4zeHOciGUHg0U6d3HTpk%2Bat78ABBtd01oGzncnkG0%0AQ3sGVjUFCAinNDTytAE%3D%0A>

## Images

- [image 01] ../../images/ux/policies/syncing-policies-from-microsoft-sharepoint--01.png
- [image 02] ../../images/ux/policies/syncing-policies-from-microsoft-sharepoint--02.png
- [image 03] ../../images/ux/policies/syncing-policies-from-microsoft-sharepoint--03.png
- [image 04] ../../images/ux/policies/syncing-policies-from-microsoft-sharepoint--04.png
- [image 05] ../../images/ux/policies/syncing-policies-from-microsoft-sharepoint--03.png
