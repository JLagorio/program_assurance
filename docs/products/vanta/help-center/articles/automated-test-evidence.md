# Automated Test Evidence

Source: https://help.vanta.com/en/articles/11345529-automated-test-evidence
Collection: Evidence Collection ; Evidence Collection › Tests
Fetched: 2026-11-17

## Article text

✅ Feature availability: The Evidence tab was previously called Source Data. We’re gradually rolling out this updated experience to all customers. If your organization is currently in an active audit, you’ll still see the older Source Data tab for now.
 
The Evidence tab gives you a clear view of how each automated test was run—what it checks, which resources it evaluated, and the data supporting the result. It helps you validate test outcomes, understand why a test passed or failed, and provide auditors with reliable, audit-ready evidence.
 
 

## Evidence tab
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1851851866/f7835a796872df25d3ed73931f8f/Evidence+Tab.png?expires=1794967200&signature=a0ce4c8cd894ab800a4d4fbbe36810574981e9cb950d0c8345e3e239e7e6a9ce&req=dSgiF8F7nIlZX%2FMW1HO4zWS%2FBDByAnA%2BDlAU%2BA1GWgSrCIJIjdEsn8a6qu4S%0AifGBZeeKTN7IPw0tsRA%3D%0A>
 
The Evidence tab is the central place to review and understand the details for how a test was run and the evidence your auditors will be provided once shared.
 
To open the Evidence tab:
- 
Go to Tests using the navigation menu in your account.
- 
Click the relevant automated test to open the Results tab.
- 
Click the Evidence tab and scroll through each section of the page.
- 
Note: The sections available in the Evidence tab depend on the test.
 

### Test Criteria
 
The Test Criteria section explains what a test checks and the logic it uses to determine whether resources pass or fail. It gives you and your auditors a shared understanding of a test’s purpose, logic, and data inputs—reducing confusion and helping verify that automated evidence matches audit expectations.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1861271658/aff5c74fd9a5433d5ef193dd7297/Test+Criteria.png?expires=1794967200&signature=8bf91a70cd9aa1cd961f9c6aee62962f55178479a0f77be6e5be87ee5b22b928&req=dSghF8t5nIdaUfMW1HO4zc4fxyVkNP66u2Ktdu%2FS5eKRl3NvIBCORPhw0ftR%0AD%2Fr0DFb5cskhQCWR%2FOE%3D%0A>
 
To view the Test Criteria section:
- 
Open the Evidence tab for the relevant automated test.
- 
Under the Test Criteria section, click Show more to review key information about the test.
- 
At the top of the section, toggle the view to Logic to see the test scope and evaluation logic.
 
 

### Test Evidence
 
The Test Evidence section (sometimes referred to as the Evidence Table) shows a detailed view of every resource evaluated by the test, its status, and the underlying data used to determine that status. This view increases transparency, helps you quickly identify and remediate issues, and provides auditors with reliable, itemized proof of your test results to help you demonstrate audit-readiness.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859648391/a148ff8827b241b93e3591922b20/Test%2BEvidence.png?expires=1794967200&signature=7667cb3cf38c6ad621412693e5f11444f2df226b25f818629f71e96233222c65&req=dSgiH896lYJWWPMW1HO4zTRFWXc7wZWLCM4p21i9YV8lwIM2VbkRuwKN6YwD%0AY%2BPIoeF8bqA6fhrlLE0%3D%0A>
 
To view the Test Evidence section:
- 
Open the Evidence tab for the relevant automated test.
- 
Scroll to the Test Evidence section to review the evidence table. 
- 
Click a row in the table to open the side panel and review detailed information about the selected resource.
- 
Review the table to see the status for each resource:
- 
Ok: The resource meets the evaluation criteria for the test.
- 
Not Ready: The resource doesn’t meet the evaluation criteria for the test.
- 
N/A: The resource was evaluated but doesn’t affect the overall test status.
Each test has its own evaluation criteria. Not all tests require every in-scope resource to pass for the overall test to be marked as passing. If a result seems unexpected, check the Out-of-Scope section to confirm whether specific resources were excluded for the framework you’re viewing.
 
 

### Out of Scope
 
The Out of Scope section lists any resources that were removed from the frameworks relevant to the test. It improves transparency by showing exactly which resources were not evaluated and why—helping explain unexpected pass or fail outcomes and allowing auditors to confirm that the test scope is complete.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859656025/643a2ce5ac0c2b319a766165f0fa/Out%2Bof%2BScope.png?expires=1794967200&signature=aa8e86201b9700a6ab018110243d2df8a9a424e6e6cd96a32965115213078739&req=dSgiH897m4FdXPMW1HO4zYucgM%2F2LjWDexfi5hx1kESmJNg42ifV8z2cLl3C%0AuPHr%2FZRmhI0ah%2FZrTQI%3D%0A>
 
