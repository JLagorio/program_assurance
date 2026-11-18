# Resolve 'Inventory list tracks resources that contain user data' test

Source: https://help.vanta.com/en/articles/11345540-resolve-inventory-list-tracks-resources-that-contain-user-data-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

In order to pass the Inventory list tracks resources that contain user data test <https://app.vanta.com/monitors#inventory-list-user-data>, you'll need to mark at least one resource on your inventory page as containing User Data.
User Data refers to any PII (personally identifiable information). Examples include:
- 
- 
full name
- 
SSN
- 
driver’s license
- 
address
- 
credit card information
- 
passport information
- 
financial information
- 
medical records
- 
etc.

## How to Fix:
- 
On the Inventory page <https://app.vanta.com/inventory#compute>, navigate to one of the following inventory resource tabs where you have resources populated:
- 
Storage buckets
- 
Databases
- 
Platform-as-a-service (PaaS apps)
- 
Queues
- 
Data warehouses
- 
or Custom items you have added to your inventory list
- 
At least one resource belonging to one of these resource types must be flagged as containing user data.
- 
To do this, hover your mouse over the ENCRYPTION / USER DATA column next to a resource.
- 
Click on the pencil icon that appears.
- 
Set the Contains user data option to Yes and click the Save button
- 
Navigate back to the test and click Refresh 
- 
When the refresh completes, the test should be passing

## Common Reasons For Failure:
- 
The only resource that was marked as containing user data is no longer in scope in Vanta
- 
The resource does not match one of the following resource types:
​storage buckets, databases, PaaS apps, queues, data warehouses, or custom items
- 
You haven't marked any resources as containing user data.

## Images

- none
