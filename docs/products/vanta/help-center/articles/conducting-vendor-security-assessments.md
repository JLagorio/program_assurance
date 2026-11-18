# Conducting Vendor Security Assessments

Source: https://help.vanta.com/en/articles/11345550-conducting-vendor-security-assessments
Collection: Risk, TPRM & AI Gov ; Risk, TPRM & AI Gov › Third-Party Risk Management
Fetched: 2026-11-17

## Article text

✅ Feature availability: Some features (like Vanta Exchange, automated evidence gathering, and vendor object assignments) may require a TPRM add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
As part of the Third Party Risk Management <https://help.vanta.com/en/articles/11345557> (TPRM) product, security assessments enable you to evaluate and manage the security posture of your vendors and proactively mitigate risk. You can assess vendor risk, collaborate with vendors to collect and review evidence, and document final decisions with recommendations and residual risk—all in one place.
 
In addition to security assessments, Vanta supports other assessment types <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews>, such as privacy, AI, finance, legal, and custom assessments. Each assessment type can be configured with its own frequency, questionnaire, evidence requirements, and automation settings based on vendor risk.
 
⚙️ User permissions: Editors and Admins can manage all vendor assessments and open Vanta Exchange from within assessments. Collaborators assigned as a Business Owner or Assessment Owner on a vendor can manage all of that vendor’s assessments and the Vanta Exchange access list, including adding their own email to access Vanta Exchange. Learn more <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>
 
 

## Getting started
Security assessments can include either an internal-only questionnaire or a vendor-facing questionnaire. This is determined by whether the questionnaire is hidden from or shown to the vendor <https://help.vanta.com/en/articles/11345893-managing-vendor-assessments#h_946cb29811>. To confirm whether the questionnaire is shared with the vendor, open the assessment and check the questionnaire in the Evidence section—it will say either Shown to vendor or Hidden from vendor.
 

### Questionnaires hidden from vendor
 
When the questionnaire is hidden from the vendor, your team reviews the vendor privately—uploading evidence, answering questionnaire questions yourselves, and discussing findings internally.
- 
Start a security assessment and select a questionnaire that's hidden from the vendor.
- 
Upload evidence you've collected to the assessment.
- 
Review questionnaire answers and flag any findings.
- 
Add internal comments to discuss specific questions with your team.
- 
Make an assessment recommendation.
 

### Questionnaires shown to vendor
 
When the questionnaire is shown to the vendor, you involve them directly through Vanta Exchange, where they can respond to the questionnaire and upload requested evidence.
- 
Start a security assessment and select a questionnaire that's shown to the vendor.
- 
Request evidence from the vendor through Vanta Exchange.
- 
Add vendor comments to collaborate with the vendor directly or internal comments to discuss specific questions privately with your team.
- 
Review questionnaire answers and flag any findings.
- 
Make an assessment recommendation.
 
 

## Starting an assessment 
Security assessments can be started manually or triggered automatically as part of a recurring assessment, depending on your assessment rules <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews> for security assessments. For recurring assessments, Vanta can automatically request evidence based on the rules you’ve configured.
 
For individual vendors and assessment, you can manage assessment settings <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews> to control how the vendor is engaged during the assessment, such as whether Vanta AI answers are shown to the vendor, whether the vendor’s point of contact is automatically asked for evidence, and whether reminder emails are sent.
 
 

## Requesting evidence
Once a security assessment is in progress, you can customize exactly what evidence you want to collect from the vendor. In Vanta, requesting evidence means sending a security questionnaire along with any supporting documents or resources (such as SOC 2 reports, policies, or architecture diagrams) needed to evaluate the vendor’s security posture. The questionnaire gathers structured information about the vendor’s controls, while supporting resources provide additional context to validate their responses.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2059224770/795adfb98db660a6db8fc7c84c4d/image.png?expires=1794967200&signature=c6a8a89882caf774876718c2abb46ff910e79ece00603edc6f685c5f2100d1b5&req=diAiH8t8mYZYWfMW1HO4zYeaJERWS6fp18ggRRJWh6tJWKZRpiUhvYqXR8gi%0A9mhxhxXr4Iz4ZIPM8xw%3D%0A>
 
