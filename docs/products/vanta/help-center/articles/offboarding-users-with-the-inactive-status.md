# Offboarding Users with the 'Inactive' Status

Source: https://help.vanta.com/en/articles/11345970-offboarding-users-with-the-inactive-status
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When offboarding employees from a connected HRIS integration, Vanta will search for the 'end date' in order to start the offboarding process.
 
If a future end-date is set on a Users HR profile, or if the HRIS provider does not allow an end date to be set, this can result in a user profile displaying the status 'Inactive' and limit further off-boarding actions
 

## Resolution
As a workaround, the user profile can be marked as 'Out of Scope' within the integrations resources.
 

## Procedure
- 
Navigate to your Integrations Page <https://app.vanta.com/integrations>
- 
Click Configure Scope next to your HRIS connection.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763530/b90cf22d75ca03a9e4fc5daa90a5/33082723147156?expires=1794967200&signature=958b5d6e2ca9840c574fe79749bbd5bd127b3a8c1939af2ffca14449886ef2bd&req=dSUmEM54noRcWfMW1HO4zbsEYB9caKqbm7FgDSK%2FQB0rsesasJyvTqgSF%2Bnp%0A58fU%2BuHGZAdV9IpHNrs%3D%0A>
- 
Search for the users name, and toggle them out of scope
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763531/4ca3eb6f48698cb142b60934d737/33082723147540?expires=1794967200&signature=72b8b96f3c4f8be63e25b7aaf36507fd50b703f64af5e1fd4aba3681ff04d24c&req=dSUmEM54noRcWPMW1HO4zdll2oLezZ5%2Fhck1rj3KxKoxgSAwHSctKQxO8Rdo%0A6zqhsn5S4H%2B4tvBf0Cg%3D%0A>
 
- 
Once completed, on the next data fetch the system will look to your Identity Provider as the source of truth for this user.
- 
If the user has been deactivated in your IdP, the system should pull in the date the IdP profile was deactivated as the end-date, and allow you to complete off-boarding for the user.

## Images

- [image 01] ../../images/ux/integrations/offboarding-users-with-the-inactive-status--01.png
- [image 02] ../../images/ux/integrations/offboarding-users-with-the-inactive-status--02.png
