# Connecting Vanta & Miradore

Source: https://help.vanta.com/en/articles/13355391-connecting-vanta-miradore
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Endpoint and Device Management (MDM)
Fetched: 2026-11-17

## Article text

Vanta integrates with Miradore to synchronize device compliance data and support automated device trust monitoring. By pulling real-time device posture information, Vanta helps ensure that only compliant devices retain access to company systems—simplifying device access reviews and supporting compliance requirements.
 
Estimated setup time: Less than 5 minutes
 
 

## How it works
Miradore is a device trust and compliance platform that verifies devices meet your organization’s security policies before granting access to applications and resources.
Vanta’s connects to Miradore and synchronizes device compliance data on an hourly schedule. This enables Vanta to continuously evaluate device posture and compliance status as reported by Miradore.
 
 

## Use cases
Connecting Miradore enables the following compliance checks:
- 
Validate device compliance status as reported by Miradore
- 
Verify that only compliant devices have access to organizational resources
- 
Monitor device posture and security policy adherence
 

## Requirements
To connect this integration, you must have: 
- 
An Administrator account with access to the Miradore Admin console
 

## Connect the integration
- 
In Vanta, go to the Integrations page, click Add integration, and search for Miradore. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
​
- 
Click Connect to open the integration modal. This will redirect you to a guided setup flow for connecting Miradore.
​
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096557514/b0b34490a5d9001f77f94fe0c50e/97e83e94-f713-457a-a0dc-32196670682b?expires=1794967200&signature=5e9151f9ed8c897bfbbc4e199e1fafd360c5542831e56e913ba8182f5447c25d&req=diAuEMx7moReXfMW1HO4zent9%2Bzx%2BpC7WMS0Ecni3aW84CQaIIQUJPfkaRG2%0AuEnF%0A>
 
- 
Vanta will prompt you to enter:
​
- 
An API token
- 
Your Organization Name

These credentials are required to authenticate with the Miradore API and make requests through the device compliance API.  
​
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096556019/bb718e658ea9ab7fd6b921c6a4ec/dee0c076-3d89-45c0-a79e-3ce126865737?expires=1794967200&signature=4bc189cac4eebd299759fd7e21a4fb8865c37319b9b0f9f07c3ce3404c886316&req=diAuEMx7m4FeUPMW1HO4zcF6HMOTRok%2BpykvZ4lRZ5am2D9kHJ2kc7egwSCc%0Anm8%2F%0A>
 
 

## Generate an API token in Miradore
If you do not already have an API token with the required permissions, you can create one in your Miradore dashboard:
 
- 
Select Systems. Then click on Infrastructure diagram and scroll down to the API section:
​
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096585668/7ba72f4d4a66fa6e37f6ec6b188e/b7b33635-e072-4ac3-a928-7c518d1a7d93?expires=1794967200&signature=43327d96a2eccc9767e59a1004d7b56063d8baafbe4ca18d7a557829bc73ee49&req=diAuEMx2mIdZUfMW1HO4za1tVstau4Svwb9wOXpG1EOGxnxEhWiG6cgH6nNn%0A040H%0A>
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096595547/96c08beb83df6fbc6d98f39bee1e/79895749-8c12-46ed-a19f-9cfc2ebeda43?expires=1794967200&signature=53875b0d3a0919f01f187b72b4da39e05854762b57578be16b44d3486562e3fe&req=diAuEMx3mIRbXvMW1HO4zYarub%2FqhFpGIJ6hvVZ6JrvF1%2BQ7WUpAft85v30G%0Af2qa%0A>

​
- 
Click Create Key to configure a new API token. No special write permissions are required. 
​
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096589920/7fa1df0511d5bbab298929e9f70d/736601a7-dc8c-4e3c-849c-d05da1cc7d13?expires=1794967200&signature=931c8ca7c171eb9366cdae8ae7528566147deb27dfece0b1cdf07e1a876561fd&req=diAuEMx2lIhdWfMW1HO4zbxAKgEMZP%2Bpk9zVZ7stbVBw23wFAnDMCoNBq3zS%0AkqV5%0A>
 
