# Tracking Incident Management and Resolution Tickets in Vanta: Jira

Source: https://help.vanta.com/en/articles/11345519-tracking-incident-management-and-resolution-tickets-in-vanta-jira
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Workflow and Ticketing Tools
Fetched: 2026-11-17

## Article text

Vanta can track tickets you use during and after incidents to help provide evidence of your incident management process. This evidence is important for auditors, helping to prove that incidents are managed per your policy and resolved regularly.
Vanta collects the following information from task tracker tickets to satisfy the related Vanta tests:
- 
Title
- 
Tags
- 
Status
- 
Created at date
- 
Closed at date
- 
Access ticket target (see below)

## Configuration
- 
Navigate to your Jira connection on the Integrations page <https://app.vanta.com/integrations> and click on Manage, followed by Task tracking labels.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768396/34f7c7040e239f2f477b9ba740d8/35424213321876?expires=1794967200&signature=29ca36d0c514b92b0c05a2d3b9b3593b12c4bfbf8652c234620a4591819f7b9e&req=dSUmEM54lYJWX%2FMW1HO4zRwdIpVM4L5MqXsoUYrUJP566rfASxtqSTwrKrgm%0ATcZ8Q%2BQJsfC4LJksMZc%3D%0A>
- 
In the new incident management and incident resolution sections, you can add all of the labels you want Vanta to use to track access-related issues in the modal that pops up. You can also use JQL to define which tickets qualify.
- 
After entering the labels, you would like Vanta to track, select Save
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768393/db4712e05d0a02fc428a2ecb9426/31762427473940?expires=1794967200&signature=3eaf9cbff963ebb3ec695ee617b079928f022ac442cf7c987c2fd445155e30bf&req=dSUmEM54lYJWWvMW1HO4zTTXLmlMPyfupNKKIQpyl9eMlStR0iyw0v%2BbRsLN%0AdldQC%2FLStnpiv10aVdw%3D%0A>
- 
Once complete, Vanta will pull tickets with the Jira-configured labels you entered.

## Mapping Tickets
When configuring the JIRA integration, you can define the labels you currently use for access ticketing. This allows flexibility if you already use a specific label for these tickets. JQL support will allow for more custom rules, like targeting tickets from particular projects.
 

## New Automated Tests
Once you enable import for the selected JIRA tickets, we will automatically run two new tests against them:
- 
Incident Resolution Tasks Completed
- 
Incident Management Tasks Completed
These provide a list of incidents that are not resolved so that you can action resolution, and provide evidence of incident history to your auditor.
You can see the status of these tests on the Test page <https://app.vanta.com/tests>

## Images

- [image 01] ../../images/ux/integrations/tracking-incident-management-and-resolution-tickets-in-vanta-jira--01.png
- [image 02] ../../images/ux/integrations/tracking-incident-management-and-resolution-tickets-in-vanta-jira--02.png
