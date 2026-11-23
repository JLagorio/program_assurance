# February 2025 Release: AWS and Azure Drata Tests

Source: https://help.drata.com/en/articles/10437783-february-2025-release-aws-and-azure-drata-tests
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: We’re excited to announce the release of new tests in Drata. These AWS and Azure tests were released in February 5, 2025.

## Article text

## Prerequisite

- Framework and Control Mapping:
   - These tests are mapped to specific controls, which are tied to a compliance framework within your workspace. If your compliance framework does not have the specific control that corresponds to one of these newly released tests, the test will not be made available. Within this article, we cover what controls map to each test.
   - Frameworks, controls and tests are workspace-specific. If a control isn't enabled in a particular workspace, tests related to that control will not be available in that workspace.
- Connections Required:
   - Since these tests are related to AWS or Azure, they require a valid connection to AWS or Azure. If you do not have a connection to either AWS or Azure, these tests will be new in an “Unused” status
   - If you have an AWS or Azure connection, these new tests will be new in a “Disabled” status, giving you the opportunity to review and activate these tests by updating the status to “Enabled.”

## Controls Mapped to the New Tests

These new tests automate control monitoring and evidence collection for the following controls:

- DCF-55
- DCF-73
- DCF-83
- DCF-86
- DCF-97
- DCF-285
- DCF-406
- DCF-407
- DCF-748

## Test Overview

Each test is directly mapped to specific controls in your compliance framework.

### Center for Internet Security (CIS)

A significant portion of these tests are derived from the Center for Internet Security (CIS) foundation benchmarks for Amazon Elastic Kubernetes Service (EKS) and Microsoft Azure. These benchmarks provide prescriptive guidance for establishing secure baseline configurations for EKS and Azure environments. Developed through a global, consensus-driven process involving cybersecurity experts, CIS benchmarks aim to help organizations strengthen their defenses, mitigate risks, and align with industry best practices for cloud security.

| **Test ID** | **Test Name** | **Mapped Control(s)** | **Benchmark** | **Frameworks** |
|---|---|---|---|---|
| 116 | NoSQL Cluster CPU Load Monitored | DCF-83 | Custom | ISO 27001:2013, HIPAA, NIST 800-53r5, FedRAMP |
| 131 | Autoscale Server Instances | DCF-97 | Custom | ISO 27001:2013, NIST 800-53r5, NIST CSF 1.1, FedRAMP, ISO 27017:2015, ISO 27001:2022, SOC2, ISO 27701:2019, NIST CSF 2.0, DORA |
| 243 | Azure Log Alert for Create Policy Assignment | DCF-406, DCF-407, DCF-86 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA |
| 244 | Azure Log Alert for Delete Public IP Address | DCF-406, DCF-407, DCF-86 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA |
| 245 | Azure Log Alert for Delete Policy Assignment | DCF-406, DCF-407, DCF-86 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA |
| 246 | Azure Log Alert for Create or Update Network Security Group | DCF-406, DCF-407, DCF-86 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA |
| 247 | Azure Log Alert for Delete Network Security Group | DCF-406, DCF-407, DCF-86 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA |
| 248 | Azure Log Alert for Create or Update Security Solution | DCF-406, DCF-407, DCF-86 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA |
| 249 | Azure Log Alert for Delete Security Solution | DCF-406, DCF-407, DCF-86 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA |
| 252 | Azure Log Alert for Create or Update Public IP Address | DCF-406, DCF-407, DCF-86 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA |
| 253 | Azure Storage Accounts Accessed Via Private Endpoints | DCF-748, DCF-55 | CIS | NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA, DORA, NIS 2, ISO 27018:2019, CCPA, CPRA, |
| 256 | Azure SQL Servers Auditing | DCF-406, DCF-407 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 42001:2023 |
| 257 | Azure PostgreSQL Database Server Log Checkpoints | DCF-406 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0 |
| 263 | Azure Storage Accounts Secure TLS Configuration | DCF-55,DCF-285 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0, ISO 27701:2019, PCI DSS v4.0.1, ISO 27001:2013, NIST CSF 1.1, CCM, HIPAA, DORA, NIS 2, ISO 27018:2019, CCPA, CPRA |
| 268 | Azure Network Security Group SSH Public Access Restricted | DCF-73 | CIS | ISO 27001:2013, HIPAA, CCPA, CPRA, NIST 800-53r5, CCM, FedRAMP, ISO 27001:2022, SOC 2, NIST 800-171r2, ISO 27701:2019, CMMC 2.0 |
| 269 | Azure App Service Web App Redirects HTTP Traffic to HTTPS | DCF-55 | CIS | ISO 27001:2013, HIPAA, CCPA, CPRA, NIST 800-53r5, CCM, NIST CSF 1.1, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, ISO 27701:2019, NIST 800-171r2, NIST CSF 2.0 ,ISO 27018:2019, NIS 2, CMMC 2.0 |
| 310 | Audit Logs Enabled for EKS Clusters | DCF-406 | CIS | PCI DSS v3.2.1, NIST 800-53r5, FedRAMP, PCI DSS v4.0, ISO 27001:2022, SOC 2, NIST 800-171r2, NIST CSF 2.0, CMMC 2.0 |

## Related articles

- [Frameworks](frameworks.md)
- [Policies to Framework Summary](policies-to-framework-summary.md)
- [DCF Library Updates on 1/18/2024](dcf-library-updates-on-1-18-2024.md)
- [October 2024 Release: AWS Drata test](october-2024-release-aws-drata-test.md)
- [Control Mapping Updates for Policies - 10/17/2025](control-mapping-updates-for-policies-10-17-2025.md)