Before requesting evidence, make sure you have a questionnaire ready to add to the security assessment. You can edit the evidence list to add the questionnaire and request any additional resources you need. This defines what the vendor is expected to provide and ensures you collect the right information for the assessment.
 

### Adding a questionnaire
 
When requesting evidence, you can include an in-app questionnaire, spreadsheet files, or both—and they are added in different ways, since in-app and spreadsheet questionnaires <https://help.vanta.com/en/articles/11345893-managing-vendor-assessments#h_946cb29811> are managed separately in Vanta.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2059228889/935314cc754e6aadf5dd7b50fa24/image.png?expires=1794967200&signature=978a3a4bfdb0122be31d89e9e2287467ae52b0929cf2e47654d11beb06f867ed&req=diAiH8t8lYlXUPMW1HO4zXg1vmDkDBE0DBnhdXIy8hZbYCtxhlP11%2BFeq9bJ%0AQKHpCoc4RUYVgr1b2IE%3D%0A>
 
To add a questionnaire, open the assessment and navigate to the Evidence section:
 | 
Questionnaire type | 
Instructions
 | 
Add an in-app questionnaire (recommended) | 
- 
Click Edit list and select an in-app questionnaire from the Questionnaire dropdown
- 
This dropdown includes in-app questionnaires only
- 
Vendors complete this questionnaire directly in Vanta Exchange
 | 
Add a spreadsheet questionnaire | 
- 
Click Edit list and select a spreadsheet questionnaire from the Resources dropdown
- 
These spreadsheets are templates uploaded in your questionnaire settings
- 
Vendors download the file, complete it offline, and upload it back as a document attached to the assessment
 | 
Use both in the same assessment | 
- 
Follow the steps above for each questionnaire type
- 
Vendors complete the in-app questionnaire in Vanta Exchange and return the spreadsheet questionnaire as a document attached to the assessment
To change the in-app questionnaire being used: 
- 
Click the ••• menu next to the questionnaire in the evidence list
- 
Select a different in-app questionnaire from the dropdown
- 
The selected questionnaire replaces the previous one in the assessment
- 
Vendors will only see and respond to the updated questionnaire
 

### Adding resource types
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2059234384/abcfa4c230f400e4a789e3791e97/image.png?expires=1794967200&signature=c14b9e082c9e46e36db5fa272a54fe673545c3a6a6f95285e25c98eafeb02822&req=diAiH8t9mYJXXfMW1HO4zUjIazaKJqYw%2B9Ka59zhL7%2B1FdqDeQgUayCiglz9%0A%2BllZx8pA7XEyuhFRRoQ%3D%0A>
 
Open the security assessment and navigate to the Evidence section:
- 
Click Edit list to add resources you want the vendor to provide. We provide a pre-selected list of resource types for you to choose from, such as: Contract, SOC 2 report, ISO 27001 report, Data Processing Agreement, and more.
- 
You can create a new resource type to add to the list—just type in the name of the resource you want to add and, if you don’t see it in the list, click + Create new resource. To manage the list of custom resource types available, go to your assessment rules <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews>.
- 
If you receive a resource you’d like to add under Evidence, click Add to upload the file or paste the link to the resource.
 

### Adding trust center resources
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2059238407/69f671a6600be12d0a82c6a077c5/image.png?expires=1794967200&signature=1ff98398788778a7889eee55126f2ccc60b1e99896b3a96a94a90369f74cf952&req=diAiH8t9lYVfXvMW1HO4zQLTtaXKLFFajRqIsr0U%2FnQOZkd2ejbwdtYz5Xis%0AZEQDoMhxU0z2YRaxxX0%3D%0A>
- 
When you start a security assessment for a vendor that has a Vanta Trust Center <https://help.vanta.com/en/articles/11345469-vanta-trust-center> (or a trust center hosted on another platform Vanta can detect), you may see an Add from Trust Center option. 
- 
From here, you can choose which available public documents to import directly into the security assessment (so you don’t need to manually download and re-upload files). 
- 
Imported documents are saved to your assessment as a point-in-time copy. If the vendor later updates a document on their trust center, you can import the new version again to update what’s attached to your assessment.
- 
If a vendor’s documents are private, you’ll need to visit their trust center to request access.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2059238082/9ca819c691cc78d0534e12270576/image.png?expires=1794967200&signature=9b86d90aad7e76343316b632c666931db54d22bca2b83d0c71953e2e1a9fe750&req=diAiH8t9lYFXW%2FMW1HO4zQKNUWoEe2WjPc6vHJT8GeAHZSrzw02zyFzbwQ5f%0Au%2Fm4ipZmoAyFd6Lk6ZY%3D%0A>
 
 
 

