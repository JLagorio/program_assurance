# Resolve 'Storage Accounts health monitored (Azure)' test

Source: https://help.vanta.com/en/articles/11345533-resolve-storage-accounts-health-monitored-azure-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This article provides more information on how to resolve the Storage Accounts health monitored <https://app.vanta.com/tests#storage-accounts-monitored-availability-azure> test.
​
​

## How to Fix:
1. Navigate to a storage account in your Azure environment <https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Storage%2FStorageAccounts>.
2. On the left-hand menu for the storage account, select Alerts. You can then select Create and then Alert rule:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769606/356bc1584144069e906ac116e999/17350777695636?expires=1794967200&signature=de37049f77ef043de1432b2376011e9c1201a8dded8e104107c73e8bdd897bbb&req=dSUmEM54lIdfX%2FMW1HO4zWqM0ozbNHpr9mFxU1Ncdsb7yL65z%2F0vIcWFaS1g%0Apdyy89mmthf7O7Dmbhk%3D%0A>
3. On the Condition page, choose See all signals and then choose one of the supported metrics:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769609/b389e7162bf09e5d84989b93eaa1/17350806473364?expires=1794967200&signature=e2fe5d4ea23656291d06ba01fc5eb3bb9fa2c0425330c79f134422818826397f&req=dSUmEM54lIdfUPMW1HO4zdBmR7wZS7uPSNyEsNYI96L9vT%2BuvccYSS7hc%2Ff2%0AkgNsalVjH9gysFUmR40%3D%0A>
4. Once you've selected a metric you can configure the alert logic, dimensions and evaluation period. This can be set to whatever is best for your organization.
5. On the Actions tab, select or create an Action Group that you would like notified when the alert is triggered:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769610/09e02c9f7e61a031f6331469de68/17350837712148?expires=1794967200&signature=b58986160635463de91d050833066d38ea2b66e2c80498ac9cb2be9afe9359e4&req=dSUmEM54lIdeWfMW1HO4zYXE82OQBRUGjQjGrBp1IvVLfZf6eOYTzOz3QeOA%0AWaTn9D7VW1AAPd9Q3C8%3D%0A>
6. On the Details tab, select a Resource Group, Severity, and Alert rule name. These can be set to whatever makes most sense for your organization:
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769605/d50b52a5da87815f9bd26312973c/17350790992532?expires=1794967200&signature=f5c6aa83bf0748795d91ac83d4263cbeedcd6aedcfb4df21c30fdc226088f18f&req=dSUmEM54lIdfXPMW1HO4zT0kXfQrCOBBIcLGSHvdcTkWjwPogcHAXnlDFdt3%0AckTh8mdkwHMuXSH%2FJto%3D%0A>
7. Select Review + Create to finish creating the alert

## Images

- [image 01] ../../images/integrations/azure/resolve-storage-accounts-health-monitored-azure-test--01.png
- [image 02] ../../images/integrations/azure/resolve-storage-accounts-health-monitored-azure-test--02.png
- [image 03] ../../images/integrations/azure/resolve-storage-accounts-health-monitored-azure-test--03.png
- [image 04] ../../images/integrations/azure/resolve-storage-accounts-health-monitored-azure-test--04.png
