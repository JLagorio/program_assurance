# Connecting Vanta  to an AWS Organization

Source: https://help.vanta.com/en/articles/11345628-connecting-vanta-to-an-aws-organization
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

You can connect your AWS Organization to to Vanta in one of two ways: 
 
Option 1 (Recommended): Connect using CloudFormation 
This is the preferred and fastest way to connect your AWS Organization. CloudFormation automatically creates the required policies and roles in your AWS accounts, reducing manual steps and minimizing configuration errors. Follow the steps here: Connecting AWS with CloudFormation <https://help.vanta.com/en/articles/11345623-connecting-aws-with-cloudformation>.
 
Option 2: Connect manually using the AWS Management Console 
If you prefer to manually configure policies and roles in the AWS Management Console, follow the steps below.
 

### Supported connection patterns
Before connecting, review what Vanta supports for AWS Organizations: 
- 
You can connect multiple AWS Organizations to a single Vanta workspace. 
- 
You cannot mix Organization-level and individual Account-level connections   within a single Vanta workspace. If you have already connected individual AWS   accounts, you must remove them before connecting via an AWS Organization.
- 
You cannot connect the same AWS Organization to multiple Vanta workspaces.   Each AWS Organization can only be linked to one Vanta workspace at a time. 
 To connect individual AWS accounts instead, see Connecting Vanta & AWS Accounts <https://help.vanta.com/en/articles/11345630-connecting-vanta-aws-accounts>. 
 
As a part of the AWS cloud provider integration, Vanta supports the detection and linking of all your AWS accounts via your AWS Organization Management account.
- 
Vanta will scan all the AWS accounts associated with your AWS Organization, detect when AWS accounts are added or deleted in your organization, and automatically update your inventory in Vanta.
- 
If you want to connect an AWS account rather than an organization please refer to Connecting Vanta & AWS Accounts <https://help.vanta.com/en/articles/11345630-connecting-vanta-aws-account>.
- 
If you are migrating from connecting via individual AWS accounts, please first delete individual AWS accounts in Vanta.
- 
If this is your first time connecting Vanta with AWS, you need to prepare your AWS environment.
You can connect to one or multiple AWS Organizations. Connecting an AWS Organization aligns all AWS accounts under the organization to the same control mapping within a Vanta workspace.

## Delete individual AWS accounts in Vanta
- 
If you have already connected AWS with Vanta by adding individual AWS accounts, you must delete those accounts before you can connect via your AWS Organization.
- 
If you've assigned owners or descriptions for resources within Vanta, this data will be erased when you delete your credentials. For this reason we advise against making this change in the middle of an audit. 
- 
To delete AWS accounts, go to Integrations <https://app.vanta.com/integrations>, Cloud Providers, and Amazon Web Services.
- 
Select Manage followed by Edit and then Delete (trash icon) or Delete all accounts.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764155/c266b0db73bb7b7f4b4d16e721ac/8455107698324?expires=1794967200&signature=fd02234bc97429e98c344bf0114c9e9d5f3db0e552276fb26077f6822034e1f1&req=dSUmEM54mYBaXPMW1HO4zUk9NtlPmo6UlnXkcStx6m%2Bt9rosLVOpZOlck7wr%0A0AuWVLLccHPSYFGP%2BDA%3D%0A>
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764157/6bc3ad11dd4d5c94a0ec0dca7dbd/9847632369172?expires=1794967200&signature=e9f276764c4e07ae6bb79f13184378f8cf80d5cc37df205223b2163f277dc5dc&req=dSUmEM54mYBaXvMW1HO4zXFwDJCGaWmO2VSf76jv5q04WeXncYiPOqp4Hr4F%0AIyV8yhEQURVSQ8ujcic%3D%0A>
 
We strongly recommend using CloudFormation instead of the manual console method below. CloudFormation automates policy and role creation across your AWS Organization and reduces the risk of misconfiguration. If possible, use Connecting AWS with CloudFormation <https://help.vanta.com/en/articles/11345623-connecting-aws-with-cloudformation>.
 

