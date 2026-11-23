# How to Determine Key Vendors to include in Drata?

Source: https://help.drata.com/en/articles/6008277-how-to-determine-key-vendors-to-include-in-drata
Collection: GRC Best Practices › Risk
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Determine key vendor or vendors to include in Drata

## Article text

Determining which vendors are considered “key” vendors is a critical step in preparing for your audit. Your key vendors are vendors that you have implemented additional monitoring on throughout the vendor management lifecycle. The most common method for implementing this monitoring is to review each key vendor’s compliance reports, which can be SOC 2 Type 2 reports or other independent audit reports or certifications as appropriate. To determine whether a given vendor is considered a key vendor, ask yourself the following questions:

- Does this vendor receive, access, transmit, or store customer data?
- Does this vendor have responsibility for managing or securing your infrastructure or source code?
- Does this vendor provide cloud services that impact the security or availability of the system being audited?
- Would it significantly impact the availability of the services you are providing if this vendor’s services were unavailable?

If you answered yes to any of these questions, then your vendor will be considered a key vendor for your SOC 2 report. Within the Drata platform’s Vendors tab, you should list “Yes” in the “Vendor is Critical” field of the vendor’s entry. Even though the vendor is now listed as critical, this does not mean that the vendor needs to be listed as “HIGH” in the “Customer Security Inherent risk” field. A vendor may still be critical without being a high risk to security, such as vendors that affect the availability of the system being audited.

After identifying all of your key vendors, you will need to implement appropriate monitoring procedures to ensure that your vendors have implemented appropriate security measures to protect their systems and any data you have entrusted to them. This monitoring usually takes the form of reviewing the SOC 2 Type 2 reports of those vendors on an annual basis.

### What to Do if Your Vendor Does Not Have a SOC 2 Type 2 Report

While a SOC 2 Type 2 report is the preferred report for vendor monitoring due to its depth, which includes specific controls implemented and the results of the auditor’s testing for control design and operating effectiveness, not all vendors will have one available.

If your vendor is newer, they might only have a SOC 2 Type 1 report available, or no SOC 2 report at all. For vendors that only have a SOC 2 Type 1 report, review the report, which only covers the design of security controls, and ask the vendor if they are working toward a SOC 2 Type 2 report. If the vendor is working toward a SOC 2 Type 2 report, it shows that they are taking security seriously and are confident in their controls’ effectiveness. If the vendor is not working toward a SOC 2 Type 2 report, ask them why. In either case, make a business decision about whether the information in the SOC 2 Type 1 report is sufficient and, if not, determine what other information you can request to gain comfort over the vendor’s control environment.

If your vendor does not have any type of SOC 2 report but has other independent audit reports available, these can be used instead of a SOC 2 Type 2 report if the audit scope is appropriate for your needs. For example, if your vendor has an ISO 27001 certification, ask about the scope of their Information Security Management System (ISMS). Other possible certifications include CSA STAR Level 2, FedRAMP authorization, and HITRUST levels 2 and 3, depending on the vendor’s specific service.

If your vendor does not have any independent audit reports or certifications, you may decide to use a security questionnaire to evaluate them. You can use the standard questionnaire provided in Drata, obtain one from an outside provider, or develop your own. Keep in mind that security questionnaires are self-assessments, and vendors can respond without independent validation, making them unsuitable for some situations.

Finally, if your vendor only provides a SOC 3 report, you may still use it for monitoring. A SOC 3 report is a publicly distributable version of a SOC 2 Type 2 report with less detail. Some vendors only provide SOC 3 reports to free-tier customers. If your vendor limits SOC 2 Type 2 report access to certain usage tiers, you are not required to upgrade your service to obtain it.

## Related articles

- [Reviewing Your Vendors' SOC 2 Reports Using Drata](reviewing-your-vendors-soc-2-reports-using-drata.md)
- [SOC 2 Checklist](soc-2-checklist.md)
- [Integrate Zip with Drata Vendor Management](integrate-zip-with-drata-vendor-management.md)
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [Hosted Technology Vendors: What to Collect and How Drata Can Help](hosted-technology-vendors-what-to-collect-and-how-drata-can-help.md)
