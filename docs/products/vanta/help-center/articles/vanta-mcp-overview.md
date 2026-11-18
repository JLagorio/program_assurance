# Vanta MCP Overview

Source: https://help.vanta.com/en/articles/15461008-vanta-mcp-overview
Collection: Integrations ; Integrations › Other Integrations & Connections
Fetched: 2026-11-17

## Article text

The Vanta MCP (Model Context Protocol) server connects external AI tools (like Claude Code, Claude Cowork, or Cursor) directly to your Vanta account. Check your compliance status, find failing controls, review vendor risk, and investigate vulnerabilities, all from whatever AI tool you already work in, using plain language.
 
Think of it as giving your AI tool a live window into your compliance program.
ℹ️ Note: The Vanta MCP is available to all Vanta users. Access through MCP reflects your Vanta role and permissions, so some capabilities remain available to Admins only.
 
 

## What is MCP
Getting two software systems to talk to each other used to require a developer. They'd review both products' API documentation, identify which specific endpoints to call, map the data formats between them, and write the integration code. Any time either side changed, whether it be a new field, a new endpoint, or even updated permissions, someone had to come back in and update the connection. It worked, but every integration was its own project.
 
MCP is an open standard that changes that model. Instead of hardwiring a specific connection between two systems, MCP gives AI tools a common language for talking to software. Connect your AI tool to an MCP server once, and the AI can figure out what data to ask for and how based on the task you give it, not a predetermined mapping built in advance.
 
The practical result: your AI tool stays connected to your software without requiring a developer every time something changes or a new workflow comes up.
 
 

## What it enables
⚠️ Note: Available capabilities may vary depending on your account configuration or plan and pricing. If a query returns no results for an area you know exists in your Vanta account, it may not yet be enabled. Contact Vanta support for details.
Once connected, you can use your AI tool to:
- 
Get instant, synthesized answers about your compliance program including framework status, failing controls, open issues, vendor risk, vulnerabilities, etc.
- 
Ask cross-program questions that would otherwise require visiting multiple pages ("what are the biggest gaps I need to fix before my audit?").
- 
Query people, personnel groups, devices, and access data across your organization. 
- 
Search your knowledge base and surface insights from your compliance history.
- 
Investigate vulnerabilities detected across your infrastructure, including CVE metadata and affected assets.
- 
Review, create, and update data processing activities, impact assessments (DPIAs, LIAs, and TRAs), and data processing controllers to support GDPR and other privacy framework requirements.
- 
Query impact assessments and questionnaires without leaving your AI tool.
- 
Produce outputs from your Vanta data (like status reports, risk summaries, and remediation plans) that you can share with your team or leadership.
- 
Take action directly from your AI tool, including creating or updating risks, updating issues, uploading policies, managing privacy impact assessments and processing activities, and linking risks or processing activities to impact assessments, all written back into Vanta.
For a full breakdown of what's possible, see Vanta MCP Capabilities <https://help.vanta.com/en/articles/15461211-vanta-mcp-capabilities> and the Vanta MCP Prompt Library <https://help.vanta.com/en/articles/15484790-vanta-mcp-prompt-library>.
 
 

## What you can query
The Vanta MCP gives your AI tool access to the following areas of your compliance program:
- 
Tests and Controls
- 
Frameworks
- 
Risks*
- 
Vulnerabilities
- 
People and Personnel
- 
Access Reviews*
- 
Audits*
- 
Policies and Documents
- 
Questionnaires and Assessments*
- 
Data Processing*
- 
Integrations
- 
Knowledge Base*
* These capabilities may not be active in your account depending on your account configuration or plan and pricing. If a query returns no results for an area you know exists in Vanta, it may not yet be enabled. Contact your Account Manager for details.
 
For a full breakdown of what's possible in each area, see Vanta MCP Capabilities.
 
 

## Supported AI tools
Vanta officially builds and maintains setup instructions for the following AI tools:
- 
Claude Code
- 
Claude Cowork
- 
Cursor
- 
Perplexity
See Connecting to Vanta MCP <https://help.vanta.com/en/articles/14094979-connecting-to-vanta-mcp> for step-by-step instructions for each.
Note: The Vanta MCP can also connect to any other AI tool that supports remote MCP servers, using the general connection pattern (server URL + OAuth). These connections aren't officially built or maintained by Vanta, so you may see a warning banner during setup. See Connecting other MCP-compatible clients <https://help.vanta.com/en/articles/14094979-connecting-to-vanta-mcp#h_7f38b3209e> in the Connecting to Vanta MCP <https://help.vanta.com/en/articles/14094979-connecting-to-vanta-mcp> article for general guidance.
 
💡 Tip: Any MCP-connected tool can surface failing tests, pull remediation context from Vanta, and generate Infrastructure-as-Code (IaC) fixes. The Claude Code Vanta plugin adds convenience slash commands (like /vanta:fix-test) and the ability to open draft pull requests directly from your terminal. For full setup instructions across all supported tools, see the Vanta Developer Docs <https://developer.vanta.com/docs/quickstart/remediate-with-mcp#remediate-a-failing-test-with-the-vanta-mcp>.
 
 

## Additional resources 
- 
Connecting to Vanta MCP <https://help.vanta.com/en/articles/14094979-connecting-to-vanta-mcp>
- 
Vanta MCP Capabilities <https://help.vanta.com/en/articles/15461211-vanta-mcp-capabilities>
- 
Vanta MCP Prompt Library <https://help.vanta.com/en/articles/15484790-vanta-mcp-prompt-library>
- 
Vanta MCP: Troubleshooting and FAQ <https://help.vanta.com/en/articles/15461420-vanta-mcp-troubleshooting-and-faq>

## Images

- none
