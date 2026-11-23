# GCP Virtual Assets

Source: https://help.drata.com/en/articles/9463084-gcp-virtual-assets
Collection: Understand the Drata Platform › Assets
Updated: 2026-02-18
Fetched: 2026-11-22
Description: Learn how to automate your GCP asset inventory, how to mark assets our of scope, and how Drata automatically assigns asset owner.

## Article text

Compliance frameworks like SOC 2 require organizations to have clear visibility and control over their assets. Utilize Drata to build your GCP asset inventory comprehensively.

## Prerequisites

- Ensure you set up an active GCP connection in Drata to use this feature. Go to the [GCP Connection Details](gcp-integration-guide-manual.md) page to learn how to create a GCP connection in Drata.
   - The specific API permission Drata needs to sync virtual assets is the `Cloud Asset Inventory API` permission. Even if you had connected GCP prior to Drata releasing the virtual asset sync, you may need to add this permission to the project where your service account was created.
- Drata supports eight GCP services:
   - Google Compute Engine
   - Google Persistent Disk
   - Google Cloud Run
   - Google Container Registry
   - GKE (Google Kubernetes Engine)
   - Google Cloud Storage Regional and Multi-Regional
   - Cloud SQL
   - Google Cloud CDN
- Only the primary owner is imported into Drata for GCP Virtual Assets.

## Find all your GCP asset inventory

You can find all of your GCP asset inventory within Drata.

Navigate to **Assets** on the left navigation. Here, you can filter GCP assets by selecting the appropriate values for the **Types** and **Providers**.

- **Types**: Select Virtual.
- **Providers**: Select GCP.

### Owners automatically assigned for assets

You can assign an owner to each asset, but if an asset does not have an assigned owner or has multiple owners, Drata automatically assigns one.

Drata identifies the asset's owner within your GCP systems and verifies their employment status within the Drata to assign that individual as the owner if the individual has an active employment status.

- If an asset has multiple owners in GCP, Drata assigns the first individual with an active employment status
- If no personnel was found within Drata or no owners were attached to the asset within GCP, then the first admin in Drata is assigned as the owner.

When GCP resources move into different subscriptions or resource groups, their Resource ID changes, creating a new asset record with updated information.

You can view the **Notes **section for each asset and other details on the table. You can use notes to tag each asset.

## Daily sync

Drata syncs the GCP asset inventory daily.

### Assets that are not in scope for your audit

For the assets within your GCP instance that are not in scope for your audit, you can create a GCP tag `drataexclude`. To learn more, go to our [Exclusion labels within GCP article](exclusion-labels-within-gcp.md).

To prevent assets from syncing daily, tag them with `drataexclude`. After they are tagged, they will not be synced any longer and will have a timestamp in the 'Deleted On' column indicating when they stopped being synced.

If you added the `drataexclude` tag  before syncing assets into Drata, those assets will not appear on the table or be synced.

## Related articles

- [GCP Integration Guide (Script Setup)](gcp-integration-guide-script-setup.md)
- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [Virtual Asset Population: AWS](virtual-asset-population-aws.md)
- [Azure Virtual Asset](azure-virtual-asset.md)
- [Understanding Device Linking, Removal, and Visibility in Drata](understanding-device-linking-removal-and-visibility-in-drata.md)
