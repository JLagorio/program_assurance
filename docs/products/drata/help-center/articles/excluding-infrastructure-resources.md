# Excluding Infrastructure resources

Source: https://help.drata.com/en/articles/13274920-excluding-infrastructure-resources
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Exclusions in Drata let you exclude specific resources or test findings from compliance monitoring to reduce noise, manage audit scope, and focus on relevant evidence.

## Article text

## Overview

Exclusions in Drata allow you to intentionally ignore specific resources or findings that are not relevant to your compliance scope.

Exclusions exist to help you:

- Reduce noise from ephemeral or non-production resources
- Exclude assets that are intentionally out of audit scope
- Focus monitoring and evidence collection on what actually matters

Before applying exclusions, it’s important to understand what are exclusions and what kind of exclusions fit your scenario. This article explains that distinction.

Once you’ve determined the right approach, you can apply exclusions using your cloud provider’s tagging or labeling tools, as outlined in the next section.

## Provider-specific guidance

To learn how to apply exclusions in your cloud provider, see:

- [AWS Exclusions](exclusion-tags-within-aws.md)
- [GCP Exclusions](exclusion-labels-within-gcp.md)
- [Azure Exclusions](exclusion-tags-within-azure.md)

Each provider uses its own tagging or labeling system to apply exclusions.

## When to exclude infrastructure resources

Most customers encounter exclusions after connecting infrastructure provider to Drata.

A typical flow looks like this:

1. You connect an infrastructure provider.
2. Drata begins monitoring resources
3. You notice repeated test failures and monitoring results tied to short-lived, non-production, or resources that should be out of scope while reviewing monitoring results and evidence in Drata. Learn more about [Monitoring experience](https://help.drata.com/en/collections/16396837-monitoring).
4. You can choose how to handle those resources.

At this point, you have two options:

- **Exclude the resource at the provider level (resource-level exclusion)**
   - Use this when a resource should **never be monitored**.
   - This article explains when and why to use this approach.
- **Exclude the finding in Drata (test-level exclusion)**
   - Use this when the resource remains in scope, but a specific test result is acceptable, and you would just like to exclude a finding.
   - Learn more in the **[Exclusions](https://help.drata.com/en/articles/4836280-exclusions)** article.

If monitoring results are repeatedly dominated by resources that don’t represent real compliance risk, exclusions may be appropriate.

Resource-level exclusions are appropriate when resources are:

- Temporary or short-lived
- Outside audit scope
- Not relevant to compliance monitoring

Exclusions are meant to be **selective**, not a replacement for scoping decisions. Excluding too many resources can reduce automation coverage and visibility.

## How resource-level exclusions work in Drata

Drata detects resource-level exclusions based on **metadata applied in the source system**, such as tags or labels. Exclusions are evaluated during:

- Evidence collection
- Continuous monitoring

Excluded resources are ignored by applicable infrastructure tests.

> ℹ️ **Key concept:** Drata reads exclusion metadata. Drata does not set or manage it.

## Known limitations and considerations

- Exclusions may not apply immediately across all resource types
- Some infrastructure tests rely on account-level visibility
- Excluding a resource does not remove the account or environment from monitoring

## Best practices

- Use exclusions sparingly and intentionally
- Always include a meaningful rationale when excluding resources
- Periodically review excluded resources
- Coordinate exclusions with audit scope decisions

## Related articles

- [GCP Integration Guide (Script Setup)](gcp-integration-guide-script-setup.md)
- [Exclusions vs. Disabling a Test (Concept Guide)](exclusions-vs-disabling-a-test-concept-guide.md)
- [View and Manage Test Details (New Experience)](view-and-manage-test-details-new-experience.md)
- [Personnel exclusions](personnel-exclusions.md)
- [Exclude Findings from Tests](exclude-findings-from-tests.md)
