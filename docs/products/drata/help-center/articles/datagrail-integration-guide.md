# DataGrail Integration Guide

Source: https://help.drata.com/en/articles/16602553-datagrail-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-24
Fetched: 2026-11-22

## Article text

The DataGrail integration helps privacy and compliance teams find the systems connected to Drata and add them to DataGrail’s Live Data Map.

This is a read-only, one-way connection. DataGrail reads the names and details of your managed Drata connections through the Drata API. It does not write anything to Drata or access evidence, personnel records, or control data.

### Partner connection

DataGrail manages this connection as an external partner. Partner connections can enable workflows, but they cannot directly access or interact with Drata’s monitored tests because they are not built or managed by Drata.

If you have questions or issues with this connection, contact DataGrail. For more information, see [Partner Connections](partner-connections-expanding-compliance-with-external-tools.md).

## Key capabilities

- System detection: Finds systems connected to Drata and adds them to DataGrail’s Live Data Map.
- Read-only access: Reads connection names and details without changing data in Drata.
- Privacy program visibility: Helps you review the systems monitored in Drata as part of your privacy program.

## Prerequisites and data access

### Account and role requirements

You must have the following roles:

- Admin in Drata.
- Super Admin or Connections Manager in DataGrail.

### Permissions and data access

The Drata API key must have the following permission:

| Permission or scope | Why it’s needed | Data accessed (read only) |
|---|---|---|
| Get managed connections: Read | Allows DataGrail to find the systems connected to Drata. | Managed connection names and metadata. DataGrail does not access evidence, personnel records, or control data. |

### Important notes

- Drata connections show systems monitored for compliance. They might not include every system that processes personal data.
- Review the imported systems before using the list as your complete data inventory.
- Drata shows the API key only once. Store it in a secure location after you create it.

## What you will set up

1. Create a Drata API key with read access to managed connections.
2. Connect Drata to DataGrail.
3. Review the systems imported into the Live Data Map.

### Step 1: Create a Drata API key

1. Sign in to Drata.
2. In the lower-left corner, select your account, then select Settings.
3. Select API Keys.
4. Select New API Key.
5. In the Basic details:
   - Enter a name for the key, such as `DataGrail`.
   - Set an expiration date. The default expiration period is 12 months.
6. In the Scope access:
   - Expand the Connections group.
   - Select **Read** for **List Connections**
7. Select Save.
8. Copy the API key and store it in a secure location.
9. Select the confirmation checkbox for storing the API key securely, then select Done.

Expected outcome: You have a Drata API key with read access to managed connections.

### Step 2: Connect DataGrail to Drata

1. Sign in to [DataGrail](https://www.datagrail.io/).
2. Go to Integrations and select Configure New Integration.
3. Search for Drata and select it.
4. Enter the Drata API key.
5. Select Configure Integration.

Expected outcome: DataGrail connects to Drata and checks your managed connections once a day to find systems to add to the Live Data Map.

### Step 3: Review imported systems

1. Open Live Data Map and go to System Inventory in DataGrail.
2. Review each system imported from Drata.
3. Check the system source and available metadata.
4. Confirm that the imported systems accurately support your privacy program before relying on the list as a data inventory.

Expected outcome: After DataGrail’s daily system detection runs, the systems found through Drata appear in the Live Data Map for review.

### Related resources

- [Integrate with Drata](https://docs.datagrail.io/docs/integrations/connection-instructions/drata/)

## Related articles

- [HubSpot Integration Guide (UAR)](hubspot-integration-guide-uar.md)
- [Freshsales Integration Guide (UAR)](freshsales-integration-guide-uar.md)
- [15Five Integration Guide](15five-integration-guide.md)
- [Aikido Integration Guide](aikido-integration-guide.md)
- [Aircall Integration Guide](aircall-integration-guide.md)
