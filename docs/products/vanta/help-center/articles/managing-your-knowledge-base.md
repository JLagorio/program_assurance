# Managing Your Knowledge Base

Source: https://help.vanta.com/en/articles/11345465-managing-your-knowledge-base
Collection: Trust Management ; Trust Management › Customer Trust ; Trust Management › Customer Trust › Questionnaire Automation
Fetched: 2026-11-17

## Article text

✅ Feature availability: This article discusses Questionnaire Automation features, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
In Customer Trust, the knowledge base is where you manage the source information that powers Questionnaire Automation and resources shared in your Trust Center. Add resources and answers to help Vanta generate accurate responses to incoming questionnaires, manage the visibility of resources on your Trust Center, and track how well your knowledge base is covering the questions you receive.
 
⚙️ User permissions: Trust Admins, Editors, and Admins can manage the knowledge base and its settings. Trust Collaborators have view-only access unless they’re assigned as a resource or answer library owner. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Getting started
The Knowledge base page is organized into four tabs:
 | 
Tab | 
Description
 | 
Resources | 
Upload and manage the documents and files that power Questionnaire Automation and your Trust Center.
 | 
Answer library | 
Store and manage question-and-answer pairs that Vanta uses to generate responses to incoming questionnaires.
 | 
Coverage insights | 
See how well your knowledge base is covering questions from processed questionnaires, and identify gaps to fill.
 | 
Conflicts | 
Surface conflicting or duplicate answer library entries to improve answer accuracy and reduce maintenance overhead.
 
 

## Resources
Resources are the documents and files in your knowledge base. When added to Questionnaire Automation, Vanta AI extracts and indexes their content to help generate accurate responses. When marked as public or requestable, they appear on your Trust Center for viewers to access.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2543169374/80be0c48d6190ca09738885ce404/image.png?expires=1794967200&signature=b1d80f93c45871d814e8ef79d0656b05be3301992cf86faba34c344a8130b4a0&req=diUjFch4lIJYXfMW1HO4zapZiWkmeLuyEIVF%2BWOkLyn%2BrZAWOR6NRMXfyxOU%0AO3TTAMgGuWP3b6Pr5RA%3D%0A>
 

### Adding resources
 
You can upload resources from your device, link to web pages as resources, or import eligible resources from your Vanta account.
 
From the Resources tab of your knowledge base, click Add resources and choose an available option:
 | 
Option | 
Description
 | 
Upload resources | 
Upload a file from your device. Manually uploaded files are static, so if the underlying information changes, you'll need to upload a new version yourself to ensure your Trust Center is up to date.
 | 
Sync from web page | 
Link a web page as a resource. Vanta regularly re-scans it to keep content current for question answering, and you can optionally include sub-pages in scanning. Only Private and Public visibility are supported.
 | 
Import resources from Vanta | 
Select from eligible policies, audit reports, and penetration tests already in Vanta. We’ll flag policies with a banner when a newer version exists, so you can update the resource with one click. Audit reports and penetration tests don't get this notification, so you'll need to update them when they change to ensure your Trust Center is up to date.
 | 
Publish OSCAL from Vanta | 
Select the resource from an eligible government framework <https://www.vanta.com/products/additional-frameworks> enabled on your account (currently FedRAMP frameworks and NIST 800-53 are eligible). It's generated fresh on every download, so no manual updating needed. Only Shareable, Requestable, and Public visibility are supported, and it can't be used for question answering.
 | 
Import questionnaires | 
Adds question-and-answer pairs to your answer library, not as a knowledge base resource.
Resources with question answering enabled, including supported PDF and DOCX files and web page resources, will be scanned and available as a source for questionnaire automation <https://help.vanta.com/en/articles/11345464-getting-started-with-questionnaire-automation> within minutes. Resources with customer visibility marked as Public or Requestable will appear in your Trust Center.
 

### Editing resources
- 
Click the ••• menu next to the resource you want to edit.
- 
From here, you can edit the following for a resource:
- 
Resource name
- 
Resource description
- 
Upload a new version
- 
Tags
- 
Customer visibility in Trust Center
- 
Use for question answering (this is only available to accounts with questionnaire automation)
 

### File upload history
- 
If you upload a new version of the resource using the Edit option, the version history will be available for you to view.
- 
Click the ••• menu next to the resource and select View file upload history.
- 
You can click on any version to download the file or click the clock icon and restore the resource to a previous version.
 

