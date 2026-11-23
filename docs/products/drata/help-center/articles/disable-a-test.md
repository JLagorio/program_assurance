# Disable a Test

Source: https://help.drata.com/en/articles/13394083-disable-a-test
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Disable a test when it does not apply to your environment or when the control is monitored outside of Drata.

## Article text

## Overview

Disabling a test stops it from running and prevents its results from affecting control readiness. This is useful when a test is not relevant to how your organization implements a control or when monitoring is handled by another tool or process.

When you disable a test, you must provide a business rationale. This helps maintain audit transparency and makes it easier to review or re-enable the test later if requirements change.

## When to disable a test

Disable a test when:

- The test does not apply to your environment
- The control is implemented or monitored outside of Drata
- The test should not run or generate alerts
- The test does not reflect how compliance is managed in your organization

If the test is relevant but only certain items should be ignored, consider using **exclusions** instead of disabling the test.

### Prerequisites

**Permissions:** Only users with write access to Monitoring can disable tests. Eligible roles typically include: Administrators, Workspace Managers, Information Security Leads, and Control Managers.

## Disable a test

1. Go to **Monitoring**.
2. If the test is currently running, select the **ellipsis (…)** and stop the test run. This only stops the current run so the test can be disabled.
3. In the table, change the test **Status** from **Enabled** to **Disabled**.
4. Enter a **business rationale** explaining why the test is being disabled.
5. Save your changes.

Once disabled, the test:

- Stops running
- No longer affects control or framework readiness
- Remains visible for reference and audit review

## Re-enable a disabled test

You can re-enable a test at any time if it becomes relevant again.

1. Go to **Monitoring**.
2. Change the test **Status** back to **Enabled**.
3. Save your changes.

The test will resume running and contribute to readiness going forward.

## Related articles

- [Exclusions vs. Disabling a Test (Concept Guide)](exclusions-vs-disabling-a-test-concept-guide.md)
- [Monitoring Overview](monitoring-overview.md)
- [Manage Tests in Monitoring Page](manage-tests-in-monitoring-page.md)
- [View and Manage Test Details (New Experience)](view-and-manage-test-details-new-experience.md)
- [Create and Publish Custom Tests](create-and-publish-custom-tests.md)
