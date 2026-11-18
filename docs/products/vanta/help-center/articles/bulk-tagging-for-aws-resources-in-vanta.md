# Bulk Tagging for AWS Resources in Vanta

Source: https://help.vanta.com/en/articles/14285780-bulk-tagging-for-aws-resources-in-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

## Overview
Bulk tagging lets you use tags on your AWS resources to automatically populate and manage inventory metadata in Vanta (including resource owners, descriptions, scope status, and data-classification flags). Instead of updating each resource manually in Vanta, you apply tags in AWS and Vanta reads them during each sync.
 
Use bulk tagging when you have a large number of AWS resources and want to manage inventory metadata at scale using Terraform, CloudFormation, or the AWS Console. You can also use it to remove entire AWS accounts from your compliance scope at once. Note that bulk tagging scopes resources fully in or fully out across all frameworks — it does not support per-framework or per-business-unit scoping.
 

## How bulk tagging works
Vanta reads tags from your AWS resources during each scheduled resource sync. When a resource carries a recognized tag, Vanta converts it into the corresponding metadata field in your Vanta inventory.
 
There are two ways to use bulk tagging:
- 
Vanta tags (default): Apply Vanta-specific tag keys directly to your AWS resources — for example, VantaOwner or VantaNonProd. Vanta recognizes these automatically with no additional configuration in Vanta required.
- 
Custom tag mappings: If your team already uses its own tagging convention, you can map your existing AWS tag keys to Vanta's tag types inside Vanta's UI. For example, you can configure Vanta to treat any resource tagged environment ≠ production as non-production.
Tags override manual settings. If you've already set a field manually in Vanta (for example, assigned an owner) and then add a tag for the same field in AWS, the tag value will overwrite the manual setting on the next sync. Once a resource's metadata is set by a tag, whether that's scope, owner, description, or data classification, those fields cannot be changed manually in Vanta. The tag in AWS is the source of truth, and Vanta will reflect whatever that tag says on each sync. If you remove a scope tag from a resource in AWS, Vanta will restore that resource to in-scope on the next sync. 
 
Note: Bulk tagging is read-only. Vanta reads tags from AWS but never writes tags back to your AWS account.
 

## Before you begin
- 
Your AWS integration must be connected <https://help.vanta.com/en/articles/11345630-connecting-vanta-aws-accounts> in Vanta.
- 
For AWS Organizations, the IAM role in your management account must have permissions to read tags on Organization accounts. This is included in the policies created during Vanta’s standard AWS setup. 
- 
You need the Manage inventory permission in Vanta to configure and save custom tag mappings.
- 
AWS tag keys and values must follow AWS character restrictions:
- 
Keys: up to 128 characters
- 
Values: up to 256 characters
- 
Allowed characters: letters, numbers, spaces, and _ . : = + / - @ 
- 
Tag keys and values are case sensitive 
If you plan to use the VantaContainsEPHI tag, your organization must have the HIPAA framework enabled in Vanta. This option is not visible otherwise.
 
 

## How to use bulk tagging

## Option 1: Apply Vanta tags directly in AWS (no Vanta configuration required)
- 
Apply one or more of the supported Vanta tag keys to your AWS resources using Terraform, CloudFormation, or the AWS Console. Refer to the tag reference table below for the full list of supported keys and expected values.
- 
Note: With VantaOwner, set this to the email address of a currently active Vanta user (e.g. [email protected]). For best results, use the email address of a currently active user in your Vanta organization. Vanta will display whatever email address the tag contains, but owner-related compliance tests may not pass unless the email matches an active Vanta user.
- 
Wait for Vanta's next resource sync.
- 
Vanta will read the tags and automatically update the corresponding fields in your inventory.

## Option 2: Map your existing AWS tags to Vanta
Use this option if your team already applies its own tags and you want Vanta to interpret them without adding new Vanta-specific tags to your resources.
- 
In Vanta, navigate to Assets > Inventory, and then select the Edit bulk tag button on the upper right hand corner. You can access it directly at https://app.vanta.com/inventory?bulk-tags=open <https://app.vanta.com/inventory?bulk-tags=open>, or follow the link from any inventory remediation prompt.
- 
In the panel that opens, select the AWS tab.
- 
Select the Custom tags sub-tab.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2204348345/79a8a8f6945572b9fd9c51a06d67/01935c6f-0a31-4291-b42b-de01fe2e71d0?expires=1794967200&signature=750c2480cc79aa0e03f18e4983c59766f577e6f628b963c4f6103956fd0759fc&req=diInEsp6lYJbXPMW1HO4zeSBA5C%2BH2gkdh4B9LemEkzSLb8%2BpiSgsRFBCTjB%0AYqwW%2F%2Faa9gvZU7Qf9uk%3D%0A>
- 
For each Vanta tag type you want to map, configure a rule using your existing AWS tag key:
- 
For owner, description, no-alert reason, and data-stored description: Select the IS operator and enter the name of your AWS tag key. Vanta will use the tag's value directly.
- 
Example: map my-owner-tag → VantaOwner using IS
- 
For non-production, user-data, and ePHI flags: Select equals or not equals, then enter your tag key and the tag value to match.
- 
Example: map environment ≠ production → VantaNonProd
- 
Click Save changes. You'll see a confirmation that changes may take time to reflect.
- 
Confirm the relevant tags exist on your AWS resources.
- 
Wait for Vanta's next resource sync. Vanta will apply your mappings and update inventory accordingly.
 | 
