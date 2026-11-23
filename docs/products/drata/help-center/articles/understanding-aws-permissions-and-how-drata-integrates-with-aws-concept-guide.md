# Understanding AWS Permissions and How Drata Integrates with AWS (Concept Guide)

Source: https://help.drata.com/en/articles/13455825-understanding-aws-permissions-and-how-drata-integrates-with-aws-concept-guide
Collection: Connection Support
Updated: 2026-07-07
Fetched: 2026-11-22

## Article text

## Overview

This article explains how AWS Identity and Access Management (IAM) permissions work, how they relate to Drata's integrations, and why configuring them correctly is essential. By understanding the structure and function of AWS roles, policies, and permissions, you can maintain the principle of least privilege while enabling Drata to operate effectively.

## How permissions work in AWS

AWS uses IAM to manage **identities** (who or what can take action) and **permissions** (what actions are allowed on which resources).

- **Identities** include users, groups, and roles.
- **Permissions** are assigned through policies that define allowed or denied actions on resources.

### What is an IAM role?

An **IAM Role** is an AWS identity that applications or services can assume temporarily. Unlike users, roles do not have long-term credentials. Drata assumes a designated IAM role in your AWS account to perform monitoring and evidence collection.

Key role components:

- **Trust policy** – Defines who can assume the role (in this case, Drata).
- **Permissions policy** – Defines what the role can do.
- **External ID** – Provides an additional layer of security for cross-account access.

### What is a policy?

A **policy** is a JSON document that outlines:

- **Actions** – The AWS operations allowed or denied (for example, `ec2:DescribeInstances`)
- **Resources** – The AWS resources the actions apply to
- **Effect** – Whether the action is allowed or denied

Policies can be:

- **AWS-managed** – Predefined by AWS
- **Customer-managed** – Created and managed by your organization

### What is an ARN?

An **ARN** (Amazon Resource Name) uniquely identifies an AWS resource. Drata uses the ARN of the IAM role to know which role to assume.

## AWS permissions and Drata

### Drata AWS integration

A **Drata AWS integration** securely connects Drata to your cloud environment so it can monitor system configurations and collect evidence. The AWS integration uses an IAM role that Drata assumes to:

- Monitor cloud infrastructure
- Collect evidence for automated controls
- Support access reviews with role and activity data

Each of these tasks requires specific AWS permissions. If a required permission is missing, a test may enter an error state with an `AccessDenied` error.

### How Drata uses AWS permissions

Once the AWS integration is connected, Drata uses IAM permissions to:

- Monitor infrastructure (for example, EC2, S3, IAM configurations)
- Collect evidence (for example, configuration state, activity logs)
- Support access review automation (for example, mapping users to roles)

### Drata's default AWS permission model

Drata recommends a default **read-only** permission set to streamline onboarding and support the most common monitoring and evidence collection tests while keeping access minimal. This permission set is built around the AWS-managed [SecurityAudit policy](https://docs.aws.amazon.com/aws-managed-policy/latest/reference/SecurityAudit.html).

This one-size-fits-most approach is intended to:

- Help you connect quickly
- Avoid unnecessary permissions during setup
- Cover a broad range of supported AWS services and tests

However, as your use of Drata evolves, or if you enable additional AWS services or test frameworks, you may need to grant **additional permissions**. For more guidance on how to update your permissions, refer to [How to Update AWS Connection Permissions in Drata](identify-and-add-missing-aws-permissions-for-drata.md).

## Why the principle of least privilege matters

To stay secure and audit-ready, follow the **principle of least privilege**:

- Start with Drata's default permission model.
- Add only the permissions required to execute specific tests or support specific services.
- Avoid broad or unnecessary access (for example, `*:*` or full administrative roles).

This helps reduce risk, contain misconfigurations, and ensure your AWS integration stays secure and compliant over time.

## Related Articles

- [How to Update AWS Connection Permissions in Drata](identify-and-add-missing-aws-permissions-for-drata.md)
- [AWS Integration Guide (Infrastructure, User Access Review)](aws-integration-guide-infrastructure-user-access-review.md)
- [AWS & AWS Organizational Units Integration Guide](aws-org-units-connection-instructions.md)
- [AWS GovCloud Integration Guide](aws-govcloud-integration-guide.md)
- [AWS Inspector (Amazon Inspector) Integration Guide](aws-inspector-amazon-inspector-integration-guide.md)
- [AWS CodeCommit Integration Guide](aws-codecommit-integration-guide.md)

## Related articles

- [AWS Integration Guide (Infrastructure, User Access Review)](aws-integration-guide-infrastructure-user-access-review.md)
- [AWS CodeCommit Integration Guide](aws-codecommit-integration-guide.md)
- [AWS GovCloud Integration Guide](aws-govcloud-integration-guide.md)
- [Identify and Add Missing AWS Permissions for Drata](identify-and-add-missing-aws-permissions-for-drata.md)
- [Understanding GCP Permissions and How Drata Integrates with GCP (Concept Guide)](understanding-gcp-permissions-and-how-drata-integrates-with-gcp-concept-guide.md)
