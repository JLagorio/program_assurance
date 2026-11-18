# Create, Schedule, and Manage Custom Agents

Source: https://help.vanta.com/en/articles/16397022-create-schedule-and-manage-custom-agents
Collection: Getting Started Hub ; Getting Started Hub › Vanta AI
Fetched: 2026-11-17

## Article text

✅ Feature availability: This article discusses a feature available to all Vanta packaged plans with Vanta Agent access.

## Overview
Custom agents let you automate recurring governance, risk, and compliance work in Vanta. A custom agent runs on a schedule or on demand, using natural-language instructions you write, extending Vanta Agent, the AI assistant available throughout Vanta, into repeatable background work instead of a single chat conversation.
 
For example, a custom agent could run on a recurring schedule to check which employees haven't accepted required policies and surface only the exceptions that need follow-up, or to check which evidence requests are due soon and surface suggested next steps.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2669840845/c6e8450abd819ab0a9f61b2c5458/image.png?expires=1794967200&signature=946652737a932f568b953d8ee7d82e227d2cc0245a853b6dd2b93305191e87e2&req=diYhH8F6nYlbXPMW1HO4zYSNbggaOIaUGeCifpI3ox3Jad%2BjxgghIBFaQIG4%0AJUoeDrYbvoHY5FT0Amk%3D%0A>
 
 

## What custom agents can do today 
Custom agents are built on the same underlying capabilities as Vanta Agent. Anything Vanta Agent can do, a custom agent can do autonomously in the background. If a scheduled task is out of reach right now, that shows up in the agent's run log rather than happening automatically.
 

### Example workflows
- 
Policy acceptance follow-up: On a recurring schedule, an agent checks which employees haven't accepted required policies and surfaces only the exceptions that need your attention, giving you a current list of outstanding employees, ready-to-review follow-up actions, and a full history of every run.
- 
Evidence request management: On a recurring schedule, an agent checks which evidence requests are due soon and surfaces suggested next steps. This gives you a current list of upcoming requests, actionable follow-ups, and a logged history of every run.
 
 

## Who can use custom agents
Custom agents are available to the following roles:
- 
Admin
- 
Editor
- 
Trust Admin
- 
Integrations Manager
- 
Privacy Manager
- 
Access Admin
- 
Audit Limited Editor (via delegation)
View-Only Admin, Collaborator, Trust Collaborator, standard Employee, and Auditor roles do not have access and won't see custom agents in navigation.
 
Each custom agent runs with the permissions of the person who created it. If your permissions change, your agent's permissions change with them.
 
Custom agents are currently personal to their creator. Only you can see the agents you create and their run history. Admin-wide visibility across all agents in your organization is not yet available.
 
 

## Create an agent 
- 
Go to the Vanta Agent from the lefthand navigation. 
- 
Click Agents.
- 
Click Create agent. This button is available from the Agents, Activity, and Templates pages.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2669846080/32527b4f8b3942aa0301191d2112/image.png?expires=1794967200&signature=80a90efa74eb8c14230f7fd991cc934c1d7c4cd89b9b57e3d84c0dcc0362e631&req=diYhH8F6m4FXWfMW1HO4zQUPXs6My8gmLeZxUHjyDyx2ReRxuNgAaoNFZnn7%0A6ZMuH9RatreIKiUSukk%3D%0A>
- 
In the Create an agent window, enter a Name for the agent and describe what it should do under What should this agent do?
- 
Under When should this run?, choose a schedule:
 | 
Option | 
What it does
 | 
Manual | 
The agent only runs when you trigger it yourself
 | 
Daily | 
Runs once a day at a time you set
 | 
Weekdays | 
Runs Monday through Friday at a time you set
 | 
Weekly | 
Runs once a week on a day and time you choose
- 
If you chose Daily, Weekdays, or Weekly, set the time (your local timezone is applied automatically).
- 
Click Save.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2669858382/f036202c12219f8d0b5ec97234b8/image.png?expires=1794967200&signature=6f89c90d7ec1f053a5f81c90c47f1d752635f19532fa398a56126e24532597f2&req=diYhH8F7lYJXW%2FMW1HO4zRrv%2FAIE3xBX8q8%2F7dRS7INzx0JbyN82Aeh8M1eo%0A8xhnNmQRkV3KIZ%2Bu6Is%3D%0A>
 
The creation window also reminds you that the agent will run with your permissions, and notes that some actions aren't available yet. See What custom agents can do today above.
 
 