To view the Out of Scope section:
- 
Open the Evidence tab for the relevant automated test.
- 
Scroll to the Out of Scope section to review which resources were removed per framework.
 
 

### API Requests
 
The API Requests section shows when and how Vanta retrieved data from an integrated service. It provides visibility into the specific API calls made during the test run, helping you troubleshoot issues or confirm that data was fetched successfully.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859657422/d5b62715c45dfc9a27ad35437d06/API%2BRequests.png?expires=1794967200&signature=9d600c32b1c0723263f3d69ed9f6cf5027a0a7fdf5627cf80339b2e50de7d565&req=dSgiH897moVdW%2FMW1HO4zS%2BmIlafJjEu3tyarfdPZMXYTse5CorYYJVtwwM5%0Aw%2BzOMfn4b81SqikEa8o%3D%0A>
 
To view the API Requests section:
- 
Open the Evidence tab for the relevant automated test.
- 
Scroll to the API Requests section to see a list of all API calls made, including the date, resource type, method, URL, and response status.
- 
Click any request to view detailed information, including request headers and the response data.
When investigating a failed or unexpected test result, use this section to compare the request and response details within the Test Criteria or Test Data sections. This transparency helps confirm what data was retrieved and ensures confidence in how Vanta evaluates your connected resources.
 
 

### Exports
 
The Exports section lets you download an immutable copy of the latest automated test run, complete with full metadata. Each export contains the most recent automated test run and is locked to preserve audit integrity. This export serves as audit-ready proof that meets auditor requirements and reduces the need for manual evidence compilation.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1859658458/fc2e5022c90b49ba4e283b0a501c/Exports.png?expires=1794967200&signature=c45ea40f007aa8507f5a94bce3874ecca41fdc9f2fb59eaa8eefd87139d288ce&req=dSgiH897lYVaUfMW1HO4zTz1TlMnDLWkAVZ8OkM4EeGCguc4KiBjpFXnU1%2BN%0A8NkL7CfOIEBc8EhNuWY%3D%0A>
 
To export test evidence:
- 
Open the Evidence tab for the relevant automated test.
- 
Scroll to the Exports section.
- 
Choose the Workpaper option to download an immutable export designed to meet auditor standards.
If you have the Source Data tab instead of the Evidence tab, exports are available under Full test results. Once migrated to the new Evidence tab, you’ll also be able to download the workpaper export.
 
We’re upgrading tests, so the sections you see in the Evidence tab may vary. Some tests don’t include Test Criteria or Test Evidence yet, but these sections will be added to more tests over time. In the meantime, you might see a Test Data section instead, which lists the input data used in the test and lets you click any row to view the JSON details for each input.
 
 

## Source data tab
The Evidence tab was previously called Source Data. We’re gradually rolling out this updated experience to all customers. If your organization is currently in an active audit, you’ll still see the older Source Data view for now.
 
Accounts using the older view won’t yet have access to:
- 
The Test Criteria or Test Evidence sections—you’ll see a Test Data section instead.
​
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1851854101/1445dee70b9641034aad7a7f0838/Test+Data.png?expires=1794967200&signature=7d6ebfcf6d9c32549376070ee0105a61e28d2b052c21bceb47d5b97376f7cf7b&req=dSgiF8F7mYBfWPMW1HO4zfQY2lUC4rWCfaqiLXbd7i61c2SfUOZ6vblQywES%0AJzcN%0A>
 
- 
The Out of Scope section—you can view what resources are in scope or removed by going to Compliance > Frameworks using the navigation menu in your account, selecting the relevant framework, and clicking the Scope tab.
- 
The new workpaper export—you’ll still be able to export test runs.
In the auditor view, Test Source Data is being updated to Test Evidence for consistent naming.
 
 

## Auditor view
When you share automated tests with auditors, they’ll see the Test Evidence view (formerly Test Source Data), which has the same structure and sections as your Evidence tab.
 
This allows auditors to independently verify the completeness and accuracy of test results. However, some information—such as detailed API request and response data—remains visible only to you for security and privacy reasons. Read more about Auditor Visibility into Test Data <https://help.vanta.com/en/articles/11345526-auditor-visiblity-into-test-data>.

## Images

- [image 01] ../../images/ux/tests/automated-test-evidence--01.png
- [image 02] ../../images/ux/tests/automated-test-evidence--02.png
- [image 03] ../../images/ux/tests/automated-test-evidence--03.png
- [image 04] ../../images/ux/tests/automated-test-evidence--04.png
- [image 05] ../../images/ux/tests/automated-test-evidence--05.png
- [image 06] ../../images/ux/tests/automated-test-evidence--06.png
- [image 07] ../../images/ux/tests/automated-test-evidence--07.png
