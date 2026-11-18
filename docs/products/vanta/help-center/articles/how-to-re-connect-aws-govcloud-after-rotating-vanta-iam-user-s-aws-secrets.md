# How to re-connect AWS GovCloud after rotating Vanta IAM user's AWS secrets

Source: https://help.vanta.com/en/articles/11346000-how-to-re-connect-aws-govcloud-after-rotating-vanta-iam-user-s-aws-secrets
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Administrators may need to rotate the Vanta IAM user's AWS secrets for compliance purposes, and this can result in Vanta losing the connection to the AWS integration. Administrators would then be prompted to reconnect AWS on the top of the integration page.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765332/d7dca1a09736543a87ecbddd14b3/13463241515668?expires=1794967200&signature=cc445fada87ff7671d3b4abd613137ca77a6b1a4cf7dbc41f1537df5c8e995df&req=dSUmEM54mIJcW%2FMW1HO4zRhAtMW%2FivSMPzFPn5%2FtiQa%2FR2ndi3vYQ0lhj6Ij%0Ate65HWkz2ejDbXanVto%3D%0A>
 
- 
They may also get a page not found when going to manage govcloud settings:
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765337/cb5a44963329e3d3fbb1b763917b/upload_4106839636636746470?expires=1794967200&signature=f08d849b8b580794dd661d0120fd5726a25ff6de59a1c787b6b2e28c470011d7&req=dSUmEM54mIJcXvMW1HO4zXSJ%2FuRX5kIzeqtWvLDUU97yodHHk1BNirjgYqle%0ATX7CX7CFXii7BCc4Vps%3D%0A>
 
- 
To resolve this, the AWS account would need to be re-connected without deleting. This can be done by adding the same account to your Vanta instance again. This would establish a new connection to the same account resources, which afterward allows the prior account to be deleted without any data loss.
 

## Resolution
- 
Head to the integrations page, click Manage, and then Edit
​
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765333/08e9fe16a5539b1d14844028089d/13463577487508?expires=1794967200&signature=ffb6e1b32a566ad48d49cb76fcceb8622c55f0026c890d5fbccec8f877a64dcb&req=dSUmEM54mIJcWvMW1HO4zVBnM8pXDh3Xr%2FS1riVLvGXaAhxy48n597NMmUnj%0AD9WZ%0A>
 
- 
You should see the current govcloud account listed as connected (the account number is hidden in the screenshot below)
- 
click Add new account
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765329/96d11359742cea2a8cb5e9119d74/13463616946452?expires=1794967200&signature=13486e3881dffdf4aaa45e305e73df9ff23f41177a5d56c215d4b88ce673459c&req=dSUmEM54mIJdUPMW1HO4zYFcomXbZ3LkIhHxW1yolIl4ez%2FQOODACP622qPM%0Az6nfLiryhFcTly9kTkM%3D%0A>
 
- 
Follow the connection flow as normal and keep in mind you are adding the same account information for the account that is currently error disabled. See Connecting Vanta & AWS account <https://help.vanta.com/hc/en-us/articles/4411799148692-Connecting-Vanta-AWS-account?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo2NTgyMTM5NDgxMzY0LCJ0aWNrZXRfaWQiOjQ0Njc4LCJjaGFubmVsX2lkIjo2MywidHlwZSI6IlNFQVJDSCIsImV4cCI6MTY3OTg0NDk5Mn0.XqbNgpPOegK5_36Y_-kGRVxwBLtUckjtVO4x4VpPUgg> for more information on adding AWS accounts. 
- 
Once successfully added, Vanta should begin to pull your AWS resources, you can click done on the bottom right of the screen once this loading completes
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765348/8b5c00f444108084d2c0e57a8db9/13463743763220?expires=1794967200&signature=e1bd810b673712c5d118dd3145f924c0ad2b5152fd6d871168ae7e4116e168a9&req=dSUmEM54mIJbUfMW1HO4zU9UYYfje6n%2FPxhoUgTeGk7BjRkwlH6SmVMQy8A0%0AOYzveyMSvGBZElmRufc%3D%0A>
 
- 
You can now click manage, and edit again, and delete the original govcloud account:
​
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765344/a6b49e555bc0d1df5534a90a5a63/13463577487508?expires=1794967200&signature=5fdcbab3547b90956d69b00da5d5c0e1706d7efce314511e5d36bb7fb8e84450&req=dSUmEM54mIJbXfMW1HO4ze2aJ%2FmSxBt267OM7zZD9mDExwvLAiyYBLxuMX%2BX%0AH4AG%0A>
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765356/1cfc57175e24fceb2076620155d0/13464038568596?expires=1794967200&signature=5ef6b6b20fcf699d368f536422654e5ee337731cac1a40120846265a4613babb&req=dSUmEM54mIJaX%2FMW1HO4zbuQIRXmQu4Ci9qYMyE1c1Cqb0cigJfHw6ujyShY%0AXO%2F9%0A>
 

## Additional Resources
- 
Frequently Asked Questions: AWS Troubleshooting <https://help.vanta.com/en/articles/11346058>
- 
Serverless Function Error Rate Monitored (AWS) <https://help.vanta.com/en/articles/11346066>
- 
Missing Metrics for Load balancer server errors monitored (AWS) Test <https://help.vanta.com/en/articles/11346031>
- 
How to Pass the Load balancers redirect HTTP to HTTPS (AWS) Test <https://help.vanta.com/en/articles/11346045>

## Images

- [image 01] ../../images/ux/integrations/how-to-re-connect-aws-govcloud-after-rotating-vanta-iam-user-s-aws-secrets--01.png
- [image 02] ../../images/ux/other/how-to-re-connect-aws-govcloud-after-rotating-vanta-iam-user-s-aws-secrets--02.png
- [image 03] ../../images/ux/integrations/how-to-re-connect-aws-govcloud-after-rotating-vanta-iam-user-s-aws-secrets--03.png
- [image 04] ../../images/ux/integrations/how-to-re-connect-aws-govcloud-after-rotating-vanta-iam-user-s-aws-secrets--04.png
- [image 05] ../../images/ux/integrations/how-to-re-connect-aws-govcloud-after-rotating-vanta-iam-user-s-aws-secrets--05.png
- [image 06] ../../images/ux/integrations/how-to-re-connect-aws-govcloud-after-rotating-vanta-iam-user-s-aws-secrets--03.png
- [image 07] ../../images/ux/integrations/how-to-re-connect-aws-govcloud-after-rotating-vanta-iam-user-s-aws-secrets--07.png