## Prepare your AWS environment
To prepare your AWS environment to integrate with Vanta, you need to do the following two things:
- 
Configure each AWS account in your AWS Organization so Vanta can scan them
- 
Configure your Management account and connect to Vanta
In Vanta, go to Integrations <https://app.vanta.com/integrations> > Cloud providers and add AWS. In the connection flow, choose to connect with "Organization."
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764158/e51f15d53ba727f0f77c51ef2568/10376580039828?expires=1794967200&signature=9cddb35fbee7129bb3a20a1ab0de4e32069c57702d31ae54c10308e8d09d948c&req=dSUmEM54mYBaUfMW1HO4zfxuDrqf8j4nOXaC8sEvozhl0EB40KbdzQXS%2FVL%2B%0AWbStBefXYcZV4WmADzM%3D%0A>

## Select Products
During the first connection step, You'll be prompted to select the products from AWS you'd like to connect to Vanta. The products selected may change the Policy Permission generated on the Policy Creation step. For Example, Adding the AWS CodeCommit product generates the associated permissions needed in the Policy:
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764163/7834074e3c7094e9cdbc067958ac/20150662897300?expires=1794967200&signature=7f6ac62c16f6971f23a10c8b72e569f28107b59e95026cd80215f0080ff496b4&req=dSUmEM54mYBZWvMW1HO4zZhRltYsZmxflrg1%2BfXdi4K%2FynwBTx6OR3gGGvVM%0AfnL2KDdxa1f%2B9mGP0kA%3D%0A>

## Policy creation
For each account, create a policy in AWS policy creator:
- 
Navigate to the AWS policy creator <https://console.aws.amazon.com/iam/home?#/policies%24new?step=edit>. 
Once there, click on the JSON tab. Note: AWS inline policies <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html> are not supported.
- 
Paste the policy: Take the snippet in the step below and paste it into the AWS Policy editor:
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764173/f076f3ae1ecb41e15e2074526d9b/20150662903060?expires=1794967200&signature=c98c3d9a20865f2bed4d1be9a38db6758023b6caa347b86e176324db937d079e&req=dSUmEM54mYBYWvMW1HO4zeu1QpniXAffI2kRsotVa9yYNnJC77jL3uh3Ym0W%0AiZ777zJi8hecXlVSajI%3D%0A>
- 
Review the policy and name the policy VantaAdditionalPermissions
- 
Click Create policy

