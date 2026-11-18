# How to Pass the Load balancers redirect HTTP to HTTPS (AWS) Test

Source: https://help.vanta.com/en/articles/11346045-how-to-pass-the-load-balancers-redirect-http-to-https-aws-test
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

This test is located in the [Engineering <https://app.vanta.com/tests?tab=Engineering>] category, and can be accessed via the link below: 
- 
https://app.vanta.com/tests?tab=Engineering#load-balancer-http-to-https <https://app.vanta.com/tests?tab=Engineering#load-balancer-http-to-https>
​
The test will determine if you have at least one dedicated HTTP ALB Listener <https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-listener.html> created on your Application Load Balancer <https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-application-load-balancer.html> that redirects (301 permanent) to HTTPS. If no dedicated Listener is detected on your ALB, then the test will fail. If no ALB is detected at all, then the test will N/A and deactivate.
 

## Prerequisites
- 
AWS As a connected Cloud Provider
- 
At least one Application Load Balancer created
 

## Procedure
- 
Navigate to your AWS Console.
- 
Search for "EC2" in the search tool and select it
- 
On the left hand side navigation menu, scroll down and select "Load Balancers"
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768075/8959aabbe5124d25cf6a8d8bd64e/10464463441044?expires=1794967200&signature=436fc471ce8ddd089c349f32c7b3af92cd5553d126ea42ef9c5192054c8ea386&req=dSUmEM54lYFYXPMW1HO4zbNjJo8dYD11jAwGLxlsRaQKh6bCX90aymo14FZg%0AaJox%0A>
 
- 
Select your desired ALB, and under the "Listeners" tab click Add Listener
​
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768077/d75a474d3eac57ced0295bcf5f73/10464504271380?expires=1794967200&signature=3d16e33e1dfc05ea60d8d2797197f89b575621ffc5ed214511798e986150602b&req=dSUmEM54lYFYXvMW1HO4zR3cB9yOZwAOdcLg5gA2LFafBOlAKPK%2BDrR6KhyS%0AQxdP%0A>
 
- 
When creating your Listener, Be sure the 3 highlighted options below are configured as seen here. Url configuration is up to you, so long as these options are selected. Click Add
​
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768076/daf50af426a37c7fba385f925de6/10464509648020?expires=1794967200&signature=ffd280bd16a18d72fd76e1807513a3ca5b419272204e35a187c56dada35f144e&req=dSUmEM54lYFYX%2FMW1HO4zT8y5PI1UKd4PG0tNfLwjZbrn8nVAN9tXHIvApJ%2F%0AMy7X%0A>
 
- 
Once complete, your Listener should appear like below on the Load Balancers page
​
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768074/8abdffc93b44ba7a6bcec86f78f3/10464568889108?expires=1794967200&signature=628fe8315a918babe4ead4cf6abe5d9cf86081206e05d0089c6537515f623dbe&req=dSUmEM54lYFYXfMW1HO4zTJ8c9Xy9DIeOU6UNcn7MmQk1dxH3IdSRLi5OASz%0ArVqB%0A>
 
- 
Now you can return to the test and either wait for it to refresh(up to 24 hours), or initiate a manual refresh(15 - 60 minutes). Once refreshed, your test should be passing!

​
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768086/95f9090bf25c40569a08993b838e/27542851756436?expires=1794967200&signature=9525dad09316e6c8b3994ef04b2a004ebaf70eb8ae5897f10bfa07e39765163e&req=dSUmEM54lYFXX%2FMW1HO4zR%2FLZJvgmzRcZTABZ4phCYRxmD8C69l4Zt73cIg7%0AIqPj%0A>
 

## Common Issues

## The test is failing even though I have a load balancer that redirects HTTP to HTTPS:
This is a common point of failure when attempting to pass the test. If you already have an ALB Listener that looks like it should be passing but isn't, try the troubleshooting method below:
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768095/f7d413ab564b1d935cc384a20c26/10464750290708?expires=1794967200&signature=551c000e891327b5d7b571964bfd88092a0082977231d592d1fddfa17bfcffa9&req=dSUmEM54lYFWXPMW1HO4zdvBGp%2FYcFpuR2lUcFlrGPnfb2S819DZafQymBSK%0AvmPB6dOOstiDhOkfCxY%3D%0A>

Check the "Rules" on that Listener, via "View/edit Rules". Likely, the listener has additional Rules other than the one that Redirects to HTTPS
​
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768109/1fbc087a9e9ad8cfd372c0ceed83/10464849802516?expires=1794967200&signature=30eb640e2414a513af400693af0c6767f37315d512512d44c02b3756ee2ab43b&req=dSUmEM54lYBfUPMW1HO4zRvT4nz01D069q6fNW9%2ByTonJd8M4pW9XYlSmezS%0A1wl%2Bz7XkwZvK3g3SoB0%3D%0A>

This interferes with our ability to evaluate the listener, even if the listener is functioning correctly on a technical level. Thus, to correct this, remove all other rules from the listen aside from the redirect. 
​
You can workaround this by creating another listener on the ALB for those actions performed by the additional rules, as long as one listener is dedicated to an HTTP Redirect you will pass the test.
 

## Additional Resources
- 
How to deactivate a test <https://help.vanta.com/en/articles/11345549-deactivate-a-test>

## Images

- [image 01] ../../images/integrations/aws/how-to-pass-the-load-balancers-redirect-http-to-https-aws-test--01.png
- [image 02] ../../images/integrations/aws/how-to-pass-the-load-balancers-redirect-http-to-https-aws-test--02.png
- [image 03] ../../images/integrations/aws/how-to-pass-the-load-balancers-redirect-http-to-https-aws-test--03.png
- [image 04] ../../images/integrations/aws/how-to-pass-the-load-balancers-redirect-http-to-https-aws-test--04.png
- [image 05] ../../images/ux/tests/how-to-pass-the-load-balancers-redirect-http-to-https-aws-test--05.png
- [image 06] ../../images/integrations/aws/how-to-pass-the-load-balancers-redirect-http-to-https-aws-test--06.png
- [image 07] ../../images/integrations/aws/how-to-pass-the-load-balancers-redirect-http-to-https-aws-test--07.png
