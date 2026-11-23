# Gusto Integration Guide

Source: https://help.drata.com/en/articles/4663382-gusto-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to Gusto (HRIS)

## Article text

The integration between Gusto and Drata syncs your personal data to assist with our automated test suite for SOC 2 compliance. This allows us to monitor the statuses of employment and ensure that you maintain alignment across your organization with regards to security and privacy.

## Step-by-Step Setup

### Step 1: Open the Gusto Connection in Drata

1. In Drata, navigate to **Connections → Available Connections**.
2. Search for **Gusto** and select **Connect**.

**Expected outcome:** You’ll be redirected to Gusto’s login page to begin authentication.

### Step 2: Authorize the Connection in Gusto

1. Log in to your **Gusto** account when prompted.
2. Click **Authorize** to grant Drata permission to access your account data.
3. If you manage multiple companies under Gusto, you’ll be prompted to select one company to map to Drata.
4. Once selected, click **Complete**.

**Expected outcome:** Drata and Gusto are connected, and employee data begins syncing automatically.

## Step 3: Verify the Connection

1. After completing setup, verify that **Gusto** appears under **Active Connections** in Drata.
2. Confirm that employee records are syncing under HRIS-based automated tests.

**Expected outcome:** Gusto personnel data is successfully synced and visible in applicable HRIS and employee tests within Drata.

## Important Notes

- **Multiple Companies:** If you manage multiple Gusto companies, Drata connects to only one at a time.
- **Data Access:** The integration is **read-only** and used strictly for compliance evidence collection.
- **Disconnection:** To remove the connection, go to **Connections page and search for Gusto. **Then, select the trash icon.

## Related articles

- [Rippling Integration Guide (HRIS, MDM, UAR)](rippling-integration-guide-hris-mdm-uar.md)
- [BambooHR Integration Guide](bamboohr-integration-guide.md)
- [Freshteam Integration Guide](freshteam-integration-guide.md)
- [HR Cloud Integration Guide](hr-cloud-integration-guide.md)
- [UKG Pro Integration Guide](ukg-pro-integration-guide.md)
