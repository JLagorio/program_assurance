# Connecting Vanta & Comeet

Source: https://help.vanta.com/en/articles/12243235-connecting-vanta-comeet
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta integrates with Comeet to monitor and manage access to your tools. By syncing user access data, Vanta helps ensure that only active employees retain access and that access is promptly removed when personnel leave—supporting automated compliance needs, streamlined access reviews, and automated access requests.
 
Estimated setup time: Less than 5 minutes
 

## How it Works 
Vanta connects to Comeet to sync users data on a regular basis. This data powers three key workflows in Vanta:
- 
Automated compliance tests: Vanta automatically checks that accounts are linked to employees and deprovisioned when personnel leave.
- 
Access Reviews: Synced users are surfaced in Vanta’s Access Reviews and approvers can validate whether access is still appropriate, confirm least-privilege access, and provide evidence for audits.
- 
Access Requests: Entitlements from Comeet are pulled into Vanta. Requesters can ask for specific access levels, approvers can review with context, and system admins can track provisioning.
Please note: Vanta connects to Comeet through Merge.dev <https://merge.dev/>, a secure third-party integration platform.
 

## Use Cases
Connecting Comeet to Vanta will enable you to:
- 
Monitor and manage personnel access to Comeet in real time
- 
Ensure only active employees retain access to company systems
- 
Simplify access reviews and support compliance requirements

## Requirements
- 
Vanta administrator account
- 
Comeet administrator account (Ultimate or Enterprise plan)
- 
API key from Comeet admin settings.

## Connect the Integration
- 
Log in to the Comeet admin portal.
- 
In the top right corner, click on the user information then navigate to Settings.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1717775990/0ea4e55abf5e5c0f14fc9273e2be/6b7cd8e4-03dd-4508-9ec0-61f1abada447?expires=1794967200&signature=48b935c8731edc247d5c60488989f5f582fdb313ec124a462a36c435f64ae2f7&req=dScmEc55mIhWWfMW1HO4zbf4ebrD4aNY33nNkPNeM%2Fa21Twk4BLsV5RVTur3%0A62wtrfN15FbzN5%2BqM8g%3D%0A>
 
- 
Navigate to Process > Integrations.
- 
Search the list of Integrations for Merge.
- 
Click on Integrate and read through the permissions list 
- 
Select Allow access
- 
Copy the API Key
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1717775991/98b56e7dac20a5cbbf48656fb624/6473c53a-3498-40a2-8591-44e6569ca204?expires=1794967200&signature=18c77a6ed379f2953d71e9ed628e92695670c68743e565755b0abf13a3176c60&req=dScmEc55mIhWWPMW1HO4zc2KnUfqK31IweafQdmnPjNRjpn%2B%2BisWJfAlVHnB%0AxjjGncLiLZgdumb1gWA%3D%0A>
 
- 
To connect, go to the Integrations page and search for Comeet. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
In the right panel, click on Connect
- 
Click on Connect Comeet, you will be redirected to Merge.dev Linking flow.
- 
Copy the API Key, and click Next
- 
Employees will appear in Vanta within ~30 minutes.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1717775988/4d70cc2d5ec6e67f85db3d7e9093/4cb409e6-b743-472c-b5b0-688df55323cb?expires=1794967200&signature=d01a587e3535f979e7370226b7660156284ebe341473b72aeeba3c8765379d76&req=dScmEc55mIhXUfMW1HO4zedaf4tkex3s%2BJzeIn0tOUvNUIj6723qLux%2Bkbbd%0AlKa6l3GzOMaoUk8pLBc%3D%0A>

## 

## Capabilities
 | 
Resource | 
Supported | 
Usage
 | 
Users | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>﻿

## Permissions
Vanta accesses the following data from the Comeet’s API.
 
Vanta will be able to read:
- 
Data about your users
- 
Needed to confirm that only active employees retain system access and that terminated employees are deprovisioned promptly. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows Vanta to display available users when tracking or assigning access.
Vanta will be able to write:
- 
Nothing (Vanta does not have write permission)
 

## Troubleshooting FAQ
"I don’t see roles/groups available when creating an access level in Vanta."
- 
Likely cause: Comeet’s API does not expose entitlements, or they haven’t been synced yet. Confirm that the correct scopes are granted.

## Images

- [image 01] ../../images/integrations/comeet/connecting-vanta-comeet--01.png
- [image 02] ../../images/integrations/comeet/connecting-vanta-comeet--02.png
- [image 03] ../../images/integrations/comeet/connecting-vanta-comeet--03.png
