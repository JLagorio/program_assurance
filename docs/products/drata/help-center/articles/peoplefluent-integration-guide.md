# PeopleFluent Integration Guide

Source: https://help.drata.com/en/articles/12694502-peoplefluent-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-11-20
Fetched: 2026-11-22

## Article text

The **PeopleFluent** integration enables **security and compliance teams** to automate employee data syncing and access review evidence by connecting Drata to your PeopleFluent environment.

It connects using **administrator credentials** (Username, Password, and Company Domain), allowing Drata to securely import relevant personnel data for compliance monitoring.

## Key Capabilities

- **User Data Sync:** Imports user account and profile data from PeopleFluent into Drata.
- **Access Review Automation:** Supports automated personnel and access control evidence collection.
- **Simple Admin Authentication:** Uses administrator credentials to establish a secure connection with your PeopleFluent instance.

## Prerequisites & Data Access

- Must have **Admin**, **Information Security Lead**, **DevOps Engineer**, or **Workspace Manager** roles in Drata.
- Must have **Administrator access** within your **PeopleFluent account**.
- Must know your **Company Domain** (derived from your PeopleFluent login URL).

## Step-by-Step Setup

### Step 1: Create an Administrator User in PeopleFluent

1. Log in to **PeopleFluent** with your existing administrator account.
2. Navigate to **Manage Center → Users → User Manager → Users**.
3. Click **Create**, enter the user details, and assign the **System Administrator** role (or a system role with unrestricted access to **User Manager** and **Users**).
4. Click **Save** to finalize the administrator user.

**Expected outcome:** You now have an administrator user with the required access privileges to integrate PeopleFluent with Drata.

### Step 2: Collect Your Credentials

Gather the following fields for the integration setup:

| **Field** | **Description** |
|---|---|
| **Username** | The administrator user’s login username. |
| **Password** | The administrator user’s password. |
| **Company Domain** | Extracted from your login URL. For example, if your login URL is `"my-domain.learning.peoplefluent.net/ekp/login`", your domain is `my-domain`. |

**Expected outcome:** You have all required credentials (Username, Password, and Company Domain) to establish the Drata connection.

### Step 3: Complete the Connection in Drata

1. In Drata, navigate to **Connections → Available Connections**.
2. Search for **PeopleFluent** and select **Connect**.
3. Enter your credentials into the connection drawer as follows:

| **Drata Field** | **PeopleFluent Value** |
|---|---|
| Username | Administrator username |
| Password | Administrator password |
| Company Domain | The domain portion of your login URL (e.g., `my-domain`) |

1. Click **Connect**.
2. Drata will verify your credentials and establish a secure connection to your PeopleFluent instance.

**Expected outcome:** The PeopleFluent connection is successfully established, allowing Drata to sync employee data for automated compliance testing.

## Related articles

- [BambooHR Integration Guide](bamboohr-integration-guide.md)
- [UKG Pro Integration Guide](ukg-pro-integration-guide.md)
- [Egnyte Integration Guide (UAR)](egnyte-integration-guide-uar.md)
- [Mixpanel Integration Guide](mixpanel-integration-guide.md)
- [UKG Ready Integration Guide](ukg-ready-integration-guide.md)
