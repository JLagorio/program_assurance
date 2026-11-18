# Code Changes in Vanta

Source: https://help.vanta.com/en/articles/12498226-code-changes-in-vanta
Collection: Continuous Monitoring ; Continuous Monitoring › Vulnerabilities
Fetched: 2026-11-17

## Article text

The Code Changes feature in Vanta helps you track and review code updates across your connected repositories. This allows your team to see which changes were compliant with your security requirements and which were not—helping you stay on top of potential risks and provide clear evidence for audits. You can access this feature by selecting Assets in the navigation panel, followed by Code Changes.
 
 

## Which integrations power this feature
Code Changes is powered by your connected source code management integrations, such as GitHub, GitLab, Bitbucket, and Azure DevOps. These integrations allow Vanta to monitor changes made in your repositories and display them in the Code Changes view.
 
 

## Setting up Code Changes
To use Code Changes, you’ll first need to connect your code repository integrations:
- 
From the left-hand navigation panel, select Integrations
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1756858089/d96a4717badb67602056c3670a13/Screenshot+2025-10-02+at+9_53_11%E2%80%AFAM.png?expires=1794967200&signature=211b54c6e67f6bed14d760a8560ce8136d9001b8d48d0a2cea4580d34761fb53&req=dSciEMF7lYFXUPMW1HO4zcYxsQqGgzFgg4gsp4kawIJQvWq3BJhgi7cZGfrH%0AwsHWbrTwq%2F%2FoiEoT680%3D%0A>
 
- 
Search for and select your source code management tool (for example, GitHub)
- 
Follow the prompts to connect your account and authorize access
- 
Once connected, Vanta will begin syncing recent code changes into the Code Changes page
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1756860503/96b75594dd682e3c9e47bd34da4b/Screenshot+2025-10-02+at+9_54_22%E2%80%AFAM.png?expires=1794967200&signature=dd01f3735505db6d2f7600e27cf8292bc6ca9d8ce7987c850c5e21eb2f2250e5&req=dSciEMF4nYRfWvMW1HO4zTrc1myzxUcfX2CLEX%2BCgsY7zGyxH7tMrpzkqoWB%0AIWXIAuG8NmYG2fI5EyY%3D%0A>
 
Please note: If your Vanta package was recently upgraded to include Code Changes, the feature may take some time to populate with data.
 

## How long until code changes appear
After setup, code changes typically appear within a few hours, depending on repository size and sync schedules. If you recently upgraded your package, it may take longer for historical changes to fully load.
 
 

## Are historical changes shown
Yes. Once the integration syncs, you’ll see both recent and historical code changes in the Code Changes page—historical changes are retained for past 13 months.
 
 

## What makes a code change compliant or non-compliant
Vanta evaluates each code change based on whether it meets your organization’s review and automation requirements, including:
- 
Whether the change was approved by someone other than the author of the code change. This helps ensure that changes are independently reviewed and not self-approved.
- 
Whether the change had an automated check associated with it. Automated checks help validate that the change meets your organization’s technical standards.
Code changes that do not meet these requirements will appear as non-compliant.

## Images

- [image 01] ../../images/ux/integrations/code-changes-in-vanta--01.png
- [image 02] ../../images/ux/code-changes/code-changes-in-vanta--02.png