### Customer visibility and sharing
 
From your knowledge base, you can update the visibility of resources on your Trust Center. The following options are available, depending on how the resource was imported:
 | 
Setting | 
Visible in Trust Center | 
Shareable
 | 
Private | 
❌ No | 
❌ No
 | 
Shareable | 
❌ No | 
✅ Yes - access must be granted directly
 | 
Requestable | 
✅ Yes | 
✅ Yes - viewers must first request access
 | 
Public | 
✅ Yes | 
✅ Yes - all viewers can access
From Trust center > Access requests, you can share resources with viewers directly, even if they aren't visible on the Trust Center. Visibility and shareability are different things: visibility determines whether a resource appears on the Trust Center at all, and if it does, whether viewers can open it directly or must request access first. Learn more about Trust Center access <https://help.vanta.com/en/articles/11345469-vanta-trust-center>.
 
💡 Tip: To customize where a document appears on your public Trust Center, manage its category from the Trust Center editor  <https://help.vanta.com/en/articles/11345469-vanta-trust-center>— not the Knowledge Base.
 

### Deleting resources

### Deleting a single resource
- 
Click the … menu on the resource.
- 
Confirm that you want to delete the resource.
- 
If the resource is being used for Questionnaires, deleting it will prevent it from being used to answer security questionnaires.
- 
If the resource is shown on the Trust Center, deleting it will remove the resource from the Trust Center.
- 
Click Delete.

### Bulk deleting resources
- 
Select the resources you would like to remove from the Knowledge base
- 
If this resource is also on your Trust Center
- 
Confirm that you want to delete the resources
- 
If a resource is being used for questionnaires, deleting it will remove the resource from being used to answer security questionnaires.
- 
If a resource is shown on the Trust Center, deleting it will remove the resource from the Trust Center.
- 
Click Delete
 
 

## Answer library
The answer library is where you store reusable question-and-answer (Q&A) pairs that Vanta uses to respond to incoming questionnaires. Unlike Resources, which store documents, webpages, and other reference materials, the answer library is for Q&A pairs—typically answers you’ve written for past security questionnaires that you want Vanta to draw on in the future. When answering a question, Vanta looks up related entries from your library and uses the exact answer if the question matches, or uses it as context to generate a new one.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2543176920/fb09d084f95bc9a7982e323fad53/image.png?expires=1794967200&signature=1150478e3774cfe2b7cb672f6fd905565dda962e88192e1d6a77b60a8ce7683d&req=diUjFch5m4hdWfMW1HO4zZvdUKQOQi%2BHGj5J9NM275Dpv%2Bd6DNWR0FY7ge3%2B%0A3J2anPOOjDOu21HsOpI%3D%0A>
 

### Importing past questionnaires
 
Import a completed questionnaire to quickly build your answer library. Vanta supports CSV and XLSX files. If your past questionnaires are in other formats, add them to the Resources tab instead—Vanta can use them as reference material for future questionnaires.
 
To import a questionnaire:
- 
Go to your Knowledge base and open the Answer library tab.
- 
Click Import questionnaire.
- 
Upload your file. You can drag and drop or click Upload to select a file. Files must be CSV or XLSX and under 50 MB.
- 
Add tags to apply to the imported answers, if desired.
- 
Click Next.
- 
Match the question and answer columns from your file.
- 
Click Confirm.
​
⚠️ Note: Imported answers aren't available for use until you review and approve them.
 

### Adding answers manually
 
Add individual question-and-answer pairs directly to your library without importing a file. Manually-added answers are added immediately—they don’t require review to move them out of pending.
 
To add an answer manually:
- 
Go to your Knowledge base and open the Answer library tab.
- 
Click Add answer.
- 
Enter a question and answer.
- 
Assign an owner, set an expiration date, or apply tags as needed.
- 
Click Add.
 

### Reviewing pending answers
 
Imported answers aren't added to your answer library automatically—they go into a pending queue first. You must review and approve them before they can be used to respond to future questionnaires.
 
When answers are pending, a banner appears at the top of the Answer library asking you to review answers pending import.
 
To review pending answers:
- 
Go to your Knowledge base and open the Answer library tab.
- 
Click Review answers.
- 
Review each entry. If an incoming question duplicates one already in your library, it's flagged in the Duplicate questions found column.
- 
Accept or deny each change.
- 
Accepted answers are added to your library and available for future questionnaires.
 

### Marking answers as verified
 
