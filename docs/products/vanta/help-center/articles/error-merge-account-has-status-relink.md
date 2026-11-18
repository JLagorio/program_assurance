# Error: “Merge account has status RELINK_NEEDED” (Justworks)

Source: https://help.vanta.com/en/articles/11345917-error-merge-account-has-status-relink
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Environment Details
- 
Justworks integration is no longer syncing, and an error banner is present on the integrations page stating, "Merge account has status RELINK_NEEDED"
- 
Users may also encounter frequent disconnection issues or errors related to insufficient permissions.
 

## Cause
- 
Justworks has recently implemented improvements to its authentication layer. Due to the changes on Justworks, existing customers will be prompted to relink their accounts.
- 
The transition involves adopting a Service Account authentication flow for improved security and reliability. This requires permissions to be reassigned to a dedicated email account specific to your Vanta instance.
 

## Resolution
- 
Click Reconnect from the banner on the Integrations <https://app.vanta.com/integrations> page or select Reconnect from the Integrations manage options.
- 
Follow the prompts to set up a Service Account in Justworks, ensuring permissions are assigned to a dedicated email account used for this integration.
- 
Verify that all required permissions are configured:
- 
Edit Company Settings
- 
Manage Employees
- 
View All Employee Information
- 
Upload and View All Documents
- 
If reconnection fails, delete the existing Service Account, recreate it, and try again.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760619/7af5735348c31ffa815211ab2797/21993178970260?expires=1794967200&signature=2f8132752f46f92b650914116b60ed7c9a4d1a449cfe9d4710fbfce5b0f09358&req=dSUmEM54nYdeUPMW1HO4zaRILuxAy1am3chAz1DaYwFJTmSTEdqBBRo0hmYx%0Ac83XIed%2F9aRDcq%2FzRjM%3D%0A>
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760620/09324977296c4d3a110bf93b4829/21993178986900?expires=1794967200&signature=29956e7467a6d64f03d5df82d56a498a9d8a67a2ed682c74fa6314819fe737aa&req=dSUmEM54nYddWfMW1HO4zSo6Sb0nNRmkEVeayl4NQ%2FRC8E4tlZ9mnCPgcIL2%0AHhR0msKbuBIuIrFNzDY%3D%0A>

## Images

- [image 01] ../../images/ux/integrations/error-merge-account-has-status-relink--01.png
- [image 02] ../../images/ux/integrations/error-merge-account-has-status-relink--02.png
