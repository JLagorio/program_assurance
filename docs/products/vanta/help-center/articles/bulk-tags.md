# Bulk Tags

Source: https://help.vanta.com/en/articles/11345627-bulk-tags
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Vanta supports reading tags (called labels in GCP) from our various cloud provider integrations to populate different attributes of cloud resources, such as owner, description, user data, and scope. While these attributes can be set manually on the Inventory <https://app.vanta.com/inventory> page or Integrations <https://app.vanta.com/integrations> page for scoping, these fields are not persistent and will disappear once the integration is disconnected. For this reason, we recommend using tags, as they are continuous and more scalable.
Vanta offers two bulk tagging options:
- 
Vanta tags
- 
Custom tags

## Vanta tags
- 
View available Vanta tags by navigating to Inventory <https://app.vanta.com/inventory> in the left-hand column under Assets, and select the Edit bulk tag button in the top right corner
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764075/be4542f554b4c612d113dc691108/27567206655124?expires=1794967200&signature=2d35bba0d3876ded660efd881e523457f14f10e78d7e2af818cf184b3af39872&req=dSUmEM54mYFYXPMW1HO4zTQRUr%2FFc%2FAkWAjqgw5sD%2BMfexxtv1SqPVxDvUnn%0Ar8M5LcZ8iFXKNI8aR64%3D%0A>
- 
Select your cloud provider from the left-hand menu and go to the Vanta tags tab
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764076/b10e4aba5cbd88a1c7f97aa222ac/27567144691092?expires=1794967200&signature=0d79f4c38e4338806934e0c07cb706cdcd991a4d131d0e5dc8eff17e04023647&req=dSUmEM54mYFYX%2FMW1HO4zRAS49%2FWqG5US%2Fti4A%2BWTuJZ0pOq825K3RzqwZwL%0AJQFaeUf6JF4TBhEV2No%3D%0A>
- 
You should then see a list of available Vanta tags with examples of how to use each, including what the expected value is for the specific tag:
We will provide the exact tag details below for your reference:VantaOwner 
- 
For AWS and Azure, this is the email address of the instance's owner, and it should be set to the email address of a user in Vanta. An owner will not be assigned if there is no user in Vanta with the email specified.
- 
For Digital Ocean and GCP, this is everything before the @ sign in the email address, with the . replacement with_dot_. Example: [email protected] invanta-ownerfor GCP would be vanta-owner = john_dot_doe.VantaNonProd
- 
This tag is present on a resource marking it as non-production. Having the value set to true will also keep a resource as non-production.
- 
- 
Vanta will mark the resource as out of scope once the tag is applied. Only apply this tag for non-production resources.
​VantaDescription
- 
This tag allows administrators to set a description, for instance, or add any other descriptive information.VantaContainsUserData
- 
This tag allows administrators to define whether or not a resource contains user data (True/0) or if they do not contain user data (False/1).VantaContainsEPHI
- 
This tag allows administrators to define whether or not a resource contains electronically Protected Health Information (ePHI). It can be set to either (True/0) or if they do not have ephi data (False/1).
- 
 This tag is only available for customers who are using HIPAA standards.VantaUserDataStored
- 
This tag allows administrators to describe the type of user data the instance contains.VantaNoAlert
- 
Administrators can add this tag to mark a resource as out of scope for their audit. If this tag is added, the administrator will need to set a reason for why it's not relevant to their audit.
See an example in AWS:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764072/2a7dd77cea7dc79abd955d527d61/24960510764564?expires=1794967200&signature=724956b4dbd81e3d1d3709d2d6f56caed6a7ae66792eb027cbfb92aeb37b1817&req=dSUmEM54mYFYW%2FMW1HO4zUs8kovyEb%2FquDb5EBj9zWXwHfheYwy4WHkJMGFZ%0Ak1pqtBVnUWLPgtisN%2Bg%3D%0A>
For the EC2 instance above - because it is tagged with "VantaOwner: [email protected]" This means that Vanta will apply whichever user in Vanta has that email as the item owner on the inventory page.
Currently, Vanta does not support Vanta tags or custom tags for Heroku resources, and does not support custom tags for Digital Ocean.

## Adding Custom Tags
- 
From the Inventory <https://app.vanta.com/inventory> page, select Edit Bulk Tag in the upper right corner
- 
Select your cloud provider from the left-hand menu and go to Custom Tags
- 
In the table, enter the names and values of your custom tags in the input fields to map them to existing Vanta tags
- 
In the below example, the custom tag owner maps to the Vanta tag VantaOwner, and the custom tag env with the value of true maps to the Vanta tag VantaNonProd
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764074/6f8639e60523ccb9d1e1e4250f18/27567144694292?expires=1794967200&signature=273321756864f4cc916b1c879f2323695f7e5ba7ac2063eaf40ccda684c38d0c&req=dSUmEM54mYFYXfMW1HO4zcnuFKKquuFbKHMrR0bhyB%2F2qnfPVgZ5jgSExSth%0ApPkxvn%2F%2BRYTfenOOWWM%3D%0A>
- 
Once complete, click Save Changes
In the example above, instead of a tag consisting of "VantaOwner:[email protected]", you would set the tag to "owner:[email protected]".

## Images

- [image 01] ../../images/ux/inventory/bulk-tags--01.png
- [image 02] ../../images/ux/other/bulk-tags--02.png
- [image 03] ../../images/integrations/aws/bulk-tags--03.png
- [image 04] ../../images/ux/other/bulk-tags--04.png
