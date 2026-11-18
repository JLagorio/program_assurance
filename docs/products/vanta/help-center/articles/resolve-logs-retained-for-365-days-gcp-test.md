# Resolve 'Logs retained for 365 days (GCP)' test

Source: https://help.vanta.com/en/articles/11345542-resolve-logs-retained-for-365-days-gcp-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This article provides more information on how to resolve alerts for the Logs retained for 365 days (GCP) <https://app.vanta.com/monitors#logs-retained-for-twelve-months-config-gcp> test.

## How to Fix:
- 
First, determine where you will store your logs. To use a Cloud Storage bucket associated with your project, go to the cloud storage console <https://console.cloud.google.com/storage>, and create a new storage bucket or select an existing one. Ensure that retention is set for 365 days:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770112/77609d401027f1908d27052b30a8/15129880571668?expires=1794967200&signature=19a5bb18e66805cb549f44ae0af1e9f53eea94f50415d8b367d92a2a33dff8b3&req=dSUmEM55nYBeW%2FMW1HO4zf9bS2MhO8En82BUJ9cajHQumqM5Roj2mwIpevfv%0A8yZA1S5KWKL9pjQmteI%3D%0A>
- 
Visit the Google Cloud Logging console <https://console.cloud.google.com/logs/>.
- 
Click Log Router from the left-hand menu:
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770115/e07edc12b435a39b54ee3ae8c2f8/15128343185940?expires=1794967200&signature=b57916f7c82901eea19d301c89499ef393aab119ec775e663e1f823c119fe7e4&req=dSUmEM55nYBeXPMW1HO4zayprmpuUMAQQDRdkL%2BQvSqRdBTHLJTnsxPpOTmV%0AblBG%0A>
- 
Click Create Sink:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770118/0150bc2dc316fbac43a7c4cb7bff/15128348219668?expires=1794967200&signature=e89e8139a7bad48d0b274632ef0bc8c84c8a185fcd452584a5d3407dafaa1e3f&req=dSUmEM55nYBeUfMW1HO4zWKnfgvawQFjRhLdjA7eNjzJf4eOZKqETcCwQe7i%0A%2FSvNECYJfpZ9KIRhu8s%3D%0A>
- 
Provide a sink name and a description.
- 
Under Sink destination, select Cloud Storage bucket for the sink service, and select the storage bucket created in Step 1 as the sink destination.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770117/5ac9c66219b93c8f2bc855de163a/15128450447380?expires=1794967200&signature=16b9e8c67e81a3cd441035c48f23d861452d4696cdd5d572ec39b9b734fd7473&req=dSUmEM55nYBeXvMW1HO4zeKTNwRgM2r9nPLZFvtXnFiKyeavD%2FTm4IPdRYSd%0AbSGvJ52bkw%2FheiS1olU%3D%0A>
- 
You can optionally filter in or out any logs. If you do not edit these options, all logs will be included by default.
- 
Click Create Sink.

## Common Reasons For Failure:
- 
The logging buckets used for storage are not in scope on the integrations page. Vanta checks these buckets directly so they need to be in scope here. <https://app.vanta.com/integrations?configurescope=gcp>
- 
Ensure that the logging API (logging.googleapis.com) and storage API (storage-api.googleapis.com) are enabled in the projects where these resources exist.

## Reading the test data:
- 
The test data (downloaded from the "export test data" option from the top right menu in the test) will first list the GCP projects that we see, as well as the log sinks:
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516770134/6e1c8e2ef9cdd441d57ae0c1a2c1/15129235922580?expires=1794967200&signature=dac7a996bb0600d19a414cc89682183e01fd039f95e4e82ca3252a180191e730&req=dSUmEM55nYBcXfMW1HO4zUml3AxFdvyZ6FhifvzTFw7DXviXa0XCrku0XFkk%0A3l%2By%2FeNreWYlfxwnBFw%3D%0A>
You will want to ensure that you see a Log Sink for each correlated project for this test to pass. In the example above, the "test-project" will pass and then "awesome-application" project will fail since there is no associated Log Sink.

## What Vanta is checking:
- 
Vanta first checks that a bucket is a destination for logs, and then checks it has a retention of 365 days or more.

## Images

- [image 01] ../../images/integrations/gcp/resolve-logs-retained-for-365-days-gcp-test--01.png
- [image 02] ../../images/integrations/gcp/resolve-logs-retained-for-365-days-gcp-test--02.png
- [image 03] ../../images/integrations/gcp/resolve-logs-retained-for-365-days-gcp-test--03.png
- [image 04] ../../images/integrations/gcp/resolve-logs-retained-for-365-days-gcp-test--04.png
- [image 05] ../../images/documentation/resolve-logs-retained-for-365-days-gcp-test--05.png
