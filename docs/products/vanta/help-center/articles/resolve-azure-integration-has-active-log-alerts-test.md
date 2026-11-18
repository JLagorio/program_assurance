# Resolve 'Azure integration has active Log Alerts' test

Source: https://help.vanta.com/en/articles/11345536-resolve-azure-integration-has-active-log-alerts-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This article provides more information on resolving the Azure integration has active log Alerts test. <https://app.vanta.com/tests#azure-integration-log-alarm-used-for-monitoring##0.0>
 

## How to Fix
- 
Navigate to a resource (VM, Database, Storage Account, etc.) in Azure and select logs under the monitoring section:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769706/44463c3aab405b3723fdef908656/17196000833556?expires=1794967200&signature=807d389e978a7c83a434bb0f773fd7f24add428f26034bdb696d6a3230864b7e&req=dSUmEM54lIZfX%2FMW1HO4zfzmdQfhteqSBBnVtexZdlazx9XqD0ycruuLE%2Fv%2B%0AgvSf5EkKB0sMzeaxJB0%3D%0A>
- 
Select Queries and select a query that makes sense for the resource, or write your own:
​
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769698/cd9b4d5b72666099c20fbca61a26/17195957933204?expires=1794967200&signature=9a9608724f4457ae3f03b35fd489f6d26b249cd43b44d630b3a4e9511634cbbd&req=dSUmEM54lIdWUfMW1HO4zcUPjWMlvoYiFdVyVDaXShn02uNzavq67w2Z6OOX%0AGzC7%0A>

​​
- 
Run the query to ensure data is returned.
​
​
- 
Select New alert rule
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769699/61c7294d4c837f5e1a787462f3df/17195964639380?expires=1794967200&signature=4716a7e8ead9032e3710d2f291dd3717ba3302b6841a376e8c1fccfc9ee7f4c1&req=dSUmEM54lIdWUPMW1HO4zb6RCG0y%2BYUJ0ltlOfFl6doYa0JLwx9I050lzs0r%0AOZXZ%0A>
- 
Walk through the rest of the required items from Azure, nothing is explicitly required in the following sections for the Vanta test to pass. More information on how to do this is documented here <https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/tutorial-log-alert>.

## Common Reasons For Failure
- 
The query has been created, but an alert rule has not been created. Ensure that you have created and saved the alert rule entirely.
- 
Ensure that the log alert is enabled. This can also be seen from the test data (see below)
- 
Vanta cannot see the Alert Rule. Ensure that the test data shows the alerts in your Azure instance:
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769697/92a058af933aa2d97c79fc2c6f90/17196000837268?expires=1794967200&signature=87ece6a98f9e17a978f4af81ad1e4ee0183f57a4131ecbd9d1bd7d147f3d60dd&req=dSUmEM54lIdWXvMW1HO4zVxg8GNlQ%2B5iHa1rBGOS64%2BqoT9j9Of3Fp0EYJL4%0A5XBneVTD2Lp0heLNuDc%3D%0A>
Example Data:
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769720/17e74086a4cb71607a70b08a7b23/17195972254228?expires=1794967200&signature=da77caee98f3a1176bcbafcf92e8879d9219451d4c880535734c64cabc2bd859&req=dSUmEM54lIZdWfMW1HO4za95q8Ud2m6ggsvDfKf8JNnsFjgdorNpCGmXeWGt%0ArrT3BAL9ITdA635QKDg%3D%0A>

## What Vanta is checking:
- 
Vanta is checking that at least one of these alerts exists on a resource in your account and that it is active. Your organization must determine which resources require alerts and which metrics are used in the alerts.
- 
If the test is not passing, ensure you have a resource with an alert with a signal type of "log search." To check this, navigate to the "Alerts" tab for a resource and select "Alert rules":
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769723/16f10224efbff16f4ed7712b7e57/19712588717844?expires=1794967200&signature=345d8d4f844068a8e1f3fa4bf4420e49e137d1be6db95fedf00489dbf72ddd96&req=dSUmEM54lIZdWvMW1HO4zbN8HAE3ZuAdnLZ63ViPsFIQoOsCwZAgMkV%2B7Mx2%0AU5u2nKFDFQ%2FhLZAeV4A%3D%0A>
- 
Then check that the one that is enabled has the signal type of "log search":
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769729/7438bd2728db3555b648254b552f/19712652982548?expires=1794967200&signature=e8e7d29557096e174f299399fbf46d5f024c3171773e1c403bc62532594fc839&req=dSUmEM54lIZdUPMW1HO4zRg5Iao09k%2BZIaarrTsBFMj8pyLMh%2BfZDDNGM5Ut%0AwLnBc1vpB1J6TVtEH%2F0%3D%0A>

## Images

- [image 01] ../../images/integrations/azure/resolve-azure-integration-has-active-log-alerts-test--01.png
- [image 02] ../../images/integrations/azure/resolve-azure-integration-has-active-log-alerts-test--02.png
- [image 03] ../../images/integrations/azure/resolve-azure-integration-has-active-log-alerts-test--03.png
- [image 04] ../../images/ux/tests/resolve-azure-integration-has-active-log-alerts-test--04.png
- [image 05] ../../images/documentation/resolve-azure-integration-has-active-log-alerts-test--05.png
- [image 06] ../../images/integrations/azure/resolve-azure-integration-has-active-log-alerts-test--06.png
- [image 07] ../../images/integrations/azure/resolve-azure-integration-has-active-log-alerts-test--07.png
