# Single Sign-On Connection

Source: https://help.drata.com/en/articles/5209416-single-sign-on-connection
Collection: Connection Support › Other Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to an SSO app

## Article text

The Single Sign-On (SSO) integration enables organizations to authenticate users through their preferred identity provider. It connects Drata to your enterprise identity provider so your team can securely access Drata using centralized authentication and identity management.

## Key Capabilities

- Centralized authentication: Let users log in to Drata using your identity provider
- Identity provider enforcement: Restrict access based on users and groups synced from your IdP
- Secure login management: Standardize authentication using enterprise SSO policies

This integration is used to enforce identity and access management controls, helping support compliance with access control and authentication policies.

## Prerequisites & Data Access

- **Admin access** to your organization’s identity provider (SSO provider)

Important requirement:

- You **must connect an Identity Provider (IdP) to Drata before enabling SSO login**.
- The **SSO connection option will remain disabled** on the Connections page until an IdP integration is connected.
- Once SSO is enabled, **all Drata logins—including administrators—are enforced by the identity provider** and restricted to users synced from the IdP

**▸ A supported identity provider such as:**

- Entra ID (Azure AD)
- Google Workspace
- ADP
- Auth0
- CAS
- ClassLink
- Cloudflare
- CyberArk
- Duo
- JumpCloud
- Keycloak
- LastPass
- Microsoft AD FS
- miniOrange
- NetIQ
- OneLogin
- Oracle
- PingFederate
- PingOne
- Rippling
- Salesforce
- Shibboleth
- Shibboleth Unsolicited
- SimpleSAMLphp
- VMware

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Identity provider admin access | Required to configure SSO settings and authorize the connection |
| IdP connection in Drata | Required before enabling the SSO login integration |
| WorkOS authentication configuration | Enables Drata to connect with the SSO provider |

## Step-by-Step Setup

### Step 1: Connect an Identity Provider (IdP)

Before setting up SSO login, you must first connect your **Identity Provider integration** to Drata.

1. Log in to **Drata**.
2. Navigate to the **Connections** page.
3. Search for your **Identity Provider** (for example, Entra ID, Okta, Google Workspace, etc.).
4. Complete the IdP connection process.

Expected outcome:
Your identity provider is connected to Drata and user identities are synced.

### Step 2: Start the SSO Connection

1. Log in to **Drata**.
2. Navigate to the **Connections** page.
3. Search for **Single Sign-On (SSO)**.
4. Start the **SSO** connection process.

Expected outcome: The SSO setup flow opens.

### Step 3: Configure SSO Through WorkOS

1. When prompted, follow the setup instructions shown in the connection flow.
2. You will be redirected to the **WorkOS configuration page**.
3. Select your **SSO provider**.
4. Log in to your **identity provider as an administrator**.
5. Follow the configuration steps to create and configure the SSO application within your provider.

Expected outcome: The SSO application is configured in your identity provider.

### Step 4: Complete the Connection

1. After finishing the configuration steps, return to Drata.
2. Click the **Drata logo** in the top-left corner if prompted to return to the application.
3. The SSO connection will complete automatically.

Expected outcome: The SSO connection is successfully established.

## Reset the connection

To ensure service continuity and minimize security risks, it is best practice to perform the disconnect and reconnect process in a single session.

> **⚠️ Warning: Potential account lockout**
>
> - Before you disconnect the SSO integration, ensure you have an alternative administrative sign-in method available.
> - Disconnecting the primary authentication method may lock all users out of the platform.
> - If you lose access, you must contact Drata Support to request a "magic link" to regain entry.

**To reset the connection:**

1. Navigate to the **Connections** page.
2. Locate and select the **Single Sign-On **connection.
3. Select the **Delete button.**
4. Once the status is disconnected, select **Connect** to start the reconnection process.

## Important Notes

- The **Identity Provider connection must be configured before the SSO connection can be enabled**.
- The SSO connection uses **WorkOS** to facilitate authentication with supported providers.
- Once SSO is enabled, **all Drata authentication is controlled by the identity provider**.

## Related articles

- [KarmaCheck Integration Guide](karmacheck-integration-guide.md)
- [Microsoft 365 Integration Guide](microsoft-365-integration-guide.md)
- [Azure Repos (DevOps) Integration Guide](azure-repos-devops-integration-guide.md)
- [Canva Integration Guide](canva-integration-guide.md)
- [Signing In to Drata (New Experience)](signing-in-to-drata-new-experience.md)
