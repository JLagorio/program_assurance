# Understanding GCP Permissions and How Drata Integrates with GCP (Concept Guide)

Source: https://help.drata.com/en/articles/13456365-understanding-gcp-permissions-and-how-drata-integrates-with-gcp-concept-guide
Collection: Connection Support
Updated: 2026-01-21
Fetched: 2026-11-22

## Article text

## Overview

This article explains how Google Cloud Platform (GCP) organizes resources, controls access, and how those concepts apply to the Drata GCP integration. It provides the background needed to understand how Drata uses service accounts, IAM roles, and APIs to monitor your GCP environment.

## How GCP Organizes Your Environment

GCP structures resources using two primary concepts:

- **Projects**: The core unit in GCP. All resources—such as compute, storage, and logs—exist inside a project. Each project has its own configuration and billing.
- **Organizations**: An optional container that sits above projects. It allows centralized management of access controls and policies across multiple projects.

If present, the organization node sits at the top of the GCP resource hierarchy.

## How Access Is Controlled in GCP

GCP manages access through **identities** and **IAM roles**.

### What is an identity in GCP?

An **identity** is any entity that can request access to GCP resources, including:

- Human users
- Groups of users
- Service accounts used by applications and automation

Every GCP access decision is based on the identity making the request.

### What is an IAM role?

GCP uses **Identity and Access Management (IAM)** roles to define what actions an identity can take and on which resources.

A role includes a set of permissions and can be assigned at:

- The **organization level** (applies across all projects)
- The **project level** (applies only within a specific project)

## How Applications Access GCP

### What is a service account?

A **service account** is a non-human identity that applications use to authenticate to GCP and make requests.

Service accounts:

- Represent apps or automation
- Can be granted IAM roles, just like users or groups
- Are evaluated by GCP when access decisions are made

Applications, like Drata, access GCP data by acting as a service account.

## GCP integration

A Drata GCP integration is a secure connection that allows Drata to collect configuration, infrastructure, and identity data from your GCP environment. This data powers automated monitoring, evidence collection, and access reviews.

The integration uses a service account, which provides secure, scoped access to GCP resources without relying on personal user credentials.

## How Drata uses GCP permissions

When connecting GCP to Drata, the integration setup follows these steps:

1. Select the GCP project or organization to connect.
2. Create a service account to represent Drata.
3. Enable the required GCP APIs.
4. Assign read-only IAM roles to the service account.
5. Authenticate Drata as the service account to collect data.

Each step aligns with GCP’s standard access control model.

### Drata’s default GCP permission model

Drata recommends a default permission set that provides read-only access to commonly monitored GCP resources. This includes:

- IAM roles that allow viewing infrastructure, identity, and configuration metadata
- Permissions required to collect evidence from monitoring and logging services

This model supports most use cases while limiting unnecessary access. You can add more permissions as needed for specific services or tests.

## Why the principle of least privilege matters

To keep your environment secure and audit-ready, always follow the **principle of least privilege**:

- Start with Drata’s default permission model
- Grant only the permissions needed for specific services or tests
- Avoid broad or admin-level roles unless explicitly required

This helps reduce risk and ensures your GCP integration remains secure and compliant.

## Related Articles

- [How to Update GCP Connection Permissions in Drata](identify-and-add-missing-gcp-permissions-for-drata.md)
- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [GCP Integration Guide (Script Setup)](gcp-integration-guide-script-setup.md)
- [Google Workspace Integration Guide](google-workspace-integration-guide.md)
- [Google Workspace Connection for User Access Reviews (UAR)](google-workspace-integration-guide-user-access-reviews.md)

## Related articles

- [GCP Integration Guide (Script Setup)](gcp-integration-guide-script-setup.md)
- [GCP Integration Guide (Manual)](gcp-integration-guide-manual.md)
- [Understanding Azure Permissions and How Drata Integrates with Azure (Concept Guide)](understanding-azure-permissions-and-how-drata-integrates-with-azure-concept-guide.md)
- [Understanding AWS Permissions and How Drata Integrates with AWS (Concept Guide)](understanding-aws-permissions-and-how-drata-integrates-with-aws-concept-guide.md)
- [Identify and Add Missing GCP Permissions for Drata](identify-and-add-missing-gcp-permissions-for-drata.md)
