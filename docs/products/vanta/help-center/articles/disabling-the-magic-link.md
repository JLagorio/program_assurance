# Disabling the Magic Link

Source: https://help.vanta.com/en/articles/11345383-disabling-the-magic-link
Collection: Getting Started Hub ; Getting Started Hub › Account Settings
Fetched: 2026-11-17

## Article text

By default, all users with access to Vanta can log in via a unique, time-limited link sent to their email. For security purposes, you may wish to disable this option for your domain. When magic link login is disabled for a domain, all users with SSO access will be required to log in via SSO, and users without SSO access will not be able to log in unless expressly exempted from this setting.
 
Before disabling magic link login for your domain, you must connect an SSO method. This can be one of Vanta's IdP integrations <https://help.vanta.com/en/articles/11345653>, or, if included in your package, a custom SAML method <https://help.vanta.com/en/articles/11345649>.
 

## Turn off Magic Link Capability
- 
In your account header, click the Settings icon
- 
Select the Login and security tab
- 
Toggle the Login via magic link on or off to suit your needs
​
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2109364592/3a9155c256ff739bef13b6c87a54/image.png?expires=1794967200&signature=d2c4ca5833cfad83a919617ff924d178a8ab650c62fad906a215fc1a446124c7&req=diEnH8p4mYRWW%2FMW1HO4zZpZKOzAdt%2BYKqMANjRPJYoWIkhVnVx1rPajglCX%0AKqXB%0A>
- 
When you disable the magic link, you will be automatically added to the list of users exempted from this setting
Please note: If you do not have an SSO method configured, the toggle will be disabled
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756099/a20ad41b70e4075b9eeeef9e4f33/31767288650388?expires=1794967200&signature=b346b3032174b408a6e9a0d065d4131f4a04c76301fe91842e37501f33d51a4c&req=dSUmEM57m4FWUPMW1HO4zXPbrg%2FJojUztLuDt4UL%2FESkBo4K5sJGoNdA7dRt%0Ay0aDBbMwuWdSAGO95Tk%3D%0A>
- 
Once you toggle the option off, you will notice the opportunity to Manage exemptions. This means that all users except those exempted from this account must log in with single sign-on (SSO).
We recommend exempting at least one user from this requirement so the account can always be accessed, in case of an issue with your identity provider.
 

## Exemptions
- 
Admins can define a list of users exempted from this setting. The users on the exemption list can log in via the magic link in addition to any SSO configured for their account.
- 
Select the Add user drop-down, and include the name of the user(s) you would like to exempt
- 
To remove a user from the exemption list, select the trash can icon on the right-hand side of the user name
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756100/9a086ba7c506596c44490c6e117a/31767323550100?expires=1794967200&signature=ffd2154fe3e61500afcd66d427396e2fa63868fe16e02c5212108be3f6c4e4e4&req=dSUmEM57m4BfWfMW1HO4za6l6KmR0LFr4VDqPegm6tPBHFRc0bj70T7HMb3b%0AQ6UtufB7OBKMJhHO9Yk%3D%0A>
 
Please note that this setting does not impact MSP (managed service provider) and auditor access to your domain. Because of this, partner users are not eligible to be added to the exemption list.
 

## Frequently Asked Questions
Some of my users have access to multiple independent Vanta domains, which requires them to log in to Vanta using the magic link. What happens if I disable the magic link login?
- 
These users will still be sent a magic link that allows them to view the list of domains they can access. If you have configured SSO for their user in your domain, selecting your domain will route them to your SSO login. Otherwise, you must add them to the exemption list to grant them access. If you do not configure SSO for them and do not add them to the exemption list, they will not be able to log in to your domain.
I have a Vanta workspace. What happens if I disable the magic link in only one workspace domain?
- 
Users with access to multiple domains of the workspace will be required to log in via SSO before accessing the domain with the magic link login disabled. To ensure no disruption of cross-domain access, we recommend that all users who require access to multiple workspace domains be explicitly linked in the workspace console.
I have an MSP; how does disabling the magic link affect their access?
- 
Your MSP's access to your domain is unaffected by your login settings.
I have an auditor. How does disabling the magic link affect their access?
- 
Your auditor's access to your domain is unaffected by your login settings.
Multiple SSOs are connected; what happens when I disable the magic link?
- 
Your users will be directed to whichever SSO method is primary for their user. This is determined by the precedence you set when you connected your second IdP. <https://help.vanta.com/en/articles/11345659>

## Images

- [image 01] ../../images/ux/settings/disabling-the-magic-link--01.png
- [image 02] ../../images/ux/settings/disabling-the-magic-link--02.png
- [image 03] ../../images/ux/settings/disabling-the-magic-link--03.png
