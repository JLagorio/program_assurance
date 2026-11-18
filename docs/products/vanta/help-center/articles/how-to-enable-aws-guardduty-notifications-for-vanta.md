# How to enable AWS GuardDuty notifications for Vanta

Source: https://help.vanta.com/en/articles/11346007-how-to-enable-aws-guardduty-notifications-for-vanta
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

A Vanta monitor <https://app.vanta.com/monitors#aws-guardduty-notifications-enabled> requires that GuardDuty notifications are enabled for AWS if GuardDuty is used. While this article explains what is necessary for the Vanta monitor to pass, please see this article from AWS for more information <https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html>.
 

## Prerequisites
- 
Ensure that GuardDuty is enabled for the AWS accounts and regions that you would like to enable notifications for. Please see this AWS article for more information <https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html>.
 

## Procedure
- 
Navigate to SNS in AWS here <https://console.aws.amazon.com/sns/>
- 
Select the Topics tab on the left and then select Create topic
- 
For Type, choose Standard.
- 
For Name, enter GuardDuty.
- 
Choose Create Topic. The topic details for your new topic will open.
- 
In the Subscriptions section, choose Create subscription.
- 
For Protocol, choose Email.
- 
For Endpoint, enter the email address to send notifications to.
- 
Choose Create subscription.
- 
After you create your subscription, you must confirm it through email.
- 
To check for a subscription message, go to your email inbox, and in the subscription message, choose Confirm subscription.
 
Then, you'll need to create a Cloudwatch rule that forwards Guard Duty findings to the previously created SNS topic:
- 
Open the CloudWatch console at https://console.aws.amazon.com/cloudwatch/ <https://console.aws.amazon.com/cloudwatch/>.
- 
Select Rules from the navigation pane and then Create Rule.
- 
From the Service Name menu, choose GuardDuty.
- 
From the Event Type menu, choose GuardDuty Finding.
- 
In Event Pattern Preview, select Edit.
- 
Paste the below JSON code into Event Pattern Preview and choose Save
 {
  "source": [
    "aws.guardduty"
  ],
  "detail-type": [
    "GuardDuty Finding"
  ],
  "detail": {
    "severity": [
      4,
      4.0,
      4.1,
      4.2,
      4.3,
      4.4,
      4.5,
      4.6,
      4.7,
      4.8,
      4.9,
      5,
      5.0,
      5.1,
      5.2,
      5.3,
      5.4,
      5.5,
      5.6,
      5.7,
      5.8,
      5.9,
      6,
      6.0,
      6.1,
      6.2,
      6.3,
      6.4,
      6.5,
      6.6,
      6.7,
      6.8,
      6.9,
      7,
      7.0,
      7.1,
      7.2,
      7.3,
      7.4,
      7.5,
      7.6,
      7.7,
      7.8,
      7.9,
      8,
      8.0,
      8.1,
      8.2,
      8.3,
      8.4,
      8.5,
      8.6,
      8.7,
      8.8,
      8.9
    ]
  }
}
 
Note: The above code will alert you of any Medium to High findings.
 
- 
In the Targets section click Add Target.
- 
From the Select Targets menu, choose SNS Topic.
- 
For Select Topic select the name of the SNS Topic you created in Step 1.
- 
Configure the input for the event.
- 
If you are setting up notifications for Chime or Slack skip to Step 11, the input type defaults to Matched event.
- 
If you are setting up notifications for Email via SNS, follow the steps below to customize the message sent to your inbox using the following steps:
- 
Expand Configure input and then choose Input Transformer.
- 
Copy the following code and paste it into the Input Path field.{
    "severity": "$.detail.severity",
    "Account_ID": "$.detail.accountId",
    "Finding_ID": "$.detail.id",
    "Finding_Type": "$.detail.type",
    "region": "$.region",
    "Finding_description": "$.detail.description"
}
                            
- 
Copy the following code and paste it into the Input Template field to format the Email."AWS <Account_ID> has a severity <severity> GuardDuty finding type <Finding_Type> in the <region> region."
"Finding Description:"
"<Finding_description>. "
"For more details open the GuardDuty console at https://console.aws.amazon.com/guardduty/home?region=<region>#/findings?search=id%3D<Finding_ID>"
                            
- 
Click Configure Details.
- 
In the Configure rule details page, enter a Name and Description for the rule, and then choose Create Rule.
 

## Common Issues
The Vanta test will not pass if:
- 
Your CloudWatch/EventBridge rule forwards to a Lambda directly. Ensure that you have selected an SNS Topic as the target for your rule.
- 
The event pattern that you use does not include a minimum of the following:{   "source": ["aws.guardduty"],   "detail-type": ["GuardDuty Finding"] }  
 

## Additional Resources
- 
Enabling GuardDuty (AWS) <https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_settingup.html>
- 
Setting up cloudwatch rules for GuardDuty findings (AWS) <https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html>

## Images

- none
