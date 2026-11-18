# Connecting to Vanta MCP

Source: https://help.vanta.com/en/articles/14094979-connecting-to-vanta-mcp
Collection: Integrations ; Integrations › Other Integrations & Connections
Fetched: 2026-11-17

## Article text

This guide explains how to connect Vanta MCP to Claude Code, Claude Cowork, Cursor, or Perplexity, plus general guidance for connecting other MCP-compatible AI tools.
Note: Vanta’s remote MCP server is currently in beta and released to all customers. 
​
​Note: The below examples are based on the URL for US instances. If your company resides in the EU or AUS, please use the appropriate endpoint for your region:
​
EU: https://mcp.eu.vanta.com/mcp <https://mcp.eu.vanta.com/mcp>
AUS: https://mcp.aus.vanta.com/mcp <https://mcp.aus.vanta.com/mcp>
 

## Prerequisites
Before connecting, confirm the following:
- 
Vanta role: Any Vanta user can connect to the MCP server. Access through MCP reflects your Vanta role and permissions, so some capabilities remain available to Admins only.
- 
Supported AI tool: You need access to at least one of the following: Claude Code, Claude Cowork, Cursor, or Perplexity. These are the tools Vanta currently builds and maintains dedicated setup instructions for below.
- 
For the Claude Code plugin only: Your repository must be accessible from Claude Code if you intend to use code fix and pull request features.
ℹ️ Note: Vanta's MCP server can also connect to other MCP-compatible AI tools beyond the ones listed above. See Connecting other MCP-compatible clients below for general setup guidance.
 

## Claude Code
You can connect by adding the MCP server manually or via the Vanta plugin: 
 

## Option 1: Manual MCP setup
- 
Run the following command in your terminal:
claude mcp add --transport http vanta https://mcp.vanta.com/mcp <https://mcp.vanta.com/mcp>
- 
In Claude Code, run  /mcp  and select vanta to authenticate. This will open up a webpage in your Vanta app to authorize MCP. Click Allow.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2173408593/967a00de9aab373430986da4c849/5e507ebe-6662-4f0b-bcad-993d027b7df7?expires=1794967200&signature=476037d5f6ef6bfdc297d51635cee8253e942380f3d7c4815923a61f552f3b9b&req=diEgFc1%2BlYRWWvMW1HO4zdGcZPo4pNYg3ztDBMrFsGMngBCXkitaxf1Dz5SF%0AhbtsoWRjr1CHA%2BUY0Ss%3D%0A>
- 
Once complete, you are ready to start using the Vanta MCP server.
Note: Manual setup gives you access to all Vanta MCP tools but does not include the plugin's built-in skills (/vanta:fix-test, /vanta:list-tests). 
 

## Option 2: Claude Code plugin 
The Vanta plugin <https://github.com/VantaInc/vanta-mcp-plugin/> connects Claude Code to Vanta’s MCP server, purpose-built remediation skills, and commands all in one easy-to-download package. It enables users to discover and prioritize failing tests, generate infrastructure-as-code fixes directly in their repository, open pull requests without leaving their editor, and much more.
- 
Within Claude Code, run: /plugin marketplace update anthropics/claude-plugins-official
/plugin install vanta-mcp-plugin@claude-plugins-official
/reload-plugins
- 
Authenticate: Run /mcp, select Vanta, choose your region, and complete the OAuth flow in your browser.
Once connected, you will have access to the following: 
- 
A remediation skill that combines MCP data with your local repo context to generate targeted IaC fixes
- 
Slash commands that streamline common workflows into single actions
- 
- /vanta:fix-test — generate code changes to fix a failing compliance test and open a PR
- 
- /vanta:list-tests — show prioritized failing tests relevant to your codebase 
 

## Claude Cowork

