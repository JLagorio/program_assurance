# Organization settings: Organization Details (New Experience)

Source: https://help.drata.com/en/articles/13565986-organization-settings-organization-details-new-experience
Collection: Settings
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Manage your company information, locate your Account ID, and configure audit-facing details

## Article text

The **Organization details** page allows you to manage your company’s core information in Drata, including audit-facing details, compliance URLs, and your Account ID.

This information is used across Drata to represent your organization in policies, compliance documentation, and automated evidence collection.

Several fields on this page are tied directly to automated tests and audit evidence, so updates should be made carefully and only by authorized users.

## Prerequisites

To edit Organization details, you must have the **Admin** role.

- **Admins** can view and update all organization settings
- Other users may be able to view limited organization information but cannot make changes

## Access Organization details

To open the Organization details page:

1. Select **Settings**
2. Under **Organization**, select **Organization details**
3. Confirm you are on the **Org info** tab

## Organization information

These fields describe your organization’s identity and legal context.

| Field | Description | Relevance/Impact |
|---|---|---|
| **Company logo (optional)** | Upload your company logo.<br>**Workspace Enabled Note:**<br>If your workspace is enabled, you can update the company logo from Settings → Workspaces → Select Primary Workspace → Edit the workspace icon. | File must be **under 1 MB** and in **JPG or PNG** format.<br>Recommended pixel size is 62x62. |
| **Email domain** | Primary domain used for company email and website. | Impacts the following test and control:<br>- **Related test**: Test 70: SSL/TLS Enforced on Company Website<br>- **Related control**: DCF-55: SSL/TLS Enforced |
| **Full legal name (optional)** | Official legal entity name of your organization. | Referenced in contracts, policies, and audit documentation. |
| **Common name** | Public-facing or “doing business as” (DBA) name. | Used to pre-populate the company name in Drata policy templates. Changing this later does **not** automatically update existing policies. |
| **Incorporation / founding year(optional)** | Year the organization was established. | Provides organizational context in audit packages and reviews. |
| **Phone number(optional)** | Primary business contact number. | Used for customer and auditor contact where a phone number is required. |
| **Company description(optional)** | High-level summary of what your organization does. | Helps auditors and customers understand your business; can be used in audit package contexts. |
| **Company address(optional)** | Mailing or operating address. | Used in legal and audit documentation where a physical address is required. |
| **Account ID** | Unique identifier for your Drata account. | Read-only; used by Drata Support and internal tooling to identify your tenant. |
| **SafeBase Organization ID** | Identifier used for SafeBase / Trust Center integration. | Read-only; links your Drata tenant to your Trust Center instance. |
| **Data residency location** | Region where your Drata data is hosted. | Read-only; used to demonstrate where customer data is stored for compliance and contractual needs. |

**Important Notes:**

- If you update your **Common name**, Drata does **not** automatically update existing policies. To reflect the new name in policies, you must:
   - Manually update each policy, **or**
   - Contact Drata Support for assistance applying the change across templates.
- If you don’t see **Company logo** under **Settings → Organization details**, **Workspaces** is likely enabled. When that’s the case, update the logo from **Settings → Workspaces → Select your Primary workspace → Edit the Workspace Icon **instead.
   - For Workspaces, **Workspace Manager or Admin** access is required.
- If **Workspaces** is not enabled, you can update the logo under **Settings → Organization details → Org info**, where **Company logo (optional)** appears.

---

## Compliance and public URLs

These fields support customer transparency and automated compliance tests.

| Field | Purpose | Related test / control behavior |
|---|---|---|
| **Privacy policy URL(optional)** | Link to your public privacy policy describing confidentiality and privacy commitments. | Impacts the following test and control:<br>- **Related test**: Test 84: Privacy Policy Publicly Available<br>- **Related control**: DCF-65: Maintains a Privacy Policy |
| **Terms of use URL**<br>**(optional)** | Link to your public terms of service/terms of use. | Impacts the following test and control:<br>- **Related test**: Test 85: Terms of Service Publicly Available<br>- **Related control**: [DCF-66: Maintains a Terms of Service](terms-of-service-guidance-dcf-63-and-dcf-66.md) |
| **Support / Help URL** | Link to a support, help, or contact page for customers. | Impacts the following test and control:<br>- **Related test**: Test 11: Contact Information Available to Customers<br>- **Related control**: DCF-8: Disclosure Process for Customers |
| **Security / Compliance email** | Dedicated inbox for security or compliance inquiries | Recommended to keep separate from a general support email. |

**Note:**
If your Terms of Use/Terms of Service are not publicly available (for example, contract-only), you can:

- Disable the related monitoring test, and
- Upload your standard contract or MSA directly to the mapped control instead.

---

## Product information

### Sample MSA (Master Service Agreement)

Upload a **sample Master Service Agreement (MSA)** to demonstrate that your organization has formal agreements with customers outlining:

- Your commitments and responsibilities
- Customer responsibilities and expectations

If you do not use an MSA, you can upload another form of customer agreement, such as: Terms of Service, Service Agreement, or Statement of Work (SOW).

**Related test: Test 83:** MSAs Offered to Customers

**Related control: DCF-64:** Commitments Explained to Customers

**Note: **If your organization offers **multiple products**, you can:

- Upload **one representative agreement** here, and
- Upload additional agreements directly to **DCF-64: Commitments Explained to Customers** using **Map External Evidence**.

## Related articles

- [Organization settings: Human Resources Settings (New Experience)](organization-settings-human-resources-settings-new-experience.md)
- [Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md)
- [Audits page overview (New Experience)](audits-page-overview-new-experience.md)
- [Section 5: Evidence Owners](section-5-evidence-owners.md)
- [How to collect evidence for DCF-574: Mobile device management software](how-to-collect-evidence-for-dcf-574-mobile-device-management-software.md)