## Role creation
For each account, create a role in AWS role creator:
​
After the policy is created in AWS, return to Vanta and click Next to proceed to the Role creation section:
​
​
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1611479995/48d4f2365af4499aed1c0befd932/29860782419732?expires=1794967200&signature=8ae548888f31e750c2f89c8f91997b9d76a00a9b57ec1e0b885c53d21705b8dc&req=dSYmF815lIhWXPMW1HO4zdgsGiQLagdSUjxo3pMW1rVtBLkLinaLbPLr1Y2R%0AN0TBvdUFKF75nwuZu%2Fw%3D%0A>
- 
You will be instructed to navigate back to AWS and head to roles page in IAM. This can be found by going to the left hand menu, and selecting roles under 'Access Management':
​
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764796/3685768274fda5d47056007b87f1/29861572115732?expires=1794967200&signature=740f0f0900eb09415b87d2166ddcf2094862f923a518c16b2e8c60564c43cb6c&req=dSUmEM54mYZWX%2FMW1HO4zWPfwMDes3sl54wWO%2BReJEuxnu6El8R4pf7OkEYR%0AmuNH%0A>
- 
Click on the 'Create role' button on the top right:
​
​
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764799/61c6247b113a8c191b674f10f258/29861598787988?expires=1794967200&signature=91d3ba190312265c90fdc9f25bc057d81e86c344dedb11cae7419c7ad8c95d0b&req=dSUmEM54mYZWUPMW1HO4zeRbEES%2B%2FGx0iCa7Zple%2FyC%2FZYGOrUKh6S99dj23%0AyWVk%0A>
- 
Then select 'Custom trust policy' as the Trusted entity type :
​
​
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764813/4862d0db3976e55498ddb0355893/29860812285460?expires=1794967200&signature=6a471f40242e6afa12f29258d8393258a22848f028c6d4c9cd19bac85e3e7250&req=dSUmEM54mYleWvMW1HO4zVbK99CV9jrgkdic9nWbjTWOgnC8KNKkhtXse%2F9c%0AROaU%0A>
- 
A text editor will appear on the bottom of the page after the selection is made , delete all of the existing text:
​
​
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764830/98e9bd78dcc8261c38c4fefbf062/29860782435092?expires=1794967200&signature=fa0414c761572c67d80ee170728cf20e24bcc7d0c2af66f5de361b30b1dea53f&req=dSUmEM54mYlcWfMW1HO4za4DLIKQ8yK9dueigiSNhOImTJ22rAc%2F8AwPbGf2%0Ak0gJ%0A>
- 
Then head back into Vanta and copy the snippet below step 3 and head back into AWS and paste it into the editor. From there click Next on the bottom right of the page:
​
​
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764826/24c406cb4bfda04aaaa5121073de/29861770761492?expires=1794967200&signature=094dbd2b3b1fef994b10ba57e8c4dfffcdcf8219146320d8b3aab63739305b30&req=dSUmEM54mYldX%2FMW1HO4zevVKyO4PCTgTZnCXKeKvYz0PQWO8Xnchvp7oEUt%0Ai3oq%0A>
- 
You will be taken to a page where you will grant the role specific permissions, those being the SecurityAudit permission set and the VantaAdditionalPermisisons you created in an earlier step. Both these permissions are required for the integration to work properly, do not omit either. 
​
- 
You can search for these permissions in the search box and click the box next to them to grant the permission to the role.
​
​
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764833/fd8ffe208795b65e6dcc912e4a84/29860782442132?expires=1794967200&signature=0388b04ea203d2ba06c390e1852f8461dc30a98967d2c0dd179c624234ef329d&req=dSUmEM54mYlcWvMW1HO4zW6ogUwUyOeVMrSVE7btF4ziiXIKnCzbePEycgLM%0AYHJJ%0A>
- 
The searching and selecting process needs to be done one by one. You can click next when you have checked off both:
​
​
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764837/4ec3cb8c8376d2ff157c1e4291e3/29862124776596?expires=1794967200&signature=4dc35522bb5224a26a338fe3349e4c68bf75d55d944b4a90fdba6034cda3a3ee&req=dSUmEM54mYlcXvMW1HO4zYAr3Eg%2B9kVCPI68Fi61gNLAmfSQ%2FN4zheUtii%2Bz%0AVBhS%0A>
- 
You will be taken to a page where you must grant the role a name, and a description. Name the role vanta-auditor and enter your desired description, then click Create role on the bottom right of the page:
​
​
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764836/baefd3918c938535d1cae598bc68/29861831645972?expires=1794967200&signature=9ffdc952f4c821002545ddb10a1342d1c98b75fb4c48111c33d9cb7512be1eb9&req=dSUmEM54mYlcX%2FMW1HO4zTqyjB3ky8S2MVIS8M3VT41IE5TxfM5Fs0XF%2BRDU%0AlsIv%0A>
- 
You will see a green success banner stating the role has been created.
​
​
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764841/af9ee93a372f26234e0d590e0127/29860812303252?expires=1794967200&signature=9ae9022efb101de89e8daa01f29c4e93baec05ffbb4d6990444a8fe72e8d7d8b&req=dSUmEM54mYlbWPMW1HO4zSKd4DN%2FST8ZqRFF05NNgrShvaP9ZkZhiHM6h8Vy%0AW4XR%0A>

