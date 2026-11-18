# Connecting Vanta & AWS Accounts

Source: https://help.vanta.com/en/articles/11345630-connecting-vanta-aws-accounts
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

✅ Feature availability: This integration is now available for Vanta Government <https://www.vanta.com/solutions/public-sector> customers. 
Vanta lets you connect one or multiple AWS accounts. This article covers connecting individual AWS accounts. To connect all AWS accounts managed under an AWS Organization, refer to Connecting Vanta & AWS Organization <https://help.vanta.com/en/articles/11345628-connecting-vanta-aws-organization?utm_source=chatgpt.com>.
​

## Supported connection patterns
Before connecting, review what Vanta supports for AWS accounts: 
- 
You can connect multiple individual AWS accounts to a single Vanta workspace.
- 
You cannot mix individual Account-level and Organization-level connections within a single Vanta workspace. If you want to connect at the Organization level instead, you must first remove any individually connected accounts.
To connect all accounts managed under an AWS Organization in one step, see Connecting Vanta to an AWS Organization <https://help.vanta.com/en/articles/11345628-connecting-vanta-to-an-aws-organization?q=aws+accounts>. 
 

## Prerequisites
- 
The user in Vanta connecting must be an editor or an admin in Vanta
- 
The user must also have admin access to AWS, or permissions to create Roles and Policies in IAM

## Connect an AWS Account (Initial)
- 
To connect, go to the Integrations page and search for Amazon Web. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
You will be taken to a page prompting you to choose the type of account you wish to connect for the integration. There are two account types, Account and Organization:​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764697/ac3796c6494ef988cf92f67a51d8/29860812248084?expires=1794967200&signature=0190179ef3847227fc3c829480b113055f4b0713476414a5f03d841fa33461ba&req=dSUmEM54mYdWXvMW1HO4zZQop2RRLmyMrLhf%2BFADRiuRPSLDVlo%2FrKc2%2FdFR%0AZrAcqCGMs6HkjtRz4A0%3D%0A>
 
- 
Select Account , for the Organization connection flow, please navigate to Connecting Vanta & AWS Organization <https://help.vanta.com/en/articles/11345628>
​​ 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764700/8ab4a2185fef7c8d6e2a8bbf05ad/29860812252308?expires=1794967200&signature=7eb57dc0eea4cb2f52af2e94705a9807a061afd6e1285f9e5334b80c35eaf9ae&req=dSUmEM54mYZfWfMW1HO4zXsp13d54mnsn7mCzkFXuu5OHjx555grjOQzCs7K%0AqtS3%0A>
 ​
- 
You will then be prompted to select your preferred method. The option you choose will depend on how you manage instances and resources active on your AWS account. There are three options available:
​
1. Console - we'll continue with Console in this article, please select Console under the preferred method and then next: 
​
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764702/adc735eff35eee391d2a7797b275/29860812255508?expires=1794967200&signature=2fbf4d5d974b1e455ac568fef875c99ac785ffb7cdca7c75d6b1446689548f37&req=dSUmEM54mYZfW%2FMW1HO4zb3HcEh3CoUbdEbgGm%2BecEQTbIsb3cLE1156P7Mo%0AqdPs%0A>

​
2. CloudFormation - See, Connecting AWS with CloudFormation <https://help.vanta.com/en/articles/11345623>
3. Terraform

## Account Type
- 
You will be taken to a menu where you must select your account type. Select Yes, if the AWS Account you are connecting is an AWS GovCloud Account, or No if it is not; then click Next
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764717/6241544068b4f3cc1fdd3a24ad3b/29860812258068?expires=1794967200&signature=62df3f3ea185593e3435db2aac96db4876651d39e7c003dbadd6ef1ac01a9fa6&req=dSUmEM54mYZeXvMW1HO4zUt3W9Y51ff1BYpyaNCp225ALeo0YONGvrxiaFSp%0A52Y%2BXf%2FWlSVim%2B%2BGW%2BA%3D%0A>
 

