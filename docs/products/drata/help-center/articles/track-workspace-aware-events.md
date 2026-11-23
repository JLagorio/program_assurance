# Track Workspace-Aware Events

Source: https://help.drata.com/en/articles/13604533-track-workspace-aware-events
Collection: Getting Started › Workspaces
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Learn what types of events are considered workspace specific vs organization specific.

## Article text

The **Events** page shows system activity and test results generated across your Drata environment.

When using Workspaces, some events are **workspace-specific**, while others remain **organization-wide**.

---

### Who can access the Events page

You must have one of the following roles:

- **Admin**
- **Information Security Lead**
- **Workspace Manager**

**Role restriction**

- Users with the **Risk Manager** role cannot access the Events page.

---

## Workspace-aware events

Workspace-aware events are tied to the **currently selected Workspace**.

These events change when you switch Workspaces using the Workspace picker.

Examples include:

- Failed or completed tests
- Monitoring-related events
- Audit-related test activity

Workspace Managers can view **raw test results and evidence** for their assigned Workspace(s).

---

## Organization-wide events

Some events always apply to the **entire organization** and are not tied to a specific Workspace.

Examples include:

- Policy creation or updates
- Certain access and configuration events

These events appear regardless of which Workspace is selected.

---

### Workspace-aware event categories

You can filter events using **Categories**. The following categories include workspace-aware events:

- **Autopilot**
   - ⚠️ Some Autopilot events are organization-wide.
   - Test-related events are workspace-aware.
- **Monitor**
- **Audit**
- **Report**
- **GRC**
- **Custom Frameworks**

**Exception**

- Auditor login events and auditor access logs are always organization-wide, even when other events in the same category are workspace-aware.

---

### Filter and sort events

- Filtering behavior is consistent across all Workspaces.
- Events are sorted by **Timestamp**, with the most recent events displayed first.
- Switching Workspaces updates the event list automatically for workspace-aware events.

## Related articles

- [Google Workspace Integration Guide](google-workspace-integration-guide.md)
- [Events Overview](events-overview.md)
- [Roles and permissions overview (New Experience)](roles-and-permissions-overview-new-experience.md)
- [Workspace Manager overview](workspace-manager-overview.md)
- [Identify What Can Be Shared Workspace Resources](identify-what-can-be-shared-workspace-resources.md)
