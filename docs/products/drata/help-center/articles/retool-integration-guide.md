# Retool Integration Guide

Source: https://help.drata.com/en/articles/10595138-retool-integration-guide
Collection: Connection Support › Other Guidance
Updated: 2025-10-27
Fetched: 2026-11-22

## Article text

Integrating Retool with Drata automates your user access reviews, saving time and reducing errors by syncing user data directly from Retool.

## Prerequisites & Data Access

- Must have **Admin privileges** in your Retool account.
- Must generate a **Retool API Key** with proper scopes.
- Must know your **Retool Domain URL**.

### Permissions & Data Table

| **Permission/Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| Retool RPC: All | Allows Drata to read user, group, and role data | User identity, role assignments, and organizational metadata |
| Domain URL | Identifies the specific Retool organization | Organization endpoint for API requests |

## Step-by-Step Setup

### Step 1: Create a Retool API Key

1. Log in to your **Retool account**.
2. Navigate to your **Profile**.
3. Go to the **Retool API** page.
4. Click **Create new**.
5. Enter the following details:
   - **Name:** Provide a descriptive name (e.g., “Drata Integration”).
   - **Description:** Briefly describe its purpose (e.g., “Used for Drata access reviews”).
   - **Scope:** Select **Retool RPC > All**.
6. Click **Create** and copy your **API Key**.

### Step 2: Copy Your Retool Domain URL

1. From your logged-in Retool organization, check your browser’s URL.
2. Your **Domain URL** is in the format:  **`https://your-subdomain.retool.com`**

Example: If your organization’s subdomain is `acme`, your Domain URL is `https://acme.retool.com`.

## Complete the Connection

In Drata’s **Connections** page, enter the following information:

| **Drata Field** | **Retool Value** |
|---|---|
| Domain URL | The organization’s Retool subdomain (e.g., `https://your-subdomain.retool.com`) |
| API Key | The Retool API key generated under your Profile → Retool API page |

For steps on accessing and using the Connections page in Drata, refer to [The Connections Page in Drata](https://help.drata.com/en/articles/12305645-the-connections-page-in-drata).

## Related articles

- [Freshteam Integration Guide](freshteam-integration-guide.md)
- [Freshsales Integration Guide (UAR)](freshsales-integration-guide-uar.md)
- [Pinpoint Integration Guide](pinpoint-integration-guide.md)
- [Workable Integration Guide](workable-integration-guide.md)
- [Freshservice Integration Guide](freshservice-integration-guide.md)
