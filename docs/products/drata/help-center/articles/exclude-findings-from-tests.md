# Exclude Findings from Tests

Source: https://help.drata.com/en/articles/13521711-exclude-findings-from-tests
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Exclude specific items from a compliance test when they do not apply to your organization, and re-include them when needed.

## Article text

A finding represents a specific resource, configuration, or result that affects whether a test passes or fails. You can exclude findings when they do not apply to your organization or represent an approved exception. Excluding items ensures tests focus on issues that impact compliance while preserving visibility and audit context.

### Example scenarios

- If a security group allows public SSH for a documented business reason, you can exclude that finding while recording justification.
- If a vulnerability test reports priorities that do not impact compliance, you can exclude those findings to focus remediation on relevant risks.

### Personnel findings

If a test lists personnel as findings, you **can't exclude or reinclude those individuals from the Monitoring page.** Create these exclusions from the **Personnel** page instead, where you can [manage personnel exclusions](personnel-exclusions.md) or [mark them out of scope](confirm-your-personnel.md).

## Exclude findings from a test

1. Open **Monitoring** and select a test.
2. Open the **Findings** tab.
3. Select one or more findings.
4. Select **Exclude**.
5. Enter a business rationale.
6. Select **Submit**.

You can select an individual finding to view additional details before excluding it.

## Re-include excluded items

1. Open **Monitoring** and select a test.
2. Open the Exclusions tab.
3. Select one or more excluded items.
4. Select the **Include**
5. Confirm by selecting **Reinclude**.

Drata reapplies the item during the next test run.

## Find tests with exclusions

To find tests that include exclusions:

1. Open **Monitoring**.
2. Apply the **Has exclusions** filter.

This filter shows all tests with one or more excluded findings.

## Related articles

- [Excluding Infrastructure resources](excluding-infrastructure-resources.md)
- [Filter and search tests in Monitoring (New Experience)](filter-and-search-tests-in-monitoring-new-experience.md)
- [View and Manage Test Details (New Experience)](view-and-manage-test-details-new-experience.md)
- [Personnel exclusions](personnel-exclusions.md)
- [Creating an SLA for Employee Onboarding Completion](creating-an-sla-for-employee-onboarding-completion.md)