Note: You can only configure one custom tag mapping per Vanta tag type. If both a Vanta-prefixed tag and a custom-mapped tag exist for the same attribute on the same resource, the Vanta-prefixed tag takes priority.

## Supported Vanta tags for AWS
 | 
Tag key | 
Expected value | 
Effect
 | 
VantaOwner | 
Full email (e.g., [email protected])  | 
Sets resource owner
 | 
VantaDescription | 
Free text | 
Sets resource description
 | 
VantaNonProd | 
true | 
Marks non-prod, excludes from scope
 | 
VantaNoAlert | 
Reason string (e.g., “sandbox account”) | 
Excludes from monitoring and scope
 | 
VantaContainsUserData | 
true / false | 
Flags user data presence
 | 
VantaContainsEPHI | 
true / false | 
Flags ePHI (HIPAA only)
 

## What bulk tagging affects
 | 
Inventory metadata | 
Owner and description fields in your Vanta inventory populate automatically when the corresponding tags are present on a resource.
 | 
Compliance scope | 
- 
Resources tagged VantaNonProd: true are marked as out of scope for compliance monitoring.
- 
Resources tagged VantaNoAlert with a reason are excluded from monitoring and removed from compliance scope.
- 
Resources whose scope is controlled by a tag cannot be manually scoped in or out within Vanta. The tag in AWS is the source of truth.
- 
If you remove a scope tag from a resource in AWS, Vanta will automatically restore that resource to in-scope on the next sync.
 | 
Compliance tests | 
The VantaContainsUserData and VantaContainsEPHI tags determine which compliance checks apply to a resource. Setting these accurately ensures the right tests run — and prevents tests from running on resources where they are not relevant.
 | 
Supported resource types | 
Bulk tagging applies to all AWS resource types that Vanta syncs and that support AWS tagging. This includes, but is not limited to: EC2 instances, S3 buckets, RDS instances, DynamoDB tables, EBS volumes, Lambda functions, EKS clusters, ECS clusters and services, Redshift clusters, SQS queues, KMS keys, VPCs, and more.
 

## Scoping out an entire AWS account
If you use AWS Organizations, you can apply scope tags directly to an AWS Organization sub-account to remove that account — and every resource within it — from your Vanta compliance scope at once. This is useful for sandbox environments, development accounts, or any account that should be fully excluded from monitoring.
 

## How it works:
When Vanta reads a scope tag (VantaNonProd: true or VantaNoAlert: <reason>) on an AWS Organization sub-account during sync, it stops scanning that account entirely. No resources from that account are fetched or ingested. This is different from scoping out individual resources — it prevents Vanta from accessing the account at all during that sync cycle.
 

## To scope out an entire AWS account:
- 
Apply the VantaNonProd or VantaNoAlert tag directly to the AWS Organization sub-account(s) you want to exclude. This is done in AWS, not in Vanta.
- 
Wait for Vanta's next resource sync. This process may take several hours or longer to fully propagate, because Vanta must first detect the tag on the account, then complete sync cycles for each resource type that was previously fetched from that account.
- 
There is no progress indicator in Vanta. You can check the Inventory and Tests pages to confirm that resources from the affected account(s) are no longer present.
 

## FAQs

## Does Vanta write tags back to my AWS account?
No. Bulk tagging is read-only. Vanta reads existing tags from AWS but does not create, modify, or delete tags in your AWS account.
 

## Do I have to use Vanta-specific tags, or can I use my existing tags?
Both options are supported. You can apply Vanta-prefixed tags (VantaOwner, VantaDescription, etc.) directly to resources, or use the custom tag mapping feature in Vanta to map your own existing tag keys to the equivalent Vanta fields.
 

## What happens if I have both a Vanta tag and a custom-mapped tag for the same resource?
The Vanta-prefixed tag takes priority. If you want your custom mapping to apply, remove the corresponding Vanta-prefixed tag from the resource.

## Images

- [image 01] ../../images/ux/inventory/bulk-tagging-for-aws-resources-in-vanta--01.png
