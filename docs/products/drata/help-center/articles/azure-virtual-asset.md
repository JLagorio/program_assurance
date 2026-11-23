# Azure Virtual Asset

Source: https://help.drata.com/en/articles/9057685-azure-virtual-asset
Collection: Understand the Drata Platform › Assets
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

## HERE'S WHY

An inventory of your assets is typically in scope for a SOC 2 audit. To aid in your audit preparation, Drata helps build this inventory for you.

## BEFORE DIVING IN

- You will need to make sure an active Azure connection has been set up in Drata in order to use this feature. Go to [Microsoft Entra Connection Details](azure-integration-guide.md) page to learn how to create Azure connection in Drata.
- There are a total of 12 Azure services Drata supports:
   - Azure Virtual Machines
   - Azure Container Apps
   - Azure Container Registry
   - Azure Kubernetes Service
   - Azure Blob Storage
   - SQL Database
   - Database for MySQL
   - Database for PostgreSQL
   - Database for MariaDB
   - Cosmos DB
   - Front Door
   - Azure Virtual Network
- Only the primary owner is imported into Drata for Azure Virtual Asset.

## HERE'S HOW

### Azure asset inventory

Navigate to the asset section from the left nav:

From the Asset Inventory table, you can now filter Azure assets by selecting the appropriate values for the 'Types' and 'Providers' filters. For items pulled in directly from Azure, the Type will always be 'Virtual', and the Provider will always be 'Azure'.

To automatically populate the Owner field, Drata will detect if there are manually assigned Azure native owners for each asset. If no manually assigned owners have been found, the owner from the subscription level would be selected to match the Drata Personnel profile, and check active employment status. If multiple owners are attached to a single Azure asset, only the first owner who matches a Personnel profile and is an active employee could be used to fill the asset Owner field. If no Personnel profile could be found, then this will fall back to the user who created the Azure connection in Drata. If no Azure connection user has been found, assets will be assigned to the first admin.

Azure allows users to move resources to different subscription or resource groups, which causes the resource to have a different Resource ID associated with assets. In this case, a new record of the asset will be created with updated subscription or resource group info.

As with previous assets, you will also see a 'notes' section for each asset on the far right of the asset row. This will allow you to add any notes or even an asset tag.

### Daily asset sync

Your Azure asset inventory will never be outdated since Drata syncs the asset list on a daily basis. If Drata is pulling in assets from your Azure instances that are not in scope for your audit, be sure to create an Azure tag called 'DrataExclude' to them within your Azure portal. More information on how to do that can be found here:[https://help.drata.com/en/articles/5352047-exclusion-tags-within-azure](exclusion-tags-within-azure.md)

- If an asset is synced, and then the DrataExclude tag is added, upon the next sync, Drata will mark that asset with a timestamp in the "Deleted On" column
- If the DrataExclude tag is added before the asset is synced for the first time, Drata will not import this asset at all

## Related articles

- [Exclusion tags within AWS](exclusion-tags-within-aws.md)
- [Exclusion tags within Azure](exclusion-tags-within-azure.md)
- [Virtual Asset Population: AWS](virtual-asset-population-aws.md)
- [GCP Virtual Assets](gcp-virtual-assets.md)
- [Bulk Import Assets](bulk-import-assets.md)
