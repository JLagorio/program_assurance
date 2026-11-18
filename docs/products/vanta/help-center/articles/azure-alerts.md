# Azure Alerts

Source: https://help.vanta.com/en/articles/11345693-azure-alerts
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Many of the Azure Portal UI screens include the possibility to set alerts based on signals. Vanta fetches these alerts, distinguishing between different types <https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-types>:
- 
Alert rules with “Activity Log” or “Resource Health” signals
- 
Vanta checks that this feature is used by checking that there is at least one of these kinds of alert rules in the test Azure integration has active Activity Log Alerts <https://app.vanta.com/tests/azure-integration-activity-log-alarm-used-for-monitoring>
- 
See Resolve 'Azure integration has active Activity Log Alerts' test – Vanta <https://help.vanta.com/en/articles/11345535> for creating an example alert with the “Resource Health” signal type.
- 
Alert rules with “Metrics” as signals
- 
These are used in several tests on specific resources, such as checking whether the memory of an SQL database is being monitored.
- 
Alert rules based on “Log Search” signals
- 
Vanta checks that this feature is used by checking that there is at least one of these kinds of alert rules in the test Azure integration has active Log Alerts <https://app.vanta.com/tests/azure-integration-log-alarm-used-for-monitoring>
- 
See Resolve 'Azure integration has active Log Alerts' test – Vanta <https://help.vanta.com/en/articles/11345536> for more information.
Their scope can vary from a single resource to a whole subscription. All this information is available in the Azure UI, such as a subscription showing alerts with different signal types and scope levels.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757511/8ffe3ef31a6713c47dd994261f2d/30069406536084?expires=1794967200&signature=0304d08f62697c294982036aaa9d5aade9e180a0c52a08a91358c6b39498400f&req=dSUmEM57moReWPMW1HO4zT6VhAyZuoQsljrSyWEN%2B8pqsUgDdnJcp%2FC0kkxQ%0AJBiGVTrxUKgJmSubjRw%3D%0A>

## Images

- [image 01] ../../images/integrations/azure/azure-alerts--01.png
