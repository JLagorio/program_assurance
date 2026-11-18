# Importing Custom Controls

Source: https://help.vanta.com/en/articles/11345435-importing-custom-controls
Collection: Security Frameworks ; Security Frameworks › Controls
Fetched: 2026-11-17

## Article text

✅ Feature availability: You can create custom controls on any current plan. Some features (like custom fields) may require an upgrade or add-on to your plan—refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details. You can use the Vanta Agent to import custom controls if AI is enabled <https://help.vanta.com/en/articles/11345365-enabling-or-disabling-vanta-ai> and you have a current plan.
 
While Vanta offers a comprehensive set of prebuilt controls mapped to frameworks like SOC 2, ISO 27001, and HIPAA, your company might have unique workflows, tools, or regulatory obligations that require more tailored controls. Custom controls let you document security and compliance requirements that aren’t covered by one of Vanta's default controls, whether you already have them defined or you're creating them from scratch. 
 
You can add custom controls with the Vanta Agent, in bulk, or one at a time. When you add a custom control, you’ll need to review and add the right framework, test, document, and policy mappings so you can track it as part of your program.
 
⚙️ User permissions: Admins, Editors, and Audit Limited Editors can manage custom controls. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Importing custom controls with the Vanta Agent
You can ask the Vanta Agent to help import your controls. Upload your files, and the agent creates custom controls, assigns owners, and maps them to the frameworks in your file. If enabled on your plan, it can also create custom fields <https://help.vanta.com/en/articles/11345373-controls-page> and custom frameworks <https://help.vanta.com/en/articles/11345497-creating-custom-frameworks>. Then you can ask the agent to suggest mappings to tests, documents, and policies.
 
To import your controls with the Vanta Agent:
- 
Open the Vanta Agent control import flow:
- 
Start a new chat and ask the agent: "Help me import my custom controls."
- 
From the Controls page, click Add control > Via import > Use Vanta Agent.
- 
Upload your control files:
- 
You can upload up to 30 files at once, with a 50 MB total limit per upload.
- 
When uploading controls, CSV, XLS, or XLSX files work best, up to 10 MB each.
- 
Review and confirm control details:
- 
The agent extracts each control in a user-friendly table so you can review control details like the ID, name, description, domain, owner, and framework mappings.
- 
Chat with the agent to update control details before the controls are created.
- 
Choose whether to replace Vanta default controls or add your custom controls alongside them:
- 
For each Vanta framework your controls map to, the agent asks if you want to replace its default controls. 
- 
Deactivating a default control removes it from every framework it's mapped to.
- 
The agent doesn't deactivate default controls you've edited—you can deactivate those yourself.
- 
You can reactivate deactivated default controls at any time.
- 
Ask the agent to suggest mappings for your imported controls:
- 
The agent can suggest which tests and documents each control can be mapped to.
- 
It can also suggest mappings between your policies and your controls.
- 
Remove suggestions you don't want, or ask the agent to make changes. The agent maps the suggestions you keep.
The import flow is for creating new custom controls, not for overwriting existing ones. After importing, you can ask the agent to help you manage custom controls to update control mappings, owners, or other details.
 
💡 Tip: You can upload custom controls, custom frameworks, and custom policies in the same chat—ask the Vanta Agent: "Help me import my compliance program." Learn more: Vanta Agent Guided Flows <https://help.vanta.com/en/articles/16055560-vanta-agent-guided-flows>
 
 

## Bulk uploading custom controls
If you have several existing controls to bring in at once, you can upload a CSV or Excel file from the Controls page. You can create new controls or update existing ones, and map your file's columns to Vanta's fields.
 
To upload your controls in bulk:
- 
From the Controls page, click Add control > Via import > Use template.
- 
Choose Create new controls or Update existing controls.
- 
Click Download template to get a CSV file to use as a starting point.
- 
Upload your file.
- 
Map your file's columns to Vanta's fields.
- 
Review and fix any flagged rows.
- 
Finish the import to create or update the controls.
​
ℹ️ Note: If your file includes custom fields <https://help.vanta.com/en/articles/11345373-controls-page>, create those custom fields in Vanta before importing. Once created, each custom field appears as a column in the downloadable control import template.
​
 

## Creating a custom control
If you're documenting a requirement from scratch, or only have one custom control to add, create a custom control directly from the Controls page.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2743351059/822d093fc256820331e13b338038/image.png?expires=1794967200&signature=2aac03029acc349bf25dee866a017f62570eaaf04e4c54d4eedda38653309eb6&req=dicjFcp7nIFaUPMW1HO4zcst6eXjeDT6zqblOf3ap2PR3CX9dMVo4pzaRkEX%0Af5pUeyNHJMhlrdEz5N0%3D%0A>
 
To add a custom control manually:
- 
From the Controls page, click Add control and select Add custom control.
- 
In the New control modal, fill in the control details:
- 
Required: Description, Domain, Control ID, Effective Date (defaults to today)
- 
Optional: Framework Code, Control Name, Implementation Details
- 
Select Add control.
- 
From the Controls page:
- 
Assign an Owner.
- 
Fill out custom field <https://help.vanta.com/en/articles/11345373-controls-page> values as needed.​
​
💡 Tip: Vanta AI can suggest a domain, control ID, control name, and implementation details—just enter a description and click Generate details.
 
 