## Collaborating in Vanta Exchange
When you’re ready to contact your vendor, you’ll share access to the Vanta Exchange portal, the workspace where vendors upload requested evidence and complete your security questionnaire. 
 
If you started multiple assessments with the same vendor, they will show up in the same exchange portal for each vendor. This unified experience keeps all communication, documents, and responses in one place, helping streamline evidence collection and support faster, more confident assessment decisions.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2059258304/7b900a89fb068f1461ae5ad5bc96/image.png?expires=1794967200&signature=483de4001292ad025f7a35f4fe69320ab9389b3d08b0472b6568753c8cd41d76&req=diAiH8t7lYJfXfMW1HO4zT4cuTt%2Fihu0A2GYBBr0L72gsLclRGmiQOyQ01lH%0Au1jZ6xOfJnCsCKLEJxU%3D%0A>
 

### Previewing Vanta Exchange
 
You can view the Vanta Exchange portal at any time—even if you haven’t shared it with the vendor yet.
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2059260579/bdcd95245b2fa53b8a7fff9fbfcb/image.png?expires=1794967200&signature=e359c7396f6389665091bf6ca4fd7fbde0ef9f50aa6dfed7482f342c5b9d71bf&req=diAiH8t4nYRYUPMW1HO4zZD7R5SLoM%2BoC8hbRFoU%2FOJhNfC7hYvOHepopw9m%0AN1Fo1%2BJznQD1sYuBKns%3D%0A>
 
To view the portal:
- 
In the security assessment, click the down arrow ▼ next to the Request evidence button.
- 
Select View Vanta Exchange to open the portal.
- 
Select Copy link to share the link—Editors and Admins can open the link, if they’re logged into their Vanta account.
​
💡 Tip: To share the Vanta Exchange with internal users who aren’t Editors or Admins, you can add their email address to the access list, the same way you share access with vendors. Collaborators assigned as Business Owners or Assessment Owners can add and remove emails on the access list, including adding their own emails.
 

### Sharing access with vendors
 
Within an assessment, click Request evidence to share the Vanta Exchange portal with individual email addresses or entire email domains. 
- 
Access applies to all past and current assessments in the portal for that vendor.
- 
Freemail domains (like gmail.com, hotmail.com, yahoo.com, etc.) aren't supported.
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2687483730/3172fbeb12fb88f4d4ca98ff9887/image.png?expires=1794967200&signature=ff6a41b56be58944380577c86916aaaf6c088a7d52a33f76aa825ed5cbb7beff&req=diYvEc12noZcWfMW1HO4zSoXCtERkAs9cMTlokZPOe0fGRKswQDnA%2FS%2Bo8Gf%0AIyNhpvWKhdZ2LA8uDJE%3D%0A>
 

### Access list
To add an email to the access list:
- 
In the Add email field, enter the email address you want to invite.
- 
Choose whether to grant access to that email address only, or check Include all users to also grant access to the entire email domain.
- 
Add a custom message to include in the standard invitation, as needed.
- 
Click Send—we’ll send them an email with a secure magic link to open the portal.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2687486385/04c5b4df5daf82728c5953a2060c/image.png?expires=1794967200&signature=ab8665bdb88eae415b7533d2bb7705cb204d01c0154ff2a26cd0fa87a074a25b&req=diYvEc12m4JXXPMW1HO4zQvGW9E3B89F4Zf2yswpJeWnkGizvBwX1FVMq606%0A12C8EytaG%2BSpkGcWxtM%3D%0A>
 

