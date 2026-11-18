# Modifying the VantaAdditionalPermission Policy for Individual AWS Accounts

Source: https://help.vanta.com/en/articles/11345613-modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

When integrating AWS Vanta requires the permissions specified in the SecurityAudit policy attached to the VantaAuditor role as well as some additional permissions that are granted in the VantaAdditionalPermissions policy. 
 
The SecurityAudit permissions are created by AWS, while the permissions in the VantaAdditionalPermissions are dependent on which products administrators enabled on your AWS Integration. This article details how the permissions relate to the enabled product, and how to update them.
 

## Prerequisites
- 
The user in Vanta connecting must be an editor or an admin in Vanta
- 
The user must also have admin access to AWS, or permissions to create. modify and edit Roles and Policies in IAM

## What products are available for the AWS Integration?
When linking AWS, on the second step administrators are prompted to select the products used within their organization:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757615/e07f9ed467952b43e013238091c0/29860702049684?expires=1794967200&signature=a1d420db6b0b3e24b49ba1f9e9aaace3041d2e74a6ba0f09091a54403ce3db50&req=dSUmEM57modeXPMW1HO4zWXC0uCGCVh4jIwDbc%2Ftj%2F5TWPy6mo9XqTTrYuWs%0AvESQZ2fWturgEZ2MbNA%3D%0A>

​
The available products on this menu are:
- 
AWS Web Services (On by Default, Cannot be Disabled) 
- 
AWS CodeCommit
- 
AWS IAM Identity Center
- 
Amazon Inspector/Basic Scanning
Depending on the products enabled, the permissions that are granted in the VantaAdditionalPermissions policy can vary. These features also may incur additional cost within AWS if they are not already in use. You can hover over the tool tip (i) to see more details about how this feature works in Vanta:
​
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757612/9454524f7bc2c26c2c9a5b6ad604/29860681350804?expires=1794967200&signature=c2cf7daef85a2cf80f9349138dd91939aa31a88c8245815421ecd4ab8ba63a8f&req=dSUmEM57modeW%2FMW1HO4zViwdMAIRhXLcp%2BCioo4AZyYiriAoJHPkYTBS3B0%0AbZtnUmv5Cz0NafqP2DE%3D%0A>
 

## How do the products affect the VantaAdditionalPermissions Policy?
If you are only using Amazon Web Services, you are prompted to add a limited set of permissions that lack visibility into Code Commit, and AWS IAM Identity Center:​
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757608/3f11f620c5e5b525947dbfbb18ae/29861166219028?expires=1794967200&signature=4d298f53aa0cd6efd3fc24bf9ca127dde81901d620a50259f60bff78f38b9299&req=dSUmEM57modfUfMW1HO4zdazCneeRHJUb89I7ROVCt%2BPcg1w2limwwuYwvhp%0AAJhiPyFVNDIt5yhayxo%3D%0A>
​
Resources such as Alarms, EC2, RDS, IAM Accounts are still fetched but Inspector Scans, Code Repos, and AWS IAM Identity Center users are not.
When you enable another product such as Code Commit, the permissions expand to encompass the required permissions to have resources from that enabled product fetch along with the other enabled products:​
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757610/e10b02d17fcb456d5cf9dd1518bf/29861136540692?expires=1794967200&signature=6168e5644e1c70bb618d08d99188d21bf3de7ccae18214944964e39b6b09a39c&req=dSUmEM57modeWfMW1HO4zfyiq4NnSyF6YCuXKMr9DiyEFcV7T%2Fbwt2%2F7bgS4%0AZ0DVIBvr7dOjudtE70E%3D%0A>

​Enabling all four products results in the largest permission set:
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757645/67315cdd55829b83dbc33e777f42/29861166227988?expires=1794967200&signature=b1d9cc420eaf99c737e6744ac769ac445cd8360b1a3530a1c647ca0fa23a4f07&req=dSUmEM57modbXPMW1HO4zVOu1lSVcO0l6HHJOtiVuqSRfSbiaI8EEOFypmMV%0AIycSIMRZmLijflteZQA%3D%0A>

​And disabling one or more products results in a smaller set of permissions needed for the policy.
 

