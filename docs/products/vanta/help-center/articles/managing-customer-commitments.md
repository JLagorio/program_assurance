# Managing Customer Commitments

Source: https://help.vanta.com/en/articles/13931299-managing-customer-commitments
Collection: Trust Management ; Trust Management › Customer Trust
Fetched: 2026-11-17

## Article text

✅ Feature availability: Customer Commitments requires an add-on purchase to your plan. To use the contract analysis feature, you also need to have our Compliance product enabled on your plan. See Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Customer Commitments centralizes and tracks the security, compliance, and privacy obligations in your customer contracts—like incident notification SLAs, data deletion timelines, sub-processor change notices, and audit rights. Instead of reviewing contracts manually or managing obligations in spreadsheets, you get a single, always-current source of truth in Vanta.
 
⚙️ User permissions: Admins, Editors, Trust Admins, and Commitments Managers can access the Commitments tab and manage commitments. Only Admins and Commitments Managers can access the Contracts tab, manage contracts, run contract analysis, and configure CLM integrations in Commitments settings. Only Admins can open linked sources in contract analysis stored in other areas of Vanta. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Getting started
Vanta AI reads your contracts, extracts commitments, and organizes them into a searchable inventory so you can compare requirements across customers and quickly answer questions, like which customers require 24-hour incident notification, who needs a certificate of deletion after data deletion, or which agreements permit onsite audits.
 
To get the most out of Customer Commitments, explore the following capabilities:
- 
Import your contracts: Upload contracts manually or sync them from a supported CLM integration to start building a complete inventory of your commitments.
- 
Review your commitments: As contracts are processed, commitments are automatically added to your inventory and organized into commitment types so you can compare across your contracts.
- 
Assign customer accounts: Commitments are grouped by account so you can see everything you've promised a specific customer in one place.
- 
Define standard commitments: Define your standard terms so Vanta can automatically flag deviations from your standards in your customer contracts.
- 
Create custom commitment types: Use Vanta's pre-built commitment types, or define your own to train Vanta AI to find obligations specific to your business that the built-in Vanta types don't cover.
- 
Preview draft contracts: Upload a contract as a draft before it's signed to see what commitments it would create, without adding anything to your inventory yet.​
- 
Contract analysis: Check each commitment against your compliance program so you can see what's covered and where gaps exist.
​
📣 We’d love your feedback. The Customer Commitments experience is actively evolving—share your feedback <https://help.vanta.com/en/articles/11345412-sharing-product-feedback> to help shape what comes next.
 
 

## Importing your contracts
To begin tracking commitments, you’ll need to bring your customer contracts into Vanta. You can upload contracts manually or sync them from a supported contract lifecycle management (CLM) system.
 
Contracts must be stored in Vanta so extracted commitments can be linked to their source clauses. This allows you to review citations, verify accuracy, and confirm where each obligation originates in the contract.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665864964/c22a1adbf5474f4e97ab6d61ee09/image.png?expires=1794967200&signature=a34ce3e31f9450b659213bc6ab8a3dc2e167ed91c474b15a13212e3abe658338&req=diYhE8F4mYhZXfMW1HO4zR89jZocKnvbCHJkfRxMfa9oW8y%2FrxyYeskwW2r3%0ApU16m2o5FBuxg%2FWYzoM%3D%0A>
 

### Uploading PDF contracts
 
You can upload individual contract files or upload multiple contracts at a time in bulk.
 
To upload contracts to Vanta:
- 
From the Commitments page, go to the Contracts tab.
- 
Click Import contracts.
- 
Select Executed contracts—only commitments from executed contracts will be added to your inventory.
- 
Click Upload or drag and drop your files.
- 
You can upload up to 10 contracts at a time.
- 
Each file must be 50MB or less.
- 
Only PDF files are supported.
- 
Click Upload to begin processing—this might take a few minutes for Vanta AI to complete.
Once uploaded, Vanta AI will begin extracting contract details and identifying commitments. You can continue working in Vanta while processing completes.
 

### Uploading large contracts (175+ pages)
 
Contracts greater than 175 pages are processed using an older AI model, which may result in reduced extraction quality.
 
To improve results, consider breaking large contracts into multiple smaller documents before uploading. Use natural break points, such as separating standalone addendums or exhibits into their own files.
 
