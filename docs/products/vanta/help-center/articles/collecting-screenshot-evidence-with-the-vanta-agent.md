# Collecting Screenshot Evidence with the Vanta Agent

Source: https://help.vanta.com/en/articles/13146167-collecting-screenshot-evidence-with-the-vanta-agent
Collection: Evidence Collection ; Evidence Collection › Documents
Fetched: 2026-11-17

## Article text

✅ Feature availability: You can use the Vanta Agent when AI is enabled <https://help.vanta.com/en/articles/11345365-enabling-or-disabling-vanta-ai> on a current plan <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta>. The specific agent capabilities available depend on your plan, enabled features, and user permissions.
 
The Vanta Agent can help you find and capture screenshot-based evidence for your document tests. The agent reads the evidence description for a document and determines what to collect. Then it navigates the relevant app, captures audit-ready screenshots, and checks that they meet the requirement before returning them for you to review.
 
⚙️ User permissions: Admins, Editors, and Audit Limited Editors can upload evidence across all documents. Collaborators can upload evidence for documents where they’re assigned as Document Owner. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Document eligibility
- 
The Vanta Agent can collect screenshot-based evidence for document tests where the evidence lives in a web page or web-based app—things like a configuration screen, dashboard, admin panel, or public web page, whether it's publicly accessible or behind a login.
- 
If the agent determines it can't collect evidence for a document, it will let you know—some document tests require evidence you write or upload yourself, like a policy, a signed agreement, or documentation of a process.
- 
This feature isn't available for restricted documents or if you're using Vanta for Government accounts.
 
 

## Third-party account access
- 
For security purposes, we recommend creating dedicated, read-only service accounts for the Vanta Agent to use during evidence collection when authentication is needed.
- 
This ensures the agent only has the minimal access needed to navigate your apps and capture screenshots, without exposing your primary credentials.
- 
When the agent hits a login wall, it pauses to ask you to enter credentials in the live browser view. Use your service account credentials to log in.
- 
Use a regular username and password, MFA (text or code), or SSO to log in. Biometric login (like TouchID) and hardware security keys aren't supported, since the agent uses a remote browser that can't access your device's hardware.
- 
The agent saves a session cookie after you log in, so you won't need to log in again until that session expires or the third-party app requires re-authentication.
- 
The agent operates in read-only mode—it will never create, modify, or delete anything in your apps. It only navigates and captures screenshots.
 
 

## Collecting screenshot evidence
To collect screenshot evidence, you'll need to authenticate into the relevant apps if prompted, then review and approve the screenshots the agent captured before they're uploaded to the document.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2645001562/97caefdc7a9fabd019f107bfd9df/image.png?expires=1794967200&signature=0d0cabc4bc5a9931536dba6fc65704086e0b98183c4ba1b67016f55477da659e&req=diYjE8l%2BnIRZW%2FMW1HO4zRqj3r4xILIkx%2FE8T1nMwytSFBgj8Vicw6EqS7Aa%0AXM%2FNrBhtpMRrLIrJ5%2BI%3D%0A>
 
To collect screenshot evidence with the Vanta Agent:
- 
Go to the Documents page and open a document.
- 
In the Evidence tab, click the Collect a screenshot button—this opens the Vanta Agent with a pre-filled prompt describing the evidence needed. The button location varies depending on the document status:
- 
The button is located in the Get started, Start renewal, or Draft section. 
- 
If there's no draft yet, click New draft or Renew to create one and reveal the button.
- 
Log in to the relevant apps if prompted.
- 
Monitor the agent's progress in the live browser view as it navigates and captures screenshots.
- 
Review the screenshots the agent captured and approve them before they're uploaded to the document—your explicit approval is required.
​
💡 Tip: You can also open the Vanta Agent directly from any page and enter a prompt describing the evidence you need.
 
 

## Example prompts
- 
Collect a screenshot showing MFA is enabled for our AWS root account
- 
Find my company’s privacy policy from https://trust.vanta.com/ <https://trust.vanta.com/> and upload the necessary evidence
- 
Refresh the screenshots for our vulnerability scan evidence
- 
Collect a screenshot of our operational alert dashboard from Datadog
- 
Capture a screenshot of our company's status page
 
 

## Chat history
- 
Your chats are automatically saved to your Vanta Agent chat history.
- 
If you close the chat or refresh the page during evidence collection, the agent may be interrupted mid-task.
- 
If evidence collection is interrupted, open the chat from your chat history and ask the agent to continue, or open a new chat to start fresh.

## Images

- [image 01] ../../images/ux/documents/collecting-screenshot-evidence-with-the-vanta-agent--01.png
