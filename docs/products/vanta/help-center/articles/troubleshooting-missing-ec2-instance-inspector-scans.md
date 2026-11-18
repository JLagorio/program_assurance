# Troubleshooting Missing EC2 Instance Inspector Scans

Source: https://help.vanta.com/en/articles/11346001-troubleshooting-missing-ec2-instance-inspector-scans
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Administrators may notice their Inspector servers section of the vulnerabilities page says start setup:
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765390/737f362c5b33bc06916855f568a2/20205810141972?expires=1794967200&signature=8a912c50ad301b6c854d2a2ff138926a2f1846393c744d02307de67b17f535aa&req=dSUmEM54mIJWWfMW1HO4zWIfdYlYxlsRkpnFvGUGnkVlz%2FCkA4bf8%2FufsdPP%0ADwADyh6bcjcrds3duZM%3D%0A>

Or if the section does populate there is a 'No scan found' status for the vulnerability status for some of their servers
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765397/ec8d70f9ad8a8e1bf69ad734ba64/20205786135316?expires=1794967200&signature=4cbc659fbbbc7fffb2d584d492126a3372c164df3470691ea27f2c55cd9fc5c1&req=dSUmEM54mIJWXvMW1HO4zQqwXEtJu4Lu6%2BLZA2ibzWQnp3j%2B0jAz6gzbI33F%0AsroX6J4vuzU0ZBY2dm0%3D%0A>
 
This is often caused by the servers not having any vulnerabilities with fixes available, or the EC2 instance not having an actively monitored status in AWS. Other potential causes can include the region being scoped out of Vanta, or the Instances themselves being scoped out. 
​
This article will go over troubleshooting steps for these.
 

## Prerequisites
- 
Administrator access on Vanta
- 
Access to Inspector in AWS
 

## Verify Vanta Settings
The first thing an administrator should do is verify their Vanta settings for AWS.
- 
They can head to the integrations page to make sure there is no banner saying to Reconnect AWS at the top of the page:
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765392/186469d7dcddb15a90121e6c11e4/13456008920212?expires=1794967200&signature=18538d994d03079aabf39c663890e3adecafe687dc51dee2a24cbb98a704663e&req=dSUmEM54mIJWW%2FMW1HO4zTBiBtFWH0GV5VRQDSVrGfr5sybTc0xWdpncN%2BNo%0Aplp1qkToe9f4ni9Iz2I%3D%0A>
 
- 
Also check that the status is green and not a loading circle. It should say 'Connected':
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765393/6e84930ab4d557c5f2119aa5f200/13455970470804?expires=1794967200&signature=f2035b7330de76f1b703e0480693340ddac0e8df8776ace0106d383cbcf05b53&req=dSUmEM54mIJWWvMW1HO4zZrVPv9ZlOA%2BSRdQhoMtB5Q146S8lRH9w%2BVlY77Q%0A64NuN6FDyRcUYQvvUak%3D%0A>
 
- 
If there are any connection issues, please resolve them first as they may be why your scans are not coming through from Inspector. If your connection is fine move on to step three. 
- 
Next, click on Configure scope for AWS, and the goal here is to confirm that all resources have fully loaded. There should be no spinning circles or any messages about loading resources:
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765416/6e2e5b48b62a2a06b8f250927bae/13456001319060?expires=1794967200&signature=0202519a354847333dccb575a6ac6f368b65260506e1e3ff8fbba182547d49ea&req=dSUmEM54mIVeX%2FMW1HO4zTDhH4ZB%2FE3vw8njjrAJbFuc%2FVv%2F9QiAlTClTnx2%0AOJLTIj0oQtmgpB9btIU%3D%0A>
 
- 
If you see any kind of issues with loading resources please wait to write in for assistance. If you see no issues move on to step four. 
- 
Please filter your resources by EC2
 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765413/0d6c3148846aa165f21bfac3108d/13456012111764?expires=1794967200&signature=bd9695162ab5b6404922f0eb149b0d6d41f8d3f92c1e9d6ebcca39e5dc51a0d5&req=dSUmEM54mIVeWvMW1HO4zQy9hVtSLWRkDgRB1zgfj%2BZutD5R88YYkynu0axC%0AS0FGpesJ3u%2FZw9%2BvrdY%3D%0A>
 
