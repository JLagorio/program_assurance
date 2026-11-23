# Set up OAuth for the Drata API

Source: https://help.drata.com/en/articles/13521519-set-up-oauth-for-the-drata-api
Collection: Connection Support › Drata API
Updated: 2026-02-24
Fetched: 2026-11-22
Description: Learn how to configure and use OAuth 2.0 Client Credentials to securely authenticate API requests to Drata, which is the recommended method for machine-to-machine and enterprise integrations.

## Article text

OAuth provides a secure, scalable way to authenticate API requests to Drata. Instead of using a long-lived API key, OAuth allows you to generate **short-lived access tokens** with **specific permissions (scopes)**.

This article walks through how to:

1. Create an OAuth Application in Drata
2. Choose scopes and expiration
3. Generate an access token
4. Use the token to call the Drata API
5. Understand why OAuth is better than API keys

---

## Who should use OAuth?

OAuth is recommended for:

- Enterprise customers
- Teams building automations or integrations
- CI/CD pipelines
- Service-to-service access (machine-to-machine)

OAuth Applications are created **per tenant**, and represent an integration identity (not an individual user).

---

### Step 1: Create an OAuth Application

1. In Drata, go to **Settings → OAuth Applications**
2. Select **Create OAuth Application**

---

### Step 2: Enter basic details

On the **Create OAuth Application** page:

1. Enter an application **Name**
   - Example: Security Automation, Policy Assignment Bot, Reporting Export
2. (Optional) Add a **Description**
3. Choose an **Expiration option**
   - **Never**
   - **Custom** (recommended for most customers)

Select **Next**.

Tip: Many orgs create separate OAuth Applications for dev/stage/prod to limit exposure and reduce risk.

---

### Step 3: Choose scopes (permissions)

OAuth uses **scopes** to control what the application is allowed to do in the API.

In the **Scopes** step:

1. Choose a **Scope preset**
   - **Custom** (recommended)
2. Use the dropdown sections to expand categories (ex: Policies, Personnel & Devices, Evidence, etc.)
3. Select permissions per resource:
   - **Read**
   - **Create**
   - **Update**
   - **Delete**

For example, under **Policies → Assigned Policies**

- ✅ Read
- ✅ Create

When finished, submit to create the OAuth Application.

**Best practice**: Always follow **least privilege** — only enable the minimum scopes needed for your integration.

---

### Step 4: Save your OAuth Credentials

After creation, Drata will display a modal containing your:

- **Client secret**
- **Client ID**
- A ready-to-run **cURL command** for generating an access token

⚠️ Important:

- You **will not be able to view this Client secret or ID again**
- Store it immediately in a secure location

To continue, confirm the checkbox:

- “I have stored this client secret information in a secure location.”
- "I’ve saved my secret."

---

### Step 5: Generate an access token

In the OAuth Application details page, go to the **Token Request Detailssection. **Use the following **cURL command** to request an access token

**To request a token:**

- Copy the cURL command shown in Drata
- Replace only the `client_secret` value
- Run the command in a terminal

**Example request:**

```
curl --request POST \
  --url https:///oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id":"",
    "client_secret":"",
    "audience":"",
    "grant_type":"client_credentials",
    "scope":"read:assigned-policies create:assigned-policies"
  }'
```

- `<CLIENT_SECRET>`**: **The only value you need to manually provide. Copy this from the credentials modal in **Step 4: Save your OAuth Credentials**.
- Drata automatically fills in the `client_key` and audience values for your tenant and region.

If successful, you’ll receive a response like:

```
{

  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

---

### Step 6: Use the token to call the Drata API

Include the access token in the `Authorization` header:

```
curl https:///v1/ \
  -H "Authorization: Bearer "
```

Tokens are time-limited and will expire after the `expires_in` period. When that happens, generate a new token by repeating Step 5.

---

## Manage OAuth Applications

From the OAuth Application detail page, admins can:

- View details + scopes
- Edit scopes
- Revoke the OAuth Application

Revoking the OAuth Application will immediately prevent new tokens from being minted and block API access using that client.

---

## Why OAuth is better than API keys

OAuth is the preferred option because it’s more secure and more manageable at scale.

---

### 1. Short-lived access tokens

OAuth uses **temporary access tokens** instead of a permanent credential.

- ✅ If the OAuth access token leaks, it expires quickly
- ❌ API keys often remain valid until manually revoked

### 2. Better for enterprise governance

Larger orgs can create OAuth Applications per:

- integration
- environment (dev/stage/prod)
- team

This helps reduce risk and improves operational control.

### 3. Easier secret rotation

OAuth makes credential rotation safer:

- Rotate the client secret
- Tokens naturally expire
   - In most cases, you’ll configure the machine-to-machine integration using the **Client ID**, while the **Client Secret** should be stored securely in a vault or other protected storage solution.
   - If the Client Secret is ever rotated, the Client ID typically stays the same, and the application can simply retrieve the updated secret from the vault. All other configuration details—such as scopes—remain unchanged.

With API keys, rotation often causes downtime or breaks integrations if not coordinated.

### 4. Industry standard

OAuth 2.0 Client Credentials is a widely adopted standard supported by:

- CI/CD tooling
- secrets managers
- enterprise security teams

---

## Recommended enterprise setup

For large orgs, we recommend:

- ✅ **One OAuth Application per integration/service**
- ✅ **Separate OAuth Applications per environment (dev/stage/prod)**
- ✅ **Use least privilege scopes**
- ✅ **Store Client Secrets in a secrets manager**
- ✅ **Rotate secrets regularly**
- ❌ Avoid sharing Client Secrets across individual users/dev laptops

## Related articles

- [Miro Integration](miro-integration.md)
- [Greenhouse Integration Guide](greenhouse-integration-guide.md)
- [RingCentral Integration Guide](ringcentral-integration-guide.md)
- [Twilio Integration Guide](twilio-integration-guide.md)
- [Box Integration Guide](box-integration-guide.md)
