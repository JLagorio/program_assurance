# SOC 2 Type 1 vs Type 2: Which Audit Type Should I Choose

Source: https://help.drata.com/en/articles/8272685-soc-2-type-1-vs-type-2-which-audit-type-should-i-choose
Collection: Framework Information › SOC 2 2017
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

**Do I need to complete SOC 2 Type 1 audit before a Type 2?**

A common question we get is: “Do I need to complete a SOC 2 Type 1 audit before a Type 2, or can I go straight to Type 2?” The short answer is no, you can go straight to Type 2, but there are benefits to doing a Type 1 first. This article outlines the key differences between SOC 2 Type 1 and Type 2 audits and explains when each might be appropriate for your organization.

**What is a SOC 2 Audit?**

A SOC 2 audit evaluates your systems against the AICPA’s Trust Services Criteria, which include Security, Availability, Processing Integrity, Confidentiality, and Privacy. A CPA firm evaluates your systems and controls, and the result is a SOC 2 Report– either Type 1 or Type 2.

| **Aspect** | **SOC 2 Type 1** | **SOC 2 Type 2** |
|---|---|---|
| Scope | Control design at a specific point in time | Control design and operating effectiveness over a period of time |
| Timeframe | Single date ("as of") | Typically 3–12 month review period |
| Evidence Requirements | Minimal - point-in-time proof such as policies or screenshots | Detailed - includes sampling and testing of control operation over time (e.g., logs, tickets, audit trails) |
| Completion Time | Faster (can take 1-3 months) | Takes longer (typically 6-12+ months due to observation period) |
| Customer Preference | Best for companies building an initial security foundation | Commonly expected; preferred by mature companies needing stronger, ongoing assurance |

**What is a SOC 2 Type 1 Audit?**

During a SOC 2 Type 1 audit, the CPA firm will evaluate whether your controls are suitably designed to meet the applicable Trust Services Criteria outlined by the AICPA. In a Type 1 audit, auditors are only evaluating the design of controls, not whether they are functioning properly. Since Type 1 only assesses control design, the evaluation is based on a single point in time, the ‘As Of’ date. The final deliverable of a SOC 2 Type 1 audit is a SOC 2 Type 1 report. Section 4 of the Type 1 report lists the controls but does not include details about testing or operational performance.

**What is a SOC 2 Type 2 Audit?**

A SOC 2 Type 2 audit evaluates both the design and operating effectiveness of your controls over a period of time.The primary difference is that a SOC 2 Type 2 tests both the design of the controls an organization implements as well as the operating effectiveness of those controls (which means they test whether the controls are working as intended). For this reason, a SOC 2 Type 2 report must be carried out over a period of time in which the auditor monitors the effectiveness of your controls. The final deliverable of a SOC 2 Type 2 audit is a SOC 2 Type 2 report. Section 4 of a Type 2 report includes the auditor’s test procedures and results, offering a higher level of assurance.

** What Do Most Customers and Prospects Prefer?**

Most customers and prospects familiar with SOC 2 will ask for a Type 2 report, as it shows your controls are both in place and functioning effectively.

**Why get a SOC 2 Type 1 Audit?**

If this is your first SOC 2 audit, a Type 1 can be a practical first step. This is because the threshold for evidence is much lower. The auditor is only evaluating the design of your controls, not whether they actually work. For this reason, an auditor may only examine one sample to show that a control is designed appropriately.

For example,  if you perform daily database backups, the auditor might:

- Check just one instance,
- Or even rely solely on written policies. Some auditors may not even test an example, and may only look at your policies to see if your policies state that daily database backups are performed.

For the first time you undergo a SOC 2 audit, this is desirable because it can help to identify any obvious gaps in your control environment. And the controls tested in a SOC 2 Type 1 audit are the same controls tested in a SOC 2 Type 2 audit, so a SOC 2 Type 1 audit can serve as a method of preparing for a SOC 2 Type 2 audit.

Finally, a SOC 2 Type 1 audit results in a formal report,  which can be shared with customers or prospects as a signal of progress, especially if they’re requesting a SOC 2 Type 2 report. Because it’s based on a single point in time, a Type 1 report is faster to complete. It can show customers that you're working toward Type 2 compliance.

**Why Would You Get a SOC 2 Type 2 Audit?**

A SOC 2 Type 2 audit is generally what customers and prospects request. So in order to satisfy those requests, companies will often have a SOC 2 Type 2 audit performed.

A Type 2 audit provides greater transparency by detailing the auditor’s tests and results, offering stronger assurance. In that way, it provides a higher level of assurance to the readers of the report than a SOC 2 Type 1 audit. Because of this higher level of assurance, the tests performed by the auditor will also be more rigorous.

Sticking with the daily database backups example from before, in a SOC 2 Type 2 audit, an auditor would test this by selecting a random sample of days within the audit period to confirm that backups of your database were successfully performed on those days. If a backup was not performed on a sampled date, it may lead to an exception, which would be disclosed within the SOC 2 Type 2 report.

Since it is what customers and prospects most often request, some organizations go straight to Type 2 to save time and money, as it avoids the cost of two separate audits. The main benefit to this approach is that it will reduce overall audit costs, since you would only be paying for a single audit vs paying for two audits.

**Do We Have to Do a SOC 2 Type 2 Audit?**

There is no formal requirement to undergo a SOC 2 Type 2 audit – it’s entirely optional. However, while some companies choose to repeat Type 1 audits, this is uncommon and often falls short of customer expectations, especially as your business grows or handles more sensitive data.

## Related articles

- [SOC 2 Background Checks FAQs](soc-2-background-checks-faqs.md)
- [SOC 2 System Description](soc-2-system-description.md)
- [Reviewing Your Vendors' SOC 2 Reports Using Drata](reviewing-your-vendors-soc-2-reports-using-drata.md)
- [SOC 2 Checklist](soc-2-checklist.md)
- [Hosted Technology Vendors: What to Collect and How Drata Can Help](hosted-technology-vendors-what-to-collect-and-how-drata-can-help.md)
