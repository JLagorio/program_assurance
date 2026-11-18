# Getting Started with Workspaces

Source: https://help.vanta.com/en/articles/11345360-getting-started-with-workspaces
Collection: Getting Started Hub ; Getting Started Hub › Getting Started Guides
Fetched: 2026-11-17

## Article text

This guide will walk you through how to enable and configure workspaces in Vanta, step by step. Whether setting up your first instance or managing several business units, you'll learn how to navigate, configure, and manage each workspace confidently.
 
 

## Overview
Workspaces allow you to manage multiple Vanta environments under a single umbrella account. This is helpful for organizations with:
- 
 Multiple product lines or business units
- 
 Subsidiary or parent-child company structures
- 
 Different teams needing separate compliance environments
Each workspace acts as its own instance of Vanta, with its own integrations, policies, users, and frameworks. Once Workspaces are enabled, you can easily move between these instances without needing to log in or out of separate accounts.
 
Not sure where to begin? Take the Getting Started in Vanta <https://learningvanta.sana.ai/> course in Vanta Academy.
 
 

## Enabling workspaces
To get started with workspaces, Vanta needs to turn on the feature for your organization.
- 
Contact your Customer Success Manager to request access
- 
A member of the Vanta team will help you activate Workspaces
Once workspaces are enabled, you’ll see a new workspace selector in the top-left corner of your screen.
 
How the First Admin is Assigned
- 
After a workspace is created, the first admin is automatically assigned during setup, typically the person who initiated the request. This person is added to the Workspace Console by default and has permission to manage users and access across all workspaces.
- 
If you need to add more admins, the initial admin can do this directly from the Workspace Console. To learn how, follow the steps in the Manage User Access Across Workspaces section.
Not sure who was assigned as the first admin?
- 
Reach out to Vanta Support <https://help.vanta.com/hc/en-us/community/posts/12667569909140-How-to-Use-In-Product-Support> for help identifying or updating the original admin.
 
 

## Navigating between workspaces 
Once Workspaces are enabled, you’ll be able to access all your Vanta instances from one place.
- 
Look in the top left-hand corner of your screen
- 
Hover over the currently selected instance
- 
Select the workspace you want from the dropdown menu
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2658871970/3ed46cb6978bc6cb35054e663167/Screenshot%2B2025-11-11%2Bat%2B3_45_45-E2-80-AFPM.png?expires=1794967200&signature=2c0fb76d0a45c6ad83791ba0985808fa715db102169f505207479b479bc37c2a&req=diYiHsF5nIhYWfMW1HO4zbXFhhFaFVk1Dp1y3Ofb2zrTiumKYYBHvtt24juJ%0Avsn7%0A>
Please note: If you're already logged into your Vanta instance, log out and then log back in using your magic link to enable the workspace.
 
 

## Understanding workspace domain switching
By default, users can access workspaces and domains based on how they log in to Vanta:
- 
When logging in via email:
Users automatically have access to any domain where their email address matches an existing user record, even if that domain is outside the current workspace.
- 
When logging in via SSO:
Users can access domains that share the same SSO provider configuration within that workspace. For example, if two domains use the same Okta SSO connection, a user can move between them without reauthentication.
Please note: If a user cannot see the workspace switcher, it usually means their user accounts across domains have not been linked yet. You can manually link user accounts to resolve this. 
 
 

## Editing company information in each workspace
You’ll need to update company details in every individual workspace.
- 
Select Settings from the header
- 
Click Information
- 
Add the correct company information
- 
Click Update Information
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516755562/c55077ffc43428ff8e8c3cfd0d90/36268277807892?expires=1794967200&signature=0bf28c91c62be8fd1aa5d9e06af7dd7b5e476122f6003f03ec1c6512a040de2a&req=dSUmEM57mIRZW%2FMW1HO4zZf%2B6vCL3udfdSw65WhZn%2B8WVMzS%2B5SLYbPziIOM%0A1A23BiyiIbJe%2F%2BUmkmg%3D%0A>
 
 