### Domain access
To grant access to an entire email domain:
- 
In the Domain access section, click the + button.
- 
Enter the domain you want to grant access to and click Add.
- 
Click Copy link and share as desired—anyone from that domain will need to enter their email address so we can send them an email with a secure magic link to open the portal.
​
ℹ️ Note: If an assessment was automatically created, the email address for the vendor point of contact in your vendor details <https://help.vanta.com/en/articles/11345559-adding-and-managing-vendors#h_4515067929> is added to the access list and their email domain is granted domain access by default. Click the ••• menu next to an email or domain to remove access as needed. 
 

### Using Vanta Exchange
 
Vendors use Vanta Exchange to upload the specific evidence or document you’ve requested for that security assessment and complete the questionnaire you’ve chosen to share with them. Vendors can upload evidence and submit or update questionnaire responses over time, allowing you to review progress as information becomes available.
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524296560/84aae5278ad4e3384f06e0a141bc/image.png?expires=1794967200&signature=377fed8de1c55e55d42f517358cb5a2c63a51ccda48fa65beb76ce5e7021fd12&req=diUlEst3m4RZWfMW1HO4zdi%2FTPzpq%2BWOelG8i65%2FITgotRdUpmGivi0KrAfU%0ASySZ9oA3KJY1ycgyQnU%3D%0A>
- 
Vendors can upload requested documents and complete the questionnaire in a single portal. If a requested document isn’t available, they can mark it as I don’t have this and update that status later if needed.
- 
Once a document is uploaded, the vendor can’t remove it themselves. However, they can click the Add additional button to upload the correct document, and you can then remove the previously uploaded document from the evidence list.
- 
Vendors can attach up to 5 documents directly to a specific question while answering it, either by uploading a new file or selecting a file already uploaded as evidence.
- 
If Vendor AI Answers is enabled in the assessment settings <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews>, Vanta AI can pre-fill suggested questionnaire responses based on available evidence. Vendors can review, edit, or replace these suggestions before submitting.
- 
Vendors can invite teammates from the portal. This shares the portal link, but teammates must still meet the access rules.
- 
After a security assessment is completed, vendors can still access the portal in read-only mode using a valid magic link.
- 
Logins, uploads, and key actions are recorded in the security assessment Activity tab for auditing and record-keeping.
​
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524297113/39667de325ff0d3fd5643cc0c3a3/image.png?expires=1794967200&signature=9588e28d5e17d3ab0dbf1e7f2b0be0a761a428d1b06e2cb07012e322bd1263e0&req=diUlEst3moBeWvMW1HO4zdaCsjdsL6BS7oUOTokE5tqw7%2FG3MxHCBFQSh3ks%0Ab4eI%0A>
 
 

## Commenting on questions
Commenting lets you discuss specific questionnaire questions directly in Vanta, whether you're aligning internally with your team or collaborating with your vendor.
 

### Posting vendor comments
 
[image 12]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493513771/ca60b31e65606c19783971f69680/image.png?expires=1794967200&signature=58d70fe3e3c669fd0b48cb55352da39906046356e3dcc41df1448e036d0dde33&req=diQuFcx%2FnoZYWPMW1HO4zdjgguJ3bYxJQTPQRYnTwF7H4CvAJ%2BDK%2BbZZBfCY%0Am0%2FgF45VqZDAR7B3xLg%3D%0A>
- 
Vendor comments are visible to both you and the vendor and are only available on questionnaires shown to vendors. 
- 
You can post vendor comments in Vanta, and the vendor can view and reply to them in Vanta Exchange—their replies appear in the same question thread. 
- 
You can post a vendor comment at any point during an active assessment, even before the vendor has submitted their answer.
[image 13]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493515319/787d466a795c97e6615aaedfaa3d/image.png?expires=1794967200&signature=67afcd27767e3c9b2a52aa4c9e17af42c1d8ed68f115ce676e27995ec750c5c3&req=diQuFcx%2FmIJeUPMW1HO4zQn8mZNklASunCTE3hYzwYVhn3WBURWbW2J9Bru6%0AnLCFYMPiOvplvJrVhDM%3D%0A>
 