## Selecting Products
- 
You will be taken to a menu where you can select the products used within your organization. You can click the toggle button to enable the desired product on the integration:
​
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764720/140dc0d9e66eaf7628e30b1c39ce/29860782378004?expires=1794967200&signature=017e464a89703536364468574aca48a16b69b638eaa6b739cf6205f71c632983&req=dSUmEM54mYZdWfMW1HO4zVxbq%2FYc1amamChexaCiTAVj4IOsdcwk54iWTOuj%0A6WZB%0A>

​
The available products on this menu are:
​
1. AWS Web Services (On by Default, Cannot be Disabled) 
2. AWS CodeCommit
3. AWS IAM Identity Center
4. Amazon Inspector/Basic Scanning
​
​
- 
The products you enable here determine what permissions need to be granted in the policy that is created in later steps.
- 
If you enable a product after connecting the integration you will need to update your VantaAdditionalPermisisons policy. - See (Modifying the VantaAdditionalPermission Policy for Individual AWS Accounts <https://help.vanta.com/en/articles/11345613>)
- 
These features also may incur additional costs within AWS if they are not already in use. You can hover over the tooltip (i) to see more details about how this feature works in Vanta:
​
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764738/ad11a22e31919b6adb8380d06098/29860782388116?expires=1794967200&signature=46517707944896bc34836c586db8c3f201fcba03f1d6854bfdabf0546081f209&req=dSUmEM54mYZcUfMW1HO4zZTaANDNsTZj5djlpTet3AxJD%2FYzlvdiBKwcPAtr%0AGLGo%0A>
- 
After enabling the desired products, click the next button to move on to policy creation. 
​
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764726/189902348efe08f1f9330b401656/29860812263188?expires=1794967200&signature=9d2780d3e276558545958cdcb9aa160f6b113de156aabb36257e22c7e10e7172&req=dSUmEM54mYZdX%2FMW1HO4zaZ7RHTDANBXzAmWiPGfDWWToqiQPUW9BEVD4PpT%0A82G5%0A>

## Policy Creation
- 
You will be presented with a page displaying JSON of the permissions you need to grant Vanta in order for the integration to work. The permissions displayed depend on the products enabled in the previous menu. You will need to add these permissions to a customer-managed policy in AWS. 
​
​
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764739/fa0b12ad6122992b6b86520c49ca/29860812264596?expires=1794967200&signature=84aa74c98b699008a8d5e79bd9bac977210ac4eae21e20d231fa5b7f7ac6ea81&req=dSUmEM54mYZcUPMW1HO4zRLgCAWLFJ0qN9UVCjeyYNKezPA%2F0KxYECceFBdp%0AbS%2BC%0A>
- 
Sign into AWS, and once on the home page, use the search bar to search for IAM, and click 'policies' in the Top Features sub-menu:
​
​
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764742/2354082accc1e79c645ccc35a9c3/29860782397716?expires=1794967200&signature=b9835d3bfe0594300248096b8b463521e2404741fa6ec256924cb7aeba2e6a84&req=dSUmEM54mYZbW%2FMW1HO4za0TkW2XJKGttDXwZ%2FZjz15mCV5Mbhl0XSnVk7mz%0A6eYe%0A>
- 
Next click create policy, and then click JSON button on the Policy editor table. From there delete the existing text in the editor:
​
​
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764761/8f43ff46c278e7f556dd4e15b1a5/29860782400404?expires=1794967200&signature=e6530946c58ae179bbc3e9fae1fccf4c7776d74a8ab202549c1e0274e73dd32d&req=dSUmEM54mYZZWPMW1HO4zdkrtmykggAU%2FmkkwEHiIvVVWMYkzSfxAOW8%2Bno%2B%0A9YLi%0A>
- 
Navigate back to Vanta and click the copy button:
​
​
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764762/1bec620bca9c091499cfc118e789/29860782405908?expires=1794967200&signature=cc9b90553503f6ac7c97fedb8f7eb5733a96c998dd061e937752df42dc96f5f0&req=dSUmEM54mYZZW%2FMW1HO4zSVd5pqk21WCLW8PwrRVs8NtFcidfcylgxh0dZXe%0AEdDU%0A>

​
Then, head back over to the policy editor in AWS, and paste the copied JSON into the editor. Ensure there are no extra spaces or additional characters, then click next:
​
​
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764766/f9f430150258f634bb84e184fd24/29861435042324?expires=1794967200&signature=290c2872ef35384bf186a915695edb556489614d6ca7c4c6828e7fe344944c0e&req=dSUmEM54mYZZX%2FMW1HO4zWnUWFBwtL%2B11is16JaL1praULYc9%2Foam2s8ydK4%0AgzbD%0A>
- 
After you click the Next button
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764769/d20be2897773910b321bb76022e1/28360759707924?expires=1794967200&signature=46f6f74039bf9625e222cfa2852dc900b99ef8cf9e4d178b8561860b6e06755b&req=dSUmEM54mYZZUPMW1HO4zf0weZvd8JqLODJt6%2B%2BFEB0y6AiG6xGfamJetvSe%0AYBdTkTeJ4vSOlnPaaoA%3D%0A>
- 
You will be taken to a page where you must enter policy details such as name and description. Name the policy VantaAdditionalPermissions and enter your desired description, then click Create policy:
​
​
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764783/e1dcec2f4e4bc7bd70b82419aaaa/29860782416020?expires=1794967200&signature=2e2bd6795e8ce3e6e075d4dcc844691daa9505ccae229abc42df4f6261ba383b&req=dSUmEM54mYZXWvMW1HO4zRd39ZwkXjTA9GkcQOfytB%2FIRbdm5Cc4aZ7ig0oZ%0Ao6Qd%0A>
Please Note: "VantaAdditionalPermissions" must be created as a Customer Managed policy type to be detected successfully. If the policy was created as an 'Inline policy' please see AWS documents on how to convert the type here: Converting an inline policy to a managed policy <https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies-convert-inline-to-managed.html>
 

## Role creation
After the policy is created in AWS, return to Vanta and click Next to proceed to the Role creation section:
​
​
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764792/b2bf6cc556bc24b6acca0082ae30/29860782419732?expires=1794967200&signature=35a2be5abf184713144cba523338072315614e1cf47eda7254503c3454d78a4d&req=dSUmEM54mYZWW%2FMW1HO4zVl%2BKrDa4M6NEsc2mblbJiuZykpJ4juObomV8yhR%0AFZUhcMNB1tolB2MXFak%3D%0A>
- 
You will be instructed to navigate back to AWS and head to roles page in IAM. This can be found by going to the left hand menu, and selecting roles under 'Access Management':
​
​
[image 16]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764796/3685768274fda5d47056007b87f1/29861572115732?expires=1794967200&signature=740f0f0900eb09415b87d2166ddcf2094862f923a518c16b2e8c60564c43cb6c&req=dSUmEM54mYZWX%2FMW1HO4zWPfwMDes3sl54wWO%2BReJEuxnu6El8R4pf7OkEYR%0AmuNH%0A>
- 
Click on the 'Create role' button on the top right:
​
​
[image 17]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764799/61c6247b113a8c191b674f10f258/29861598787988?expires=1794967200&signature=91d3ba190312265c90fdc9f25bc057d81e86c344dedb11cae7419c7ad8c95d0b&req=dSUmEM54mYZWUPMW1HO4zeRbEES%2B%2FGx0iCa7Zple%2FyC%2FZYGOrUKh6S99dj23%0AyWVk%0A>
- 
Then select 'Custom trust policy' as the Trusted entity type :
​
​
[image 18]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764813/4862d0db3976e55498ddb0355893/29860812285460?expires=1794967200&signature=6a471f40242e6afa12f29258d8393258a22848f028c6d4c9cd19bac85e3e7250&req=dSUmEM54mYleWvMW1HO4zVbK99CV9jrgkdic9nWbjTWOgnC8KNKkhtXse%2F9c%0AROaU%0A>
- 
A text editor will appear on the bottom of the page after the selection is made , delete all of the existing text:
​
​
[image 19]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764830/98e9bd78dcc8261c38c4fefbf062/29860782435092?expires=1794967200&signature=fa0414c761572c67d80ee170728cf20e24bcc7d0c2af66f5de361b30b1dea53f&req=dSUmEM54mYlcWfMW1HO4za4DLIKQ8yK9dueigiSNhOImTJ22rAc%2F8AwPbGf2%0Ak0gJ%0A>
- 
Then head back into Vanta and copy the snippet below step 3 and head back into AWS and paste it into the editor. From there click Next on the bottom right of the page:
​
​
[image 20]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764826/24c406cb4bfda04aaaa5121073de/29861770761492?expires=1794967200&signature=094dbd2b3b1fef994b10ba57e8c4dfffcdcf8219146320d8b3aab63739305b30&req=dSUmEM54mYldX%2FMW1HO4zevVKyO4PCTgTZnCXKeKvYz0PQWO8Xnchvp7oEUt%0Ai3oq%0A>
- 
You will be taken to a page where you will grant the role specific permissions, those being the SecurityAudit permission set and the VantaAdditionalPermisisons you created in an earlier step. Both these permissions are required for the integration to work properly, do not omit either. 
​
- 
You can search for these permissions in the search box and click the box next to them to grant the permission to the role.
​
​
[image 21]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764833/fd8ffe208795b65e6dcc912e4a84/29860782442132?expires=1794967200&signature=0388b04ea203d2ba06c390e1852f8461dc30a98967d2c0dd179c624234ef329d&req=dSUmEM54mYlcWvMW1HO4zW6ogUwUyOeVMrSVE7btF4ziiXIKnCzbePEycgLM%0AYHJJ%0A>
- 
The searching and selecting process needs to be done one by one. You can click next when you have checked off both:
​
​
[image 22]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764837/4ec3cb8c8376d2ff157c1e4291e3/29862124776596?expires=1794967200&signature=4dc35522bb5224a26a338fe3349e4c68bf75d55d944b4a90fdba6034cda3a3ee&req=dSUmEM54mYlcXvMW1HO4zYAr3Eg%2B9kVCPI68Fi61gNLAmfSQ%2FN4zheUtii%2Bz%0AVBhS%0A>
- 
You will be taken to a page where you must grant the role a name, and a description. Name the role vanta-auditor and enter your desired description, then click Create role on the bottom right of the page:
​
​
[image 23]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764836/baefd3918c938535d1cae598bc68/29861831645972?expires=1794967200&signature=9ffdc952f4c821002545ddb10a1342d1c98b75fb4c48111c33d9cb7512be1eb9&req=dSUmEM54mYlcX%2FMW1HO4zTqyjB3ky8S2MVIS8M3VT41IE5TxfM5Fs0XF%2BRDU%0AlsIv%0A>
- 
You will see a green success banner stating the role has been created.
​
​
[image 24]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764841/af9ee93a372f26234e0d590e0127/29860812303252?expires=1794967200&signature=9ae9022efb101de89e8daa01f29c4e93baec05ffbb4d6990444a8fe72e8d7d8b&req=dSUmEM54mYlbWPMW1HO4zSKd4DN%2FST8ZqRFF05NNgrShvaP9ZkZhiHM6h8Vy%0AW4XR%0A>
- 
Click the View Role button 
​
​
[image 25]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764849/5523946a20177fd93d29d5cf67c3/29860782448660?expires=1794967200&signature=8fce848e0f9ef2106b25a5714214a6d6159a4e11d456532cfc207279a7dce30e&req=dSUmEM54mYlbUPMW1HO4zUZ0gUap%2B496O4UD0fqBtIbrNgEOp%2F38gIapUeLq%0AN26b%0A>
- 
Copy the ARN of the role you just created:
​
​
[image 26]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764851/f92f8382c6d19789f805ffbed7dc/29861831646868?expires=1794967200&signature=1bed4350a1583388fa923998de5cd1196bcb52ca869c40708f28c4f2f38cf6ba&req=dSUmEM54mYlaWPMW1HO4zY%2FsEgxkcdsqpa9v8941jDuL1VHpfkrmxN8nn3uD%0A0NYh%0A>

## Role ARN:
- 
Head back to Vanta and click Next twice to head to the 'Role ARN' section:
​
​
[image 27]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764868/36c47cdd43fb8d65ea3f1601d5b5/29860812320148?expires=1794967200&signature=a8d094205645c75efe740e5c2264182d1c071f884e5e407d40bc49086cbb8b04&req=dSUmEM54mYlZUfMW1HO4zdcTJRiTFH%2BABC0Imq9T%2FMACtyF6OmWuYwxwE3GO%0ArTX4%0A>
- 
Next, paste the ARN you copied from AWS into the text box under step 2 and click next:
​
​
[image 28]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764863/51a84afb227aeaa3f42b73736c04/29860812325524?expires=1794967200&signature=0e72044171b544f79f4b189c586c5b1c80acfa575e3ad5e00146ba1c77729f08&req=dSUmEM54mYlZWvMW1HO4zeaEbD2TTGGb03wbtJ6dBDXefrv85lPzqULsiGnW%0AYXTY%0A>

## Selecting Regions:
- 
In the Region selection step, you will be able to add additional regions outside of the default by clicking on Select regions box
​
​
[image 29]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764865/cbd0b743a4342caf95079283fcef/28360745091732?expires=1794967200&signature=c1df27d83a83537fc81119936b3e5e2ba398cd2fe450f0a4aa9000f597de4cb8&req=dSUmEM54mYlZXPMW1HO4zcqhCO4%2BF9EvoCloKY8%2BoLMxoEFiUChLUoTk5HaW%0AG4g4vBjOPtByOUSiQhI%3D%0A>
- 
You can click the "X" to remove any regions that you do not wish to be connected. If removed, Vanta will not pull in any resources within that region on the account.
- 
Clicking Next will complete the linking process.
If it's successful, you will receive the message "All your resources have finished loading."
Please note: if your AWS environment has a large number of resources, it might take Vanta a few minutes to fetch all the resources.
You can click Done to exit the Configure Scope step without affecting the connection process
​
​
[image 30]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764866/cd3ce2f2de9928db12575889aa67/12135826554260?expires=1794967200&signature=edc1e89c6b3cd6627e5ead2279443cf72b4dd2ce01f6871b5b854255dd99404b&req=dSUmEM54mYlZX%2FMW1HO4zV91EIWJU9aqOOLJe4A4z87mag4SUoFKUJv3l5IF%0AJ2jfOITCiyTAwzY3zkg%3D%0A>
- 
After you are done with the initial account connection, you can add additional AWS accounts by:
- 
Navigate to the Integrations page <https://app.vanta.com/integrations?integration-dialog=aws&flow=edit>
- 
Under Amazon Web Services
- 
Click Manage, Edit, then Add new account to repeat the connection workflow
[image 31]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764876/2e7d27ea7efe2542bf3105b10581/28360745092884?expires=1794967200&signature=e7927c868b56dde10ee85fbd26a94ceba64171b6f031f7846d8f9bccf879f9db&req=dSUmEM54mYlYX%2FMW1HO4zVSlNKkQxvK4nY5BupmTnFHzz%2FpebT%2F6I1woLRw%2B%0Aak4FqGbgtGmBob%2Bu1yQ%3D%0A>
 
If you enabled Amazon Inspector/Basic Scanning, this step will also include a vulnerability severity threshold option. Select the minimum severity level of Amazon Inspector findings you want Vanta to ingest (Critical, High, Medium, or Low). Only findings at or above that level will be imported into Vanta. This applies to both EC2 host vulnerabilities and ECR container vulnerabilities.
 
You can update this setting at any time by selecting Edit on your AWS connection from the Integrations page.
 
For more information on how severity filtering works, see Setting up Vulnerability Scanning <https://help.vanta.com/en/articles/11345769-setting-up-vulnerability-scanning>.
 

## (Optional): Adding Permissions to S3 Bucket Policies
- 
If you're not using S3 Bucket policies, you will not need to modify any policy for Vanta to read in S3 Buckets. If your account is using S3 buckets, you may be using S3 Bucket Policies <https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html>. If so, you'll need to also modify these permissions to let Vanta fetch your buckets, since S3 bucket policies override the default permissions.
- 
To do this, grant further permissions to `vanta-auditor` on the bucket policy itself by following instructions under "Granting cross-account bucket access to a specific IAM role" in AWS's guide <https://aws.amazon.com/blogs/security/how-to-restrict-amazon-s3-bucket-access-to-a-specific-iam-role/>. The permissions should be those from the `SecurityAudit` policy. Here is an example of what you would add to the bucket policy:
​
​{
"Effect": "Allow",
"Principal": {
    "AWS": "arn:aws:iam::111111111111:role/vanta-auditor"
  },
"Action": [
    "s3:GetAccelerateConfiguration",
    "s3:GetAnalyticsConfiguration",
    "s3:GetBucket*",
    "s3:GetEncryptionConfiguration",
    "s3:GetInventoryConfiguration",
    "s3:GetLifecycleConfiguration",
    "s3:GetMetricsConfiguration",
    "s3:GetObjectAcl",
    "s3:GetObjectVersionAcl",
    "s3:GetReplicationConfiguration"
  ],
  "Resource": "arn:aws:s3:::MyExampleBucket/*"
},

## Images

- [image 01] ../../images/integrations/aws/connecting-vanta-aws-accounts--01.png
- [image 02] ../../images/integrations/aws/connecting-vanta-aws-accounts--02.png
- [image 03] ../../images/ux/integrations/connecting-vanta-aws-accounts--03.png
- [image 04] ../../images/ux/integrations/connecting-vanta-aws-accounts--04.png
- [image 05] ../../images/ux/integrations/connecting-vanta-aws-accounts--05.png
- [image 06] ../../images/ux/integrations/connecting-vanta-aws-accounts--06.png
- [image 07] ../../images/ux/integrations/connecting-vanta-aws-accounts--07.png
- [image 08] ../../images/ux/integrations/connecting-vanta-aws-accounts--08.png
- [image 09] ../../images/integrations/aws/connecting-vanta-aws-accounts--09.png
- [image 10] ../../images/integrations/aws/connecting-vanta-aws-accounts--10.png
- [image 11] ../../images/integrations/aws/connecting-vanta-aws-accounts--11.png
- [image 12] ../../images/ux/integrations/connecting-vanta-aws-accounts--12.png
- [image 13] ../../images/integrations/aws/connecting-vanta-aws-accounts--13.png
- [image 14] ../../images/integrations/aws/connecting-vanta-aws-accounts--14.png
- [image 15] ../../images/ux/integrations/connecting-vanta-aws-accounts--15.png
- [image 16] ../../images/integrations/aws/connecting-vanta-aws-accounts--16.png
- [image 17] ../../images/integrations/aws/connecting-vanta-aws-accounts--17.png
- [image 18] ../../images/integrations/aws/connecting-vanta-aws-accounts--18.png
- [image 19] ../../images/integrations/aws/connecting-vanta-aws-accounts--19.png
- [image 20] ../../images/integrations/aws/connecting-vanta-aws-accounts--20.png
- [image 21] ../../images/integrations/aws/connecting-vanta-aws-accounts--21.png
- [image 22] ../../images/integrations/aws/connecting-vanta-aws-accounts--22.png
- [image 23] ../../images/integrations/aws/connecting-vanta-aws-accounts--23.png
- [image 24] ../../images/integrations/aws/connecting-vanta-aws-accounts--24.png
- [image 25] ../../images/integrations/aws/connecting-vanta-aws-accounts--25.png
- [image 26] ../../images/integrations/aws/connecting-vanta-aws-accounts--26.png
- [image 27] ../../images/ux/integrations/connecting-vanta-aws-accounts--27.png
- [image 28] ../../images/ux/integrations/connecting-vanta-aws-accounts--28.png
- [image 29] ../../images/ux/integrations/connecting-vanta-aws-accounts--29.png
- [image 30] ../../images/ux/integrations/connecting-vanta-aws-accounts--30.png
- [image 31] ../../images/integrations/aws/connecting-vanta-aws-accounts--31.png
