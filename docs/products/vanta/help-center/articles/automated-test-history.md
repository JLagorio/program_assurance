# Automated Test History

Source: https://help.vanta.com/en/articles/11345515-automated-test-history
Collection: Evidence Collection ; Evidence Collection › Tests
Fetched: 2026-11-17

## Article text

Understanding how automated tests behave in Vanta is key to confidently managing your compliance posture. Depending on whether a test falls under Vanta’s SLA (Service Level Agreement) tracking system, the history view may vary; some tests track the overall pass/fail status over time, while SLA-enabled tests focus on how long individual failing entities have remained unresolved. This distinction helps teams prioritize remediation efforts based on urgency and duration of non-compliance.
 

## History Tab - SLA Category Tests
The History tab on an automated test’s detail page displays past test results, but how that history is shown depends on whether the test is part of Vanta’s SLA (Service Level Agreement) system. Many automated tests are linked to an SLA category, which means Vanta doesn't just track whether the test passes or fails as a whole; instead, it monitors how long individual failing items (such as users, devices, or resources) remain non-compliant. This helps teams focus on resolving long-standing issues, not just the most recent ones.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767497/1174feeabfe469924d78ad4abdf4/37212503218068?expires=1794967200&signature=95ddaa4b40065d8c819e759288afaec08bef9cb076012f3a1783dc3cf104038f&req=dSUmEM54moVWXvMW1HO4zfqZ6b20LwNGgU0jSIKES05tP8UpXHNO9zZVZNn7%0A9U26OLpKH4yQt8naBLc%3D%0A>
If you are pursuing multiple frameworks at once, the status of this test may vary by framework over time. The provided filters can help you narrow down the results.
- 
Select the dropdown under Remediation history to select the desired resource.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767491/7b6a12490ed40a050d9a733abcc8/37212468300308?expires=1794967200&signature=2158e247caa30d0ec9a6fdfe67389726baa9d728e496df5a08951ed128193cb7&req=dSUmEM54moVWWPMW1HO4zTUYnkXt1t9%2F%2F9kUUv0PjAa3OxhWuRknQKPgDgtO%0AH8uBX%2FNGh4MbeMtpmTY%3D%0A>
Additional filters
- 
With due date / without due date
- 
Remediation status
- 
Within SLA
- 
SLA Missed
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767499/3514a4149405f9ecc4451e9489dc/37212468300692?expires=1794967200&signature=14fb1b8a765183d9139be042063c42e9cf6f159b8793bdb56f92ea0d4aefc112&req=dSUmEM54moVWUPMW1HO4zReghNyw0q6%2BRibnDNHxCJH5mjwO%2Fcm6%2BBsd34v9%0AViEXu9ZAoATE%2F%2BLmzss%3D%0A>

## History Tab - Non-SLA Category Tests
Some automated tests in Vanta don’t evaluate individual entities (like users or devices). Instead, they track whether the test as a whole is passing or failing. For these tests, the History tab shows a horizontal timeline bar:
- 
Green segments indicate periods when the test was passing
- 
Red segments indicate when the test was failing
- 
Gray segments show when the test wasn’t run or wasn’t applicable during that time
This visual helps you quickly understand how consistent your compliance has been for a specific control over time.
 

## Audit Page: History in the Automated Test Evidence View
To Access the audit page:
- 
Select Audits from the left-hand navigation panel
- 
Open the audit
- 
Select the evidence you would like to view the details of
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767503/604fb15cd85b3e4abdc713d6b64d/37212468300948?expires=1794967200&signature=0756e468f1cdc3270bf2533ac4cf1c2379f09afe62a5aeed2098094a6641e1ca&req=dSUmEM54moRfWvMW1HO4zcKPHSaSFodnFXqSIbs27pbjas7qxp26eP1QHs0o%0ALP1qqTss9EuaLgP0gOs%3D%0A>
The “View History” in the Details tab of the evidence drawer provides a more detailed look at the test’s performance over time. This allows you to demonstrate consistent compliance or explain any remediation work done if issues were previously flagged. These views give auditors the context they need to validate ongoing control effectiveness. The "View history" button will store history throughout the audit period.
- 
For automated SLA system tests, we render a table view showing entities not remediated by the SLA deadline.
- 
We will show a line graph if a test does not use the SLA system.

## Audit Page: Audit Activity
The Audit Activity tab inside the automated test’s evidence drawer shows a summary of when the test was reviewed or used as audit evidence <https://help.vanta.com/en/articles/11345427>. This helps track activity during your audit period.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767519/67a2d5c95ce9203396ab19416021/37212503219604?expires=1794967200&signature=6fd5390f08b5a3daff6aa93b4838f8a4588be8b9d1014f2a57849619c7fb6c47&req=dSUmEM54moReUPMW1HO4ze9bPPWrqdIq%2BQ5t9q7rKI54KUSnZm2ogclT5Ud5%0AcKNtC4hq%2Buxfntj5ba8%3D%0A>

## Automated Test Evidence List Determination
There are a few factors that can influence whether a test appears in a particular audit:
- 
The automated test must be mapped to at least one control, which in turn is mapped to the framework under audit.
- 
The automated test must be deemed applicable (see a note on test applicability).
- 
If the framework scoping feature <https://help.vanta.com/en/articles/11345359> is used and the automated test depends on assets scoped out, that may also affect the test segment's applicability for that framework scope (see a note on test applicability).

## A Note on Test Applicability
- 
To see an automated test appear in the evidence view or on the tests page, the test must be considered applicable to your Vanta setup. This means Vanta needs the right data to run the test. For example, if a test relies on data from an integration you haven’t connected (like AWS or GitHub), Vanta will automatically mark that test as not applicable. The same applies if you’ve scoped out certain assets or frameworks using Vanta’s integration scoping or framework scoping features. This helps keep your view focused and prevents irrelevant tests from cluttering your dashboard.
Deleting an integration is a permanent action that can impact your compliance visibility. If you remove an integration, any Vanta-built automated tests relying on data from that connection may disappear from your tests page and audit evidence view. Be sure you understand what’s connected before making changes.
 

## Choosing an Audit Window that Includes Past Dates
When creating an audit in Vanta, it's essential to understand how test history is tracked, especially if your audit window includes dates in the past.
For example, if you create an audit on May 1st and set the audit window to span April 1 to May 30, some test history, like results from April, will already exist and may appear in your audit evidence. This can lead to two different types of historical behavior, depending on how you're viewing the test:
- 
Audit Activity Tab: Tracks Usage from the Date the Audit Is Created. This tab logs when a test is actively used for audit purposes. It only starts tracking when the audit is created (in this case, May 1).
So, even if the test failed on April 6, you won’t see audit activity recorded for that event because it happened before the audit was created.
- 
“View History” Button: Displays full test results within the audit window. This button provides the actual test results across the entire audit period, including dates before the audit was created.
So if your audit runs from April 1 to May 30, you’ll still see failing test results from April 6, even though the audit was only created on May 1.
This allows auditors to view the compliance status throughout the whole window, not just from the point of audit creation.
Please note: If the test becomes inapplicable (due to scoping or integration removal) on or before May 1, it won’t appear in the audit evidence view, even if it failed earlier in the audit window.

## Images

- [image 01] ../../images/ux/tests/automated-test-history--01.png
- [image 02] ../../images/ux/tests/automated-test-history--02.png
- [image 03] ../../images/ux/tests/automated-test-history--03.png
- [image 04] ../../images/ux/audits/automated-test-history--04.png
- [image 05] ../../images/ux/audits/automated-test-history--05.png
