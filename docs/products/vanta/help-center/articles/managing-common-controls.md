# Managing Common Controls

Source: https://help.vanta.com/en/articles/16894224-managing-common-controls
Collection: Security Frameworks ; Security Frameworks › Controls
Fetched: 2026-11-17

## Article text

✅ Feature availability: The common controls feature is currently in Public Preview and requires the Vanta Control Framework (VCF) to be enabled on your plan, which may require an upgrade or add-on—refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details. 
 
Common controls are a reporting layer that helps you monitor your compliance program across multiple frameworks in one place. A common control groups related framework controls by shared objective, so related evidence, policies, risks, and issues appear together instead of framework by framework. The Vanta Control Framework (VCF) is a pre-built set of common controls you can use out of the box that auto-maps controls across supported frameworks. For controls that aren't auto-mapped, you can map them to common controls manually.
 
⚙️ User permissions: Audit Limited Editors, Editors, and Admins can manage all common controls. Collaborators and Teams can be assigned to own a specific common control. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Getting started
Controls can be mapped to common controls to help you monitor your compliance program across multiple frameworks in one place. Review these terms before you get started:
 | 
Term | 
Definition
 | 
Vanta Control Framework (VCF) | 
Created by our in-house GRC experts, a pre-built set of default common controls auto-mapped to default controls on VCF-supported frameworks.
 | 
Common control | 
A single objective that one or more controls with the same underlying intent are mapped to—like a folder that groups related controls. VCF provides a set of default common controls you can use out of the box, and you can create custom common controls as needed.
 | 
Framework | 
The compliance standards you're pursuing, like SOC 2 or ISO 27001. Some Vanta frameworks are VCF-supported: their default controls are auto-mapped, and the Vanta Agent suggests mappings for custom controls. For other Vanta frameworks or custom frameworks, you map controls to common controls manually.
 | 
Control | 
The individual framework requirements that can be mapped to common controls. Default controls come standard with a Vanta framework you've purchased, and you may have custom controls mapped to your frameworks.
💡 Tip: Common controls are an internal-only reporting layer designed to help you monitor your compliance program, while the controls in scope for your audit are what your auditor has access to during the observation window.
 
 

## Vanta Agent setup flow
When you set up common controls for the first time, the Vanta Agent walks you through mapping your controls to VCF:
- 
For VCF-supported frameworks: The Vanta Agent auto-maps default controls for you or suggests mappings for custom controls. 
- 
For non-VCF-supported frameworks: You can map controls from these frameworks to common controls manually after initial setup is complete.
​
⚠️ Note: Before getting started, contact your CSM to enable VCF-supported frameworks for common controls—this is required before you can select them as frameworks in the Vanta Agent setup flow.
 
To set up common controls for the first time:
- 
From the Common controls tab, select Get started—this opens the Vanta Agent with a prompt pre-loaded for you.
- 
Select the frameworks you want the agent to scan:
- 
Only controls mapped to VCF-supported frameworks can be scanned.
- 
The time it takes to scan can depend on the number of controls.
- 
You can navigate away from the chat and come back—the scan continues in the background.
- 
Review mappings once the agent finishes scanning:
- 
The Vanta Agent auto-maps controls for you or suggests mappings for you to review.
- 
You may need to set aside dedicated time to review suggested mappings if your program contains many custom controls.
- 
Only suggested mappings you confirm will be mapped. Suggested mappings you skip will not be mapped—you can pick up where you left off in the Vanta Agent chat later to continue, or edit control mappings directly at any time.
- 
Go to the Common controls tab:
- 
Review auto-mapped controls to confirm they're accurate.
- 
Assign owners to all common controls to ensure mapped evidence is passing.
The Vanta Agent flow is designed to help with your initial setup—after setup, you can manage your common controls and mapped framework settings directly.
 
 

## Navigating common controls
On the Controls page, go to the Common controls tab. Common controls are organized into a three-level hierarchy: functions, domains, and subdomains. Within a common controls view, you'll see:
- 
The percentage of mapped evidence that's passing from across your automated tests and documents
- 
How many controls have been consolidated into (or mapped to) the common controls in the view
- 
Which frameworks have controls mapped in the view
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2699627597/ba609c07cbae816e1ca3f9a5fe5c/image.png?expires=1794967200&signature=d64ae249df3c7d139690ccbcf4bb5411616a133a3d192675b72733bf9a521c9d&req=diYuH898moRWXvMW1HO4zcHa0j4itQFXsOg0cs1i1PH3uH%2Fa7V170K2hkEMy%0A1%2BbMnYoWm7wefjK0iRE%3D%0A>
 | 
