# Add guest administrators with a different domain

Source: https://help.drata.com/en/articles/12889081-add-guest-administrators-with-a-different-domain
Collection: Settings › Role Administration
Updated: 2026-07-27
Fetched: 2026-11-22

## Article text

Adding guest administrators in Drata sometimes requires domain-specific configurations to ensure security and compliance. If you've encountered issues such as unverified domains while trying to assign guest administrator access, the following steps provide a clear path to resolve the issue.

When adding a guest admin with a different domain that Drata does not recognize, you may run into the following scenarios:

1. **Error Message About Unverified Domains:** You might receive an error indicating that the domain associated with the email address is not verified.
2. **Inability to Complete the Addition Process:** When attempting to finalize the setup, the system may prevent the addition of these users if their domain is not approved in Drata's system. Reach out to the Customer Support team to have the domain approved.
3. **Different domain requirement: **Guest administrators must use a work email address on an approved domain that is different from your Drata tenant’s domain, because guest administrators are intended for external users.

Follow these steps to resolve any domain-related issues when setting up guest administrators:

1. **Verify the Domain Status: **Check if the domain associated with the guest’s email address has been pre-approved in Drata. If you’re uncertain, contact your Drata administrator or use the Drata platform to view the list of existing approved domains.
2. **Submit a Request for Domain Approval:** If the domain is unverified, reach out to Drata Support to request its approval. Provide details about your organization and explain the need for granting access to these specific users.
3. **Add the User After Domain Approval:** Once the domain is approved by Drata’s support team, proceed to add the guest administrator. In most cases, issues will be resolved after this step.

If you continue to experience issues after verifying domains and following the above steps, contacting Drata Support is recommended. Provide relevant details, including the affected email addresses and the organization name, to expedite assistance.

### FAQs for Special Cases

#### Can I add a guest administrator with a personal email address?

No, Drata does not permit guest administrators to use personal email addresses. Only users with work email addresses on approved domains can be added.

#### How long does it take to approve a domain?

The time to approve a domain may vary. Contact Drata Support for an estimated timeline.

## Related articles

- [Drata Agent not reporting system updates](drata-agent-not-reporting-system-updates.md)
- [Your Drata Domain](your-drata-domain.md)
- [Integrate Multiple Identity and HRIS Connections](integrate-multiple-identity-and-hris-connections.md)
- [Manage guest administrators](manage-guest-administrators.md)
- [Multi-Domain Support](multi-domain-support.md)
