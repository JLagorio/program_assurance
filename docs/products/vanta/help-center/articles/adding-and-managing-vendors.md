# Adding and Managing Vendors

Source: https://help.vanta.com/en/articles/11345559-adding-and-managing-vendors
Collection: Risk, TPRM & AI Gov ; Risk, TPRM & AI Gov › Third-Party Risk Management
Fetched: 2026-11-17

## Article text

✅ Feature availability: Some features (like vendor object assignments and vendor customization) may require a TPRM add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Vendor management is a part of Third Party Risk Management <https://help.vanta.com/en/articles/11345557> (TPRM) in Vanta. The Vendors page allows you to add, edit, and manage vendors in one place. A well-maintained vendor inventory helps you stay audit-ready and confident in your third-party security posture. By consistently tracking vendor details, you create a single source of truth that supports vendor assessments (such as security assessments) and ongoing risk monitoring as your vendor ecosystem grows.
 
⚙️ User permissions: Editors and Admins can manage all vendors, vendor details, and vendor settings. Collaborators assigned as a Business Owner or Assessment Owner on a vendor can edit most vendor details, with some Editor and Admin only exceptions. Learn more <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>
 
 

## Adding vendors
You can add vendors to your vendor list in several ways, depending on where the information is coming from. All vendors under the scope of your audit should be included. If any vendors aren’t automatically populated here, you’ll want to manually add them.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2177284888/aab840a1b419656e8a67370270f9/image.png?expires=1794967200&signature=72d449f600206320aac9c07df6529b9bafd71966197a2cce422842ebdd2d27f1&req=diEgEct2mYlXUfMW1HO4zfb9WGrveh2OhwGRhFvZormxNQip59PaiPQCIoJJ%0AKYQQdu%2FpdLF1n8SfBrc%3D%0A>
 

### Connected integrations
 
Vendors that you’ve connected to on the Integrations page of your account are automatically added to your vendor list.
 

### Manually adding a vendor
 
Use this method when you want to add a small number of vendors individually.
 
To manually add a vendor:
- 
On the Vendors page, click the Add vendor button.
- 
Enter the vendor’s name, status, and website.
- 
Click Add vendor from the modal to save the vendor.
- 
Open the vendor from the vendor list, then go to the About tab to add additional vendor details.
 

### Importing via spreadsheet
 
Use this method when you need to add many vendors at once.
 
To import vendors using a spreadsheet:
- 
On the Vendors page next to the Add vendor button, click the down arrow ▼ and select Import vendor.
- 
After you review instructions on the Import vendors page, download the CSV template and prepare the file. You can import 100 vendors at a time.
- 
When you’re ready, upload a CSV file containing your vendor details.
- 
Map the uploaded columns in your spreadsheet to ensure they align with the template columns in Vanta, then click the Next button to continue.
- 
Review your import, especially rows with issues, then click the Import button.
 

### Vendor discovery and procurement
 
Vanta surfaces discovered vendors based on activity observed through your connected identity providers (IdP) so you can decide whether they should be added to your vendor list, added to procurement, ignored, or rejected.
 
Learn more: Managing Vendor Procurement <https://help.vanta.com/en/articles/13688317>
 
 

## Managing your vendor list
Your vendor list is a centralized inventory of the vendors your organization works with. This was previously called the Managed vendors page. Each vendor has a status:
 | 
Status (or state) | 
Description
 | 
Active | 
Vendors your team has approved for use within your organization. Keep their vendor details up to date and stay on top of vendor assessments <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews> (like security assessments).
 | 
Procurement | 
Vendors your team is evaluating for use within your organization. Complete their vendor details and conduct a vendor assessment <https://help.vanta.com/en/articles/11345550-conducting-vendor-security-reviews> (like a security assessment).
 | 
Archived | 
Vendors your team is no longer using within your organization. It’s important to keep a record of vendors you’ve previously used.
 