## 
Configure your Management account and connect to Vanta
For your Aws Management Account, create a policy in AWS policy creator:
- 
Navigate to the AWS policy creator <https://console.aws.amazon.com/iam/home?#/policies%24new?step=edit>. Once there, click on the JSON tab. Note: AWS inline policies <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html> are not supported
- 
Paste the policy: 
Take the snippet in the step below and paste it into the AWS Policy editor:
[image 16]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764171/e529296ef9cfa881b3d5a3f489b7/20150654042772?expires=1794967200&signature=b7b85346e5656cd1259ddb090cf920caee68d51e3a874956db813bc4dd60cfed&req=dSUmEM54mYBYWPMW1HO4zdM%2FaCJXpzE1wiBCzAMYh5%2BY6H3PXl%2F%2BlxWXOf1l%0AW1neH8fe3IUtye4R8l8%3D%0A>
- 
Review the policy and name the policy VantaManagementAccountPermissions
- 
Click Create policy
- 
When prompted, enter the ARN of the “vanta-auditor” role you created in your Management account.
[image 17]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764181/6c400e92bd31755f73b8d554a200/10376642577812?expires=1794967200&signature=244daccc0e9bbf7a251abede260fe071abeb4450306b39495dc4789619a76649&req=dSUmEM54mYBXWPMW1HO4zUL%2BwkYtJFHIgVSSvMaCYXCyL%2FpAS7O5ndtwN7ex%0AtseWa7Qu5xJcBhrG%2Fu8%3D%0A>
- 
You can select all regions where you have the infrastructure. Vanta will scan your organization for resources in all your chosen regions.
​
[image 18]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764186/722768dc969dfd22ea04bd30a758/10376709295636?expires=1794967200&signature=e817899c7cd791fde97f199912e9bfc707d3646c63803d947e49ac7b24e3144e&req=dSUmEM54mYBXX%2FMW1HO4za4hxVylY%2FAvMJMqiSFc8WJm2FTGSg2YZPDJiTr6%0Ails0%0A>
- 
Vanta will scan your AWS Organization for accounts and resources. It can take up to 2 hours to finish scanning.
- 
You can see your AWS accounts in Inventory <https://app.vanta.com/inventory> after completing the scan.
- 
To configure the scope of your scanned resources for each AWS account, go to Integrations <https://app.vanta.com/integrations> > Configure scope.
[image 19]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764190/2079e13d5f587b28b53ce47cc9aa/8605280678548?expires=1794967200&signature=c26123c15a350821f8f47c2438f85c629689dedef2f46c246b8fcd7a6825ed03&req=dSUmEM54mYBWWfMW1HO4zQSs5lFmmOV90H6WFanDjAvRLKVdOSqfhAvfDNol%0AXZTC%2BImGhc0ihXbK%2FdE%3D%0A>

## Images

- [image 01] ../../images/integrations/aws/connecting-vanta-to-an-aws-organization--01.png
- [image 02] ../../images/integrations/aws/connecting-vanta-to-an-aws-organization--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-to-an-aws-organization--03.png
- [image 04] ../../images/integrations/aws/connecting-vanta-to-an-aws-organization--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-to-an-aws-organization--05.png
- [image 06] ../../images/ux/integrations/connecting-vanta-aws-accounts--15.png
- [image 07] ../../images/integrations/aws/connecting-vanta-aws-accounts--16.png
- [image 08] ../../images/integrations/aws/connecting-vanta-aws-accounts--17.png
- [image 09] ../../images/integrations/aws/connecting-vanta-aws-accounts--18.png
- [image 10] ../../images/integrations/aws/connecting-vanta-aws-accounts--19.png
- [image 11] ../../images/integrations/aws/connecting-vanta-aws-accounts--20.png
- [image 12] ../../images/integrations/aws/connecting-vanta-aws-accounts--21.png
- [image 13] ../../images/integrations/aws/connecting-vanta-aws-accounts--22.png
- [image 14] ../../images/integrations/aws/connecting-vanta-aws-accounts--23.png
- [image 15] ../../images/integrations/aws/connecting-vanta-aws-accounts--24.png
- [image 16] ../../images/ux/integrations/connecting-vanta-to-an-aws-organization--16.png
- [image 17] ../../images/ux/integrations/connecting-vanta-to-an-aws-organization--17.png
- [image 18] ../../images/ux/integrations/connecting-vanta-to-an-aws-organization--18.png
- [image 19] ../../images/integrations/aws/connecting-vanta-to-an-aws-organization--19.png
