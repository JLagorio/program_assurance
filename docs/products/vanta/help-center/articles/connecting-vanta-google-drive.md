# Connecting Vanta & Google Drive

Source: https://help.vanta.com/en/articles/11345637-connecting-vanta-google-drive
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Google Drive uses OAuth to authorize Vanta to monitor your account. By connecting Google Drive, Vanta can automate the synchronization of your company policies and documents. To prevent unauthorized access to private files, Vanta only syncs files from shared drives that are named Vanta Documents and Vanta policies (these folder names are case sensitive) respectively. 
 
This means Vanta cannot sync personal files from Google Drive. Vanta's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy <https://developers.google.com/terms/api-services-user-data-policy>, including the Limited Use requirements. Once synced, modifications to files in Google Drive will automatically reflect in the corresponding policy within Vanta. After initial synchronization, the file doesn't need to remain in the original "Vanta policies" directory, as Vanta tracks the file’s permanent URL for continued syncing.
Please note: The person who connects the Google Drive integration must have Write permissions for the Vanta Documents and Vanta policies folders to be able to sync files to Vanta. If permissions are modified after integration setup, this may result in sync errors. It is recommended to verify user access permissions regularly and make adjustments as needed.

## Connecting Vanta & Google Drive
- 
In Vanta, go to the Integrations page, click Add integration, and search for Google Drive. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect.
- 
Follow the connection prompts.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763113/81bbec407d0bc072999e75c32b02/15782245702804?expires=1794967200&signature=331bdc03cc5888fca0e588baba5c76a610e2b02181c487d6f83af10b9bec03ac&req=dSUmEM54noBeWvMW1HO4zdbpDXMbyR3HI8%2Fk9RvSbQ0uCOidWQezSumNJp13%0AJ8miDnWRKPYXIemk4ZQ%3D%0A>
 

## Google Drive for Documents
- 
Vanta searches for documents in the Vanta Documents shared drive for documents. Google Workspace admins will need to create this drive within Google for the connection to work successfully.
- 
For instructions on creating a shared drive, please see Googles help article <https://support.google.com/a/users/answer/9310249?hl=en&ref_topic=9298590&sjid=4465504165598179960-AP>.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763114/09bd31fb4a6b917e257e04ccaa7e/20291473469460?expires=1794967200&signature=52919bf6917002484be39fa2890b8ef91c1ede559763c9258694343980e0466b&req=dSUmEM54noBeXfMW1HO4zaR5c9AB8tchbW%2Fh63qK58ZltlzrU1R3tSNG0a5x%0ACmdFV65F%2Fcmb%2BXtLKhE%3D%0A>
 

## Google Drive for Policies
- 
Vanta searches for files in the Vanta policies shared drive. Google Docs, Google Sheets, and PDF files will sync automatically. Unsupported formats like .docx can either be converted into Google Docs format in Google Drive or uploaded directly to the Vanta platform through its policy editor.
- 
Google Workspace admins will need to create this shared drive within Google for the connection to work successfully.
- 
For instructions on creating a shared drive, Please see Google's help article here <https://support.google.com/a/users/answer/9310249?hl=en&ref_topic=9298590&sjid=4465504165598179960-AP>
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763109/721aa48353e3b72f2b5fc0da63ff/20325502065940?expires=1794967200&signature=254d26bda8ad68054a16a5935f530d9e8154a29e5f9883b76e4afbf17a73aecf&req=dSUmEM54noBfUPMW1HO4zWuagTjr17cZKrUS8vlbUtcCLngfVL6UZqQBO9qj%0Ar5PCWkctMmuOGg16UcA%3D%0A>
- 
For instructions on syncing policies, please see Syncing Policies from Google Drive <https://help.vanta.com/en/articles/11345638>

## Troubleshooting Steps
- 
Verify the shared drive is titled "Vanta policies" and saved under "Shared Drives."
- 
Ensure all files are saved as Google Docs, Google Sheets, or PDFs. 
- 
Confirm the syncing account has requisite permissions on both the shared drive and individual documents.
- 
Check for integration errors in "Settings > Integrations" within the Vanta platform.
- 
Remember normal syncing occurs hourly—allow some time for updates to reflect.- If files are not syncing, ensure they meet the required format and check permissions. Modifications to documents must include meaningful changes to trigger synchronization.

## Images

- [image 01] ../../images/integrations/google-drive/connecting-vanta-google-drive--01.png
- [image 02] ../../images/ux/documents/connecting-vanta-google-drive--02.png
- [image 03] ../../images/ux/policies/connecting-vanta-google-drive--03.png