Keep in mind:
- 
There is no limit to the number of contracts that can be associated with an account.
- 
Vanta AI does not cross-reference separate uploaded documents. If you split a large contract into multiple files, the AI will not connect definitions or references between them. For example, if Document B references a definition in Document A, the AI will not automatically link those sections.
 

### Syncing contracts from Ironclad
 
You can connect to Ironclad <https://help.vanta.com/en/articles/11345439-connecting-vanta-ironclad> to automatically sync contracts into Vanta. Once connected, finalized contracts are pulled into Vanta on an ongoing basis, including new and updated agreements.
 
Before you connect:
- 
Ensure you have the appropriate permissions in Ironclad to authorize the integration and sync contracts.
- 
Only finalized contracts are synced. Contracts in draft status are not pulled into Vanta.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2135564138/45ef528ff553f4534458d1851f98/image.png?expires=1794967200&signature=9e8745ca22b5aaa6f6ed1a523b2aa6573ae9deb3f2d213cbdf12cadc150980e6&req=diEkE8x4mYBcUfMW1HO4zUiz57Ma9hKggNIIWeXXcM6j4dPixwl7tJhTufJF%0ASVZ%2FlIXH9Zi2%2BU04ovI%3D%0A>
 
To connect to Ironclad:
- 
From the Commitments page, go to the Contracts tab.
- 
Next to the Import contracts button, click the gear icon to view commitment settings.
- 
Follow the prompts to connect and sync contracts from Ironclad—you must check the box to grant Vanta permissions to sync contracts for commitment management.
After the integration is set up, contracts will begin syncing automatically. Once processed by Vanta AI, extracted commitments will be available in your inventory for tracking and management.
 

### Syncing contracts from SharePoint
 
You can connect to SharePoint to automatically sync contracts into Vanta. Unlike the existing SharePoint integration for policies, the contracts integration lets you point Vanta at any existing folder, no special folder naming or structure required.
 
Before you connect: 
- 
Microsoft SharePoint must already be connected to Vanta. If it's not, go to the Integrations page and connect SharePoint <https://help.vanta.com/en/articles/11345634-connecting-vanta-microsoft-sharepoint> first, then return to Commitments settings to configure it.
- 
Ensure you have the appropriate permissions in SharePoint to authorize the integration.
To configure SharePoint as a contract source: 
- 
From the Commitments page, click the gear icon next to Import contracts to open commitment settings.
- 
Under Contract sources, find the SharePoint row and click to configure.
- 
Select the SharePoint site and folder you want Vanta to sync contracts from. You can search for and select folders at any level of the folder hierarchy.
- 
Click Save to begin the initial sync.
What to expect after setup: 
- 
Initial backfill: Vanta runs a one-time import of all documents in the selected folder and its subfolders. Depending on the number of documents, this may take several hours. You can continue working in Vanta while it completes.
- 
Ongoing sync: After the backfill, Vanta checks for new documents daily and imports them automatically. New contracts are included in the weekly digest sent to admins.
- 
Supported file types: Only .pdf and .docx files are imported. .docx files are automatically converted to .pdf during import.
- 
Changes to existing contracts: Edits made to a document in SharePoint after it's been imported are not synced into Vanta. Each contract is a snapshot at the time of import.
- 
Source tracking: In the Contracts table, the source column shows "SharePoint" for contracts synced from SharePoint.
To pause syncing, return to commitment settings and select Stop syncing in the SharePoint row. This stops new contracts from syncing in but does not remove contracts that have already been imported.
 

### Syncing contracts from Salesforce
 
You can connect Salesforce to automatically sync contract files into Vanta. This uses the same Salesforce connection you may already have set up for Trust Center. If Salesforce isn't connected yet, you'll be prompted to connect it as part of this setup.
 
Before you connect:
- 
Salesforce must already be connected to Vanta, or you'll connect it during this flow.
- 
Ensure you have the appropriate permissions in Salesforce to view the objects and file attachments you want to sync.
To connect to Salesforce:
- 
In Vanta, go to Settings (the gear icon). 
- 
Go to Customer Trust (the same place you manage your Salesforce connection for Trust Center) and select the Commitments tab.
- 
If Salesforce isn't connected yet, follow the prompts to connect it.
- 
Search for and select the Salesforce object(s) to import from (for example, the standard Contract object, or a custom object your team uses to store contracts).
- 
Optionally, add a name filter. Only files whose title includes this text will be imported; leave it blank to import all PDFs and documents attached to the selected objects.
- 
Save your configuration to kick off the initial sync.
What to expect after setup:
- 
Vanta pulls in PDFs and documents attached to your selected objects (matching your name filter, if set). Synced contracts appear in the Contracts tab with "Salesforce" as the source and the date they were pulled in.
- 
You can edit your configuration anytime to add or remove objects and name filters. The settings page shows the last synced date, similar to SharePoint.
- 
For custom objects, Vanta pulls files from the object's Notes & Attachments related list.
- 
Vanta uses whatever the file is named in Salesforce at the time of import. Renaming the file in Salesforce afterward doesn't update the name in Vanta.
- 
If a file is replaced with a new version in Salesforce, Vanta does not pick up the update. It keeps whichever version was present at the time of import.
 