- 
And confirm the EC2 instance(s) are marked in scope, or the specific EC2 instance you are not seeing vulnerabilities for is marked in scope and not toggled out of scope:
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765418/34f228e137fd1cb201fe4f92963a/13456043568276?expires=1794967200&signature=bc984a74daa6765f80e1ecc309c601685380f3f23808adf75473c674bb10fd53&req=dSUmEM54mIVeUfMW1HO4zQfv%2BBjfZm1cMAlj6Pcs76HgTFgagE%2Fd2oFYHryU%0AXl35yANffTqL5DeqNpI%3D%0A>
 
If the instance that is not showing scans is marked out of scope, they need to be made back in scope. See this article <https://help.vanta.com/en/articles/11346114> for more information. If the instance is in scope, please move on to the next step below.
- 
The last thing to check on the Vanta side, is to go to the integrations page then select manage --> edit:
​
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765422/3ed491a2cd147645b49feea7adad/20298272981396?expires=1794967200&signature=7a405bf4f9d8f3e94b9a69bdb282e8c7c6808ed2cf4e0fe4d94ec4e2ceeddf0d&req=dSUmEM54mIVdW%2FMW1HO4zbWHtJdAdVVTOuHTtXa4yixw8IfLFZz05sGbt0j3%0AmAxwlfhLUfn7f8BjoJc%3D%0A>
 
- 
And then when taken to this page <https://app.vanta.com/integrations?integration-dialog=aws&flow=edit>, click the pencil icon for the account the EC2 instances exist on:
​
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765430/9b240805b8d96f9577a489b8d4d2/20298257421716?expires=1794967200&signature=7b9c53d9cc93e743a5ab342d9c46559ba8d78780389ca23337cfcbb2f1520ab7&req=dSUmEM54mIVcWfMW1HO4zYHuMacM1y0fhbYsme1m9jqZqu2IqW9Z%2FZJULr3R%0A%2FbsMzCgvNeNlJhmzllg%3D%0A>
 
- 
And then confirm that the AWS Inspector feature is enabled:
​
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765432/e59b4c7e49e1cbf37748df710f9e/20298272985748?expires=1794967200&signature=7d524ca18bf4996fcbd485199eba213cbb59e5e3f9f7e05a5a2ca5ed89cec666&req=dSUmEM54mIVcW%2FMW1HO4zaaPZuo7oj7RoHcU5uBAozs%2FFX%2Bne9FIpd9ZiEUg%0A3ouhVLuoXo3MidgK%2Fpw%3D%0A>
- 
If it is not enabled, please toggle it on.

If the AWS Inspector/Basic scanning feature is enabled, and the AWS connection is up and running, and the EC2 instance with the missing scan is in scope, please move on to the next section as things are setup correctly on the Vanta side.
 

## Verify Instance Status
Vanta relies on the results from the inspector to populate the vulnerabilities page. If the inspector has no findings because no scans have been performed, the page will be blank. A common reason for an instance not having any scans is that the SSM agent is not installed or installed correctly. Instances in this state are unmonitored, meaning inspectors cannot run on them. To verify this, the administrator must:
- 
Go to the inspector dashboard inside of AWS, select Account Management from the left-hand menu, and then the instance tab:
​
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765436/50ef6b26edc30a495801536d8b7c/13455779458452?expires=1794967200&signature=373ffe30297d267f47039cc83e590c81264ac8548d07f78dcfef7c1a01b8fbb4&req=dSUmEM54mIVcX%2FMW1HO4zaVqrMi7E64lVhUkenGkXAb%2FWzxGOwJWu0SCtRxG%0AgdoU25RqHugMYZA0znM%3D%0A>
 
- 
On this page, all of the EC2 instances being monitored by the inspector will populate along with their status (the last column). Please search for your EC2 example and confirm its status. 
- 
If you are not sure how to do this, one easy method is to click the search bar, select Resource ID from the drop-down, and then enter the name of the EC2 instance in question:
​
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765446/d6443228a8c36934a185df0eb792/13455788298132?expires=1794967200&signature=9883cda0740218241882b653396ff2b35ec03c6a4e325677d29945dd85f0ad9c&req=dSUmEM54mIVbX%2FMW1HO4zUC56euSA1OQYjc5FigAPet9Df7B09hnzyk%2B1m55%0ApjsSXbSiQBNLai7Pw7k%3D%0A>
 
- 
If the instance "Activley monitoring", the status is highlighted in green below, please proceed to the next section.
 
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765452/5abae71ef892a45f4ac8d49559d9/13455776774164?expires=1794967200&signature=6287a58c825613b0a43dbb38e9f3ff39dbdaa49fc63771584729190c04091a10&req=dSUmEM54mIVaW%2FMW1HO4zTsCdnqQ7OhDKw7fqvo9bp6QQzG6D%2F4K8%2BGvBnoj%0AgnAzhQyJFWS2yi%2FsM7o%3D%0A>
 
