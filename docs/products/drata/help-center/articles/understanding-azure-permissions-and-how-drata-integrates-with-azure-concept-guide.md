# Understanding Azure Permissions and How Drata Integrates with Azure (Concept Guide)

Source: https://help.drata.com/en/articles/13455183-understanding-azure-permissions-and-how-drata-integrates-with-azure-concept-guide
Collection: Connection Support
Updated: 2026-01-21
Fetched: 2026-11-22
Description: Learn how Azure tenants, subscriptions, Microsoft Graph permissions, and RBAC roles work together in the Drata Azure integration.

## Article text

This article explains how Azure organizes environments, manages access, and grants permissions and how those concepts map to the Drata Azure integration. It provides the background needed to understand how Drata uses Azure identity, role, and resource structures to monitor configuration, collect evidence, and support access reviews.

## How Azure Organizes Your Environment

Before diving into specific Azure components, it helps to understand how Azure is structured at a high level.

Azure organizes environments in a **top-down hierarchy**. Everything starts with a single Microsoft Entra tenant, which defines identity and access for the entire environment. Subscriptions, applications, users, and resources all connect back to this tenant and inherit its boundaries.

As you read this section, start at the tenant level and move downward. Each concept builds on the one before it, and understanding this hierarchy will make it easier to see how permissions, roles, and the Drata Azure integration fit together.

### Microsoft Entra tenant

Everything in Azure starts with a Microsoft Entra tenant. A tenant represents your organization's Azure environment. It tracks identities and governs which applications can request access.

At this level, Azure defines:

- Your organization as a whole
- Who can sign in
- Which applications are allowed to connect

Every Azure environment has exactly one tenant. All other Azure components connect back to it.

### Azure subscriptions

Azure subscriptions are connected to your Microsoft Entra tenant. The tenant determines **who** can access Azure, while subscriptions determine **what** they can access.

Azure subscriptions are containers that group and manage resources and provide a boundary for billing and access control. Each subscription contains:

- Azure resources (virtual machines, storage accounts, databases, etc.)
- Configuration settings and usage data

An organization can have one or many subscriptions, all linked to the same tenant.

#### Why connect multiple Azure subscriptions to Drata?

Organizations often use multiple subscriptions to separate:

- Production and non-production environments
- Teams or departments
- Compliance or audit scopes

#### Azure Management Groups

Connecting all relevant subscriptions to Drata enables monitoring and evidence collection across all in-scope environments. If you manage many subscriptions, you can use Azure Management Groups to apply access and policies across them.

## How Access Is Controlled in Azure

Azure assigns roles to identities to control access.

- An **identity** represents who or what is requesting access (user, group, or application).
- A **role** defines what actions that identity can perform and where.

### Azure role vs Global Administrator role

Azure roles apply within subscriptions and define allowed actions on resources. Roles can be assigned to:

- Users
- Groups
- Applications

Roles can be scoped at:

- The subscription level
- A resource group (a logical container for resources)
- A specific resource

Drata relies on roles to read configuration and infrastructure data without making changes.

The Global Administrator role is the highest-privilege role at the tenant level.

It allows users to:

- Register applications
- Grant API permissions to apps
- Assign Azure roles to identities

This role is required to set up the Drata Azure integration but does not provide direct access to subscription resources.

## How Applications Access Azure

Registering an app creates an **application identity** in your Microsoft Entra tenant.

This identity can:

- Be granted permissions and roles
- Authenticate using a client ID and secret

This lets Drata securely access resources without relying on a personal user account.

### Service principal

Once an application is registered, Azure needs a way to apply permissions to it inside subscriptions. That is the purpose of a service principal.

The service principal is the identity Azure uses to enforce permissions. It represents the app within your subscriptions and receives any Azure role assignments (such as Reader or Key Vault Reader).

For the Drata integration, the service principal is what allows Drata to:

- Access infrastructure and configuration data
- Perform read-only actions based on assigned roles

You don’t need to manually create the service principal—Azure handles it automatically during app registration. But it's essential to understand that this is the identity Drata uses when interacting with your Azure resources.

## How Azure Separates Types of Permissions

