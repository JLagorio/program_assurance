# Apply Default Mappings for Controls

Source: https://help.drata.com/en/articles/13381699-apply-default-mappings-for-controls
Collection: Understand the Drata Platform › Controls
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Restore Drata's default mappings between controls and framework requirements or monitoring tests.

## Article text

## Overview

Drata provides **default mappings** between:

- **Controls and framework requirements**, and
- **Controls and monitoring tests**

You can customize these mappings at any time by linking, unlinking, or replacing requirements or tests. If you want to return to Drata's recommended configuration, you can **revert to the default mappings** at any time. This allows you to:

- Safely experiment with custom mappings
- Restore Drata's baseline guidance
- Align controls with updated or improved default mappings

💡 **Important:**
Custom controls, custom requirements, and custom tests are **not affected**. These mappings always remain under your control.

## Prerequisites

The following roles can apply default mappings:

- Administrator
- Guest Administrator
- Workspace Manager
- Information Security Lead
- Service Group User

## Apply default mappings for an individual control

You can compare and restore default mappings for a single **Drata Control Framework (DCF) control**.

1. Open any **DCF control**.
2. Select the desired tab
   - **Monitoring: **Comparison to default mapped tests
   - **Frameworks**: Comparison to default mapped requirements
3. Select **Compare to defaults**.
4. Review the differences between your current mappings and Drata's default mappings.

In the comparison modal, choose one of the following:

- **Keep current configuration** to retain your custom mappings
- **Apply defaults** to restore Drata's default mappings

If your current mappings already match Drata's defaults, a notification appears indicating that no changes are required.

## When should you use default mappings?

Apply default mappings when:

- You want to undo extensive customization
- Drata has updated mappings for improved accuracy
- You're troubleshooting unexpected control coverage
- You want to return to a known baseline before an audit

## Key takeaways

- You can customize mappings freely and safely
- Default mappings can be restored at any time
- Custom controls, requirements, and tests are never changed
- Default mappings can be applied at the control level
- Framework-level resets apply only to control-to-requirement mappings

## Related articles

- [The Drata Control Framework & Requirement Relationship](the-drata-control-framework-requirement-relationship.md)
- [Introduction to the Drata Control Framework (DCF)](introduction-to-the-drata-control-framework-dcf.md)
- [Revert a Control to Drata's Latest DCF Template](revert-a-control-to-drata-s-latest-dcf-template.md)
- [Map Tests to Controls](map-tests-to-controls.md)
- [APRA CPS 230: Set Up Guidance (APRA-Regulated Entity vs. Material Service Provider)](apra-cps-230-set-up-guidance-apra-regulated-entity-vs-material-service-provider.md)