Common control view | 
How to view
 | 
View all | 
Select All from the page menu
 | 
View by function | 
Select a function from the page menu—such as Govern, Identify, Protect, Detect, Respond, or Recover
 | 
View by domain | 
After selecting a function, select an available domain from the page menu
 | 
View by subdomain | 
After selecting a domain, filter by an available subdomain above the table
Metrics recalculate based on the view applied: viewing all common controls shows data across all common controls, and selecting a function or domain, or applying a filter on a function or domain page, updates the charts accordingly.
 
ℹ️ Note: Each common control can belong to one function, domain, and subdomain combination at a time. Functions, domains, and subdomains are based on the NIST Cybersecurity Framework (CSF) and aren't editable.
 
 

## Managing a common control
Open a common control to view and manage what’s mapped to it across the available page tabs: Controls, Evidence, Policies, Risks, and Issues (if your account has Issue Management <https://help.vanta.com/en/articles/11585211-issue-management-in-vanta> enabled). The controls mapped to a common control are what populate the data across those tabs.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2699629332/43fdb07994e57a3f874f09be4b0d/image.png?expires=1794967200&signature=ab14e96b50505222802ba86e40df023483b31f694093435771411038450b156c&req=diYuH898lIJcW%2FMW1HO4zXKnufIvExW2GDCSTUEM9NK58ww1XIS2ifVOYVoM%0ALPZgYXWTyTYkxHKL94U%3D%0A>
 
Within a common control, you'll see the percentage of mapped evidence that’s passing from across your automated tests and documents, how many controls have been consolidated into (or mapped to) this one common control, and which frameworks have controls mapped to it. The metrics on the common controls details page do not recalculate when filters are applied.
 
 

### Editing control mappings
 
The controls mapped to a common control are what populate data within the common control.
 
To edit control mappings:
- 
Open a common control and select the Controls tab.
- 
Click the Add control button above the table.
- 
Search for controls and select ⊕ or ⊗ to add or remove them.
- 
After mapping controls, refresh the page to see the changes reflected across the relevant tabs.
​
💡 Tip: Select a control from the table to open the control details, where you can directly manage the mapped elements and other data that populates across the common control. Learn more: Adding and Managing Controls <https://help.vanta.com/en/articles/11345373-controls-page>
 

### Editing name and description
 
To edit the name and description for a common control:
- 
Open a common control.
- 
Click the ••• menu at the top of the page.
- 
Edit the Title (also referred to as the common control name) and Description as desired.
- 
Click Save changes.
 

### Assigning owners
 
To assign a common control owner:
- 
From the Common controls tab, open a common controls view.
- 
In the Owner column, select the assignee.
- 
Search for and select a user or team.
You can also edit the owner within a common control at the top of the page under the common control name.
​
 

### Managing access
 
At the top of a common control, click Manage access to see which user roles can view or manage the common control.
- 
Audit Limited Editors, Editors, and Admins can manage all common controls and controls across the organization.
- 
Collaborators assigned to own a common control can manage that common control and manage all its mapped controls.
- 
Collaborators assigned to own a control can only manage the control they've been assigned to.
​
📖 Learn more: Managing User Roles <https://help.vanta.com/en/articles/11345385-assigning-user-roles-and-permissions>
 

### Commenting
 
To add a comment:
- 
Open a common control and select the Comments tab—only users who can manage the common control can post comments.
- 
Type your comment—you can use @ mentioning to tag a user and hit enter to add a line break.
- 
Click the send icon to post the comment.
 

### Deactivating or deleting
 
To deactivate a common control:
- 
From the Common controls tab, select the ••• menu next to the common control.
- 
Select Deactivate—deactivated controls can be restored.
To reactivate a common control:
- 
From the Common controls tab, select the ••• menu at the top of the page.
- 
Select View inactive controls.
- 
Click Reactivate next to the relevant common control.
To delete a common control:
- 
You can’t delete a default common control.
- 
You can delete custom common controls—follow the steps to deactivate and instead select Delete.
 
 

## Adding a custom common control
To create a custom common control:
- 
From the Common controls tab, click the Add custom common control button.
- 
Enter a Description, Common control name), and Control ID—the unique identifier for the common control, which can’t be edited after creation.
- 
Select an available Function, Domain, and Subdomain.
- 
Select Add control to confirm.
- 
Map controls to the common control as desired to populate data.
​
 