### Filtering your vendor list
 
On the Vendors page, use the tools above the table to search, filter, and sort your vendor list based on the vendor details available.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2177292923/a2aafcc8f04e5fe3d31d3f5f945e/image.png?expires=1794967200&signature=ec4800bd35b1296c4d94d66c602c606dcbee6d85ce8580fff901213b5db401cf&req=diEgEct3n4hdWvMW1HO4zTH4nlyf9539lGppbexNr%2B26FOIyr8EWaH6lQzf%2F%0AjUdzrYLUl3PndgBqRgM%3D%0A>
 
Click the controls icon at the top-right of the vendor list to customize the table view—you can choose what columns to display in the table, or change the density size of the table rows.
 

### Merging duplicate vendors
 
Use vendor merging to combine duplicate vendor records. The vendor you choose to merge into becomes the primary vendor record moving forward, whereas the vendor you selected to merge is removed from the vendor list.
 
⚠️ Note: Merging vendors is permanent. Once merged, vendors can't be unmerged. To separate them again, you'll need to create a new vendor record.
 
To merge two vendors:
- 
On the Vendors page, click the options menu ••• next to the vendor you’d like to merge. The vendor you select in this step is the one that will be removed.
- 
Select the Merge with another vendor option from the menu. 
- 
In the pop-up modal, choose the vendor you want to merge into from the dropdown list. The vendor you select in this step is the one that will become the primary vendor record moving forward.
- 
Choose the information you'd like to preserve for each vendor:
- 
The default setting is to preserve assessments, evidence, documents, and vendor findings from both vendors. You need to select the remaining info you would like to preserve for each vendor.
- 
The following vendor fields do not transfer: Password configuration details, Services provided, and Additional notes. To retain this info, manually copy it before completing the merge.
- 
Select Confirm merge to complete the process.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2362376662/b23f5b23e0bdf4fc150455e3504c/image.png?expires=1794967200&signature=70d85516a2576244953574866d196225aeac609e60096b03ca081dc4431496bb&req=diMhFMp5m4dZW%2FMW1HO4zbT86VNMIzr8AluTCxdMC%2Fr56XI30bfYXea67Xxm%0A%2BJAAWOcP3JYZRDR1mR0%3D%0A>
 

### Archiving vendors
 
Use the Archived status to remove vendors you no longer work with, while still keeping the vendor information in your account for reference. While you can restore an archived vendor if needed, you can’t restore deleted vendors.
 
To archive a vendor:
- 
On the Vendors page, click the options menu ••• next to the vendor you’d like to archive.
- 
Select the Archive option from the menu.
- 
Read the notice, then click the Archive vendor button. 
Archived vendors are read-only until you unarchive them. To unarchive a vendor, filter the vendor list by Archived status and select Unarchive from the options menu ••• next to the vendor. You can do this at any time.
 
 

## Updating vendor details
Each vendor in your vendor list has a dedicated profile that centralizes all the information about a vendor. You’ll find the vendor details in the About tab of vendor profiles.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2177314363/9cb725ca1ea68fc83cfce4e931b2/image.png?expires=1794967200&signature=426fc20d6e4613f1808b1b87e67e331d311afa4a57c8b1a7547ecfcfd8bf5537&req=diEgEcp%2FmYJZWvMW1HO4zQslPYBVvGx5IhN4NvwxurvLunMGMeRqIhUNDfRT%0A005TfjC9eyz8fdnlOMQ%3D%0A>
 

### Navigating vendor profiles
 
On the Vendors page, click a vendor from the vendor list and browse the tabs available within the vendor profile:
 | 
Tab | 
Description
 | 
Overview | 
Tips for completing the vendor’s profile and the most recent assessments and findings.
 | 
Assessments | 
A complete record of all current and past vendor assessments <https://help.vanta.com/en/articles/11345893-managing-vendor-security-reviews>.
 | 
