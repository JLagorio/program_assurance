# Updating your AWS integration to utilize Identity Store

Source: https://help.vanta.com/en/articles/11345620-updating-your-aws-integration-to-utilize-identity-store
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

If you already have AWS integrated with Vanta, you have the ability to allow Vanta to read resources from the Identity Store.
- 
First, you will need to update the permissions of your "VantaAdditionalPermissions" policy in AWS <https://console.aws.amazon.com/iamv2/home#/policies/details/arn%3Aaws%3Aiam%3A%3A787876079208%3Apolicy%2FVantaAdditionalPermissions?section=policy_permissions>. The following permissions need to be added to the policy"identitystore:Describe*",
"identitystore:Get*",
"identitystore:IsMemberInGroups",
"identitystore:List*"
- 
You can add these in the "Allow" section of your VantaAddtionalPermissions policy <https://console.aws.amazon.com/iamv2/home#/policies/details/arn%3Aaws%3Aiam%3A%3A787876079208%3Apolicy%2FVantaAdditionalPermissions?section=policy_permissions>:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762081/d69fbafc57f5fb25d4b19f57b16d/15615030452756?expires=1794967200&signature=da06466b271207f0e36732a6df65efb31ed03dea21bf84c0e3f3ee48fd280bb1&req=dSUmEM54n4FXWPMW1HO4zesIWNhuaBDzY1W2oaAAHZYsQg9Kjt2w4NApGQ2a%0A2vEDjBES0yDpOjB%2F1v4%3D%0A>
- 
After the policy has been updated, Navigate to the integrations page <https://app.vanta.com/integrations> and select Manage>Edit on the AWS integration:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762079/bdcc9fdc4c571956861beb56cc05/15615109143188?expires=1794967200&signature=1cf1cc695553db1829821710cc7f8ca5fd585640c810bd0c98b5d90959f3d497&req=dSUmEM54n4FYUPMW1HO4zX%2BVFk7lzzdro7vRZQHGovn9qOwK8M4sx47H9ZFH%0AsbS6RFmsk6QrI63Z6Go%3D%0A>
- 
Select the pencil icon next to your account
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762080/f321cdb8c7d3e3e9486fd2c1452f/15615189978900?expires=1794967200&signature=df97ad00da9b3460c0b17622ca9c8fbca531f0c1d9840261ff1e9e4c8c6ff18a&req=dSUmEM54n4FXWfMW1HO4zZMo%2BMczJbqxb5oyzfYHS4MvrsUJtOiXAJe1SJHU%0AVd6kMeAgkLYU8UQcHC8%3D%0A>
- 
Enable the AWS IAM Identity Center option
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762076/22cf944b74b285f4e587768e5d52/15614983399316?expires=1794967200&signature=b7b462041a91630fb0e1abb0beff07fa18fe5c02b9daeba294c167e4bce14622&req=dSUmEM54n4FYX%2FMW1HO4zWX8JiVnt9H1w3tAOeQH8eRugTkGa7AsxVdRC5m1%0ALBfmt6MWzL9snfvLriA%3D%0A>
- 
You will find the Identity store ID and IAM Identity Center ARN information on the Settings page of the IAM identity center in the AWS console here
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762096/87b28c5d18a393b0c6a3e5e354c2/21331567151380?expires=1794967200&signature=0cfdc045dea619bd5afdf40fb94e1e1b7962b12f9c3621111540899be102dee6&req=dSUmEM54n4FWX%2FMW1HO4zbHAuCy2Kuya7e7izi0gSZfwxGHmzAdVAVQnRwaJ%0AHM9541NFio%2FLbH4ClMw%3D%0A>

## Images

- [image 01] ../../images/integrations/aws/updating-your-aws-integration-to-utilize-identity-store--01.png
- [image 02] ../../images/ux/integrations/updating-your-aws-integration-to-utilize-identity-store--02.png
- [image 03] ../../images/ux/integrations/updating-your-aws-integration-to-utilize-identity-store--03.png
- [image 04] ../../images/ux/integrations/updating-your-aws-integration-to-utilize-identity-store--04.png
- [image 05] ../../images/integrations/aws-identity-store/connecting-aws-identity-store--02.png