Verifying an answer confirms that its content is accurate and up to date until the next verification date. Verified answers show a Verified status in your answer library.
 
To verify an answer:
- 
Go to your Knowledge base and open the Answer library tab.
- 
Click the entry you want to verify to open it.
- 
Review the answer to confirm it's accurate.
- 
Click Mark as verified.
- 
Choose the Next verification date to determine the expiration date.
- 
Click Verify.
​
ℹ️ Note: If review cadence is configured, the next verification date is set based on that cadence by default. Existing answers won’t automatically enter the review process until they have an owner and an initial expiration date.
 

### Editing answers
 
To edit an answer in your answer library:
- 
Go to your Knowledge base and open the Answer library tab.
- 
Click ••• on the entry you want to edit.
- 
Click Edit.
- 
Make your changes.
- 
Click Save.
 

### Deleting answers
 
If answers were imported from a questionnaire that has since been deleted, those entries remain in your answer library and need to be removed manually.
 
To delete answers from your answer library:
- 
Go to your Knowledge base and open the Answer library tab.
- 
Click ••• on the entry you want to delete, or use the checkbox to select multiple entries.
- 
Click Delete.
- 
Confirm deletion.
 

### Filtering and searching answers
 
Use the search bar and filters to find entries in your answer library:
- 
Search: Enter a keyword in the search bar to filter entries by question or answer text.
- 
Source: Filter entries by the questionnaire they were imported from.
- 
Last updated: Filter by a date range by choosing a date range.
- 
Add filter: Filter by tag category or expiration status.
 

### Exporting your answer library
 
Click the download icon above the entry list to export your answer library as a CSV file.
 
 

## Coverage insights
Coverage insights shows how well your knowledge base is covering questions from processed questionnaires. Use it to identify topic areas where your knowledge base has gaps and take targeted action to improve automation performance.
 
ℹ️ Note: New content added to your knowledge base only impacts coverage calculate for future questionnaires and won't recalculate past coverage.
 

### Understanding coverage scores
 
The coverage score shows the percentage of questions from processed questionnaires that Vanta was able to answer using your knowledge base. 
- 
Coverage is based on the actual questions you've received through questionnaire automation—not a measure of how well your knowledge base covers every possible security topic.
- 
It doesn't measure answer quality or accuracy. A question counts as covered even if someone later edits the answer.
 

### Viewing, filtering, and exporting data
 
The Coverage insights tab shows your overall coverage score and a breakdown by topic and subtopic, sorted by lowest coverage first by default.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2471539847/f38efb43b30c8712deec83905af9/image.png?expires=1794967200&signature=a1e6c05dc9efae000d59592c76599657d7663596319e46876fb27eceaa8685b7&req=diQgF8x9lIlbXvMW1HO4zc0iXTZp5r4mlgpGe4gmNU7CH86o8D6PKi5d92Lb%0AoMWgTVGHMqO87CK7fPQ%3D%0A>
- 
Click any topic to expand it and see its subtopics.
- 
Click a subtopic to open a detail panel showing the specific questions Vanta wasn't able to answer based on your knowledge base, along with the source questionnaire and date.
- 
Filter by timeframe or a custom date range.
- 
Filter by tag to scope the view to questions from questionnaires with that tag.
- 
Sort topics by coverage percentage, total questions, or unanswered questions.
- 
Download an export of the topic list with coverage data and question counts.
ℹ️ Note: Not all questions will appear in the topic breakdown. Questions that don't map to a recognized security topic category may be excluded.
 

### Adding to answer library
 
You can add an unanswerable question directly to your answer library to improve future coverage.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2471536790/f784bb3182d864f826ff13ad68d9/image.png?expires=1794967200&signature=7e172e7309028c8e61a8253f56bdd0c5505fcf4c31604ed28bf800b857276fee&req=diQgF8x9m4ZWWfMW1HO4zWDg4i7mc2r06L84nWHdDSDJeYFror4I20qTM6iS%0ACI%2FW3w0ncZioRlbZVv8%3D%0A>
 
To add a question to your answer library:
- 
Click a subtopic to open the detail panel. 
- 
Review the unanswerable questions listed. Up to 25 questions are shown per subtopic.
- 
Click the + button to add a question to the answer library.
- 
Edit the question and answer and save.
​
ℹ️ Note: The new entry will be available for future questionnaires. Since coverage is based on previously processed questionnaires, your score won't change immediately—it will improve as new questionnaires are processed.
 
 

