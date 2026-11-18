# Managing Documents

Source: https://help.vanta.com/en/articles/11345479-managing-documents
Collection: Evidence Collection ; Evidence Collection › Documents
Fetched: 2026-11-17

## Article text

Feature availability: This article discusses Multiple Policy Approvers, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
The Documents Page <https://help.vanta.com/en/articles/11345376> gives your company a list of needed documents for specific IT Security compliances and indicates whether your team has uploaded them to meet audit requirements. Documents often need to be uploaded, renewed, removed, or adjusted. All of this can be done from Vanta's Documents Page.
 
In Vanta, some tests require you to upload a document as evidence, these are called document tests. When you upload or edit a document for a test, it appears both on the Monitors (Tests) page and the Documents page. The Documents page provides a single view of all file-based evidence, whether uploaded directly or attached to a test.
 
 

## Document status
Each document in Vanta can have a status that shows its current state in the compliance workflow. Here’s what each status means:
 | 
Status on /docs | 
Status on /tests | 
Status on detail page | 
Compliance status | 
Definition
 | 
OK | 
OK | 
Passing | 
Passing | 
A non‑expired file exists in the document container → compliance status is passing.
 | 
Needs update | 
Due soon | 
Passing | 
Passing | 
The document is nearing expiration (within the reminder window for the recurrence cadence) → compliance status is passing.
 | 
Needs document | 
Needs remediation | 
Needs attention | 
Failing | 
No files have ever been uploaded.
 | 
Needs document | 
Overdue | 
Needs attention | 
Failing | 
There are only expired files uploaded.
 | 
Not relevant | 
Not relevant | 
Deactivated | 
N/A | 
Deactivated or ignored for the standard by an auditor.
 | 
Upcoming | 
Upcoming | 
Preview | 
N/A | 
A new document test that is rolling out soon.
 

## Adding or updating documents
- 
From the left-hand navigation panel, select Documents. From here, you will be able to view the complete list of required documents and those that have already been uploaded.
- 
Select Document Needed for a specific document or Add Document > Create document at the top right-hand corner to add a new record.
- 
You will be prompted to complete the pop-up with the Document itself and its information.
- 
Clicking on a specific document name will bring you to a page with information surrounding the Document's history.
- 
You can upload a new document, a new version of the Document, or add a link to it if it is stored elsewhere.
- 
Vanta supports various file types for document uploads, ensuring flexibility and convenience for users. The supported file types include .ai, .csv, .docx, .jpg, .pdf, .png, .txt, .webp, .xlsx, and .zip. 
- 
The maximum file size allowed for uploads is 50 MB. 
 

## Bulk uploading documents
This upload method helps reduce manual work and ensures consistent tracking of document requirements across your organization.
- 
From the right-hand navigation panel, select Add Document, followed by Import documents 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1600182793/e4e06faba7efc62e4c97fd56c980/Screenshot+2025-07-02+at+2_13_52%E2%80%AFPM.png?expires=1794967200&signature=08670ecec30cf62a5dfe78b31028b807a4d4a7c0894925448dc664e52d602525&req=dSYnFsh2n4ZWWvMW1HO4zfOPNHLn52thgmR1GFPupmRZLjTEVctWMm9ojcA2%0A4s4vU678%2BhzYw5QkLzY%3D%0A>
- 
Download the Excel template
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770687/72bdeae4341952d7c2c97ba0091f/24884959466900?expires=1794967200&signature=843b10dec0e9d7c0fc7974afe78f8f3b30930f90392f9b890ac63352a18227fd&req=dSUmEM55nYdXXvMW1HO4zWI9wyf3EuGIPgoDsllEDCA5KFVy%2FQGP6a7C0tnN%0AOCdj1Bh74PKWQsIGI9M%3D%0A>
- 
Complete the columns with the following information
- 
Name: Document name
- 
Description: Description of the document
- 
Restricted: Valid values include:
- 
true – document can only be viewed by Admins, owners, and auditors
- 
false – document is visible to all users
- 
Tip: Use true for sensitive files like employment agreements or background checks
- 
Cadence (How often the document should be renewed):
- 
Never
- 
Weekly
- 
Monthly
- 
Quarterly
- 
Bi-annually
- 
Annually
- 
Tip: This field helps Vanta notify you when it’s time to reupload or review the document. Learn more: Document Renewal Settings <https://help.vanta.com/en/articles/11345476-document-renewal-settings>
- 
Time Sensitivity:
- 
Valid values include Anytime and During audit window
- 
Tip:
- 
Anytime means the document can be valid year-round
- 
During audit window means the document is only relevant during a defined audit period
- 
Control IDs (optional): Assign one or more Vanta control IDs the document maps to.
- 
Example: "AST-1" or "AST-1,AST-5"
- 
Important: This must be a Vanta control ID, not a framework or criteria ID
- 
You can find control IDs on the Controls page
- 
Tip: You can leave this blank if the document doesn’t map to a control
- 
Once the template is completed, select the + and upload it to Vanta.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770697/c7ef5f6bd68a4bae20ad5bc3595b/24884959477780?expires=1794967200&signature=5d65035e6f9a6281016cdfabac0f056f45259a809d2eb55081e031919bd08872&req=dSUmEM55nYdWXvMW1HO4zXYGnjcS%2BE%2Fsk7TIxAK1a0rBF1F0dg1MvxdpAujI%0A%2FiyLMnuXVAiQ5c%2Bb2D8%3D%0A>
- 
Select Import
- 
Vanta will validate each row and alert you of any formatting errors
- 
If no issues, the documents will appear under the Custom Documents section in Vanta
Please Note: Make sure each column has a valid entry. This helps avoid upload errors. You won’t always be able to avoid errors completely, but entering clean data reduces back-and-forth fixes.
 
 

