# Connecting Vanta & OpenAI

Source: https://help.vanta.com/en/articles/11345715-connecting-vanta-openai
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 

## Overview 
Vanta integrates with OpenAI to monitor and manage user access to your OpenAI organization. By synchronizing user and role data, Vanta helps ensure that only active employees retain access and that access is promptly removed when personnel leave—supporting automated compliance workflows, streamlined access reviews, and structured access requests.
 
Estimated setup time: Less than 10 minutes
 

## How it works
Vanta connects to OpenAI and synchronizes user data on a recurring basis. This data powers the following workflows within Vanta:
- 
Automated compliance tests: Vanta verifies that OpenAI accounts are linked to active employees and are deprovisioned when personnel leave the organization.
- 
Access Reviews: Synced users are surfaced in Vanta's Access Reviews. Approvers can validate whether access remains appropriate, confirm least-privilege alignment, and generate audit-ready evidence.
- 
Access Requests: OpenAI roles are imported into Vanta. Requesters can submit access requests for specific roles, approvers can review requests with appropriate context, and system administrators can track provisioning activity.
- 
Automated Deprovisioning: When an employee is offboarded in Vanta, their OpenAI access can be revoked directly from Vanta. This requires the connected API key to be an organization-level Admin API key. For a full walkthrough of the offboarding workflow in Vanta, refer to Offboarding Personnel <https://help.vanta.com/en/articles/11345609-offboarding-personnel>.

## Use cases
Connecting OpenAI to Vanta enables you to:
- 
Monitor and manage personnel access to your OpenAI organization
- 
Ensure that only active employees retain access 
- 
Simplify access reviews and support compliance requirements
- 
Automatically remove user access through Vanta

## Prerequisites 
To connect the OpenAI integration, you must have: 
- 
A Vanta administrator account
- 
An Organization Owner role in OpenAI (required to access and generate organization-level Admin API keys) 
- 
An OpenAI organization-level Admin API key with the Organization Administration permission set to Read (and Write if you want automated deprovisioning)
- 
Your OpenAI Organization ID

## Connect the integration
Step 1: In Vanta, go to the Integrations page, click Add integration, and search for OpenAI. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
  
Step 2: Click on the integration tile and then click Connect.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2621477461/adb73a4c4728e6dbc1ce350395b4/image.png?expires=1794967200&signature=27acb6ddbfb5595a5c60599006ece24097f0f5755ce83e67c89f30a346baf6db&req=diYlF815moVZWPMW1HO4zZi4tX6pxTCOqW8qbxhYSw4YWQOqE%2BrXZoi5xiBg%0Acpml75%2BR8kbv5gEvtvY%3D%0A>
 
 
Step 3: Click Add OpenAI Credentials.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2621478964/4948771e1ef314fdc884c8718954/image.png?expires=1794967200&signature=fab8703d3c100297c84752e0b82e13c57d5a4bbd005f6993ae120cb047c0a320&req=diYlF815lYhZXfMW1HO4zdqpOHcYXxRnagaMGUGjjHiZWNVECrkJthJ31NLU%0AuUn%2B1CUGBXtQLFDtmho%3D%0A>
 
 
Step 4: You will be prompted to enter your API key and the Organization ID. You can also select the checkbox to enable Vanta to automatically deprovision. 
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2621481228/c45d80c8e67bbc63d87e5634cefe/image.png?expires=1794967200&signature=6c8a247d78e97f8c6faa3dd7abad3415982b1993aefa6a4a2e7aee501782afa0&req=diYlF812nINdUfMW1HO4zUXfM%2FgFS%2B8UILav8%2BF%2BeFh7xXWI7PjK4esTqs89%0Adkc9gcl3nSi79zAwh4M%3D%0A>
 
 
Step 5: Log in to your OpenAI account and navigate to Settings > Organization > General <https://platform.openai.com/settings/organization/general>. Copy the Organization ID.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2131151853/028d5e5f9f50fa45ce3b09bdd036/71f11d60-3bc5-4f38-8897-440a06f283ca?expires=1794967200&signature=cadd2e9362e5330be57668886567d7ad653f00550b0ce43a624794b83055fe8e&req=diEkF8h7nIlaWvMW1HO4zem%2F%2Fy3eDQ6JFOjEp7JxcnInMvQnLDsFcw%2B%2F5lBZ%0Am9thrqK7bxiAWBJ5tJc%3D%0A>
 
