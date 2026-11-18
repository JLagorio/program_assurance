# Managing SLAs

Source: https://help.vanta.com/en/articles/11346006-managing-slas
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

In Vanta, SLAs help you enforce standards, speed up response times, and stay audit-ready. You can edit Vanta's default SLA categories or create your own custom SLA categories and apply them to any current test.
 
 

## Editing an SLA
To edit an existing SLA:
- 
Go to Settings and select SLAs from the page menu.
- 
Click into any SLA to open it.
- 
Click the ••• menu at the top and select Edit SLA.
- 
Update the deadline and toggle the SLA on or off as needed.
- 
Click Update.
You can also access SLAs from the Tests <https://app.vanta.com/tests> or Policies <https://app.vanta.com/policies> pages by clicking the three-dot button in the top-right corner and selecting Manage SLAs.
 
ℹ️ Note: Changes to an SLA deadline apply to new items only. Items that are already failing will keep their current deadline until they pass, then follow the updated SLA going forward.
 
 

## Creating a custom SLA category
You can create custom SLA categories to reflect your team's response expectations and apply them to any current test—including both Vanta-built and custom tests.
 
To create a custom SLA category:
- 
Go to Settings and select SLAs from the page menu.
- 
Click Create SLA in the top-right corner.
- 
Enter a Name and optional Description.
- 
Set a Deadline using hours, days, or business days. 
- 
Click Save.
​
📖 Learn more: The deadline is calculated from the exact detection timestamp. See: How Vanta Calculates Vulnerability SLAs <https://help.vanta.com/en/articles/11951321-how-vanta-calculates-vulnerability-slas>
 
 

## Applying an SLA to a test
There are two ways to assign or change the SLA category for a test.
 
From the SLA detail view:
- 
Go to Settings and select SLAs.
- 
Click into any SLA to view its associated tests.
- 
Click Add test to assign a new test to that SLA category
From a specific test:
- 
Go to Settings and select SLAs.
- 
Click into any SLA to view its associated tests.
- 
Click the ••• menu next to a test and select Change SLA.
- 
Select an SLA category from the dropdown, or click Create Custom to create a new one.
- 
Click Save.
 
 

## Using business days for SLAs
When you set a deadline in business days, Vanta skips weekends when calculating due dates. Business-day deadlines are available for categories like account access revocation, onboarding, vulnerabilities, and security issues.
 
ℹ️ Note: Business-day deadlines skip weekends but preserve the exact time of day a finding was detected. For example, a finding detected at 1:24am will be due at 1:24am on a future business day. Business hours are not supported.
 
 

## Onboarding and offboarding SLAs
To edit onboarding and offboarding SLAs:
- 
Go to Settings and scroll to the Features section.
- 
Select Personnel, then go to the SLAs tab.
- 
Adjust your onboarding and offboarding SLA deadlines.
​
 

## Troubleshooting: SLA visibility issues
If SLAs or due dates aren't appearing for vulnerabilities, check whether the related vulnerability tests are active. SLA calculations depend on those tests being turned on.
 
To resolve this:
- 
Reactivate the relevant vulnerability tests (for example, GitHub vulnerability tests).
- 
Once reactivated, SLA due dates will apply to new vulnerabilities detected going forward.
​
ℹ️ Note: Reactivating a test does not apply SLAs retroactively to previously identified vulnerabilities.

## Images

- none