### Supported CLMs
 
Customer Commitments currently supports syncing finalized contracts from Ironclad, SharePoint, and Salesforce. Support for additional integrations is on the roadmap, including Google Drive.
 

### Uploading contracts via API
 
You can also upload contracts programmatically using the Vanta API. See the API reference <https://developer.vanta.com/reference/uploadcontract> for available endpoints.
 

### Previewing draft contracts
 
Upload a draft contract to see what commitments it would create before you sign it, without adding anything to your commitment inventory. The extracted commitments only appear on the contract details page.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665874166/90ae28bac1b1df379c4e511a9622/image.png?expires=1794967200&signature=47a887631bd680ebed7894aeb81fe9d96b0e1737c112a5be7253dd4c54b70052&req=diYhE8F5mYBZX%2FMW1HO4zY4rwnDF0AQFs0Xyl0TQlkUq3ojNxMo%2BQmDIUKbs%0Atm03noOINhDfK71tldE%3D%0A>
 
To preview a draft contract:
- 
From the Commitments page, go to the Contracts tab.
- 
Click Import contracts.
- 
Select Draft contracts.
- 
Click Upload or drag and drop your files.
- 
You can upload up to 10 contracts at a time.
- 
Each file must be 50MB or less.
- 
Only PDF files are supported.
- 
Syncing draft contracts from a supported CLM or Vanta API is not currently supported.
- 
Click Upload to begin processing—this might take a few minutes for Vanta AI to complete.
- 
Open the draft contract to review the extracted commitments—they’re only viewable from within the draft contract.
Draft contracts aren't auto-assigned to a customer account, though you can assign one manually if you'd like.
 
💡 Tip: When you’re ready to add a draft contract’s commitments to your inventory, you need to import the finalized version as an executed contract. Drafts can't be converted directly, so we recommend deleting the draft once the executed version is in.
 
 
 

## Commitment notifications 
As commitments are automatically added to your inventory, Vanta keeps you informed of updates:
- 
Manual uploads: You'll get a notification within about an hour after processing is complete summarizing how many commitments were added to your inventory.
- 
Synced contracts: Admins receive a weekly digest summarizing new contracts and commitments added over the past week.
- 
Unassigned accounts: If Vanta AI can't automatically assign an account when importing contracts, admins receive a daily email listing the affected contracts.
Notification preferences can be configured in your notification settings <https://help.vanta.com/en/articles/11345394-notifications-and-notification-settings>, including delivery via email or Slack.
 
 

## Commitment types
A commitment is a specific obligation you have made to a customer in a contract, such as notifying them of a security incident within a set time or deleting their data when the contract ends. 
 
A commitment type is the category that obligation belongs to. Vanta automatically groups every commitment it extracts by type, so you can see all commitments of the same kind across all your contracts in one place.
 
You can use Vanta commitment types or define your own custom commitment types.
 

### Vanta commitment types
 
Vanta provides several built-in commitment types, each with a fixed definition Vanta AI is trained on. Some commitment types are structured, which means Vanta breaks each commitment into specific fields (for example, the notice window or the deletion deadline) so you can compare terms across customers at a glance. Other types are recognized but not yet broken into fields.
 

### Structured format
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2549140688/733545c22f9f6ed1d41a66793b21/image.png?expires=1794967200&signature=0e535dc94319f97ea3dbdcf37a3112f5544a8547841025a6a9422404b3e971df&req=diUjH8h6nYdXUfMW1HO4zUwupVrsSPjUxwK22BqPP62V1kaXD569EX9aQMFZ%0ApYKpPo012JEuGAWGv4c%3D%0A>
- 
Customer right to audit
- 
Data deletion and return requirements
- 
Data residency and use
- 
Frameworks and certifications
- 
Security incident and breach notices
- 
Subcontractor/sub-processor change notices
​
💡 Tip: More structured commitment types are on the way—as new types become available, your existing commitments will be automatically extracted into the new schema, and you'll be notified of the update.
 

