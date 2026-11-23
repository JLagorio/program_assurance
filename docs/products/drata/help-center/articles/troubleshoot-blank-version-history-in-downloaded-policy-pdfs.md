# Troubleshoot Blank Version History in Downloaded Policy PDFs

Source: https://help.drata.com/en/articles/16045126-troubleshoot-blank-version-history-in-downloaded-policy-pdfs
Collection: Understand the Drata Platform › Policies
Updated: 2026-07-22
Fetched: 2026-11-22
Description: This article applies when an existing published policy downloads with a blank version history table.

## Article text

If a downloaded policy PDF shows a blank version history table, you can re-publish the affected policy to regenerate the version history in the downloaded PDF.

## How to resolve it

1. Go to Governance > Policies.
2. Open the affected published policy.
3. Select Edit policy.
4. Finalize the draft. You do not need to make any content changes. Entering edit mode and finalizing the draft is enough to continue the republish flow.
5. When prompted to classify the update, choose the option that best fits your workflow:
   - Material Changes starts a new approval workflow before the policy is published again.
   - Non-Material Changes lets you publish a new subversion without requiring additional approvals, unless you choose to require approvals later in the publish flow.
6. Complete the publish flow.
7. Download the published policy PDF again.

After the policy is re-published, the downloaded PDF should display the version history table as expected. If this issue does not occur on a newly published or newly re-published policy, this article may not apply to your policy.

## Related articles

- [Essential Policy FAQs: Your Quick Guide](essential-policy-faqs-your-quick-guide.md)
- [Policy Center Overview](policy-center-overview.md)
- [View and edit a policy](view-and-edit-a-policy.md)
- [Download your Policies](download-your-policies.md)
- [Compare Policy Versions with AI](compare-policy-versions-with-ai.md)
