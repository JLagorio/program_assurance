# How Does a Person's Employment Status get Determined?

Source: https://help.vanta.com/en/articles/11345592-how-does-a-person-s-employment-status-get-determined
Collection: Team Compliance ; Team Compliance › Managing Users
Fetched: 2026-11-17

## Article text

At a high level, Vanta prioritizes a person's employee data from the following sources:
- 
Your HRIS
- 
Your identity provider
- 
Information you submit directly in Vanta
If employee info from a particular provider is marked out-of-scope, Vanta will not monitor or consider it.

## HRIS
- 
From your HRIS, Vanta automatically links HR info with a person based on a combination of email address and name matching. You can manually link HR info with people via the Manage HR data dialog on the People page.
Offboarding - HRIS
- 
A person marked inactive or terminated in their HRIS will trigger offboarding in Vanta. Ex-employees can no longer log in to Vanta.
- 
Note: Since Vanta prioritizes HR information more than IdP information, a person with inactive HR information can enter offboarding even if their IdP is still active.

## IdP
- 
From your IdP, Vanta automatically creates people in Vanta if no existing person is found. It's not possible to unlink or re-link IdP info associated with a person in Vanta with another person.

## Offboarding - IdP
- 
A deleted or suspended IdP account will trigger offboarding for the linked person in Vanta (unless this person is still linked to an active HRIS account.)

## Manual input
- 
On the People <https://app.vanta.com/people/people> page, you can manually add a person.

## Editing
- 
You can edit by clicking on Edit details in the person detail drawer.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516754631/d69063b82951e8f3a4e335913174/16188280965396?expires=1794967200&signature=60aa0850d02a60587a8c36ce24ad2b044d29a7d6296b0f010af5682e7e5431f1&req=dSUmEM57mYdcWPMW1HO4zcEbxA6BzHANftyE%2FfR1d2lJMfp%2F8aoeb3TcAr%2BO%0Alwv4nyeOGdv3K%2FOtLog%3D%0A>
- 
You can only edit a manually-managed person. Otherwise, this info is managed in your HRIS or IdP.

## Offboarding
- 
You can manually initiate offboarding on the Offboarding tab of this person by hitting the Offboard button
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516754638/904e3655c2510ee7b86ce54ca2bc/16188324640788?expires=1794967200&signature=2caf475d0f4efb3dd1ffb8b968e53c045674e06c581a8a22c0f94a645f757887&req=dSUmEM57mYdcUfMW1HO4zTzj%2FFkuaX%2B%2B8WUpel%2BlUHAite4gA0bc5O1YHQvI%0AZlRH7o0cxbX240VmB1I%3D%0A>

## Images

- [image 01] ../../images/ux/personnel/how-does-a-person-s-employment-status-get-determined--01.png
- [image 02] ../../images/ux/personnel/how-does-a-person-s-employment-status-get-determined--02.png
