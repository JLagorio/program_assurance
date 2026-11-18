# Resolve AWS Config is enabled correctly in all regions. (Internal)

Source: https://help.vanta.com/en/articles/11345517-resolve-aws-config-is-enabled-correctly-in-all-regions-internal
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

## Resolving AWS Config is enabled correctly in all regions.
This test is checking that the settings specified in the 'How to fix' section of the test have been configured on every in scope region on your connected AWS accounts. You can view the steps below on how to configure this for a region where the service is currently off. If you have AWS Config already enabled but it is failing please see the Common Reasons for failure section.
How to configure AWS Config in a region where the service is disabled:
- 
Sign into AWS and then Select the region you want to focus on in the top right of the console. For example if the test is flagging us-west-2, select us-west-2 from the dropdown:
​
​
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768260/33d7a48dfe54425f2a8ccd5a5cc3/32272382107156?expires=1794967200&signature=e539add4a85c7309282d1ee48c1462d303c97df5e5085d62ed97cc39f7db144e&req=dSUmEM54lYNZWfMW1HO4zdx6HEyvmeyqksluWOeybEPcHWnFq9U4or2ee4A9%0ATlHo%0A>
- 
Once on that region go to the search bar and search for "AWS Config"
​
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768258/5239c2a74f23d58b2cc375720593/32272382110740?expires=1794967200&signature=8151b205c3a47845fd0b1f3cac6778bca1e79e6b38e286601f19fd07063c3116&req=dSUmEM54lYNaUfMW1HO4zR4gDrGPSG32YAlskmYsC067fxJCQYvRiOA6aB3D%0AlyOg%0A>
- 
Since this has not yet been setup for the region, click the "Get Started" button:
​
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768266/35bb7ce9e9593be3971ec685448b/32272410429204?expires=1794967200&signature=e8af96322529863e2eb58dc7d77863d83c8ea10f80c1796cb712c74df788cfca&req=dSUmEM54lYNZX%2FMW1HO4za4LxZigfpDHe2XnvHJzjDmWJcC5QDRivlboWpGx%0AyyRH%0A>
- 
Please click the "All resource types with customizable overrides" as your recording strategy:
​
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768257/0fb6ab89d8da027aa1497b73f6c8/32272382122900?expires=1794967200&signature=9f573dfc1e249e82541239012a004165b95c694d97453fae1ee47512776978a7&req=dSUmEM54lYNaXvMW1HO4zeKeXZ7RcmcW2YF%2B70kTfSAIKW%2BsdfVO008Krit9%0AaFc0%0A>

​
And then choose a recording frequency, the default is continuous:
​
​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768280/a1063f6556d33f7ebe99d2855e7c/32272382125204?expires=1794967200&signature=a6bd2dac717399358320119c70d94ce009074c02480628d00011854eef249bfa&req=dSUmEM54lYNXWfMW1HO4zS4Y8udvM%2BK4YL5cO2KVO7vg95OTMXiPKDP9Qr%2BX%0AK%2BWl%0A>
- 
The test instructions next specify to "Choose to include global resources (IAM resources)". 
To do this you will need to select "all globally recorded IAM resource type" as a resource types, then set the override to "Set to daily record". The test will not pass if this override is not set:
​
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768283/5e5ed8ec9b7a8d0d8ea85f75c2b1/32272410438548?expires=1794967200&signature=e8c6605be7541f27eb73043bdd21499d4e30a28facd30df6ff4f69f61427c4b7&req=dSUmEM54lYNXWvMW1HO4zZOqKLQORIEqT2An7NULtbyZx%2Fbn6hfCZ5c3zpxY%0Aquij%0A>
- 
Next the instructions specify to select an S3 bucket in the same account or in another managed AWS account. You also have the option to create a bucket as well. This setting can be found in the Delivery method section, please choose an option that works best for you. 
​
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768285/a0ce0a62b04e7f77ad81c79d7e18/32272382129940?expires=1794967200&signature=7706e672cc4ef4be0a311f574979eebbd59d67d0a34459fe461b9052a28d4536&req=dSUmEM54lYNXXPMW1HO4zS5SUTxjQWNWGXF%2F%2FHrcTPTGl69S%2F6BLW8VkEA6p%0A0J2O%0A>