## Setting up each workspace
Each workspace functions as its own environment and needs to be provisioned separately. You’ll want to:
- 
Connect integrations <https://help.vanta.com/en/articles/11345761>
- 
Write or assign policies <https://help.vanta.com/hc/en-us/search/click?data=BAh7DjoHaWRsKwgU%2FheQVRo6D2FjY291bnRfaWRpA%2FLHjToJdHlwZUkiDGFydGljbGUGOgZFVDoIdXJsSSJaaHR0cHM6Ly9oZWxwLnZhbnRhLmNvbS9oYy9lbi11cy9hcnRpY2xlcy8yODk1NDc5MjAzMzgxMi1HZXR0aW5nLVN0YXJ0ZWQtd2l0aC1Qb2xpY2llcwY7CFQ6DnNlYXJjaF9pZEkiKWZjMGYwNjEyLTMyNzEtNDI4OS1iMzdlLWYyYWQyNjNmM2VmYgY7CEY6CXJhbmtpCToLbG9jYWxlSSIKZW4tdXMGOwhUOgpxdWVyeUkiDXBvbGljaWVzBjsIVDoScmVzdWx0c19jb3VudGkBtQ%3D%3D--de0757ec92c684c0c432ffa662a141227f47ad3e>
- 
Create user groups <https://help.vanta.com/en/articles/11345836>
​
 

## Using the workspace console
 
Workspace Console gives admins a high-level view across all workspaces. By default, your primary admin is the first user added. That admin can add more users to the console,
- 
 To log in for the first time:
- 
 Use your email
- 
 Go to the Workspace picker
- 
 Select Workspace Console
From here, you can manage users across all your workspaces.
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516755565/8ee8651f753f86c3a1d89bc2c331/36268289066900?expires=1794967200&signature=9fde63c83405b8b230d47750c52031dadedfd448b9396e9619428e270a6cb3bf&req=dSUmEM57mIRZXPMW1HO4zfGDYwX5AJeA%2BN8qUW%2FJHKkMj8qTkDH1%2BlN7lKmT%0A6YjztgO2nmW9wQHXqd8%3D%0A>
 
 

## Tracking progress in the workspaces dashboard
The Workspaces Dashboard gives you a snapshot of each instance's status. You can view framework progress and track compliance status for each workspace.
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516755580/2d337ead0583eef6fb6359523340/36599402497940?expires=1794967200&signature=0a54ba93f8c14be64eaf57b29c07a6fccad1c65cda28cd4ea49cd6660fca1369&req=dSUmEM57mIRXWfMW1HO4zSLT3AryYBAi56k%2BNgn%2BltPw3NagpH7qYx5rRhbT%0ApG43%2BnZ24wBolNCy1nM%3D%0A>
 
 
 

## Syncing users into a workspace
If you're using an identity provider (IdP) like Okta, Google Workspace, or Azure AD, you can automatically sync users into your Vanta Workspaces. This makes it easy to manage user access and keep your people list up to date.
 
To sync users into a workspace:
- 
 Navigate to the desired Workspace using the workspace picker in the top-left corner
- 
 Go to Integrations in the left-hand menu
- 
 Select your Identity Provider (e.g., Okta, Google Workspace, Azure AD)
- 
 Follow the prompts to connect and authorize the integration
- 
 See detailed setup steps in Vanta & Identity Providers (IdPs) <https://help.vanta.com/en/articles/11345653>
- 
 Once connected, Vanta will sync users into the workspace from your IdP
- 
 Head to the Users page to review synced users
- 
 Open a user’s drawer to assign a role and adjust workspace access
Note: Each workspace must be connected to your IdP individually. If you're using SCIM or group-based provisioning, you'll want to configure that per workspace too.
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516755589/6b65f36b5e484514c498f112f9bd/36309663095956?expires=1794967200&signature=7bb617e4e18b76e28b39676d4d93273fda3f1ea6467223f4350c105964a030b6&req=dSUmEM57mIRXUPMW1HO4zRhQuWlElDaok%2FAylcmcn23DBDvLIHljQQpPgaJP%0ApSvsTcbekL4Z81WaeT4%3D%0A>
 
 
 

## Managing user access across workspaces
The Users page gives you a full view of who has access to Vanta and what workspaces they’re connected to. From this page, you can add new users, manage access, and assign roles across all your Workspaces.
 

### Adding a New User 
To add a new user:
- 
 Click the Add user button
- 
 Enter the first name, last name and email address
- 
 From there, select the workspaces to assign to the user
- 
 And assign one or more roles based on the user’s responsibilities
 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516755594/af33c5c3a2207c4f9746ca1403c8/36302467883028?expires=1794967200&signature=f38110def98f768b81140b3e64044a8cb396b3eec3f43aab2cc87378f6da2caf&req=dSUmEM57mIRWXfMW1HO4zVn6X7KzcujavYMmhFVroUIZtvNDbBzcmITndDnx%0Acmdct7vw74u5bI2VJnY%3D%0A>
 

