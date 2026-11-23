# Test 130: Load Balancer Used

Source: https://help.drata.com/en/articles/4777006-test-130-load-balancer-used
Collection: Monitoring Test Guidance
Updated: 2026-11-14
Fetched: 2026-11-22
Description: Drata inspects your company infrastructure to determine if Load Balancers are configured to balance between multiple availability zones.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Load Balancer Used **control that ensures your company uses a load balancer to automatically distribute incoming application traffic across multiple instances and availability zones.

## WHAT TO DO IF A TEST FAILS

If Drata is unable to locate load balancers that are configured to balance traffic across multiple availability zones the test will fail.

To remediate a failed test, you will need to configure your load balancers to balance web traffic across multiple availability zones.

## STEPS FOR PASSING

To ensure a validated state when testing that a load balancer is in use, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **AWS - EC2 Load Balancers** | **Note**: If there are no EC2 instances, the test will pass.<br>1. Within AWS, go to the EC2 service<br>2. Go to LoadBalancers from the left menu<br>3. Add load balancer -http/https<br>4. Ensure the load balancer is forwarding traffic to at least two different availability zones.<br>5. Save load balancer<br>Note: Every region where an EC2 instance exists must have an active load balancer. |
| **GCP - Load Balancers** | **For HTTP(S) Load Balancers**<br>1. Within GCP, go to the Network Services service<br>2. Create a Load balancer<br>3. Click on the Create Load Balancer button<br>4. For ""HTTP(S) Load Balancing""<br>5. Click on the Start configuration button<br>6. For ""Internet facing or internal only"", select From Internet to my VMs<br>7. Click on Continue button<br>8. Enter a name<br>9. Click on Create button<br>**For TCP Load Balancers w/Forwarding**<br>1. Within GCP, go to the Network Services service<br>2. Create a Load balancer<br>3. Click on the Create Load Balancer button<br>4. For "TCP Load Balancing" Click on the Start configuration button<br>5. For "Internet facing or internal only" - Chose any option<br>6. For "Multiple regions or single region" - Chose any option<br>7. For "Backend type" - Chose any option<br>8. Click on Continue button<br>9. Enter a name<br>10. Fill out the "Backend configuration"<br>11. Select a Region from the dropdown<br>12. Fill out the "Frontend configuration"<br>13. Enter a name<br>14. Enter a Port value<br>15. Click on Create button<br>**Make sure this Load Balancer has a forwarding rule** |

## Related articles

- [Test 30: Availability Zones Used](test-30-availability-zones-used.md)
- [Test 118: Infrastructure Instance CPU Monitored](test-118-infrastructure-instance-cpu-monitored.md)
- [Test 122: Web Application Firewall in Place](test-122-web-application-firewall-in-place.md)
- [Test 107: Daily Database Backups](test-107-daily-database-backups.md)
- [Test 299: AWS Application Load Balancer Redirects HTTP to HTTPS](test-299-aws-application-load-balancer-redirects-http-to-https.md)
