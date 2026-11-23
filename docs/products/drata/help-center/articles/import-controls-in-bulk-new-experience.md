# Import Controls in Bulk (New Experience)

Source: https://help.drata.com/en/articles/13381439-import-controls-in-bulk-new-experience
Collection: Understand the Drata Platform › Controls
Updated: 2026-04-14
Fetched: 2026-11-22

## Article text

### Overview

Drata allows you to create and update **custom controls in bulk** using a spreadsheet upload. Bulk import is useful when onboarding a large number of controls, migrating data, or making consistent updates across existing controls.

You can use bulk import to:

- Create new custom controls
- Update existing custom controls
- Assign owners and approvers
- Map framework requirements
- Add internal notes

## Access bulk import

1. Go to **Compliance → Controls**.
2. Select **Create control**.
3. Choose **Create/Update in bulk**.

This opens the bulk import widget.

## Import or update controls in bulk

### Step 1: Upload and map fields

1. In the Controls list section, select **Upload a file**.
2. Upload a **CSV file**.
3. Map your **Incoming fields** to Drata’s **Destination fields**.
   - Destination fields marked with an asterisk (*) are required.
   - Required fields must be mapped to avoid validation errors.
4. Review the data preview.
5. Select **Continue** when mapping is complete.

**Note:** When updating risks in bulk, you only need to include the fields you want to change. Blank or omitted fields will not overwrite existing values, and leaving a field blank will not clear its current value.

### Step 2: (Optional) Map field values

If your file includes enumerated values (for example, dropdown fields):

1. Review **Incoming Values → Destination Values**.
2. Resolve any mismatched values.
3. Select **Submit** when finished.

**Pro tip: **You can allow destination values to be mapped to empty cells. This is especially helpful for required fields, as it prevents validation errors in the next step.

### Step 3: Validate the sync data

After mapping fields and values, Drata validates each row.

- Invalid cells appear in **red**
- Warning or informational cells appear in **yellow**
- Hover over a column header to view validation rules
- The number of invalid cells is displayed directly in the spreadsheet

The **Submit** button becomes available once all required validation errors are resolved. Selecting **Submit** creates the custom controls in Drata.

Here are all of the validation rules:

| **Field Name** | **Must be Mapped?** | **Validation Rules** |
|---|---|---|
| **Control Code** | Required | - Must be unique within that workspace<br>- Must not contain spaces<br>- Min 1 and max 20 characters allowed<br>- Cannot be blank (Control codes are not auto-generated) |
| **Name** | Required | - Must be unique within that workspace<br>- Up to 191 characters |
| **Description** | Required | - Up to 30,000 characters |
| **Question** | Optional | - Up to 30,000 characters |
| **Activities** | Optional | - Up to 30,000 characters |
| **<Framework> Requirement Ids** | Optional | - Allows multiple values separated by comma<br>- Must exist in Drata in that workspace |
| **Control Owners** | Optional | - Allows multiple values separated by comma<br>- User email must exist in Drata<br>- Must be a valid email format<br>- Required only if setting up approval |
| **Internal notes** | Optional | - Up to 30,000 characters<br>- Internal notes can only be added, not edited or deleted - No notifications will be sent for adding internal notes |
| **Approvers** | Optional | - Allows multiple values separated by comma<br>- Must exist in Drata<br>- Value cannot be blank if Approval deadline is filled<br>- Approvers must have either admins, workspace managers, InfoSec leads or Control manager roles<br>- Approval setup can be added/updated but NOT deleted |
| **Approval deadline** | Optional | - Value cannot be blank if Approvers is filled<br>- Date has to be current or in future |

## Update controls in bulk

You can also update existing controls using the same bulk import process.

To update controls:

- Follow the same steps used to add custom controls
- Provide **existing Control Codes** instead of new ones
- Control Codes must match exactly, including case sensitivity

During validation:

- Existing Control Codes appear in **yellow**
- A message indicates that the control will be updated

## Key takeaways

- Bulk import supports both creating and updating controls
- Required fields must be mapped and valid before submission
- Validation feedback is shown directly in the spreadsheet
- Existing controls are updated based on exact Control Code matches

## Related articles

- [Import Risk in Bulk (New Experience)](import-risk-in-bulk-new-experience.md)
- [Bulk Import Personnel Training Records (New Experience)](bulk-import-personnel-training-records-new-experience.md)
- [Bulk Import Personnel Background Checks (New Experience)](bulk-import-personnel-background-checks-new-experience.md)
- [Bulk Import Assets](bulk-import-assets.md)
- [Bulk Import Evidence](bulk-import-evidence.md)