### Linking user accounts
Some user accounts need to be manually linked. You might link profiles when:
- 
The same person has different email addresses in different workspaces.
- 
The same person uses different login methods across workspaces—for example, SSO in one and email login in another.
If users cannot see the workspace switcher or do not have access to the expected domain, confirm that their accounts are linked across workspaces. 
 
To link user accounts:
- 
From the Workspace console, go to the Users page.
- 
Select the user profiles that should be linked:
- 
Only link profiles that represent the same person, with each profile in a different workspace domain.
- 
You can't link two profiles in the same workspace domain. If a profile can't be selected, it may already share a domain with another selected profile.
- 
Click the Link users button and confirm—once linked, the user can switch between those workspaces from the workspace dropdown.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2658912313/5435bf870902e05712ccea566058/image.png?expires=1794967200&signature=ae320828742537568b324e0452b8e1688ac18bcc02f27b5230640c7884499c8a&req=diYiHsB%2Fn4JeWvMW1HO4zVb97aJRUqT%2FOvqy%2B6Fh%2FW%2BnVlCF636srIDS2vIo%0ASx3bd56mE6MTWojX1SM%3D%0A>
💡 Tip: If users have the same email address across workspace domains, we'll let you know with a banner at the top of the Users page. Click Review to confirm the suggested link. If you don't see this banner, use the steps above to link profiles manually.
 

### Changing user roles
There are two ways to change a user’s role:
- 
 From the Users Page: Select a role from the Role dropdown next to the user’s name
- 
 From the User Drawer: Open the user drawer, then select an available role from the dropdown
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516755623/bb79149ce98562e636c82a95f4dc/36272536943380?expires=1794967200&signature=d3b7c26b303c9d974d7cfaf0991a63ec8d8a89fe3c7484a49030b87e71ef3a8e&req=dSUmEM57mIddWvMW1HO4zccpHAjgLC9LJGH%2FK0viQAYYYo1Lyvc8RFebtRfC%0APgrTXtK94GseogSbIrE%3D%0A>

### Updating the default workspace
You can also select a default Workspace for a user. This determines which Workspace they land in when they log in.
- 
 Open the user drawer
- 
 Use the Workspace dropdown to choose a new default
 
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516755626/cabfe9d8407a8477ab32c7eb76d9/36302492631828?expires=1794967200&signature=c61d23af115bb03104ec0e2947a276e97400735c7991fa864ab025afda02fa4d&req=dSUmEM57mIddX%2FMW1HO4zd4o%2BCPJa0F3Rm97%2BqHAoihYpeBg5EFG7eYa%2B01m%0A0hoEfIPMAU7spgmtK2A%3D%0A>
 

### Granting workspace or workspace console access
To give a user access to a new Workspace or to the Workspace Console:
- 
 Open the user drawer
- 
 Select a Workspace the user doesn’t already have access to
- 
 Grant access as needed
 
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516755639/f42f9b928c93bb26cec5486d7f52/36302467888788?expires=1794967200&signature=8632ce6c2a273c906afaef5e89a993b52dc8deb8d28bef2eb6354dc120b403d6&req=dSUmEM57mIdcUPMW1HO4zfmg7dktQB2uWoicdqvK5b6HuUnHvSu0uAhV1kBe%0AfL%2BOx%2FawFCjM1rgpW9k%3D%0A>
 
Please note: If a workspace user is added via your Identity Provider (IdP), they must also be removed within that workspace. You cannot override this setting and remove the user from the Workspace Console.

## Images

- [image 01] ../../images/ux/workspaces/getting-started-with-workspaces--01.png
- [image 02] ../../images/ux/home/getting-started-with-workspaces--02.png
- [image 03] ../../images/ux/home/getting-started-with-workspaces--03.png
- [image 04] ../../images/ux/workspaces/getting-started-with-workspaces--04.png
- [image 05] ../../images/ux/home/getting-started-with-workspaces--05.png
- [image 06] ../../images/ux/workspaces/getting-started-with-workspaces--06.png
- [image 07] ../../images/ux/workspaces/getting-started-with-workspaces--07.png
- [image 08] ../../images/ux/workspaces/getting-started-with-workspaces--08.png
- [image 09] ../../images/ux/workspaces/getting-started-with-workspaces--09.png
- [image 10] ../../images/ux/workspaces/getting-started-with-workspaces--10.png