### Posting internal comments
 
[image 14]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493506596/cdb6211135dc68f4a7a87d93cf52/image.png?expires=1794967200&signature=0201620228959c9751f0b636a19f6eee5d577374b949058835c2da3cd9af8e37&req=diQuFcx%2Bm4RWX%2FMW1HO4zfGSh6sbs3SizWMW8mc9lhEGVmCOR7X4CQtxzZM%2B%0AQqoSUMQhyU6Y5DUTqAo%3D%0A>
- 
Internal comments are only visible to your team and are available on both questionnaires hidden from vendors and questionnaires shown to vendors.
- 
You can post internal comments in Vanta, and the vendor can’t view them or reply to them.
- 
To loop in a specific teammate, use an @ mention to tag them by name or email.
 

### Filtering for comments
 
[image 15]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2493495994/e0c8b5c3c5c5b4812c816d9e4529/image.png?expires=1794967200&signature=7f371f3e6832d531ae5457039bb064e451eceb65c24a9483119bfbd3309062e8&req=diQuFc13mIhWXfMW1HO4zZfzEXhaw9%2BirzaG%2BN29yoW%2BzOjy01IVfV6NnDdy%0ApbGtCRvv4bXuzZYumHI%3D%0A>
- 
From the question list within an assessment, select With comments to filter for questions that have comments. 
- 
Each question in the list shows a total comment count.
- 
Click a question to open the comment thread for that question (also called the question thread).
 

### Notifications
- 
Comment notifications align with your notification preferences <https://help.vanta.com/en/articles/11345394-notifications-and-notification-settings> for email and Slack and appear in the notification menu in your Vanta account header.
- 
Vendors get comment notifications by email and appear in the notification menu in the Vanta Exchange header.
- 
While comments are visible as soon as they're posted, comment notifications are batched over a 30-minute window. If multiple comments are posted during that time, they'll be grouped into a single notification.
- 
If you @ mention a teammate in an internal comment, they're notified and subscribed to all subsequent replies in that question thread.
 

### Comment locking
- 
After you make an assessment recommendation and finalize the assessment, all question threads lock automatically.
- 
Neither you nor the vendor can edit or delete comments after this point. 
- 
Locked comments remain visible and are preserved as a permanent audit record alongside the assessment.
 
 

## Reviewing answers and findings
As evidence and questionnaire responses come in, you review the vendor’s answers to understand their security practices and identify any potential gaps or risks. This includes evaluating vendor responses, using Vanta AI suggestions where available to speed up assessment, and confirming answers for audit consistency. As part of this process, you can flag notable issues as findings to track follow-up or remediation before making a final recommendation.
  

### Reviewing answers
 