Step 6: Go to Settings → Organization → Admin keys <https://platform.openai.com/settings/organization/admin-keys> and click Create new Admin key. Under Permissions, select Restricted and set Organization Administration to Read (or to Write if you plan to enable automated deprovisioning). Leave every other scope set to None. Copy the key; it is shown only once.
⚠️ Note: Keys created anywhere other than the Admin keys tab — project keys, or keys created in a ChatGPT workspace — cannot reach the endpoints Vanta uses, even if they look valid.
 
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2621434559/bed7cccfa8dbb1ba21230d5de433/image.png?expires=1794967200&signature=5cc59b31504b12c09dccbe4ae83ccf8d842deaa88b49994e06fb0251aa8cc8e1&req=diYlF819mYRaUPMW1HO4zadavf%2BdrRscOYLDY9%2BN7xnqmiJ4SsHPieeXN2aw%0Awi%2B5WuENBDKpXiFerTk%3D%0A>
 
 
Step 7: Return to Vanta and paste the Organization ID and API key into the corresponding fields. Click Validate and store.
  
Step 8: A confirmation message will appear indicating that the connection was established.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2131158550/47efe6e48cfbe8228e11a57ba91d/489a248d-677a-46ed-a2b0-938b29b61a56?expires=1794967200&signature=b72bd6f1b245a657820f9bb942cfe6c003db4ba9a0b5dde040993368f21a6dc0&req=diEkF8h7lYRaWfMW1HO4zRZ1V1okO47IYJzUEXKE7PQUIBoWcuPlGz%2FhctQs%0AgkjcVHBV9IgHs%2BKeulE%3D%0A>
 
Employees will appear in Vanta within approximately 30 minutes.
ℹ️ Note: To enable automated access deprovisioning (removing users directly from Vanta), the API key used to establish the connection must be an organization-level Admin API key with Organization Administration: Write. If you connected with a personal or project key, or with Read-only permission, reconnect using a key that has Write.
 

## Capabilities
The OpenAI integration supports the following resources and workflows within Vanta. The table below outlines which objects are supported, how they are used (for example, Access Reviews, Access Requests, or Automated Tests), and any limitations imposed by the OpenAI API.
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
Not supported by OpenAI API
 | 
Roles/Entitlements | 
✅ | 
Access Reviews <https://help.vanta.com/en/articles/11345416-access-reviews>, Access Requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>
 | 
Last Login | 
❌ | 
Not provided by OpenAI API
 | 
Access Deprovisioning | 
✅ | 
Remove users directly from Vanta (requires Organization Administration: Write)

## Permissions
Vanta accesses the following data from the OpenAI API:
 

## Read access
Vanta can access: 
- 
User data: Granted by Organization Administration: Read. Vanta reads your organization's member list (id, email, name, role, date added) to verify that only active employees retain access to your OpenAI organization and that terminated employees are deprovisioned promptly.

## Write access
When automated access deprovisioning is enabled, Vanta can:
- 
Remove organization members from OpenAI
Requires Organization Administration: Write. Vanta calls OpenAI's remove-organization-member endpoint and nothing else.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-openai--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-openai--02.png
- [image 03] ../../images/integrations/openai/connecting-vanta-openai--03.png
- [image 04] ../../images/integrations/openai/connecting-vanta-openai--04.png
- [image 05] ../../images/integrations/openai/connecting-vanta-openai--05.png
- [image 06] ../../images/integrations/openai/connecting-vanta-openai--06.png
