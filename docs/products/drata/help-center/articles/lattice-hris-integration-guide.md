# Lattice HRIS Integration Guide

Source: https://help.drata.com/en/articles/13922636-lattice-hris-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-03-04
Fetched: 2026-11-22

## Article text

The **Lattice HRIS integration** enables security, compliance, and HR teams to automatically synchronize employee and employment data. It connects Drata to Lattice HRIS so your organization can maintain accurate employee records for onboarding, offboarding, and compliance monitoring.

---

## Prerequisites & Data Access

Before connecting Lattice HRIS to Drata, ensure the following requirements are met:

- **Lattice administrator access:** You must have **Administrator access** in your organization’s Lattice account.
- **Lattice HRIS subdomain:** You must know your company’s **Lattice HRIS subdomain** (for example: `yourcompany.latticehq.com`).

**Required Drata Role with Write access**

- Admin
- Workspace Managers
- DevOps Engineer

**Access Reviewers**

Access Reviewers can view the connection page but cannot modify connection settings.

---

### Permissions & Data Table

Drata requests the following **read-only scopes** from Lattice HRIS.

| Permission/Scope | Why It’s Needed |
|---|---|
| employees:employment_details | Retrieves employment status, employment type, and start/termination dates |
| employees:role_details | Retrieves job title and manager information |
| employees:personal.read | Retrieves employee name information |
| employees:contact_information.read | Retrieves employee contact details such as work email |

---

## Step-by-Step Setup

### Step 1: Connect Lattice HRIS in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your available connections.
3. Search for and start the **Lattice HRIS connection process**.
4. Sign in to **Lattice** when prompted.
5. Enter your **Lattice HRIS subdomain** (for example: `yourcompany.latticehq.com`).
6. Approve the requested permissions.

**Expected outcome:**
Drata successfully connects to Lattice HRIS and begins syncing employee records.

---

## Data Synced from Lattice HRIS

Drata retrieves employee data from the **Lattice `/v2/employees` API endpoint**.

| Drata Field | Lattice Field Path | Required |
|---|---|---|
| Personal Email | id.contact_information.personal_email | Optional |
| Work Email | id.contact_information.work_email | Required |
| First Name | id.personal.legal_first_name | Required |
| Last Name | id.personal.legal_last_name | Required |
| Manager | id.role_details.manager.email | Optional |
| Job Title | id.role_details.job_title | Optional |
| Employment Type | id.employment_details.employment_type.label | Required |
| Employment Status | id.employment_details.status | Required |
| Start Date | id.employment_details.start_date | Required |
| Termination Date | id.employment_details.termination_date | Optional |

---

## Important Notes

- The **HRIS integration uses secure OAuth authentication**.
- Drata requests **read-only access** to employee data.
- **No credentials are stored in Drata** during the authentication process.

---

## Additional Resources

Lattice HRIS OAuth guide:
[https://help.merge.dev/articles/8308564713-lattice-hris-how-do-i-link-using-oauth](https://help.merge.dev/articles/8308564713-lattice-hris-how-do-i-link-using-oauth)

## Related articles

- [Rippling Integration Guide (HRIS, MDM, UAR)](rippling-integration-guide-hris-mdm-uar.md)
- [Freshteam Integration Guide](freshteam-integration-guide.md)
- [Connect your HRIS to Drata](connect-your-hris-to-drata.md)
- [Lattice Integration Guide](lattice-integration-guide.md)
- [Dayforce Integration Guide (HRIS)](dayforce-integration-guide-hris.md)