### Unstructured format
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2549141015/1cb01b6b8bef0a4776839a77a87d/image.png?expires=1794967200&signature=1f340bfe8ead6c0b45e0407b6103e0e5bdc3ad689c36d8aed403498a10905a91&req=diUjH8h6nIFeXPMW1HO4zWvljIb3dZ4mClm9ldBtd8ILW8N%2BW3PmejWo16BX%0AReoAc4L%2FRLqAD6UhvHs%3D%0A>
- 
AI technology use
- 
Asset and data inventory
- 
Authentication controls
- 
Availability
- 
Background checks
- 
Business continuity and disaster recovery tests
- 
Cyber insurance
- 
Data backups
- 
De-identification requirements
- 
Encryption at rest
- 
Encryption in transit
- 
Encryption key management
- 
Endpoint protection
- 
External data requests
- 
Finding remediation
- 
International data transfers
- 
Least privilege access
- 
Legal holds
- 
Logging and monitoring
- 
Material change notices
- 
Network security
- 
Pen test
- 
Physical and environmental security
- 
Privileged access management
- 
Provisioning and deprovisioning
- 
Record retention
- 
RTO or RPO
- 
Security awareness and privacy training
- 
Vulnerability disclosures
- 
Vulnerability remediation
- 
Vulnerability scanning
 

### Custom commitment types
 
You can define your own commitment types to train Vanta AI to find obligations specific to your business that the built-in Vanta types don't cover.
 

### Creating custom commitment types
To create a custom commitment type:
- 
From the Commitments page, click Create new commitment type.
- 
Add a Name for the commitment type.
- 
Add a Definition describing what the commitment type should track, along with example clauses. Vanta AI uses this information to identify matching commitments in your contracts.
- 
Click Create.
- 
If you’re ready to add commitments from your existing uploaded contracts, click Scan past contracts.
​
💡 Tip: Add positive examples and counter-examples to sharpen accuracy: Include two kinds of clauses: examples that match your type, and counter-examples that look similar but shouldn't be captured. Examples tell Vanta AI what to catch; counter-examples tell it what to skip. Counter-examples help most when your type is easy to confuse with another one (for example, a data-deletion type versus a record-retention type, which both mention data and timelines). If a scan pulls in clauses you didn't want, add them back as counter-examples, and the next scan gets sharper.
 

### Scanning past contracts
⚠️ Note: Scanning replaces any existing commitments of that type with new results based on the current definition. You can't edit the definition or cancel a scan once it starts.
- 
Creating or editing a custom commitment type only affects future contract uploads. 
- 
To apply a new or updated definition to contracts you've already uploaded, you need to run a scan.
- 
You can run up to 3 scans per day for each commitment type.
​

### Editing custom commitment types
To edit a custom commitment type:
- 
From the Commitments page, locate the custom commitment type and click View commitments.
- 
Click the ••• menu at the top of the page and select Edit.
- 
Update the Name or Definition as needed.
- 
Click Save changes.
- 
If you want to apply the changes to your existing uploaded contracts, click Scan past contracts.
​

### Deleting custom commitment types
When you delete a custom commitment type, you choose what happens to its existing commitments—in either case, the commitments themselves are not deleted.
 
To delete a custom commitment type:
- 
From the Commitments page, locate the custom commitment type and click View commitments.
- 
Click the ••• menu at the top of the page and select Delete.
- 
Archive commitments:  The commitments are archived rather than deleted. Archived commitments can be accessed within individual contracts.
- 
Reassign commitments to another type: Select a different commitment type to move the commitments to. You can only reassign them to a commitment type using an unstructured format—you can't reassign them to a commitment type using the structured format.
- 
Confirm your selection.
 

### Commitment type formats
 
Every commitment links to the source contract and can be linked to the relevant customer account. Additionally, each commitment type uses either a structured or unstructured format, which determines what other fields are available to edit for those commitments.
 

