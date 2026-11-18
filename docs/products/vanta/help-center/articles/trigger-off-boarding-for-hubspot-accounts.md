# Trigger off-boarding for Hubspot Accounts

Source: https://help.vanta.com/en/articles/11345990-trigger-off-boarding-for-hubspot-accounts
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Due to API limitations, Vanta cannot detect HubSpot accounts that have been deactivated. This means if an account exists in Hubspot, Vanta will show the user as active no matter the status. This can cause delays with completing offboarding tasks for former employees and prevent the 'HubSpot accounts de-provisioned when employees leave' monitor from passing.
 
If you're unsure which option makes the most sense for you and your team, we recommend checking directly with your auditor, as auditor requirements tend to vary. 
 

## Prerequisites
- 
Administrator access on Vanta
- 
Super admin access on Hubspot
 

## Method 1: Deactivate and Delete the HubSpot user account
For Vanta to detect deactivated HubSpot for offboarding, the HubSpot user account is required to be deactivated and deleted in Hubspot.
- 
Please follow the steps in this article by Hubspot to remove a user from your Hubspot account: Remove HubSpot users <https://knowledge.hubspot.com/settings/deactivate-hubspot-users>
- 
Once this is done, the changes should reflect in Vanta within an hour
 

## Method 2: Reassign ownership from the Access Page
- 
From the Access page, filter by HubSpot and mark the account as not a person or assign them to an external person
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764687/b2c163fc8bf5446b9727cce43a8e/27565995582868?expires=1794967200&signature=1c3005971bc8eb61af312e0ccc40b7467268299e59e085bdfb3f8bf4f5320f1d&req=dSUmEM54mYdXXvMW1HO4zbT8JDpHY2ajSbuTjWSZVAGBI5cerZtNQT%2BeNt%2Bz%0ALgfSJbcG%2FmlCW3t2G%2F4%3D%0A>
 

## Method 3: Deactivate monitoring of resources on failing test
- 
If an administrator does not want to delete the Hubspot account, they can Deactivate monitoring for the flagged account on the test page.  <https://help.vanta.com/hc/en-us/articles/10258188330004-Deactivate-monitoring-for-a-resource-on-a-Test?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxMTk5MjA4MTc1MjcyNCwidGlja2V0X2lkIjo0NDIxMywiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2NzkxODQ3MzB9.9Rx0tFh6IgvDtzqwYww-pOsd8wkVU-fOC_vX78emZP8>Administrators can reach out directly to their auditor or account manager for any questions or advice about providing optional evidence when deactivating the monitor, as they will be best to confirm what this would entail.

## Images

- [image 01] ../../images/ux/access/trigger-off-boarding-for-hubspot-accounts--01.png
