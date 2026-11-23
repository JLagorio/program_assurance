# Huntress (Security Training) Integration Guide

Source: https://help.drata.com/en/articles/6005532-huntress-security-training-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: This article covers steps to connect Huntress security training to Drata.

## Article text

The Huntress (Security Training) integration enables security and compliance teams to automate security awareness training evidence collection. It connects Drata to Huntress so your team can track personnel training assignments and completion status to support compliance monitoring.

Note: **Curricula is now part of Huntress**, and all references to Curricula have been updated to Huntress in Drata.

## Key Capabilities

- Security awareness training tracking: Monitor personnel training assignments and completion status
- Compliance verification: Confirm personnel have completed required security awareness training
- Automated evidence collection: Sync training completion records into Drata

This integration is used to automate tests related to security awareness training compliance, helping prove compliance with personnel security and security awareness policies.

## Prerequisites & Data Access

- **Admin access** to your Huntress account
- Personnel created and configured in Huntress
- At least one **training assignment** created with one of the following statuses:
   - **In-Progress**
   - **Completed**
   - **Draft**
- Personnel must be **enrolled in the correct training assignments**
- Required Drata Role with Write access: Admin, Workspace Managers, DevOps Engineer
- Access Reviewers (Access Reviewers can only Read the connection page they can’t make changes)

Important requirements:

- **Deleted assignments cannot be imported into Drata.**
- Ensure all personnel are **properly enrolled in Huntress assignments** before connecting.

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Huntress account authentication | Allows Drata to securely connect and retrieve training data |
| Training assignments | Provides training completion and enrollment data for compliance monitoring |
| Campaign selection | Determines which training campaigns Drata evaluates for compliance |

## How Drata Determines Training Compliance

For each individual, Drata evaluates **campaign selection, enrollment, and completion status** to determine whether they are compliant with security awareness training.

### Campaign Selection

Drata will only evaluate campaigns that are **selected in the connection settings**.

Example:

| Campaign | Selected |
|---|---|
| Campaign A | ☑ |
| Campaign B | ☑ |
| Campaign C | ☐ |

In this example, **Campaign C is ignored** because it is not selected.

### Enrollment and Completion

Drata evaluates whether each person is **enrolled in the selected campaigns** and whether they have **completed them**.

Each individual must complete **all selected campaigns they are enrolled in** to be considered compliant.

### Example Scenario

| Campaign | Enrollment |
|---|---|
| Campaign A | 👩‍🚀 🧙‍♀️ 🦸‍♀️ |
| Campaign B | 👩‍🚀 🧙‍♀️ 🥷 |
| Campaign C | 👩‍🚀 🧙‍♀️ 🦸‍♀️ 🥷 |

| Campaign | Completion |
|---|---|
| Campaign A | 🟢 🛑 🟢 |
| Campaign B | 🟢 🟢 🛑 |
| Campaign C | 🟢 🛑 🟢 🛑 |

### Compliance Determination

| Character | Campaign A | Campaign B | Campaign C | Overall Status |
|---|---|---|---|---|
| 👩‍🚀 | Enrolled: 🟢 | Enrolled: 🟢 | Not Selected | 🟢 |
| 🧙‍♀️ | Enrolled: 🛑 | Enrolled: 🟢 | Not Selected | 🛑 |
| 🦸‍♀️ | Enrolled: 🟢 | Not Enrolled | Not Selected | 🟢 |
| 🥷 | Not Enrolled | Enrolled: 🛑 | Not Selected | 🛑 |

Explanation:

- 👩‍🚀 Enrolled in both selected campaigns and completed both → **Compliant**
- 🧙‍♀️ Enrolled in both campaigns but completed only one → **Not compliant**
- 🦸‍♀️ Enrolled in only one selected campaign and completed it → **Compliant**
- 🥷 Enrolled in one campaign but has not completed it → **Not compliant**

### Persistence Behavior

Drata only syncs training status for individuals who are **not yet compliant**.

Once an individual is marked compliant:

- Drata **stops syncing their status from Huntress**
- This prevents changes in Huntress from accidentally overriding a compliant status in Drata

To reset training compliance for an individual, you must **reset their training status in Drata**.

## Step-by-Step Setup

### Step 1: Confirm Huntress Training Assignments

1. Log in to **Huntress**.
2. Ensure your personnel accounts are configured.
3. Confirm that training assignments exist with a status of:
   - **In-Progress**
   - **Completed**
   - **Draft**
4. Verify personnel are **enrolled in the appropriate assignments**.

Expected outcome: Personnel and training assignments are configured in Huntress.

### Step 2: Connect Huntress in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Huntress (Security Training)** connection process.
4. Select **Connect your Huntress Account**.
5. You will be redirected to **Huntress** to log in and authorize the connection.

Expected outcome: Huntress is successfully connected to Drata.

### Step 3: Select Training Assignments

1. After authentication, select the **assignments (campaigns)** that should count toward security awareness training compliance.
2. Save your configuration.

Expected outcome: Drata monitors the selected Huntress assignments for training compliance.

## Verify Settings in Drata

After connecting Huntress, Drata automatically configures Huntress as your **security awareness training provider**.

To verify:

1. In Drata, select your **account name** in the lower-left navigation.
2. Navigate to **Settings → Personnel Compliance → Internal Security**.
3. Under **Annual Security Awareness Training**, confirm that
   **Use Huntress for cyber security awareness training** is enabled.

Expected outcome: Huntress is set as the active security awareness training provider.

## Employee Onboarding Experience

Once connected:

- Personnel will see a **Huntress-branded screen during onboarding** in Drata.
- They will be prompted to complete their assigned training through Huntress.

Drata automatically:

- Syncs training activity **every night**
- Retrieves **completion certificates** for individuals who complete their assigned training

## Important Notes

- Deleted assignments in Huntress **cannot be imported into Drata**.
- Ensure your **authentication token does not expire**, or the connection may disconnect.
- To learn more about token expiration, refer to **Huntress documentation on token expiration**.
- Drata updates personnel training activity **nightly** and retrieves completion certificates automatically.

## Related articles

- [Showing completion of Security Awareness Training](showing-completion-of-security-awareness-training.md)
- [Test 42: Policies for Security Awareness Training](test-42-policies-for-security-awareness-training.md)
- [Test 43: Security Awareness Training Completed](test-43-security-awareness-training-completed.md)
- [KnowBe4 Integration Guide](knowbe4-integration-guide.md)
- [EasyLlama Integration Guide](easyllama-integration-guide.md)
