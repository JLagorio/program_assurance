# RTO (Recovery Time Objective) and RPO (Recovery Point Objective)

Source: https://help.vanta.com/en/articles/11345510-rto-recovery-time-objective-and-rpo-recovery-point-objective
Collection: Audit Readiness ; Audit Readiness › Security and Compliance: Industry Topics
Fetched: 2026-11-17

## Article text

## What is RTO?
RTO (Recovery Time Objective): RTO is the maximum acceptable amount of time that a system, application, or business process can be down after a failure or disaster before the consequences become unacceptable. It defines how quickly you need to restore operations to avoid significant damage or loss, whether financial, reputational, or operational. If your RTO is 4 hours, the goal is to get the affected system back up and running within that time frame after an outage.
 

## Example
- 
A SaaS company that provides project management software to businesses. Your Recovery Time Objective (RTO) is 1 hour. In this scenario, if your cloud servers go down due to a technical issue or a cyberattack, your IT team has a maximum of 1 hour to restore service before it negatively impacts your customers. If you don’t meet the 1-hour RTO, your customers might be unable to access critical project data, leading to delays in their work, potential loss of trust, and possibly even customer churn. The RTO ensures that your disaster recovery plan is robust enough to get your software back online within that critical time frame, minimizing disruption to your customers’ operations.

## Best Practices
- 
Document RTOs: Document your RTOs and why they were set so it's easy to understand their importance.
- 
Base RTOs on Business Needs: Make sure your RTOs are based on how critical each system is to your business.
- 
Test Regularly: Test your recovery plans to ensure you can meet the RTOs in real-life scenarios.
- 
Follow Industry Standards: Ensure your RTOs meet industry guidelines and regulations.
- 
Include in Agreements: If you provide services to others, include your RTOs in service agreements to show commitment.
- 
Keep Improving: Continuously monitor and improve your ability to meet RTOs.
- 
Train Your Team: Make sure everyone knows the importance of RTOs and their role in meeting them.
Remember, the RTO is a target you set based on how long you believe your systems can be down without causing significant harm to your business.
 

## What is RPO?
RPO (Recovery Point Objective): RPO is the maximum acceptable amount of data loss measured in time. It indicates how far back in time you need to recover data in case of a disruption, such as a system crash or a data breach. It answers the question: "How much data can we afford to lose?"
- 
If your Recovery Point Objective (RPO) is set to 1 hour, you're willing to lose up to one hour's worth of data in the event of a major incident like a system crash or a power outage. So, if a disaster occurs at 3 PM, you'd lose all the data that happened after 2 PM (the last hour), because that's your RPO. Your systems should be set up to back up data at least every hour to meet this RPO.
Remember, the RPO is determined by looking at the time between data backups and the amount of data that could be lost in between backups.
 

## Example
A SaaS company that provides CRM software used by businesses to manage their customer interactions, sales, and communications. The company has set an RPO of 15 minutes. If a failure occurs, such as a server crash or data corruption at 2:00 PM, the company’s disaster recovery plan must ensure that they can recover the CRM data to what it was at 1:45 PM at the latest. Any customer interactions, updates, or data entries made between 1:45 PM and 2:00 PM could be lost, but no more than 15 minutes of data would be at risk. Setting the RPO to 15 minutes ensures its customers can quickly resume their work with minimal disruption and data loss, maintaining trust and reliability in the service.
 

## Best Practices
- 
Set Clear RPOs: Based on the criticality of the data, clearly define how much data loss is acceptable for each system.
- 
Document and Justify RPOs: Make sure your RPOs are documented, explaining why each was chosen.
- 
Regular Backups: Ensure data is backed up frequently to meet your RPOs, minimizing potential data loss.
- 
Test Backup and Recovery: Regularly test your backup and recovery processes to confirm they can meet your RPOs.
- 
Monitor and Adjust: Monitor your backup performance and adjust RPOs if business needs change.
- 
Train Your Team: Ensure your team understands the importance of RPOs and knows how to manage backups accordingly.
In summary, PTO refers to the time it takes to recover after an incident, while RPO refers to the amount of data you can afford to lose.
There isn’t a one-size-fits-all number that an auditor will expect for RTO or RPO. The appropriate values depend on the specific system, the business context, the level of risk the company is willing to accept, and the system's criticality to the business. Contractual commitments with customers for certain products also play a role.
An RTO or RPO of 24 hours or more may be acceptable for non-critical systems. However, for critical customer-facing assets, it’s advisable to aim for lower values, such as an RTO of 1-4 hours and an RPO of 0-2 hours, to ensure minimal disruption and data loss.

## Images

- none
