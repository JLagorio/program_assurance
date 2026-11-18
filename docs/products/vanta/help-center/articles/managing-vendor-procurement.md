# Managing Vendor Procurement

Source: https://help.vanta.com/en/articles/13688317-managing-vendor-procurement
Collection: Risk, TPRM & AI Gov ; Risk, TPRM & AI Gov › Third-Party Risk Management
Fetched: 2026-11-17

## Article text

✅ Feature availability: Some features (like procurement request integrations) may require a TPRM add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Vendor procurement is a part of Third Party Risk Management <https://help.vanta.com/en/articles/11345557> in Vanta. It brings together vendors discovered by Vanta, requested by your team using an intake form, or created via procurement integrations so you can conduct comprehensive vendor assessments (such as a security assessment) before approving vendors for use.
 
⚙️ User permissions: Editors and Admins can update vendor status, access the Discovery tab on the Vendors page, and manage the vendor intake form. Learn more <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>
 
 

## Adding vendors to procurement
On the Vendors page, use the Procurement status to track vendors requiring assessments <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews> (such as a security assessment) for procurement. You can add vendors to procurement in the following ways:
- 
Manually add a vendor <https://help.vanta.com/en/articles/11345559> to your vendor list, or update the status of an existing vendor.
- 
Review discovered vendors and move them to procurement as desired.
- 
Set up a vendor intake form to collect procurement requests from your team.
- 
Use a procurement integration to automatically add vendors to procurement.
 
 

## Vendor discovery
On the Vendors page, click the Discovery tab. Vanta surfaces discovered vendors based on activity observed through your connected identity providers (IdP) so you can decide whether they should be added to procurement. 
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2058702038/0858b9a48725dc255753c9745104/image.png?expires=1794967200&signature=9deab73601b273d5eaa94d238756d2ef96bf3264c44cd6c6b71ff4331bd6268b&req=diAiHs5%2Bn4FcUfMW1HO4zY8RYrMqlJ0YHnDzHGgO8DAjPZGx1z3XiyVxdlLk%0Aa%2FkCGx2EzqnLWiFVQt4%3D%0A>
 

### Discovered vendors
 
If you have connected any IdPs on the Integrations page, we can let you know when employees try to authenticate using an SSO login option. Filter discovered vendors by the Needs review status (also called state) and select one of the following actions:
 | 
Action | 
Description
 | 
Move to managed vendor | 
Add the vendor to your vendor list in the Active status.
 | 
Move to procurement | 
Add the vendor to your vendor list in the Procurement status.
 | 
Ignore | 
Keep the vendor in the discovery tab in the Ignored status—you can undo this at any time.
 | 
Reject | 
Keep the vendor in the discovery tab in the Rejected status—you can undo this at any time.
 | 
Export list of accounts | 
Export a list of the users who tried to log in using an IdP connected to Vanta.
 

### Reappearing vendors
 
When a vendor reappears in the Discovery tab, review it again and decide whether to add it to your vendor list or ignore it—this helps ensure that vendors actively used by your organization don’t go unnoticed over time. 
 
Vendors may reappear as Needs review when:
- 
Employees continue to authenticate to the vendor using a connected IdP
- 
New authentication activity is detected after a period of inactivity
- 
Additional users begin accessing the same vendor.
It’s not possible to delete a vendor from the Discovery tab. As a workaround, you could add the vendor to the Active tab.
 
 

## Vendor intake form
You can set up an intake form to collect vendor procurement requests directly in Vanta. When someone submits the form, we create the vendor in your vendor list in the Procurement status. Only one intake form is supported per workspace.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2058601665/837099683358192cda62be4e1d26/image.png?expires=1794967200&signature=62b64685c811ace94c5fddc6a2a73ecd1377819186c776ad553a9dc9ac452253&req=diAiHs9%2BnIdZXPMW1HO4zSP9P9oScsxEW%2FX3aE9dq3aFzZLizrCe9j6o7jeT%0A0ohh1jJx1gXsotAi3%2Fg%3D%0A>
 

