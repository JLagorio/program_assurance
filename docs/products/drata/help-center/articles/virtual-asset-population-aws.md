# Virtual Asset Population: AWS

Source: https://help.drata.com/en/articles/6250074-virtual-asset-population-aws
Collection: Understand the Drata Platform › Assets
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata automatic population of Virtual Assets

## Article text

An inventory of your assets is typically in scope for a SOC 2 audit. To aid in your audit preparation, Drata helps build this inventory for you.

Virtual asset tracking from AWS comes in five new classes, supplementing the original classes populated in Drata. These new classes are storage, container, compute, database, and networking. You will see within the Drata 'Asset Inventory' the ability to filter by these classes.

Today, Drata supports pulling the following Amazon services into the Drata Asset table for customers who have an AWS connection:

- Elastic Container Service (ECS)
- Elastic Kubernetes Service (EKS)
- Relational Database Service (RDS)
- Elastic Container Registry (ECR)
- Web Application Firewall (WAF)
- CloudFront
- CloudTrail
- Elastic Compute Cloud (EC2)
- Simple Storage Service (S3)

You will also see the option to filter by 'Types', 'Providers', and 'Owners.'

For items pulled in directly from AWS, the Type will always be 'Virtual', and the Provider/Source will always be 'AWS'.

To automatically populate the Owner field, Drata will assign these assets to whomever is listed as the Engineering Lead in the **Key Personnel** section of Drata, found here: [https://app.drata.com/account-settings/personnel](https://app.drata.com/account-settings/personnel)
If there is no Engineering Lead, then this will fall back to the listed CEO.

If there are no Key Personnel set, assets will be assigned to the first admin.

Many of the resource groups we pull from are related to specific regions such as ’`us-west-2`’ or ‘`sa-east-1`’. If a customer has the same named asset in multiple regions, this will produce a new line item for assets of the same name, distinguished by displaying the region directly after, delimited by a '|' character.

If Drata is pulling in assets from your AWS instances that are not in scope for your audit, be sure to add a AWS tag called '`DrataExclude`' to them within your AWS console. More information on how to do that can be found here: [https://help.drata.com/en/articles/5260549-exclusion-tags-within-aws](exclusion-tags-within-aws.md)

- If an asset is synced, and then the `DrataExclude` tag is added, upon the next sync, Drata will mark that asset with a timestamp in the "Deleted On" column
- If the `DrataExclude` tag is added before the asset is synced for the first time, Drata will not import this asset at all

As with previous assets, you will also see a 'notes' section for each asset on the far right of the asset row. This will allow you to add any notes or even an asset tag.

## Related articles

- [AWS Integration Guide (Infrastructure, User Access Review)](aws-integration-guide-infrastructure-user-access-review.md)
- [Exclusion tags within AWS](exclusion-tags-within-aws.md)
- [Azure Virtual Asset](azure-virtual-asset.md)
- [GCP Virtual Assets](gcp-virtual-assets.md)
- [Bulk Import Assets](bulk-import-assets.md)
