# Managing Policies Synced from Confluence in Drata

Source: https://help.drata.com/en/articles/12111728-managing-policies-synced-from-confluence-in-drata
Collection: Understand the Drata Platform › Policies
Updated: 2025-08-28
Fetched: 2026-11-22

## Article text

Drata syncs policies directly from Confluence to ensure alignment between your source documentation and compliance automation. Policies sourced from Confluence cannot be managed directly within Drata—any changes must be made in Confluence. This article explains how synchronization works, what actions are restricted in Drata, and best practices for managing Confluence-linked policies.

## Policy Synchronization Behavior

- Drata automatically syncs policies from your connected Confluence space.
- Drata reflects the latest content and metadata but does **not** serve as the source of truth.
- Editing, publishing, approving, merging, deleting, or archiving policies must be done in Confluence.

**Note**: Drata templates may be restored to re-link policies to controls and tests, but the content always comes from Confluence.

## Deletion and Archiving Limitations

- **Policies synced from Confluence cannot be deleted or archived in Drata.**
- To remove a policy from Drata, permanently delete it in Confluence.
- Archiving a policy in Confluence does **not** remove it from Drata. It must be deleted entirely in Confluence.

**Synchronization Integrity**

- Drata restricts editing or removal actions on synced policies to avoid breaking sync.
- The platform reflects all updates made in Confluence automatically during sync cycles.

## Best Practices

To manage Confluence-synced policies effectively:

- **Make all edits, deletions, merges, and archives in Confluence**, not Drata.
- **Permanently delete policies in Confluence** if they should no longer appear in Drata.
- **Do not archive policies** in Confluence if you intend to remove them—archive status will not remove the policy from Drata.
- **Regularly sync Confluence with Drata** to ensure policy content and compliance mappings stay current.

## Related articles

- [Confluence Integration Guide](confluence-integration-guide.md)
- [Create a policy](create-a-policy.md)
- [Delete a Policy Draft](delete-a-policy-draft.md)
- [External Policy: Use Confluence or Notion to manage your policies](external-policy-use-confluence-or-notion-to-manage-your-policies.md)
- [Troubleshooting Identity Sync Issues in Drata](troubleshooting-identity-sync-issues-in-drata.md)
