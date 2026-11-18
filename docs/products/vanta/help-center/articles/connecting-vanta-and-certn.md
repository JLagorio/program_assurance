# Connecting Vanta and Certn

Source: https://help.vanta.com/en/articles/11345755-connecting-vanta-and-certn
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta’s Certn integration syncs completed background checks from your Certn account into Vanta. Once a check is completed in Certn, it’s automatically linked to the matching Vanta user by email, or you can link it manually.
 
Estimated setup time: 5-10 minutes
 
 

## Use cases and capabilities
- 
Background Check Syncing: Vanta automatically pulls completed checks from Certn and links them to Vanta users by matching email address, or you can link them manually.
- 
Multi-Platform Support: Connect via Certn Centric or Certn Legacy, depending on which platform your organization uses.Learn more in the Platform compatibility section below.
- 
Multiple Certn Connections: Add more than one named Certn account to the same Vanta org — useful for separate business units or subsidiaries. 
ℹ️ Note: Connected accounts are listed under Connected Certn Accounts in your integration settings.

### Capabilities overview
 | 
Resource / Capability | 
Supported | 
How it is used in Vanta
 | 
Background Checks | 
Yes | 
Synced automatically; auto-linked by email or linked manually
 | 
Certn Centric platform | 
Yes | 
Connect via API key + Region
 | 
Certn Legacy platform | 
Yes | 
Connect via access token
 | 
CertnCore / Intercheck | 
No | 
Not supported — use the manual background check linking flow
 | 
Multiple Certn Connections | 
Yes | 
Add multiple named Certn accounts to one Vanta org
 
 

## Prerequisites
Before connecting Vanta and Certn, ensure the following:
- 
You have a Certn account on Certn Centric or Certn Legacy. (Core and Intercheck aren’t supported — see Platform Compatibility.)
- 
You can access your Certn account’s settings to generate an API key (Centric) or access token (Legacy).
💡 Tip: Not sure which platform you’re on? See Certn’s own guide, How to identify your Certn platform <https://help.certn.co/hc/en-us/articles/42696522583443-How-to-identify-your-Certn-platform>.
ℹ️ Note: Certn Centric is rolling out gradually. If you don’t see it as an option when connecting, reach out to your Vanta contact.
 
 

## Setup guide

### Step 1: Generate your Certn credentials

### If you’re on Certn Centric:
- 
Log in to your Certn Centric account.
- 
Go to Settings, then select Integrations, then select API Keys.
- 
Click Create API Key.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2798300946/fe3a19cc410047feaa8a4b83778f/498bdfa7-567a-43ac-808c-1bce099419fa?expires=1794967200&signature=f4b18242b9ace440b5a0b64be849af78ae4ee9b472879539e02768ec925447dd&req=dicuHsp%2BnYhbX%2FMW1HO4zX%2FjWnDjT8vXyOFcheVMbp%2B%2B%2FeFRr0H1umj1hLtU%0AadkEUVEo2p0Goh%2FS59Q%3D%0A>
- 
Enter a name, and click Generate key.
- 
Copy the key and store it securely. You’ll paste it into Vanta in the next step.

### If you’re on Certn Legacy:
- 
Log in to your Certn Legacy account.
- 
Go to Settings and select Team Settings (under the relevant team).
- 
Scroll down and select API Keys.
- 
Click Add API Key. (If you have several existing keys, the new one may appear at the end of the list.)
 