## Troubleshooting document uploads
Why Can’t I Upload Sensitive Documents? In Vanta, users with "Editor" permission cannot upload sensitive documents. To resolve:
- 
Have an Admin upload the document.
- 
Request an upgrade to "Admin" permissions from your account admin.
Why Is the Submission Button Greyed Out? This usually occurs with actions on expired documents. To resolve:
- 
Remove the expired document.
- 
Update or upload a valid document.
Why Don’t Documents Appear After Uploading to a Control? This issue might happen if the control is snoozed. To resolve:
- 
Go to Frameworks > ISO > Control: A.8.14 Redundancy of Information Processing Facilities.
- 
Click Add Control.
- 
Use the filter to select "No Framework."
- 
Select "Redundancy of Information Processing Facilities."
- 
Click Add.
Why Is My Upload Failing Due to an Invalid File Type? Vanta does not accept certain file formats, such as .XLS. If you encounter an invalid file type error, convert your file to a supported format, such as .XLSX, .CSV, or .PDF, and re-upload.
 
Why Are Word or Excel Documents Showing Upload Errors? Documents with Microsoft Information Protection (MIP) labels or similar protections cannot be uploaded to Vanta. To fix this:
- 
Remove the protection label if possible.
- 
Export the document to an unprotected format (e.g., PDF) and re-upload. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2105220352/8b8e41169238d88da5a923c0a839/image.png?expires=1794967200&signature=b0ee203ccdd109122a9387808742d1c27643a7571f1419aa1e317ac3e0c85374&req=diEnE8t8nYJaW%2FMW1HO4zV4dylWqyDhYLKtNcv%2BMeYgz0NqQOjSj3GJ7fRkF%0AEEjddbvMo8TZznZg1IU%3D%0A>
- 
This page will also show you the audit history, showing the actions taken in the document within Vanta.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2105220351/791c6e3cbd99eaa87dc7f4823f01/8981954075924?expires=1794967200&signature=ba90fb425ce3d6a32e460f50d583a38fc2d6953942d8db0b490cb15a33c2e288&req=diEnE8t8nYJaWPMW1HO4zaLamMSG0P5VuYOO3iDtXitumVxCvWFVrCGbUgfX%0AM%2FbN2F72DSP0cYC2iwg%3D%0A>
- 
The Show full description section of the page will show the Document's description in details.
- 
Document recurrence can be adjusted by clicking on the two arrow icon
- 
Ownership can be adjusted by clicking on the owner name or Unassigned  and choosing a new assignee from the dropdown.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2105220353/878d1f4fd49f8a0319a497ee2a66/image.png?expires=1794967200&signature=fe96331deb5d36a65b5b6f837dd91fd9abef2707a3f37382486cc7db7c7376c8&req=diEnE8t8nYJaWvMW1HO4zVRtV5Q6NcTmSe8%2BvLuzoUlREhbxht2A9khkc5tT%0AbSko%2BQKjCqvQjz9fDYU%3D%0A>
 
- 
Or select the checkbox for the row of the Document, and then select the new owner in the dropdown next to the search bar
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2112957946/bee1e370af16f33ef0e6bfb891ca/image.png?expires=1794967200&signature=e9069f4223fb65a1dd4d204d69d9dbf69c12ce54951718395fcba888be0fc623&req=diEmFMB7mohbX%2FMW1HO4zbDdDPlJ4g6o1kqZOxDRakwn2OoCVE9tUGLMrEvS%0AXDy9CLXy%2Fe2Du90LkuQ%3D%0A>
 
 

