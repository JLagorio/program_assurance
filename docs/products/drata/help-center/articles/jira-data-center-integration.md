# Jira Data Center Integration

Source: https://help.drata.com/en/articles/13918516-jira-data-center-integration
Collection: Connection Support › Ticketing Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

The Jira Data Center integration allows Drata to monitor Jira issues and collect evidence for vulnerability management compliance controls.

---

## Key Capabilities

- **Security Ticket Monitoring:** Continuously syncs Jira issues relevant to security and vulnerability management.
- **Automated Evidence Collection:** Pulls ticket data for compliance tests.
- **Multiple Accounts Supported:** Connect more than one Jira Data Center instance.

### Limitations

- Ticket Automation is not supported for Jira Data Center

---

## Prerequisites

- Admin access to your Jira Data Center instance
- Token-based authentication enabled
- Drata IP addresses allowlisted

---

## Step-by-Step Setup

### Step 1: Open the Jira Connection

1. In Drata, navigate to **Connections → Available connections →Jira Data Center**
2. Start the connection process.

---

### Step 2: Configure the Integration

- Select the workspace.
- **Account Alias:** Name the connection (useful for multiple Jira accounts).

---

### Step 3: Allowlist Drata IP Addresses

1. Choose your preferred authentication method:
   - Personal Access Token (recommended)
   - Username and Password
   - My credentials
2. Whitelist Drata's IP addresses to allow secure communication:
   - 44.194.126.11
   - 44.194.4.0
   - 3.232.227.174
   - 3.214.125.237
3. Go to admin.atlassian.com → Organization → Security → IP Allowlist → Create an allowlist and add the IPs above.
4. Provide your Jira domain (for example, for [https://jira.acme.com/jira](https://jira.acme.com/jira), enter jira.acme.com/jira).
5. Generate a Personal Access Token:
   - Go to your Jira profile → Personal Access Tokens → Create
      Token.
   - Name the token and copy it into Drata.

Expected outcome: Drata authenticates to your Jira Data Center using a secure, token-based connection.

---

### Step 4: Verify the Connection

1. Save your configuration.
2. Test the connection.
3. Confirm it appears under **Active Connections**.

Once verified, Jira Data Center issues will begin syncing for monitoring and evidence collection.

## Related articles

- [Jira Integration Guide](jira-integration-guide.md)
- [Ashby Integration Guide](ashby-integration-guide.md)
- [Dixa Integration Guide](dixa-integration-guide.md)
- [Leapsome Integration Guide](leapsome-integration-guide.md)
- [Pipedrive Integration Guide](pipedrive-integration-guide.md)
