# External Policy: Use Confluence or Notion to manage your policies

Source: https://help.drata.com/en/articles/13553508-external-policy-use-confluence-or-notion-to-manage-your-policies
Collection: Understand the Drata Platform › Policies
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Use this workflow if your organization manages policy content in Confluence or Notion and uses Drata as the system of record for audit evidence and control mapping.

## Article text

When you use Confluence or Notion as your external policy manager:

- Policy content is authored and edited in **Confluence or Notion**
- Drata stores a **read-only PDF copy** for audit purposes
- Policy metadata (title, owner, personnel groups) is managed in Drata
- Acknowledgment behavior follows **Drata-managed policy rules**, not external acknowledgment
- You must manually sync or re-import changes made externally

## Prerequisites

- Confluence **or** Notion is connected to Drata.
- Only **one external policy connection** can be active at a time

### Important limitations

- Changes made in Confluence or Notion are **not automatically synced**. You must sync or re-import the policy in Drata.
- Confluence exports policies in **HTML format only**, which may cause formatting differences when converted to PDF. Review imported files in Drata.
- Notion policies **cannot include database blocks or attachments**.

## Import a policy from Confluence or Notion

When you import a policy, Drata converts the file to a **read-only PDF** to ensure consistency and audit readiness.

1. Open Policies
2. Select **Import policy**.
3. Enter the policy details: Policy name, Policy owner, Personnel groups
4. Confirm your selection.

## Edit policy

To update policy content:

1. Make changes in **Confluence or Notion**.
2. Sync or re-import the updated file into Drata.

To update a policy linked to Confluence or Notion:

- If you edited the policy in the external system, select **Actions → Sync changes** to pull the latest version.
- If you want to replace the file entirely, select **Actions → Import file**.

---

## Behavior when the connection is disconnected

If the Confluence or Notion connection is disconnected, policies continue to appear in the Policy Center. When the connection is restored and no changes were made while disconnected, Drata retains the reference to the original external file and Import and Sync actions become available again.

## Related articles

- [Confluence Integration Guide](confluence-integration-guide.md)
- [Managing Policies Synced from Confluence in Drata](managing-policies-synced-from-confluence-in-drata.md)
- [Policy Center Overview](policy-center-overview.md)
- [Create a policy](create-a-policy.md)
- [External Policy: Use BambooHR to manage your policies](external-policy-use-bamboohr-to-manage-your-policies.md)
