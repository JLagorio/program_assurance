# Ironclad Integration Guide (Procurement)

Source: https://help.drata.com/en/articles/16765899-ironclad-integration-guide-procurement
Collection: Understand the Drata Platform › Vendors › Procurement Connections
Updated: 2026-09-15
Fetched: 2026-11-22

## Article text

Effective vendor management is a cornerstone of a robust security and compliance program, especially for audits like SOC 2 and ISO 27001. Drata's native Ironclad Vendor connector pulls contract and vendor records directly from Ironclad's contract lifecycle management (CLM) platform into your Drata vendor registry — so newly signed vendors show up in your TPRM program automatically, without manual re-entry.

This article explains how the integration works, what it includes out of the box, how vendors are matched against your existing registry, how to set it up, and how to customize it for your organization's needs.

## Prerequisites

- The Ironclad  connection is configured entirely within Drata using an Ironclad API key.
- Reach out to your Ironclad admin if you need help generating an API key or confirming your account domain.

Additional information

- You can use Dry Run Mode in Drata to preview what would sync before any vendor records are created or updated. Turn it off when you’re ready to apply the changes.

### How the Integration Works

Once connected, Drata calls Ironclad's Records API on a recurring schedule to pull contract records, maps key fields (like counterparty name and record ID) to Drata vendor properties, and creates or updates the matching vendor in your registry.

To avoid duplicates, every incoming record is checked against your existing vendors before anything is created. Drata now uses a multi-step matching process that goes well beyond a simple name comparison.

Drata applies a default field mapping out of the box, and automatically fills in any additional unmapped fields over time using AI-suggested mappings — so there's no mapping configuration required to get started.

### Step-by-Step Workflow

1. Drata connects to Ironclad using the API key and domain you provide, and pulls records from Ironclad's Records API.
2. If you've set a Vendor Types filter, only records matching those types (for example, "vendor" or "supplier") are pulled in.
3. Drata maps each record's fields — such as counterparty name — to the corresponding Drata vendor properties.
4. Drata matches each incoming record against your existing vendor registry to decide whether to update an existing vendor or create a new one.
5. While Dry Run Mode is enabled, Drata previews what would sync without creating or changing any vendor records.
6. Once Dry Run Mode is turned off, Drata creates new vendors or updates the ones it matched, and records the Ironclad record ID against each vendor.
7. The sync repeats automatically going forward, so changes in Ironclad keep flowing into your Drata vendor registry.

### Setting Up the Integration in Drata

1. In your Ironclad account, generate an API key with access to the Records API. Check with your Ironclad admin if you're not sure how to do this.
2. In Drata, go to Connections in the left sidebar, then open the Available tab.
3. Search and select for Ironclad Vendor. You can also use the Procurement filter.
   - Note: Make sure you connect to Ironclad Vendor, not Ironclad for access reviews.
4. **Configure step: **Select the workspace(s) you want this connection assigned to, then continue.
5. **Connect step: **Enter the following:
   - **API Key** – your Ironclad API key
   - **Domain** – Enter the regional Ironclad domain where your account is hosted, such as na1.ironcladapp.com. The field defaults to na1.ironcladapp.com; change it only if your Ironclad URL uses a different regional domain. Enter the domain without https:// or any path.
   - **Vendor Types ***(optional)* – a JSON array of Ironclad record types to sync, for example ["vendor", "supplier"]. Leave blank to sync all record types.
   - **Dry Run Mode** – enabled by default. Leave it on to preview the sync first, or turn it off once you're ready for Drata to create and update live vendor records.
6. Confirm step: Click **Connect**. Drata runs a quick health check against Ironclad to confirm your credentials are valid, then establishes the connection. Vendor records begin syncing automatically going forward on a recurring schedule.

### Customization Options

- **Adjusting settings after setup: **Open the connection from **Active Connections** at any time to update the Vendor Types filter, toggle Dry Run Mode, or change the connection alias.
- **Matching sensitivity: **Contact Drata Support if you want to move a connection off the default matching mode.

### How Vendors Are Matched to Your Existing Registry

You may already have vendors in Drata from manual entry, spreadsheet imports, or another integration. When you connect Ironclad, Drata checks whether each vendor already exists in your account.

