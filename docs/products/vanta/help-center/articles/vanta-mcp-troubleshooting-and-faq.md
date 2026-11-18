# Vanta MCP: Troubleshooting and FAQ

Source: https://help.vanta.com/en/articles/15461420-vanta-mcp-troubleshooting-and-faq
Collection: Integrations ; Integrations › Other Integrations & Connections
Fetched: 2026-11-17

## Article text

## Getting Connected
Which AI tools support the Vanta MCP? 
- 
The Vanta MCP works with any AI tool that supports remote MCP servers, including Claude, Cursor, Perplexity, and Codex. If your tool supports MCP, it should work. Check the Connecting to Vanta MCP <https://help.vanta.com/en/articles/14094979-connecting-to-vanta-mcp> article for setup instructions specific to your tool.
I connected successfully but the AI isn't returning any Vanta data. What's wrong? 
A few things to check:
- 
Confirm you authorized the correct permissions when you connected. The MCP requires at least read access to your Vanta account. If you need write actions (like creating risks or uploading policies), you'll need to re-authorize with write permissions enabled.
- 
Make sure you're querying something that exists in your account. If your Vanta account has no vendors, for example, a vendor query will return empty. That's expected, not an error.
- 
Try a simple test prompt first: "List the compliance frameworks in my Vanta account." If that returns data, your connection is working and the issue is likely with the specific query.
My MCP connection isn't working or I'm getting an authentication error. What should I do?
- 
The fix for most connection and authentication issues is the same: remove the existing MCP connection in your AI tool and re-add it. This starts a fresh OAuth flow and issues a new token. If that doesn’t resolve it, check the following: 
- 
Your Vanta account is still active
- 
Your Vanta role still has the permissions needed for what you're asking the MCP to do
- 
If using a config file (Cursor, Codex), the server URL is exactly
- 
US: https://mcp.vanta.com/mcp <https://mcp.vanta.com/mcp>
- 
Europe: https://mcp.eu.vanta.com/mcp <https://mcp.eu.vanta.com/mcp>
- 
Australia: https://mcp.aus.vanta.com/mcp <https://mcp.aus.vanta.com/mcp> 
- 
Common causes of a connection that worked and then stopped: expired session, a change to your Vanta account role or permissions, or an AI tool update that affected MCP handling.
 
 

## Data and Results
The MCP is returning incomplete or outdated data. Why? 
- 
The MCP reflects your Vanta account's current state, which depends on how recently your integrations have synced. If a test result or control status looks stale, check whether the relevant integration is connected and syncing in Vanta > Integrations. Data is only as fresh as your last successful sync.
💡 Tip: You can also ask the MCP to 'check the status of my connected integrations' to see if anything is disconnected.
 
I asked about a specific framework but got no results. 
- 
The MCP only returns data for frameworks that are active in your Vanta account. If you're asking about SOC 2 but haven't set it up in Vanta, there's nothing to return. Confirm the framework is active under Vanta > Frameworks.
I asked about vendors but the list seems incomplete. 
- 
Only vendors that have been added to Vanta will appear in a standard vendor query. If you're missing vendors, they may not have been formally added to your program yet, but they may still appear as discovered vendors. Try asking specifically for "discovered vendors" or "discovered vendor accounts" to see what Vanta has detected in your environment that hasn't been formally onboarded.
I asked about vulnerabilities but nothing came back. 
- 
Vulnerability data in Vanta is populated by connected integrations (such as vulnerability scanners or cloud provider security tools). If no relevant integrations are connected, the vulnerability list will be empty. Check your integrations in Vanta > Integrations to confirm the right sources are connected and syncing.
I asked about questionnaires or impact assessments but nothing appeared. 
- 
Questionnaires and impact assessments only appear if they've been created in your Vanta account. If your program hasn't used these features, results will be empty. Check Vanta > Questionnaires and Vanta > Assessments to confirm whether any exist.
The MCP is showing controls as failing that I know have been remediated. 
- 
Control status depends on automated test results and manually uploaded evidence. If a control was remediated but the underlying test hasn't re-run yet, or evidence hasn't been uploaded, it may still show as failing. Check the control in the Vanta UI to confirm its evidence and test status.
I'm not seeing all my issues. It looks like some are missing. 
- 
By default, queries may return a subset of results. Try being more specific: ask for issues by status (open, in progress, resolved), by framework, or by severity. If you believe data is genuinely missing, check whether your Vanta role has the correct permissions to access all issue types.
 
 

## Write Actions
What can the MCP actually write back to Vanta? 
- 
Write actions include: creating or updating a risk, updating an issue's status, uploading a policy document, and managing your privacy program — creating, updating, or deleting processing activities and categories, privacy impact assessments (DPIAs, LIAs, and TRAs), and data processing controllers, plus linking or unlinking processing activities and risks to impact assessments.
I updated an issue via the MCP but the change isn't showing in Vanta. 
- 
Wait several minutes for the change to propagate, then refresh your Vanta browser session. If the change still isn't showing after a few minutes, the write action may have returned an error silently. Ask your AI tool to confirm whether the action completed successfully.
I created or updated a privacy record (processing activity, impact assessment, or controller) via the MCP but the change isn't showing in Vanta.
- 
Wait several minutes for the change to propagate, then refresh your Vanta browser session. If it's still not showing, the write action may have returned an error silently. Ask your AI tool to confirm whether the action completed successfully.
 
 

## Permissions and Access
Do I need to be an admin to use the Vanta MCP?
- 
No. Any Vanta user can connect to the MCP and use it. Your access through MCP mirrors your Vanta role and permissions, so a small set of capabilities (like generating draft policy content) is limited to Admins. 
Can multiple people on my team use the MCP?
- 
Yes, but each person should connect individually using their own Vanta account. This ensures that MCP actions are tied to the correct user, and revoking one person's access doesn't affect anyone else. Each user will go through their own OAuth authorization flow when they first connect.
Some areas of my program — like questionnaires or data processing activities — aren't returning any data. Is that a permissions issue? 
- 
Not necessarily. These modules may simply not be in use in your Vanta account yet, or they may not be included in your current plan. Check whether the relevant features are active in your Vanta account before assuming it's a permissions issue. If you're unsure, contact Vanta support.
 
 

## General
Is the Vanta MCP available on all plans? 
- 
The Vanta MCP is available to all customers.
Where do I go if I'm still stuck? 
- 
Reach out to Vanta support, or visit the Vanta Community <https://help.vanta.com/en/articles/14025945-joining-the-vanta-community> to see if others have run into the same issue.

## Images

- none