Findings | 
Findings from vendor assessments (which can be mapped to risk scenarios <https://help.vanta.com/en/articles/15089313-conducting-risk-assessments#h_8a0997df5b>), plus a place to add and manage vendor-level findings.
 | 
Monitoring | 
Any issues Vanta flagged for vendors with continuous risk monitoring <https://help.vanta.com/en/articles/12524282> available. (Only present for vendors with continuous monitoring.)
 | 
Evidence | 
A record of all prior evidence provided in assessments and the ability to add new evidence.
 | 
Linked apps | 
Any discovered vendors <https://help.vanta.com/en/articles/13688317-managing-vendor-procurement#h_b03436572f> that were linked to the vendor.
 | 
Subprocessors | 
Any subprocessors used by the vendor that Vanta was able to locate in public trust centers. (Only present for vendors with public trust centers available.)
 | 
About | 
All the vendor details available to view or edit about a vendor.
 | 
Intake | 
The vendor intake form <https://help.vanta.com/en/articles/13688317-managing-vendor-procurement#h_6c85434ee4> submission that kicked off procurement. (Only present if the vendor was added via the vendor intake form.)
The tabs you see depend on whether the feature is available on your plan and whether the tab is relevant for that specific vendor.
 

### Standard vendor fields
 
Go to the About tab within a vendor profile to edit vendor details. Some standard fields we recommend prioritizing as you get started:
- 
Vendor status (or state): Choose from Active, Archived, or Procurement.
- 
Inherent risk score: Level of risk a vendor or process poses before any mitigating controls are applied, based on your inherent risk rubric <https://help.vanta.com/en/articles/11345560>.
- 
Category: Type of product or service the vendor offers.
- 
Point of contact: The name and email address for your point of contact with the vendor.
- 
Security owner: User responsible for overseeing the security assessment in Vanta.
- 
Business owner: User responsible for day-to-day management of the tool outside of Vanta.
 
 

## Vendor customization
In addition to the standard vendor fields in Vanta, you can add custom vendor fields to track more information in your vendor details.
 
You can also add custom vendor categories. Custom categories appear as options in the category field alongside Vanta’s built-in categories. You can include them in inherent risk scoring, and use them to filter your vendor list and vendor reports.
 

### Custom fields
 
To manage custom vendor fields:
- 
Go to Settings.
- 
In the page menu, scroll to Features  and select Vendors > Vendor customization.
- 
In the Custom vendor fields section:
- 
Add, edit, reorder, or delete custom fields.
- 
Custom field settings apply to all vendors. 
- 
Supported field types: Date, Multi-select, Number, or Text.
- 
Go to the About tab in a vendor profile and scroll to the Custom fields section to fill them out.
 

### Custom categories
 
To manage custom vendor categories:
- 
Go to Settings.
- 
In the page menu, scroll to Features and select Vendors > Vendor customization.
- 
In the Custom categories section:
- 
Add, edit, or delete the categories you want to use.
- 
You can add up to 100 custom categories.
- 
Category names must be unique—a name cannot match a built-in or custom category.
- 
When you delete a category that vendors use, choose whether to move those vendors to a replacement category or clear their category.
- 
Go to the About tab in a vendor profile to update the Category field.
- 
Map your custom categories to risk attributes in your inherent risk scoring <https://help.vanta.com/en/articles/11345560-configuring-inherent-risk-scoring> settings.
​
ℹ️ Note: Deleting a category that vendors use can change their inherent risk scores. Learn more <https://help.vanta.com/en/articles/11345560-configuring-inherent-risk-scoring>

## Images

- [image 01] ../../images/ux/vendors/adding-and-managing-vendors--01.png
- [image 02] ../../images/ux/vendors/adding-and-managing-vendors--02.png
- [image 03] ../../images/ux/vendors/adding-and-managing-vendors--03.png
- [image 04] ../../images/ux/vendors/adding-and-managing-vendors--04.png
