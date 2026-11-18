# Why does my Test count change?

Source: https://help.vanta.com/en/articles/11346086-why-does-my-test-count-change
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

Your total test count in Vanta changes as your integrations, compliance scope, and Vanta's test library evolve. The most common reasons include: 
- 
Tests marked as Not Applicable due to missing data or disconnected integrations
- 
Integration changes (added, removed, or connection errors)
- 
Changes to your compliance framework scope
- 
Test version updates entering the preview period
- 
Tests removed or replaced by Vanta
- 
Tests manually activated or deactivated
Each reason is explained below. 
 
 

## Tests become "Not Applicable"
A test may show as Not Applicable or disappear from your count when Vanta doesn't have what it needs to run it. Common reasons:
- 
An integration was disconnected or removed.
- 
Assets or resources were scoped out of a compliance framework.
- 
Vanta doesn't have enough data to evaluate the test.
- 
Required resources (such as repositories or accounts) weren't detected.
 

## Integrations and compliance scope
Each test is linked to one or more integrations. Your test count changes when:
- 
An integration is removed — tests that depend solely on that integration may show as Not Applicable and no longer count toward your active test total. 
- 
An integration has a connection error — affected tests may show warnings or errors until the connection is restored.
- 
A new integration is connected — tests for that integration are added to your count. 
- 
You change your framework scope or exclude assets from a compliance program — tests that apply only to excluded assets may no longer appear.
 

## Test updates and upcoming versions
When Vanta updates an existing test, you may see a banner on the test indicating that a new version is coming soon. This preview period gives you time to remediate any new issues before the updated test becomes visible to auditors, history tracking begins, and (if SLA deadlines are enabled) SLA timers start on the new version.
 
Once the preview period ends, the updated version becomes the active test and the previous version is removed. This temporarily increases your test count by one for each test being updated.
 
For more details, see What is an Upcoming Test <https://help.vanta.com/en/articles/11345481-what-is-an-upcoming-test>?
 
 

## Tests removed by Vanta
Vanta occasionally removes or replaces tests that are outdated or superseded by improved versions. When this happens, the affected test is removed from your count automatically. You don't need to take any action. If you notice a test disappear without any changes on your end, this is likely the reason.
 
 

## Manually activating or deactivating tests
Manually activating or deactivating <https://help.vanta.com/en/articles/11345549-deactivate-a-test> a test also changes your count. When deactivating a test, you can choose to set a reactivation date. If a date was set, the test will reactivate automatically when that date arrives. Check the test details for any scheduled reactivation date.
 
 

## How to investigate a count change
If your test count changed unexpectedly, start here:
- 
Check your integrations — go to your integrations list and confirm all expected integrations are connected and showing no errors.
- 
Review your framework scope — confirm no assets or resources were recently excluded from your compliance programs.
- 
Look for Upcoming tests — an increase in count may reflect a new version of an existing test entering the preview period.
- 
Open the affected test — go to the Evidence (or Source data) tab and check the Out of Scope section to see which resources were excluded from the test. This helps you identify which resources caused the test to stop running. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2259098011/5ca35476e6d657b85981843b418e/image.png?expires=1794967200&signature=dca2ed0fb0c5078e619354051558ffb5396db8a7e1df29c59355f329f9877c10&req=diIiH8l3lYFeWPMW1HO4zfH4FDfk0IBvPwYTION89zGgM%2FXSpHehWJ4CTG%2F5%0Aos08R95a6crA1ctbsiI%3D%0A>
 
If you've checked all of the above and still can't identify the cause, contact Vanta Support.

## Images

- [image 01] ../../images/ux/tests/why-does-my-test-count-change--01.png
