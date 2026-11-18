# Connecting Vanta & Ironclad

Source: https://help.vanta.com/en/articles/11345439-connecting-vanta-ironclad
Collection: Trust Management ; Trust Management › Customer Trust ; Trust Management › Customer Trust › Trust Center Integrations
Fetched: 2026-11-17

## Article text

## Overview
Connecting Vanta to Ironclad enables two key workflows:
- 
Trust Center: Automatically approve Trust Center access requests and bypass NDA requirements for viewers whose email or domain matches a counterparty record in Ironclad.
- 
Customer Commitments: Automatically sync your finalized contracts from Ironclad into Vanta so Vanta AI can extract and track your security, compliance, and privacy obligations.
 | 
Note: Ironclad uses OAuth to authorize Vanta. You will need appropriate permissions in Ironclad to complete the connection.

## Connecting the integration
- 
Go to the Integrations page and search for Ironclad in the Available tab.
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168886743/e6afc2afbfe3216729311010f8aa/5efbd8ca-bc00-4a92-b882-da79f680573c?expires=1794967200&signature=e210e0767c8b02abd48484929c25793361535feb8ff3b99d9ac0925cf3e20a75&req=diEhHsF2m4ZbWvMW1HO4zRi4sGclpLnNxh5Dw2xwYgNLF%2FvCoda9skhVAOmB%0Ak2VgqvwbCnMfcLg4FzI%3D%0A>
- 
Click View details. 
- 
Then click Connect. 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168887805/07c01559db3bd9a597731963f2d7/53e8944d-924b-4076-9720-3be56164fe05?expires=1794967200&signature=3355c3d9f4e5be753fe30eb6622957c286ef1d126ad927334a88674507a186cf&req=diEhHsF2molfXPMW1HO4zaaXdfPkepu3f6rk9LW7NPGl4Ve0ZC9HXDEmXA4x%0ALC6r14wJ7uv4l3%2B51GI%3D%0A>
- 
A Link Ironclad modal will appear with two permission options. Select the permissions that apply to your use case:
- 
Permissions for Trust Center access auto-approval and NDA bypass — Grants Vanta read-only access to Ironclad. Select this if you want to use Ironclad to automate Trust Center access approvals and NDA bypass rules. This option is selected by default.
- 
Permissions to sync contracts for commitment management — Grants Vanta the ability to manage Ironclad webhooks and read attachments. Select this if you want to sync finalized contracts from Ironclad into Vanta for Customer Commitments. <https://help.vanta.com/en/articles/13931299-managing-customer-commitments>
- 
Select Connect Ironclad to authorize via OAuth. 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168890179/9402a1232b1d3816db04d38eda26/ec567665-dccf-4f1e-95d7-ce108b19b12e?expires=1794967200&signature=f0f8111e59582fdcc1241e52dee573b6994429b69c86c0c5ec057fbbe29a291b&req=diEhHsF3nYBYUPMW1HO4zVc24rXUpjUduTbNKCF7NozELdgSY6Yai%2F9NbvSv%0AgqMkkZi248KFxNw91J8%3D%0A>
 
 | 
Note: You can select one or both options depending on how you plan to use the integration. You can also reconnect later to add permissions.
- 
Log in using your Ironclad credentials and select Allow access. 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168892109/faec3bc5e86d519eb807a75beeb4/71704152-f179-4340-b608-eb2e25ca64ff?expires=1794967200&signature=cf02df58bc00391cba1d47607c351034070df761569df16462f326b64cd9c52e&req=diEhHsF3n4BfUPMW1HO4zQ%2F%2Bom32y7Awp8V4rWvuK5HMkvW%2F0ZbcH8iQpaRj%0AFz5GgvuC966YX0fauh0%3D%0A>
- 
Once the connection is confirmed, you will see a success message on the Integrations page. 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168893253/4317a9e05e246b0809b604ea9a31/1138b095-d468-41a5-9d66-4fec1b1de522?expires=1794967200&signature=052c61df78f84baf4ea593826e85d1820bf6a37ab07424c3b902519040495acb&req=diEhHsF3noNaWvMW1HO4zc7wWvNxrdD8mVaLN0mr9WT8hV%2BXdIhBNxRK1dya%0AQIVBsFa1u8%2FwEzsk4aM%3D%0A>
 

