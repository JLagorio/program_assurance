# Connecting Vanta & Teamtailor

Source: https://help.vanta.com/en/articles/12429781-connecting-vanta-teamtailor
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta integrates with Teamtailor to monitor and manage access to your tools. By syncing user access data, Vanta helps ensure that only active employees retain access and that access is promptly removed when personnel leave. This supports automated compliance needs, streamlines access reviews, and powers automated access requests.
 
Estimated setup time: Less than 10 minutes
 

## How It Works
Vanta connects to Teamtailor to sync user data on a regular basis. This data supports three key workflows:
- 
Automated compliance tests – Vanta automatically checks that accounts are linked to employees and deprovisioned when personnel leave
- 
Access Reviews – Synced users appear in Vanta’s Access Reviews, where approvers can validate appropriate access, confirm least-privilege access, and provide audit evidence
- 
Access Requests – Entitlements from Teamtailor are pulled into Vanta. Requesters can ask for specific access levels, approvers can review with context, and admins can track provisioning
Please note: Vanta connects to Teamtailor through Merge.dev, a secure third-party integration platform.
 

## Use Cases
Connecting Teamtailor to Vanta will enable you to:
- 
Monitor and manage personnel access to Teamtailor in real time
- 
Ensure only active employees retain access to company systems
- 
Simplify access reviews and support compliance requirements
 

## Requirements
- 
Vanta administrator account
- 
Teamtailor API Key
 

## Connect the Integration
- 
Log in to the Teamtailor app
- 
In the top right corner, select your name
- 
Select Settings
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746918493/dba761af985b6867154833957b10/b76948f8-fcfc-49c4-be69-7c5ab7c8abe5?expires=1794967200&signature=ef320a853947c0df90d6417ca196a33ba5f59e008058b347fa235b3084cc1585&req=dScjEMB%2FlYVWWvMW1HO4za5CnZQptM07%2BLw4tiBYBCAiRpFsV%2F8hYCobUCKf%0AKwt65FAojFAWeQZyiGc%3D%0A>
 
- 
In the Settings page, go to the left menu and select Integrations → API Keys
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746918889/d78d9bc1b53f94d1ed6d4e81ab46/ca05d9b1-e72e-409e-b4d3-1d1f2fbd364b?expires=1794967200&signature=177baa3cd56a89c811d2e14153e311c01f05a3164eadb6fe077110d8e18d1a12&req=dScjEMB%2FlYlXUPMW1HO4zVqK%2BlcoDOryeouqrjQB6y6SgVuLLQOMtL5QEF3h%0AxenaoxVWFfORlEZtnFw%3D%0A>
 
- 
In the API Keys section, select New API Key
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746919646/601d04af9145554e647d3eccbc46/a00554e9-2ec7-40e5-991f-465e928ecd7f?expires=1794967200&signature=b7b601c5e8645189c59017a214e4a12d10157566e48178d82241f3dcaff818b4&req=dScjEMB%2FlIdbX%2FMW1HO4zYUjdLqo4xpXctaFClezTPoK4qnlTej0iyObo5L7%0AnAq5%0A>
 
- 
Set the API Scope to Admin
- 
Check the boxes for Read and Write permissions
- 
Select Create and copy the generated API Key. Important: Save this key, as it will only be shown once
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746920043/1f6e5530c158835ffb5a56b12311/c3fd9e2c-4652-4fd6-92e7-ee485873a160?expires=1794967200&signature=6ed92fabe605d309f8b4cfd00dac651ea8be5c504ba7235562c248ea4ca5ac4a&req=dScjEMB8nYFbWvMW1HO4zSSokdMIJnLxsJEO8jZRWsqd4tQpln8CC%2BpkwGh7%0AbwHS5cMYShYzzYMb3e4%3D%0A>
 
- 
In Vanta, go to the Integrations page, click Add integration, and search for Teamtailor. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect Teamtailor
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746920547/3818375b043ec270f2924c0ec803/614f8b76-252e-48c3-8e48-19235374dbb4?expires=1794967200&signature=2b1acf45a27e52ef95fb96113fa84d318a451b28b167f876258b88a83d858829&req=dScjEMB8nYRbXvMW1HO4zblSgtzeoUzIUJdsH%2BJLhFfkur8xxK13rqttxmjP%0A9Yti%0A>
 
- 
Choose your Teamtailor region
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746920869/abcfdeceb7594165d45aaf5aa466/9056ff76-53e5-4acc-85f6-ccbebaff70c8?expires=1794967200&signature=af7052b87d935df61a871cd932b7b4a65f13d654eb9c0c6779c65d93c65efd81&req=dScjEMB8nYlZUPMW1HO4zdn8F%2Boh4W07xIKAG31gX5bDSi8lwLlP2BpoDZFm%0AIUx8%0A>
 
- 
Enter your API Key and select Next
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746921305/8137b09e68cb92eae0ba1fca423a/a35fa548-3348-49dc-8236-3ede9f8fd7c6?expires=1794967200&signature=86808aadde7c772ed4b151d2f39a74ddf64c0645fe150e560e8a7f061aaa1169&req=dScjEMB8nIJfXPMW1HO4zfdBQinoyg0VSZWRAJmloA6TA06aLllKph7xZH75%0Apynj%0A>
 
- 
After successful connection, you’ll see a confirmation screen. Select Next
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746921661/35f3b95b9368ebaa1aa1031aa5f1/cdf14f75-e86b-423a-836e-587c7d607fc9?expires=1794967200&signature=1b2aa338ef9e6ccbb508721ec07ffcc9fe78037b31dd3ed2123d951d613d85a1&req=dScjEMB8nIdZWPMW1HO4zeVQrLF8vU3LmLrcPo99CTv%2BPI7%2FZgEIFqb5f2NU%0Aabfw9tfBnRyu6ggbSBk%3D%0A>
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1746922145/6883e45e0a41dd3884963eaa2ec6/ba83fac1-9643-4eae-900a-7a222083e5ba?expires=1794967200&signature=4e401da0676ce0737c123a64b635bfe73d1ab1385aecfc24df76cf99aa9382ab&req=dScjEMB8n4BbXPMW1HO4zRAilr%2F90C5r4kRb2azclZ%2FGizJBpvqjFKnR7rS%2B%0AckBWLKQbWBCV7Jcydrk%3D%0A>
 
Employees will appear in Vanta within about 30 minutes.
 
 

## Capabilities
 | 
Resource | 
Supported | 
Usage
 | 
Users | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, Automated Tests <https://help.vanta.com/en/articles/11345374-the-tests-page>
 | 
Groups | 
❌ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Roles/Entitlements | 
❌ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Last Login | 
❌ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 

## Permissions
Vanta accesses the following data from Teamtailor:
 
Vanta can read:
- 
Data about your users
- 
Used to confirm that only active employees retain access
- 
Ensures terminated employees are deprovisioned promptly
- 
Enables Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta> to display available users when tracking or assigning access
Vanta can write:
- 
Nothing (Vanta does not have write permissions)
 

## Related Articles
- 
Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>

## Images

- [image 01] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--01.png
- [image 02] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--02.png
- [image 03] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--03.png
- [image 04] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--04.png
- [image 05] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--05.png
- [image 06] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--06.png
- [image 07] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--07.png
- [image 08] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--08.png
- [image 09] ../../images/integrations/teamtailor/connecting-vanta-teamtailor--09.png