### Structured format
Commitments have a defined set of closed-ended fields unique to that commitment type that break the commitment down into comparable values, and each field can be linked to citations from the source contract. Field definitions appear above the commitments list. Used for select Vanta commitment types.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2551273577/900b952722b6f4f73108e0fb8554/image.png?expires=1794967200&signature=0ef2e5e7bb9bec1070852b51ff78b331da178674c16a45e847b8d5e821420725&req=diUiF8t5noRYXvMW1HO4zUbyFmHS93QsnuHlS%2Fckt5UZ2ni%2Bp%2BQEjS3v65Bg%0Ar8lDlMJfAAHhLJaSlVc%3D%0A>
💡 Tip: You can define standard commitments for structured commitment types.
 

### Unstructured format
Commitments have a single free-text summary field you can use to describe the obligation in your own words. Used for all custom commitment types and some Vanta commitment types.
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2551274368/87c2817e2b2c1652776f54c3824d/image.png?expires=1794967200&signature=a226b080f1e4dc20555155bb048859bea39209fda67f977aaf255c45c281a713&req=diUiF8t5mYJZUfMW1HO4zRkUKrjaXKrfY54HTDSWZWbmWGe%2FEp%2BkkLqcBFQC%0AmYaMqnyYRgnDgj4x9Eo%3D%0A>
 
 

## Managing your commitments
Once Vanta AI finishes processing your contracts, extracted commitments are automatically added to your inventory and organized by type. From there, you can review and manage your commitments to ensure they accurately reflect your contractual obligations.
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665877563/de8fd21243f32e6e3ebd28ddc484/image.png?expires=1794967200&signature=063a7961d4aa654e06d65a457039520dd0ae5287b23067ec1e39bdf6649c35ed&req=diYhE8F5moRZWvMW1HO4zX64OTvEiE2EDys51XEPf%2BUZ%2BRyHGTGqjUQwVRT4%0AnFwohK8snCXqUjM%2Bjmg%3D%0A>
 
Commitments can be viewed across your entire inventory or within individual contracts:
 | 
Tab | 
Description
 | 
Commitments tab | 
- 
Commitments are grouped by commitment type
- 
Click to view all commitments for that type in a table across accounts
- 
Open individual commitments from the table to review them
 | 
Contracts tab | 
- 
View all uploaded or synced contracts
- 
See the number of commitments associated with each contract
- 
Open a contract to view its extracted commitments
- 
Review commitments in the context of the original document
⚠️ Note: Vanta AI automatically extracts commitments from your contracts. To ensure accuracy, we encourage you to review commitments as needed by opening them and comparing extracted information to the original contract language.
 

### Editing commitments
 
To edit a commitment:
- 
From the Commitments tab: Click View commitments to open the commitment details page, open the commitment you’d like to edit, and click the ✎ pencil icon to edit the commitment.
- 
From the Contracts tab: Open a contract, locate the commitment you’d like to edit, and click the ••• menu to edit the commitment.
Keep in mind:
- 
When you change a field value, it will be marked as user-modified so you can distinguish it from AI-extracted values.
- 
The commitment format and type determine the fields available for a given commitment. If you change the commitment type, the fields available will update.
- 
An em dash (—) in a table row means Vanta AI determined that a value wasn’t specified in the contract. Review the commitment to confirm accuracy or update the value if needed.
 

### Archiving commitments
 
You can archive commitments you no longer want to track in your active inventory.
 
To archive a commitment:
- 
From the Commitments page, go to the Contracts tab.
- 
Open a contract and locate the commitments you want to archive:
- 
To archive an individual commitment, click the ••• menu.
- 
To archive commitments in bulk, select one or more commitments using the checkbox.
- 
Click Archive.
Archiving removes a commitment from the active view without deleting it, preserving the underlying data for future reference. To access them, click the ••• menu at the top-right of a contract and select View archived commitments.
 
ℹ️ Note: Archived commitments can’t be permanently deleted at this time.
 

### Adding commitments manually
 
You can add a commitment manually if needed:
- 
Within a contract, highlight the text within the contract so a citation can be linked to the commitment, and click + Add commitment. 
- 
You'll need to add a commitment type and enter a summary.
- 
Manually added commitments are labeled as user-modified so you can distinguish them from AI-extracted values.
 

### Assigning customer accounts
 
