# Connecting Vanta & NetSuite

Source: https://help.vanta.com/en/articles/12499416-connecting-vanta-netsuite
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › HR Systems (HRIS)
Fetched: 2026-11-17

## Article text

Vanta integrates with NetSuite to monitor and manage access to your tools as well as to sync employee data and support automated onboarding and offboarding workflows. By pulling real-time employment and access information, Vanta helps ensure that only current employees retain access to company systems and that access is promptly removed when personnel leave. This supports automated compliance needs, streamlines access reviews, and powers automated access requests.
 
Estimated setup time: Less than 15 minutes
 

## How It Works
Vanta connects to NetSuite to sync user and role data on a regular basis. This data powers three key workflows:
- 
Automated compliance tests – Vanta automatically checks that accounts are linked to employees and deprovisioned when personnel leave
- 
Access Reviews – Synced users appear in Vanta’s Access Reviews, where approvers can validate appropriate access, confirm least-privilege access, and provide audit evidence
- 
Access Requests – Entitlements from NetSuite are pulled into Vanta. Requesters can ask for specific access levels, approvers can review with context, and admins can track provisioning
In addition, Vanta syncs employee and group data to support automated onboarding and offboarding workflows, ensuring that only current employees retain access.
 
 

## Use Cases
Connecting NetSuite to Vanta will enable you to:
- 
Monitor and manage personnel access to NetSuite in real time
- 
Ensure only active employees retain access to company systems
- 
Simplify access reviews and support compliance requirements
- 
Sync employees and groups from NetSuite into Vanta
 

## Requirements
- 
Vanta administrator account
- 
Access to Oracle Cloud
- 
NetSuite administrator account
- 
URL to your NetSuite dashboard
 

## Connect the Integration
- 
In Vanta, go to the Integrations page, click Add integration, and search for NetSuite. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>. 
- 
Select Connect to open a modal with your connected NetSuite instances
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1756993742/12ae3b3c0f3f1b5a44469bd1a5ea/597fb32c-bb8a-42e2-b100-8d659fd34340?expires=1794967200&signature=d3af0ac736a0941750322f1b115b5242c2c50369fcc3dfcd612d9c748bcc40c6&req=dSciEMB3noZbW%2FMW1HO4zYd2faD8n9oTD3Z1rlGilPivHKhbj3Kmwk6XDSpC%0A6mHs%2FGi6iuYU4r3YJQA%3D%0A>
 
- 
Select Add credentials to open the OAuth credentials form
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1756994350/8883d2fd530752081041f27158f3/2fa5183c-4e23-4253-853f-3faa57bb50a4?expires=1794967200&signature=cea0ae2edbdb5ccce5dada4f2526f60536dba9b63f1c6c7a4af24aae604ebcfb&req=dSciEMB3mYJaWfMW1HO4zYHEbum6FTr0%2FYM83fLBVl372wTf5kF9smjelwqS%0AJoq8YCuFHg4uHtmsXu0%3D%0A>
 
- 
NetSuite supports creating an OAuth app with Authorization Code Flow that Vanta requires to access data from your instance.
- 
Gather the following from your NetSuite instance:
- 
Account ID (found in your NetSuite dashboard URL)
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1756995222/28867a93cf2c43623168438455c3/2d4ec26d-c4cb-4fe6-8b75-ca7eeb503f3e?expires=1794967200&signature=3d23d36444a42de8bd8bad374ec54a8594993003758bcdbf30f553a36437dd7a&req=dSciEMB3mINdW%2FMW1HO4zan0sZSwP2%2B0EmL3WWvIzgyB9joxjDzIiDZEwjPX%0AHbK0hppNQKv1w6Psp3U%3D%0A>
 
- 
Next, you’ll need to set up an OAuth application with Authorization Code Flow in your instance.
- 
To create a new OAuth app in NetSuite:
- 
Go to Setup → Integration → Manage Integrations → New
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1756996280/887a7d0f3eb98315e247679ce235/0c4c787d-c5a0-455a-b844-da43a5c39627?expires=1794967200&signature=56b1df3e4e638ed823eba58e4685c8d3950d80999bf1739d199c2948c3c658bb&req=dSciEMB3m4NXWfMW1HO4zZ1%2Be1u7a2bcflac%2F1zT7RP7ZwdlWnawjJ7%2FbnYG%0A0u6EBfjrTEgFb6k4N%2FY%3D%0A>
 
- 
Configure the app with the following:
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1756997519/391780ed0d5b67bc6310a19f090f/2ac97ed3-ccf7-40e5-916c-adad16874333?expires=1794967200&signature=e18b03b21b3f5911ff0c47be650cd5883cdef9c99a0c86956965d0b30b92ca0c&req=dSciEMB3moReUPMW1HO4zUeq9w6K0fO%2F7Qzs9nbbCY747zQ6iR0CXdbLwVQW%0ABkbz%0A>
 
- 
App Name: (recommend “Vanta”)
- 
State: Enabled
- 
OAuth 2.0 Settings:
- 
Check Authorization Code Grant
- 
Redirect URI: https://api.vanta.com/auth/o/callback/netsuite <https://api.vanta.com/auth/o/callback/netsuite>
- 
Scope: Rest Web Services
- 
OAuth 2.0 Consent Policy: Always Ask (recommended)
- 
NetSuite will generate a Client ID (Consumer Key) and Client Secret (Consumer Secret). Copy and save these securely. They are only shown once.
- 
Return to the Vanta integration modal and enter your Account ID, Client ID, and Client Secret
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1757007096/af470ca34bdd64f02792b7c5ffb3/7b1c1b17-2773-41fc-9029-6ee7606d2683?expires=1794967200&signature=4bf0770b976bbdd2ae21d4fc232806d96dc697566aec5944511deea84e2ff221&req=dSciEcl%2BmoFWX%2FMW1HO4zRIQrMnfz%2FUZH%2FO%2F%2BoI0z%2Fc8NgcTfoYWwDm%2BJOpp%0Aj759wAZ9ZxBe3rlCaes%3D%0A>
 
