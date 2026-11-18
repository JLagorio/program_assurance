# Frequently Asked Question: Is there a way to disable monitoring of a resource for a specific test?

Source: https://help.vanta.com/en/articles/11346018-frequently-asked-question-is-there-a-way-to-disable-monitoring-of-a-resource-for-a-specific-test
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

There is no way to disable monitoring for a resource for a single specific test using tags or in the web UI. Administrators can write to support to have a feature request submitted, but at the moment, they have only two potential options for deactivating resources.
 
Administrators can either (1) disable monitoring for individual resources manually on the test page, see Deactivate monitoring for a resource on a Test <https://help.vanta.com/en/articles/11346051> for more information on this, or (2) apply Bulk Tags on the resource inside the respective cloud provider <https://help.vanta.com/hc/en-us/articles/9270488281492-Bulk-Tags?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo0MjMzNzMwNDgwNTIsInRpY2tldF9pZCI6NDIyODMsImNoYW5uZWxfaWQiOjYzLCJ0eXBlIjoiU0VBUkNIIiwiZXhwIjoxNjc3MDQwNTE5fQ.Pc9ddosuvSLzEaS_aFtaf4zntvYQrnmKBxVwHlx4uRE>. Specifically, the VantaNoAlert tag would need to be applied to the resource. Still, it is important to note this would disable monitoring for that resource on every test/monitor in Vanta. 
 
If a test monitors only a single specific type of resource, such as EC2 instances, and an administrator uses a method different than that specified on the test remediation text, i.e., a third-party monitoring tool to monitor CPU Utilization rather than cloud watch, they have the option to deactivate the test entirely and submit manual evidence of that third party tool. See Deactivate a Test <https://help.vanta.com/hc/en-us/articles/360057812572-Deactivate-a-Test?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo0MjMzNzMwNDgwNTIsInRpY2tldF9pZCI6NDIyODMsImNoYW5uZWxfaWQiOjYzLCJ0eXBlIjoiU0VBUkNIIiwiZXhwIjoxNjc3MDQwNTE5fQ.Pc9ddosuvSLzEaS_aFtaf4zntvYQrnmKBxVwHlx4uRE> for more information on how to do this. You should contact your auditor or support to know exactly what should be submitted as manual evidence.

## Images

- none
