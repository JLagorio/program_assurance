# Personnel Tasks

Source: https://help.vanta.com/en/articles/11345600-personnel-tasks
Collection: Team Compliance ; Team Compliance › Employee Onboarding & Offboarding
Fetched: 2026-11-17

## Article text

A task is a single security requirement for personnel in your company that must be completed to adhere to security controls. Tasks can serve different purposes, such as ensuring personnel have completed background checks, accepted policies, or have installed a device monitoring tool on their computer.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753885/82ea31172cb07badf13b414a498e/27243037936276?expires=1794967200&signature=c23481591f340bfc5108cbe0b39ca0841ea307ed6556b43be8e96fa96e606942&req=dSUmEM57nolXXPMW1HO4zRV%2F2ET4rqax0lhTfLZe8UsZn5OFVl3nmQOCxR3q%0ArlrnG5P%2Bhkcg8RoU41w%3D%0A>
 

## Task Types
- 
Ongoing tasks
- 
Ongoing tasks are assigned to current personnel. They include both onboarding tasks (tasks that must be completed when someone joins your company) and recurring tasks (for example, re-accepting company policies annually).
- 
Offboarding tasks
- 
Offboarding tasks are tasks assigned to former personnel. An admin must complete these tasks for personnel who leave the company (for example, ensuring their access is removed from company systems).

## Tasks
Some tasks require completion by your personnel, while others need to be completed by administrators on behalf of personnel
- 
Personnel tasks
- 
Personnel tasks are those that your personnel need to complete. Typically, these tasks are ones that can be completed within Vanta. When a person in your company has functions that can be completed in Vanta, they can sign in and access the Onboarding Page, which will walk them through completing their tasks. If you enable personnel notifications, your personnel will automatically receive reminders when they have tasks to complete within Vanta.
- 
Admin tasks
- 
Admin tasks are those that admins must complete. Depending on the task, they may include running a background check or installing an MDM on a person's computer.

## Assigning Tasks
Tasks are assigned to personnel through groups and task sets. To assign a task, you should:
- 
Add that person to a group or find one of their existing groups
- 
Edit that group’s task set to include the new task (or create a new task set for the group)

## Task Due Dates (SLAs)
- 
Task due dates are calculated based on the SLAs configured for your account.
- 
When a new task is assigned, the due date will be X days after the task is assigned, as set in the SLAs
- 
If a task is assigned at 10:00 a.m. on March 1, 2025, and the SLA is 20 days, the person will need to complete the task by March 21, 2025, at 10:00 a.m.
- 
Task due dates are read from the tests mapped to each task. When a task is assigned, its due date will be populated once the corresponding test runs

## Groups
A group is a collection of people organized around everyday security tasks within Vanta. All groups can be viewed and edited on the Groups Page.
- 
Default group
- 
All Vanta accounts are automatically created with a default group. All personnel are initially assigned to this group, although they can be reassigned elsewhere.
- 
Creating additional groups
- 
You can manually create additional groups <https://help.vanta.com/en/articles/11345594> from the Groups Page:
- 
Select Create new group
- 
Fill out the information about the group
- 
Once the group is created, you can add personnel to it by clicking on the menu icon and Edit people in the group
Importing groups from an IdP
- 
You can import groups from your IdP to use in Vanta. Vanta will also reflect when personnel are added to or removed from these groups in your IdP. Vanta recommends IdP groups for customers with over 100 personnel who need additional groups, as they automate group management.
⚠️ Note: If you use imported IdP groups to assign Personnel tasks, permanently deleting an employee from your IdP may remove their group memberships from Vanta.
 
If the employee is deleted before their Vanta offboarding is complete, their group-specific tasks and access-removal requirements may no longer appear. To ensure the correct requirements remain assigned:
- 
Suspend, deactivate, or block sign-in for the employee instead of permanently deleting their IdP account.
- 
Confirm that the employee appears as Terminated in Vanta.
- 
Complete the employee’s offboarding requirements in Vanta before permanently deleting their IdP account.
 
 
To import an IdP group:
- 
Make sure your IdP is integrated
- 
Click Import groups on the Groups Page
- 
Select the group you want to import
- 
Select the task set to assign to this group
Personnel in multiple groups
- 
You can add a single person to multiple groups. When a person is in various groups, their tasks are the union of the tasks assigned to each group (through that group’s task set). This option is helpful for customers who assign tasks to different personnel groups that can overlap. For example, you might want to assign policy acceptances to all personnel, background checks to US-based personnel, and security training to engineers. In such a scenario, you can create groups for each with the corresponding tasks and assign a US-based engineer to all of these groups.

