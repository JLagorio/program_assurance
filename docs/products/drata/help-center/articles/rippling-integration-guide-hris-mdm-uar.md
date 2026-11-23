# Rippling Integration Guide (HRIS, MDM, UAR)

Source: https://help.drata.com/en/articles/5014534-rippling-integration-guide-hris-mdm-uar
Collection: Connection Support › Other Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Making the initial connection to Rippling

## Article text

The **Rippling integration** enables security and compliance teams to synchronize **employee lifecycle data and device compliance information** with Drata. This connection allows organizations to automatically collect evidence related to personnel onboarding, offboarding, employment status, and workstation security configuration.

---

## Key Capabilities

- **Employee Lifecycle Sync:** Import employee hire dates, termination dates, and employment status from Rippling
- **Automated Personnel Monitoring:** Maintain accurate employee records for onboarding and offboarding compliance
- **Device Compliance Monitoring:** Retrieve device configuration information when Rippling MDM is enabled

This integration supports compliance monitoring related to **personnel lifecycle management and workstation security policies**.

---

## Prerequisites & Data Access

### Rippling Access Requirements

- You must have **Admin access** in your **Rippling account**.
- Your organization must have purchased the **Rippling App Management Package**.
- Rippling must be connected as an **HRIS integration** before it can be used for **MDM monitoring**.

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission / Access | Why It’s Needed |
|---|---|
| Employee lifecycle data | Retrieves hire date, termination date, and employment status |
| Device configuration data (optional) | Allows Drata to monitor device compliance settings when MDM sync is enabled |

---

## Step-by-Step Setup

### Step 1: Connect Rippling in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Rippling connection process**.
4. Enable the desired **connection type**.
5. You will be redirected to Rippling to sign in.

Expected outcome:
The Rippling connection process is initiated.

---

### Step 2: Configure Access Settings in Rippling

1. During the authorization process in Rippling, you will be prompted to configure account provisioning settings.
2. When asked: **Who should automatically get an account with Drata when they join the company?**
3. Select: Everyone including 1099 contractors should get an account
4. When asked: **If an employee (or consultant) matches the access rules, when should they get access to Drata? **
   - Select: As soon as they've signed their offer letter or agreement

Expected outcome:
 Rippling is configured to automatically provision users to Drata.

---

### Step 3: Enable Rippling MDM (Optional)

If your organization uses **Rippling for device management**, you can enable the **Rippling MDM option** during the connection process.

Important:

- Rippling must already be connected as an **HRIS integration**.
- The **Use Rippling MDM** option enables device compliance monitoring in Drata.

Expected outcome: Device configuration data from Rippling can sync to Drata for monitoring tests. However, note that auto-update status is not included in the data sync due to API restrictions in Rippling. Manual evidence is required to verify compliance for auto-updates.

---

## Important Notes

- **HRIS dependency:** Rippling must first be connected as an **HRIS integration** before enabling the **MDM connection**.
- **Device compliance limitations:** Rippling does not currently provide device information related to **automatic security patch configuration** or **auto-update settings** due to API restrictions. This means Drata cannot verify whether auto-updates are enabled on devices managed through Rippling.
- **Manual evidence requirement:** To meet compliance requirements, upload evidence of automatic updates for each person’s device (for example, a screenshot of the device’s update setting). Admins can upload this on the person’s record from the Personnel page, or you can let employees upload their own evidence through Internal Security settings.

## Related articles

- [Gusto Integration Guide](gusto-integration-guide.md)
- [Freshteam Integration Guide](freshteam-integration-guide.md)
- [HR Cloud Integration Guide](hr-cloud-integration-guide.md)
- [UKG Pro Integration Guide](ukg-pro-integration-guide.md)
- [Connect your HRIS to Drata](connect-your-hris-to-drata.md)