### Editing the intake form
 
Customize the form to choose the questions that collect basic information about a vendor. The form supports standard vendor fields and any custom vendor fields configured for your organization. Answers to questions mapped to a vendor field fill in that field on the vendor profile.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2058692100/3a282a8fdc214e8f59ced9906cbe/image.png?expires=1794967200&signature=3657afd3af3a1d517d26d3f28426c2a8acffedb0992643bd4dbff9364f7b97e4&req=diAiHs93n4BfWfMW1HO4zU3pGCHha5xlnf6IgNhzV3o7GMQAay94zsZTaMZc%0AKmGG8nCPRemnveQOXR8%3D%0A>
 
To edit the vendor intake form:
- 
Go to Settings.
- 
In the page menu, scroll to Features and select Vendors > Intake form.
- 
Click Edit form.
- 
In the form editor:
- 
Customize the text in Form instructions, or leave it blank.
- 
Customize the text for the default questions (the name and website questions cannot be deleted).
- 
Use the Required toggle to make questions required or optional.
- 
Customize the text in Terms and acknowledgments, or use the Visible toggle to turn off this section.
- 
Add instructions and select evidence to request in the Upload documents section (you cannot turn off this section).
- 
To add a question, click the + icon:
- 
Supported question types: Short text, Long text, Number, Date, Single-select, or Multi-select.
- 
To map a question to a vendor field, click the + icon and select Map to vendor field:
- 
Select a vendor field from the drop-down at the top of the question. Each vendor field can map to only one question.
- 
You can map to built-in and custom vendor fields.
- 
To map to a risk section, select it from the Risk sections group. Risk sections are the groups of risk attributes in your inherent risk rubric. Each risk section can also map to only one question.
- 
Click Save changes.
- 
To see how it looks, click Preview form.
- 
To make it live, go to the Intake form tab and turn on Enable intake form.
​
💡 Tip: Map a question to the Category field so submitters can select from your built-in and custom categories. We use the category to help auto-score the vendor’s inherent risk. Learn more <https://help.vanta.com/en/articles/11345560-configuring-inherent-risk-scoring>
 

### Sharing the intake form

### Sharing with employees
Any logged-in user with the Employee role <https://help.vanta.com/en/articles/11345385-managing-user-roles> can access the Vendor intake form in their account navigation. To share with employees:
- 
At the top of the Vendors page, click Edit intake form.
- 
Next to Employee form URL, click Copy link.

### Sharing externally
You can share the intake form with external users by adding email addresses or domains to the access list. To share with external users:
- 
At the top of the Vendors page next to the Edit intake form button.
- 
In the Authentication section, add any email addresses or domains you would like to grant access to.
- 
Next to External form URL, click Copy link.
 

### Reviewing form submissions
- 
When someone submits the form, a vendor record is created in your vendor list <https://help.vanta.com/en/articles/11345559-adding-and-managing-vendors> in the Procurement status.
- 
Based on how the submitter answers the intake form questions, Vanta automatically assigns an inherent risk score to the vendor using your inherent risk rubric <https://help.vanta.com/en/articles/11345560-configuring-inherent-risk-scoring>.
- 
If the security owner email field was mapped, they'll get a notification about the new request. 
- 
If the business owner email field was mapped, they'll get notifications on the status of the request.
 
 

## Procurement integrations
You can connect an integration in Vanta to automatically add vendors in procurement to your vendor list:
- 
Task tracker integrations <https://help.vanta.com/en/articles/11345558-task-tracker-third-party-risk-management>: Syncs with procurement-related tickets from tools like Jira or Asana.
- 
Zip integration <https://help.vanta.com/en/articles/11345554-vanta-zip-integration-third-party-risk-management>: Syncs with Zip procurement requests.

## Images

- [image 01] ../../images/ux/vendors/managing-vendor-procurement--01.png
- [image 02] ../../images/ux/settings/managing-vendor-procurement--02.png
- [image 03] ../../images/ux/vendors/managing-vendor-procurement--03.png
