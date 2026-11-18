# Sending Emails from a Custom Domain

Source: https://help.vanta.com/en/articles/12986178-sending-emails-from-a-custom-domain
Collection: Getting Started Hub ; Getting Started Hub › Account Settings
Fetched: 2026-11-17

## Article text

✅ Feature availability: This article discusses Custom Email Domain. Availability depends on your plan and supported emails. To request access, contact your Customer Success Manager.
 
You can send system emails from your own company domain instead of [email protected]. This creates a more trusted and branded experience for your email recipients and reduces the chance your messages get marked as spam.
 
⚙️ User permissions: Admins and Editors can configure custom email domain settings. Refer to Understanding User Roles and Permissions <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta> for more details.
 
 

## Supported emails
You can choose which emails to send from your domain:
- 
Trust Center: Emails sent to prospects or customers from your Trust Center, like invite links, login links, and emails to subscribers. We’ll match the look and feel to your Trust Center branding settings. Requires the Advanced Trust Center add-on.
- 
Third Party Risk Management (TPRM): Emails sent to vendors when you request evidence or ask them to complete a security review through Vanta Exchange. Requires the TPRM add-on.
- 
Personnel: Reminder emails sent to your employees about incomplete tasks, like security training and policy acceptance. Requires a Professional or Enterprise plan.
​
 

## Adding your domain
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2448352202/664d64599ff9b1795917dbaac4d9/image.png?expires=1794967200&signature=7036ba5a7b86ed7790217009a1343e42615e11598d2894995ca99eefffe99240&req=diQjHsp7n4NfW%2FMW1HO4zcnsvpRT0f%2FZcH4zOQy7xATEFhs1%2BCVoC09rzweJ%0Ax1ilz1%2FCVz61zXQ4BWU%3D%0A>
 
To add your custom domain:
- 
In the upper-right corner of your account, click the gear icon to go to your account settings.
- 
In the Notifications tab, scroll to Send from a custom email domain.
- 
Enter the sending email address you’d like to use.
- 
You can’t use email addresses already being used by another Vanta customer or personal or generic email domains (gmail.com, yahoo.com, hotmail.com, etc.).
- 
Under Verification status, make sure you verify both your domain and email address. 
- 
Domain verification: Publish the Vanta CNAME records provided in your DNS provider settings.
- 
Email address verification: Follow the instructions in the verification email sent from AWS to allow Vanta to send emails on your behalf.
- 
Under Supported emails, choose the emails you want to send from this email address.
​
ℹ️ Note: To verify your domain, publish Vanta’s CNAME/TXT records at your DNS provider (GoDaddy, Cloudflare, Google Domains, etc.). If you need help accessing these settings, contact your IT team.
 
 

## Automatic fallback
If something goes wrong with verification or DNS records fail, we’ll automatically send messages from [email protected] or [email protected] if applicable. A banner will appear in your settings so you can fix the setup.

## Images

- [image 01] ../../images/ux/settings/sending-emails-from-a-custom-domain--01.png
