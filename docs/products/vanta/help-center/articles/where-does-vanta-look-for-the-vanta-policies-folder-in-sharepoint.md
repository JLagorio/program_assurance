# Where does Vanta look for the "Vanta Policies" folder in SharePoint?

Source: https://help.vanta.com/en/articles/11345899-where-does-vanta-look-for-the-vanta-policies-folder-in-sharepoint
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Vanta has the ability to sync policies from your SharePoint. Once SharePoint has been connected, you will need to ensure that the policies are placed in a folder that exists within the root drive. By default, this is the default "Documents" drive on the site. If the default Documents drive was deleted, you would need to create a new library named "Shared Documents". If you recently deleted it, you may be able to restore it <https://support.microsoft.com/en-us/office/restore-a-shared-library-317791c3-8bd0-4dfd-8254-3ca90883d39a>.
 
If this differs for your environment, you can determine your root drive by logging in to the Graph Explorer here <https://developer.microsoft.com/en-us/graph/graph-explorer> and hitting the following endpoint:
 https://graph.microsoft.com/v1.0/sites/root/drives
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759604/233e903ed3043558a3455d46fe4f/18516012809876?expires=1794967200&signature=f121d27bf6eac0af1c7b5760de3846b852775987eda45f86e829104f36d913ff&req=dSUmEM57lIdfXfMW1HO4zTwDJIZOtAADJ3p8lsevjKEqJJT%2BWX7fYFwUplQB%0AIlSVrEXm%2BiILkrG6z%2FM%3D%0A>
 
That base URL will tell you in which directory Vanta is looking. In this example (and by default in SharePoint), this is the Documents page:
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759603/773d65ebc1d9657c6d976bfd8d40/18515997300884?expires=1794967200&signature=dd64baa2eb2d1b8afc2b31aa4033e35b08e87b8ec077776e280db0999977176e&req=dSUmEM57lIdfWvMW1HO4zZMAV%2BDeSNcCRkL%2F15TrbGpvnLphY%2Bmv0xoEN0Yh%0A1TGyp5ida3yn0CKqpU4%3D%0A>
 

## If Vanta can't find your folder 
If your SharePoint files don't appear in Vanta, check the following: 
- 
The folder is in the selected site’s default Documents library
- 
The folder is at the top level of that library, not nested inside another folder
- 
The files are in a supported format: .docx or .pdf
If your policies are stored elsewhere in SharePoint, move or copy the files you want to sync into the supported Vanta folder before syncing.
 

## Keep in Mind:
- 
The SharePoint sync will only work with .docx files and .pdf files. If the files are of another file type, it will show a "No results found" message.

## Images

- [image 01] ../../images/integrations/microsoft/where-does-vanta-look-for-the-vanta-policies-folder-in-sharepoint--01.png
- [image 02] ../../images/integrations/microsoft/where-does-vanta-look-for-the-vanta-policies-folder-in-sharepoint--02.png