## Conflicts
Conflicts show answer library entries where Vanta AI has detected conflicting or duplicate responses. Resolving conflicts helps ensure Vanta generates accurate, consistent answers to incoming questionnaires. Responses with different tags aren't compared.
 

### Reviewing conflicts detected
 
The Conflicts tab shows a list of detected conflicts, each with a plain-language description of the issue and the number of affected entries. 
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2471540444/8f3900ef145a9564016dd1896a31/image.png?expires=1794967200&signature=e88a04bbe71189573bc40d59fb5f5a2653ef453e3839fff19390f3b68ea63b4c&req=diQgF8x6nYVbXfMW1HO4zbGCxk%2Fq4mONnNqnod3EYevp22pBVxwIOZGzW9qw%0AGOmGsXeZdtQk1FWfWO8%3D%0A>
- 
Click any conflict to open it and review the details.
- 
Refresh the list to check for new conflicts.
There are two types of detected conflicts:
 | 
Type | 
Description
 | 
Conflicting answer | 
Two or more entries answer the same question differently.
 | 
Potential duplicate | 
Two or more entries appear to answer the same question.
 

### Resolving a conflict
 
When you open a conflict, Vanta shows an AI-generated summary of the contradiction, the most up-to-date answer, and the conflicting entries.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2471535033/3b119f8739e1b836816deab34fc7/image.png?expires=1794967200&signature=8f77adfc5c36be277ca3b0d02e67dcca34dde19c13d87fed5440d2e663b6ab2f&req=diQgF8x9mIFcWvMW1HO4zaewKlTLa%2FVi%2BDnux9oPR%2BZC44BjW%2Bvac%2Fv6XTXd%0ALe2mnQJOsp7Ix1FKzJM%3D%0A>
 
To resolve a conflict:
- 
Review the Summary to understand the contradiction.
- 
Review the Most up to date answer and conflicts detected
- 
Edit or delete entries as needed to reconcile the conflict.
- 
Click Mark as resolved when done.
If the conflict isn't something you need to act on, click Dismiss to remove it from the list.
 
 

## Tags
Tags help you organize knowledge base content by context, such as product, region, or business unit. You can apply tags to resources and answer library items, use tags to filter coverage insights, and rely on tags to keep conflicts comparisons within the right context.
 

### Creating tags
 
Tag categories and values are managed in your account settings, not in the knowledge base. To set up tags, go to Settings > Tags.
📖 Learn more: Building Custom Tags: Trust Center and Questionnaire Automation <https://help.vanta.com/en/articles/11345444-building-custom-tags-trust-center-and-questionnaire-automation>
 

### Tagging individual items
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2486856213/7dae143422d6c8fda7966b106ed1/image.png?expires=1794967200&signature=7aabda16918b0b25622700ceea3b7300196e85864efb9fabec8742f04ce8c01b&req=diQvEMF7m4NeWvMW1HO4zQMtY55Ji5NAZPW5W9ThVuSWnTYu4BQSPnBsySes%0AOMx7W0UGMmzrA9ZsnzQ%3D%0A>
 
To tag individual items in the knowledge base:
- 
Go to your Knowledge base.
- 
Open the Resources or Answer library tab.
- 
Click the item you want to tag to open it.
- 
In the right panel, click the edit icon next to Tags.
- 
In the Manage tags modal, select the tags you want to apply for each relevant category.
- 
Click Save.
 

### Bulk tagging items
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2486855307/a379c15ff63020da5767f4bfded1/image.png?expires=1794967200&signature=bac176009acead591a4d3e41403abf8c26267735025159365a408f20ed9ab034&req=diQvEMF7mIJfXvMW1HO4zZXIMHyy7cIn3w3TeBqeuzjndvkdsfTnDLHkYEbk%0AgRfhKTYS5oJkIfWPIKg%3D%0A>
 
To tag items in the knowledge base in bulk:
- 
Go to your Knowledge base.
- 
Open the Resources or Answer library tab.
- 
Select the items you want to tag.
- 
Click ••• in the toolbar, then select the category to add or remove.
- 
From the modal, select the tags you want to apply or remove.
- 
Click Save.
 

### Filtering by tag
 
You can filter by tag in the Resources, Answer library, and Coverage insights tabs.
- 
Click Add filter.
- 
Select a category from the dropdown.
- 
Select the tags you want to filter by.
 
 

