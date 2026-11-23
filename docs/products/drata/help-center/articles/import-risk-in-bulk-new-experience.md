# Import Risk in Bulk (New Experience)

Source: https://help.drata.com/en/articles/12260817-import-risk-in-bulk-new-experience
Collection: Understand the Drata Platform › Risk
Updated: 2026-11-20
Fetched: 2026-11-22
Description: Custom risks can be uploaded quickly using our guided import flow, making it simple to bring your existing risk inventory into Drata.

## Article text

> **New Experience**
> This article applies to the **New Experience**.

Drata’s Risk Library comes preloaded with over 200 risks based on industry-standard frameworks, including: NIST SP 800-30, ISO 27005, and OCR SRA. These built-in risks help you identify, assess, and manage common threats right out of the box.

You can also create and manage your own custom risks to fit your organization’s unique environment. Drata supports mapping custom risk fields to the columns in your file so your data stays consistent and easy to manage.

## Add custom risks

**Note:** If you have supporting documents you’d like to attach to risks, you can upload them before uploading all of your risks. For more information, refer to the ‘**Add supporting documents**’ section below.

### Prerequisite

- Before starting, download and review Drata's risk import template to ensure your data adheres to the required format.
- Currently, CSV file type is supported.
- Ensure that supporting documents are packaged in a ZIP file if submitting multiple files for easier management.

### Step 1: Upload and Map Fields

1. In the **Risks list** section, select **Upload a file**.
2. Map your fields:
   - Match your **Incoming fields** to Drata’s **Destination fields**.
   - Fields marked with an asterisk (*) in the Destination fields column are **required** and must be mapped to avoid validation errors in the next step
   - There is a **preview** of your mapped data as well.
3. Click **Continue** once you’ve completed field mapping.

### Step 2: Map Field Values (Optional)

1. If your data has enum values, review and adjust any mismatched values under **Incoming Values → Destination Values**.
2. Click **Submit** once you’ve finished mapping values for all fields.

**💡 Pro tip**: You can also select which destination values can be mapped to empty cells. This is useful especially for required fields so you do not have to fix the validation error for required fields in the Validation step.

**Example:**

If your Risk Status field uses values like **Inactive**,** Active**, and **Pending**, you’ll need to map these to Drata’s supported values, which are ACTIVE and CLOSED.

### Step 3: Validate the Sync Data

After mapping your fields and values, Drata will begin syncing and applying validation rules for each field. The** Submit** button will become available once all invalid (red) values are resolved. Clicking Submit will add the custom risks to your Risk Register.

- You can **hover over each column** to view the specific validation rules.
- Drata will display the **number of invalid cells** directly in the spreadsheet.
- Cells that **don’t meet validation rules** will appear **in red**.
- Cells that are **warning or info** only will be **highlighted in yellow. **For example,if the Risk ID already exists in Drata, it will be **highlighted in yellow** with a message indicating that the record will be updated.

### Validation rules

| **Field Name** | **Must be Mapped?** | **Validation Rules** |
|---|---|---|
| **Risk ID** | Optional | - Cannot have the same Risk ID multiple times within a column.<br>- If the Risk ID already exists in Drata, the risk will be updated with the new data.<br>- If the Risk ID does not exist, a new risk will be created.<br>- If the Risk ID is left blank, then Drata automatically generates a new risk ID.<br>- Preferred format: [PREFIX]-[NUMBER] (such as, PS-12) |
| **Title** | Required | - Up to 191 characters. |
| **Description** | Required | - Up to 30,000 characters. |
| **Categories** | Optional | - Select the categories available by Drata. See the list below.<br>- For Risk Management Pro customers, you can add custom categories by simply adding them to your file before uploading it in Drata and it will be created and assigned to the corresponding risks. |
| **Treatment option** | Optional | - Must map your treatment to one of the following values: Untreated, Accept, Transfer, Avoid or Mitigate. |
| **Treatment plan** | Optional | - Only applicable for treatment options: Accept, Transfer, Avoid, or Mitigate.<br>- Up to 30,000 characters. |
| **Completed Date** | Optional | - Only applicable for treatment options: Accept, Transfer, Avoid, or Mitigate.<br>- Expected Formats for Dates: yyyy-mm-dd |
| **Reviewers** | Optional | - Must have one of the following Drata roles: Admin, Risk Manager, Workspace Admin<br>- Only applicable for treatment options: Accept, Transfer, Avoid, or Mitigate.<br>- Add one or multiple emails of Drata users as reviewers. |
| **Inherent impact** | Optional | - (For Risk Management Pro customers) Must be within the range you defined in your Risk settings.<br>- (For Risk Management Standard customers) Must be within the range of 1-5. |
| **Inherent likelihood** | Optional | - (For Risk Management Pro customers) Must be within the range you defined in your Risk settings.<br>- (For Risk Management Standard customers) Must be within the range of 1-5. |
| **Inherent score** | Optional | - This is automatically calculated based on the inherent impact and likelihood values. |
| **Residual impact** | Optional | - Only applicable for treatment options: Transfer or Mitigate.<br>- (For Risk Management Pro customers) Must be within the range you defined in your Risk settings.<br>- (For Risk Management Standard customers) Must be within the range of 1-4. |
| **Residual likelihood** | Optional | - Only applicable for treatment options: Transfer or Mitigate.<br>- (For Risk Management Pro customers) Must be within the range you defined in your Risk settings.<br>- (For Risk Management Standard customers) Must be within the range of 1-4. |
| **Residual score** | Optional | - This is automatically calculated based on the residual impact and likelihood values. |
| **Anticipated completion date** | Optional | - Only applicable for treatment options: Transfer or Mitigate.<br>- Can be any date present, past or future. |
| **Risk identified date** | Optional | - Can be any date present, past or future. |
| **Risk source** | Optional | - Only for Vendor Risk Management Pro customers.<br>- Select if it is an internal or external source for Risks.<br>Note: Drata’s out-of-the-box risks do not allow changes to the Risk source field. |
| **Vendor** | Required | - Only for Vendor Risk Management Pro customers.<br>- Only applicable for external risk sources.<br>- Must select a vendor from your defined vendor lists in Drata. |
| **Risk status** | Required | - Must be assigned as one of active, closed or archived. |
| **Internal notes** | Optional | - Up to 768 characters.<br>- Only new Internal notes can be added. Existing Internal notes cannot be modified or deleted. |
| **Supporting documents** | Optional | - Attach new supporting documents to the risk.<br>- Supporting documents already attached to an existing risk cannot be replaced or deleted.<br>- For more information, refer to the ‘Add supporting documents’ section below. |
| **Owners** | Optional | - Owners must have the following Drata Roles: Admin, Risk Manager or Workspace Manager.<br>- Add the emails of one or more assigned owners. |
| **Controls** | Optional | - The mapped control codes must exist in Drata.<br>- If you have multiple workspaces, the mapped control codes must exist in your primary workspace. |
| **Custom fields** | Optional | - Only available for those who have **Custom fields and formulas** enabled.<br>- Refer to your custom field settings for the validations rules for these custom fields. |

