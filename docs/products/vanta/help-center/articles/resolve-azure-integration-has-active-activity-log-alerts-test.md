# Resolve 'Azure integration has active Activity Log Alerts' test

Source: https://help.vanta.com/en/articles/11345535-resolve-azure-integration-has-active-activity-log-alerts-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This article provides an example of a creation of an alert rule which would make the Azure integration has active Activity Log Alerts test <https://app.vanta.com/tests#azure-integration-activity-log-alarm-used-for-monitoring##0.0> pass.
 

## Create the Rule
- 
Rules can be created from the Monitor service in Azure <https://portal.azure.com/#view/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/~/alertsV2>, or from the Alerts option in a specific Azure resource.
- 
Select Create and then Alert Rule
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769679/c2d716de018f49972f913f065f7c/30070834865940?expires=1794967200&signature=0eaafc5b385e9d7481b5c1c33b674ee51af97136174aac9cfa11e8068fe9e64b&req=dSUmEM54lIdYUPMW1HO4zW1u636MiLuMhMwyuZsBkOebOtO32dAT1ShJMGy2%0ANCX5hcNZJks0t0S1J7I%3D%0A>
- 
The next step is choosing the scope for the alert. In this example, we choose the entire subscription and then select Apply.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769684/6883985a4cb706ff2b8c4b2ae935/30070843549588?expires=1794967200&signature=634972406042891492a3de9c43f7035ffecb9343641c3feece46b2fdd03690f0&req=dSUmEM54lIdXXfMW1HO4zTaIg0xtq7C1%2Bs5dRSpoLgWBhDdC60PNVvu0a8N4%0A%2F%2BgAvUcrhqwxXgXwZaY%3D%0A>
- 
Next, a condition must be entered, and a signal must be chosen. The Azure integration has an active Activity Log Alerts test that <https://app.vanta.com/tests#azure-integration-activity-log-alarm-used-for-monitoring##0.0> looks for alerts with “Resource health” or “Activity log” as signal types. Therefore, we choose “Resource health” as the signal in this example.
- 
After your condition is chosen, select Apply.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769685/f913dbbc2e61c2b5447f73acfc2f/30070834903316?expires=1794967200&signature=8cb5107c7a9e64a7a8bc29d584fa8af67186228985d20a436adf2934227a5631&req=dSUmEM54lIdXXPMW1HO4zRy00rZE8RgIfIl94%2BprVnZnuWuWaxCanwjo9COC%0AoUIn3X%2BKm1o3s7lS0KQ%3D%0A>
- 
Set any actions that make sense for your organization on the Actions tab
- 
On the details tab, select the Resource Group that will host the Alert rule and name the Alert rule.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769682/a107d9b33965b42ced51de049709/30070843559444?expires=1794967200&signature=fb1d18bc056bb735a625345e8070d50b06dff09494537d0ba0c45b8924e9bd85&req=dSUmEM54lIdXW%2FMW1HO4zQcnU%2FFqtN%2FmiX6ZzS1q7PFV3e6F2%2BTpZAeDNm0%2F%0Ann6EOLBSnJXgkOuhR2w%3D%0A>
- 
Click Review and Create to create the alert
Here is an example JSON of the alert that will allow the test to pass:{

"id": "/subscriptions/AAAAAAAA-BBBB-CCCC-DDDD-123456789ABC/resourceGroups/resource-group-name/providers/microsoft.insights/activitylogalerts/SubscriptionResourceHealth",

"name": "SubscriptionResourceHealth",

"type": "Microsoft.Insights/ActivityLogAlerts",

"location": "global",

"tags": {},

"properties": {

"scopes": [

"/subscriptions/AAAAAAAA-BBBB-CCCC-DDDD-123456789ABC"

],

"condition": {

"allOf": [

{

"field": "category",

"equals": "ResourceHealth"

}

]

},

"actions": {

"actionGroups": []

},

"enabled": true,

"description": ""

}

}

## Images

- [image 01] ../../images/integrations/azure/resolve-azure-integration-has-active-activity-log-alerts-test--01.png
- [image 02] ../../images/integrations/azure/resolve-azure-integration-has-active-activity-log-alerts-test--02.png
- [image 03] ../../images/integrations/azure/resolve-azure-integration-has-active-activity-log-alerts-test--03.png
- [image 04] ../../images/integrations/azure/resolve-azure-integration-has-active-activity-log-alerts-test--04.png