Contracts are assigned to Customer Trust Accounts <https://help.vanta.com/en/articles/13163124-customer-trust-accounts> in two ways:
- 
Automatically: When contracts are imported, Vanta AI will automatically match them to an existing account or create a new account for you.
- 
Manually: In some cases, Vanta AI may not be able to assign a customer account. When viewing commitments or contracts, you can filter by unassigned accounts and manually assign them.
​
⚠️ Note: If you've connected Salesforce to your Trust Center <https://help.vanta.com/en/articles/11345449-connecting-trust-centers-salesforce>, Vanta AI will only create a new account in Vanta if it can find a match in Salesforce to link to. If no match is found, the contract will remain unassigned and you'll need to assign it manually. Manually created accounts in Vanta won't be linked to your Salesforce record—to link them, create the account in Salesforce first, then re-upload the corresponding contract.
 
 

## Standard commitments
Standard commitments are your company's default terms. Defining them lets Vanta AI label each customer commitment as standard or non-standard, so you can quickly spot the ones that actually vary—and focus your attention where it matters.
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665885329/05fe09b23f1a3bf73c944d3bfaef/image.png?expires=1794967200&signature=ce205f34f50fb65439d8da4cffd7449e0a988adbbd5d0fb245859d59a252ec0d&req=diYhE8F2mIJdUPMW1HO4zVV23oTWji8Gr6udDMAu94NIwfhFmTWrkDzmUXpu%0AAjiTgSEBEZyl76XwYow%3D%0A>
 
From the Commitments page, click Manage standard commitments. You’ll see the following tabs:
- 
Standard commitment library: Manage your definitions for each standard commitment, organized by commitment type.
- 
Your standard contracts: Manage the standard contract PDFs you've uploaded as sources.
​
💡 Tip: Using standard commitments helps you spot which customer commitments meet your standard terms and which ones represent exceptions you should know about. When a standard commitment is active, Vanta AI surfaces this context throughout the commitments experience so you can filter by standard or non-standard and see exactly which fields differ from your baseline.
 

### Defining standard commitments
 
Standard commitments are currently limited to structured commitment types. You'll be able to define standards for the types in that list, and more will become available as Vanta adds structure to additional commitment types.  
 
To define a standard commitment:
- 
Import standard contracts: Upload PDF contracts and Vanta AI will extract proposed standard commitments. Once processing is complete, you’ll be notified so you can review and accept each one to make it active.
- 
Add a commitment manually: Define a standard commitment directly. Manually added standard commitments are immediately active and are not linked to a source contract.
When a standard commitment is made active, Vanta AI evaluates all your existing customer commitments against it. From that point on, any new customer contracts you import are evaluated automatically too.
​
ℹ️ Note: Some fields are not included in standard analysis. When Vanta AI compares your customer commitments to the standard commitment, only fields with structured values are included. Fields with free text such as notice requirements, scope criteria, and deletion protocol, are not included in the standard analysis.
 

### Resolving duplicate commitments
 
When Vanta AI finds more than one proposed standard commitment for the same commitment type, you'll need to pick the one that best represents your standard terms.
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2358408066/919e322c0e5526e46fe2e8ee7d22/image.png?expires=1794967200&signature=8e1a05453d5f4fdf2124f6bf1d5231a09e4e95f8bde967e714f50c6812d46a2c&req=diMiHs1%2BlYFZX%2FMW1HO4zeyauBXavRjlckaIU8vie4kiY6qoKRq9zUwnXaDn%0AsNv09ovbSdfBmjpnxHk%3D%0A>
- 
Choose standard commitment: Review the proposed standard commitments and select the one you want to use, or define one manually. All other proposed standard commitments for that type will be deleted.
- 
Ignore: Delete all proposed standard commitments for that type. You can define a new standard commitment for that type at any time.
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2358405337/3daadd907c013a11ec220f744a3e/image.png?expires=1794967200&signature=5bc4b6ceab8f7b8724b40000f53461a1af98c381fd5f45b739f8ebf55f691b91&req=diMiHs1%2BmIJcXvMW1HO4zYrrevvasBOTi0kNnvoxW8k1UNiPy4WYUeH4LTCk%0AICaUpgkWkOPtLycnEjY%3D%0A>
 
ℹ️ Note: Deleting proposed standard commitments removes them from your standard commitment library and from the standard contract they were extracted from. Your customer contracts and the commitments extracted from them won't be impacted.​
 

### Editing or deleting standard commitments
 
Making changes to a standard commitment only affects how Vanta evaluates and displays customer commitments. Your customer contracts and the commitments extracted from them won't be impacted.
- 
Edit: Click the pencil icon on a standard commitment. When you save changes, Vanta will re-evaluate your customer commitments against the updated standard commitment.
- 
Delete: Click the trash icon on a standard commitment and confirm. Vanta will no longer evaluate standard or non-standard labels for that commitment type until you create a new one.
 

