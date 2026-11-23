# SAP SuccessFactors Integration Guide

Source: https://help.drata.com/en/articles/12600565-sap-successfactors-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-11-17
Fetched: 2026-11-22

## Article text

## Prerequisites & Data Access

- Ensure you have Admin privileges for your SAP SuccessFactors account with permission for the Manage Integration Tools > Manage OAuth2 Client Applications.

**Data Table**

Drata requests read-only access to the following SAP SuccessFactors data. Drata doesn’t change anything in your SuccessFactors account.

| **Object** | **Data Drata reads (read-only)** |
|---|---|
| **Employees** | Display Full Name, Employee Number, Employment Status, Employments, First Name, Groups, Last Name, Manager, Personal Email, Preferred Name, Remote Created Timestamp, Start Date, Termination Date, Username, Work Email |
| **Employments** | Effective Date, Employee, Employment Type, Job Title |
| **Groups** | Is Commonly Used As Team, Name, Parent Group, Type |

## Step-by-Step Setup

**Connect in Drata**

1. In **Connections**, select **SAP SuccessFactors**.
2. Under **Choose which name to use for this HRIS**, select **Legal name** or **Preferred name**. Drata uses your choice throughout the platform and in all evidence and downloads it generates.
3. Select **Next** to open the SAP SuccessFactors authentication widget.
   ![image 01](../../images/integrations/sap-successfactors/sap-successfactors-integration-guide--01.png)
4. After you authenticate, Drata sets up and confirms the connection automatically.

**Note:** the first authentication can take up to 15 minutes. During that time, requests may return a 401 Unauthorized error until the integration is active.

### Step 1: Find API Server

1. SuccessFactors uses **regional API servers**
2. Look up your tenant’s API server in SAP's regional mapping table
3. Example:
   ```
Tenant URL: https://pmsalesdemo8.successfactors.com 
API Server: https://apisalesdemo8.successfactors.com
   ```
4. ✅ Copy this API Server for use during connection

### Step 2: Find Username and Company ID

**Find Username**

1. Log in to SuccessFactors
2. Click your **profile icon** (top right)
3. Copy the value inside parentheses → This is your **Username**

**Find Company ID**

1. From the same menu, click **Show version information**
2. Copy the **Company ID**

### Step 3: Register OAuth2 Client Application

1. Use the search bar to search: **Manage OAuth2 Client Applications**
2. Select **Actions → Manage OAuth2 Client Applications**
3. Click **Register Client Application**
4. Enter:
   - **Application Name**
   - **Application URL** (This can be any URL and is not used in this integration.)
5. Click **Generate X.509 Certificate**
6. Enter **Common Name (CN)**.
7. Click **Generate**
8. Copy the certificate value from the **X.509 Certificate** field
9. Download Private Key ⚠️
   - Click **Download**
      - ❗Caution: The downloaded file contains your private key. This file should be handled securely after the connection process.
   - Open the file safely and **copy only** the long encoded key between:
      ```
-----BEGIN ENCRYPTED PRIVATE KEY----- …your key here… -----END ENCRYPTED PRIVATE KEY-----
      ```
   - ✅ This is your **Private Key**
   - ⚠️ **Do not share—store securely and delete local file after setup**
10. Your API Key is displayed on the Manage OAuth2 Client Applications screen above your X.509 Certificate.

⏳ Initial authentication may take **up to 15 minutes**. During this time, requests may return **401 Unauthorized** until the integration fully activates.

## Images

- [image 01] ../../images/integrations/sap-successfactors/sap-successfactors-integration-guide--01.png

## Related articles

- [BambooHR Integration Guide](bamboohr-integration-guide.md)
- [Egnyte Integration Guide (UAR)](egnyte-integration-guide-uar.md)
- [Dropbox Integration Guide](dropbox-integration-guide.md)
- [Docebo Integration Guide](docebo-integration-guide.md)
- [UKG Ready Integration Guide](ukg-ready-integration-guide.md)
