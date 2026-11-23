# Freshservice Integration Guide

Source: https://help.drata.com/en/articles/13611532-freshservice-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-03-03
Fetched: 2026-11-22

## Article text

The **Freshservice integration** enables security, IT, and compliance teams to automatically monitor IT service management activity in Drata. By connecting Drata to Freshservice, your team can continuously validate access controls, ticket workflows, and operational evidence needed for compliance.

## Prerequisites & Data Access

Before connecting Freshservice to Drata, ensure the following requirements are met:

- An active **Freshservice account**
- Ability to generate an **API key** in Freshservice
- Freshservice domain (subdomain) for your account

---

## Step-by-Step Setup

### Step 1: Find Your Freshservice Subdomain

Your Freshservice subdomain is the first part of the URL you use to log in.

**Example**
If you log in at `acme.freshservice.com`, your subdomain is:

```
acme
```

You’ll enter this value when configuring the connection in Drata.

---

### Step 2: Generate Your Freshservice API Key

1. Log in to your **Freshservice** account
2. Click the **profile icon** in the top-right corner
3. Select **Profile Settings**
4. On the right side, locate **Your API Key**
5. Copy the API key that appears

---

### Step 3: Connect Freshservice in Drata

1. Log in to **Drata**
2. Navigate to **Connections**
3. Search for and select **Freshservice**
4. Enter:
   - Your **Freshservice subdomain**
   - Your **API key**
5. Click **Connect**

---

## Next steps

Learn more about [creating tickets in Drata](create-and-manage-tickets-in-drata.md).

If Freshservice includes additional required fields that Drata does not support or receive through the integration, ticket creation can fail at the Freshservice API.

### Common example

- **Fields affected:** Support, Impact, Urgency
- **Behavior:** When these fields were configured as required in Freshservice, tickets could not be created from Drata.

To prevent this issue, do not configure unsupported fields as required. You can mark them as optional.

## Related articles

- [Freshteam Integration Guide](freshteam-integration-guide.md)
- [ServiceNow Integration Guide](servicenow-integration-guide.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Envoy Integration Guide](envoy-integration-guide.md)
- [Udemy Integration Guide](udemy-integration-guide.md)