## Trust Center

## Configure automated access approvals 
- 
Once connected, you can establish rules to automatically approve requests to access your Trust Center based on Ironclad counterparty records.
- 
Go to Settings (via the gear icon on the top right navigation bar) > Customer trust. 
- 
Click the Trust Center tab.
- 
Scroll to the Configure auto-approval section.
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168894856/39be3c9f681b41147ee55e1ea2ab/fd6d0f4b-5176-4383-9d9c-f330009f624b?expires=1794967200&signature=6e48ce32cd94ea754162423fc7de8edf383285ef84e0fa6ba22ec6dcc6c27a8b&req=diEhHsF3mYlaX%2FMW1HO4zR3Cv2BRcFi3YzOIGj%2BWxnTc3I0iqiDLHcZyVnCi%0A4TZdobjrtzHJ2f5JLkY%3D%0A>
- 
Under Automatically approve access requests, select If request meets condition.
- 
From the dropdown, select:
- 
Ironclad Record counterparty matches email
- 
Ironclad Record counterparty matches email domain
- 
Additional conditions can be added using the dropdown under "and." Supported rules consist of any boolean field found in Ironclad and the record type.
- 
Conditions can be removed at any time by selecting Remove. 

## Configure NDA bypass
If you have an NDA requirement enabled for your Trust Center, viewers can bypass it if their request meets specific conditions through the Ironclad integration.
Note: Ironclad is not used as an NDA signing provider in Vanta. If you want viewers to sign an NDA, this is supported via DocuSign or Vanta's built-in click-wrap NDA. The Ironclad integration is used to bypass the NDA requirement for viewers whose email or domain already matches a counterparty record in Ironclad.
- 
While still in the Settings > Customer trust area of the platform under the Trust Center tab, scroll to the Configure non-disclosure agreement (NDA) section.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168897713/5e23d1f579945bfe50b50101dd27/644c3004-2450-4437-be3e-438fd1f6d152?expires=1794967200&signature=a4cff305a8d78ac15f79b3aee82f03211f92ea32aa6e949cb1053e2a71269c77&req=diEhHsF3moZeWvMW1HO4zcSE%2BFQNp5DDlETzBrMuzDfvaxPxOED81p1urVBf%0Ac%2B3aEnzmchv%2FdxJaxDo%3D%0A>
- 
From the If request meets condition dropdown, select:
- 
Ironclad Record counterparty matches email
- 
Ironclad Record counterparty matches email domain
- 
Add any additional properties as needed.
- 
Viewers who meet these conditions will be able to access the requested resources without signing the established NDA.

## Viewing auto-approved requests 
- 
Viewers who meet the conditions of your auto-approval rules will be added to the Viewers granted access tab. To review the list of viewers, navigate to: 
- 
Customer trust (on the left-hand navigation bar) > Trust Center > Viewers granted access tab
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168900563/037a0fed3757d2e1caaa9da882ec/fbe7966a-aaba-4d48-a92d-1b3e72775581?expires=1794967200&signature=5b81ff85eaa408853446c6bb13e58ddfa98b369ecdccd4dacd5db94fb188cff4&req=diEhHsB%2BnYRZWvMW1HO4zSP6beJbuYPEam4dEckfMNpArJ1%2F%2BXfruYJ62b2i%0ALzreEapUiWIZFMrmyTc%3D%0A>
- 
From here, you can select the three-dot menu by each viewer in order to:
- 
Edit access: Set an expiration date, require an NDA, change access level, or add access to additional resources
- 
Revoke access: Remove the viewer's access to resources
- 
Send access reminder: Remind the viewer they have access to resources in your Trust Center
- 
Move to a different account: 
- 
If a viewer was granted access through Ironclad, the Ironclad logo will appear next to their name.
 

