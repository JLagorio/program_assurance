# Terms of Service Guidance: DCF-63 and DCF-66

Source: https://help.drata.com/en/articles/7257698-terms-of-service-guidance-dcf-63-and-dcf-66
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

**Background:**

When creating an account to use products or services, users are typically required to agree to a set of terms and conditions before they can proceed. These terms and conditions are known as the **Terms of Service (ToS). **The ToS outlines the rules and guidelines that you are expected to follow when using the service.

**What are the Terms of Service for?**

This is to protect both the service provider and the user by setting expectations, obligations, and responsibilities for both parties. This serves as a legal agreement between the two parties involved and we highly advise you to consult with your legal counsel when creating this document.

**What evidence should I provide for the control DCF-63?**

This control refers to the Terms of Service that new users of your product need to accept prior to them being able to create their account and/or use the product/service you offer. Providing evidence for **DCF-63** will ultimately depend on the organization’s business model:

- **Business-to-consumer (B2C)** - If your company is providing services directly to consumers, then you would need to have individual users to accept a Terms of Service or End User License Agreement upon their account creation. This could be as simple as providing a screenshot of a checkbox that they accept a Terms of Service or End User License Agreement when creating their accounts.
- **Business-to-business (B2B)** - If your company is providing services directly to other businesses, it is not required that individual users accept the terms of service. You can either mark this out of scope OR upload a copy of the contract you have in place with your customer (such as Master Service Agreement, Terms of Use, Service Agreement, Statement of Work, etc.). The terms acceptance can happen at the company level rather than each individual user.

**What evidence should I provide for the control DCF-66?**

This control refers to making sure that Terms of Service that details the company’s security and availability commitments are available to external users and internal employees. The automated test associated with this control verifies if you have provided a URL for your Terms of Use in the Terms of Use URL field in your Company page. For more information regarding the automated test, please refer to [Test: Terms of Use Publicly Available](test-85-terms-of-use-publicly-available.md)

In cases where Terms of Service are not applicable, a copy of the contract template you have in place with your customer (such as Master Service Agreement, Terms of Service, Service Agreement, Statement of Work, etc.) would be sufficient.

We suggest that for this case, you disable the monitored test “Terms of Service Publicly Available” (Test-85) and upload the contract provided to companies. Please refer to this document as guidance on [How to Disable Test](https://help.drata.com/en/articles/7060938-how-to-disable-a-test).

## Related articles

- [Example Evidence for Not Monitored Controls (HIPAA)](example-evidence-for-not-monitored-controls-hipaa.md)
- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [Understand the Difference: Terms of Service (DCF-63) vs. Master Service Agreements (DCF-66)](understand-the-difference-terms-of-service-dcf-63-vs-master-service-agreements-dcf-66.md)
- [Organization settings: Organization Details (New Experience)](organization-settings-organization-details-new-experience.md)
- [How to provide evidence for DCF-72: Root access control](how-to-provide-evidence-for-dcf-72-root-access-control.md)
