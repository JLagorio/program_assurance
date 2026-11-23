# LastPass Integration Guide

Source: https://help.drata.com/en/articles/9300616-lastpass-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-12-12
Fetched: 2026-11-22

## Article text

Drata has a [LastPass](https://www.lastpass.com/) integration. This integration monitors individual's access and roles within your platform for compliance purposes.

## Key Capabilities

- **Access retrieval**: Retrieves users and assigned roles from connected systems.
- **Review enablement**: Makes this access data available for review in Drata’s Access Reviews feature.
- **Account mapping support**: Allows external accounts to be mapped to Drata personnel for accurate review and tracking.

## Prerequisites & Data Access

- Admin privileges in your **LastPass Business** account
- Access to the **LastPass Admin Console**
- Ability to retrieve:
   - **CID (Company ID / Account Number)**
   - **Enterprise API provisioning hash**
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the **Access Reviewer** Drata role, you can only view the Connections page.

| **Permission / Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| CID (Account Number) | Identifies your LastPass account | Account identifier |
| Enterprise API | Retrieve access information | Users, roles, account status |

## Step-by-Step Setup

### Step 1: Retrieve your CID (Account Number)

The **CID** identifies your LastPass Business account. The CID identifies your LastPass Business account and may appear in different locations depending on your account configuration.

1. Log in to the [Lastpass Admin Console](https://admin.lastpass.com/)
2. Look for the CID in one of the following places:
   - The **header** of the Admin Console
   - The **profile name dropdown**
   - **Advanced → Enterprise API**
   - The **Security Dashboard** (if available in your account)

**Expected outcome:**
You have copied your LastPass CID.

### Step 2: Generate or reset the provisioning hash

1. In the **LastPass Admin Console**, go to **Advanced → Enterprise API**.
2. Select **Reset provisioning hash** (if one does not already exist or needs rotation).
3. Copy the newly generated **provisioning hash** and store it securely.

**Expected outcome:**
You have generated and copied a valid provisioning hash.

**Note:**
Resetting the provisioning hash invalidates the previous hash and may impact other integrations that use it.

### Step 3: Connect LastPass inside Drata

1. In Drata, navigate to **Connections**.
2. Select the **Available Connections** tab.
3. Search for **LastPass** and select **Connect**.
4. Enter:
   - **CID**
   - **Provisioning hash**
5. Save the connection.

**Expected outcome:**
Drata successfully authenticates with LastPass.

## External resources

[Use the LastPass Provisioning API](https://support.lastpass.com/s/document-item?language=en_US&bundleId=lastpass&topicId=LastPass/use-provisioning-api.html&_LANG=enus)

## Partner Offers & Discounts

Drata has a direct partnership and discounted pricing for first time customers of LastPass. Get 20% off your first year of LastPass Business by visiting [https://www.lastpass.com/lp/drata-trial](https://www.lastpass.com/lp/drata-trial)

Check out [more partner offers and discounts](https://drata.com/partner/find/tech-directory?collections=partner-discountoffers,partner-offers-discounts-pod).

## Related articles

- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [JumpCloud IdP Integration Guide](jumpcloud-idp-integration-guide.md)
- [Okta Integration Guide (User Access Review)](okta-integration-guide-user-access-review.md)
- [Klaviyo Integration Guide](klaviyo-integration-guide.md)
- [Google Workspace Integration Guide (User Access Reviews)](google-workspace-integration-guide-user-access-reviews.md)
