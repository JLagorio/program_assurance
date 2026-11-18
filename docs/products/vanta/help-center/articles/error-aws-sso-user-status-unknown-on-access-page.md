# Error: AWS SSO user status "Unknown" on Access page

Source: https://help.vanta.com/en/articles/11345896-error-aws-sso-user-status-unknown-on-access-page
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Environment Details
AWS Single Sign-on users are displayed as an 'Unknown' Status on the access page
Example:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516758981/4c00c6c3e1d91d0d270dd4525d67/19217727885588?expires=1794967200&signature=34bc44942dabc8ed7f0eb85bd1d669bafa254229bfff87d6405fb70a7862e2a6&req=dSUmEM57lYhXWPMW1HO4zXhy9GDEgaY78wknlXtk6SNsY50MVptOkGrwp09v%0AIKeRnqpP4BilIcgXq%2BE%3D%0A>
 

## Cause
Vanta is currently unable to pull in the account status of SSO managed accounts from AWS.
 

## Resolution
As this is a technical limitation at the moment, if these users are offboarded, we recommend removing their account from AWS, and manually marking their AWS access as deactivated under their personnel profile <https://help.vanta.com/en/articles/11345601>.

## Images

- [image 01] ../../images/ux/access/error-aws-sso-user-status-unknown-on-access-page--01.png
