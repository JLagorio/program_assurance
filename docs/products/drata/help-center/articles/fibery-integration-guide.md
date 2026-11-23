# Fibery Integration Guide

Source: https://help.drata.com/en/articles/5968610-fibery-integration-guide
Collection: Connection Support › Ticketing Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Making the initial connection to Fibery

## Article text

The **Fibery integration** enables security and compliance teams to monitor how your ticketing system tracks and manages security issues. It connects Drata to your **Fibery workspace** so your team can automatically collect evidence showing that your team documents, assigns, and prioritizes security issues.

---

## Key Capabilities

- **Security Issue Tracking:** Monitor security-related tickets created in Fibery
- **Issue Assignment Monitoring:** Confirm that security issues are assigned to an owner
- **Issue Prioritization Monitoring:** Verify that security issues are prioritized based on severity

This integration is used to automate tests such as **Security Issues are Prioritized**, helping prove compliance with **vulnerability management and issue tracking policies**.

---

## Prerequisites & Data Access

### Fibery Access Requirements

- You must have **Admin access** to your company’s **Fibery workspace**.
- You must generate a **Fibery authentication token** (API token).
- Your Fibery configuration must use supported column field types (see below).

### Drata Role Requirements

- To create or modify connections, you must have one of the following **Drata roles with write access**: Admin, Workspace Manager, or DevOps Engineer
- **Access Reviewers** can view the connection page but cannot create or modify connections

---

### Permissions & Data Table

| Permission/Scope | Why It’s Needed |
|---|---|
| Fibery API token (inherits your user permissions) | Allows Drata to access your Fibery workspace data based on the token owner’s privileges |

---

## Supported Fibery Field Types

Because Fibery is highly customizable, Drata only supports certain **column field types** when retrieving security issue data. The supported fields can be identified by their **associated icons in Fibery**.

### Assignee / Owner Field

Your Fibery entity used for tracking security issues must include an **Assignments** column field type. This field is used to identify the **owner responsible for the issue**.

### Supported Tag Field Types

The field used for **security labels or tags** must use one of the following column types:

- **Text**
- **Single Select**
- **Multi Select**

### Supported Priority Field Types

The field used to indicate **issue priority** must use one of the following column types:

- **Text**
- **Single Select**

Using unsupported field types may prevent Drata from correctly identifying issue assignments, labels, or priorities when evaluating monitoring tests.

---

## Step-by-Step Setup

### Step 1: Retrieve a Fibery Authentication Token

Fibery tokens are generated from within the workspace and inherit the same privileges as the user generating them.

1. Log in to your **Fibery workspace** in a browser.
2. Open your browser’s developer console.
3. Run the following command:
   ```
fetch(`https://${window.location.host}/api/tokens`, { method: 'POST' })
  .then(res => res.json())
  .then(obj => console.log("Your API token:", obj.value));
   ```
4. Copy the token value printed in the console and store it securely.

Expected outcome:
 You have a **Fibery API token** for the workspace you want to connect.

---

### Step 2: Connect Fibery in Drata

1. Log in to **Drata** → go to the **Connections** page.
2. Navigate to your **Available Connections**.
3. Search for and start the **Fibery connection process**.
4. Enter the **Fibery API token** when prompted.

Expected outcome:
 Fibery is successfully connected to Drata.

---

### Step 3: Validate the Connection

Because Fibery is highly configurable, validate that Drata is pulling the expected entities and fields.

1. In Fibery, create a **test security entity** (with your security label/tag) **without a priority**.
2. In Drata, run the **Security Issues are Prioritized** test and confirm it **fails**.
3. Add a priority to the same entity in Fibery.
4. Re-run the test in Drata and confirm it **passes**.

Tip: If results don’t match expectations, open the test’s **raw data** view in Drata to confirm the entities and fields align with your Fibery setup.

Expected outcome:
Drata test results reflect the entities and fields in your Fibery workspace.

---

## Important Notes

- **Token permissions:** The Fibery API token has the **same privileges as the user** who generated it. Keep it secure and follow least-privilege practices.
- **Workspace-specific tokens:** Tokens **cannot be shared across workspaces**. If you want to connect an additional workspace, generate a **new token** in that workspace and create a separate connection in Drata.
- **Field type requirements:** If your entity fields use unsupported types (especially for **Assignments**, **Tags**, or **Priority**), Drata tests may not evaluate as expected.

## Related articles

- [Shortcut Integration Guide](shortcut-integration-guide.md)
- [GitLab Issues Integration Guide](gitlab-issues-integration-guide.md)
- [Target Process Integration Guide](target-process-integration-guide.md)
- [Zoho Bug Tracker Integration Guide](zoho-bug-tracker-integration-guide.md)
- [Azure Boards (DevOps) Integration Guide](azure-boards-devops-integration-guide.md)
