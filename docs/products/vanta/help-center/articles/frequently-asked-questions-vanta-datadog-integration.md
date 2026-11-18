# Frequently Asked Questions: Vanta & Datadog Integration

Source: https://help.vanta.com/en/articles/11346100-frequently-asked-questions-vanta-datadog-integration
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

What Datadog tests are enabled upon connection?
- 
The Datadog integration is verifying that
- 
every Datadog account is associated with an active employee in your company, and the access is removed when an employee leaves
- 
Monitors exist in DataDog that are monitoring your infrastructure
 
Should we use cloud providers' native monitoring solutions like AWS Cloud Watch or third-party monitoring tools like Datadog to satisfy monitoring controls?
- 
Both cloud providers' native solutions and Datadog, monitor infrastructure to satisfy monitoring controls. You can decide which solution works for you based on your company's use cases.
- 
Vanta integrates with both these solutions and checks for infrastructure monitoring evidence. As part of our cloud provider integration, we automatically enable monitoring tests in your instance and collect evidence to satisfy controls. We look for similar evidence by enabling Datadog-related monitoring tests when you connect it to Vanta. Depending on which solution you use, you can deactivate one or the other set of tests in Vanta and mention a reason.
- 
If you use cloud providers' solutions for monitoring but still connect Datadog to Vanta, then you can deactivate Datadog monitoring tests. You can find the lists of these tests by going to the Monitoring alerts category tests on the Tests page.
- 
If you use Datadog for monitoring, you must deactivate cloud provider monitoring tests in Vanta. You can find the lists of these tests by going to the Monitoring alerts category tests on the Tests page.
 
What if we use cloud providers' solutions and Datadog for cloud infrastructure monitoring?
- 
This should not be a problem in Vanta. We have a separate set of tests for both of these solutions, and you can keep both running in Vanta to satisfy monitoring controls.
 
Which cloud providers are supported in this Datadog integration?
- 
We currently support AWS, Azure, and GCP cloud provider monitoring as part of Datadog integration.
 
What if we are using Datadog for logging and other use cases?
- 
We currently support cloud infrastructure monitoring as part of our Datadog integration. You will have to upload evidence for other controls into Vanta.

## Images

- none
