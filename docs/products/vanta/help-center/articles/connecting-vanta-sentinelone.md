# Connecting Vanta & SentinelOne

Source: https://help.vanta.com/en/articles/11345695-connecting-vanta-sentinelone
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Vulnerability Scanners
Fetched: 2026-11-17

## Article text

## About this article
- 
This integration automates the collection of evidence for vulnerability scan results and proof of subsequent vulnerability remediation within your committed SLAs
- 
Vanta requires read-only to endpoints, applications, endpoint policies and console users
- 
Estimated setup time: Less than 10 minutes
 

## How it works
Vanta schedule periodically fetching to official the SentinelOne API
 

## Use Cases
Connecting SentinelOne will allow Vanta to perform the following tests:
- 
Ensure SentinelOne accounts are linked in Vanta
- 
Ensure a continuous visibility into application and OS vulnerabilities across different OS
- 
SentinelOne groups have a secure prevention policy
- 
SentinelOne alerts are addressed
- 
Critical vulnerabilities identified in packages are addressed 
- 
High vulnerabilities identified in packages are addressed 
- 
Low vulnerabilities identified in packages are addressed 
- 
Medium vulnerabilities identified in packages are addressed 
 

## Requirements
Clear list of prerequisites:
- 
Admin role in SentinelOne console
 

## Connecting Vanta & SentinelOne
You can connect SentinelOne to Vanta to ensure user access to SentinelOne is managed following your company's policies and to ingest and display vulnerabilities on the vulnerabilities page.
 
If you have already integrated with SentinelOne and you need to update the permissions, you may skip many of the steps in the instructions below and edit the existing Vanta Client in SentinelOne.
- 
In Vanta, go to the Integrations page, click Add integration, and search for SentinelOne. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click on Connect.
- 
Select the Product you would like to integrate
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757682/68f77efd614923b053d6b68c99b5/28840268896788?expires=1794967200&signature=ae0512b32e6cf345056d88ccd66e1dcd4c55dff7895c69c1a884ab4a0e0a88cb&req=dSUmEM57modXW%2FMW1HO4zbMbZePaMqJ%2FJ%2FtkvawjNvRG4TSgd4hFW%2FHMp1l4%0AIcIwDdZ7zfM%2BeLzU7CM%3D%0A>

## 

## Configure RBAC (role-based access control permissions)
- 
Login to SentinelOne
- 
Navigate to the Settings, Users, Roles page in the SentinelOne console
- 
Either create a new role or modify an existing role to have the following permissions
- 
Endpoints: View
- 
Applications: View
- 
Applications: View Risks
- 
Console Users: View
- 
For the Alerts Management product, you need the next additional permissions:
- 
STAR Rule Alerts: View
- 
Endpoint Policy: View

## Create Service User
- 
Navigate to the Service Users tab within the Settings, Users page
- 
Click on Actions and then Create New Service User.
- 
Provide a name, description, and expiration date.
- 
Press next
- 
Select the account scope.
- 
Select all relevant accounts and ensure they are set to the role configured in the previous Configure RBAC Permissions step.
- 
Click on Create User.
- 
Please note that this is the only time you can see the generated API token. If you close the dialog, you will no longer be able to access the service account and must create another one.
- 
Keep the dialog open, or copy it for the next step!

## Save API Token Details
- 
Copy the displayed API token and paste into the appropriate box
- 
Enter the Service Account name and the Base URL
- 
Select Done
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1684190469/38f8ee294866aac2cfbdc868a62d/AD_4nXfUJPC8vABnoUoMjb2plQLMoUu8Z_HBNe9u7-hZ-pAfFcOXbGErqBl_RwPh2yUlW6Ci6l7zRl2pTFOuqQQLaeItyndaU72AWC1sASggHBVGIoieSK-oaV5ACVJoDOr3YjUGGhJzT_tYlalAwoRae1w?expires=1794967200&signature=3df4928d687f9d75caed40983ed96aa78c5f76049fd8b4d794428f7991ce2492&req=dSYvEsh3nYVZUPMW1HO4zTIofu9uR%2FhQm6lrxpkjzv3jsjrIxt5maT3l40FV%0ARYeJNnBgGcHH876A0J4%3D%0A>

## Permissions
Vanta accesses the following data from your SentinelOne account:
 
Vanta will be able to view:
- 
Data about your users
- 
Data about your user details
- 
Data about your user groups
- 
SentinelOne Monitored Host
- 
SentinelOne Prevention Policy
- 
SentinelOne Vulnerability Management Vulnerability
Vanta will be able to do:
- 
Nothing

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-sentinelone--01.png
- [image 02] ../../images/integrations/sentinelone/connecting-vanta-sentinelone--02.png