​
In this example the "choose an existing bucket" option was selected:
​
​
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768289/c9bde512716507f9abe0ac6be711/32272382133268?expires=1794967200&signature=398dbabbf89123aa9b2031a782d7c525c95e720801f13a594f7fc1c5e3d4bede&req=dSUmEM54lYNXUPMW1HO4zd1meEhSgP0CeKB%2FKQbT7%2Fo4fqm6etYsG0kfI3ha%0AUtjb%0A>
- 
Next the tests asks you to choose an SNS topic on the same account or another managed account. This is also done under the delivery method settings by checking the "Stream configuration changes and notifications to an Amazon SNS topic." check box and choosing to either create a topic or use an existing one:
​
​
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768295/8474f51ed349182c939d70081aee/32272382137620?expires=1794967200&signature=d1c48e8517e95fa445cb3918519428e23a4ffb7e9a3cb72a5886ce012dd5ef03&req=dSUmEM54lYNWXPMW1HO4zRaqc94txUq45gz4ms34RdqNINuH7A2cLCalKMzu%0Ai%2Fxe%0A>

## Common Reasons For Failure
The test will fail is one of the required settings have not been configured at all. If you setup config on a region, and the test is still flagging it, please go to the region, search for the AWS Config service, click settings:
​
​
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768299/ae30ba1487b89d3968667f2094b0/32272382139284?expires=1794967200&signature=dd58f5c880ef8cf835d9c940193535e180b35993016ec190337ba210c389ef3c&req=dSUmEM54lYNWUPMW1HO4zW6Favzm4CEeDJNnZJ3fjTgLrsGdoXIoQgVMVRfN%0Avqo9cQER2VU3J9AJFBo%3D%0A>

​
From there make sure recording is 'On':
​
​
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768297/7d971cf6485bf313916b4e13b5e9/32272410448020?expires=1794967200&signature=4404520ab3f3e655e7ec57c06fe617e99089f4eccae747015d4d8b09c2fd9eac&req=dSUmEM54lYNWXvMW1HO4zex1Xs0Nqt0uIZz0OempcsW9VdTevnG7bJFt14%2B7%0AGfMsdogNReMgkPSrdsA%3D%0A>
Then click edit
​
​
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768303/f8879fb2de4f8050e080eccc8f3d/32272410449556?expires=1794967200&signature=fff8e55b6fb292fc8b1b0333666c821d58ae08ddfe3e9ea57d731b232fb9ffb8&req=dSUmEM54lYJfWvMW1HO4zR8rbNKnc9h3HQZIhZ11fBy0J38HF7TABJRUY2Lh%0AHHxo%2Bo7Ztb%2BPlt6UCKc%3D%0A>

​
And then confirm that under recording method (1) All resource types with customizable overrides has been selected, and (2) AWS IAM Policy, IAM User, IAM Role, and IAM Group all are set to daily recording:
​
​
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768318/5e49a0f5e439f40385c166fbe621/32272410450964?expires=1794967200&signature=8b9f728beac14625786406a20db2563960df2e381a6eb2e30c4bb694e15ca3bd&req=dSUmEM54lYJeUfMW1HO4zT%2F%2F90qKfGPc%2BmXuf9gl9wSl9p1BsSsXlLpxSbrI%0AOMykmcW2df7qoXMOnXk%3D%0A>
Then scroll down to delivery method and confirm (3) You have an S3 bucket on the same account, or another managed account and (4) the checkbox for "Stream configuration changes and notifications to an Amazon SNS topic." has been selected along with an SNS topic:
​
​
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768321/d3609860d05c64339e69d5d16330/32272410453524?expires=1794967200&signature=cf8ae0fe85d533db93b11ae8759a176e284206184d155cace0ebf3ca51eb9df1&req=dSUmEM54lYJdWPMW1HO4zaTs42dSPaGXfZqP7FrY5zAg2FlpfmfuQd0bD%2BpT%0AMHm4jhJwDRdwkO%2BAPZ4%3D%0A>
If all of these settings have been configured and the test continues to fail, please write an email to [email protected] for more investigation and include screenshots of the 4 settings you verified in the steps prior.

## Images

- [image 01] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--01.png
- [image 02] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--02.png
- [image 03] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--03.png
- [image 04] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--04.png
- [image 05] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--05.png
- [image 06] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--06.png
- [image 07] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--07.png
- [image 08] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--08.png
- [image 09] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--09.png
- [image 10] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--10.png
- [image 11] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--11.png
- [image 12] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--12.png
- [image 13] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--13.png
- [image 14] ../../images/integrations/aws/resolve-aws-config-is-enabled-correctly-in-all-regions-internal--14.png