### Managing standard contracts
 
Standard contracts you imported are stored in the Your standard contracts tab. Open a contract to review the source PDF alongside all potential standard commitments cited in the contract, organized by commitment type.
 
For each potential standard commitment you can:
- 
Accept: The standard commitment becomes active and overrides any existing active standard commitment for that type.
- 
Ignore or delete: The standard commitment is removed. If it was active, that commitment type will no longer have an active standard commitment until you define a new one.
- 
Resolve duplicates: Compare all potential standard commitments for that type across your standard contracts so you can choose the right one.
If you delete a standard contract, all proposed and active standard commitments sourced from it are also deleted.
 
 

## Contract analysis
When you run a contract analysis, Vanta AI checks each commitment against available sources across your compliance program in Vanta and generates an analysis summarizing the commitments your program already covers, where there are potential gaps, and how severe the consequences are for not delivering on commitments.
 
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665895979/78f82b202423ddc78d8e4971ce80/image.png?expires=1794967200&signature=2c76998a7f8ec912da0e2f57981df9badb94edc7634007fa67d488588e449886&req=diYhE8F3mIhYUPMW1HO4zfB1zX%2FjhV02l%2F9m8FfiMVx%2FXGLd%2FWo8BNzaJdmd%0A6sqQTcTtEh3GEiDwzk4%3D%0A>
 

### Supported sources
 
Depending on your plan and enabled features, contract analysis can use the information from the following sources in Vanta:
- 
Controls: The controls in your program
- 
Policies: The text in your approved policies
- 
Knowledge Base: Your resources and answer library
- 
Tests: The automated tests tied to your controls
- 
Documents: Evidence you provide as part of a test or document requirement
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665899435/1872d54f39c52dcd901696f74643/image.png?expires=1794967200&signature=64573803826c11328a468e73eaf61bf6c47d8b9c9438ed9734197cf08810bab8&req=diYhE8F3lIVcXPMW1HO4zUeheETC5BXbLuR2JoqRejeYKVeCZw%2B%2BjKffnz52%0A1AGJfUkETKC63H49zW0%3D%0A>
💡 Tip: To see which sources were used to analyze a commitment, click the arrow at the top of the commitment to reveal the commitment Assessment tab, then click Sources examined.
 

### Running a contract analysis
 
You can run a contract analysis on both executed contracts and draft contracts.
 
To run a contract analysis:
- 
From the Commitments page, go to the Contracts tab.
- 
Open a contract.
- 
Click Start analysis—it might take a few minutes for Vanta AI to generate the summary, and you can navigate away from the page and it will continue to run.
Once an analysis summary has been generated:
- 
To rerun an analysis: Click the Last run on date. This replaces the current results, including the program coverage and consequence ratings and review status across commitments. No other data is impacted.
- 
To delete an analysis: Click the ••• menu next to the analysis. While deletion is permanent, you can run a new analysis at any time.
 

### Analysis summary
 
The analysis summary shows the total number of commitments in the contract, when the analysis was last run, and how many commitments fall into each program coverage category. You can filter and sort the commitments in the contract as needed.
 
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665916172/ce67cabd569c1b3a995273f5f654/image.png?expires=1794967200&signature=5509865fd79df92cfdc61a9e73a32584d6639372d82295bdcd3baa96207a43c6&req=diYhE8B%2Fm4BYW%2FMW1HO4zQvmYPTTT973YUDKMA%2FFSb6vIRELTvxLrmBX7PcJ%0AOq6Hhj8SO4jJt0V17Zc%3D%0A>
 
Vanta AI assigns each commitment a program coverage rating based on the sources reviewed, and a consequence rating based on the risk stated in the contract. You can select a new rating as needed:
 | 
Rating | 
Values
 | 
Program coverage | 
- 
Covered: Your program meets or exceeds what the commitment requires.
- 
Gap: Your program falls short of what the commitment requires.
- 
Unclear: Unable to make a determination as to whether it’s covered or a gap.
 | 
Consequence | 
- 
High: Missing this commitment risks major legal, regulatory, or contractual exposure.
- 
Medium: Missing this commitment risks real but bounded security or operational impact.
- 
Low: Missing this commitment carries minimal risk.
💡 Tip: To see why Vanta AI assigned a rating, click the arrow at the top of the commitment to open the Assessment tab, and review the rationale for Program coverage and Consequence, including sources examined.
 

