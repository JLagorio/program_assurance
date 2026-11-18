# Troubleshooting Google Drive File Download Issues

Source: https://help.vanta.com/en/articles/12648459-troubleshooting-google-drive-file-download-issues
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

## Overview
If you’re experiencing issues with Vanta being unable to download or access files from your connected Google Drive, even though your connected user has the correct permissions, this may be caused by your organization’s Data Loss Prevention (DLP) policies.
This article explains why this happens, how the Vanta–Google Drive integration works, and what you can do to resolve or work around the issue.
 

## Why This Happens
Even if the connected user has Manager or Editor access to a Drive folder, DLP policies in Google Workspace can override those permissions and block certain actions — such as exporting or downloading files through an external API.
When this occurs:
- 
Vanta can list the files successfully (since metadata is retrievable).
- 
However, any attempt to download or export file contents via the API is blocked.
- 
As a result, Vanta cannot retrieve or analyze the file.

## Example Scenario
A customer reported that Vanta was unable to download files from their Google Drive “Vanta policies” folder. Investigation showed that:
- 
The connected user had Manager access to the folder.
- 
The organization had an active DLP policy that restricts external API-based downloads.
- 
Because DLP rules take precedence, Vanta’s API requests to export files were denied by Google.

## How to Resolve
To fix or work around the issue, you can take one of the following approaches:
- 
Review and adjust DLP settings
- 
Work with your Google Workspace administrator to update the DLP rules preventing external API file exports.
- 
Consider allowing trusted third-party applications, such as Vanta, to perform API-based file access.
- 
Reconnect with an account exempt from DLP restrictions
- 
Delete the current Google Drive integration from Vanta.
- 
Reconnect using a service account or user account that is not restricted by DLP policies.
- 
Manually upload files to Vanta
- 
If changing DLP rules isn’t possible, files can be manually uploaded to Vanta for policy verification.

## Images

- none
