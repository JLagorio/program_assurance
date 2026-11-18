# How to Troubleshoot Azure Resources Not Appearing in Inventory

Source: https://help.vanta.com/en/articles/16023664-how-to-troubleshoot-azure-resources-not-appearing-in-inventory
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

If you've successfully connected the Azure integration and notice resources that show up in Azure but not on Vanta's Inventory page, work through these steps in order.
 

## Step 1: Confirm the subscription is connected and in scope
Confirm the subscription containing the missing resource is actually connected to Vanta under Integrations > Azure. If you're on a tenant-level connection, confirm the subscription hasn't been individually excluded. If you're using Azure for US Government, check under the Azure for US Government integration instead, since it's a separate connection from standard Azure. See Azure: Integration Guide <https://help.vanta.com/en/articles/15693150-azure-integration-guide> for how subscription and tenant scope work.
 

## Step 2: Confirm the resource hasn't been manually marked out of scope
Go to the Integrations page, select the Connected tab, find Azure, and click Configure scope to confirm the resource type or specific resource hasn't been manually excluded. See Frequently Asked Questions: How do I Mark Resources out of Scope? <https://help.vanta.com/en/articles/11346114-frequently-asked-questions-how-do-i-mark-resources-out-of-scope> for details on how manual and tag-based scoping work together.
 

## Step 3: Confirm there's no scope tag on the resource
Vanta recognizes a set of scope-related tags on Azure resources. A resource carrying a VantaNonProd tag, or a VantaNoAlert tag with a reason specified, will be treated as out of scope, as will a custom tag mapped to either of these. Check the resource's tags in the Azure Portal and confirm none of them are mapped to an out-of-scope Vanta tag. Note that Azure and AWS use the same tag key format (for example, VantaNonProd); GCP uses a different label format for the same concept. See Bulk Tags <https://help.vanta.com/en/articles/11345627-bulk-tags> for the full list of recognized tags and how custom tag mappings work.
 

## Step 4: Confirm the resource type is supported on Vanta's Inventory page
Not all Azure resource types that Vanta reads are currently surfaced on the Inventory page. If a resource type you're looking for doesn't appear on Inventory at all, even for resources you're confident are syncing correctly, it may not yet be supported there rather than missing due to a sync or scoping issue. Some resource types are also only fetched when a specific Vanta product or add-on is enabled for your account, for example, resources tied to the CIS Azure Foundations Benchmark. If you're looking for a resource type tied to a specific compliance framework or add-on, confirm that product is enabled for your workspace.
 

## Step 5: Allow time for the next sync
Azure resource data syncs on a scheduled cadence (typically hourly), not in real time. If you've recently created the resource, connected the subscription, or changed scoping, allow up to a few hours before rechecking Inventory.
 

## If the resource still isn't appearing
If you've confirmed all of the above and the resource still isn't showing up, reach out to Vanta Support with a screenshot of the resource in the Azure Portal showing its name, resource group, subscription, and region.

## Images

- none