### Step 1: Install the plugin 
- 
Add the Vanta plugin from the Claude Cowork plugin directory. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509778668/82fce2b5d7cfcfa6bbf342d0d6e4/ef41d7d6-ef68-4bf3-91fe-5103dae65780?expires=1794967200&signature=636fa54d496e387af86b500b87eb97c67b0e57dfd366f28776b53c3e835a4605&req=diUnH855lYdZUfMW1HO4zdWgra%2FpiATfR7Sav7qmk55Q03VRLb%2BxEkMLoYrE%0ADxcmdFwRRDdetrX2Qi8%3D%0A>
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509782016/659fe7b44acc963c0e6367f95dc4/a6ae7f01-4c66-46c1-badc-39f6550607d7?expires=1794967200&signature=f453d52be28b64f44911d5be035fcf662273b64268b1c74cb91ad31f966df137&req=diUnH852n4FeX%2FMW1HO4zT8SgpvzqnqJVtGEC8k8D830n8xhEauTHOTOA9Rs%0A0JPyVr6q0kSlr%2FynwYY%3D%0A>
 

### Step 2: Connect the Vanta MCP server
Before you can use the plugin, you must connect the Vanta MCP server: 
- 
In Claude Cowork, go to Manage Plugins.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509784953/8dac2b35478e8551c3d86036d342/3ffb7f96-260b-42bf-9f38-d5f2f604bc4e?expires=1794967200&signature=869fdcd1e31e5134bdb59cb449a2ad213cdb738dbdc0a672df5b8405c2682906&req=diUnH852mYhaWvMW1HO4zTe%2B%2F1uJ26zo3TB2vmBSYpEJgh2f8o41M9A5mYqt%0AHpaf46oEd07cZE%2B84Rc%3D%0A>
- 
Select the Connectors tab.
- 
Install the MCP as a custom connector for your region. 
- 
US: https://mcp.vanta.com/mcp 
- 
EU: https://mcp.eu.vanta.com/mcp 
- 
AUS: https://mcp.aus.vanta.com/mcp
⚠️ Note: You must have permission to add custom connectors. If you don't have this permission, ask an administrator in your organization.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509844129/8534cafaa9262ef41bf7fe18f739/3ef338bb-3b97-43ba-b755-2af0ba5b435e?expires=1794967200&signature=d67cdd33fd6143e23abcffc1464f1012ea6af16b5a22399eac09715df1f579f9&req=diUnH8F6mYBdUPMW1HO4zT32Jv%2BhcIY5hRYZaZQKIGiT%2FV%2BT6WPEj5KXW1MI%0ADGQZlI4IoFCuhDaMepY%3D%0A>
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509785765/af64fd9c23b8ab3ef2778906d175/afc8a1f7-ec41-49ec-b3e8-0fc7f0eec2f1?expires=1794967200&signature=a45dfefa3e1b296eee751c8dce393fcf2eaa6de049a1d8eca2abf86ce4dd445f&req=diUnH852mIZZXPMW1HO4zWHSEHIXaVD%2FbVPMLwSRuIeubxTFJX5SeGObXonI%0AqVEsH3WB1B%2BiD5Kfyr4%3D%0A>
- 
Complete the OAuth flow to authorize Vanta. 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509802596/c2881a4a03b34a31efbb1ed81fe1/c50fd47f-387d-4b3b-b903-5403910d93d6?expires=1794967200&signature=819738e12e9b926dcceac4453f428dafa749ff34be8326fa7c467dddb9152566&req=diUnH8F%2Bn4RWX%2FMW1HO4zX0nYpw1yhA%2FH7l4VcEeaZMTPnKb6BhBt0FriVeF%0AC1mCk%2Fbv2Ntsfbgo5y4%3D%0A>
 
 

### Step 3: Start using Vanta in Claude Cowork
Once the Vanta MCP connector and plugin are both installed, you're ready to use Vanta within Claude Cowork. 
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2509805428/a6078809cc8906b160c72e3e76cf/52ec585d-c8d9-432d-8c5d-1b6f42aa15eb?expires=1794967200&signature=76eadcf51735f82156ded157dc14109a5c946a064cdee43349287cc23bdfc0ba&req=diUnH8F%2BmIVdUfMW1HO4zQJyLSk8M5R39WuetLMN2vEhYkhgtpaArSJP4JxR%0AXhMfJIblZFtcS1CQ%2FII%3D%0A>
 
 