- 
If the status is "EC2 instance stopped", then the administrator must turn the instance back on for scans to populate.
​
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765448/91dd2dede5eda2c4cb70e0963b57/20206275578772?expires=1794967200&signature=223e15c933ded49d7ea8376159a6a0b7ff63b97a79c98f6baa5b617296f66488&req=dSUmEM54mIVbUfMW1HO4zbAQMI8fFyBGWeDw%2BAqkIJFwVSm%2BonfH6eJ%2F8iqk%0AVyQKSxywET3jRKTtQGY%3D%0A>
 
If the status is not actively monitoring but instead "Unmanaged EC2 instance", or "Actively monitoring with partial errors" the SSM agent has not been installed correctly on the EC2 instance. Another tale-tell sign of this is the Operating System column shows 'UNKNOWN':
​
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765450/d4831ec6e5773d54be325c84fe3a/20206275582996?expires=1794967200&signature=e431a725cd3842b68aba0e66a60c4fb979c8e4d136b317cd6a43279066e12fe8&req=dSUmEM54mIVaWfMW1HO4zc8OLTpCvJVLsCNZ%2FAyZsQsWlRaBuoUle3iv8kQv%0AbG5GsIuy5Er5FZjDlvs%3D%0A>
 
This is needed for the inspector to work. Administrators can try the steps from AWS here <https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-prereqs.html>, which detail how to install the agent and potentially resolve this. Administrators can also click the status directly to get linked to instructions on resolving the issue:
​
[image 16]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765459/ae5d60f27e62720ef8fde0907a37/20205810160660?expires=1794967200&signature=60ebd23fddb05da1c96b8993e3bd44d6df65555bf129d2fa1ad621ac330fc4d4&req=dSUmEM54mIVaUPMW1HO4zWGtvWYpWtxIfU7vY0uvoJQsm5R28YZrY4Ncixt6%0A38%2FdqG%2Bdvpjp%2BCAlWDo%3D%0A>
Administrators can also reach out to AWS Support if they continue to face issues.
 

## Additional Resources
- 
Frequently Asked Questions: AWS Troubleshooting <https://help.vanta.com/en/articles/11346058>
- 
Serverless Function Error Rate Monitored (AWS) <https://help.vanta.com/en/articles/11346066>
- 
Missing Metrics for Load balancer server errors monitored (AWS) Test <https://help.vanta.com/en/articles/11346031>
- 
How to Pass the Load balancers redirect HTTP to HTTPS (AWS) Test <https://help.vanta.com/en/articles/11346045>

## Images

- [image 01] ../../images/ux/vulnerabilities/troubleshooting-missing-ec2-instance-inspector-scans--01.png
- [image 02] ../../images/ux/vulnerabilities/troubleshooting-missing-ec2-instance-inspector-scans--02.png
- [image 03] ../../images/ux/integrations/troubleshooting-missing-ec2-instance-inspector-scans--03.png
- [image 04] ../../images/ux/integrations/troubleshooting-missing-ec2-instance-inspector-scans--04.png
- [image 05] ../../images/ux/integrations/troubleshooting-missing-ec2-instance-inspector-scans--05.png
- [image 06] ../../images/ux/integrations/troubleshooting-missing-ec2-instance-inspector-scans--06.png
- [image 07] ../../images/ux/integrations/troubleshooting-missing-ec2-instance-inspector-scans--07.png
- [image 08] ../../images/ux/integrations/troubleshooting-missing-ec2-instance-inspector-scans--08.png
- [image 09] ../../images/ux/integrations/troubleshooting-missing-ec2-instance-inspector-scans--09.png
- [image 10] ../../images/ux/integrations/troubleshooting-missing-ec2-instance-inspector-scans--10.png
- [image 11] ../../images/integrations/aws/troubleshooting-missing-ec2-instance-inspector-scans--11.png
- [image 12] ../../images/integrations/aws/troubleshooting-missing-ec2-instance-inspector-scans--12.png
- [image 13] ../../images/integrations/aws/no-vulnerability-data-received-aws--11.png
- [image 14] ../../images/integrations/aws/troubleshooting-missing-ec2-instance-inspector-scans--14.png
- [image 15] ../../images/integrations/aws/troubleshooting-missing-ec2-instance-inspector-scans--15.png
- [image 16] ../../images/integrations/aws/troubleshooting-missing-ec2-instance-inspector-scans--16.png
