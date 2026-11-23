# AI-powered control suggestions for policies

Source: https://help.drata.com/en/articles/12455211-ai-powered-control-suggestions-for-policies
Collection: Understand the Drata Platform › Policies
Updated: 2026-08-17
Fetched: 2026-11-22
Description: Use AI suggestions to map policies to controls, reduce manual work, and keep compliance mappings accurate and up to date.

## Article text

Use AI-powered suggestions to map policies to controls, reduce manual effort, and keep compliance mappings accurate and up to date.

Mapping controls to policies is critical for maintaining compliance, but it can also be one of the most time-consuming parts of managing a GRC program.

To improve accuracy and reduce manual work, Drata provides AI-powered control suggestions.

This feature helps you identify the most relevant controls for a policy based on its content and workspace context.

## How AI control suggestions work

When a policy is approved or published, Drata’s AI analyzes the policy content and generates a list of recommended controls to map to that policy.

Suggestions are based on:

- The policy text
- The controls available in the selected workspace
- Existing control mappings (already mapped controls are excluded)

### What’s included

AI-powered control suggestions can include both standard and custom controls.

This feature is supported for all policy types, including:

- Template policies
- Custom policies
- External policies

## Prerequisites

To use AI-powered control suggestions, the following requirements must be met:

- AI must be enabled for your organization.
   - Go to **AI settings** to turn it on.
- The policy must be approved or published.
- The policy must be written in English and contain at least 450 words.

- **Required Drata Roles**: Admin, Guest Administrator, Information Security Lead, Policy Manager, or Control Manager.
   - You must have permission to view and map controls. Read-only roles cannot use this feature.

## View and manage AI control suggestions

To review suggestions:

1. Open a policy.
2. Navigate to the **Controls** tab under mapped controls.
3. Once the policy is approved or published, suggested controls appear automatically.

Use the ellipsis menu to:

- Map all suggested controls
- Ignore all suggestions
- Regenerate suggestions

Ignored suggestions are hidden in the current version of the policy. If suggestions are regenerated in the future, previously ignored controls may reappear.

## AI-powered control suggestions status

You may see one of the following states:

- **Generating suggestions**
   AI is analyzing the policy content.
- **Suggestions available**
   One or more controls are recommended and ready for review.
- **No suggestions found**
   This can occur if:
   - The policy is too short
   - The policy is not in English
   - The policy is still in Draft or Needs approval
   - No relevant controls were identified
   - AI is not enabled
   - Your role does not allow control mapping

## Important notes

- If you're using workspaces, AI-powered control suggestions are only available in the New Experience.
- AI-powered control suggestions recommend controls only. The feature does not suggest or modify monitored tests associated with those controls.

## Related articles

- [Are Your Controls Ready? Understanding the Relationship Between Policies, Evidence, and Controls](are-your-controls-ready-understanding-the-relationship-between-policies-evidence-and-controls.md)
- [External Policy: Use BambooHR to manage your policies](external-policy-use-bamboohr-to-manage-your-policies.md)
- [Map policies to controls in Drata](map-policies-to-controls-in-drata.md)
- [Section 5: Control Owners](section-5-control-owners.md)
- [AI-Assisted Custom Control Mapping to GRC Objects](ai-assisted-custom-control-mapping-to-grc-objects.md)
