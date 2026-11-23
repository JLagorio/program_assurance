# Run an Access Review

Source: https://help.drata.com/en/articles/13557396-run-an-access-review
Collection: Understand the Drata Platform › Access Review
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Access Reviews help you review and validate user access across connected applications.

## Article text

Drata centralizes application permissions so you can confirm appropriate access, identify risks, and generate audit-ready evidence for annual access control reviews.

**Related articles:**

- [Add an Application Manually for Access Reviews (New Experience)](add-an-application-manually-for-access-reviews-new-experience.md)
- [Upload or Update Personnel Data for Access Reviews (New Experience)](upload-or-update-personnel-data-for-access-reviews-new-experience.md)

## Prerequisites

- **Drata role:** Admin, Access Reviewer, or Workspace Manager.
- **Connection setup: **Ensure your [identity connections (such as Okta or Microsoft)](https://help.drata.com/en/collections/16504711-identity-idp-guidance) are properly configured and syncing successfully.
- **Plan:** User Access Review is an add-on for Foundation and Advanced, and it’s included with Enterprise. To turn it on, contact your account manager.

## Step 1: Go to Access Reviews

Select **Governance** > **Access Reviews**.

The page has three tabs:

- **Applications:** Shows the latest synced access data from your connected applications.
   - Data refreshes nightly.
   - You can add applications manually if needed.
- **Active Review:** Shows the current review period.
   - Tracks review progress across applications.
   - Only one review period can be active at a time.
- **Completed Reviews:** Shows previous review periods.
   - Includes downloadable evidence packages.
   - Shows reviewer and completion details.

## Step 2: Create a review period

**Note:** Only one review period can be active at a time.

1. Select **Governance** > **Access Reviews**.
2. Select **Create review period**.
3. Choose a start date and an end date.
4. Choose the applications to include in the review period.
5. Assign a reviewer to each application. Reviewers must have the Access Reviewer or Admin role.

Drata doesn’t take a snapshot of access data during the review period. It shows access as it exists on the day you do the review. For example, if your review period runs from April 1 to June 30 and you complete the review on July 5, you see access data as of July 5.

## Step 3: Review Access for an Application

Once a review period is active, reviewers validate access one application at a time.

**To open the Active Review:**

1. Go to **Governance → Access Reviews**
2. Select the **Active Review** tab
3. Choose an application in scope

Inside the application view, you can:

- View the assigned reviewer
- Upload or view all users with access
- Track review progress across accounts
- Identify warnings and potential risks

### Filter to admin accounts

1. Select **Governance** > **Access Reviews**, and then select the **Active Review** tab.
2. Select an application and select the **Personnel** tab.
3. With the Personnel table, select **Filters**.
4. Under **Permissions**, select **Admin**.

The list shows only accounts that have admin permissions in that application. **Filters** isn’t available until a review period is active and you’ve opened an application.

### Change the status of several accounts at once

1. Select the checkboxes for the accounts you want to update.
   - To select every account that matches your filters, use select all.
   - Select all applies to all matching accounts, not only the ones on the current page.
2. In the bulk actions bar, select **Change status**.
3. In the **Status** list, select **Approved**, **Rejected**, or **Out of scope**.
4. If you select **Rejected**, enter a reason in **Reason for rejection**. This field is required and can have up to 191 characters. Drata saves the reason in the internal notes.
5. Select **Save**.

## Step 4: Complete an Application Review

When all accounts in the application have been reviewed:

1. Open the application from the Active Review period
2. Select **Complete review**
3. (Optional) Upload additional evidence
4. Select **Submit**

When the review period is completed, Drata combines all application evidence into a single ZIP file, with a separate folder for each reviewed application. This file is automatically attached to **DCF-11: Annual Access Control Review** and saved into evidences. The evidence renewal date is set to one year from the completion date by default.

For accounts using workspaces, evidence is generated only for the Primary workspace. You may need to manually copy the evidence to other workspaces if required.

---

## Account Warnings in Your Active Review

While performing an access review, you may notice accounts flagged with specific **Warnings**. These are proactive indicators designed to help you identify security risks or data gaps that require your attention.

To view these warnings, navigate to the **Access Reviews** page and select the specific application you are reviewing.

| **Warning** | **Action to Take** |
|---|---|
| **Former personnel with access** | **Review and Offboard:** Verify if the user should still have access in the source application. If they have already been offboarded from your company, manually remove their access within that specific application. |
| **Missing MFA** | **Enable MFA:** Determine if Multi-Factor Authentication (MFA) is required for this user. If so, update their security settings directly in the source application where supported. |
| **Unlinked users** | **Map the Identity:** These accounts are not currently tied to a Drata identity. On the **Access Review** page, check the **Status** column. If an account is unlinked, click the **Link Personnel** button to map the account to the correct personnel profile. |
| **Service accounts** | **Informational Only:** No action is required unless the account appears misclassified. These flags help you distinguish between human users and automated system/integration accounts. |
| **Admin** | **Verify Privileges:** Confirm that this user requires administrative access. If elevated permissions are no longer necessary for their role, downgrade their privileges in the source application. |

---

## Reopen a Completed Review

Admins can reopen a completed review period if updates are needed. To do this, go to **Governance → Access Reviews**, open the **Completed Reviews** tab, and select **Re-open review**.

Reopening makes the review active again and allows edits to application reviews. This option is only available when no other review is currently active, since only one review period can be active at a time.

## Related articles

- [Annual Compliance Review](annual-compliance-review.md)
- [Okta Integration Guide (User Access Review)](okta-integration-guide-user-access-review.md)
- [Snowflake Integration Guide](snowflake-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [Download Access Review Evidence and Review Details](download-access-review-evidence-and-review-details.md)
