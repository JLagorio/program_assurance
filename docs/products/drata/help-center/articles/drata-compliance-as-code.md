# Drata Compliance as Code

Source: https://help.drata.com/en/articles/9930785-drata-compliance-as-code
Collection: Settings
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

Drata **Compliance as Code** helps you detect and remediate compliance and security gaps directly in your infrastructure-as-code (IaC) before changes reach production. It continuously monitors, enforces, and (with Pro) helps remediate compliance controls across your software development lifecycle, so developers and DevOps teams can move quickly without sacrificing security or audit readiness.

Visit this link to find our public facing documentation for the Compliance as Code Feature: [https://docs.drata.com/drata-compliance-as-code](https://docs.drata.com/drata-compliance-as-code)

### What you can do with Compliance as Code

- **Surface compliance gaps earlier**: Scan IaC during development to catch control issues before deployment, reducing late-stage rework and surprises at audit time.
- **Track continuous change**: Monitor infrastructure-as-code changes over time and spot commits that introduce control drift across frameworks and environments.
- **Streamline remediation (with Pro)**: Automatically generate pull requests with control context, exact issue locations, and recommended fixes to save developers time and shorten resolution cycles.

### How Compliance as Code works

At a high level, Compliance as Code follows this flow:

1. **Connect your codebase**
   Install and configure the **GitHub Code** or **Bitbucket Code** integration so Drata can scan selected repositories that contain your infrastructure-as-code.
2. **Configure scanning and findings**
   - Choose which repositories to scan.
   - Set the **minimum severity** of findings that should trigger pull requests (for Pro) or pipeline failures.
3. **Set PR and remediation preferences (Compliance as Code Pro)**
   - Decide how Drata should open pull requests (for example, one PR per issue or grouped PRs) so remediation fits your team’s workflow.
4. **Enable pipeline enforcement (optional)**
   - Connect Drata with GitHub Actions and define a severity threshold where non-compliant code causes the pipeline to fail, preventing merges into critical branches (such as `main`).
5. **Integrate across your SDLC and track impact**
   - Use Drata’s integrations across cloud and developer tools to maintain consistent standards and track metrics such as deployment frequency and time/cost savings from early detection.

---

### Requirements and supported stack

Compliance as Code is designed for teams using infrastructure-as-code for cloud environments.

Current prerequisites include:

- **Cloud providers**: AWS, Azure, or GCP
- **Infrastructure as Code**: Terraform (for infrastructure definitions)
- **Version control**: GitHub Code or Bitbucket Code
- **Pipelines (optional)**: GitHub Actions for CI/CD enforcement

Drata scans only the repositories and IaC files you enable for scanning.

## Related articles

- [GitHub Integration Guide](github-integration-guide.md)
- [Test 9: Production Code Changes Restricted](test-9-production-code-changes-restricted.md)
- [Test 123: Cloud Infrastructure Linked to Drata](test-123-cloud-infrastructure-linked-to-drata.md)
- [GitHub Enterprise Server Integration Guide](github-enterprise-server-integration-guide.md)
- [Monitoring Overview](monitoring-overview.md)