## Task Sets
A task set is a collection of tasks that can be assigned to a group. Task Sets <https://help.vanta.com/en/articles/11345603> can be created and edited from the Task Sets Page.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516753888/000e4efc98b6fb52f2dca1aa4067/35976629505812?expires=1794967200&signature=3cc78f9686124e36df922d1af20b0f445da213c40e78d4b2b762a7bdc4834685&req=dSUmEM57nolXUfMW1HO4zV9eWuyeY2RAqwkeS8fD3iYtIvzvbUBE8G9YdHLM%0AJNhUkCtKWDGS6urCixE%3D%0A>
 

## Task Status
Task status shows someone's overall task state on the People page. Personnel records have one of the following task statuses:
- 
No tasks: No tasks are assigned to the person
- 
Paused: The person is on leave, so their tasks are paused
- 
Due soon: The person has incomplete tasks whose due date is in the future
- 
Overdue: The person has incomplete tasks whose due date has passed
- 
Complete: The person has completed all of their assigned tasks
Personnel can view their completed and pending tasks on the Onboarding page <https://app.vanta.com/employee/onboarding>.
​

## Task Types
 | 
Tasks | 
Personnel Lifecycle | 
Description | 
How is this task completed? | 
Corresponding tests
 | 
Background check | 
Ongoing | 
Checks whether a person has a completed background check linked to them in Vanta. | 
- 
Run a background check on the person (or prospective person)
- 
Ensure the background check is linked to the person in Vanta

​Learn more <https://help.vanta.com/en/articles/11345825>. | 
Background checks on new hires <https://app.vanta.com/tests/background-checks-records>
 | 
Accept policies | 
Ongoing | 
Checks whether personnel has accepted their company policies. | 
Personnel must sign into Vanta and accept the policies on the onboarding page. | 
For every policy assigned to your personnel, there will be a test, “Personnel agree to [name of policy,” that checks whether each person assigned the policy has agreed to it.
 | 
Device monitoring | 
Ongoing | 
Check whether personnel has a computer that is monitored within Vanta. | 
If using the Vanta Device Monitor: Personnel must sign into Vanta and download the Vanta Device Monitor onto their computer. Their computer will then appear on the Computers Page within the next hour.
If using an MDM: The steps here will depend on how your company provisions its MDM onto personnal computers. For most customers, this happens before the computer is shipped to the person.
Learn more <https://help.vanta.com/en/articles/11345407>. | 
Personnel computers are monitored with the Vanta Device Monitor or an MDM
 | 
Security & privacy training | 
Ongoing | 
Check whether personnel have completed all their security and privacy training. | 
If using Vanta’s built-in training, The person must sign into Vanta and watch the training videos.
If using an external tool (like an LMS or HRIS), personnel must complete the training within that tool, which will then be ported over to Vanta (the tool must first be integrated with Vanta).
Learn more <https://help.vanta.com/en/articles/11345576>. | 
For every training assigned to personnel, there will be a test, “[Training name] training records tracked,” that checks whether each person has watched it.
 | 
Access removal | 
Offboarding | 
Checks whether a terminated person has had their access removed from all relevant systems. | 
- 
For any monitored account: Vanta will automatically detect whether this person's account was deactivated. Go to that tool to deactivate any accounts that have not been deactivated.
- 
For any unmonitored account: Go to the tool to deactivate it and then mark it as deactivated in Vanta.

​Learn more <https://help.vanta.com/en/articles/11345609>. | 
Offboarding completed former personnel within SLA <https://app.vanta.com/tests/vanta-users-offboarded-within-sla>
 | 
Custom tasks | 
Ongoing and offboarding | 
Checks whether custom tasks have been completed | 
If it is a custom task for personnel: The person must sign into Vanta and complete the task based on the instructions. This could include a text submission or file upload (depending on how you configure the task).
If it is a custom task for admins, The admin must mark it as completed.
Learn more <https://help.vanta.com/en/articles/11345604>. | 
N/a. Custom tasks do not have corresponding tests.

## Personnel notifications
Once you assign tasks to your personnel, turn on notifications. Once notifications are enabled, Vanta will automatically notify your personnel when they have incomplete tasks in Vanta.
 
📖 Learn more: Personnel Reminders and Settings <https://help.vanta.com/en/articles/11345593-personnel-reminders-and-settings>

## Images

- [image 01] ../../images/ux/personnel/personnel-tasks--01.png
- [image 02] ../../images/ux/personnel/personnel-tasks--02.png
