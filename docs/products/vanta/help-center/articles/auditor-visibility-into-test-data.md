# Auditor Visibility into Test Data

Source: https://help.vanta.com/en/articles/11345526-auditor-visibility-into-test-data
Collection: Evidence Collection ; Evidence Collection › Tests
Fetched: 2026-11-17

## Article text

When auditors access an audit in Vanta, they navigate to the Evidence section to review all tests and documents you’ve shared. Opening a specific test allows them to access the Test Evidence tab—a streamlined version of the Evidence tab <https://help.vanta.com/en/articles/11345529-test-source-data> that shows only the information needed to validate the control for that test.
 
The Test Evidence tab was previously called Test Source Data. We’re gradually rolling out this upgraded experience to all customers. If your organization is currently in an active audit, you’ll still see the older Test Source Data tab for now.
 

## What Auditors See
Auditors see only the information required to validate the controls in scope for your audit. This includes:
- 
Tests in scope for the frameworks in your audit
- 
Test results within the audit’s observation window (the period from audit start to end date)
- 
Overall test statuses based on SLA deadlines
- 
Resources that are out of scope or deactivated, without exposing underlying data
- 
Issues discovered and remediated during the observation window
​
Some scoping behavior depends on whether a test has been upgraded to the new experience. For upgraded tests (with the new Test Evidence tab), auditors see only in-scope resources within the evidence table. For legacy tests (with the legacy Test Source Data or tests that show a Test Data section), framework scoping is not applied to the test data table. However, all test statuses and their exports, regardless of test, respect framework scoping.
 

## Example Scenarios
Here are some examples of what auditors will or won’t see during your audit:
 | 
Scenario | 
Visible to auditor
 | 
A failing item discovered during the observation window was remediated after its SLA deadline | 
✅ Yes
 | 
A failing item discovered during the observation window wasn’t remediated before the SLA deadline | 
✅ Yes
 | 
A failing item discovered during the observation window has no SLA and hasn’t been remediated | 
✅ Yes
 | 
A resource that was deactivated from monitoring with a reason provided | 
✅ Yes (resource name + deactivation reason only)
 | 
A resource marked out of scope for the framework | 
✅ Yes (resource name + exclusion reason only)
 | 
A failing item discovered during the observation window was remediated before the SLA deadline | 
❌ No
 | 
A failing item was fixed before the observation window began | 
❌ No
 | 
A failing item whose SLA deadline falls after the observation window ends | 
❌ No
 | 
Raw API request and response data | 
❌ No
 
See exactly what an auditor sees. Go to Compliance > Audits using the navigation menu in your account to view Vanta as an auditor <https://help.vanta.com/en/articles/11345983-how-to-view-vanta-as-an-auditor>.

## Images

- none
