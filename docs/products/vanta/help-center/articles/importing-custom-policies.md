# Importing Custom Policies

Source: https://help.vanta.com/en/articles/11345492-importing-custom-policies
Collection: Policies
Fetched: 2026-11-17

## Article text

✅ Feature availability: You can create custom policies on any current plan. Some features (like bulk uploading) may require an upgrade or add-on to your plan—refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details. You can use the Vanta Agent to import custom controls if AI is enabled <https://help.vanta.com/en/articles/11345365-enabling-or-disabling-vanta-ai> and you have a current plan.
 
While Vanta offers a comprehensive set of prebuilt policies mapped to frameworks like SOC 2, ISO 27001, and HIPAA, your company might have unique workflows, tools, or regulatory obligations that require more tailored guidance. Custom policies let you document security practices that don't fit neatly into one of Vanta's default policy templates, whether you already have the policy or you're creating it from scratch. 
 
You can import your custom policies with the Vanta Agent, upload in bulk, or add one at a time as needed. When you add a custom policy, Vanta creates policy approval and employee acceptance tests, but you’ll still need to map it to the right controls and make sure the right employees are assigned to accept it.
 
⚙️ User permissions: Admins, Editors, and Audit Limited Editors can manage custom policies. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Importing custom policies with the Vanta Agent
You can ask the Vanta Agent to help import your policies. Upload your files, and the agent creates custom policies and suggests control mappings for you to review.
 
To import your policies with the Vanta Agent:
- 
Open the Vanta Agent.
- 
Ask the agent to help import your policies. For example: “Help me import my custom policies.”
- 
Upload your policy files:
- 
You can upload up to 30 files at once, with a 50 MB total limit per upload.
- 
When uploading policies, PDF or DOCX files are required, up to 10 MB each. 
- 
Review the policy details for each policy being imported, then confirm when you’re ready to create the custom policies:
- 
The agent extracts policy details for you to review in a user-friendly table view.
- 
You can chat with the agent to update policy details like the title, description, approval information, and language before the policies are created.
- 
Review the suggested control mappings.
The import flow is for creating new custom policies, not for overwriting existing ones.
 
💡 Tip: You can upload custom controls, custom frameworks, and custom policies in the same chat—ask the Vanta Agent: "Help me import my compliance program." Learn more: Vanta Agent Guided Flows <https://help.vanta.com/en/articles/16055560-vanta-agent-guided-flows>
 
 

## Bulk uploading custom policies
If you have several existing policies to bring in at once, upload them directly from the Policies page. Vanta AI extracts key details from each file so you can review them and create custom policies faster.
 
To upload your policies in bulk:
- 
From the Policies page, click Add policy and select Import policies from the menu.
- 
Select the files you want to upload. You can import up to 30 files (PDF or DOCX, up to 10 MB each).
- 
Select Continue. Vanta AI extracts details for each policy. 
- 
Review each imported policy to verify the extracted details and add any missing information.
- 
Add approval dates and approvers, if applicable. If an approver is listed, you’ll need to add an approval date.
- 
Select Continue to create the custom policies.
​
ℹ️ Note: Vanta AI may find duplicate policy titles that already exist in your account. To continue, you can: (1) remove the file from the import and update the existing policy instead, (2) rename the imported policy if it’s meant to be a separate custom policy, or (3) delete the duplicate from your existing policy list in a new tab, then refresh the import page.
 
 

## Creating a custom policy manually
If the policy library doesn't have a template for what you need, or you'd rather use your own, create a custom policy directly from the Policies page. You'll enter the policy details yourself, then bring in the content one of three ways.
 
To add a custom policy manually:
- 
From the Policies page, click Add policy and select Create new policy from the menu.
- 
Add a policy title and description, then click Add.
- 
Choose how to bring in the policy content:
- 
Draft it in Vanta: Use the policy editor to write the policy directly in Vanta.
- 
Upload a file: Upload a file from your computer (PDF or DOCX, up to 10 MB).
- 
Sync a file: Sync a file from a supported integration (Confluence, Google Drive, or SharePoint).
​
 

## Managing custom policies
After you create a custom policy, make sure you've mapped it to the right controls and manage the tests tied to it. If a custom policy replaces one of Vanta’s default policies, you’ll also need to deactivate the unused Vanta policy test so your controls don’t continue showing as needing attention.
 

### Mapping custom policies to controls
 
You can map controls to a policy manually, or use Vanta AI to review suggested control mappings.
 
To map controls to policies:
- 
From the Policies page, select the policy.
- 
Click the Mapped elements tab.
- 
Click Map control.
- 
From the AI-suggested tab, review the AI-suggested controls and accept or reject each suggestion.
- 
From the All tab, manually map or unmap controls.
​
💡 Tip: You can also use the Vanta Agent to help map policies to controls instead of opening one policy at a time. Ask: “Help me map my custom policies.” The agent can review your policies, suggest relevant control mappings, and walk you through the suggestions so you can accept or reject them.
 
 

### Custom policy tests (policy approval and employee acceptance)
 
Vanta automatically creates two tests for each custom policy: one that checks whether the policy is approved, and one that checks whether relevant employees have accepted it. Both tests appear on the Tests page under the Policies category once the policy has been approved. For the acceptance test to pass, all employees in the assigned employee group must accept the policy within its SLA.
 
If you're using a custom policy in place of a Vanta default policy, deactivate the corresponding policy tests for the Vanta policy you’re no longer using. Otherwise, that policy may remain in your policy list, and related controls may continue to show as needing attention.
 
To deactivate a policy test:
- 
From the Tests page, find the test for the Vanta default policy you're not using. Search by policy name to find the test that reads: "Company has an approved [policy name]."
- 
Open the test.
- 
Click the ••• menu at the top of the test.
- 
Select Deactivate. 
You can also map a custom policy's test to a control from the Frameworks page—open the control and manage its tests there.
 
Repeat this for any Vanta policy templates you do not plan to use. Once the policy test is deactivated, the policy template will no longer appear on your Policies page, and the test will be removed from your controls.
 
You can reverse this at any time by going to your deactivated tests and selecting Reactivate monitoring.
 

### Deleting custom policies
- 
To delete a policy draft: Open the policy > next to the Draft version, click the ••• menu of the Draft version > select Delete.
- 
To delete the whole policy: Open the policy > at the top of the page, click the ••• menu > select Delete policy. A custom policy can't be deleted until its draft has been created.
​
⚠️ Note: Deleting a policy removes it from your Policies page and deactivates or removes its associated approval and acceptance tests, including the control mappings tied to those tests. If the policy came from Vanta’s policy library, you can add it back later, but any customizations you made won’t be preserved. Custom policies and drafts can’t be restored.

## Images

- none