### Add supporting documents

You can optionally attach relevant files to your custom risks to provide additional context or evidence.

1. Go to the **Upload supporting documents **section.
2. Upload any documents you want to attach to risks.
   - **File size limits:**
      1. Up to 25 MB for most files
      2. Up to 100 MB for .zip files
   - **Supported file types**: .pdf, .docx, .xlsx, .odt, .ods, .pptx, .odp, .gif, .jpeg, .jpg, .png, .csv, .txt, .json, .zip, .html, .log, .msg, .mp4

If submitting multiple supporting documents, consider packaging them in a ZIP file for easier upload.

### Drata’s standard risk categories

| **Fields Name** | **Value Name** |
|---|---|
| **Standard categories** | - Assessments & Audits<br>- Access Control<br>- Artificial Intelligence<br>- Asset Management<br>- Governance - Awareness & Training<br>- Governance - Compliance/Legal<br>- Governance - Context/Scope<br>- Governance - Finance<br>- Governance - Planning<br>- Governance - Policies<br>- Incidents - Breach, Compliance, UA Modification<br>- Incidents - Environmental<br>- Incidents - Recovery & Remediation<br>- Physical - Access<br>- Physical - Site<br>- People - Personnel<br>- People - Third Party<br>- Privacy - Access<br>- Privacy - Awareness & Training<br>- Privacy - Data Protection<br>- Privacy - Management<br>- Privacy - Monitoring<br>- Privacy - Non-Compliance<br>- Privacy - TPA<br>- Privacy - Lawfulness<br>- Privacy - Transparency<br>- Privacy - Data Subject Rights<br>- Privacy - Accuracy<br>- Privacy - Accountability<br>- Privacy - Storage Limitation<br>- Privacy - Purpose Limitation<br>- Privacy - Data Minimization<br>- Software Development<br>- Systems - Configurations<br>- Systems - Data Protection<br>- Systems - Monitoring & Logging |

## Update risks in bulk

You can update Drata’s out-of-the-box (Risk Library) or custom risks in bulk.

To update, follow the same steps as ‘[Add Custom Risks’](#h_fa37c0ec83) but instead of providing new Risk IDs or blank Risk IDs, provide existing Risk IDs. Our import process **will detect the existing Risk IDs and update the corresponding risks with the values provided in your file.**

**Important callouts**

1. Existing Risk IDs will be highlighted in yellow with a text indicating that this Risk will be updated.
2. For Drata’s out-of-the-box risks, you cannot update the ‘Risk source’ from internal to external or set a vendor.

## Related articles

- [Getting started with a risk assessment (Concept Guide)](getting-started-with-a-risk-assessment-concept-guide.md)
- [Understanding the Drata Risk Register](understanding-the-drata-risk-register.md)
- [Create Workflow for Risk](create-workflow-for-risk.md)
- [Risk management in Drata: An overview](risk-management-in-drata-an-overview.md)
- [Risk Management Training Videos (New Experience)](risk-management-training-videos-new-experience.md)
