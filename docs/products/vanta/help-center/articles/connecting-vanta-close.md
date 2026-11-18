# Connecting Vanta & Close

Source: https://help.vanta.com/en/articles/12449430-connecting-vanta-close
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta integrates with Close to monitor and manage access to your tools. By syncing user access data, Vanta helps ensure that only active employees retain access and that access is promptly removed when personnel leave. This supports automated compliance needs, streamlines access reviews, and powers automated access requests.
 
Estimated setup time: Less than 10 minutes
 

## How It Works
Vanta connects to Close to sync user data on a regular basis. This data supports three key workflows:
- 
Automated compliance tests – Vanta automatically checks that accounts are linked to employees and deprovisioned when personnel leave
- 
Access Reviews – Synced users appear in Vanta’s Access Reviews, where approvers can validate appropriate access, confirm least-privilege access, and provide audit evidence
- 
Access Requests – Entitlements from Close are pulled into Vanta. Requesters can ask for specific access levels, approvers can review with context, and admins can track provisioning
Please note: Vanta connects to Close through Merge.dev <https://merge.dev/>, a secure third-party integration platform.
 

## Use Cases
Connecting Close to Vanta will enable you to:
- 
Monitor and manage personnel access to Close in real time
- 
Ensure only active employees retain access to company systems
- 
Simplify access reviews and support compliance requirements
 

## Requirements
- 
Vanta administrator account
- 
Close API Key
 

## Connect the Integration
- 
Log in to the Close app
- 
In the bottom left corner, select Settings
- 
In the Connect section, select Developer
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1750943535/0df1a72dd6a12f14c2a6282ebdaf/38685baf-472e-41cf-af6d-f6e4d951af61?expires=1794967200&signature=956277fb94f1a71a70add9cf3f3f6dd472a6946d3cb9c8d2a95744c7c22d5dd8&req=dSciFsB6noRcXPMW1HO4zUHr3Web4UGNwhk3XWmClrErEuk2CzNhLEspRIQF%0A6ue8%0A>
 
- 
Under API Keys, select New API Key
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1750944063/58d1e45fa7b6e8b5df376f660857/d8e32cff-2028-435c-b4c6-3c78cea88d2a?expires=1794967200&signature=2f089c6438e2c2484ab9850c0570efcf36836e2f304d7f0956cafaf3816d8c7f&req=dSciFsB6mYFZWvMW1HO4zWV1Uj99DQAO3dpjjsfuxFoSEi8tTkqZanrj9e4V%0A8nlp%0A>
 
- 
Enter Vanta in the API Key Name field and select Create API Key
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1750944724/395bb62321531703063c5ed994d3/eadf9f79-dbf1-4494-9748-a5951329fcc1?expires=1794967200&signature=7446516ce6039d8976ea55f65d6b3629332ab1881707c8b6ceda28a474e1df3f&req=dSciFsB6mYZdXfMW1HO4zRJH0mnXDim%2FSTpCsQdjQBZEdD2wGSfj6spVt%2Fj7%0A3DBj%0A>
 
- 
Copy and save the generated API Key. Important: You will not be able to view this key again
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1750945402/6ca52d9d9cd7dd1dc838eaa275a3/55b17c57-fc2a-4888-90d4-802b5a160fcf?expires=1794967200&signature=372aa921bc6c5abadc860de6cd95488b6f9f19164ac2cfa7a7183d5a9b890d38&req=dSciFsB6mIVfW%2FMW1HO4zZxHQmQLm%2Bvdh54NpBrOcfO6YwGTwk8v8j6c8HfI%0ArRb3JDeN%2Fqhznp%2B%2BjUk%3D%0A>
 
- 
In Vanta, go to the Integrations page, click Add integration, and search for Close. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Select Connect Close
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1750946000/218630ed1858e0770c72cecbd551/a892fcc3-a53d-4179-9c3f-f3c84daf5b59?expires=1794967200&signature=376f7b153fdf87dd0ca14699fdd6915448698485067c16ea716436e755f65cb1&req=dSciFsB6m4FfWfMW1HO4zTlmT97eQtNXixNBu1xbiWhU0psGScK4UYSKd5RY%0AJiXp%0A>
 
- 
Enter your API Key and select Next
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1750946574/4a8fe20fe79f26b0922be0f46d5c/f7456d0a-14dc-44ca-8c18-d618ca34eb56?expires=1794967200&signature=88ce67d78150c13676e60d2701e5740fdfc83e63b00730639e6ffb4abe9105ce&req=dSciFsB6m4RYXfMW1HO4zSpmI93UGXvd7ZOH1qUbZ3DanFYH%2Bh8TVXz293tw%0A2MTq%0A>
 
- 
After successful connection, you’ll see a confirmation screen. Select Next
 
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
Vanta accesses the following data from Close:
 
Vanta can read:
- 
Data about your users
- 
Used to confirm only active employees retain system access
- 
Ensures terminated employees are deprovisioned promptly
- 
Enables Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta> to display available users when tracking or assigning access
Vanta can write:
- 
Nothing (Vanta does not have write permissions)
 

## Related Articles
- 
Access Requests

## Images

- [image 01] ../../images/integrations/close/connecting-vanta-close--01.png
- [image 02] ../../images/integrations/close/connecting-vanta-close--02.png
- [image 03] ../../images/integrations/close/connecting-vanta-close--03.png
- [image 04] ../../images/integrations/close/connecting-vanta-close--04.png
- [image 05] ../../images/integrations/close/connecting-vanta-close--05.png
- [image 06] ../../images/integrations/close/connecting-vanta-close--06.png