## Supported control fields
This table lists supported control fields that can be populated when adding custom controls with the Vanta Agent or when bulk uploading:
- 
If you’re using the Vanta Agent, your file doesn’t need to be perfectly formatted up front—the agent reviews your file, flags missing or unclear details, and asks you to confirm or correct the values before creating the controls.
- 
If you’re bulk uploading controls, your file should meet these requirements to import successfully.
 | 
Field/Column | 
Requirements
 | 
Control ID | 
Required—a unique identifier for the control. Matching is exact and case-sensitive.
 | 
Control Description | 
Required—details of what the control covers.
 | 
Effective Date | 
Required—the date the control goes into effect. Defaults to the date the control is created or imported.
 | 
Control Name | 
Optional—a short name for the control. If left blank, the Control ID is used as the name.
 | 
Domain | 
Optional—the category used to organize the control. Must match one of Vanta's supported domain values.
 | 
Owner | 
Optional—the person or team responsible for the control. Must match a user or team added to your Vanta workspace.
 | 
Framework Code | 
Optional—a comma-delimited list of the framework sections or requirements the control maps to. Each one must match a framework enabled in your Vanta account and a valid section or requirement within that framework. Can be left empty and mapped later.
 | 
Implementation Details | 
Optional—how your team carries out the control, like who runs it, which tools they use, and what record it leaves. Supports markdown formatting.
💡 Tip: Controls also support custom fields <https://help.vanta.com/en/articles/11345373-controls-page> for capturing information specific to your compliance program.
 
 

## Managing custom controls
After you create a custom control, it's added to the Controls page where you can assign owners to controls, manage control mappings, and edit control details at any time.
 
💡 Tip: Ask the Vanta Agent to help manage your custom controls. It can suggest evidence for a control, update owners and other control details, and update control mappings.
 

### Assigning owners
 
To assign owners to controls:
- 
From the Controls page, click directly into the Owner column for the control.
- 
Search for and select the person or team you want to assign.
 

### Adding implementation details
 
Implementation details is a field on every control where you record how your team carries out the control, like who runs it, which tools they use, and what record it leaves. You can add details manually, draft them with the Vanta Agent or a custom agent, or update many controls at once by importing a spreadsheet.
 
📖 Learn more: Control Implementation Details <https://help.vanta.com/en/articles/17602559-control-implementation-details>
 

### Mapping tests
 
To map controls to tests:
- 
From the Controls page, open the control.
- 
In the Mapped elements tab, scroll to Tests.
- 
Select the + button to add a test, or use the remove action to remove an existing one.
- 
Search the full list of tests, or turn on Suggest by Vanta AI to review AI-suggested tests.
- 
Select the test you want to link, then click Add.
 

### Mapping documents
 
To map controls to documents:
- 
From the Controls page, open the control.
- 
In the Mapped elements tab, scroll to Documents.
- 
Select the + button to add a document, or use the remove action to remove an existing one.
- 
Search the full list of documents, or turn on Suggest by Vanta AI to review AI-suggested documents.
- 
Select the document you want to link, then click Add. You can also upload a new document by selecting New document.
 

### Mapping policies
 
Controls can be mapped to policies to show which policies support or document the control.
 
To map controls to policies:
- 
From the Policies page, select the policy.
- 
Click the Mapped elements tab.
- 
Click Map control.
- 
Search for the control, or review AI-suggested controls if available.
- 
Select the control you want to link, then click Add.
 

### Mapping frameworks
 
The same control can be mapped to multiple frameworks and requirements.
 
To map controls to frameworks:
- 
From the Controls page, open the control.
- 
In the Mapped elements tab, scroll to Frameworks.
- 
Select the + button to add a framework mapping, or use the remove action to remove an existing one.
- 
Select the framework using the dropdown, then use the search bar to find the requirement by code, name, or description.
- 
Select the appropriate requirement, then click Add.
 

### Mapping risk scenarios
 
To map controls to risk scenarios:
- 
From the Controls page, open the control.
- 
In the Mapped elements tab, scroll to Risk scenarios.
- 
Select the + button to add a risk scenario, or use the remove action to remove an existing one.
- 
Search the full list of risk scenarios.
- 
Select the risk you want to link to, then click Add.
 

### Linked issues
 
Issues linked to a control appear in the control’s Mapped elements tab, helping you see related gaps, remediation work, or audit findings. To link a control to an issue, open the issue and add the control from the issue’s mapped elements area.
 

### Deactivating or deleting custom controls
- 
To deactivate: Open the control > click the ••• menu and select Deactivate > click Deactivate.
- 
To delete: Open the control > click the ••• menu and select Delete > click Delete.
​
⚠️ Note: Deactivating and deleting are different actions. Deactivating a control removes it from your security program and removes its framework and monitor mappings, but a deactivated control can be restored later. Deleting a custom control permanently removes it from your program and related frameworks, and this action can't be undone.

## Images

- [image 01] ../../images/ux/controls/importing-custom-controls--01.png
