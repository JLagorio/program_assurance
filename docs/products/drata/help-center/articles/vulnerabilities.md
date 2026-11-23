# Vulnerabilities

Source: https://help.drata.com/en/articles/13557176-vulnerabilities
Collection: Understand the Drata Platform › Vulnerabilities
Updated: 2026-11-09
Fetched: 2026-11-22

## Article text

The **Vulnerabilities** page centralizes security vulnerabilities discovered across your connected tools. It helps you **prioritize remediation**, **track SLA deadlines**, and **monitor compliance status** in one place.

Drata uses vulnerability data to support audit readiness, SLA enforcement, and monitoring tests tied to your security controls.

---

### How vulnerability tracking works in Drata

When you connect a supported vulnerability scanning or exposure management tool:

- Drata continuously syncs vulnerability findings
- Each vulnerability is assigned an **SLA due date** based on severity
- Status updates reflect the latest data from the source system
- Monitoring tests evaluate whether critical and high vulnerabilities are addressed
- Drata shows *findings*, which are instances of *vulnerabilities* (an individual but higher-level CVE) against specific resources. This may reflect as higher finding counts in Drata vs. your vulnerability provider's dashboard.

Drata does not remediate vulnerabilities. It tracks status, deadlines, and compliance impact.

---

### Before you begin

Connect at least one supported vulnerability provider. Supported connections include:

- [Aikido](aikido-integration-guide.md)
- [Arnica](arnica-integration-guide.md)
- [AWS Inspector](aws-inspector-amazon-inspector-integration-guide.md)
- [CrowdStrike Falcon Exposure Management](crowdstrike-falcon-exposure-management-integration-guide.md)
- [GitLab VMS](gitlab-vms-integration-guide.md)
- [Microsoft Defender Vulnerability Management](microsoft-defender-vulnerability-management-integration-guide.md) (and GCC High)
- [Orca Security](orca-security-integration-guide.md)
- [Qualys](qualys-integration-guide.md)
- [Rapid7 InsightVM](rapid7-insightvm-integration-guide.md)
- [Semgrep](semgrep-integration-guide.md)
- [SentinelOne Singularity Vulnerability Management](sentinelone-singularity-vulnerability-management-vms-integration-guide.md)
- [Snyk](snyk-integration-guide.md)
- [Socket](socket-integration-guide.md)
- [Tenable Vulnerability Management](tenable-vulnerability-management-integration-guide.md)
- [Upwind](upwind-integration-guide.md)
- [Wiz](wiz-vulnerability-scanning-integration-guide.md)
- [Wiz Code](wiz-code-integration-guide-vulnerability-scanning.md)

---

### View vulnerabilities

To open the Vulnerabilities page:

1. Select **Risk > Vulnerabilities** from the left navigation.

From this page, you can:

- Filter vulnerabilities by **connection**, **severity**, **due date**, or **fix availability**
- Search by **vulnerability ID**
- View SLA due dates and current status
- Download vulnerability reports (filtered or complete)
- Resync data using **Resync**

---

### View vulnerability details

Select a vulnerability to its specific details such as:

- CVSS score
- Severity
- SLA due date
- Status
- Platform-specific metadata from the source tool

---

## SLA behavior and due dates

Drata calculates SLA due dates based on vulnerability severity.

### Default SLAs

If no Vulnerability Management Policy is configured, Drata applies default SLAs:

- **Critical**: 7 days
- **High**: 30 days
- **Medium**: 90 days
- **Low**: 180 days

If a Vulnerability Management Policy exists, Drata uses the SLAs defined in that policy instead. SLA due dates appear in the **SLA Due Date** column on the Vulnerabilities page.

---

### Configure SLA settings and warning periods

To update SLA and warning period settings:

1. Navigate to Risk > Vulnerabilities settings:
2. In the **SLA Settings**:
   - Edit SLA values by severity
   - Set a **warning period** for upcoming SLA deadlines

The warning period determines when you receive notifications before an SLA is due.

**Example:**
If the warning period is set to **7 days**, Drata sends notifications 7 days before each SLA due date.

---

## Schedule vulnerability notifications

To receive email notifications for missed or upcoming SLAs:

1. Open **Settings**.
2. Select **Notifications**.
3. Enable **Reminders for vulnerabilities with missed or upcoming SLAs**.
4. Select how often you want to receive notifications.

Notifications include summaries of **critical and high-severity vulnerabilities**, along with due dates.

---

## Monitoring tests

For each connected provider, Drata creates the following monitoring tests:

- **Critical Vulnerabilities Addressed – <Provider Name>**
   Fails if one or more critical vulnerabilities remain open.
- **High Vulnerabilities Addressed – <Provider Name>**
   Fails if one or more high-severity vulnerabilities remain open.

These tests help ensure timely remediation and support audit evidence.

---

## Key distinction to remember

Drata **tracks and evaluates vulnerabilities**, but remediation happens in your connected tools. Keeping SLAs accurate, connections active, and vulnerabilities resolved ensures:

- Monitoring tests pass
- SLA commitments are met
- Audit evidence remains defensible

## Related articles

- [Snyk Integration Guide](snyk-integration-guide.md)
- [Qualys Integration Guide](qualys-integration-guide.md)
- [SentinelOne Singularity Vulnerability Management (VMS) Integration Guide](sentinelone-singularity-vulnerability-management-vms-integration-guide.md)
- [Microsoft Defender Vulnerability Management Integration Guide](microsoft-defender-vulnerability-management-integration-guide.md)
- [Rapid7 InsightVM Integration Guide](rapid7-insightvm-integration-guide.md)
