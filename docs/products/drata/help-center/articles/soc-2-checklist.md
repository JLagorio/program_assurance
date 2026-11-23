# SOC 2 Checklist

Source: https://help.drata.com/en/articles/8168169-soc-2-checklist
Collection: Framework Information › SOC 2 2017
Updated: 2026-08-26
Fetched: 2026-11-22
Description: A checklist for achieving SOC 2 within Drata

## Article text

We recommend completing the following checklist in sequential order as you work towards your SOC 2 audit. The items listed below are applicable after you have successfully connected your systems in Drata.

*For a guided walkthrough of checklist items 4–10, join our live [SOC 2 Checklist Webinar](https://events.zoom.us/ev/ArIM7ylOhHKkPNtLS0nRkNGRiD3MKiRahYee--MzEAshvuWQnOx4~AvYj_CxB5q9SvQtAV2yh24DMU29GFGhSuqtWwO04K0ddYwMsYXD9sLA5dw), where we cover each step, share best practices, and answer questions. *

Checklist:

1. **Policy Management**
   Draft, review, and approve all required [SOC 2 policies](policies-to-framework-summary.md) in the Policies page in Drata.
   1. [Policy Center Help Articles](https://help.drata.com/en/articles/8508194-drata-policy-center)
   2. Your Quick Guide as an additional resource here: [Essential Policy FAQs](essential-policy-faqs-your-quick-guide.md)
2. **Employee Onboarding**
   1. Invite all employees to Drata and ensure they complete the following:
      1. Device compliance
      2. Background check (see: [SOC 2 Background Check FAQs](soc-2-background-checks-faqs.md))
      3. Policy acknowledgement (see: [Policy Acknowledgment Grouping Guide](policy-acknowledge-grouping.md))
      4. Security awareness training
3. **Define Your Trust Services Criteria (TSC)**
   1. Define your applicable Trust Services Criteria.
   2. Reference the [SOC 2 Trust Services Categories Overview](soc-2-trust-services-categories-overview.md) for help.
4. **Complete Risk Management**
   1. [Risk Management Standard Overview](https://help.drata.com/en/articles/9354303-risk-assessment-overview) is a resource designed to streamline the entire process of evaluating and managing risk. It not only helps you learn more about risk assessment but also uses a one-time survey to automatically populate your Risk Register.
   2. [Risk Management Standard Results and Treatment Plan](risk-treatment-plan-guidance.md): Resource that you can use to guide you through Sections 4 and 5
   3. [Risk Management](https://help.drata.com/en/articles/6406513-risk-management-overview): This is an add-on feature in Drata to allow you to track Risks within the platform, if you are interested, please reach out to your account manager.
5. **Download the Risk Management Report **(and Risk Treatment document for Risk Management Module) fill in the relevant sections and upload to:
   1. DCF-16: Annual Risk Assessment
   2. DCF-17: Remediation Plan
      1. If you’ve documented your remediation plan separately, please upload a copy as evidence in DCF-17
6. **Monitoring Tests**
   1. Work toward 100% completion of Monitoring Tests.
      *Helpful Tip: Use the “Learn More” button on each test for help articles and remediation guidance.*
7. **Evidence for Not Monitored Controls**
   1. Upload supporting evidence for controls that are not automatically monitored.
      1. Reference the [Example Evidence for Not Monitored Controls for SOC 2](example-evidence-for-not-monitored-controls-soc-2.md) guide.
   *[Important Note: Some controls may appear as “ready” because they’re linked to an approved policy, but they still require additional evidence to be fully complete. Use the link below to help guide you through the next steps.]*
   **Common DCFs that will *appear ready but will need additional evidence***
   ([Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)):
   1. ***Risk Assessments (DCF-16 and DCF-17)*:** The required risk assessment reports have been successfully downloaded and attached.
   2. ***Vulnerability Scan Results (DCF-18):*** A copy of the most recent vulnerability scan results needs to be uploaded.
   3. ***Penetration Test (DCF-19):*** The results of the annual penetration test are required to be uploaded.
   4. ***Architecture Diagram (DCF-21):*** Please provide a copy of the system architecture diagram.
   5. ***Network Diagram (DCF-22)*: **A copy of the network diagram should be attached.
   6. ***Business Continuity/Disaster Recovery (BC/DR) Test (DCF-26):*** Please attach the organization's Business Continuity and Disaster Recovery plan.
   7. ***Tabletop Exercise/Incident Response (DCF-154): ***Documentation from the most recent tabletop or incident response exercise should be attached.
   *For SOC 2 Type 1:* Ensure all control evidence is uploaded and complete before your audit date, as the audit assesses your environment at a single point in time.
   *For SOC 2 Type 2*: Evidence should show that your controls were working during the observation period. You can usually upload it during or after that time, but check with your auditor to confirm what they expect.
8. **Vendor Management**
   1. Add all Key Vendors to your [Vendors module](https://app.drata.com/risk/vendors) (see: [How to Determine Key Vendors in Drata](how-to-determine-key-vendors-to-include-in-drata.md)).
   2. Review vendor compliance documentation:
      1. If a vendor has a SOC 2 report, follow the [Reviewing Your Vendors' SOC 2 Reports guide.](reviewing-your-vendors-soc-2-reports-using-drata.md)
      2. If a vendor provides an ISO 27001 certificate instead, use the[ISO 27001 Review Template](iso-27001-certification-review-template.md).
      3. If no reports are available, send the [Vendor Security Questionnaire.
         ](https://help.drata.com/en/articles/5741004-build-vendor-questionnaire)
9. **Auditor Selection**
   1. Select your SOC 2 Auditor from [Drata’s Auditor Directory](https://drata.com/auditor/directory).
   2. Use our guide on [Questions to Ask a Potential SOC 2 Auditor](questions-to-ask-a-potential-soc-2-auditor.md) during interviews.
   3. If you would like for our Audit Alliance team to help match you with an auditor, please fill out this form: [Auditor Match](https://drata.com/partners/audit-alliance/directory).
   ***[Important Note: You can engage at any point with an auditor and is a step we recommend as most scoping and control-specific questions can be answered by the auditor.]***
   *Optional: Ask your auditor about a Readiness Assessment. This optional, separate service reviews your controls and identifies gaps before the formal audit. It’s typically billed separately and helps ensure you’re fully prepared. Check with your auditor for details and pricing.*
10. **Audit Logistics**
   1. Select your official audit date.
   2. Reach out to your Manager to schedule a Pre-Audit Check-in.
   3. Set up your [Audit Hub](https://help.drata.com/en/articles/8438218-drata-audit-hub-overview) and invite your auditor.
   4. Complete your SOC 2 audit.
   5. Update your Manager.

## Related articles

- [SOC 2: All controls](soc-2-all-controls.md)
- [Example Evidence for Not Monitored Controls (SOC 2)](example-evidence-for-not-monitored-controls-soc-2.md)
- [What Is a SOC 2 Bridge Letter? [+ Template]](what-is-a-soc-2-bridge-letter-template.md)
- [Pre-Audit Checklist: How to Prepare for Your Audit with Drata](pre-audit-checklist-how-to-prepare-for-your-audit-with-drata.md)
- [SOC 2 Express Webinar Recording](soc-2-express-webinar-recording.md)
