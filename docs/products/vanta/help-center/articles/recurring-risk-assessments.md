# Recurring Risk Assessments

Source: https://help.vanta.com/en/articles/17709791-recurring-risk-assessments
Collection: Risk, TPRM & AI Gov ; Risk, TPRM & AI Gov › Risk Management
Fetched: 2026-11-17

## Article text

✅ Feature availability: Recurring risk assessments are included with Core Risk Management. Some features (including multi-step assessment approvals) require Advanced Risk Management. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Recurring risk assessments turn risk assessments from an ad hoc task into a set schedule. After configuring your assessment schedule, owners need to complete new risk assessments for their risk scenarios during each assessment window and submit them for approval before the due date. Approvers can see at a glance what changed since the last approval, or confirm that nothing has. Each approval is recorded, so there’s a clear record of when a risk scenario was last assessed.
 
⚙️ User permissions: Editors and Admins can edit risk settings and edit all risk scenarios. Collaborators can be assigned as Risk Scenario Owners to edit their risk scenarios and submit assessments for approval. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Assessment schedule
Each risk scenario has a risk assessment that its Risk Scenario Owner needs to complete. Risk assessments are meant to be completed more than once, either when you decide or on a set schedule. The recurring risk assessments setting lets you choose which. One schedule applies to all risk scenarios in your workspace. Here’s what each setting does:
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2759959561/555e71999b29c67b288086d15ecc/image.png?expires=1794967200&signature=55e40d98b768c03413b44d54e83238a0fc340333d1c0ca0da082d35a0c554d09&req=diciH8B7lIRZWPMW1HO4zSgIJSPTLwONhY%2Flstct%2F3gYjV1C6A78W8Ha8Bv0%0AP%2BnB7%2BccrThiLljrGkk%3D%0A>
 | 
Recurring risk assessments | 
Description
 | 
Disabled (default) | 
Risk assessments are ad hoc. You decide when to complete a new risk assessment for a risk scenario.
 | 
Enabled | 
Risk assessments are on a set schedule. Each assessment window runs from a start date to a due date. A new risk assessment needs to be completed for each risk scenario by the due date.
 

### Enabling recurring assessments
 
Turn on recurring risk assessments to set one schedule for all risk scenarios in your workspace. The schedule sets when each assessment window starts, how often it repeats, and when assessments are due.
 
To turn on recurring risk assessments:
- 
Go to Settings > Features > Risk.
- 
In the General tab, scroll to Recurring risk assessments and turn on Enable.
- 
Select a Start date:
- 
This is the date the first assessment window starts.
- 
Select a Recurrence: 
- 
Choose from every 3 months, 6 months, or 12 months.
- 
This determines the date future assessment windows start.
- 
Select an Assessment due:
- 
Choose from 1 month, 2 months, or 3 months after the assessment starts.
- 
This sets how long after an assessment window starts that assessments are due. That determines the length of the window.
- 
The options depend on your Recurrence. For example, if you selected 3 months, you can’t select 3 months for Assessment due, because assessments must be due before the next window starts.
- 
Click Save.
​
⚠️ Note: Saving applies the current assessment window right away. If your start date is today or in the past, risk scenarios last approved before the window started will have an assessment status of Due soon or Overdue. Risk Scenario Owners need to submit a new risk assessment for approval to update the assessment status to Completed.
 

### Disabling recurring assessments
 
Turn off recurring risk assessments to stop scheduling risk assessments. Since risk assessments will no longer have an assessment window or due date, the Assessment status column is removed from risk registers.
 
To disable recurring risk assessments:
- 
Go to Settings > Features > Risk.
- 
In the General tab, scroll to Recurring risk assessments and turn off Enable.
- 
Click Save.
​
⚠️ Note: Saving turns off recurring risk assessments right away. Assessment statuses are removed, and nothing else changes. Risk scenarios that are pending approval or approved stay as they are.
 
 

## Assessment status
When recurring risk assessments are enabled, an Assessment status is added to each risk scenario indicating which risks need attention. To locate them, you can filter by assessment status within risk registers and hover over the status for more info on the assessment window. Here’s what each assessment status means:
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2759959411/d4d070221f79f7d75a58c35ee169/image.png?expires=1794967200&signature=c74190ca96fa445f7ac28d4e7807dc2f2c673c9f94a066a2abbf3af7e2fc8205&req=diciH8B7lIVeWPMW1HO4zTbh0Zn%2FNIS1kWgB1tbB%2FZii5XyyE9NvgA06JAFf%0Aar5rVWrUQpmHvR7QJn4%3D%0A>
 | 
Assessment status | 
Description
 | 
Not started | 
Recurring risk assessments haven’t begun for this risk scenario. They begin once its initial risk assessment is completed and the next assessment window starts.
 | 
Due soon | 
The risk assessment for the current assessment window hasn’t been completed and approved, and the current date is between the start date and due date.
 | 
