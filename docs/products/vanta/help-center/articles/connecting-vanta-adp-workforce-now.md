# Connecting Vanta & ADP Workforce Now

Source: https://help.vanta.com/en/articles/12997007-connecting-vanta-adp-workforce-now
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

## Overview 
Vanta integrates with ADP Workforce Now to import employee data from your HRIS into Vanta. This keeps your personnel records such as start dates, termination dates, and active status, accurate and up to date for compliance purposes. If you're a Vanta admin setting up your HRIS connection for the first time, this guide walks you through the process.
 
ℹ️Note: Vanta connects to ADP Workforce Now through Merge <https://merge.dev/>, a secure third-party HRIS integration platform. Your ADP credentials are entered directly in Merge's hosted interface and are not stored by Vanta. Vanta stores an access token issued by Merge that enables ongoing data retrieval.
 
 

## Use cases
Once connected, we import employee records from ADP Workforce Now and uses them to:
- 
Populate the People page in Vanta with your current employees and contractors.
- 
Track start dates and termination dates for onboarding and offboarding compliance.
- 
Determine which employees are in scope for compliance tests and controls.
- 
Support automated personnel-related tests in Vanta that require an active HR record linked to a Vanta user.
⚠️Note: The recurring SFTP transfer requires ADP's Automatic Export Service, which ADP charges an extra fee to enable. Confirm with your ADP account representative that this feature is active on your plan before you begin
 
 

## Prerequisites
Before connecting, confirm you have the following:
- 
Vanta: Admin access to your Vanta account.
- 
ADP Workforce Now: Admin-level access in ADP Workforce Now.
- 
ADP report access: Permission to create and export reports in ADP (required for both data transfer methods described below).
 
 

## Setup guide

### Step 1: Start the connection in Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for ADP. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2277603901/d9a859489ab9989a7e7c79f595f0/8664b985-9e2d-4c2c-b0bb-830831d663b1?expires=1794967200&signature=8ef1a73f1df1702aa7b6da4c9ca9e792fa455835f20c8865f74a130607d87147&req=diIgEc9%2BnohfWPMW1HO4zX8TWtHjwCyNR2ERyZ6OCEUXLTU7552zZeDY1es8%0AnOneVf2vFjFuDdjDcCg%3D%0A>
- 
In the Link ADP Workforce Now window, click Connect ADP Workforce Now.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2277606066/358d7eaf9b946e4557799274b93d/e1b3331f-eeb8-44b6-bf21-bb08d2d3b052?expires=1794967200&signature=e52ca1428420dc920d8e7147f62aec3eff5f39344205992e88a9d61f3ab67cea&req=diIgEc9%2Bm4FZX%2FMW1HO4zZ3hr9%2BNKweOed8mncJkqwjbZv7wYMAHEl8zaKEk%0A22M6%2BQGbHMXn5EJBWpc%3D%0A>
- 
In the Administrator role required window, click I am an Admin. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2277607568/d553340e8aa7e16639d7b0314139/a18a66ea-2081-404f-b0a5-70b0537537de?expires=1794967200&signature=f4a63bdd048e54fcd7f5f92ad20c784282bafc4c381f9891f2438953b3c2b552&req=diIgEc9%2BmoRZUfMW1HO4zdSSAvnbedZRRcHBPP3Htu1cez7MSrnUwFGY%2FsZr%0AFncsnNTmHxCDzPrt72Q%3D%0A>
- 
After clicking I am an Admin, a Create custom report modal will appear for you to select your data transfer method. See the Choose a data transfer method section below for guidance on which option to select and how to set up both. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2277609252/a3756dd1fba22d3b36787486441f/04060474-350e-4684-86f1-0fda492c9b97?expires=1794967200&signature=1e768324c393257d6b08a4b9b66516403d7da960a069875fa26a8890311dee25&req=diIgEc9%2BlINaW%2FMW1HO4zYQ8nUuSu%2F8T5A6%2FO%2FDP1JekZ4WcEeFOkh3CzKGf%0A8XLWhovBHDUJZxH85Hk%3D%0A>
 

## Step 2: Choose a data transfer method
The Vanta integration with ADP Workforce Now uses a file-based transfer method rather than a direct API connection. There are two ways to set this up:
 

### Option 1: Recurring SFTP transfer (recommended)
This method sends updated employee data from ADP to Vanta on an automated schedule. Once configured, your People page stays current without manual re-uploads.
 
To set this up:
- 
In the Create custom report modal in Vanta, click Schedule recurring report(s). The values you will need for the following steps will appear on the screen.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2277612103/a0db0b1f60a761ddd601c4c22e98/00443fc5-014d-4f5d-a786-e20314fa9ce1?expires=1794967200&signature=046afa7f34485ccce0a81f55e618b92dc0cb82fbfa9e03eb23b30d7b82378902&req=diIgEc9%2Fn4BfWvMW1HO4zYD05rtobOlO7F%2BmVzB%2B8Nrk7SlgyHZNKTdORmDH%0A6cFNelvI%2BfTjJB%2BhAm8%3D%0A>
- 
Next, open the Merge guide for ADP Workforce Now SFTP setup <https://help.merge.dev/articles/8474548-adp-workforce-now-how-do-i-send-hris-data-via-sftp>.
- 
Complete Steps 1 and 2 in that guide.
- 
When prompted to choose a transfer method within the guide, follow the steps under Recurring report transfers using Automatic Export Service.
- 
Return to Vanta once the transfer is configured. 
- 
Click Next. 
- 
Enter the Public (SSH) key from ADP into the Vanta Upload your Public Key modal.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2277613969/db03b8d51d763edde8334a9a5f15/d84a4b03-61a9-4a78-9f30-e9304fa974a8?expires=1794967200&signature=419b4a37d791d3cf99531445589526fe168dc45a135cfa797a7292f6efce6b9c&req=diIgEc9%2FnohZUPMW1HO4zaaLtLryEHBVKmV772wc8vCNSRuj6RI46zzd4fvU%0ABOy36c8EIhYcqDwyd0s%3D%0A>
- 
Click Next. 
 

