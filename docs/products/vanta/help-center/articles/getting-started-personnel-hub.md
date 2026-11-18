# Getting Started: Personnel Hub

Source: https://help.vanta.com/en/articles/11345364-getting-started-personnel-hub
Collection: Getting Started Hub ; Getting Started Hub › Getting Started Guides
Fetched: 2026-11-17

## Article text

During your compliance journey, a crucial step is ensuring that all personnel associated with your company (employees, contractors, etc.) meet the compliance requirements. You can monitor your employees, devices, and access through Vanta's Personnel hub and ensure your company is compliant and secure.
 
 

## Personnel hub
The personnel hub groups pages related to your employees, assets, and the level of access users have to systems.
- 
People Page: Assign compliance tasks to your employees and track their completion
- 
Computers Page: Monitor computers and ensure they are configured properly
- 
Access Page: Track that your employees have access to only the systems they’re supposed to
​
 

## 1. Import Personnel
Personnel records are people listed on your People page. First, you need to import your employees into Vanta so that we have a complete list of your company's employees. After this step, your People Page will accurately represent your company's employees. 
 

## a. Connect your Identity Provider
Personnel records are created when you connect an identity provider (IdP) or add someone manually. Once imported, personnel records populate on the People page. 
 
Learn more: Adding and Managing Personnel <https://help.vanta.com/en/articles/11345379-people-page> 
 

## b. Connect your HRIS
Vanta uses human resources information systems (HRIS) to track more information relevant to compliance and security. HRIS systems enable us to track who your current employees are when employees go on leave, team managers, and more.
 
Vanta also pulls job titles from supported IdPs (currently Google Workspace and Okta). If you have an HRIS connected, the HRIS job title takes priority. If no job title is available from your HRIS, Vanta will use the job title from your IdP instead.
 
Learn more: Adding and Managing Personnel <https://help.vanta.com/en/articles/11345379-people-page> 
 

## c. Manage Employees
After connecting your IdP/HRIS, review the People Page to ensure the information is accurate. You can take the following steps:
- 
Mark as “not a person”: You can mark service accounts or other non-human accounts as Not a person. These accounts can still be accessed but will not be assigned tasks. Learn more <https://help.vanta.com/en/articles/11346106>
- 
Scope out employees: You can scope out anyone on your People Page who isn’t relevant to your audit. Learn more <https://help.vanta.com/en/articles/11346114>
- 
Mark on leave: If someone is on leave, you can mark them as such, and all their tasks will be paused. Learn more <https://help.vanta.com/en/articles/11345588>
​
 

## 2. Assign tasks to your personnel
A task is a requirement assigned to a person in your company that must be completed. Tasks can serve different purposes, such as ensuring people have background checks, have accepted policies, or have installed a device monitoring tool onto their computer. See the full list of tasks here <https://help.vanta.com/en/articles/11345600>. 
 
Tasks feed directly into tests, which is how your auditor will know you’ve kept your security commitments. When a task is assigned to a person, the corresponding test will fail until the task is completed. See here <https://help.vanta.com/en/articles/11345600> to learn more about which tasks map to which tests.
 
Tasks are assigned to people through groups <https://help.vanta.com/en/articles/11345836>. When a task is assigned to a group, it is assigned to all the people in that group.
- 
Default group: New Vanta accounts automatically have a default group with no tasks assigned. This group includes all your company’s personnel; any new people will automatically be added. This group can assign tasks that apply to all the people in your organization. We recommend assigning the following tasks to the default group if you want to keep things simple.
- 
Create additional groups: If you’d like to assign additional tasks to specific groups of people, you can create additional groups and assign tasks to those groups.
For example, some customers only need their full-time employees to accept policies, not contractors. In this scenario, they would create a group for full-time employees, add their full-time employees, and assign the policy acceptance task to that group.
 
If you plan to create more than five groups, we recommend importing groups <https://help.vanta.com/en/articles/11345666> from your IdP. This way, you’ll be able to manage all your groups in one place and not need to manage group membership manually within Vanta.
 
Check out our in-depth article <https://help.vanta.com/en/articles/11345600> on tasks, groups, and task sets. We recommend following this guide <https://help.vanta.com/en/articles/11345600-personnel-tasks> if you’re unsure what tasks to assign.
 

