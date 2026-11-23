# Jira security tickets: Label vs JQL

Source: https://help.drata.com/en/articles/4806017-jira-security-tickets-label-vs-jql
Collection: Enhancing your workflow › Tickets
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

When making the connection to Jira, you can specify a label or JQL and Drata application can automatically find the relevant tickets in Jira.

### What this configuration controls

When you connect **Jira** to Drata, you choose how Drata finds **security-related tickets** for the security ticket test (Monitored Test 26):

- **Label** – Drata infers security tickets from a single text value and searches Jira labels, components, and custom fields.
- **JQL** – Drata uses your Jira Query Language (JQL) string directly.

If Drata doesn’t find any tickets (for example, your JQL returns no results), **Test 26 passes** because there are no failing security tickets to report.

---

### Quick decision: Label vs JQL

**Choose Label if:**

- You want a **simple, low-maintenance** setup.
- You’re comfortable standardizing on **one “security” marker** in Jira (for example, a `security` label).
- You don’t need complex filters (by project, date, severity, etc.).

**Choose JQL if:**

- You already have a **mature Jira workflow** with specific projects, issue types, or custom fields for security.
- You need **fine-grained control** (for example, only open issues, only certain projects, or specific custom fields).
- You can reliably maintain and test JQL in Jira before using it in Drata.

You can switch between **Label** and **JQL** at any time in the Jira connection. Changes take effect on the next Autopilot run (within 24 hours). Existing test evidence is not removed.

---

## Prerequisites

Before configuring Label or JQL:

1. **[Connect Jira to Drata](jira-integration-guide.md)** and confirm the connection is active.
2. Make sure you understand **where security work lives in Jira** (which projects, labels, components, and fields).

---

## How the Drata test uses Jira tickets and fields

Once you configure Label or JQL, Drata:

1. Pulls all Jira tickets that match your **Label** or **JQL** configuration.
2. For each matching ticket, verifies that:
   - An **assignee (owner)** is set.
   - A value is set in the **native Jira Priority** field.

Any ticket in the security set that is **missing an owner or a priority** will **fail the test**. Tickets that meet both conditions pass.

If Drata finds **no security tickets** (because the label/JQL matches nothing), Test 26 passes and reports that no failing security tickets can be found.

---

## Label-based security tickets

Label mode is best when you want a single, easy-to-remember way for teams to flag security issues.

### How Label mode works

When you choose **Label** in the Jira connection and enter a value (for example, `security-ticket`), Drata resolves security tickets in this order:

1. **Labels**:  Finds tickets that have a Jira label exactly matching the string you entered.
2. **Components**:  If no matching labels exist, Drata searches **components** with that name across all projects.
3. **Custom fields**:  If no matching components exist, Drata looks for a **custom field** with that name.

If **no label, component, or custom field** with that name is found:

- Drata treats this as **no security tickets found**, and **Test 26 passes**.

Within the resulting set of security tickets, Drata then checks each issue’s **assignee** and **Priority** field as described above.

### Configure Label in Drata

1. In Drata, go to **Connections → Jira** and edit your Jira connection.
2. Edit the security label under the sources/setup details section.
3. Enter the **exact label string** you will use in Jira (for example, `security-ticket`).
4. Save and update the connection.

### Configure labels/components/fields in Jira

In Jira:

- In each security-related ticket, add the **label** you configured (for example, `security-ticket`), **or**
- Configure a **component** or **custom field** with that exact name and use it consistently on security tickets.

Verify in Jira that:

- All in-scope security tickets are labeled (or use the component/custom field), and
- Tickets have both **assignee** and **Priority** set.

---

## JQL-based security tickets

JQL mode is best when you already use structured Jira data to track security work and need a precise filter.

### How JQL mode works

When you choose **JQL** as the source, Drata:

1. Runs your **JQL** query in Jira to get the list of security tickets.
2. Treats that result set as the **security ticket universe** for Test 26.
3. For each ticket returned, verifies that **assignee** and **Priority** are set.

Important behaviors:

- **Drata does not validate JQL.** If your query is invalid or too restrictive, Drata will simply see zero tickets.
- If the JQL **returns an empty set**, Test 26 passes (no failing security tickets found).

### Configure JQL in Drata

1. In Drata, go to **Connections → Jira** and edit your Jira connection.
2. Under **Source**, select **JQL**.
3. In Jira, first run and validate your JQL (for example, in the Jira search UI) until you are sure it returns **exactly the security tickets you expect**.
4. Copy the **final JQL string** into the **JQL** field in Drata.
5. Select **Update connection**.

Drata requires the JQL query to include a Jira issue type filter. If the query does not use the expected `type` field, you may see an “enter TYPE =” format error

**Common examples:**

- All open security bugs in a project:
   `project = SEC AND type = Bug AND labels = security AND statusCategory != Done`
- Issues with a specific security field set:
   `"Security Category" = "Vulnerability" AND priority in (High, Highest)`

---

## Switching between Label and JQL

You can change the security ticket source at any time:

- Edit the **Jira connection** in Drata.
- Switch **Source** between **Label** and **JQL**.
- Save your changes.

What happens when you switch:

- Drata uses the **new configuration** on the next Autopilot run (within ~24 hours).
- **Existing evidence** from the prior configuration is **not edited or removed**. Future runs will build evidence based on the new source.
- If the new Label/JQL returns a different set of tickets, Test 26 results may change accordingly.

---

## Related articles

- [Jira Integration Guide](jira-integration-guide.md)
- [Test 26: Security Issues are Prioritized](test-26-security-issues-are-prioritized.md)
- [Create and Manage Tickets in Drata](create-and-manage-tickets-in-drata.md)
- [Ticket Automation (Jira-only) (New experience)](ticket-automation-jira-only-new-experience.md)
- [Create and Manage Workspace Tickets](create-and-manage-workspace-tickets.md)
