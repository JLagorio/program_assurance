# Creating Custom Frameworks

Source: https://help.vanta.com/en/articles/11345497-creating-custom-frameworks
Collection: Security Frameworks ; Security Frameworks › Frameworks
Fetched: 2026-11-17

## Article text

✅ Feature availability: This article discusses Custom Frameworks which may require an upgrade or add-on to your plan—refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details. You can use the Vanta Agent to import custom frameworks if AI is enabled <https://help.vanta.com/en/articles/11345365-enabling-or-disabling-vanta-ai> and you have a current plan.
 
In addition to Vanta's supported frameworks <https://www.vanta.com/products/additional-frameworks>, you can use custom frameworks to build and monitor a compliance program tailored to your organization, such as a framework specific to your industry or region, or an internally maintained program.
 
For a common-control-style framework (CCF) that helps organize requirements across multiple standards, see our common controls <https://help.vanta.com/en/articles/16894224-managing-common-controls> feature.
 
⚙️ User Permissions: Admins, Editors, and Audit Limited Editors can manage custom frameworks. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Creating custom frameworks with the Vanta Agent
The Vanta Agent can help create custom frameworks. Give the agent a name, description, and any files or information about your framework's structure, and it proposes the sections for you to review—all in the same guided conversation.
 
To create a custom framework with the Vanta Agent:
- 
Open the Vanta Agent.
- 
Ask the agent to help create a custom framework. For example: "Help me create a custom framework."
- 
Chat with the agent to align on your framework details and framework sections.
- 
You provide information directly in the chat or upload framework files for the agent to scan.
- 
You can upload up to 30 files at once, with a 50 MB total limit per upload.
- 
When uploading frameworks, CSV, XLS, or XLSX files work best, up to 10 MB each.
- 
See supported framework fields for more information on what to include.
- 
Review the framework the agent proposes, then confirm when you're ready to create it.
- 
The agent proposes framework details based on your file and any additional information you provide
- 
The agent proposes the framework sections for you to review in a user-friendly table view.
- 
You can chat with the agent to correct or adjust any proposed information before saving.
The import flow is for creating new custom frameworks, not for overwriting existing ones.
 
💡 Tip: You can upload custom controls, custom frameworks, and custom policies in the same chat—ask the Vanta Agent: "Help me import my compliance program." Learn more: Vanta Agent Guided Flows <https://help.vanta.com/en/articles/16055560-vanta-agent-guided-flows>
 
 

## Creating a custom framework manually
To add a custom framework:
- 
Go to the Frameworks page and click Create framework.
- 
Enter the framework details.
- 
Click Create sections.
- 
Upload a spreadsheet of your framework sections.
- 
You can download a template from the upload modal to help format your file correctly.
- 
See supported framework fields for the field requirements for framework sections.
- 
Review your file for any flagged rows before importing.
- 
A common issue is a Control ID that doesn’t yet exist in Vanta. Create your custom controls before importing your framework if you want to map controls to framework sections during the import.
- 
You can also leave Control IDs blank and map controls to the framework later.
- 
Select Import to create the framework and its sections. 
- 
If your file includes valid Control IDs, Vanta also maps those controls to the corresponding sections.
​
 

## Supported framework fields
The fields below are used to create a custom framework, whether manually or with the Vanta Agent: 
- 
If you're using the Vanta Agent, your file doesn't need to match these requirements exactly—the agent can interpret your file's structure and propose values.
- 
If you're creating a framework manually, your file should meet these requirements to import successfully.
​

### Framework details
 
These are the high-level details about your framework:
 | 
Field/Column | 
Requirements
 | 
Framework Name | 
Required—the name of your custom framework.
 | 
Framework Description | 
Optional—a description of your custom framework.
 | 
Short Name | 
Optional—an abbreviated name for the framework (used where space is limited).
 | 
Parent Section Label | 
Optional—the label to use in Vanta when referring to parent sections in your framework. If nothing is entered, it uses the default label Requirement Category.
 | 
Child Section Label | 
Optional—the label to use in Vanta when referring to child sections in your framework. If nothing is entered, it uses the default label Requirement.
💡 Tip: Parent and child section labels control what Vanta calls the two levels of your framework's hierarchy. By default, these are labeled Requirement Category and Requirement, but you can rename them to match your framework's own terms. This only changes what the levels are called in Vanta—it doesn't change your framework's structure.
 

### Framework sections
 
Each row in your uploaded file represents one section of your framework, either a parent section or child section. Your file needs a column for every field below except Control IDs, but some cells can be left blank.
 | 
Field/Column | 
Requirements
 | 
Section ID | 
Required—the unique ID of the section you're creating. Each section needs its own unique ID. Matching is exact and case-sensitive.
 | 
Section Name | 
Required—the name of the section you're creating.
 | 
Section Description | 
Can be blank—the requirement details for the section.
 | 
Section Type | 
Can be blank—whether the section is a parent (P) or child (C) section. Blank rows default to child. Mark at least one section P to create a parent layer. Parent sections can't have their own parent.
 | 
Parent Section ID | 
Can be blank—the Section ID of the parent this section sits under. Leave empty for parent sections. Must exactly match another Section ID in the file.
 | 
Control IDs | 
Can be blank—a comma-delimited list of existing control IDs to map to this section. Can be left empty and mapped later.
 
 

## Control mapping
If you import controls with the Vanta Agent and your control file references a framework that isn't enabled in your account, the agent can offer to create it as a custom framework and map your imported controls to it. 
 
Otherwise, you can map controls to framework requirements at any time—as well as map related tests, documents, and policies.
 
💡 Tip: To add more controls or change mappings after you create your framework, see: Importing Custom Controls <https://help.vanta.com/en/articles/11345435-importing-custom-controls>

## Images

- none