## a. Background checks
A background check <https://help.vanta.com/en/articles/11345825> is a process through which employers leverage private and public information to screen prospective or current personnel. There are different background checks, but common ones include criminal history checks, employment verifications, and education verifications. Most compliance frameworks require that you screen your personnel. Running background checks is usually the easiest and most automated way to fulfill this requirement. You typically don’t need to run background checks on existing personnel, just going forward on new personnel.
 

### Set up background checks with Vanta
- 
You can run background checks directly from Vanta through our built-in tool <https://help.vanta.com/en/articles/11345701> if you don't have a background check provider. If you already have a background check provider, you can integrate it with Vanta on the Integrations Page <https://app.vanta.com/integrations?state=available&servicecategory=BACKGROUND_CHECK_SERVICE>. Once connected, Vanta will pull all the background checks and automatically link them to your personnel based on name and email.
- 
Sometimes, we can’t auto-link background checks because they are run using personal emails that are not in Vanta (Vanta fetches personal emails from HRIS tools when feasible). If this occurs, you can manually link background checks <https://help.vanta.com/en/articles/11346111> to your personnel or upload URLs that link to a person’s background check.
- 
Vanta's built-in background check tool is currently available only for U.S.-based customers. ​

### Assign background check tasks to personnel
- 
Add the background check tasks to the relevant group(s). If you want to run background checks only on people who joined your company after a specific date, select Effective Date.
- 
When in doubt, we recommend assigning background check tasks to all personnel.
- 
For guidance on communicating background check tasks to your personnel, refer to our Personnel Onboarding Templates <https://help.vanta.com/en/articles/11345608>. 

## b. Policy Acceptance
By this point, you should have your company’s policies created through the Policies Page <https://app.vanta.com/policies/> (if not, we recommend doing so before assigning this task). Once your company’s policies are in Vanta, your personnel must agree to these policies.
 

### Enforce policy review
- 
You can decide how employees review each policy before accepting them. This setting applies globally to all policy acceptance tasks.
- 
In the Settings page menu, scroll to the Personnel section and go to the Security tasks tab. 
- 
From the Enforce policy review setting:
- 
On: Employees must open each policy, scroll to the bottom, and accept it. They need to repeat this for each policy for the task to be marked as complete.
- 
Off: Employees can open each policy. They need to click the button to accept all policies at once for the task to be marked as complete.

### Assign policy acceptance tasks
- 
Add the policy acceptance task to your personnel by adding the task to the relevant groups. 
- 
In the task, you can select which policies the group members must accept. Once people are assigned a policy acceptance task, they will be notified to log in to Vanta and prompted to read and accept the policies. 

## c. Device monitoring
To build a strong security and compliance foundation, organizations need to be able to view, manage, and secure devices such as laptops and desktops. Through Vanta, you can monitor your company’s computers, ensure every person has a monitored computer, and ensure that your computers are secure. For more information, view this article. <https://help.vanta.com/en/articles/11345823>
 

### Set up device monitoring with Vanta
If you don’t already have a device monitoring solution, you can leverage the Vanta Device Monitor, a lightweight software that your personnel can install onto their computers to monitor them for compliance requirements. Once your personnel installs the Vanta Device Monitor onto their computers, the computers will appear on the Computers Page. Learn more <https://help.vanta.com/en/articles/11345407> about the Vanta Device Monitor.
 
If you already have an MDM <https://www.vanta.com/integrations?filters=MDM>, integrate it with Vanta on the Integrations Page <https://app.vanta.com/integrations?state=available&servicecategory=MOBILE_DEVICE_MANAGEMENT_TOOL>. Once connected, Vanta will pull all the computers from the MDM and automatically link them to your personnel based on name and email. These computers will appear on the Computers Page.
 

### Assign device monitoring tasks
Assign the device monitoring task to your personnel by adding the “Device monitoring” task <https://help.vanta.com/en/articles/11345600> to the relevant group(s). The following steps depend on whether you’re leveraging the Vanta Device Monitor or an MDM:
- 
Vanta Device Monitor: Select “Ask personnel to install Vanta Device Monitor.” If this option is selected, individuals assigned to this task will be required to install the Vanta Device Monitor on their computer. Once they do so, the computer will appear in Vanta, and the task will be completed.
- 
MDM: Unselect “Ask personnel to install Vanta Device Monitor.” If this is selected, people with this task will be required to have a computer monitored by your MDM, and they will not be able to download the Vanta Device Monitor.  

## d. Security and privacy training
Security and privacy training <https://help.vanta.com/en/articles/11345387> is a type of training (often delivered through videos) that your personnel must complete to meet compliance requirements.
 