Drata now works through the following checks in order, and stops at the first one that finds a match:

1. **Ironclad record ID. **If Drata has synced this record before, it remembers the Ironclad ID and goes straight to the vendor it created. This is the most reliable check, and it means renaming a counterparty in Ironclad updates your existing Drata vendor instead of creating a second one. IDs are scoped to the connection, so they never collide with IDs from another integration.
2. **Exact name. **The counterparty name matches an existing vendor name character for character.
3. **Website. **The record's third-party URL matches an existing vendor's URL once both are simplified — Drata ignores http:// and [https://](https://), a leading www., and anything after the domain itself. So [https://www.example.com/security](https://www.example.com/security) and example.com are treated as the same vendor.
4. **Simplified name. **Drata compares names with the noise removed: capitalization, accents, spaces and punctuation are ignored, and a trailing legal suffix such as Inc, LLC, Ltd, GmbH or Corp is dropped. That means “Acme Corp.”, “acme corp” and “Acme, Corp” all resolve to the same vendor.
5. **Close name match. **For anything still unmatched, Drata scores how similar the simplified names are. A very high similarity is treated as the same vendor. A moderate similarity is not merged automatically — Drata records it as a possible match so your team can review it.
6. **AI review. **For those moderate, ambiguous cases, Drata asks an AI model to judge whether the two names refer to the same company, using the vendor's name, website and the services it provides as context. If the model confirms the match, the records are merged.

When a record matches an existing vendor, Drata updates that vendor in place — incoming values overwrite the mapped fields, and any field Ironclad doesn't provide is left untouched. When nothing matches, Drata creates a new vendor. Nothing is ever silently skipped.

Every matching decision is logged, including the ones that found nothing, so you can audit exactly why a given record was merged into an existing vendor or created as a new one.

A few things worth knowing:

- The first sync has no Ironclad IDs to work from, so it relies on the name and website checks. From the second sync onward, most records match instantly on their Ironclad record ID.
- Dry runs don't record Ironclad IDs, because no vendors are written. Every dry run therefore re-runs the full matching process from scratch.
- If two Ironclad records share exactly the same counterparty name in one sync, Drata treats them as a single vendor. This is expected for repeat contracts with the same company.

### Adjusting How Aggressively Drata Matches

The matching behavior above is the default and suits most organizations. If you need it tighter or looser, four modes are available:

- **Smart — **the full process including AI review. This is the default for new and existing connections.
- **Smart without AI — **everything except the AI review step. Close name matches above the high-confidence threshold still merge automatically.
- **Strict — **record ID, exact name, website and simplified name only. No similarity scoring and no AI. Use this if you would rather review duplicates yourself than risk an incorrect merge.
- **Manual — **no automatic matching at all. Every incoming record is logged for human review.

If you need to change this setting, contact Drata Support. The setting applies only to this connection and isn’t currently available in the connection form.

### What's Included in the Integration

- **API key authentication: **Connect with your Ironclad API key and domain — no OAuth flow required.
- **Automatic field mapping: **A default mapping from Ironclad record fields to Drata vendor properties applies out of the box, with AI-assisted suggestions filling in gaps as the sync runs.
- **Vendor type filtering: **Optionally scope the sync to specific Ironclad record types (for example, ["vendor", "supplier"]) instead of pulling every record.
- **Dry Run Mode: **Test the connection safely — no vendor records are created or updated while enabled. Toggle it off when you're ready to go live.
- **Intelligent duplicate protection: **Incoming records are matched against your existing vendors on Ironclad record ID, exact name, website, simplified name, name similarity and AI review before a new vendor is created.
- **Match audit trail: **Every matching decision is recorded, so you can trace why any vendor was merged or created.

## Related articles

- [OneLogin Integration Guide](onelogin-integration-guide.md)
- [Ironclad Integration Guide (UAR)](ironclad-integration-guide-uar.md)
- [EasyLlama Integration Guide](easyllama-integration-guide.md)
- [Tropic Integration Guide](tropic-integration-guide.md)
- [Ramp Integration Guide](ramp-integration-guide.md)
