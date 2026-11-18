# How to edit Region Selection for AWS accounts/organizations

Source: https://help.vanta.com/en/articles/11345950-how-to-edit-region-selection-for-aws-accounts-organizations
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When an AWS organization or account is linked to Vanta, customers can select which regions they would like to monitor in Vanta.
 

## Procedure
- 
From the Integrations page, select Connected and search for AWS.
- 
Click Manage, followed by Edit.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762521/215b37a717a2f85f7eaf1953d5ef/15411444803988?expires=1794967200&signature=8000667dc7a60eb8ee4eea6f27d5e8b0be67f8f2152fc9f5098e568cfbd13827&req=dSUmEM54n4RdWPMW1HO4zSKTg8BRc1DWE42jG69HX1tIIRPW3EvVO5gXIBHG%0AO2VRqsRF1drJmDwsEjo%3D%0A>
- 
Click the edit option next to the account number
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762520/42b0a8ae7f9ef761e8a9c91801df/28361121423636?expires=1794967200&signature=1596fd5aa33d7b6148f60dea4dc8e625df08e1121889eb93fd242c7654caa697&req=dSUmEM54n4RdWfMW1HO4za1Mo5hg4YvrEUgUb2DlgGXV2ALpTTNNDVNfPojE%0AJjNXPKfUhpuiNCJOZkA%3D%0A>
- 
You will be taken to the Edit AWS account page. Click on (2) Region selection.
- 
To remove regions, click the X next to the region you want remove
- 
To add regions, click into the space labelled +Add Region to display a dropdown of available regions.
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762522/24ca155910d5e9415ea3f5a9fd17/28361121427604?expires=1794967200&signature=05437055d18220960a77b0d11b1b114cdbdfb1f5fa361f800c28f5c50108bcf6&req=dSUmEM54n4RdW%2FMW1HO4zZlKtGaa9kPVVRbb7et09I%2F50ADgqIJFWPvvhwud%0ABHllWfEmBNRF90M9h3U%3D%0A>
 
- 
Click Done
 

## Common Issues
- 
Region selection can only be done at the organizational level if an AWS organization is connected to Vanta. If individual accounts are connected, region selection will occur at the individual account level. 
- 
For AWS Organization connections, Region data will only be recognised at the top organizational level, not for the individual sub accounts. If any of the regions monitored are not enabled on the sub accounts managed within the organization, this can cause the fetch to be disabled.

## Images

- [image 01] ../../images/ux/integrations/how-to-edit-region-selection-for-aws-accounts-organizations--01.png
- [image 02] ../../images/ux/integrations/how-to-edit-region-selection-for-aws-accounts-organizations--02.png
- [image 03] ../../images/ux/integrations/how-to-edit-region-selection-for-aws-accounts-organizations--03.png
