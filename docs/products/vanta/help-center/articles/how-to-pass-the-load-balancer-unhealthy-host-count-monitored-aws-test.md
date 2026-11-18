# How to pass the Load balancer unhealthy host count monitored (AWS) Test

Source: https://help.vanta.com/en/articles/11345997-how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

The Load balancer unhealthy host count monitored (AWS) <https://app.vanta.com/tests/load-balancers-monitored-and-alarmed-config-healthy> test requires that you set up healthy host count alerts in Amazon Cloudwatch or a 3rd party monitoring provider for your application and classic load balancers. Define alerts for at least one of the following metric categories:
- 
UnHealthyHostCount
- 
HealthyHostCount
- 
EnvironmentHealth
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765243/5bfc9ff9bb7285bffa8f76d37ac8/27543223769364?expires=1794967200&signature=7efa41a942f342c44df1cf8be22219105b7c196be29128c32b7bde5792a996c2&req=dSUmEM54mINbWvMW1HO4zeufqjU%2FmE9rlTxcpAy80uPod6nhAjqkr0keSqBF%0A1KjSrjUl%2F%2B287tOiktI%3D%0A>
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765245/ee56ba7ea9f26d3487552fbb8cb2/27543223777940?expires=1794967200&signature=e0d661c93de8908d8f0ec3a6552f7f5fcecf4b3e5aa916389d216cba3350b4e0&req=dSUmEM54mINbXPMW1HO4zbcJDjQbnLG9%2Fy6cahBALLS%2FAesx11lMcrsnXkQ0%0Aeux4fYEJAsBwYOnShNw%3D%0A>
 

## Prerequisites
- 
AWS Cloudwatch
- 
AWS Classic or Application ELB
 

## Procedure
For Classic and Application Load Balancers, We're reading these two metrics:UnHealthyHostCountHealthyHostCount
 
- 
Select one of the two Metrics, and continue
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765244/a946e1b526e7d5d53a67a423c576/21994076085268?expires=1794967200&signature=7132448b183affb4b0e49305fc6bea5da823e137111732ded2e67e5ea4a7071e&req=dSUmEM54mINbXfMW1HO4zT%2BealTOEzlAxcw21K8UvLvnffMkyttcOEKGh3Dt%0AfehN4zGZ9XuMhxWfTVA%3D%0A>
 
- 
Next, Configure the Alarm Conditions
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765247/efa75a1aaf252c6a8417702742c9/21994076098708?expires=1794967200&signature=87c25ceb8ae3d3b7c3df69593f90593fef6462b6676428971c1dc26033ec7cba&req=dSUmEM54mINbXvMW1HO4zUsDMphE2zO7cs6W9CDaJIdz%2FObu5ZyxA2%2BddmjN%0ABgCHvxtBcAgo%2BNkoh8Q%3D%0A>
 
- 
And finally, Configure the Notification type and any Action you'd like to take
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765260/12440d1060f407c5bcd5c9fcef69/21994076117652?expires=1794967200&signature=387fbd440fd277e24d25991eebcdddc69b683f476c8f284bd0f796b75cd500b1&req=dSUmEM54mINZWfMW1HO4zRuR0nthrXJHKHM70PJtXBH6vZS2d57vuWDHddYi%0AzLjJtozUNi1xB70Y1gk%3D%0A>

The same steps apply for a Classic Load Balancer:
​
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765256/7096365605345ad5725494cf4910/21994076153236?expires=1794967200&signature=88db44cc02e7e9b481634760a14b61dd06dec5097f6ddc1e94a6621e9f4f2648&req=dSUmEM54mINaX%2FMW1HO4zZy%2FkDYYswD2Gs%2BxbGpPPdPeZ3pfW%2BCEATLekDHx%0A9PugfJ2EoTVmiNfT6oE%3D%0A>

​
​
Once finished, you should see your new Alarm appear in the All Alarms dashboard!
Vanta will then pull this Load Balancer in and test to see if alarms are configured for those metrics.
- 
For ElasticBeanstalk, We look for the following Metric:EnvironmentHealth
 
Example:
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765259/e358e199cab01aa2731d339c39c6/21994076159892?expires=1794967200&signature=dbaff01260d0d3aef9978ca12e3f9fc1ed4bb83bc7ae0873034dc7409ca07ff9&req=dSUmEM54mINaUPMW1HO4zUc14D8HZGayDAkngeMOPxume6UGB2327YysScsr%0AU8iAfhtCzyf%2BHEaguGU%3D%0A>
 
 

## Common Issues
- 
Vanta cannot read your Queried Metrics for your Alarms:
​
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765257/100b6b3ffa52fdf1ce0eff7b2c94/13565566862228?expires=1794967200&signature=1ae0a97381c78b562dcad3b52c3e2373bc8abf94f36ae3307d6b05b5fd6bb723&req=dSUmEM54mINaXvMW1HO4zRLNwusJIezzfsfAOauXcErNV2EWApSzE%2B4wTAJT%0Afo1g%0A>
 
- 
If you're using a Query to build your alarms, You may need to deactivate monitoring <https://help.vanta.com/en/articles/11346051> on that specific Load Balancer. You can upload a screenshot of your current Alarm config for manual evidence.

## Images

- [image 01] ../../images/ux/tests/how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test--01.png
- [image 02] ../../images/ux/tests/how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test--02.png
- [image 03] ../../images/integrations/aws/how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test--03.png
- [image 04] ../../images/integrations/aws/how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test--04.png
- [image 05] ../../images/integrations/aws/how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test--05.png
- [image 06] ../../images/integrations/aws/how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test--06.png
- [image 07] ../../images/integrations/aws/how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test--07.png
- [image 08] ../../images/integrations/aws/how-to-pass-the-load-balancer-unhealthy-host-count-monitored-aws-test--08.png
