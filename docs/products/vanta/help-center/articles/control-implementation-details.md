# Control Implementation Details

Source: https://help.vanta.com/en/articles/17602559-control-implementation-details
Collection: Security Frameworks ; Security Frameworks › Controls
Fetched: 2026-11-17

## Article text

Implementation details is a field on every control where you record how your team carries out the control, like who runs it, which tools they use, and what record it leaves. You can add details manually, draft them with the Vanta Agent or a custom agent, or update many controls at once by importing a spreadsheet. At this time, the field cannot be shared with auditors.
 
⚙️ User permissions: Admins, Editors, and Audit Limited Editors can manage controls. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Drafting with the Vanta Agent
Ask the Vanta Agent to draft implementation details for your controls so you don’t have to write each one yourself. The agent uses information already in Vanta, like your control details, mapped tests and evidence, and approved policies. You review the drafts and approve them before the agent saves anything to your controls.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2743431832/3512be2d9537db6863ab9314e111/image.png?expires=1794967200&signature=cc43ba36e82961e982a91b873082b4e322ab4e8b47dda43c451a02b521da5c7f&req=dicjFc19nIlcW%2FMW1HO4zTqztoSdzbNarnZ526kocBy226Lih%2FMaPYjl2JEj%0A%2FMMsyJog8cXRhRRsu2g%3D%0A>
 
