# User added to Office365 and Entra ID not visible on People page

Source: https://help.vanta.com/en/articles/11345980-user-added-to-office365-and-entra-id-not-visible-on-people-page
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When connecting Office 365 as your Identity provider, Vanta will automatically fetch employees to the people page in Vanta if no existing user profile is found. New employees created in Office 365 should populate when the integration next syncs.
If the employee is not visible in Vanta within 24 hours, this likely means an issue with Vanta fetching the user profile from Office 365.
 

## Cause
- 
This can occur if the email field has not been populated in an employees' Entra ID profile
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764029/af8bb219737d6ecfe24cd26aa7d9/31219387041812?expires=1794967200&signature=f649ec60e0b8152080eba2ddee86d3faf799712b0806488dbdadc57d76c9dc8c&req=dSUmEM54mYFdUPMW1HO4za7O2uCN0fOqoOLE6%2Bj5StclGN9xnn6LvvkvEpaF%0Ay4BlZEqDs50qGQoS7hU%3D%0A>
 

## Resolution
- 
Log into Microsoft Entra ID <https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview>. In the left hand menu select Manage then, then Users
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764032/165140d0e6d652d72c5df7909467/31219387042708?expires=1794967200&signature=6feea761971a9b8426ec6edb2589b6b60b3659103b92fbef9ba60741e45437d1&req=dSUmEM54mYFcW%2FMW1HO4zb7Z5WoxED27EgmM396NMYXb012j3r17O3IepyH8%0A42tIU12BYpU4JmQsIN8%3D%0A>
 
- 
Search for the employee's name and click to access the overview.
- 
Click on Edit Properties
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764031/338bd73c9128dc16a7c93514dba4/31219419245844?expires=1794967200&signature=29ffa23af03246ed663eee25b70927ecb5244ecbf5c96aff971575a9c81f4d06&req=dSUmEM54mYFcWPMW1HO4zU%2BJ430J15IlhOZVGwktC4CjQq6zJbavev%2FjAtVX%0A4ZDBBzwiUPqVflYHT%2BU%3D%0A>
 
- 
Select 'Contact Information' and look for the 'Email' field. If blank, add the employee email address and save
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764028/12f8907f82540351c79109401bfd/31219419246996?expires=1794967200&signature=dbbd92af17897e705322f532a6488881369886fdc0d7157cbd05a6c1e3c6439b&req=dSUmEM54mYFdUfMW1HO4zZVmu8oJvSYrSwrQn61NfXJc7bEikC6c80q2j6nc%0AnbpaWRm7LSDJLB2BwG4%3D%0A>
- 
The user should be visible on the People Page the next time the integration Syncs. It's normal for this to take a few hours, but it should be no more than 24 hours. If the employee is still not on the people after 24 hours, please contact [email protected] for further assistance.
 

## Additional Resources
- 
Connecting Office 365 as an Identity Provider <https://help.vanta.com/en/articles/11345655>
- 
Controlling Scope Through Office <https://help.vanta.com/en/articles/11345767>
- 
Vanta Integrations that may Require a Premium Service <https://help.vanta.com/en/articles/11345765>

## Images

- [image 01] ../../images/integrations/azure/user-added-to-office365-and-entra-id-not-visible-on-people-page--01.png
- [image 02] ../../images/integrations/azure/user-added-to-office365-and-entra-id-not-visible-on-people-page--02.png
- [image 03] ../../images/integrations/azure/user-added-to-office365-and-entra-id-not-visible-on-people-page--03.png
- [image 04] ../../images/integrations/azure/user-added-to-office365-and-entra-id-not-visible-on-people-page--04.png