### Set up training with Vanta
- 
Vanta offers a built-in training video library covering all the topics your personnel need to meet compliance requirements. We recommend that you leverage this library. Learn more <https://help.vanta.com/en/articles/11345841> about Vanta’s built-in security and privacy training.
- 
If you have a learning management system (LMS) that you use for personnel training, you can integrate it with Vanta on the Integrations Page <https://app.vanta.com/integrations?state=available&servicecategory=SECURITY_AWARENESS_TRAINING_PROVIDER> and link the training pieces to compliance requirements. Learn more <https://help.vanta.com/en/articles/11345841> about integrating third-party LMS tools with Vanta.

### Assign device monitoring task
Assign security & privacy training tasks to your personnel by adding the “Training” task <https://help.vanta.com/en/articles/11345603> to the relevant group(s) for the training that applies to the group. The following steps depend on whether you’re leveraging Vanta’s built-in library or a third-party tool:
- 
Built-in videos: Click the “Vanta training” option for each video. Once assigned, individuals with this task can log in to Vanta and watch the training videos. Once they watch the videos, the tasks will automatically be completed.
- 
External/custom videos: If you’re leveraging an LMS integrated with Vanta, the “Custom training” option will be auto-selected. People with this task will need to watch the training in your LMS, and the task will auto-complete once they do. If your LMS is not integrated with Vanta, you can provide your personnel with a custom URL and instructions to access the system. Once assigned, they can log into Vanta, be redirected to the training, and verify that they have completed it. Learn more. <https://help.vanta.com/en/articles/11345604>

## e. Custom tasks
You can create additional custom tasks within Vanta to track requirements for your personnel that Vanta may not support. These tasks can be for admins or include screenshots or text entries that people must sign in to Vanta and complete.
 

### Set up custom tasks
- 
Go to any group, click “Custom onboarding task” or “Custom offboarding task”, and click “Create a custom task”. Learn more <https://help.vanta.com/en/articles/11345604>.

### Assign custom tasks
- 
Assign custom tasks to your personnel by adding a custom task to the relevant group. Learn more. <https://help.vanta.com/en/articles/11345604> You can select whether this task is for admins or personnel and optionally add custom instructions. For personnel custom tasks, you’ll also be able to set optionally:
- 
File upload requirements: If set, the person must upload a file to complete the task.
- 
Text submission requirements: If set, the person must submit a text answer. 
​
 

## 3. Turn on notifications for your employees
We highly recommend turning on automatic notifications. Customers with notifications enabled are more likely to have their employees complete their tasks successfully.
 
Once you assign tasks to your employees, turn on notifications. Once notifications are enabled, Vanta will automatically notify your employees when they have incomplete tasks in Vanta. Turn on notifications by going to your Company Settings <https://app.vanta.com/settings/company-notifications> and enabling the toggle next to “Employee reminders.” You can notify your employees through email, Slack <https://help.vanta.com/en/articles/11345744>, or both.
 
 

## 4. Monitor task completions
You can monitor your employees’ progress toward completing their tasks on the People page <https://app.vanta.com/people/people?taskStatus=SECURITY_TASKS_DUE_SOON&taskStatus=SECURITY_TASKS_OVERDUE>.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2307692678/9225c05c862cef7fef13a3f105a0/35978075184788?expires=1794967200&signature=937aaa8ec1ca126279d899f8abeb9ca9c34bd41081dee717e49e01576ffe7c4b&req=diMnEc93n4dYUfMW1HO4zevVYnMFCj3V6dWbja9t8k9VHI0p6LR%2FtTKCzRKu%0A5UulNNJFSY0h1dQ0YyY%3D%0A>
- 
You can filter the People Page by “Tasks due soon” and “Tasks overdue” to see all your employees with incomplete tasks.
- 
Click on an individual employee to view their tasks (both incomplete and complete). From this drawer, you can also take action depending on the types of incomplete tasks.
- 
Employee task: If an incomplete task requires action by the employee, they must sign in to Vanta to complete it. Make sure you have notifications enabled <https://help.vanta.com/en/articles/11345600>. You can also send a one-time reminder from the drawer.
- 
Admin task: If an incomplete task requires administrative action, such as linking a background check to an employee, you can take that action directly from the drawer.
- 
Once your employees’ tasks are complete, the corresponding tests <https://help.vanta.com/en/articles/11345600> on the Tests Page will pass.

## Images

- [image 01] ../../images/ux/personnel/getting-started-personnel-hub--01.png
