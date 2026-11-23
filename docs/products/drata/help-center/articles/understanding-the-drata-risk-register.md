# Understanding the Drata Risk Register

Source: https://help.drata.com/en/articles/11690245-understanding-the-drata-risk-register
Collection: Understand the Drata Platform › Risk
Updated: 2026-06-16
Fetched: 2026-11-22
Description: Navigate Your Risk Landscape: Explore Drata's Risk Register Headers

## Article text

Drata's **Risk Assessment** module helps you identify, evaluate, and manage potential threats to your organization.

This article breaks down what each column in the **Risk Register** table means, giving you a clear understanding of your risk landscape.

### Risk Library Overview

First and foremost, Drata's **Risk Library** is a valuable resource, pre-loaded with over 200 risks based on industry standards like NIST SP 800-30, ISO 27005, and OCR SRA. While this library covers a wide range of common risks, you can always add **custom risks** to your Risk Register to address your organization's unique concerns. You can add any of Drata's library risks to your register.

The Risk Register table includes the following columns, which provide visibility into each risk’s status, ownership, and severity.

**Risk Register Columns**

- **Risk ID**: This is the unique **Drata Risk ID**. For risks pulled directly from Drata's library, this ID is **non-editable**.

- **Name**: This is the specific **name** of the risk.

- **Description**: This section provides a detailed **description** of the risk and its potential implications.

- **Controls**: This header displays the **Drata Control Framework (DCF) controls** mapped to the specific risk. You can link or unlink DCF controls to risks from here. The colors indicate the control's status:
   - **Green**: The control is **available and ready**.
   - **Red**: The control is **not ready**.
   - **Gray**: The control is **Out of Scope**.

- **Treatment**: This header describes the **strategy or plan** for addressing the risk.
   - **Untreated: **Indicates that the risk has been identified but no treatment has been selected. Untreated risks should be reviewed and assigned a treatment as part of ongoing risk management.
   - **Accept:**  For some processes and activities, there is no option but to accept the risk. Of course, these instances should only involve low risk, or repercussions that are easily managed. Some risks might be completely acceptable and require you to take no action at all (a missed deadline on an open-ended project schedule, for instance).
   - **Transfer:** In many instances, you can transfer the risk you take to another party. For instance, insurance companies exist for exactly this reason. You can also outsource the process in which the risk is present to another provider, thereby transferring the risk to the outsource provider.
   - **Avoid: **If a risk is deemed too high, then you simply avoid the activity that creates the risk. For instance, if flying in an airplane is too risky, you avoid taking the flight in the first place, and completely avoid the risk. Another example would be hiring an individual whose references would not recommend rehiring him — by not hiring him, you avoid the risk that he would not be an asset to your company.
   - **Mitigate (Reduce):**  Risk reduction is one of the most crucial steps for processes or activities that cannot be avoided, and where risk cannot be transferred to another party. An example of this would be training your staff on how to identify a phishing email, or on best practices involving login credentials and password hygiene.
- **Inherent Impact**: This represents the **potential severity of the risk** before any controls or mitigation efforts are applied.

- **Inherent Likelihood**: This indicates the **probability of the risk occurring** before any controls or mitigation efforts are applied.

- **Inherent Score**: This is the **calculated risk score** before any controls are in place, typically derived from the Inherent Impact and Inherent Likelihood.

- **Residual Impact**: This represents the **potential severity of the risk** *after* controls and mitigation efforts have been applied.

- **Residual Likelihood**: This indicates the **probability of the risk occurring** *after* controls and mitigation efforts have been applied.

- **Residual Score**: This is the **calculated risk score** *after* controls are in place, typically derived from the Residual Impact and Residual Likelihood.
- **Owner**: This field designates the **individual(s) responsible** for managing and overseeing the risk. You can add multiple owners to a single risk.
- **Type**: This defines whether the risk is **internal or external** to your organization.

- **Status**: This indicates the current **status of the risk**, whether it is **active or closed**.
- **Categories**: Risks are organized by **categories** such as Asset Management, Access Control, and Assessments & Audits.
   - You can assign or remove categories for each risk.
   - To untag a category from a specific risk: Click the "X" icon next to it.
   - To delete a category entirely from your risk register: Click the recycle bin icon next to the category name in the dropdown.

- **Anticipated Completion Date**: This is the **projected date** by which the risk treatment or mitigation efforts are expected to be completed.

- **Completed Date**: This is the **actual date** when the risk treatment or mitigation efforts were finalized.

- **Reviewers**: This lists the individuals involved in **reviewing** the risk and its associated information.

> 🎓 **Want to learn more?** Dive deeper into this topic and see it in action! Check out our dedicated Risks course over at the **[Drata Academy](https://academy.drata.com/risks-vendor-management)**.

## Related articles

- [Getting started with a risk assessment (Concept Guide)](getting-started-with-a-risk-assessment-concept-guide.md)
- [Import Risk in Bulk (New Experience)](import-risk-in-bulk-new-experience.md)
- [Risk management in Drata: An overview](risk-management-in-drata-an-overview.md)
- [Assess and Manage Individual Risks](assess-and-manage-individual-risks.md)
- [Risk Management Training Videos (New Experience)](risk-management-training-videos-new-experience.md)
