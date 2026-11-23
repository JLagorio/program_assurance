# Coverdash Integration Guide

Source: https://help.drata.com/en/articles/9307061-coverdash-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-12-09
Fetched: 2026-11-22

## Article text

Drata has an integration for [Coverdash](https://www.coverdash.com/). This integration lets you automate tests for policy insurance. It also lets Drata alert you when a policy contract related to compliance will expire.

## Key Capabilities

- **Automated insurance policy monitoring: **Track expiration dates for insurance policies relevant to compliance frameworks.
- **Evidence automation: **Drata automatically sends policy documentation to the Evidence Library once the integration is active.
- **Continuous compliance: **Receive alerts when an insurance policy is nearing expiration, helping ensure uninterrupted coverage.

## Prerequisites & Data Access

- **Responsible party information required: **You will need the contact details of the person managing your organization’s Coverdash insurance contracts.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** role, you can only view the Connections page.

### Permissions & Data Table

| Permission / Scope | Why It’s Needed | Data Accessed (Read Only) |
|---|---|---|
| Contact information (Email, First/Last Name, Phone Number) | Used to initiate and manage Coverdash insurance policy retrieval | Insurance policy metadata and policy documentation |

## Step-by-Step Setup

### Step 1: Start the Coverdash Connection

1. In Drata, select **Connections** from the main menu.
2. Open the **Available Connections** tab.
3. Search for **Coverdash** and select **Connect**.

**Expected outcome:** The Coverdash connection drawer opens.

### Step 2: Provide Contact Information

Enter the details for the individual responsible for managing your organization’s insurance policies:

- **Email**
- **First Name**
- **Last Name**
- **Phone Number**

Select **Continue** to proceed.

**Expected outcome:** Contact details are saved, allowing Coverdash to generate insurance options.

### Step 3: Select Insurance Options

1. Choose **“I want my free quotes”**.
2. Select your desired **insurance type**, **quotation**, and **payment information**.
   - Coverdash will provide policy options based on your selections.
3. Review the policy details carefully and confirm your choice.

**Important:**
Drata does **not** store or process payment information. All payment data is handled directly by Coverdash.

**Expected outcome:** The selected insurance policy details are passed to Drata for compliance automation.

### Step 4: Save and Test the Connection

1. Select **Save & Test Connection**.
2. Drata will validate your Coverdash configuration.

**Expected outcome:** The integration shows as **Connected**, and policy evidence begins flowing into the Evidence Library.

## Related articles

- [Justworks Integration Guide](justworks-integration-guide.md)
- [AWS CodeCommit Integration Guide](aws-codecommit-integration-guide.md)
- [Hexnode UEM (Windows) Integration Guide](hexnode-uem-windows-integration-guide.md)
- [Aikido Integration Guide](aikido-integration-guide.md)
- [DataGrail Integration Guide](datagrail-integration-guide.md)