## Marking as complete and document history
When you upload or update files in a document, those changes may start as a draft. Your document will only reflect the updated evidence once the draft is marked as complete. 
 

### Auditor visibility & marking as complete
Auditors will only see document files after the document is marked as complete (and, if your organization uses document approval workflows, after the document is approved). If you make changes after marking a document as complete, those changes remain in draft and won’t be visible to auditors until the document is marked as complete again. 
 
To mark a document as complete:
 | 
What to click | 
Your situation
 | 
Mark as complete | 
Typically if you’re updating a document and you’ve added or changed evidence, click Mark as complete to finalize the update so it counts as the current version.
 | 
Ready for audit | 
If you’re responding to an auditor request using the Information Request List (IRL) <https://help.vanta.com/en/articles/12293647-information-request-list-irl-in-vanta-public-preview>, click Ready for audit to indicate the evidence is finalized and ready to share.
 | 
Submit | 
If you're using approval workflows, you'll finalize updates by clicking Submit. This sends the draft evidence for internal approval. Once it’s approved, it becomes the current version that can be shared with auditors.
If you don’t see any of these buttons, you may not have a draft update in progress (or you may not have permission to finalize documents).
 

### Updating a document
If you need to update evidence (for example, replace an expiring file), create a new draft and add your updated file(s). You can also copy files from the latest version into a new draft to speed things up. Once you’ve finished updates, mark the draft as complete.
 

### Multiple files
If a document has multiple files and one of them expires, the document status can change to indicate that it needs review and an update.
 

### Document history
Non-expired files are grouped as the current version satisfying the document request. Expired files move to History and are grouped by upload date. If only expired files exist, the most recently uploaded files are treated as the current version, and older files remain in History.
 
 

## Editing document details
- 
To edit the document filename or description, select the pencil icon on the right-hand side of the page
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1992583246/b74efac9525987431f0f951b0c1d/image.png?expires=1794967200&signature=66cbca1efc99a3f301c4a6c64386e42dd1030fc4bca050cdc70ef347c7e8971f&req=dSkuFMx2noNbX%2FMW1HO4zfoubiF4hpUp1WtUQY8Cz%2BVYRBD%2BFB%2BqpudO4gSh%0AJfr4ukKA06ALRn2fVD8%3D%0A>
- 
To edit the recurrence or owner, click the buttons for the recurrence underneath the title and description
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1992584216/234205163886d95743d0f6c8297c/image.png?expires=1794967200&signature=0989fd927300e7c32167356c19f0d33c11862097fd9a872b71628f946dc33d5b&req=dSkuFMx2mYNeX%2FMW1HO4zR6Sjkme0Aq9TknIK9dbefCoDn6m8n6pZgf5ZAfz%0AHSUbYZ%2BzBsMZxJyOaPM%3D%0A>
 
If the document is attached to a test, any updates you make here, such as renaming the file or updating the owner, will also be reflected in that related test.
 
 

## Setting document recurrence
Leverage Vanta's document renewal settings <https://help.vanta.com/en/articles/11345476-document-renewal-settings> to keep your documents up to date. You can set a recurring renewal cadence or choose a one-time custom renewal date when needed. Automated reminders notify you in advance of upcoming renewals.
 
 

## Removing documents
- 
To remove a document, select the title you want to delete
- 
Once on the document's details page, select ... the document you would like to delete
- 
Select Delete
Please Note: the document is tied to a test, deleting it here will cause that test to fail until a new version of the document is uploaded. Always confirm whether the document is linked to an active test before deleting it.
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770722/8889cd1bf94fb4c267e62e09f5c2/27534740629140?expires=1794967200&signature=e6964519154b53c9be1e322ea1b4585894dd3da69bdf0b980e8dc6e80ceeb088&req=dSUmEM55nYZdW%2FMW1HO4zUMZrU9O%2Bz8ouK40m7IzHMhIGo2IoRYUFR0iWeix%0A9BsxA4c93saDpT5YcOs%3D%0A>
 
 

## Downloading documents
- 
Export All: This option will download all documents stored on the Documents page in a zipped file.
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770736/573c339b64d0f67aee167b278dc5/35310857008532?expires=1794967200&signature=e38f7bb6e6ef7fd5840895ebfa353060d2407bf59668029cfbdfa87f30703259&req=dSUmEM55nYZcX%2FMW1HO4zQDQpmnveQAUvw8Q7UWAux21b78a%2FP47ywdIJ3Lq%0A%2BD8B7wpjdOdM9M9Bmyo%3D%0A>
- 
Export One:
- 
Select the title of the document you would like to download
- 
Once on the document's details page, select the Document you want to export.
- 
Select Download
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770742/bd2e77c0f7b7ad85343d25028b83/27534747952788?expires=1794967200&signature=95d5dc4da079c8969327de3b6214e699706296eaf148272a17282c2e38870bba&req=dSUmEM55nYZbW%2FMW1HO4zYsHxgo1EtAgL0psKbkSw1N%2BXZt84ds15bYegsDR%0AAZ31nR%2F7gGKAL0gyGg0%3D%0A>
 