## Automated verification
Automated verification helps you keep your knowledge base accurate and up to date. Assign owners to resources and answers, set a review cadence, and Vanta will notify owners when content is expiring soon or has already expired.
 

### Setting the review cadence
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2471528280/27544de19f145c5bef35c789ca52/image.png?expires=1794967200&signature=c04894caab403f7d79bf12df83fd55262d4be9ff43055eaa273433139741f74b&req=diQgF8x8lYNXWfMW1HO4zT%2BLiVs9JfvfX7BDzYyX2Gb5hukMBxn1wiJa%2BSb%2B%0AEQZq4uROoJJ0WZrBruY%3D%0A>
- 
In your account header, click the Settings icon.
- 
In the Settings page menu, scroll to the Features section, select Customer Trust, and go to the Knowledge base tab.
- 
From here, select the default review cadence using the drop-down. When enabled, new items in the knowledge base will be set to expire based option you select.
​
ℹ️ Note: Establishing these settings will not automatically enroll your existing resources and question library answers in the review process. You must first assign an owner and set an initial expiration date before knowledge base resources and answers become subject to the review cadence.
 

### Assigning owners
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2471538399/77b74b805d9f2c99d39b80ec7427/image.png?expires=1794967200&signature=d9dc6e568d5b47f14f4b9d2567b0c832d897587fcd7bb9321c864ad963defedf&req=diQgF8x9lYJWUPMW1HO4zR8h48zx0OgSwygmEd2Hl7C0eIXCPILZwSc%2B538V%0AV3fHzOBfy3NcxDgfHgM%3D%0A>
 
The first step in ensuring successful verification process would be to assign ownership to each item. This will allow the owner to receive notifications related to the verification process and cadence.
 

### Verifying resources and answers
 
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2471525684/879ecf4e8a8f60686c8bc4f664b6/image.png?expires=1794967200&signature=96e73f0b78c55d6e7202f94d87d01ab4e3b3b58a613a503d2a96f031af675502&req=diQgF8x8mIdXXfMW1HO4zcNjmnP0eNTL6LoQBVkyKEUDPiwFD1Aavdm2wYwq%0AMuh3BCJu8o327NSLiOo%3D%0A>
- 
Select the resource you would like to verify. This applies to both knowledge base resources, and items in the answer library.
- 
Review the resource to ensure its accuracy, and select Mark as verified.
- 
The next verification date will automatically be updated based on the cadence established in your settings.
 

### Managing expiration dates
 
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2471526510/2d15e44be851108017ef89d5ec66/image.png?expires=1794967200&signature=b48bb18c4d82fa1ec38363141a6107d3716836f68ea4c921b4381a2d2f591822&req=diQgF8x8m4ReWfMW1HO4zV3RcXIAn1aLj6bYJhW6Q2EYgU0l%2BVQ5cQRjAbFv%0AjqjrfTZb8MstEwQdOxk%3D%0A>
- 
If you would like to set the expiration in bulk, you can use filters and multi-select. Once the items have been selected, click Change expiration date.
- 
Owners can receive a weekly email digest of the resources and answers they own that expire within the next 7 days or have already expired.
- 
If no items qualify, no email is sent to the owner. 
- 
Items without an owner aren't included—assign an owner to every item you want tracked. 
- 
Owners can turn this weekly digest on or off from Settings > My account > Notifications > Email digests > My assigned knowledge base items.

## Images

- [image 01] ../../images/ux/questionnaires/managing-your-knowledge-base--01.png
- [image 02] ../../images/ux/questionnaires/managing-your-knowledge-base--02.png
- [image 03] ../../images/ux/questionnaires/managing-your-knowledge-base--03.png
- [image 04] ../../images/ux/questionnaires/managing-your-knowledge-base--04.png
- [image 05] ../../images/ux/questionnaires/managing-your-knowledge-base--05.png
- [image 06] ../../images/ux/questionnaires/managing-your-knowledge-base--06.png
- [image 07] ../../images/ux/questionnaires/managing-your-knowledge-base--07.png
- [image 08] ../../images/ux/questionnaires/managing-your-knowledge-base--08.png
- [image 09] ../../images/ux/settings/managing-your-knowledge-base--09.png
- [image 10] ../../images/ux/questionnaires/managing-your-knowledge-base--10.png
- [image 11] ../../images/ux/questionnaires/managing-your-knowledge-base--11.png
- [image 12] ../../images/ux/questionnaires/managing-your-knowledge-base--12.png