## Customer Commitments
The Ironclad integration also supports Customer Commitments <https://help.vanta.com/en/articles/13931299-managing-customer-commitments>, which automatically syncs your finalized contracts from Ironclad into Vanta. Vanta AI then extracts and tracks the security, compliance, and privacy commitments within those contracts.
Note on large contracts: Contracts over 175 pages are processed using an older AI model, which may reduce extraction quality. To improve results, consider splitting large contracts into smaller files at natural break points (such as separating addendums or exhibits). Keep in mind that Vanta AI does not cross-reference separate documents — if one file references a definition in another, the AI will not automatically link them. There is no limit to the number of contracts that can be associated with a single customer account <https://help.vanta.com/en/articles/13163124-customer-trust-accounts>.
 | 
Note: Only finalized contracts are synced. Contracts in draft status are not pulled into Vanta. The sync runs automatically on an ongoing basis, so as new contracts are finalized, they automatically get synced into Vanta
Before you connect: 
- 
Ensure you have the appropriate permissions in your Ironclad account to authorize the integration and allow contract syncing.
To enable the Ironclad connection for Customer Commitments: 
- 
Go to Customer Trust > Commitments and click the Contracts tab. 
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168905995/765b4507434ba6725ca74790f55f/41508ef2-1942-454b-8be1-233f55966f5f?expires=1794967200&signature=68480736ec2b11cabc8dbd2f80f3e7d209adcab0e5d89968eff69683d1e40eb3&req=diEhHsB%2BmIhWXPMW1HO4zSelZwb1gjQxByTavrzkcWMhzhF3PptY3P8thJC%2B%0AhAzGJ6a2xkctI3Wbj94%3D%0A>
- 
Next to the Import contracts button, click the gear icon to open the commitment settings.
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168906852/f4c58b7d56a8705fb7398cc44e24/e6370b0a-7c2b-448a-9513-f733250fdfd5?expires=1794967200&signature=e7e180a397a2e863bb510ec2ac4729ec775d1e80a16d8e20fb70fcd93d593726&req=diEhHsB%2Bm4laW%2FMW1HO4zTl1F4DLNSbrUjefRnjAmyChbaizGiY7n4QBp0Vi%0Aa%2BtU8EXllBI%2BLueLvOk%3D%0A>
- 
Follow the prompts to connect your Ironclad account. 
Note: When prompted, make sure to check the box to grant Vanta permission to sync contracts for commitment management. This permission is required for contracts to sync. 
- 
Once connected, visit Commitments settings by going to Settings > Customer trust > Commitments tab and finish configuring Ironclad sync.
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2168909901/e509af006df226208b0e0fba34cf/772002aa-149f-417e-8cd5-2e056b0800e4?expires=1794967200&signature=b589629f758a58feb0c385353980e740646eca2f76a094992180ca34605463cb&req=diEhHsB%2BlIhfWPMW1HO4zXCTVPnY1327lqoCOUgdcHVfFMruEtMxaiXRhhZF%0AiOQKKFABA6cNFkCet%2Bg%3D%0A>
 
For next steps, see Managing Customer Commitments <https://help.vanta.com/en/articles/13931299-managing-customer-commitments>.

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-ironclad--01.png
- [image 02] ../../images/ux/integrations/connecting-vanta-ironclad--02.png
- [image 03] ../../images/integrations/ironclad/connecting-vanta-ironclad--03.png
- [image 04] ../../images/integrations/ironclad/connecting-vanta-ironclad--04.png
- [image 05] ../../images/integrations/ironclad/connecting-vanta-ironclad--05.png
- [image 06] ../../images/ux/trust-center/connecting-vanta-ironclad--06.png
- [image 07] ../../images/ux/trust-center/connecting-vanta-ironclad--07.png
- [image 08] ../../images/ux/trust-center/connecting-vanta-ironclad--08.png
- [image 09] ../../images/ux/customer-commitments/connecting-vanta-ironclad--09.png
- [image 10] ../../images/ux/settings/connecting-vanta-ironclad--10.png
- [image 11] ../../images/integrations/ironclad/connecting-vanta-ironclad--11.png