## I want to enable a product after I originally connected the integration, how can I go about doing this?
When you enable a product after the connection has been established, you need to first update the VantaAdditionalPermissions Policy in AWS to add Allow Actions for the specific product. 
​
The snippet below is the minimum set of permissions required for integration. These are sufficient for Amazon Web Services & Amazon Inspector/Basic Scanning products:
​{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "datapipeline:EvaluateExpression", 
	"datapipeline:QueryObjects", 
	"rds:DownloadDBLogFilePortion"
      ],
      "Resource": "*"
    }
  ]
}
 
If you only had Amazon Web Services enabled, and you now wish to enable the Inspector product, no changes need to be made to your VantaAdditionalPermissions policy.
 
If the AWS CodeCommit product is enabled, the following Allow Action needs to be added to but not replace the VantaAdditionalPermissions policy:
 {
      "Effect": "Allow",
      "Action": [
        "codecommit:GetApprovalRuleTemplate", 
        "codecommit:ListPullRequests", 
        "codecommit:GetCommentsForPullRequest", 
        "codecommit:GetPullRequest", 
        "codecommit:GetPullRequestApprovalStates"
      ],
      "Resource": "*"
}
 
If the AWS IAM Identity Center product is enabled, the following Allow needs to be added to but not replace  the VantaAdditionalPermissions policy:
​{
      "Effect": "Allow",
      "Action": [
          "identitystore:Describe*",
          "identitystore:Get*",
          "identitystore:IsMemberInGroups",
          "identitystore:List*"
      ],
      "Resource": "*"
}
 
Once the policy has been updated, you can go to the integration page in Vanta, click manage then edit:
 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757634/a87d244e8651f392824cff4647a8/29860702054164?expires=1794967200&signature=ac8183ff44826c6cf5af519b42421a5ace4e8c419570c05fc6f84cad5a3d2bf0&req=dSUmEM57modcXfMW1HO4zaTt7YvH8v1CndUqk%2BMQB5KawI1zj5qjSA8p%2BR39%0AJtpLTuWM9grEPzqE4EI%3D%0A>
 
Next click the pencil icon to edit the connection:
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757646/065b79dd4fbf2188a44e0ead228a/29860681352596?expires=1794967200&signature=b6d46f7aff6705b795e0a6d1f5117eb70ed2ec73e81165258b364b751adbf79e&req=dSUmEM57modbX%2FMW1HO4zTgSMTYyZGc9RUyFD%2F1dSZv2PHLhWSIn9ESWTuXo%0AOC2GunmAlIbuvXT5IfY%3D%0A>

​And then toggle on the desired product:
​​
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757647/90239d3f38bdedee0cf6d687f4ca/29860681358100?expires=1794967200&signature=4617bdcb1e38e044390a9da127f0539425bef3d866dc6ab2f0c87fab9fd582b7&req=dSUmEM57modbXvMW1HO4za04dOxaqUaGsKBD%2BB7dmS73mpzw8HvK5HfIoGzu%0Ax8rJRd%2FfW3OL7AFM8%2F4%3D%0A>

Then click next and done. If the VantaAdditionalPermissions policy was correctly updated, the new product should begin to work.
 

## Keep in Mind
- 
If you are having issues updating the policy , you can always go to the integrations page, click manage -->edit ---> Add new account on AWS and then go through the flow as if you are adding a new account. The key is to enable the products you are looking to have turned on and copy the policy that is generated. From there you can close the connection flow and update your VantaAdditionalPermissions policy in AWS: 
​​
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757658/241fcda9db416f0169f1fb9d2c32/29860702059156?expires=1794967200&signature=f68ca03a7185d7c0f6e85e041e7551f08a0cf2caa133d0d23d407aaa365cbbc5&req=dSUmEM57modaUfMW1HO4zYvktLBD9xWjqz2D81alC%2B0vqk6ak%2FUym22Z4jL2%0Aya3U%0A>

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-aws-accounts--05.png
- [image 02] ../../images/ux/integrations/connecting-vanta-aws-accounts--06.png
- [image 03] ../../images/ux/integrations/modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts--03.png
- [image 04] ../../images/ux/integrations/modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts--04.png
- [image 05] ../../images/ux/integrations/modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts--05.png
- [image 06] ../../images/ux/integrations/modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts--06.png
- [image 07] ../../images/ux/integrations/modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts--07.png
- [image 08] ../../images/ux/integrations/modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts--08.png
- [image 09] ../../images/ux/integrations/modifying-the-vantaadditionalpermission-policy-for-individual-aws-accounts--09.png
