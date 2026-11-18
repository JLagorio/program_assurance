# Vanta CLI Overview

Source: https://help.vanta.com/en/articles/17313951-vanta-cli-overview
Collection: Integrations ; Integrations › Other Integrations & Connections
Fetched: 2026-11-17

## Article text

✅ Feature availability: Vanta CLI is in public preview. 
Vanta CLI is an open source command-line interface (CLI) for Vanta. It gives you a terminal interface to the Vanta API, so you can manage your trust program with commands instead of the Vanta web app. You can also use it from coding agents.
 
 

## Who can use Vanta CLI
Vanta CLI is available to admins today. To sign in, you need an OAuth client, which only users with Developer Console management permission can create.
If you aren't an admin, use Vanta MCP <https://help.vanta.com/en/articles/15461008-vanta-mcp-overview> instead. Vanta MCP uses your existing Vanta permissions, so you can only access what your role already allows.
 
 

## Get started
The Vanta CLI repository <https://github.com/OpenVanta/cli> has the current installation steps, command reference, and examples. Setup has four parts:
- 
Install Vanta CLI. Follow the installation instructions in the repository. Binaries are published for macOS, Linux, and Windows. To confirm the installation, run vanta version.
- 
Create an OAuth client. Open the Vanta developer console <https://app.vanta.com/settings/developer-console> and click +Create to create an application. 
- 
Enter a name and description. 
- 
For App type, select Manage Vanta. 
- 
For Access level, select Read or Read and write. 
- 
Click Create.
- 
Copy the client ID and client secret. You can’t view the client secret again after you create the application, so save it in a secure location before you leave the page.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2709274767/ea1609ef47aafe565e77c497044c/a5978f14-e1d8-45b8-aa68-d59a4e1ed656?expires=1794967200&signature=f8395a2712f60f3c40a2391c4a2283e43c5992c8efc5c5a83a6f761c525e41ce&req=dicnH8t5mYZZXvMW1HO4zSfVklaMIo2tvz%2FiWTmu%2F62CSP3LZNB3nXQcJERg%0A0Wqlr4X7CJV%2BzsFEC28%3D%0A>
- 
Find your API base URL. Use the URL for your region (see the table below).
- 
Sign in. Run vanta login, then enter the following when prompted: 
- 
API base URL: Press Eneter to accept the US default, or enter your regional URL.
- 
OAuth client ID and OAuth client secret: Enter the values you copied in step 2. 
- 
OAuth scope: Press Enter to accept the default, vanta-api.all:read vanta-api.all:write.
Treat your client ID and client secret like a password. Anyone who has both can use the access that the application grants.
 
To check that you're signed in, run a read command such as vanta controls list --page-size 50. If sign-in worked, the command returns a list of controls from your Vanta account. 
 
If sign-in fails. If vanta login returns oauth error (401): Unauthorized, check that the client ID and client secret match the values you copied when you created the application, and that the API base URL matches your region. If you no longer have the client secret, you can't view it again.
 
 

## API base URL by region
 | 
Region | 
API base URL
 | 
US | 
https://api.vanta.com/v1 <https://api.vanta.com/v1>
 | 
EU | 
https://api.eu.vanta.com/v1 <https://api.eu.vanta.com/v1>
 | 
Australia | 
https://api.aus.vanta.com/v1 <https://api.aus.vanta.com/v1>
 | 
Gov | 
https://api.vanta-gov.com/v1 <https://api.vanta-gov.com/v1>
Vanta CLI uses the US URL by default. If your account is hosted in another region, enter your regional URL when you run vanta login. If you're not sure which region your account is in, check the address you use to sign in to Vanta.
 
 

## What you can do with Vanta CLI
Vanta CLI uses the same API as the Vanta web app. You can run commands against resources such as controls, tests, policies, documents, vendors, and people. Run vanta <resource> --help to see the actions available for each resource.
 
For output formatted for coding agents, use the --agent-mode flag.
 
For examples and supported workflows, see the repository.

## Images

- [image 01] ../../images/ux/settings/vanta-cli-overview--01.png
