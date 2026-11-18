# Error: “The security token included in the request is invalid" for AWS inventory

Source: https://help.vanta.com/en/articles/11345897-error-the-security-token-included-in-the-request-is-invalid-for-aws-inventory
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Environment Details
After integrating AWS, you see the following error for resources on the inventory page:
 Could not fetch [Resource] for region "[Region]" for account "xxxxxxxxxxxx": InvalidClientTokenId: The security token included in the request is invalid
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759012/44b9249c7552340bc6ae5a468a21/19030548683412?expires=1794967200&signature=c397256d29875c5afb4afc8154ded5dd2756ebab9991597099c6d16916e2a738&req=dSUmEM57lIFeW%2FMW1HO4zQrNp2N9Rl3c0qS9A9zywq%2FRhwEc5bqY2EVMgu2n%0APLtm2DIL9FuKxlIagPo%3D%0A>
 

## Cause
You have selected an AWS region to be scanned in Vanta, but this region is not enabled in AWS.
 

## Resolution
- 
Sign in to the AWS console
- 
Select the region selector from the top right:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759010/c86679e0d45d921a8c5cbe039e3f/19030511998100?expires=1794967200&signature=9222d56de954fe768bed3fe2ab87dab2d94297f4674cbe9e02f25a32ed483bf5&req=dSUmEM57lIFeWfMW1HO4zWXrU94UEePEyTpPsWLIaDNSa%2FwkpHOPfn1qda2a%0AA9pX%2Bu%2BrZLEOniqrALE%3D%0A>
 
- 
Ensure that the regions that are not enabled in AWS are not selected in Vanta. To do this, navigate to the integrations page in Vanta <https://app.vanta.com/integrations> and select "Manage" for AWS. Select an account to edit the region selection for:
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759014/704bbfac793edcab358fdfb56338/19030564537620?expires=1794967200&signature=14dd21e9838a6c75d63ebeb949116b07c57c7c402afebc3531ba2aae793cc72a&req=dSUmEM57lIFeXfMW1HO4zZrs0xM%2FvZf4WfkctNGi%2F58DW54d6hRnJTKYd%2B47%0Amgh0%0A>
 
- 
Ensure that the regions selected in Vanta are enabled in AWS:
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516759011/31fc8b46e3d242f60530b21daaed/19030548696980?expires=1794967200&signature=ebcf861ca7543d92b42c2985eeef65afcbcf44ee47adbbcd7594576199cdc9ff&req=dSUmEM57lIFeWPMW1HO4zVXBr5B5wMsxlUAHx2GYzuvEHg6fIGdjnB2UEAyN%0AB5fquUJmefgzZNmLQIE%3D%0A>
- 
Click Done to update the regions

## Images

- [image 01] ../../images/ux/inventory/error-the-security-token-included-in-the-request-is-invalid-for-aws-inventory--01.png
- [image 02] ../../images/integrations/aws/error-the-security-token-included-in-the-request-is-invalid-for-aws-inventory--02.png
- [image 03] ../../images/ux/integrations/error-the-security-token-included-in-the-request-is-invalid-for-aws-inventory--03.png
- [image 04] ../../images/ux/integrations/error-the-security-token-included-in-the-request-is-invalid-for-aws-inventory--04.png