Directory data in Azure lives at the tenant level and includes:

- Users and groups
- Role assignments
- Sign-in and audit logs

This data describes **who exists in the organization and how access is structured**. Azure manages this data separately from subscription resources like virtual machines or storage.

### Microsoft Graph API vs Azure Role-Based Access Control (RBAC)

**Microsoft Graph is the API used to read tenant-level directory data.** These permissions:

- Are granted during app registration
- Apply at the tenant level
- Are separate from Azure roles used on subscription resources

When you grant Microsoft Graph API application permissions during setup, you are allowing the registered app to read specific types of directory data from the tenant.

**Azure RBAC controls access to subscription-level resources.** It evaluates:

- Which roles are assigned
- Where they apply
- Whether the requested action is allowed

RBAC applies only to Azure resources, such as virtual machines, storage accounts, and networking components. It does not apply to directory data.

## How Azure integrates with Drata

A **Drata Azure integration** is a secure connection between Drata and your Azure environment that enables automated monitoring, evidence collection, and access review support.

Instead of relying on manual uploads or personal user accounts, the integration uses an application identity with scoped permissions to securely access the data Drata needs.

Common use cases include:

- Infrastructure configuration monitoring
- Automated evidence collection
- Identity and access reviews

### How Drata handles user syncing

As part of the integration, Drata can import user and group data from Microsoft Entra. This process, called **user syncing**, allows Drata to:

- Identify which users exist in your environment
- Understand how those users are grouped
- Determine who is in scope for access reviews

You control user syncing by specifying which Microsoft Entra groups Drata should import:

- **Group object IDs** identify the exact groups to sync.
- Only users in those groups are imported into Drata.

You can also use **dynamic groups**, which automatically update based on attributes like department or role. This helps ensure that user scope stays accurate without manual updates.

### How Drata uses Azure permissions

Drata relies on permissions applied across multiple Azure layers to function effectively. Here’s how each piece fits together:

1. The Microsoft Entra tenant defines your organizational boundary.
2. Registering the Drata application creates an application identity.
3. Azure creates a service principal that represents the app in subscriptions.
4. Microsoft Graph permissions grant access to directory data.
5. Azure RBAC roles grant access to subscription resources.
6. Group filters define which users are synced into Drata.

These layers work together to give Drata the access it needs to:

- Monitor configurations
- Collect evidence
- Support access reviews

All without modifying resources.

### Drata’s default Azure permission model

Drata recommends a default permission model that balances security and functionality. By default, the integration uses:

- A scoped set of Microsoft Graph API permissions to access directory data
- The Reader role to access subscription resources

This model provides the access needed for most use cases while limiting unnecessary exposure.

If additional access is needed to support specific services or tests, you can expand permissions incrementally—without assigning broad administrative roles.

## Why the principle of least privilege matters

To stay secure and audit-ready, always follow the **principle of least privilege**.

- Start with Drata’s default permission model.
- Add only the permissions required to execute specific tests or support specific services.
- Avoid wildcard or overly broad permissions like `*:*`.

This approach helps reduce risk, contain misconfigurations, and ensure your Azure integration stays secure and compliant over time.

## Related Articles

- [How to Update Azure Connection Permissions in Drata](identify-and-add-missing-azure-permissions-for-drata.md)
- [Azure Integration Guide](azure-integration-guide.md)
- [Azure Management Groups Integration Guide](azure-management-groups-integration-guide.md)
- [Azure Repos (DevOps) Integration Guide](azure-repos-devops-integration-guide.md)
- [Azure Boards (DevOps) Integration Guide](azure-boards-devops-integration-guide.md)
- [Microsoft 365 Integration Guide](microsoft-365-integration-guide.md)

## Related articles

- [Microsoft 365 Integration Guide](microsoft-365-integration-guide.md)
- [Azure Integration Guide](azure-integration-guide.md)
- [Azure Repos (DevOps) Integration Guide](azure-repos-devops-integration-guide.md)
- [Azure Management Groups Integration Guide](azure-management-groups-integration-guide.md)
- [Identify and Add Missing Azure Permissions for Drata](identify-and-add-missing-azure-permissions-for-drata.md)
