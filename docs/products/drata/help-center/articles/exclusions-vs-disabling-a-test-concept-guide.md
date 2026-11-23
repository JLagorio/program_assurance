# Exclusions vs. Disabling a Test (Concept Guide)

Source: https://help.drata.com/en/articles/4939181-exclusions-vs-disabling-a-test-concept-guide
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-08-05
Fetched: 2026-11-22
Description: When should you use each option within Drata?

## Article text

When configuring Monitoring in Drata, you may need to decide whether to exclude specific items from a test or disable the test entirely. Both options help tailor monitoring to your environment, but they serve different purposes.

## Exclusions

- The test is relevant to your environment
- Specific items within the test are intentionally allowed or out of scope
- You want the test to continue running and catching future issues

**Example:**
You run a database monitoring test to continuously detect new or misconfigured databases. One specific database is intentionally configured in a way that does not pose risk for your organization. By excluding that database, the test continues to run daily and will still flag future databases, while the excluded item no longer causes failures.

## Disabling Test

- The test does not apply to your environment
- The control is implemented outside of Drata
- The test should not run or affect readiness

Using the correct approach helps ensure monitoring results are accurate, auditable, and aligned with your compliance scope.

**Example:**
A test checks for a specific security control that your organization implements using a different tool or process. Because the test does not reflect how your environment is secured, you disable the test and instead provide alternative evidence during an audit.

## Related articles

- [Populating and Managing Personnel Data in Drata (Concept Guide)](populating-and-managing-personnel-data-in-drata-concept-guide.md)
- [Datadog Integration Guide](datadog-integration-guide.md)
- [Excluding Infrastructure resources](excluding-infrastructure-resources.md)
- [View and Manage Test Details (New Experience)](view-and-manage-test-details-new-experience.md)
- [Disable a Test](disable-a-test.md)
