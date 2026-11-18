# Connecting Vanta & CATS

Source: https://help.vanta.com/en/articles/12417638-connecting-vanta-cats
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta integrates with CATS to monitor and manage access to your tools. By syncing user access data, Vanta helps ensure that only active employees retain access and that access is promptly removed when personnel leave. This supports automated compliance needs, streamlines access reviews, and powers automated access requests.
 
Estimated setup time: Less than 5 minutes
 

## How It Works
Vanta connects to CATS to sync user data on a regular basis. This data supports three key workflows:
- 
Automated compliance tests – Vanta automatically checks that accounts are linked to employees and deprovisioned when personnel leave.
- 
Access Reviews – Synced users are surfaced in Vanta’s Access Reviews, where approvers can validate appropriate access, confirm least-privilege access, and provide audit evidence.
- 
Access Requests – Entitlements from CATS are pulled into Vanta. Requesters can ask for specific access levels, approvers can review with context, and admins can track provisioning.
Please note: Vanta connects to CATS through Merge.dev <https://merge.dev/>, a secure third-party integration platform.

## Use Cases
Connecting CATS to Vanta will enable you to:
- 
Monitor and manage personnel access to CATS in real time
- 
Ensure only active employees retain access to company systems
- 
Simplify access reviews and support compliance requirements
 

## Requirements
- 
Vanta administrator account
- 
CATS administrator account
- 
CATS subdomain
- 
API Key from CATS admin settings
 

## Connect the Integration
- 
Log in to CATS using your subdomain
- 
In the top bar, navigate to Settings → Administrator → API Key
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1744654547/9bc79865b43267dc448107f2a2a8/ea4063b2-aa50-493c-9a2a-fd9399e9463b?expires=1794967200&signature=80d111eae02380f7aeb8318bdfae400391384501e75b8fb65a87094fdbaad6b5&req=dScjEs97mYRbXvMW1HO4zcKQui7iDA8u9YPYEFEbTcoOSYQ%2BCFfg%2B34Wf4rM%0A7X3gcRJvFxNyEVJtdU4%3D%0A>
- 
Create a new API Key:
- 
Go to Site Management → API Keys
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1744655065/fc01b113d2efba67611eccf81540/4e3732d9-3121-4ab9-a6c9-6de2e39d5ba9?expires=1794967200&signature=782074b3d9381f06c20b46ab915c3e0edf099d6a91cba478d314771097b0fe3a&req=dScjEs97mIFZXPMW1HO4zdRhRxlhDbKRh0IeoNX5SN6Vmz0gip5deplGCDX0%0AeGhL%0A>
 
- 
Select Add API Key
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1744656733/c4f05decd8e4e3b3a9fbf0ebe28d/9794ed4d-9e1b-4e96-9768-a12831a801f8?expires=1794967200&signature=7684503c26caf57cc9862e0a528ec654d0d99723e8ec27497c1ed9fea76d781b&req=dScjEs97m4ZcWvMW1HO4zcnMIpk2LHeLr5cx5%2FV4zpveP6%2BU2qDSg5O7O%2FjE%0ArrHH%0A>
 
- 
Enter a name and select Generate
- 
Copy the generated key
 
- 
In Vanta, go to the Integrations page, click Add integration, and search for CATS. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
In the right panel, select Connect
- 
Select Connect CATS – you will be redirected to the Merge.dev linking flow
- 
Enter your CATS subdomain and select Next
- 
Paste the API Key and select Next
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1744657383/95f044014d67165c2b440576b051/ece5f7c8-2ff5-4fda-b9db-468ce9b61083?expires=1794967200&signature=fd7827de4066be75465cfb10b33ecd603e6ca763aba1f4b57ddf5a1871dff398&req=dScjEs97moJXWvMW1HO4zRN5CH5XBL9cDOaSPwWl5AP8Px6Te81pvou7q1Wu%0A5Wg0CBggeeY0swbQLEI%3D%0A>
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1744658044/ebf066c43de39a77cfd386d55552/50d20108-c3f1-4ac0-9527-ad999b3be572?expires=1794967200&signature=3a15a3d3a75292a485d4e7681ef3af95f1dd33034fa47062cd84b7f55e5e6ae1&req=dScjEs97lYFbXfMW1HO4zVG4WHb%2FP%2Fsj4Za3IrWkem1eOKESZytOQpMm16tV%0A90sCw2OJVQK%2FzvnKJ1o%3D%0A>
 
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
 

## Permissions
Vanta accesses the following data from the CATS API:
 
Vanta can read:
- 
Data about your users
- 
Used to confirm only active employees retain access
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
 

## Troubleshooting FAQ
“I don’t see roles/groups available when creating an access level in Vanta.”
- 
Likely cause: The CATS API does not expose entitlements, or they have not been synced yet. Confirm that the correct scopes are granted.

## Images

- [image 01] ../../images/integrations/cats/connecting-vanta-cats--01.png
- [image 02] ../../images/integrations/cats/connecting-vanta-cats--02.png
- [image 03] ../../images/integrations/cats/connecting-vanta-cats--03.png
- [image 04] ../../images/integrations/cats/connecting-vanta-cats--04.png
- [image 05] ../../images/integrations/cats/connecting-vanta-cats--05.png
