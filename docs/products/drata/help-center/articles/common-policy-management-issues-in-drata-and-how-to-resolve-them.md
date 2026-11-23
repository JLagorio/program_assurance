# Common Policy Management Issues in Drata (and How to Resolve Them)

Source: https://help.drata.com/en/articles/13252508-common-policy-management-issues-in-drata-and-how-to-resolve-them
Collection: Understand the Drata Platform › Policies
Updated: 2026-05-27
Fetched: 2026-11-22

## Article text

Effective policy management in Drata is essential for maintaining audit readiness and smooth compliance workflows. This article outlines common issues customers encounter when creating, editing, publishing, and using policies for compliance.

---

### Policy Creation: “Create” Option Is Missing

**Symptoms: **You have admin-level access, but the **Create** option does not appear on your Policies page.

**Cause: **An external policy management integration (such as **Confluence**) is connected to your Drata account. When an external policy manager is enabled, policy creation within Drata is disabled to prevent duplication and version conflicts.

**Resolution**

1. Temporarily disconnect the external policy manager.
2. Refresh or re-open your Policies page in Drata.
3. Confirm that the **Create** option is now available.

---

### Policy Editing: Guest Administrator Cannot Edit Policies

**Symptoms: **A Guest Administrator cannot edit a policy, even after access has been granted.

**Common Causes: **Guest Administrator permissions can take up to **one hour** to fully apply.

**Resolution: **Allow up to one hour after assigning Guest Administrator access for permissions to take effect.

---

### Policy Publishing: “Publish” Option Is Missing

**Symptoms:** A policy has been approved, but you do not see the option to publish it.

**Cause: **Only the **Policy Owner** can publish a policy. If you are not the owner, publishing actions are restricted.

### Resolution

1. Identify the current policy owner.
2. Request that ownership be transferred to your account, if needed.
3. Once ownership is updated, publish the policy.

---

### Policy Compliance: Policies Do Not Satisfy Controls on Their Own

Publishing a policy does **not automatically satisfy audit controls**. Policies define expectations, but auditors require evidence that those processes are actively followed.

**What’s Required:**

- A relevant policy (for example, a **System Access Control Policy**).
- Supporting process evidence, such as:
   - Access request and approval records
   - Onboarding and offboarding checklists
   - Tickets, logs, or activity records

**How to Satisfy Control Requirements:**

1. Link the relevant policy to the appropriate control.
2. Upload supporting evidence that demonstrates the policy is being followed in practice.

---

### Summary

Most policy-related issues in Drata stem from permissions, ownership, integrations, or the distinction between documentation and operational evidence. By understanding how policies interact with controls, approval workflows, and audit tests, you can resolve issues quickly and maintain consistent audit readiness.

If issues persist or you encounter edge cases, consult the **Drata Help Center** or contact **Drata Support** for assistance.

## Related articles

- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [Manage and Configure Policy Controls in Drata](manage-and-configure-policy-controls-in-drata.md)
- [External Policy: Use BambooHR to manage your policies](external-policy-use-bamboohr-to-manage-your-policies.md)
- [Manage tasks in Drata](manage-tasks-in-drata.md)
- [Section 5: Policy Owners](section-5-policy-owners.md)
