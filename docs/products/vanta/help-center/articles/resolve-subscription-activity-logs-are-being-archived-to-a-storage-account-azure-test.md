# Resolve 'Subscription Activity Logs are being archived to a storage account (Azure)' test

Source: https://help.vanta.com/en/articles/11345537-resolve-subscription-activity-logs-are-being-archived-to-a-storage-account-azure-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This article provide more information on how to resolve alerts for the Subscription Activity Logs are being archived to a storage account (Azure) <https://app.vanta.com/tests#infra-activity-tracked-config-azure> test.

## How to Fix:
- 
Navigate to the Azure subscription that you would like to set this up for from here <https://portal.azure.com/#view/Microsoft_Azure_Billing/SubscriptionsBlade>
- 
Select "Activity log" and then "Export Activity Logs":
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769984/68ee01a1334212a54b6ec82ca2bc/16264722921108?expires=1794967200&signature=b6ce80bc9c894b1e7649feabf3403a64e15e68fb478d333ca3911c8f45dbed7f&req=dSUmEM54lIhXXfMW1HO4zZ0qIk3fMkNksd2rkl05CIwGRQD8hT%2FgBkee575P%0AJmbcF7XKOKi5obLaqtI%3D%0A>
- 
Select "Add diagnostic setting":
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769991/b842aa8c713488efeb435a833c1b/16264303707924?expires=1794967200&signature=435905d9dc84b5022efa9e2c0da46c11f927ece54a0510f241cac91a27ac64b6&req=dSUmEM54lIhWWPMW1HO4zSAq7a0Us25O2slKhroE2RvUQ%2BPDwh2xMJOIgKOI%0A6ZNru3eN%2BT5SMs8RnJg%3D%0A>
- 
Select the categories of logs to send to a storage account in the same subscription that you are creating the logs for:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769995/b0d7d141f51fbb0316ae3f9dfe81/16264679496980?expires=1794967200&signature=c84b51dabee4d59ea8d4a5780ff837192e3e21b6338c05bd368078200802515c&req=dSUmEM54lIhWXPMW1HO4zaeFcfEp1lWfcaN1CV5XfW9bkCH6ijG8hiF8SZRp%0AaF4%2BeDeHsJ3bXDOvWwY%3D%0A>
- 
Click the "Save" option on the top left

## Common Reasons For Failure:
- 
The storage account that you are sending this data to is not in scope in Vanta. Due to the nature of the logs that get created in Azure, the storage account hosting this data should be in scope in Vanta. Navigate to the integrations page in Vanta <https://app.vanta.com/integrations>, select "configure scope" for Azure, and ensure that the storage account is in scope.
​
​
- 
The storage account selected to send this data to is not in the same subscription for the logs it is creating. Ensure that you are sending this data to a storage account in the same subscription

## Reading the test data:
The test data for this test will show the Azure subscription, as well as the accounts Vanta sees Activity Logs being routed to in that subscription. Ensure that you aren't running into any of the two common reasons for failure above for the accounts listed:
​
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769983/bde28cc12e83f445b407803ace85/16264700034196?expires=1794967200&signature=de051d03855d9265dfa8763f63ddc8ff3fea525bbf03b5dfe6511dc31e785053&req=dSUmEM54lIhXWvMW1HO4zScebzuB%2BwCSWTEptn4wLn1ljEew0hTH1YP%2BalKg%0Aeydiz%2BJORH9aakA1PBQ%3D%0A>

## Images

- [image 01] ../../images/integrations/azure/resolve-subscription-activity-logs-are-being-archived-to-a-storage-account-azure-test--01.png
- [image 02] ../../images/integrations/azure/resolve-subscription-activity-logs-are-being-archived-to-a-storage-account-azure-test--02.png
- [image 03] ../../images/integrations/azure/resolve-subscription-activity-logs-are-being-archived-to-a-storage-account-azure-test--03.png
- [image 04] ../../images/documentation/resolve-subscription-activity-logs-are-being-archived-to-a-storage-account-azure-test--04.png