### Step 2: Connect Certn in Vanta
- 
In Vanta, go to the Integrations page. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
If this is your first Certn connection, click Add integration, search for Certn, click Connect.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2798303965/b4a7c9a8471929a02f471eb3d39c/75f5b452-b526-4645-8794-a9ae5a3914e5?expires=1794967200&signature=7d723dd0f5f3532f880978fc47c90bb30143e8c62f15515cfd524c5ffa49ee6d&req=dicuHsp%2BnohZXPMW1HO4zd8u%2Fctymk99i2yMu%2FFeINCYKWle9pEh%2Bwm9FvPE%0Ae9aRq49S%2Fu7qqNGIKEA%3D%0A>
- 
Click Add Certn Account.
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2798304475/02ab4a92d0feb18cfd1023a60a52/1c9c5a8e-233e-4194-a103-3b10e3cb7aca?expires=1794967200&signature=74cb5990977e973481a170002113b99773d3220f4e71e3371a0d08f07d0d59cc&req=dicuHsp%2BmYVYXPMW1HO4zSxpyOWMFGHior5kQnPE8odTsD9kMTA%2FrlFCcIPv%0AMy9hKEwN5aZUbIAw7A8%3D%0A>
- 
If you’re migrating from Certn Legacy to Certn Centric, find your existing Certn integration, open the three-dot menu, and click Edit instead. This keeps the background checks already synced.
- 
In the dialog, enter an Account name to identify this connection. This name is required and must be unique across your other Certn connections.
- 
Under Certn Product, select your platform and fill in the matching fields:
- 
CertnCentric API — paste your API key, and select the correct Region: CA (North America), UK (Europe, Middle East & Africa), or AU (Asia Pacific).
- 
Legacy Certn API — paste your API token into the Access Token field.
- 
Click Validate and store. Vanta begins syncing.
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2798305387/1d1cb32d357b73114afa1275128b/e3f9ec84-9ad6-4361-8eb7-aeec0728d32e?expires=1794967200&signature=e25a1c9e0a423f2f287ff7cd6dd9fd4de880f65fad1376a8a9adbcd68bfad4db&req=dicuHsp%2BmIJXXvMW1HO4zVxT1004YzX%2FAQH0wIVjh4cq1mLRjv6BMdScS1Jn%0AghRqiqdMK2w%2Fp1hRQNk%3D%0A>
⚠️ Note: Selecting the wrong Region for a Centric connection won’t show an error, it will just silently return zero background checks. Double-check your Region against your Certn account before saving.
⚠️ Note: Editing an existing connection replaces your stored credentials, it doesn’t merge them. Vanta also doesn’t revoke your old Legacy token in Certn automatically; if you want it deactivated, do that manually in Certn Legacy.
 

### Step 3: Add additional Certn accounts (optional)
- 
Repeat Step 2, clicking Add Certn Account again, with a distinct Account name each time.
 
 

## Platform compatibility
Vanta’s integration supports Certn Centric and Certn Legacy. If your organization uses CertnCore or Intercheck:
- 
Automated syncing through the Vanta API integration isn’t available.
- 
Use Vanta’s manual background check linking flow <https://help.vanta.com/en/articles/11345938-manually-linking-background-checks> instead.
If your account has moved from Certn Legacy to Certn Centric, your old access token stops being used (Vanta doesn’t revoke it automatically in Certn). Generate a new Centric API key and edit your existing connection to resume syncing.
 
 

## Permissions

### Read access
Vanta uses your Certn API key or access token to read completed background check results from your Certn account and sync them into Vanta. 
 

### Write access
This connection is read-only. Vanta doesn’t create, modify, or delete anything in Certn. If your organization also purchases background checks through Vanta via Certn, that’s a separate integration — see Vanta Background Checks Powered by Certn <https://help.vanta.com/en/articles/11345701-vanta-background-checks-powered-by-certn>.
 
 

## Troubleshooting and FAQs

### No background checks are syncing after connecting to Certn Centric
- 
Likely cause: The wrong Region was selected (or left unset) when the credential was saved. This fails silently rather than throwing an error.
- 
How to confirm: Open the Certn connection in Integrations and check which Region is selected against your actual Certn account environment.
- 
Fix: Update the Region to match your Certn account and re-save. Vanta will resume syncing on the next scheduled run.

### Certn rejects the API key during setup
- 
Likely cause: The API key is invalid, or it doesn’t match the Region selected.
- 
How to confirm: You’ll see a message like “Certn Centric rejected this API key in region {region}. Check that the key is valid and that {region} is the right region for your Certn account.”
- 
Fix: Confirm the key was copied correctly from Certn and that the Region matches your account, then try again.

### Setup fails with a connection error, not a rejected key
- 
Likely cause: A temporary issue reaching Certn, rather than a problem with your credentials.
- 
How to confirm: You’ll see a message like “Could not reach Certn Centric in region {region}. This may be a temporary Certn problem rather than an issue with your API key.”
- 
Fix: Wait a few minutes and try again. If it persists, contact Vanta support.

### The integration shows as disconnected or needs reconnection
- 
Likely cause: Your Certn API key or access token was revoked, expired, or changed.
- 
How to confirm: Go to Integrations in Vanta and check the status of the Certn connection.
- 
Fix: Generate a new credential in Certn (Step 1) and reconnect or edit the existing connection (Step 2).

### “The account name may already be in use” when adding a Certn account
- 
Likely cause: Certn connection names must be unique within your Vanta org, and the name you entered is already used by another connection.
- 
How to confirm: Check the names listed under Connected Certn Accounts in your integration settings.
- 
Fix: Choose a different, distinct Account name.

## Images

- [image 01] ../../images/integrations/certn/connecting-vanta-and-certn--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-and-certn--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-and-certn--03.png
- [image 04] ../../images/integrations/certn/connecting-vanta-and-certn--04.png