- 
Enter a name for the token and click Next. 
​
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096592435/2d8b1cc4778b450ba0d4f58719c9/e01de1ba-e062-453f-89c3-e4edb819d741?expires=1794967200&signature=5328d4711dd0274a87257ef18f03e39f8c2e5faf3b199092454ef07a1354ebea&req=diAuEMx3n4VcXPMW1HO4zc0RkBrYmpMhs8mDfEBHOgcD817oFjq8t846Hq5W%0AeJfk%0A>
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096592887/3e6a8be2dabc10733f7fdb52af1b/6c78deca-1a95-4daf-9579-b9eb531bfe08?expires=1794967200&signature=716c501ddbe84b1acf302a64a64098ddbb1e6a45ed6b923b39c299a06efdc3d0&req=diAuEMx3n4lXXvMW1HO4zckgUCyQWjMu%2BufxRv5qKLSca5ha7GhqQXTZn3u%2B%0AHZ%2FP%0A>
 
- 
Copy the generated API key, then click Create Key at the bottom of the page to finalize the token creation. 
 

## Retrieve your organization name 
Your organization name can be found in your Miradore dashboard URL. 
​
For example:
 
https://online.miradore.com/vantavlad/Welcome <https://online.miradore.com/vantavlad/Welcome>
 
In this example, the organization name is: 
 
vantavlad
 
 

## Complete the connection
- 
Copy your API Token and Organization Name into the corresponding fields in Vanta.
- 
Click Validate and Store to submit your credentials. 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096518458/5d9c7bb170439bd11318f73afad9/06b07ea9-6eaf-4cff-b3ea-a3ee21216e6c?expires=1794967200&signature=53427f51bdf2552acd3caafbdebb77625254ba561c4550faddb2a7849a6796b7&req=diAuEMx%2FlYVaUfMW1HO4zeRnfyLoqCXRzKoBJdPrh3Uxac1f1kC9E0hROI%2FI%0A61MuHZK73tr%2BUAt%2FdVA%3D%0A>

If configured correctly, you will see a confirmation message indicating that the integration was successfully connected. 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2096518455/87b33662a27631e39369cea72832/cf5b9663-b047-4aea-913e-64f369a2b5ff?expires=1794967200&signature=72169d5a737e308ed9376e3dc23a071dc49199f8a666d503b0384fdff63defb6&req=diAuEMx%2FlYVaXPMW1HO4zddPAANYFqWAVM%2F6VoqpMiWvMq1I6zO4Lp2PBMJV%0Aogr5Rs18VvblthxBbno%3D%0A>
 
 

## Permissions
The Miradore integration provides read-only access to your environment. Vanta does not create, modify, or delete any data in Miradore.
 
 

## Data access scope
Vanta can access the following data: 
- 
Device data
- 
Device compliance status and related details
- 
Device posture information
Vanta does not have write permissions and cannot update any data in Miradore.
 
 

## Miradore help
Miradore page <https://www.miradore.com/>
Miradore API Documentation <https://www.miradore.com/wp-content/uploads/2014/07/api-specification-118.pdf>
 
 

## FAQ

### Invalid API token
This error may occur if the API token entered in Vanta is incorrect, which prevents authentication with the Miradore API.
To resolve this issue: 
- 
Confirm that the API token was copied correctly 
- 
Verify that the token is still valid
- 
Generate a new API token if necessary 
Additionally, ensure that your Miradore subscription includes API access. API functionality is available only with the Premium plan.
 

## Monitored Resources
 | 
Resource type | 
Windows | 
macOS | 
Linux | 
iOS | 
Android
 | 
Device Monitoring | 
✅ | 
✅ | 
❌ | 
❌ | 
❌
 | 
Screenlock
Settings | 
❌ | 
❌ | 
❌ | 
❌ | 
❌
 | 
Antivirus detection | 
✅ | 
✅ | 
❌ | 
❌ | 
❌
 | 
Password Manager | 
✅ | 
✅ | 
❌ | 
❌ | 
❌
✅ Supported
❌ Not Supported

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-miradore--01.png
- [image 02] ../../images/integrations/miradore/connecting-vanta-miradore--02.png
- [image 03] ../../images/integrations/miradore/connecting-vanta-miradore--03.png
- [image 04] ../../images/integrations/miradore/connecting-vanta-miradore--04.png
- [image 05] ../../images/integrations/miradore/connecting-vanta-miradore--05.png
- [image 06] ../../images/integrations/miradore/connecting-vanta-miradore--06.png
- [image 07] ../../images/integrations/miradore/connecting-vanta-miradore--07.png
- [image 08] ../../images/integrations/miradore/connecting-vanta-miradore--08.png
- [image 09] ../../images/integrations/miradore/connecting-vanta-miradore--09.png