## Cursor
- 
Open Settings in Cursor.
- 
Select Tools & MCP → Add custom MCP.
- 
Add the following configuration:{
  "mcpServers": {
    "vanta": {
      "url": "https://mcp.vanta.com/mcp"
    }
  }
}
⚠️ Note: Cursor connects directly to the Vanta MCP server and has access to all Vanta tools. However, the Claude Code plugin skills (/vanta:fix-test, /vanta:list-tests) are Claude Code-specific and are not available in Cursor.
 
 

## Perplexity 
- 
Set up a remote customer connector <https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors>
- 
For the URL, enter: https://mcp.vanta.com/mcp <https://mcp.vanta.com/mcp> 
- 
For Authentication, select OAuth.
 
 

## Microsoft Copilot Studio
Copilot Studio connects to external MCP servers through an agent. Create an agent, then add Vanta MCP as a tool.
 

### Before you begin
You need: 
- 
Access to Microsoft Copilot Studio, with permission to create agents and add tools.
- 
A Vanta account that can authorize the connection.
- 
Your Vanta region (US, EU, or AUS), which determines the server URL you use.

### Connect Vanta MCP
- 
Go to copilotstudio.microsoft.com <https://copilotstudio.microsoft.com> and select Agents in the left navigation.
- 
Select New agent (or Create your first agent if you don’t have one yet), then name the agent, for example “GRC Agent with Vanta.”
- 
In the right panel, next to Tools, select +.
- 
In the Add a tool dialog, select MCP, then select + Add.
- 
In the Add MCP server dialog, enter the following:
- 
Server name: A name of your choice, for example “Vanta MCP.”
- 
Server description: A short description of what the server does.
- 
Server URL: The URL for your Vanta region:
 | 
Region | 
Server URL
 | 
US | 
https://mcp.vanta.com/mcp
 | 
EU | 
https://mcp.eu.vanta.com/mcp
 | 
AUS | 
https://mcp.aus.vanta.com/mcp
- 
Under Authentication, select OAuth 2.0, then set the configuration type to Dynamic.
- 
Select Add, then create a new connection when prompted. You’re redirected to Vanta.
- 
On the Vanta Authorize App screen, review the access requested and select Allow.
⚠️ Note: You may see an “Unrecognized redirect URL” warning on this screen. This is expected when you connect through a third-party platform. Review the request and select Allow only if you trust the application.
- 
Back in Copilot Studio, confirm the connection shows a green check, then select Add.
For additional information, see Connect your agent to an existing MCP sever (Microsoft documentation) <https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent>. 
 
 
 

## Connecting other MCP-compatible clients
Vanta's MCP server can connect to any AI tool that supports the Model Context Protocol, not just the tools listed above. If your tool isn't listed, you can typically connect it using the following general pattern:
 
- 
Server URL: https://mcp.vanta.com/mcp (or the appropriate regional endpoint above)
- 
Authentication: OAuth
Check your AI tool's documentation for exactly where to enter these details, since setup screens vary by tool.
⚠️ Note: Since these tools aren't officially built or maintained by Vanta, you may see a warning banner during setup indicating the connection isn't an official Vanta-supported integration. This is expected. Review the tool's access request and proceed if you trust it.

## Images

- [image 01] ../../images/ux/integrations/connecting-to-vanta-mcp--01.png
- [image 02] ../../images/integrations/to-mcp/connecting-to-vanta-mcp--02.png
- [image 03] ../../images/integrations/to-mcp/connecting-to-vanta-mcp--03.png
- [image 04] ../../images/integrations/to-mcp/connecting-to-vanta-mcp--04.png
- [image 05] ../../images/integrations/to-mcp/connecting-to-vanta-mcp--05.png
- [image 06] ../../images/integrations/to-mcp/connecting-to-vanta-mcp--06.png
- [image 07] ../../images/ux/integrations/connecting-to-vanta-mcp--07.png
- [image 08] ../../images/integrations/to-mcp/connecting-to-vanta-mcp--08.png
