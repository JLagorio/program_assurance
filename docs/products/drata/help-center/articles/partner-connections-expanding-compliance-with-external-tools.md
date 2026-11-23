# Partner Connections: Expanding Compliance with External Tools

Source: https://help.drata.com/en/articles/12151473-partner-connections-expanding-compliance-with-external-tools
Collection: Understand the Drata Platform › Connections
Updated: 2025-09-03
Fetched: 2026-11-22

## Article text

Not every integration is directly supported by Drata. That’s where partner connections come in. These are integrations built and managed by our partners, enabling you to extend Drata’s compliance workflows with additional tools you already use. While these connections don’t have access to Drata’s automated tests, they provide powerful ways to share and sync evidence across platforms.

## How Partner Connections Work

- Built and maintained outside of Drata.
- Connected using a **Drata API key** with custom scopes.
- Evidence (such as device data, policies, or configurations) is **sent from the partner tool into Drata**.
- That evidence can then be reviewed, stored, and used to support compliance efforts.

## Example: Swif Partner Connection

Swif helps organizations manage device compliance and security. By connecting Swif to Drata, you can automatically send device and policy data into Drata as evidence.

**Connection Instructions**

1. **Create an API key in Drata**
   - Name: `For Swif`
   - Expiration: `Never expires`
   - Scope: `Custom scope`
   - Permissions required:
      - **Personnel**: Read-only (except Device Compliance, which requires write access)
      - **Assets**: Full access
      - **Workspaces**: Read-only (for listing workspaces)
      - **Evidence**: Full access
2. **Log in to Swif**
   - Go to [Swif account page](https://app.swif.ai/org/account?utm_source=chatgpt.com).
3. **Connect Swif to Drata**
   - In Swif, navigate to **Settings > Integrations > Drata**.
   - Paste the Drata API key you created.
   - Tap **Connect**.

Once connected, Swif will begin sending device and policy data into Drata, where it is stored as evidence.

## Related articles

- [Hexnode UEM (macOS) Integration Guide](hexnode-uem-macos-integration-guide.md)
- [Hexnode UEM (Windows) Integration Guide](hexnode-uem-windows-integration-guide.md)
- [CrowdStrike Falcon Exposure Management Integration Guide](crowdstrike-falcon-exposure-management-integration-guide.md)
- [Aikido Integration Guide](aikido-integration-guide.md)
- [DataGrail Integration Guide](datagrail-integration-guide.md)