### Reviewing commitments
 
After running an analysis, review each commitment's Program coverage summary to take one of three actions:
 
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665918721/4548f2effc7a0ac411dd8b6d81ec/image.png?expires=1794967200&signature=7df2d6ddfc9ed332ca83464d0e01c12d5d2de8d4c2be12450163dcc6cf58b56d&req=diYhE8B%2FlYZdWPMW1HO4zTQyWHkbnvrwSA1DfjPo%2B13BfoTSGAMTnUC4HKhu%0AsUSjx%2Frg%2BHfKDpiZkAA%3D%0A>
- 
Mark as acknowledged: Confirm the commitment no longer needs your attention. You can add an optional reason to save to agent memory for future analyses.
- 
Flag for redline review: Flag the commitment and click Suggest to open the Vanta Agent with a prompt to help draft redline wording for the commitment.
- 
More actions: Open a Vanta Agent chat to discuss how you'd like to handle the commitment. The agent can mark it as acknowledged, flag it for redline, update its coverage or consequence ratings, or help create or link risks and issues (depending on your plan and enabled features).
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665925103/829e3846a90724cef1b483965910/image.png?expires=1794967200&signature=cdceb21821cb0a3a42d5da5f0f80bee0d84166385375d1a9a5e649bf177fdff5&req=diYhE8B8mIBfWvMW1HO4zb5sm93KbUDqXLgDuXSNEaCnxlJF6SG8CWE9G0aP%0AuZrLEbVPaTNsuXHD76o%3D%0A>
 
Each commitment has a review status you can filter by to help you keep track of your progress:
 | 
Review status | 
Description
 | 
Not yet reviewed | 
No action has been taken on this commitment yet—you still need to mark as acknowledged or flag for redline review.
 | 
Acknowledged | 
The commitment was marked as acknowledged.
 | 
Flagged for redline | 
The commitment was flagged for redline review.
 

### Saving reasons to agent memory
 
You can teach Vanta Agent your preferences and context, and choose to have it apply the same reasoning the next time a similar commitment comes up in future contract analyses.
 
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2665928523/9aadb12dceb0cc823999467e2df6/image.png?expires=1794967200&signature=a30b335b297dc33518fd348cbbc7363e30e39170dd353985831b4a1575d19fb2&req=diYhE8B8lYRdWvMW1HO4zdJUhAvzRQAkN2X0FrAnsOlfgxwsEOzmDN%2BWAFvF%0Aar7hCQWv3iXkBSdEffk%3D%0A>
 
You can save a reason as a memory when you:
- 
Mark a commitment as acknowledged
- 
Change a program coverage rating
- 
Change a consequence rating
- 
Tell the Vanta Agent to do so in a chat
​
ℹ️ Note: Undoing a commitment you acknowledged stops the Vanta Agent from applying the reasoning you taught it. If you update a rating that was already changed manually, the new reason replaces the existing one.

## Images

- [image 01] ../../images/ux/customer-commitments/managing-customer-commitments--01.png
- [image 02] ../../images/ux/integrations/managing-customer-commitments--02.png
- [image 03] ../../images/ux/customer-commitments/managing-customer-commitments--03.png
- [image 04] ../../images/ux/customer-commitments/managing-customer-commitments--04.png
- [image 05] ../../images/ux/customer-commitments/managing-customer-commitments--05.png
- [image 06] ../../images/ux/customer-commitments/managing-customer-commitments--04.png
- [image 07] ../../images/ux/customer-commitments/managing-customer-commitments--05.png
- [image 08] ../../images/ux/customer-commitments/managing-customer-commitments--08.png
- [image 09] ../../images/ux/customer-commitments/managing-customer-commitments--09.png
- [image 10] ../../images/ux/customer-commitments/managing-customer-commitments--10.png
- [image 11] ../../images/ux/customer-commitments/managing-customer-commitments--11.png
- [image 12] ../../images/ux/customer-commitments/managing-customer-commitments--12.png
- [image 13] ../../images/ux/customer-commitments/managing-customer-commitments--13.png
- [image 14] ../../images/ux/customer-commitments/managing-customer-commitments--14.png
- [image 15] ../../images/ux/customer-commitments/managing-customer-commitments--15.png
- [image 16] ../../images/ux/customer-commitments/managing-customer-commitments--16.png
- [image 17] ../../images/ux/customer-commitments/managing-customer-commitments--17.png
