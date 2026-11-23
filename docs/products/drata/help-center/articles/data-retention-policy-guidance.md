# Data Retention Policy Guidance

Source: https://help.drata.com/en/articles/7257853-data-retention-policy-guidance
Collection: Policy Guidance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

The following article contains guidance explaining portions of the Data Retention Policy that we frequently see questions around, explaining what the sections mean.

Guidance statements will appear in **bold** and enclosed in brackets “**[...]**” below the statements of the policy.

### Data Retention Policy

**[Data Retention Policy was formerly titled as “Data Deletion Policy”. The title change does not have any impact on the contents of the policy]**

### [COMPANY NAME]

______________________________________________________________________

### Purpose 

This policy outlines the requirements and controls/procedures [COMPANY NAME] has implemented to manage the retention and deletion of customer data.

### Policy

### For Customers

Customer data is retained for as long as the account is in active status. Data enters an “expired” state when the account is voluntarily closed. Expired account data will be retained for **<X days>**. After this period, the account and related data will be removed. Customers that wish to voluntarily close their account should download their data manually or via the API prior to closing their account.

**[There is no hard requirement for the number of days for this as this is more of a courtesy on your company’s part to allow customers to download their own data in the event that their contract is voluntarily terminated. Good to check local and international regulations that you are required to follow, as well as the contractual commitments you have with your customers before defining the appropriate number of days that will work with your business.**

**Usually, we see this ranging from 30 days to 180 days, but 30 to 90 days is the most common.**

**“via the API” can be removed if it is not currently possible or available**

***If your organization’s process is to delete the data associated with any inactive customers immediately or to delete customer data upon receiving a request, you can modify this language to reflect what you are doing]**

If a customer account is involuntarily suspended, then there is a **<X day>** grace period during which the account will be inaccessible but can be reopened if the customer meets their payment obligations and resolves any terms of service violations.

**[An account is involuntarily terminated should your customer fail to meet their payment obligations. This section is referring to how long you intend to keep your customers account active but inaccessible to them until they make their payments on their account. **

**There is no hard requirement for the number of days for this as well as this is also a courtesy on your company’s part. **

***If your organization’s process is to immediately consider customers who lapsed their payment as inactive, you can modify this section to reflect what you are doing or remove it entirely]**

If a customer wishes to manually backup their data in a suspended account, then they must ensure that their account is brought back to good standing so that the user interface will be available for their use. After **<X days>**, the suspended account will be closed and the data will enter the “expired” state. It will be permanently removed **<X days> **thereafter (except when required by law to retain).

**[This section is saying that your customer will not be able to manually backup their data if their account balance is not settled. If they continue to fail meeting their payment obligations, their suspended account will be treated as voluntarily closed and enter the expired state. **

**There is no hard requirement for the number of days for this. Usually, we see this ranging from 30 days to 180 days, but 30 to 90 days is the most common.**

**Similar to the first sentence, if your organization’s process is to delete the data associated with any inactive customers immediately or to delete customer data upon receiving a request, you can modify this language to reflect what you are doing**

**Data that needs to be deleted should be deleted from backups as well]**

## Related articles

- [Test 136: Data Retention Policy](test-136-data-retention-policy.md)
- [Backup Policy Guidance](backup-policy-guidance.md)
- [Vulnerability Management Policy Guidance](vulnerability-management-policy-guidance.md)
- [Data Protection Policy Guidance](data-protection-policy-guidance.md)
- [Personal Data Management Policy Guidance](personal-data-management-policy-guidance.md)