### Option 2: One-time manual CSV upload
This method imports your employee data using a single file export from ADP. No additional ADP charges apply, but you’ll need to repeat the upload manually whenever your employee data changes.
 
To set this up: 
- 
In the Create custom report modal in Vanta, click One-time manual CSV upload.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2277617630/da835ebf8577b3c7f4782077280f/eb880a58-8497-4866-832c-71409e05abe7?expires=1794967200&signature=4b79fe3f3c44417904c3f1a4a6d5a149ffdd3c1d5e3c7e5cf492294189ec0ba8&req=diIgEc9%2FmodcWfMW1HO4zVJ59blGO3KFI8T%2FC0yA%2BhFqzrYhdSH70Bvk1C8B%0AkPUU8oSUEKaU0fVxetc%3D%0A>
- 
Open the Merge guide for ADP Workforce Now SFTP setup <https://help.merge.dev/articles/8474548-adp-workforce-now-how-do-i-send-hris-data-via-sftp>.
- 
Complete Steps 1 and 2 in that guide.
- 
When prompted to choose a transfer method within the guide, follow the steps under One-time manual CSV upload.
- 
Return to Vanta and upload your file.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2277619264/080681d73952dfdbacdc831d47d7/f9e13118-5e21-4446-8652-959d33b10bed?expires=1794967200&signature=41cdcdb233d7b7bc7aa8ca36609550f24b483d132c6966db8a2fe7e5726839db&req=diIgEc9%2FlINZXfMW1HO4zaDOpwmAY50jllAjgbzmDGBDsCC76NwfDtg7DdgW%0AmvY%2BuKSNGDkfznJIhaw%3D%0A>
- 
Click Next. 
⚠️ Note: When preparing your CSV, confirm the column header for the associate identifier is written exactly as ASSOCIATE ID in all caps. Lowercase or mixed-case formatting will cause the import to fail.
 

### Step 3: Confirm setup and wait for sync
Once the connection is established, we queue an initial data sync. Allow up to 30 minutes before employee data begins appearing in Vanta. 
 
To confirm it worked, go to Personnel and then People in Vanta. Your personnel records should appear there. If nothing appears after 30 minutes, see the Troubleshooting section.
 
 

## Permissions

### Read access
We read employee names, email addresses, employment status (active/inactive), start dates, termination dates, department, and job title from ADP through Merge. 
 

### Write access
The integration is configured for read-only access. We do not create, modify, or delete any data in ADP.
 
 

## Troubleshooting and FAQs

### No employee data appears after connecting
- 
Likely cause: The initial sync has not completed, or the data file has not yet been sent to Merge.
- 
What to check: Wait at least 30 minutes after completing setup. If you used the manual CSV method, confirm the upload completed successfully. If you used SFTP, confirm the scheduled export ran and the file transferred.

### Employee data is outdated or missing recent changes
- 
Likely cause: If you are using the manual CSV method, data doesn’t update automatically — it only reflects the most recent file you uploaded.
- 
What to do: Upload a new CSV with your current employee data. If you need ongoing automatic updates, consider switching to the recurring SFTP transfer method.

### The integration shows as disconnected
- 
Likely cause: The connection between Merge and ADP has expired or requires re-authentication. This can happen if your ADP credentials change.
- 
What to do: Reconnect from the Vanta Integrations page using the SFTP or CSV setup steps above. 

### The ASSOCIATE ID column is not recognized during CSV import
- 
Likely cause: The column header is not formatted in all uppercase.
- 
What to do: Open your CSV file, confirm the header reads exactly as ASSOCIATE ID in uppercase, and re-upload.

### All Vanta admins appear to be marked inactive based on ADP data
- 
Likely cause: If your ADP data would result in every active Vanta admin being offboarded at once, we will not apply the update and will disconnect the integration as a safety measure.
- 
What to do: Before reconnecting the integration, either reactivate admin accounts within ADP, or set new admins within Vanta.
If you have any questions, please reach out to our support team at [email protected]

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-adp-workforce-now--01.png
- [image 02] ../../images/integrations/adp-workforce-now/connecting-vanta-adp-workforce-now--02.png
- [image 03] ../../images/integrations/adp-workforce-now/connecting-vanta-adp-workforce-now--03.png
- [image 04] ../../images/integrations/adp-workforce-now/connecting-vanta-adp-workforce-now--04.png
- [image 05] ../../images/integrations/adp-workforce-now/connecting-vanta-adp-workforce-now--05.png
- [image 06] ../../images/integrations/adp-workforce-now/connecting-vanta-adp-workforce-now--06.png
- [image 07] ../../images/integrations/adp-workforce-now/connecting-vanta-adp-workforce-now--04.png
- [image 08] ../../images/integrations/adp-workforce-now/connecting-vanta-adp-workforce-now--08.png
