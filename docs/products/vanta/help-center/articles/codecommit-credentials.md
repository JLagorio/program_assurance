# CodeCommit Credentials

Source: https://help.vanta.com/en/articles/11345892-codecommit-credentials
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

To support CodeCommit on /changes, you will need to update the permissions to the vanta-auditor role.
- 
Go to IAM Roles on your AWS Console and select the Vanta auditor role
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758664/0803019d16310c5af74341a2cffa/W3jS-U3QwVXgpU5RqLmKzFmb7BVjzdkHFwwtjwlF56FV3PpH7emkfkcGkWAXFF_Q1sX6RpcpCWDdA-ZeeS7G3VDvVCk--N5RAcSmAb6698CzlpKcJmZi3FNBKTs0iVGEC4_j6j2X3I-5VrA7eMEethI?expires=1794967200&signature=eb6bfd6d5470dfb894c149097da637a3de5e40cf7da58842bded3606a2e3bcb1&req=dSUmEM57lYdZXfMW1HO4za00WYL2dcUlYJMudMDe6ChuOsrbeseFJyHGkjcF%0AFuJOAmED7HUyAvoZXhM%3D%0A>
 
- 
Click the VantaAdditionalPermissions permission policy
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758667/a9494c69bd2278101ea0525d41a6/0L25h9F2EI5XsX9wWhmHr3Y10R2KcYQ-D4JMnbweVJTTKV2FhPi1Bg1JgJ3EnYBNn1UN8qErK7aPWD4_cSqb9mCFkbjypv_PCuy4l8r4GW4jlLqoND9uEmYrboXcpW1Ey-lGebFtqVpjYLmD9LKeynA?expires=1794967200&signature=30f06db1db347be3c3eb528e4c0a78ace1dbf7e4c111e5d102c4d5441fa0b35f&req=dSUmEM57lYdZXvMW1HO4zcOZ0MW8Hv4%2B2%2BYrIVkHVJxQJevx2btZ285GHMvZ%0AY0beMA2jV5ec1dAGEOE%3D%0A>
- 
Click Edit
- 
Select Visual and select CodeCommit permissions
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758668/e2635241c6969c241ff63798ef9f/lljKzgmSBSE1l9KFe3xrx8rvkMtKa0rUfBEUdONN4_mvutdaZQtTT4L1g3iN-hPSqVkdt5VfyCzpOmiI3p_ii9DOwN0E9cN_IKWCdS7rYRygbE_6IHAZDpUaPu0pnlWjctvNjMVYcAhSwzRfp5b8y_g?expires=1794967200&signature=f8f4d9ab09264725420660c124adae2a74cf0356c11df3c0373e1289c590c2ed&req=dSUmEM57lYdZUfMW1HO4zYZZ3MN0A8dsR1%2FLSUz%2BDwJSmh4wlg1gtKQhsjGK%0A3%2BbLj%2FYpc1i1XXwvFOE%3D%0A>
- 
Allow the following permissions:
- 
ListPullRequests
- 
GetApprovalRuleTemplate
- 
GetCommentsForPullRequest
- 
GetPullRequest
- 
GetPullRequestApprovalStates
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758658/3f8faa816fbf282d2caba6346e2b/xyf2euFMjs7l9szH3s3XAhWbbzADUmvhK7az0MPcxq4zguOAy0CPyST-EZyqHijTThmjp6d61m9ucepy26oMd8BwmnZsi3aidSIA-HXD9aRpxqMxt53DfUbfYqp-8AQOTyIA7YLPUbGeB1NWP7NqLLY?expires=1794967200&signature=86caaa298f0315aef770c0df971b19989a33e0a653e089bd6c57cb585864b1d9&req=dSUmEM57lYdaUfMW1HO4zX3jEksnn7K8XjdINxoi0q4GHLTkUoYKdYkNASVO%0AUpQaUdjHoMLyXkxigEM%3D%0A>
 
- 
Click Next
- 
Save Changes

## Images

- [image 01] ../../images/integrations/aws/codecommit-credentials--01.png
- [image 02] ../../images/integrations/aws/codecommit-credentials--02.png
- [image 03] ../../images/integrations/aws/codecommit-credentials--03.png
- [image 04] ../../images/integrations/aws/codecommit-credentials--04.png
