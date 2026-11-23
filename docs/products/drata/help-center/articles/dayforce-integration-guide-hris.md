# Dayforce Integration Guide (HRIS)

Source: https://help.drata.com/en/articles/13172315-dayforce-integration-guide-hris
Collection: Connection Support › Other Guidance
Updated: 2026-08-17
Fetched: 2026-11-22

## Article text

The Dayforce integration allows Drata to synchronize employee and employment data from your HR system to support personnel management and compliance monitoring.

### Key Capabilities

- **Personnel synchronization:** Syncs employment status, hire dates, and key personnel attributes from the HRIS.
- **Lifecycle classification:** Uses HRIS data to detect hire and termination events that support onboarding and offboarding compliance requirements.
- **Read-only ingestion:** Retrieves HR data using read-only access without modifying information in the HRIS system.

## Prerequisites & Data Access

- **Dayforce administrator** access to create and configure users, roles, and permissions
- **Dayforce Company ID** for your tenant
- A **dedicated Dayforce user account** for the integration as the Default role.
- Must be assigned one of the following Drata roles: **Admin, Workspace Managers, DevOps Engineer**.
- If you have the Access Reviewer Drata role, you can only view the Connections page.

## Step-by-Step Setup

### Step 1: Set the Default Role (Required)

Dayforce applies API permissions **only from the user’s Default role**.
If the role is not marked as Default, authentication may succeed but no data will be returned.

To set the Default role:

1. Go to **System Admin → User**
2. Select the user that will authenticate the integration
3. Enable **Is Default** on the role you are configuring

**Expected outcome:** The integration user has a Default role assigned.

### Step 2: Configure Feature Access

1. Go to **System Admin → Roles**
2. Select the integration role
3. Navigate to **Features**
4. Enable:
   - **HCM Anywhere**
   - **Web Services**

**Expected outcome:** The role can access Dayforce APIs in read-only mode.

### Step 3: Configure Authorizations

1. Navigate to **Authorizations** for the role.
2. Grant **Can Read** access to the data required. Drata reads the following data and it is required by Dayforce
   - **Employee Contact Information – Business** (BusinessEmail)
   - **Employee Contact Information – Personal**
   - **Employee Personal Information**
   - **Employee Personal Information XrefCode**
   - **Employee Status Information**
   - **Employee Work Assignment – Primary Records**
   - **Employee Work Assignment – Secondary Records** *(if applicable)*
   - **Employee Profile – Security Settings – Role**
   - **User Information**

### Step 4: Configure Web Services Field-Level Access

⚠️ Field-level access is required. Missing fields may cause sync or matching failures.

1. Navigate to **Web Services Field-level Access** and enable:
   - **RESTful Services → Human Resources**
   - **RESTful Services → Employee**
   - EffectiveStart
   - EffectiveEnd
   - XRefCode
2. Then, depending on your use case:
   - If you need **names**:
      - Enable **FirstName **and **LastName **and **CommonName**
   - If you need **managers**:
      - Right-click **Employee managers** and **Select All**
   - If you need **employment status**:
      - Right-click **Employment Statuses** and **Select All**
      - Right-click **Employment Status Group** and **Select All**

**Expected outcome:** Required employee fields are accessible via the API.

### Step 5: Configure Org-Level Access

1. Go to **System Admin → User**
2. Ensure **Can See Self** is enabled
3. Expand the user record to select **Location Access**
4. Select **+ Add Location **to add the **Company-level (top-level) location**

**Expected outcome:** The integration user can access all employees in the organization.

### Step 6: Connect Dayforce in Drata

In Drata, go to **Connections**, select **Dayforce HCM**, and enter:

- Company ID
- Username
- Password

Click **Submit** to complete the connection.

**Expected outcome:** The Dayforce connection appears as **Connected** in Drata.

## Related articles

- [Rippling Integration Guide (HRIS, MDM, UAR)](rippling-integration-guide-hris-mdm-uar.md)
- [Freshteam Integration Guide](freshteam-integration-guide.md)
- [HR Cloud Integration Guide](hr-cloud-integration-guide.md)
- [Workday Integration Guide (HRIS)](workday-integration-guide-hris.md)
- [Lattice HRIS Integration Guide](lattice-hris-integration-guide.md)
