# Create AWS Cloud Watch Alarms to pass Vanta Tests

Source: https://help.vanta.com/en/articles/11346025-create-aws-cloud-watch-alarms-to-pass-vanta-tests
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

The AWS Engineering test requires administrators to create a Cloudwatch alarm using the metric specified to monitor each resource(s) flagged as failing on the test page. These resources vary across tests such as EC2, Load Balancer, SQS Queues, etc... and so do the metrics (CPU Utilization, Loadbalancer Health, HTTP_5XX, etc..), but the steps are the same for all. The only difference is the metric required and the resource type. This article will review how to create CloudWatch alarms and use the Messaging queue message age-monitored test as an example.
 

## Prerequisites
- 
Access to AWS Console
- 
Administrator Access to Vanta
 

## Procedure
- 
Sign in to the AWS account where your flagged resources exist and search for CloudWatch.
- 
Select the region your resources exist in from the top right menu; in this example, I will select US West (Oregon), also known as us-west-2
- 
If you are unsure what region or account the resource exists under, go to the test page and look under the name of the flagged help. Vanta should specify the account number and region:
- 
Now that you are in the region the resources were created on, select All Alarms from the left-hand menu:
- 
Click the orange create alarm button next
- 
You should be taken to a page similar to the one below; click on Select metric
- 
You will see a pop-up menu appear allowing you to search for metrics
- 
You can head back into Vanta (in a different tab) and confirm the metric the test asks you to monitor on the resource. This should be listed in the how to fix section. In the example below, it is asking for ApproximateAgeOfOldestMessage :
- 
Head back to the AWS tab and type the name of the metric (in this case ApproximateAgeOfOldestMessage)  into the search bar and press return to search for it or click the magnifying glass icon:
- 
You will see a list of all applicable metrics for different resource types; select the appropriate one
- 
You will be taken to a list of active resources (in this case, Queues) that can be monitored with the selected metric. Select the resource that is flagged on the test page
- 
Ensure the name matches precisely
- 
Then Click the orange select metric button to continue
- 
You will be taken to a page where you can scroll down to set your desired metric conditions. These are selected based on the discretion of the administrator. When complete, click the following button:
- 
You will then need to set the actions; this is up to the administrator's discretion, like the previous step. We need specific guidance to provide.
- 
When complete, click Next after the 'Systems Manager action' section:
- 
Next, you will need to configure the alarm name; this is again up to the discretion of the administrator; click 'Next' on the bottom right when you are finished:
- 
You will be taken to the Preview and Create screen, where you can review the configurations. Ensure the metric name matches the one specified by the test (1) and that the resource you are monitoring is the one flagged on the test page (2) :
- 
Once confirmed, scroll down and click Create Alarm 
- 
You should be redirected to the Cloud watch screen and see a green banner indicating the alarm was created successfully. You should also see it listed
- 
Upon the next test refresh, the test should begin to pass once we detect the alarm. You can optionally click the refresh button to speed up this process: 
​

## Keep in Mind
I do not see one of the alarms listed on the test page
- 
Ensure you copy the name exactly as spelled on the test page. Also, ensure you are in the account and region where the resources exist. If you verify those two things and it does not appear, you will likely have to create this alarm using a JSON script; please write to support for help.
​
I use DataDog to monitor these resources. I have duplicates for some of the tests
- 
If you have connected the DataDog integration, you can deactivate the AWS-related tests if you prefer to use the DataDog ones.
 
I created the alarm and refreshed the test, but the resource is still failing
- 
Click More and then Export test data to download a CSV of the test data.
- 
Your most recently created alarm should have been appended to the bottom of the CSV file; if you do not see your alarm listed, then either the test has not refreshed successfully, or the alarm was created in a different region/account than the one the flagged resource exists in
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767133/a551f6d464a9b7a2f85c05c1010e/12264392109460?expires=1794967200&signature=9dca37884fcfa9201257b19bb7ef58e33a07d894fdf21aae798914e341d92d35&req=dSUmEM54moBcWvMW1HO4zamqGwFGM%2Ff1TOaukvKy2F5%2F%2F5UP%2BQBgpGf%2F4WCB%0ANW3f%0A>
 
What if I do see my notice in the test export CSV file?
- 
Check the metric name column and confirm it has the metric listed on the test page as a value.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767138/b6c4a20771e76d91662e54fcc65d/12264477113876?expires=1794967200&signature=f30e3ca1c07e6bcbb5f939372a27b56e5664788a79812355bcee0501b1efc205&req=dSUmEM54moBcUfMW1HO4zX5o3YjLLV12R3idRuFFF%2BOhT0QWdoxK2KLGBxCh%0ACvDi5NFWkdB%2Fv8h6GXo%3D%0A>
 
What if my metric name column has the correct metric listed? 
- 
Check the dimensions column, specifically the 'value' field; it must be set to the resource you are monitoring (the help that was flagged on the test page):
- 
If this also matches, please send screenshots of your Cloudwatch alarm to Vanta support so we can investigate.

## Images

- [image 01] ../../images/documentation/create-aws-cloud-watch-alarms-to-pass-vanta-tests--01.png
- [image 02] ../../images/documentation/create-aws-cloud-watch-alarms-to-pass-vanta-tests--02.png
