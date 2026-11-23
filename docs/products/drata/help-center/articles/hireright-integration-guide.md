# HireRight Integration Guide

Source: https://help.drata.com/en/articles/9797693-hireright-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-31
Fetched: 2026-11-22

## Article text

The HireRight integration enables security and compliance teams to track background checks conducted outside of Drata. It connects Drata to HireRight so your team can upload and manage background check records for personnel as part of your compliance program.

## Key Capabilities

- Background check tracking: Record background checks completed through HireRight
- Evidence management: Upload personnel background check records into Drata
- Compliance documentation: Maintain background check evidence for audits

This integration is used to support tests such as personnel background check verification, helping prove compliance with personnel security and hiring policy requirements.

## Prerequisites & Data Access

- Administrative access to **Drata**
- Access to your organization’s **HireRight records**
- A **CSV file** containing personnel background check data
- (Optional) Your organization’s **HireRight URL**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| CSV personnel data upload | Allows Drata to import background check records conducted in HireRight |
| HireRight URL (optional) | Provides a reference link to your HireRight system in the personnel record |

## Step-by-Step Setup

### Step 1: Prepare Background Check Data

1. Export or compile a **CSV file** containing personnel background check data from HireRight.
2. Confirm the CSV file includes the personnel records you want to track in Drata.

Expected outcome: You have a CSV file containing personnel background check records ready for upload.

### Step 2: Connect HireRight in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **HireRight** connection process.
4. (Optional) Enter your **HireRight URL** for reference.
5. Upload the **CSV file** containing your personnel background check data.

Expected outcome:
HireRight is connected and background check records are uploaded to Drata.

## Important Notes

Any setup issues or additional configurations required on HireRight’s side must be addressed directly with HireRight.

## Related articles

- [Checkr Integration Guide](checkr-integration-guide.md)
- [SentinelOne (EDR) Integration Guide](sentinelone-edr-integration-guide.md)
- [Vetty Integration Guide](vetty-integration-guide.md)
- [Sterling Integration Guide](sterling-integration-guide.md)
- [Bulk Import Personnel Background Checks (New Experience)](bulk-import-personnel-background-checks-new-experience.md)
