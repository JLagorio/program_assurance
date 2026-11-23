# NIST SP 800-171 Rev. 2 Self-Assessment

Source: https://help.drata.com/en/articles/14724964-nist-sp-800-171-rev-2-self-assessment
Collection: Framework Information › NIST SP 800-171 Rev. 2
Updated: 2026-04-22
Fetched: 2026-11-22

## Article text

This article guides you through using Drata’s NIST SP 800-171 Rev. 2 framework to plan, execute, and document an internal self-assessment. This process helps you centralize evidence and prepare for Supplier Performance Risk System (SPRS) reporting.

> **⚠️ Important Disclaimer**
>
> Drata helps you organize and track compliance activities, but it does not calculate or submit an official SPRS score. You remain responsible for applying the DoD Assessment Methodology, entering your final results into the SPRS portal, and interpreting contractual and regulatory requirements for your environment.
>
> This article is for general information only and is not legal, regulatory, or contractual advice.

## Before You Begin

1. **Confirm Contractual Requirements**
   - Verify that your contracts (for example, DFARS 252.204-7012, 252.204-7020, or 252.204-7021 clauses) require NIST SP 800-171 Rev. 2, and check for any specific self-assessment or scoring deadlines.
2. **Review Official Guidance**
   - Familiarize yourself with [NIST SP 800-171A](https://csrc.nist.gov/publications/detail/sp/800-171a/final), which provides the specific assessment procedures (examine, interview, test) for each requirement.
   - These procedures align with the Assessment Objectives you see in Drata for each requirement.
3. **Enable the Framework**
   - Ensure the NIST SP 800-171 Rev. 2 framework is active in your Drata account.
   - This includes:
      - 110 NIST SP 800-171 Rev. 2 requirements
      - 195 mapped Drata Control Framework (DCF) controls
      - 22 policy templates
      - Assessment Objectives based on NIST SP 800-171A

These mappings and Assessment Objectives help you organize evidence, but they do not replace your responsibility to interpret NIST SP 800-171 requirements for your specific CUI environment.

## Step 1: Review Requirements & Scope

Navigate to the **Frameworks** page and select **NIST SP 800-171 Rev. 2**. Ensure you are on the correct tab: **Available for your company**.

- **Understand the Mapping:** Review the requirement descriptions and their mapped DCF controls.
- **Define Scope:** Confirm which systems, locations, and third-party services that store, process, or transmit CUI are in scope for Controlled Unclassified Information (CUI).
- **Consult the Objectives:** Use the **Assessment Objectives** column (derived from NIST SP 800-171A) to understand exactly what evidence you need. You should be able to point to at least one piece of evidence for each objective.

Treat requirements as **Out of Scope** only when you can clearly demonstrate that they do not apply to any system in your defined CUI boundary.

## Step 2: Set Requirement Status

Document your internal readiness by updating the status of each requirement:

- **Ready:** Implementation is complete, ownership is assigned, and evidence is available. Requirements marked **Ready** are typically treated as **Met** when you later apply the DoD scoring methodology.
- **In Progress:** Gaps exist, or remediation is currently underway. Requirements marked **In Progress** are usually treated as **Not Met** for scoring purposes until implementation is complete.
- **Out of Scope:** The requirement does not apply (for example, you do not use specific system types). Use **Out of Scope** sparingly and always document why the requirement does not apply to any in-scope CUI system.

Note: You must document your rationale for any **Out of Scope** marks for future audits.

## Step 3: Collect and Link Evidence

For each requirement and its mapped DCF controls, provide evidence that addresses each Assessment Objective.

- **Automated Evidence:** Ensure your integrations (cloud service providers, identity providers, etc.) are connected. Drata will automatically collect evidence for passing tests. Ensure the integrations you connect cover the systems included in your CUI boundary.
- **Manual Evidence:** For non-automated controls, upload documentation such as:
   - System Security Plan (SSP) and Plan of Action and Milestones (POA&M) that describe your current implementation status and planned remediation.
   - Screenshots of configurations or ticketing logs.
   - Training records and management approvals.

You can navigate to the **Evidence** page and filter by the framework to verify which evidence is needed.

## Step 4: Identify and Remediate Gaps

Use the Drata Dashboard to visualize your progress.

1. **Prioritize:** Focus on high-impact areas like Access Control and System and Communications Protection.
2. **Assign Tasks:** Use Drata's task management to assign remediation steps to owners.
3. **Update Status:** As gaps are closed and evidence is uploaded, move requirements from **In Progress** to **Ready**.

If a gap will not be fully remediated before your planned assessment date, record it in your POA&M and expect that requirement to be treated as **Not Met** in your DoD score until remediation is complete.

## Step 5: Export Your Control Status Report

Once your internal review is complete, generate a record of your assessment.

- From the framework view, click **Export**.
- This report provides a requirement-by-requirement snapshot of your linked controls, policies, and ownership.

Use this export as your internal record and as input to your DoD scoring worksheet; it does not replace the official DoD assessment documentation or SPRS entry.

## Step 6: Align with DoD Scoring (SPRS)

Drata organizes your data, but you must manually translate this into the DoD Assessment Methodology.

1. **Determine Score Points:** For each of the 110 requirements, determine whether it is fully implemented or not yet implemented for scoring purposes.
2. **Apply Weighted Scoring:** Apply the DoD’s scoring model, which starts from a maximum score and deducts 1, 3, or 5 points for each requirement that is not fully implemented, according to the DoD Assessment Methodology.
3. **Document Plans of Action (POA&M):** For any requirement not fully implemented, document a POA&M and remediation timeline. These requirements are still scored as **Not Met** and continue to incur point deductions until they are fully implemented.
4. **Submit to SPRS:** Log in to the [SPRS portal](https://www.sprs.csd.disa.mil/) and enter your score and assessment date.

Retain your Drata export, SSP, POA&M, and DoD scoring worksheet as evidence of your assessment in case of DoD review.

## Related articles

- [Frameworks](frameworks.md)
- [NIST SP 800-53 (Rev. 5) Control & Policy Mapping Updates](nist-sp-800-53-rev-5-control-policy-mapping-updates.md)
- [NIST SP 800-171 Rev. 2  Framework Updates](nist-sp-800-171-rev-2-framework-updates.md)
- [Example Evidence for Not Monitored Controls (NIST 800-171 Rev 3)](example-evidence-for-not-monitored-controls-nist-800-171-rev-3.md)
- [Control Mapping Updates for Policies - 10/17/2025](control-mapping-updates-for-policies-10-17-2025.md)
