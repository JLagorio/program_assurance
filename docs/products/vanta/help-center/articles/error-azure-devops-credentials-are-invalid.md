# Error: Azure Devops "Credentials are invalid"

Source: https://help.vanta.com/en/articles/11346056-error-azure-devops-credentials-are-invalid
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When connecting or using the Azure DevOps integration in Vanta, you may see a "Credentials are invalid" error.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768727/3a64a1b33d0d48b8f1e8c516d2c3/24945038482452?expires=1794967200&signature=8cb9c66216b5e2aa9e4619165a2e60f00c6e6d0fcd306d59f50e2a3d30d62253&req=dSUmEM54lYZdXvMW1HO4zehulLJQjsaMXc4pTQmCOkEP0Od6wpTn%2FiHOZYBX%0AE47EwOwGpla2vL63Jl0%3D%0A>
 

## Cause
This error typically occurs for one of the following reasons:
- 
Your Entra ID credentials have expired or been revoked.
- 
Admin consent for the Vanta app registration was not completed during setup.
- 
Your connection was created using the legacy Azure DevOps OAuth flow, which is no longer supported.
 

## Resolution
To resolve this error, relink your Azure DevOps credentials:
- 
Navigate to Integrations in Vanta and find the Azure DevOps integration.
- 
Select Manage, then Edit.
- 
Follow the on-screen steps to re-authenticate via Microsoft Entra ID.
⚠️ Note: You will need an account with admin consent permissions in your Microsoft Entra ID tenant to complete the relink. If you are unable to grant consent, contact your IT or Entra administrator.
 

## Still seeing the error after relinking?
Please reach out to [email protected].

## Images

- [image 01] ../../images/ux/integrations/error-azure-devops-credentials-are-invalid--01.png