[image 16]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524309550/8a1099526f4b3f393852ce1abf83/image.png?expires=1794967200&signature=0c6328a9f278584635fccfc94b317e88d1e764afef66e6eae75f65a2d2d6d9c4&req=diUlEsp%2BlIRaWfMW1HO4zahwhC64qnw4K%2BSnOXMNKSBYo29i1SlrIfuL4bn%2F%0AOrxGmLCyeeTC%2BtjPWzs%3D%0A>
- 
Vendor responses become visible in Vanta as the vendor submits answers. Filter questions by Needs review to review answers as information comes in.
- 
Vanta AI will attempt to answer questions from your security questionnaires by reviewing the evidence provided to you by the vendor (if Vanta AI is enabled <https://help.vanta.com/en/articles/11345365-enabling-or-disabling-vanta-ai> in your account).
- 
For each question, you can view the vendor’s response alongside a Vanta suggested answer, helping you evaluate the response in context.
- 
If the vendor attached a document to a question, it appears both as an attachment to the individual answer and in the Evidence section of the assessment.
- 
You select a primary answer to represent the confirmed response for the question. This establishes a single, authoritative answer for review and audit purposes.
- 
Marking a question as reviewed locks in the selected primary answer, ensuring audit consistency even if the vendor later updates their response or Vanta AI regenerates suggestions. All responses remain timestamped so changes are easy to identify.
- 
If a response is unclear or raises concerns, you can flag it as a finding so it can be tracked and addressed separately.
- 
Reviewed questions can be unlocked later by marking them as unreviewed, allowing you to reassess the latest vendor and AI responses and select a new primary answer if needed.
​
[image 17]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524309829/1c775a43d1763c828104cb6171af/image.png?expires=1794967200&signature=c95c042327f51f5ba41de324f6f0a4d2f51c1cdd148637f724e72c2917b3dec1&req=diUlEsp%2BlIldUPMW1HO4zfybN162BurwEyJibxRG82FGeqnCJeypupTOSG%2Bk%0APkbl%0A>
 

### Flagging findings
 
[image 18]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524322660/63eee06fec542bbd8921d0a15f9c/image.png?expires=1794967200&signature=5b4b7c87ba0c3a0d113a1e38cdccfc634cc5a1a93c345a2d799ae01a01e5ff82&req=diUlEsp8n4dZWfMW1HO4zfKdNoHB4vb5xaQbAPvrGLtJSpjFB12yJdB54g%2FH%0A75jrNzBRYeE5HmL%2BLt4%3D%0A>
- 
Once you have your evidence for the security assessment from the vendor, you can start adding findings. Findings are used to track notable gaps, risks, or concerns identified during a vendor security assessment, typically while reviewing questionnaire answers and supporting evidence.
- 
A finding can be created from a specific questionnaire question when a response is unclear, incomplete, or indicates a potential risk. 
- 
When a finding is created from a question, relevant context is pre-filled and can be edited before saving. Each finding includes a recommended treatment plan along with any supporting details or planned next steps.
- 
Accept risk: decide to live with the risk and take no further actions
- 
Mitigate risk: identify a resolution plan to mitigate the finding
- 
Not applicable: save this as a notable finding, but do nothing
- 
Once saved, the finding is tracked in the Findings tab of the security assessment. A single question or answer can be associated with only one finding to avoid duplication.
- 
If Vanta AI highlights a response as notable, it appears under Flagged by Vanta and you can choose to turn into a finding or ignore it.
- 
Findings can also be added manually when an issue isn’t tied to a specific questionnaire question, allowing you to document risks identified through other evidence or context.
​
[image 19]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2524324169/7aef3a3b51cf56d08341eed4a0c9/image.png?expires=1794967200&signature=a3c35744e6130b2612f40088ae46f1ec01aee96a22dbc397b583d9bfcebca553&req=diUlEsp8mYBZUPMW1HO4zemKyPZbVIdLSOgzrTYO7G%2FjYxMZ0aZ79V%2FTxZrv%0Aidgm%0A>
 

### Mapping findings to risk scenarios 
 
When a finding represents a risk your organization would like to track (like a vendor control gap), you can link it to one or more risk scenarios <https://help.vanta.com/en/articles/15089313-conducting-risk-assessments#h_8a0997df5b>, creating an auditable connection between the vendor assessment and your internal risk program.
 
[image 20]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2486506642/fe6468495d2278003f4d980d0161/image.png?expires=1794967200&signature=6a9f3d29d5c31b5b5ecfffcdfaedc7ba34aa4a996f2b7ea4308f25603706ba32&req=diQvEMx%2Bm4dbW%2FMW1HO4zQNSqS21REwgfsx%2Fq2njXcWf5SsuU2reSr6tLGed%0AUAwoO4kykG4ttOlidJg%3D%0A>
 
To map a finding to a risk scenario:
- 
From within a vendor assessment, go to the Findings tab.
- 
Open the finding and go to the Linked risk scenarios tab.
- 
Click Manage links to add or remove risk scenarios. 
- 
Linked vendors will also automatically appear in the associated risk scenarios.
​
ℹ️ Note: Mapping is only available for findings created within a vendor assessment. The vendor must be in Active status—mapping isn't supported for vendors in Procurement, and is view-only for Archived vendors. 
 
Once a finding is created, you can map it to a risk scenario from the Findings tab in the assessment or from the Findings tab in the vendor profile—but only for assessment-level findings.
 

### Activity log
 
The Activity tab of the security assessment will keep a log of actions taken related to the security assessment:
- 
Accessed Vanta Exchange
- 
Completed assessment
- 
Granted access to domains
- 
Marked a recommendation
- 
Reminder sent
- 
Removed domains from access
- 
Resource marked unavailable
- 
Resource requested
- 
Resource uploaded
- 
Started assessment
- 
Submitted questionnaire through Vanta Exchange
- 
Updated automated evidence request reminder setting
- 
Updated automated evidence request setting
- 
Updated setting for sharing questionnaires with vendors
  
 

## Making an assessment recommendation
When you’re ready to finalize your security assessment, open the security assessment and click the Make recommendation button. 
 
You’ll choose from one of the following recommendation options, as well as provide the residual risk score <https://help.vanta.com/en/articles/11345560>:
 | 
Recommendation | 
Description
 | 
Approved | 
The vendor has successfully met all security, compliance, and business requirements. No additional action is needed.
 | 
Conditionally approved | 
The vendor can be used from a security standpoint, but certain risks or gaps were identified that require remediation or ongoing monitoring. Approval is granted with conditions, such as implementing specific controls, providing additional evidence, or completing remediation within a set timeframe.
 | 
Not approved | 
The vendor did not meet the organization’s security, compliance, or business standards, and the risks are deemed too high to move forward. The vendor shouldn’t be used unless significant changes are made and a new security assessment is completed.
Once you submit a recommendation, the security assessment is finalized and becomes read-only for audit and record-keeping purposes. AI answers and summaries stop regenerating, and no further edits can be made to the review.
 
 

## Making a vendor decision
Each assessment (such as Security, Privacy, or Legal) has its own recommendation. These recommendations reflect the evaluation for that specific risk area and should contribute to the overall vendor decision.
 
After completing one or more assessments for a vendor, you can make a final decision at the vendor level.
 
Learn more: Managing Vendor Assessments <https://help.vanta.com/en/articles/11345893-managing-vendor-assessments#h_b87dd91792>

## Images

- [image 01] ../../images/ux/vendors/conducting-vendor-security-assessments--01.png
- [image 02] ../../images/ux/vendors/conducting-vendor-security-assessments--02.png
- [image 03] ../../images/ux/vendors/conducting-vendor-security-assessments--03.png
- [image 04] ../../images/ux/vendors/conducting-vendor-security-assessments--01.png
- [image 05] ../../images/ux/vendors/conducting-vendor-security-assessments--05.png
- [image 06] ../../images/ux/vendors/conducting-vendor-security-assessments--06.png
- [image 07] ../../images/ux/vendors/conducting-vendor-security-assessments--07.png
- [image 08] ../../images/ux/vendors/conducting-vendor-security-assessments--08.png
- [image 09] ../../images/ux/vendors/conducting-vendor-security-assessments--09.png
- [image 10] ../../images/ux/vendors/conducting-vendor-security-assessments--10.png
- [image 11] ../../images/ux/vendors/conducting-vendor-security-assessments--11.png
- [image 12] ../../images/ux/vendors/conducting-vendor-security-assessments--12.png
- [image 13] ../../images/ux/vendors/conducting-vendor-security-assessments--13.png
- [image 14] ../../images/ux/vendors/conducting-vendor-security-assessments--14.png
- [image 15] ../../images/ux/vendors/conducting-vendor-security-assessments--15.png
- [image 16] ../../images/ux/vendors/conducting-vendor-security-assessments--16.png
- [image 17] ../../images/ux/vendors/conducting-vendor-security-assessments--17.png
- [image 18] ../../images/ux/vendors/conducting-vendor-security-assessments--18.png
- [image 19] ../../images/ux/vendors/conducting-vendor-security-assessments--19.png
- [image 20] ../../images/ux/vendors/conducting-vendor-security-assessments--20.png