Please Note: Downloaded documents will include any that were uploaded as part of document tests. These files serve as your point-in-time compliance evidence and can be shared with auditors if needed.
 

## Sensitive documents
Documents marked with a sensitive tag are restricted to document owners and users with Admin permissions. Auditors are granted temporary access to sensitive documents during a scheduled audit period to verify that your organization is following the requirements for SOC 2.Additionally, users with the "Editor" permission level cannot upload sensitive documents. To address this:
- 
Have an Admin upload the document on your behalf.
- 
Request an upgrade to "Admin" permissions from your account administrator if you need ongoing access.
It is not possible to change the sensitivity of a default document. Custom documents can be flagged as Sensitive; see "Marking Custom Documents as Sensitive <https://help.vanta.com/en/articles/11345473>" for more details.
Examples of documents that may be marked as sensitive include:
- 
Board of Directors meeting (note: not sensitive by default)
- 
Background checks
- 
Exit interview
- 
Org chart
- 
Performance evaluations
- 
Contractor Agreement
- 
Employee agreement
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770745/640e18d20b6b60af18f471d2ee8d/19608119195796?expires=1794967200&signature=eb1bea7e4aea51abe22e4e73ca90df9432a25b4698cce583c591ac77ed926183&req=dSUmEM55nYZbXPMW1HO4zVmd7U7cZMYBEmxecdfAqqz3EU7MR4e4UC5V2Tet%0Aat0uUnIithZrKD6KJdA%3D%0A>
 
 

## Approval workflows for documents
- 
From the Compliance settings page, enable the Document approval workflow. Select the individual(s) for each approval step. Up to three approvers can be assigned to each step, and you may have up to five steps in your approval process.
- 
In your account header, click the Settings icon
In the Settings page menu, scroll to the Features section and select Compliance
- 
Please note that this approval workflow will be enabled for all documents once turned on.
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2112960025/ed3ae3372e58be4293c4d770bb66/image.png?expires=1794967200&signature=9d32baf72b9d6de4448fa9b62b155f7bb0e4f902e9c659019e3534241431af8b&req=diEmFMB4nYFdXPMW1HO4zZTyc8DBvK%2BcgFW7YnqnOg%2BfkKTMasuFlh3UaY6d%0AvqVf9wVLjOwXxqgK5ig%3D%0A>
- 
Once your document has been uploaded (either directly or as part of a document test), you can submit it for approval. Approved documents automatically mark their related tests as “OK,” confirming compliance evidence for the associated control.
- 
From the Evidence tab of the selected document, select Submit for approval.
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770764/be419264a5c7e43e0cf9909d1380/35458187722644?expires=1794967200&signature=ea8cc5f0eefe2fbd8b14d23f47ecd61520d9152e49294ce562771e4884c9a545&req=dSUmEM55nYZZXfMW1HO4zafOi%2FmA1FfFKQSXzbNtGtYCE%2FLDxXO%2FT2fRKOb7%0ACjICZFpxAkhC3zsg%2F%2Fw%3D%0A>
- 
Approvers will receive an email to review and approve the evidence submitted to a document. If there are multiple steps, all approvers in each step must approve before the next step begins.
- 
Once the document has been approved, it will become visible to auditors from their Auditor instance.

## Images

- [image 01] ../../images/ux/documents/managing-documents--01.png
- [image 02] ../../images/ux/documents/managing-documents--02.png
- [image 03] ../../images/ux/documents/managing-documents--03.png
- [image 04] ../../images/ux/documents/managing-documents--04.png
- [image 05] ../../images/ux/documents/managing-documents--05.png
- [image 06] ../../images/ux/documents/managing-documents--06.png
- [image 07] ../../images/ux/documents/managing-documents--07.png
- [image 08] ../../images/ux/documents/managing-documents--08.png
- [image 09] ../../images/ux/documents/managing-documents--09.png
- [image 10] ../../images/ux/documents/managing-documents--10.png
- [image 11] ../../images/ux/documents/managing-documents--11.png
- [image 12] ../../images/ux/documents/managing-documents--12.png
- [image 13] ../../images/ux/documents/managing-documents--13.png
- [image 14] ../../images/ux/settings/managing-documents--14.png
- [image 15] ../../images/ux/documents/managing-documents--15.png
