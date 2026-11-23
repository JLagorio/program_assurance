# MongoDB Atlas Integration Guide

Source: https://help.drata.com/en/articles/5310322-mongodb-atlas-integration-guide
Collection: Connection Support › Infrastructure Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to Mongo DB Atlas

## Article text

Connecting MongoDB Atlas to Drata allows for automated, continuous monitoring and evidence collection for dozens of infrastructure security controls required for compliance.

### Prerequisites

- Make sure you have **Admin access** to your company’s MongoDB Atlas account.
- **Drata role requirement**: Admin, Workspace Manager, or DevOps Engineer. Access Reviewers can only view the Connections page
- **MongoDB Atlas API Access Requirements:** Drata monitors your cloud MongoDB backup jobs.

## Step-by-Step Setup

Drata requires a read-only API key to connect and monitor MongoDB Atlas infrastructure. You can create the API key at either the organization (Organization Read Only) or project level (Project Read Only).

### Step 1: Create a MongoDB Atlas API Key

Drata requires a read-only API key with either:

- **Organization Read Only** (recommended), or
- **Project Read Only**

permissions to connect and monitor your MongoDB Atlas infrastructure.

#### Option 1: Organization Level (Recommended)

This option monitors every database across all projects in your MongoDB Atlas organization.

1. In MongoDB Atlas, open **Access Manager** at the organization level.
2. Create a new API key.
3. Enter the API key description exactly as shown in Drata during the connection process.
4. Assign the **Organization Read Only** permission.

Be sure to copy and save the following values:

- Public key
- Private key

#### Option 2: Project Level

This option creates a project-specific key that monitors only the selected project.

1. Select the project you want to connect.
2. Open **Access Manager → Project Access**.
3. Create a new API key.
4. Enter the API key description exactly as shown in Drata during the connection process.
5. Assign the **Project Read Only** permission.

Be sure to copy and save the API key credentials.

After creating the key, MongoDB Atlas will generate the following values:

- **Public Key**
- **Private Key**

⚠️ **Important:** The private key is only displayed once. Save it securely before leaving the page.

### Step 2: Add Drata IP Addresses to the API Access List

Drata monitors MongoDB backup job metadata through the Atlas API. To allow this access, you must add **[Drata’s IP addresses](dratabot.md)** to the **[API Access List](https://www.mongodb.com/docs/atlas/configure-api-access/#required-for-select-resources--api-resource-request-access-lists)** for your API key.

You can configure the Access List when creating the API key or update it afterward in MongoDB Atlas.

### Step 3: Complete the Connection in Drata

In Drata’s MongoDB Atlas connection setup, enter the following fields:

- Organization ID
- Public Key
- Private Key

Once saved, Drata will begin monitoring MongoDB Atlas evidence automatically.

## Test 88: MFA on Cloud Infrastructure (Important Note)

MongoDB Atlas’ API does not expose user MFA details.

As a result:

- All records on the **Managed Accounts** page will show as failing MFA.
- Monitoring Test 88 (**MFA on Infrastructure Console**) will show these users as failing.

To resolve this:

- Exclude the affected users from Test 88 results in Drata.

If MongoDB Atlas is the **only** connected infrastructure provider, Test 88 can also be disabled.

## Related articles

- [GCP Integration Guide (Script Setup)](gcp-integration-guide-script-setup.md)
- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [DigitalOcean Integration Guide](digitalocean-integration-guide.md)
- [Cloudflare Integration Guide (Infrastructure and UAR)](cloudflare-integration-guide-infrastructure-and-uar.md)
- [TriNet Integration Guide](trinet-integration-guide.md)
