# Error: Custom Trust Center Domain SSL Stuck in Pending

Source: https://help.vanta.com/en/articles/11345978-error-custom-trust-center-domain-ssl-stuck-in-pending
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

## Issue
When generating your custom domain for your Trust Center page, it remains in a Pending state. When hovering over the Pending, you notice it states SSL: Pending.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763942/8e877575ffad54ff59dcab9b809b/14653432892436?expires=1794967200&signature=4b79430037495de8cdd4a0b4ffc5b3f6fddc1a2840f54617a3a008a2cea0b703&req=dSUmEM54nohbW%2FMW1HO4ze7cALERHUVidmk2O%2F63q2bNg35bACl0AcJXS3lY%0A0D51hLm1GrHPkVq0vec%3D%0A>
 

## Cause
- 
CAA Records. A Certificate Authority Authorization (CAA) DNS record specifies which Certificate Authorities (CAs) are allowed to issue certificates for a domain.
- 
If your root domain uses CAA records, you'll need to add new records to allow us to issue certificates for the custom domain on your behalf.
 

## Solution
Add these CAA records:# CAA records added by DigiCert
0 issue "digicert.com; cansignhttpexchanges=yes"
0 issuewild "digicert.com; cansignhttpexchanges=yes" 

# CAA records added by Sectigo 
0 issue "sectigo.com" 
0 issuewild "sectigo.com" #

# CAA records added by Let's Encrypt 
0 issue "letsencrypt.org" 
0 issuewild "letsencrypt.org" 

# CAA records added by Google Trust Services 
0 issue "pki.goog; cansignhttpexchanges=yes" 
0 issuewild "pki.goog; cansignhttpexchanges=yes"
If your domain still does not accept the SSL after following these steps, please log into your Vanta account and select Help & Support to access a support staff agent who can assist you in investigating and resolving the issue.

## Images

- [image 01] ../../images/ux/trust-center/error-custom-trust-center-domain-ssl-stuck-in-pending--01.png
