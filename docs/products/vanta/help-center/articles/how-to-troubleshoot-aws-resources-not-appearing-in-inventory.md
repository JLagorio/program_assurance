# How to troubleshoot AWS resources not Appearing in Inventory

Source: https://help.vanta.com/en/articles/11345619-how-to-troubleshoot-aws-resources-not-appearing-in-inventory
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

If you successfully connected the AWS integration and noticed you have resources that show up in AWS but not on Vanta's inventory page, please follow the steps in this article.

## Scoping & Bulk Tags
First, confirm the resource has not been manually marked out of scope on the integrations page. See, Frequently Asked Questions: How do I Mark Resources out of Scope? <https://help.vanta.com/hc/en-us/articles/360062025631-Frequently-Asked-Questions-How-do-I-Mark-Resources-out-of-Scope-?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxODYyNTkyOTY1NDkzMiwidGlja2V0X2lkIjo2MTMzMSwiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2OTg2MzUzMjd9.i0O9IFTTt2I4VQpdvgWi3ChJmqCxI88PqSBBxozjwMQ>, for details on this.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760809/852e351fef443be7f30184e1bfe9/19636469071764?expires=1794967200&signature=079317475042d9b9d0d33676b882a4e5d1d0cf567530390eb7643fe29c19e3b0&req=dSUmEM54nYlfUPMW1HO4zV1ClaOEZXqFCn9k6QhqnG%2FN%2FyEGfeHpl6u3dyRU%0AebJJSW5PAvxV1w8XtCg%3D%0A>
Administrators can also mark resources out of scope with Bulk Tags, <https://help.vanta.com/hc/en-us/articles/9270488281492-Bulk-Tags?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxODYyNTkyOTY1NDkzMiwidGlja2V0X2lkIjo2MTMzMSwiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2OTg2MzUzMjd9.i0O9IFTTt2I4VQpdvgWi3ChJmqCxI88PqSBBxozjwMQ> please also confirm there are no tags applied to the missing resource. Vanta may show a message saying this is controlled via tags in your cloud provider.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760800/4721fb67fbc77d7aa42beeabf94f/19636453803412?expires=1794967200&signature=4cfea6cdc3f439f779c03bd3c59c08140f2e6a475469adec4addf1865836eb3f&req=dSUmEM54nYlfWfMW1HO4zaOQodnasoVZkj702GsCneP%2BUu17KHEcn8bEXaBq%0AAuqYS%2B760dPBTRUQsFY%3D%0A>
These tags are VantaNonProd and VantaNoAlert tags and they can prevent resources from being pulled in scope. Some administrators may have custom inventory tags <https://help.vanta.com/hc/en-us/articles/10423404445204-Custom-Inventory-Tags-?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxODYyNTkyOTY1NDkzMiwidGlja2V0X2lkIjo2MTMzMSwiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2OTg2MzUzMjd9.i0O9IFTTt2I4VQpdvgWi3ChJmqCxI88PqSBBxozjwMQ> set up which do match the default standard tags, but achieve the same effect. 
​
If you are not sure how to check for tags in AWS, see this article <https://docs.aws.amazon.com/tag-editor/latest/userguide/tagging-resources.html> for more details.

## VantaNoAlert Tag
If you have a VantaNoAlert tag applied to the resource, please remove it to bring it into scope. It does not matter what the value is set to, if the VantaNoAlert value is detected as a key the instance will be marked out of scope.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760803/897f04908c88e18b8dfbc7aff77a/19636391596180?expires=1794967200&signature=8161772bad9bdf0f9cac78fac122fee1775e161f4da624e3e495e1bc5e8ee07e&req=dSUmEM54nYlfWvMW1HO4zeJJLE8%2Bhi63gP4qfDcLgNx1QEoeJAIJB7huPHvi%0AijaO1fHTcUXA1tiJ37I%3D%0A>

## VantaNonProd Tag
If you have VantaNonProd set with a value of true, we suggest removing it or setting it to false.
​
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760808/f908fc19110ce7328a1351cc3036/19636352202132?expires=1794967200&signature=169089c46c66ca3ee21a3fa1e4ed72d437359719b0e153bb9ecefb11688fd233&req=dSUmEM54nYlfUfMW1HO4zTZ%2FLPpk8Gj9hTkZJJFQDg26pV8aiTv%2FdWV%2Ftrke%0A4uf1lCLX5SOrzhKTLWc%3D%0A>
If none of these tags are applied to the instance, and it has not been toggled out of scope manually on the integrations page, please move on to the next step.

## Region
The next step is to confirm that the region the resource exists in is selected in Vanta. See, How to edit the region selected for AWS accounts/organizations <https://help.vanta.com/hc/en-us/articles/15411505925524-How-to-edit-the-region-selected-for-AWS-accounts-organizations?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjoxODYyNTkyOTY1NDkzMiwidGlja2V0X2lkIjo2MTMzMSwiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE2OTg2MzUzMjd9.i0O9IFTTt2I4VQpdvgWi3ChJmqCxI88PqSBBxozjwMQ>, for more details about this.

## Final Steps
If you confirmed the region is in scope, please submit a ticket to [email protected] with a screenshot of the resource, or one of the resources showing the name, ID, status, and region in view:
​
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516760819/27bfe01f89add71129bcca85a9f0/19636502919956?expires=1794967200&signature=fc772a4317cd025980c212aa193749d702fc5812295558cbcbf21d80ab44ad9b&req=dSUmEM54nYleUPMW1HO4zaoLluGk1cHLORd5WL4EP2Uph2jEEMAMCnuV291X%0AOJnsugEXXTxa%2FdhJGXc%3D%0A>
We recommend to remove or redact any sensitive information such as IP Addresses from your screenshot prior to sending.

## Images

- [image 01] ../../images/ux/integrations/how-to-troubleshoot-aws-resources-not-appearing-in-inventory--01.png
- [image 02] ../../images/ux/integrations/how-to-troubleshoot-aws-resources-not-appearing-in-inventory--02.png
- [image 03] ../../images/integrations/aws/how-to-troubleshoot-aws-resources-not-appearing-in-inventory--03.png
- [image 04] ../../images/integrations/aws/how-to-troubleshoot-aws-resources-not-appearing-in-inventory--04.png
- [image 05] ../../images/integrations/aws/how-to-troubleshoot-aws-resources-not-appearing-in-inventory--05.png