## Exporting common controls
To export your common controls:
- 
From the Common controls tab, select the ••• menu.
- 
Select Export all.
- 
A CSV will be automatically downloaded.
- 
The file includes all common controls you have access to based on your user permissions—regardless of domain, subdomain, or other filters applied to the table. 
- 
Each row includes the common control's ID, name, description, status, domain, subdomain, mapped framework controls, mapped evidence link identifiers (found in the URLs for linked documents and tests), and the controls mapped from each framework.
​
 

## Managing mapped frameworks
You can enable or disable VCF-supported frameworks in VCF settings to add and remove auto-mapped controls. In certain circumstances, you may need to manage control mappings directly.
 

### VCF-supported frameworks
 
VCF supports a subset of Vanta frameworks <https://www.vanta.com/products/additional-frameworks>, with plans to cover more over time. If a framework enabled on your plan becomes VCF-supported in the future, we’ll let you know.
 
The following frameworks are currently VCF-supported: 
- 
CIS v8.1
- 
Cyber Essentials
- 
DORA
- 
EU AI Act
- 
GDPR
- 
HIPAA
- 
ISO 27001
- 
ISO 27701
- 
ISO 42001
- 
NIS 2
- 
NIST CSF 2.0
- 
SOC 2
- 
SOX ITGC
- 
US Data Privacy
There may be ongoing updates to existing VCF-supported frameworks, which can include changes to common control titles, descriptions, or pre-built control mappings. This may impact the metrics you see within common controls as a result—it won’t impact your underlying framework controls.
​
 

### Auto-mapping vs. manual mapping
 
Whether controls are auto-mapped to common controls or need to be manually mapped depends on the following:
- 
VCF common control: An out-of-the-box common control. Vanta can auto-map controls during Vanta Agent setup or when managing VCF settings.
- 
By default, controls are auto-mapped when you enable a framework and auto-removed when you disable a framework.
- 
If you edit a VCF common control (title, description, or control mappings, whether via a Vanta Agent suggestion or manually), it becomes protected—disabling a framework no longer auto-removes mappings.
- 
Editing a VCF common control doesn't stop new controls from being auto-mapped to it later—if you enable a framework, or an update is made to an enabled framework, Vanta checks the common control for any missing pre-built mappings and adds them.
- 
Custom common control: A common control you created—you manage titles, descriptions, and control mappings manually for all custom common controls.
 

### VCF settings
 
Once you've completed initial setup with the Vanta Agent, you can manage which VCF-supported frameworks are enabled in common controls.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2700364547/172b03e94d6c00d8092edb7d2f56/image.png?expires=1794967200&signature=61ab83063a95ab6652d8f9012d0bce0d396d06f80c355c70e233b5b3847ee88a&req=dicnFsp4mYRbXvMW1HO4zWMTHTJW733anhALRvulMRBqk5oqdutevJUFF%2F5J%0AICFbAKMfbGYAJK0qsjw%3D%0A>
 
To access VCF settings:
- 
From the Common controls tab, click the ••• menu at the top of the page.
- 
Select Edit VCF settings.
- 
Enable or disable a framework as desired. 
​
ℹ️ Note: VCF settings only apply to auto-mapped VCF common controls. Learn more
 

### When disabling a framework
- 
Auto-mapped controls are removed. Controls you mapped, whether via a Vanta Agent suggestion or manually, are not removed.
- 
When control mappings are removed, common control data updates accordingly, such as the percentage of evidence passing and the number of controls consolidated.
- 
A common control is hidden from view if removing a mapping leaves it with no mappings at all. It reappears once a mapping is added back to it, such as when you re-enable the framework.
​

### When enabling a framework
- 
Default controls are auto-mapped to common controls, including ones you've edited.
- 
The Vanta Agent may have suggested mappings for your custom controls. To review these, open a Vanta Agent chat and enter a prompt like "map VCF to my frameworks." This launches a guided review where you confirm or skip each suggested mapping.

## Images

- [image 01] ../../images/ux/controls/managing-common-controls--01.png
- [image 02] ../../images/ux/controls/managing-common-controls--02.png
- [image 03] ../../images/ux/controls/managing-common-controls--03.png