Overdue | 
The risk assessment for the current assessment window hasn’t been completed and approved, and the due date has passed.
 | 
Completed | 
The risk assessment for the current assessment window was approved.
ℹ️ Note: A risk scenario can have an approval status of Approved and an assessment status of Due soon or Overdue. An approval from before the current assessment window doesn’t count for that window. Once a new risk assessment is approved, the assessment status changes to Completed until the next assessment window starts.
 
 

## Assessment approvals
To complete a recurring risk assessment, the Risk Scenario Owner needs to (1) complete the risk scenario to ensure all required fields are filled out accurately and (2) get the risk assessment approved. You can filter by Approval status within risk registers to locate assessments pending approval. Here’s what each approval status means:
 | 
Approval status | 
Description
 | 
Draft | 
The default status when a risk scenario is created. The risk assessment is missing required fields, such as an owner, risk scores, or treatment plan.
 | 
Needs review | 
The risk assessment has all required fields but hasn’t been submitted for approval yet, or it was returned because changes were requested or made after approval.
 | 
Pending approval | 
The risk assessment has been submitted and is waiting for approval. You can’t edit the assessment until it’s approved or you cancel the approval request.
 | 
Approved | 
The risk assessment has been approved by all required approvers.
 

### Completing the new assessment
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2759960697/4db1455e8760b6313cb1b61b1718/image.png?expires=1794967200&signature=0e590063660c5067a6ec99cc86d6830834efddc531dc522eba564cf33d5842d2&req=diciH8B4nYdWXvMW1HO4zTu9KoLYx6vEXDJAtFRhk60EvAMDNKWvVkNT4VZq%0AIJLWxLMYqfsHkiexYpQ%3D%0A>
 
To complete the new risk assessment:
- 
Review the risk scenario:
- 
Confirm risk details and context.
- 
Update risk mappings.
- 
Evaluate the individual risk ratings that roll up into overall risk scores.
- 
Update the treatment plan.
- 
Review changes in the Complete assessment section:
- 
Compare the overall risk scores and treatment type with the last approved risk assessment.
- 
If nothing changed, the card says there have been no changes since the last assessment.
- 
If something changed, the card shows an arrow from the old value to the new one.
- 
If the risk hasn’t been approved before, there’s no prior assessment to compare it to.
- 
Assign approvers and submit:
- 
If the risk scores or treatment type changed, enter a review comment that explains why. A comment is required.
- 
Otherwise, you can confirm no changes without a comment
 

### Approving the new assessment
 
You can find risk assessments that need your approval from the My work page or by filtering risk registers by Approver. 
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2759960150/cb4e682de070b06adb2297fcc1f7/image.png?expires=1794967200&signature=09a5c0f3f90891d35a861ab391348a29b4264d88693fb8b42d284e9ad22c5172&req=diciH8B4nYBaWfMW1HO4zdS%2FWGSriJgaFn1f5bUQgVBJcfC%2FwbxyhqNqCoiC%0A8qGLicQZT0fjdDr2I38%3D%0A>
 
Open the risk scenario to review the assessment. In the Approval section, you can compare the overall risk scores and treatment type with the last approved risk assessment. A change shows as an arrow from the old value to the new one. Then submit your decision to approve the risk assessment or request changes.
- 
If the only approver is the person submitting, the risk scenario moves to Approved as soon as they submit it.
- 
If the only approver is someone other than the person submitting, the risk scenario moves to Pending approval until that approver approves it.
- 
If there are multiple approval steps, the risk scenario moves to Pending approval until all approvers approve it.
- 
If an approver requests changes, the risk scenario moves to Needs review and it needs to be resubmitted.
Once all required approvers approve, the approval status changes to Approved. If the assessment status was Due soon or Overdue, it changes to Completed.
 

### Approval history
 
Each risk scenario has an Approval history tab that lists past approvals. A risk assessment appears here after it’s approved—each entry shows the overall risk scores, treatment, controls, and tasks as they were when it was approved, along with an activity log of submissions and decisions, including any review comments.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2759963900/2124fc393c5fd0ca0face22b346e/image.png?expires=1794967200&signature=a4c5687621fa367a93ba064b8e6c5bc1a221d66865406500b430313f4ccdb2fb&req=diciH8B4nohfWfMW1HO4zVZ8EGbykLwYmptz7k6SqobP9Y27YW2cy5a4A6oR%0AsvqW15fUVI6BtQO26R8%3D%0A>
 
📖 Learn more: Completing Risk Assessments <https://help.vanta.com/en/articles/15089313-conducting-risk-assessments>

## Images

- [image 01] ../../images/ux/settings/recurring-risk-assessments--01.png
- [image 02] ../../images/ux/risk/recurring-risk-assessments--02.png
- [image 03] ../../images/ux/risk/recurring-risk-assessments--03.png
- [image 04] ../../images/ux/risk/recurring-risk-assessments--04.png
- [image 05] ../../images/ux/risk/recurring-risk-assessments--05.png