- 
With all that info, you should be ready to pass the values to the previous form, and once you do, it will redirect you to the NetSuite Authorization Code Flow check page to authorize Vanta to interact with your NetSuite account.
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1757006442/ecca02616a33e541e9b4c31a0596/8ddaa919-fafd-4b62-a08e-2864a6dbbd4a?expires=1794967200&signature=3957ebbc967d37e7e707d869a86d9f99f1ad3e277458ffa22a9015f71befd16b&req=dSciEcl%2Bm4VbW%2FMW1HO4zelRZZxCZRYHuAdtdt2dFPFHAzcF%2Bl31Rac23DhN%0ATDJi9GVnKur1aFkJozY%3D%0A>
 
- 
After authorization, select the employee end date cutoff (required for HRIS integrations)
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1757005827/86bc0a6fa1a4897cb87fd9665f92/e64fbc94-a843-47d3-b337-3d65f1ea078c?expires=1794967200&signature=55b81077d52dbfa66a7d0e6277fbc225dcc936fbea832e2a1523ff50f40db6e9&req=dSciEcl%2BmIldXvMW1HO4zYDoErzYsBFXLaBop45Dh27v2zP0IGZH%2BX05lS3l%0A97V%2BuA8Mq6Cqkn8ia%2BI%3D%0A>
 
- 
Your NetSuite instance will now appear as connected in Vanta
 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1757005334/35d20d4449d1c112c94ec89ffdc8/64aee91b-7d57-475b-9c24-f2c28cad7fa9?expires=1794967200&signature=6d67780d020ffa0c8b3f4c76c0d15daa47a269f1a8f716fa2cfe2e89fe588d81&req=dSciEcl%2BmIJcXfMW1HO4zcNc576sGpjZkpby6sFwZy72JL7dxFc8YvTduasC%0AlIAYw0A2KYRjUtnBml8%3D%0A>
 
You can update credentials or view your connected instances anytime by selecting Edit Configurations.
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1757004964/42edac438f195b583a67a75d0707/f47c54f9-8e58-4680-946b-8d8cf2bd0901?expires=1794967200&signature=704443999a53279ff313ee6ae4f7f362de0900a5ca2adc3857601b29248d03fd&req=dSciEcl%2BmYhZXfMW1HO4zXCTHnLtdvAMiUZHc8ghy%2Bzxs4teeMzrrIPcgIdG%0APtWuttDxEGqK5DBxoe4%3D%0A>
 
Employees and access data will appear in Vanta within about 30 minutes.
 

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
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Last Login | 
❌ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 

## Permissions
Vanta accesses the following data from NetSuite:
 
Vanta can read:
- 
Data about your users
- 
Needed to confirm that only active employees retain system access and that terminated employees are deprovisioned promptly. In Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, this allows Vanta to display available users when tracking or assigning access.
- 
Data about your employees
- 
Id
- 
Date created
- 
Department
- 
Email
- 
Employee type
- 
Employee status
- 
End date
- 
First name
- 
Hire date
- 
Job title
- 
Last name
- 
Release date
- 
Data about your active customers with given access to your NetSuite instance
- 
Id
- 
Date created
- 
Email
Vanta can write:
- 
Nothing (Vanta does not have write permissions)
 

## Related Articles
- 
NetSuite OAuth 2.0 Authorization Code Grant Flow <https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158074210415.html>
- 
NetSuite REST API Browser <https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157373386674.html#subsect_157373789239>
 

## Troubleshooting FAQ
Errors during installation
- 
Incomplete credentials – If your OAuth app connection is incomplete, Vanta will display it as (Incomplete) in the Edit Connections modal.
 
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1757023460/2943e385186e3e8466f537203eac/5797dc8e-ca17-4e1e-8f1f-168dbbe7c9ed?expires=1794967200&signature=48240118c56dc71b0ad9c0d516152c9f0b529c61b56c2a36205da602534df022&req=dSciEcl8noVZWfMW1HO4zbL5IAX5cY5Xg8AKVJyK9%2BGq5X02AIPoS%2FQSPxIb%0ACzv%2B%0A>
 
- 
In this case, edit or delete the connection. Vanta will not retrieve data until valid credentials are provided.
- 
Invalid credentials or missing scopes – Ensure your OAuth app is configured with Authorization Code Grant and Rest Web Services scope.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-netsuite--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-netsuite--02.png
- [image 03] ../../images/integrations/netsuite/connecting-vanta-netsuite--03.png
- [image 04] ../../images/integrations/netsuite/connecting-vanta-netsuite--04.png
- [image 05] ../../images/integrations/netsuite/connecting-vanta-netsuite--05.png
- [image 06] ../../images/integrations/netsuite/connecting-vanta-netsuite--06.png
- [image 07] ../../images/integrations/netsuite/connecting-vanta-netsuite--07.png
- [image 08] ../../images/ux/integrations/connecting-vanta-netsuite--08.png
- [image 09] ../../images/ux/integrations/connecting-vanta-netsuite--09.png
- [image 10] ../../images/ux/integrations/connecting-vanta-netsuite--10.png
- [image 11] ../../images/ux/integrations/connecting-vanta-netsuite--11.png
