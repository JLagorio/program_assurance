# Framework Requirements

Source: https://help.drata.com/en/articles/6219885-framework-requirements
Collection: Framework Information › General
Updated: 2026-08-05
Fetched: 2026-11-22
Description: View and manage a framework's requirements.

## Article text

### HERE'S WHY

In order to achieve and maintain compliance for each enabled framework, you need full visibility into the framework's requirements.

### BEFORE DIVING IN

Administrators, information security leads, and workspace managers have access to this section within Drata.

### HERE'S HOW

Each framework page provides high-level and detailed information about that framework, including overall framework readiness, a comprehensive list of requirements (and mapped controls as applicable), and a detailed description of each requirement.

A summary dashboard at the top of the page highlights key data points and is determined by the readiness toggle setting on the Frameworks page. In addition to the framework description, you’ll also see the following highlights:

- The overall readiness percentage of that framework – based on either Controls or Requirements (as dictated by the toggle)
- If calculating readiness by Controls:
   - Number of in scope controls that are not ready
   - Number of in scope controls that are ready
   - Total number of in scope requirements
- If calculating readiness by Requirements:
   - Number of in scope requirements that are not ready
   - Number of in scope requirements that are ready
   - Number of in scope controls mapped to requirements

The complete list of requirements provides a comprehensive view of that framework. Requirements and mapped controls are marked as 'Ready' (green checkmark) or 'Not Ready' (red 'X'). You can filter requirements by the specific framework categories (like SOC 2 TSC, HIPAA Rules) and by readiness status—'Ready' or 'Not Ready'—to gauge which requirements need your attention.

Each requirement is listed with all in-scope mapped controls. If no controls are mapped, zero (0) In-scope Controls is displayed. If a requirement isn't mapped to any controls, then it will be 'Not Ready'.

The ‘In-scope Controls’ calculation includes the total number of controls that are mapped to any requirement that has been marked in-scope. For example, if DCF-117 is mapped to 3 requirements within a framework, and only one of the requirements is marked in-scope, that control will be considered ‘in-scope’. Inversely, if all requirements are marked out-of-scope, the control will be marked ‘out of scope’ and the count will go down.

You can search for requirements,[mark them in and out of scope](https://help.drata.com/en/articles/6164108-marking-requirements-in-and-out-of-scope), filter requirements, map controls to requirements, view details, and download CSV files for requirement and control mappings.

Select the requirement to view detailed information, map (or unmap) it to DCF or custom controls, or mark it in or out of scope. Controls that are 'Not Ready' are prioritized to the top of the list.

## Related articles

- [Custom Framework](custom-framework.md)
- [CMMC Framework Updates](cmmc-framework-updates.md)
- [The Drata Control Framework & Requirement Relationship](the-drata-control-framework-requirement-relationship.md)
- [Marking Requirements In and Out of Scope](marking-requirements-in-and-out-of-scope.md)
- [Framework Readiness](framework-readiness.md)