## Use a template
The Templates page provides a set of Vanta-built agent templates that solve common compliance problems, so you don't have to write a prompt from scratch.
To create an agent from a template:
- 
Go to the Vanta Agent from the lefthand navigation.
- 
Click Agents, then open the Templates page.
- 
Click a template to review it.
- 
Customize the template's details, such as its name, instructions, or schedule, to fit your needs.
- 
Click Save. The agent is added to your Agents page, where you can manage and run it like any other agent.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2669879459/5bd19801a0cd830de54a8d70bc0e/image.png?expires=1794967200&signature=8fc642485e548dc5bb3e84185aec8b8ba51eeb676fa79e5ab6f0a661d59ec877&req=diYhH8F5lIVaUPMW1HO4zUpzm99KdWEFSsNEWAHUZZMNCwETuMtV3GZ0gpHl%0AqRhxovdwBBlfghNVp%2BU%3D%0A>
 
 
 

## Manage your agents
From the Agents page, use the actions on each agent's row to:
- 
Edit: update the name, prompt, or schedule.
- 
Deactivate: pause an agent without losing its configuration.
- 
Reactivate: turn a deactivated agent back on.
- 
Run now: trigger an on-demand run any time; you don't have to wait for the next scheduled run.
You can also search your agents by name or description, or filter the list by Trigger (Schedule, Event, or Manual) and Status (Active or Inactive).
 

### Run an agent
- 
From the Agents page, find your agent, click the three dot button and click Run now to trigger it on demand.
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2669865481/4c53fbf1fb1931838ba7d2541448/image.png?expires=1794967200&signature=c8f9c2aafd5e3818d01922f0f7bc67588ef5c1f1f4e70e392177413f6ab20d0d&req=diYhH8F4mIVXWPMW1HO4zSetuJ43vhz%2FefaXzpLgYY%2FykFGgDV3BGjQa8Nnx%0AsfNJVow9LnlHGterb4Y%3D%0A>
 

### Monitor runs 
- 
Go to the Activity page to see the history of every run across your agents, including its status.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2669871911/aaa6462cd28e1ee9cfb2fe6d0b01/image.png?expires=1794967200&signature=5fb9cdc369c4ce9e58cdf62758fa83be110c6493f55cb2cfc0bbd4945aa860ee&req=diYhH8F5nIheWPMW1HO4zUmWBPmbG2q5izxtHhKws2ZcWm7Y3Ew2ca618wHA%0Ar0op8WeDZfq5Beb6Djc%3D%0A>
- 
Click into any run to open its full conversation and see exactly what the agent did.
- 
You can filter the Activity page by Agent or by Status, or search for a specific agent by name.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2669874692/0962f1e9c2e29ac1a9e006545c8b/image.png?expires=1794967200&signature=212929d5ed51eca4ad9e9e8a69b7336c34fd169813608efd6433a6a78f7d1baf&req=diYhH8F5mYdWW%2FMW1HO4zWuonoJjI%2FbDwrDnLqd1Eegv8bwcIAFcy%2FfTQO1E%0Aon9vbJoeSYqqMHK2QU4%3D%0A>
 
Custom agents currently have one run status: Needs approval. Runs with this status are grouped under Blocked agents in the sidebar. Expand the Blocked agents section, then click View all to open a filtered list of all blocked runs. See below for what this means and how to resolve it.
 
If your organization has Slack connected, you'll also get a Slack notification when a run needs your approval. This is on by default. You can turn it off by clicking your initials in the top right, then click My Notification Settings. 
 

### If a run is blocked
 | 
Status | 
What it means | 
What to do
 | 
Needs approval | 
The agent has a suggested change (like a policy or SLA update) that requires your sign-off before it can continue. | 
Open the run, review the suggested change, and approve or reject it. The run clears once you respond.

## Images

- [image 01] ../../images/ux/ai/create-schedule-and-manage-custom-agents--01.png
- [image 02] ../../images/ux/ai/create-schedule-and-manage-custom-agents--02.png
- [image 03] ../../images/ux/ai/create-schedule-and-manage-custom-agents--03.png
- [image 04] ../../images/ux/ai/create-schedule-and-manage-custom-agents--04.png
- [image 05] ../../images/ux/ai/create-schedule-and-manage-custom-agents--05.png
- [image 06] ../../images/ux/ai/create-schedule-and-manage-custom-agents--06.png
- [image 07] ../../images/ux/ai/create-schedule-and-manage-custom-agents--07.png