To draft implementation details with the Vanta Agent:
- 
Open the Vanta Agent.
- 
Enter a prompt that describes the controls you want to draft details for.
- 
Example prompt: Add implementation details to controls I own.
- 
Example prompt: Fill in implementation details for my SOC 2 controls.
- 
Review the drafts in the Approval required card.
- 
The agent works in batches of up to 20 at a time.
- 
The card lists each control with its drafted implementation details.
- 
To add formatting like bold text, ask the agent to update the drafts.
- 
Click Approve to save the drafts to your controls.
- 
If you only want to approve some of the changes, let the agent know which ones.
- 
The agent confirms in the chat with a summary of the saved details.
- 
Click a control ID in the summary to open the control.
- 
To leave your controls unchanged, click Reject.
​
💡 Tip: If you already track implementation details in another control field (like a custom field <https://help.vanta.com/en/articles/11345373-controls-page> or the Note field), you can migrate that content.
 
Example prompt: Migrate existing control documentation from the [field name] field into the implementation details field for all controls. After you check that the content copied over, you can ask the agent to clear values from the original field.
 
 

## Using a custom agent
Use a custom agent <https://help.vanta.com/en/articles/16397022-create-schedule-and-manage-custom-agents> to draft implementation details for your controls. Start with our agent template, which comes with the instructions already written. You can run it manually, on a recurring schedule, or on an event trigger. Each run drafts details for controls that don’t have them yet and delivers a CSV in chat. Review the drafts, then ask the agent to update your controls.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2743437758/5b9c11227cc71dc8a683b77d5ff3/image.png?expires=1794967200&signature=88880988dcb493937e7c4e4e953e5ccfec0663581649f12583704e4214b61132&req=dicjFc19moZaUfMW1HO4zbiQyJRNlfrKLqAkDgWR7PjBW5EAoemRV9gecb37%0A9A2BV5ChfvkYVSaLfDI%3D%0A>
 

### Using the agent template
 
With the default instructions, the agent drafts details only for controls that don’t have them yet. It skips controls that already have implementation details.
 
To create the custom agent from our template:
- 
Open the Vanta Agent.
- 
Select Agents > Templates > Draft Control Implementation Details.
- 
Edit the name or instructions as needed.
- 
Choose when you’d like the agent to run.
- 
Manual: Run the agent yourself whenever you need it
- 
Schedule: Run the agent automatically on a recurring cadence
- 
Event Trigger: Run the agent automatically when an event happens
- 
Click Save—this adds the agent to your Agents page but doesn’t run it.
 

### Running the agent
 
You can run the agent manually at any time, even if you set up a recurring schedule or event trigger.
 
To run the agent:
- 
Open the Vanta Agent.
- 
Select Agents and open the agent.
- 
Click Run now.
 

### Reviewing the drafts
 
After your agent runs, you need to review the CSV with drafted implementation details and update your controls.
 
To review the CSV draft and update your controls:
- 
Open the Vanta Agent.
- 
Select Agents and open the agent.
- 
In the Activity section, open the completed run.
- 
Review the summary in the chat.
- 
It shows how many controls had no implementation details, how many the agent drafted, and anything it had to infer.
- 
Download the CSV.
- 
Each row has the control ID, control name, framework codes, and drafted implementation details.
- 
In the same chat, ask the agent to update your controls.
- 
Example prompt: Update the implementation details for the first 10 controls in the CSV.
- 
Example prompt: Update the implementation details for controls in the CSV mapped to the HIPAA framework.
- 
Review the Approval required card, then click Approve.
- 
The agent confirms in the chat with a summary of the updated controls.
- 
Click a control ID in the summary to open the control.
- 
To leave your controls unchanged, click Reject.
​
💡 Tip: You can edit the drafts in the CSV, then import it to update your controls in bulk. Learn more
 
 

## Agent sources
The Vanta Agent and custom agents can use information from the following sources in Vanta to draft implementation details:
- 
Controls: The name, description, and domain of each control
- 
Tests: The automated tests mapped to your controls
- 
Documents: The documents mapped to your controls and the evidence you provide for them
- 
Evidence evaluation: The findings from evaluating the evidence on those tests and documents
- 
Policies: Your approved policies
- 
System description: Your system description (if applicable)
The agent relies most on the tests and documents mapped to a control. When a control has little mapped evidence, it draws more on your approved policies and system description.
 
 

## Adding manually
- 
Open a control from the Controls page and enter your details in the Implementation details field.
- 
Enter your details in the optional Implementation details field when you create a custom control <https://help.vanta.com/en/articles/11345435-importing-custom-controls>. To have Vanta AI draft, enter a description and click Generate details.
- 
The Implementation details field supports rich text, like bold, italic, lists, and links. To add a link, highlight the text and paste the URL.
​
 

## Bulk spreadsheet updates
Edit implementation details for many controls in a spreadsheet, then import the file to update them all at once. You can start from an export of your controls or a CSV from a custom agent.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2743439286/da77ea5652abb273213d04ad8b4c/image.png?expires=1794967200&signature=c8de70af17ba7c3513922fb68cf4f84c2c54542eb91cfd26af90c5a1de80eece&req=dicjFc19lINXX%2FMW1HO4zeMxmBnW2iBC0P%2B2AXa%2FMtZlk9776uJBkCj9O11q%0AcaLrZcuj%2F%2BmLkQ8ogd0%3D%0A>
 
To update implementation details in bulk:
- 
Open the Controls page.
- 
Click Add control > Via import > Use template.
- 
Click Update existing controls.
- 
Click Export controls to download your controls as a CSV.
- 
Or use the CSV provided to you by the custom agent.
- 
Update the Implementation Details column in your file as needed.
- 
To add formatting, use markdown, like **bold**, *italic*, - for bullets, and [text](url) for links.
- 
Upload your file.
- 
Map column headers as needed.
- 
Complete the import.
​
💡 Tip: To move implementation details out of another control field (like a custom field <https://help.vanta.com/en/articles/11345373-controls-page> or the Note field) and clear the original field in the same import:
- 
Click Export controls to download all of your control fields. (Optional: save a copy of the file as a backup.)
- 
Copy the values from the original field’s column into the Implementation Details column.
- 
Delete the values in the original field’s column, but keep the column in the file.
- 
Select Clear existing values for empty fields before you upload.
- 
Upload your file and complete the import.

## Images

- [image 01] ../../images/ux/ai/control-implementation-details--01.png
- [image 02] ../../images/ux/ai/control-implementation-details--02.png
- [image 03] ../../images/ux/controls/control-implementation-details--03.png
