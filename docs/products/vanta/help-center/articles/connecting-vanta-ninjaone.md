# Connecting Vanta & NinjaOne

Source: https://help.vanta.com/en/articles/11534632-connecting-vanta-ninjaone
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Endpoint and Device Management (MDM)
Fetched: 2026-11-17

## Article text

Vanta now supports a streamlined, secure global OAuth integration with NinjaOne. There's no need to manually configure an API application or manage client IDs and secrets. Simply identify your NinjaOne region, and Vanta will automatically handle the connection process.
 

## Requirements 
- 
Your NinjaOne region
- 
NinjaOne accounts are hosted in one of five regions. You’ll need to provide your region exactly as listed (case-sensitive):
- 
app (US East)
- 
us2 (US West)
- 
eu (Europe)
- 
oc (Oceania)
- 
ca (Canada)
- 
Administrator access in NinjaOne
- 
You’ll need this permission to approve the connection request from Vanta.
 

## Set Up the NinjaOne Integration

## Connecting Vanta and NinjaOne

### Find Your Region
- 
If you’re not sure which region your account is in:
- 
Go to Administration > Apps > API in NinjaOne
- 
Look at the URL in your browser — for example, https://app.ninjaone.us2/api/ <https://app.ninjaone.us2/api/>... means your region is us2
- 
You may also find the region in the page metadata or request headers
- 
Still unsure? Reach out to [email protected] for help

###  Start the Connection in Vanta
- 
To connect, go to the Integrations page, click Add integration, and search for NinjaOne. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
Enter your region (e.g., eu).
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1562837140/20899ca101051d92214e7c6e10b3/Screenshot+2025-06-09+at+2_29_42%E2%80%AFPM.png?expires=1794967200&signature=484788ab79b8f19efb00035bee64a27bf402e4be9f53e8bf4aeeb525cb26e4b2&req=dSUhFMF9moBbWfMW1HO4zRU2nZjVS9X4oCUcSrkcPdEQn4NtMurrwp1ehlRM%0A1vF%2F1G66uMYCKSWfdUM%3D%0A>
 
 
 

### Approve Access in NinjaOne
- 
Vanta will create a secure authorization link using our global app
- 
Click the link, log into NinjaOne, and approve access for Vanta to view your monitoring data.

### Complete the Connection
- 
Once approved, you’ll be redirected back to Vanta
- 
Vanta will securely receive access to your NinjaOne data
- 
Your integration is now active, and Vanta can begin syncing devices, alerts, and more
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1562864945/e39ae3b098173aaea194f9ea58b8/Screenshot+2025-06-09+at+2_48_21%E2%80%AFPM.png?expires=1794967200&signature=6d556ce90aa0cbb1e6d3489c32e3f0dcba95366fb2a0dfa15fa430b577abbc6b&req=dSUhFMF4mYhbXPMW1HO4zVb97TB%2FN%2BqMzAXJ6mf%2BCmEG305g2xguggZmeW6m%0A8F757TbMQqw4XyZ5kHI%3D%0A>
 
 

## Frequently Asked Questions 
How do I find my region?
- 
Check the URL when visiting Administration > Apps > API in NinjaOne. You might see a region in the format https://app.ninjaone.us2/api/ <https://app.ninjaone.us2/api/>.... That’s your region keyword (in this case, us2). If it’s not clear, contact [email protected].
I don’t see an ‘API’ section in NinjaOne. Why?
- 
Make sure you’re logged in with an Administrator or API Manager role. Only those roles can view the API section.
The authorization step failed. What should I check?
- 
Double-check your region entry
- 
Make sure you approve access when prompted
- 
Check for firewall or SSO settings that might block the redirect to Vanta
Do I need a client ID or secret from NinjaOne?
- 
You no longer need to create an app or provide a client ID and secret. Just enter your region, and you’re good to go.
Why are my devices showing up in Vanta as unassigned? 
- 
NinjaOne integrations can only pull in owner information under specific conditions. The user must have end-user profiles set up with an email, first name, and last name that match the information in Vanta. If these do not match, the device will not have an owner assigned.
 

## Useful Links
- 
NinjaOne API Documentation <https://app.ninjarmm.com/apidocs/?links.active=core>

## Images

- [image 01] ../../images/integrations/ninjaone/connecting-vanta-ninjaone--01.png
- [image 02] ../../images/integrations/ninjaone/connecting-vanta-ninjaone--02.png
