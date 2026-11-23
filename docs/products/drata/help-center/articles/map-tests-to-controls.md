# Map Tests to Controls

Source: https://help.drata.com/en/articles/13394042-map-tests-to-controls
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Manually map or unmap tests to controls to ensure monitoring results accurately reflect how your controls are implemented.

## Article text

Mapping tests to controls determines whether test results contribute to control readiness and framework compliance. While Drata provides default mappings, you can manually map or unmap tests to better match your environment, including for custom controls.

Use manual mapping when:

- You want a test to affect control readiness differently than the default
- You need to monitor custom controls with tests
- A test applies to a control that is not mapped by default

## Prerequisites

- **Permissions:** You must have write access to Controls or Monitoring. Eligible roles typically include Administrators, Information Security Leads, Workspace Managers, and Control Managers.

## How mapping works

- **Mapped tests** contribute to control readiness and any frameworks linked to those controls.
- **Unmapped tests** do not affect readiness but still provide visibility.
- You can map or unmap tests at any time.
- Mapping can be done from either a **control** or a **test**.

Mapping tests and controls creates a relationship between a test and a control. Whether you start from a test or a control, the result is the same: the test contributes to the control's readiness.

### Create or remove a mapping

- **From a control:** Use this when you want to manage which tests contribute to a specific control.
- **From a test:** Use this when you want to review which controls a test supports.

### How mapping affects readiness and audits

- Only mapped tests affect control readiness, framework readiness, and audit evidence expectations.
- Unmapped tests remain visible but informational.
- Accurate mappings help ensure readiness reflects real control implementation, auditors see appropriate test coverage, and monitoring aligns with your compliance scope.

## Map tests from the Controls page

1. Go to **Controls** page.
2. Select a control to open its details page.
3. Open the **Monitoring tab.**
4. Select **Map tests**.
5. Search for and select one or more tests.
6. Save your changes.

The mapped tests now appear on the control and contribute to its readiness.

### Remove a test mapping from a control

From the same section, select the **ellipsis (…)** next to the mapped test and remove the mapping. The test will no longer affect the control's readiness.

## Map controls from the Monitoring page

1. Go to **Monitoring**.
2. Select a test to open its details page.
3. Open the **Controls** tab.
4. Select **Map control.**
5. Search for and select one or more controls.
6. Save your changes.

If a control does not appear in the list, ensure it is marked **In Scope** on the Controls page.

### Unmap a control from a test

- From the **Controls** tab, remove the mapped control.
- The test will no longer affect that control's readiness.

## Related articles

- [Apply Default Mappings for Controls](apply-default-mappings-for-controls.md)
- [Monitoring Overview](monitoring-overview.md)
- [Filter and search tests in Monitoring (New Experience)](filter-and-search-tests-in-monitoring-new-experience.md)
- [Manage Tests in Monitoring Page](manage-tests-in-monitoring-page.md)
- [Disable a Test](disable-a-test.md)
