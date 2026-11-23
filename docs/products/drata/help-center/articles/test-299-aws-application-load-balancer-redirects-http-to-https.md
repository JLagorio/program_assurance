# Test 299: AWS Application Load Balancer Redirects HTTP to HTTPS

Source: https://help.drata.com/en/articles/9828823-test-299-aws-application-load-balancer-redirects-http-to-https
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata validates that for all AWS Application Load Balancer listeners, there is has a rule that redirects unencrypted HTTP traffic to HTTPS.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Encryption in Transit **control (DCF-55) that ensures data in transit is encrypted using strong cryptographic algorithms.

## WHAT TO DO IF A TEST FAILS

If Drata finds that one or more AWS Application Load Balancer listeners do not have a rule that redirects unencrypted HTTP traffic to HTTPS, the test will fail.

## STEPS TO REMEDIATE

1. Sign into AWS Management Console and go to the Amazon EC2 Console.
2. In navigation panel, choose 'Load Balancers' under 'Load Balancing' and select the Application Load Balancer that is failing this test.
3. Select the 'Listener' tab in the lower pane and edit the HTTP listener.
4. If an HTTP (port 80) does not already exist, click on 'Add listener' and create an HTTP listener.
   - If it exists, click on 'view/edit rules'.
5. Configure the redirect rule by clicking the '+' icon and set the condition to match all incoming HTTP requests and for the action, choose 'Redirect to' and configure it as follows:
   - Protocol: HTTPS
   - Port: 443
   - Status code: 301 (Moved permanently) or 302 (found)
6. Save the rule and repeat for each failing load balancer listener.

## Related articles

- [Test 234: AWS S3 HTTP Requests Denied](test-234-aws-s3-http-requests-denied.md)
- [Test 296: AWS Application Load Balancer Server Errors Monitored](test-296-aws-application-load-balancer-server-errors-monitored.md)
- [Test 297: AWS Classic Load Balancer Unhealthy Hosts Monitored](test-297-aws-classic-load-balancer-unhealthy-hosts-monitored.md)
- [Test 298: AWS Application Load Balancer Unhealthy Hosts Monitored](test-298-aws-application-load-balancer-unhealthy-hosts-monitored.md)
- [Test 269: Azure App Service Web App Redirects HTTP Traffic to HTTPS](test-269-azure-app-service-web-app-redirects-http-traffic-to-https.md)
