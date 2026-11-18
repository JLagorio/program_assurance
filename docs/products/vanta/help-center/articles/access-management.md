# Access Management

Source: https://help.vanta.com/en/articles/11345381-access-management
Collection: Team Compliance ; Team Compliance › Access
Fetched: 2026-11-17

## Article text

✅ Feature availability: While the Access page is included on all plans, Access Management features may require an upgrade or add-on to your plan, including suggestions, access requests, access reviews, and deprovisioning tasks. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
The Access page shows the accounts your personnel have access to across your applications. From here, you can run access reviews on a schedule or on demand as needed, manage incoming access requests, and track deprovisioning tasks when someone leaves the company or changes roles. Between reviews, Vanta AI flags accounts that need attention, like one tied to someone who's left the company, so you can act on them sooner.
 
⚙️ User permissions: Access Admins, Editors, and Admins can manage all tabs on the Access page. Collaborators can be assigned to specific applications or deprovisioning tasks. Learn more: User Permissions per Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Accounts and applications
The Accounts tab shows accounts pulled from the integrations you've connected to Vanta, which are referred to as applications within Access Management. This is where you keep track of who's responsible for each account, which supports your access reviews and other access management controls.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2638813627/2222b5370677efa2578784c607f2/image.png?expires=1794967200&signature=fa3a938b9c7a3279ee5571fe0302b7cd7647371acf0a124f7102dce0ddae7c1b&req=diYkHsF%2FnoddXvMW1HO4zZqaM9PYqKFPjwgZYIDHHWrXQMPGEQiHr4D2icJJ%0AYq%2F%2FIA%2FqmILs0S6WeJ8%3D%0A>
 

### Filtering accounts by application
 
Accounts are organized by application. Select an application first, then filter or search to narrow the results further.
 
Use the filters above the table to narrow results by:
- 
Application: One of your connected integrations.
- 
Owner: The personnel record linked to the account.
- 
Status: Whether the account is Active, Deactivated, or Unknown in the application.
- 
MFA: Whether multi-factor authentication is turned on for the account.
- 
Frameworks: The frameworks or segments whose controls apply to that account.
​
ℹ️ Note: To see all applications linked to a particular account, open the personnel record <https://help.vanta.com/en/articles/11345379-adding-and-managing-personnel> from the People page.
 

### Assigning account owners
 
Every account should have an owner on file for recordkeeping purposes. Vanta automatically maps account owners to personnel records <https://help.vanta.com/en/articles/11345379-adding-and-managing-personnel> for some integrations when possible. Otherwise you'll need to assign owners yourself.
 
To assign an owner, hover your mouse over the owner field, click the pencil icon, and select one of the options:
- 
Select existing personnel record: Use the search bar to select an existing personnel record to link the account to.
- 
Add new person: If the personnel record doesn't exist yet, create one and assign them as the account owner. This is typically for accounts your identity provider didn't pick up.
- 
Assign to external person: Assign someone outside your organization who has access to the application but isn't tracked as personnel in Vanta.
- 
Mark as a service account: Label the account as “not a person”, like a bot or an alias.
​
💡 Tip: You can assign owners across all applications in bulk. If you have one or more unassigned accounts for any application, you'll see a banner at the top of the Accounts tab. Follow the instructions to export the list, fill in owners, and re-upload it—or assign owners directly in the modal.
 

### Exporting accounts across all applications
 
From the Accounts tab, you can export an XLSX file with a sheet of accounts for every application connected to Vanta:
- 
It includes every application connected to Vanta, not just the one you're currently viewing upon export.
- 
It contains multiple sheets: an Instructions sheet, a Summary sheet listing every application, and one sheet per application.
- 
Each application's sheet includes the account details shown in the table, along with additional fields to complete as part of your review.
- 
It's built to double as an access review evidence template—once completed, follow the instructions provided to upload it as documentation of your access review.
 
 

##  Access requests
Use the Requests tab to manage requests for application access. Personnel can request access to an application, the assigned application approver can approve or deny the request, and the application admin provisions approved access.
 
📖 Learn more: Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 
 

## Access reviews
Use the Reviews tab to confirm that personnel access across your applications is still appropriate. Each application in a review is assigned a reviewer, who reviews account access and either approves continued access or denies access to start remediation, such as a role change or access removal.
 
📖 Learn more: Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>
 
 

## Suggestions
The Suggestions tab surfaces accounts that need attention, updated daily. Use it to act on flagged accounts between scheduled access reviews, so accounts that need attention are taken care of as they come up.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2638818387/002c6a7b7eca4adae3e394c95627/image.png?expires=1794967200&signature=a9359d1fce370de6b7f55d375a6a5ffa78700e46155053daa3e247a866afb856&req=diYkHsF%2FlYJXXvMW1HO4zdh2WeAZMHcz8GyQ8BrGOHo4Km0zPelXfDB89Pcv%0A2QbVvqEmqL6S0X%2B8mNQ%3D%0A>
 

### Suggestion signals
 
The Needs your attention section contains a list of suggestions. Vanta AI scans your accounts for a specific set of high-risk signals and flags any account that matches one, along with a recommended action, such as assigning account owners or creating deprovisioning tasks. You can dismiss suggestions as needed.
 | 
Signal | 
Description
 | 
Owner is unassigned | 
No owner has been assigned to the account in Vanta.
 | 
Owner's access was denied in a previous review | 
The account owner was denied access to this application in an access review.
 | 
Account has no recent login activity | 
The connected application hasn't reported a login for this account since the date provided.
 | 
Owner is a terminated employee | 
Your connected HRIS or IdP integrations are reporting the account owner as no longer employed.
 | 
Owner's job title does not match the access control policy | 
Your connected HRIS or IdP integrations are reporting a job title that doesn't match your access control policy for this application.
💡 Tip: If you have a lot of unassigned accounts in the Suggestions tab, you can assign owners across all applications in bulk from the Accounts tab.
 

### Reviewed accounts
 
Open the Reviewed accounts section to view a record of the actions you've taken on suggested accounts, including who took the action and when, as well as a link to any deprovisioning task created.
 
ℹ️ Note: You can't make direct edits from this activity log. Make edits as needed in the appropriate tabs from the Access page.
 
 

## Deprovisioning tasks
The Deprovisioning tasks tab shows tasks created once deprovisioning starts for an offboarded employee. Each task is assigned to an owner responsible for removing access, who confirms the task once it's done.
 
📖 Learn more: Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>
 
 

## Notifications
You can receive notifications for activity across Access Management. Customize which notifications you receive by going to Settings > My account > Notifications and reviewing the My alerts and Email digests sections.
 
The table below shows what triggers each access-related notification and the toggle that controls it. Some notifications are always sent and don't have a toggle to disable them.
 | 
Notification trigger | 
Toggle
 | 
A weekly summary of accounts flagged as suggestions that need attention | 
Email digests > Flagged accounts needing review
 | 
An access review or an application within a review is due | 
My alerts > When an access review assigned to me needs attention
 | 
Reminders to finish setting up access reviews | 
My alerts > When there are personalized updates on the access reviews product
 | 
A weekly summary of access review progress | 
Email digests > My company's progress > Access reviews
 | 
You're assigned a deprovisioning task | 
My alerts > When I am assigned ownership of an item
 | 
A new access review is created from a recurring schedule | 
Always sent to the assigned schedule owner
 | 
You're asked to approve or provision an access request, or your own request is submitted, approved, denied, or provisioned | 
Always sent to relevant users

## Images

- [image 01] ../../images/ux/access/access-management--01.png
- [image 02] ../../images/ux/access/access-management--02.png
