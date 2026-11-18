# Resolve 'Load balancer used (Azure)' test

Source: https://help.vanta.com/en/articles/11346022-resolve-load-balancer-used-azure-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This article provides more information on how to resolve the Load balancer used (Azure) test <https://app.vanta.com/monitors?tab=Engineering#load-balancer-config-azure>
 

## How to Fix
- 
The Load Balancer Used (Azure) test is looking to verify that there is at least one active load balancer in the linked Azure account.
- 
For the test to pass, you would need to have a standard load balancer:
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767055/a6f564a139b6c1581b08411e88de/15747608057748?expires=1794967200&signature=88d1254d95656709cea59bb9fe02dea97b3f792b7a20889120940175200f6b03&req=dSUmEM54moFaXPMW1HO4zTOlMDyX7znzt3c7%2BZ4fB%2BNRNFBIHwrvNIdyJgTz%0AlxjGumW8oVcRV9toyjM%3D%0A>
 

## Common Issues
Currently we do not support Azure Front Door, Application Gateway or Traffic Manager services as a load balancer for this specific test, as they are technically different services though they may perform a similar task. 
​
If you use one of these services as your global entry point for your application, you can deactivate the test and provide screenshots of your configuration as manual evidence.
 
See our article on how to Deactivate a Test for more details about this.  <https://help.vanta.com/hc/en-us/articles/360057812572-Deactivate-a-Test?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxMDUzNzI4NTQxMDMyNCwidGlja2V0X2lkIjo0MTg4MywiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2NzYxMzQyMjJ9.NNaBKHGziLVZbKc3Ie2DhzxdzibX0V6j7DK3zjQ1oZE>
If you are unsure of what screenshots should be provided as evidence, we suggest reaching out to your auditor for more information, as they will be best to provide you with details on exactly what they would be looking for.

## Images

- [image 01] ../../images/integrations/azure/resolve-load-balancer-used-azure-test--01.png
