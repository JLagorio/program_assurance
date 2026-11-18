# Serverless Function Error Rate Monitored (AWS)

Source: https://help.vanta.com/en/articles/11346066-serverless-function-error-rate-monitored-aws
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

This test looks at all CloudWatch alarms where the namespace is AWS/Lambda and the metricName is Errors. These are CloudWatch alarms that are specific to Lambdas.
 
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769558/47e1188937aec5335355abd6fda3/16566500069652?expires=1794967200&signature=7e614b0d5598e87f96610a8da5a718b451983ca42f622a71a6828270a94eab0f&req=dSUmEM54lIRaUfMW1HO4zZ0yt2CthMzyicEudoSfKZjBcsg1JjRVnC5vwdfY%0A0R97YNyq%2B0mSOLPlYM8%3D%0A>
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769561/c47e4e133edd14fa950e129d8e26/21376707174932?expires=1794967200&signature=cc8d98db07927786a2e7be4150a4ea2c33fbc7d599745d45936236a773b06729&req=dSUmEM54lIRZWPMW1HO4zW7Wf3sVeiVWBp4b6QXUJ4mSEodzW%2BHiC9KQzajq%0AFzqHgtkalwp7UdN0PSI%3D%0A>
 

## Test Data Insights
- 
This test evaluates monitoring status using the resource data below to determine your Alarm's association with your Lambda functions
- 
To view your test data, Export it as a CSV or View the raw JSON as seen below
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769562/c47527f4fbcc2ec6b05db9edbc78/27543463499156?expires=1794967200&signature=ce4858919b607926daec0d3732aca4bccc2d4d0a48f2cc069708b83fe5001eec&req=dSUmEM54lIRZW%2FMW1HO4zRSfFxv%2Fwstx38AJwE3zuT2VECluT3zqsyqM9Ws%2B%0AduxW%0A>
 
- 
A dimensions property contains a FunctionName that should be equal to the name of the Lambda function it monitors. This would mean you'd see as many alarms as lambda's (in most cases).
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769560/aedea592da900123fd546f6b5199/16566566959508?expires=1794967200&signature=08db83efdccb1a302599cf921f3a9db7fe83245db74973f7cf3e3046c93c3e48&req=dSUmEM54lIRZWfMW1HO4zWDx%2F9D8H0D2VzIOef5HkjEMWpbDRMTN6H2GI462%0A5FFD%0A>
 
- 
The raw data has all lambda functions listed an all CloudWatch alarms with the namespace AWS/Lambda and the metricName Errors . So, it’s all cloudwatch alarms relevant to this test.
Once you've Graphed your Errors Metric: You can easily create an Alarm by clicking the Graphed metric's Details followed by Create Alarm:
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516769580/c6bf7fb1c1b4c4b24b3ff75ef125/16567539111060?expires=1794967200&signature=556077b7a7d4ba540906cdff9f38d20a568ff3624a7fe46118fbd64f80a1e64f&req=dSUmEM54lIRXWfMW1HO4zbYUhfSyz%2FnOT%2FJHiubcorNv5vTB9b5U8IIlkOe7%0AjLr1kHIdMheVCGpH1M4%3D%0A>
View the below AWS Article snippets to learn more about AWS Lambda invocation Metrics and how to Graph your Errors metric.
 

## Viewing metrics on the CloudWatch console
The CloudWatch console can filter and sort function metrics by function name, alias, or version.
 

## To view metrics on the CloudWatch console
- 
Open the Metrics page <https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#metricsV2:graph=~();namespace=~'AWS*2fLambda> (AWS/Lambda namespace) of the CloudWatch console.
- 
On the Browse tab, under Metrics, choose any of the following dimensions:
- 
By Function Name (FunctionName) – View aggregate metrics for all versions and aliases of a function.
- 
By Resource (Resource) – View metrics for a version or alias of a function.
- 
By Executed Version (ExecutedVersion) – View metrics for a combination of alias and version. Use the ExecutedVersion dimension to compare error rates for two versions of a function that are both targets of a weighted alias <https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html>.
- 
Across All Functions (none) – View aggregate metrics for all functions in the current AWS Region.
- 
Choose a metric, then choose Add to graph or another graphing option.
By default, graphs use the Sum statistic for all metrics. To choose a different statistic and customize the graph, use the options on the Graphed metrics tab.
 

## Types of metrics
The following section describes the types of Lambda metrics available on the CloudWatch console.
 

## Invocation metrics
Invocation metrics are binary indicators of the outcome of a Lambda function invocation. For example, if the function returns an error, then Lambda sends the Errors metric with a value of 1. To get a count of the number of function errors that occurred each minute, view the Sum of the Errors metric with a period of 1 minute.
View the following invocation metrics with the Sum statistic.
- 
Invocations – The number of times that your function code is invoked, including successful invocations and invocations that result in a function error. Invocations aren't recorded if the invocation request is throttled or otherwise results in an invocation error. The value of Invocations equals the number of requests billed.
- 
Errors – The number of invocations that result in a function error. Function errors include exceptions that your code throws and exceptions that the Lambda runtime throws. The runtime returns errors for issues such as timeouts and configuration errors. To calculate the error rate, divide the value of Errors by the value of Invocations. Note that the timestamp on an error metric reflects when the function was invoked, not when the error occurred.

## Images

- [image 01] ../../images/integrations/aws/serverless-function-error-rate-monitored-aws--01.png
- [image 02] ../../images/integrations/aws/serverless-function-error-rate-monitored-aws--02.png
- [image 03] ../../images/ux/tests/serverless-function-error-rate-monitored-aws--03.png
- [image 04] ../../images/integrations/aws/serverless-function-error-rate-monitored-aws--04.png
- [image 05] ../../images/integrations/aws/serverless-function-error-rate-monitored-aws--05.png
