# BitBucket Integration Guide

Source: https://help.drata.com/en/articles/4939180-bitbucket-integration-guide
Collection: Connection Support › Version Control Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Learn how to connect BitBucket to Drata. This connection supports the following types: Codebase, Ticketing, User Access Review, Version Control.

## Article text

The BitBucket integration enables your team to connect Drata to your company’s BitBucket organization so you can automate tests and evidence collection that demonstrate your company follows its software development lifecycle procedures.

## Key Capabilities

- **Multiple connection types**: Add BitBucket as a Codebase, Ticketing, User Access Review, or Version Control connection type.
- **Automated evidence collection**: Supports automated tests and evidence collection related to your software development lifecycle procedures.
- **Centralized connection management**: Configure and manage the BitBucket connection from Drata’s Connections page.

This integration is used to automate tests and evidence collection that help prove your company follows its software development lifecycle procedures.

## Prerequisites & Data Access

- You must have the ability to install a BitBucket app on your company’s BitBucket organization.
- You must be an admin in each repository and an owner in each BitBucket workspace to complete the installation.

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Account Read | Read access to your account information |
| Repository Read | Read access to your repositories |
| Repository Admin | Admin access to your repositories |
| Workspace Membership Read | Read access to your team membership information |

## Step-by-Step Setup

1. Navigate to the **Connections** page and open the **Available** connections.
2. Search for **BitBucket**, then select **Connect**.
   Choose the connection type:
   - **Codebase**
   - **Ticketing**
   - **User Access Review**
   - **Version Control**
3. Follow the connection process:
   - For Ticketing and User Access Review connection, you must enter the Account Alias.
   - For Version Control Provider connection types, you will be redirected to BitBucket for app installations and you must approve the following permissions:
      - **Account Read**: Read access to your account information
      - **Repository Read**: Read access to your repositories
      - **Repository Admin**: Admin access to your repositories
      - **Workspace Membership Read**: Read access to your team membership information
4. Once permissions are granted, you’ll be redirected back to Drata.

## Related articles

- [GitLab Integration Guide](gitlab-integration-guide.md)
- [Justworks Integration Guide](justworks-integration-guide.md)
- [JetBrains Integration Guide](jetbrains-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)
