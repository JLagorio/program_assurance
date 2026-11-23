# Configure Policies to Support Compliance Test Completion in Drata

Source: https://help.drata.com/en/articles/12111934-configure-policies-to-support-compliance-test-completion-in-drata
Collection: Understand the Drata Platform › Policies
Updated: 2025-11-26
Fetched: 2026-11-22

## Article text

Compliance tests in Drata, such as those tied to the Formal Code of Conduct or other policy-specific controls, depend on correctly configured policies. Users can employ built-in Drata templates or their custom policies. Improper handling of archived, replaced, or custom policies can lead to test failures. This guide explains why such failures occur and provides actionable steps to resolve them.

### Common Causes of Compliance Test Failures

1. **Archived or Replaced Policies**: If a required Drata policy template is archived without a proper replacement, tests relying on that policy will fail. For instance, archiving a Code of Conduct policy without proper replacement might trigger test failures.
2. **Unpublished Custom Policies**: Custom policies not replacing the original Drata templates correctly in the system can break the linkage necessary for passing compliance tests.
3. **Default Policy Mapping Errors**: Tests may fail when a custom policy, intended to replace a default one, is incorrectly previewed or mapped. Automated tests may display a failure message, such as "This policy doesn’t exist," even if a custom policy is already published and linked in the Policy Center. This typically happens when the automated test references an archived Drata template policy that was not properly replaced with a custom policy.

### Steps to Resolve Policy-Related Test Failures

#### Restoring Archived Policies

1. Navigate to the "Archived Policies" section within the Drata dashboard.
2. Locate the required original template policies.
3. Restore the policies and ensure they are published. Before restoration, temporarily disable any monitoring tests tied to the archived policy to avoid disruptions during the process.
4. If needed, re-run the affected tests to verify resolution.

#### Replacing Default Policies with Custom Ones

If you want to use custom policies instead of the Drata templates:

1. Ensure the custom policy replaces the default template in the system.
2. Access the "Policies Replaced" feature to confirm the replacement.
3. Publish the custom policy once replacement is configured.
4. Re-run compliance tests linked to the updated policy.

#### Mapping and Updating Policies

1. Align your custom policy to match the compliance requirements of Drata's templated policies.
2. As an alternative, revert to the built-in Drata policies where custom policies cannot be accommodated.
3. For guidance, refer to Drata's detailed articles, such as [Create and Replace a Policy with Your Custom Policy](https://help.drata.com/en/articles/6219781-create-and-replace-a-policy-with-your-custom-policy).

## Related articles

- [Compliance Program Migration Best Practices](compliance-program-migration-best-practices.md)
- [Managing Policies Synced from Confluence in Drata](managing-policies-synced-from-confluence-in-drata.md)
- [Create a policy](create-a-policy.md)
- [Archive and restore policies](archive-and-restore-policies.md)
- [Policy Management in Drata Training Video (New Experience)](policy-management-in-drata-training-video-new-experience.md)
