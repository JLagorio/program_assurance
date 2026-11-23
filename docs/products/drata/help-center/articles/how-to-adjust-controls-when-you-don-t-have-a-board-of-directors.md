# How to Adjust Controls When You Don’t Have a Board of Directors

Source: https://help.drata.com/en/articles/6501316-how-to-adjust-controls-when-you-don-t-have-a-board-of-directors
Collection: GRC Best Practices › Governance
Updated: 2026-08-05
Fetched: 2026-11-22

## Article text

When logging into Drata for the first time and looking at the*** Key Personnel Info ***page or the ***Controls*** page, one of the standout pieces of information requested will be around your **Board of Directors**. But for many smaller companies, a Board might not exist. And you can’t just create a Board of Directors out of thin air; recruiting/appointing members of the Board takes time. Luckily though, you are not required to create a Board of Directors.

This guide explains how smaller organizations can effectively manage and modify specific Drata controls when a formal Board of Directors is not in place. In the event that you do not currently have a Board, there are certain controls within Drata that can be modified or marked out of scope, which we will cover below.

### Understanding Drata Controls Without a Board

Here's how to manage specific Drata controls if your organization doesn't have a formal Board of Directors:

#### DCF-41: Independent Board of Directors

The first control related to a Board of Directors is DCF-41. In the event that you don’t have a Board of Directors, you can mark this control out of scope.  In Drata, navigate to this control and select the option to mark it 'Out of Scope' and provide a brief explanation that your organization does not have a formal Board of Directors. You should also disable its related monitoring test, “[Independent Board of Directors](test-51-independent-board-of-directors.md).”

For SOC 2 purposes, please note that you are not required to have an independent board of directors. You can read more about this specific requirement in our detailed help article: [Are we required to have an independent Board of Directors?](are-we-required-to-have-an-independent-board-of-directors.md)

#### DCF-143: Board Oversight Briefings Conducted

This control, DCF-143, is all about ensuring someone oversees your control environment. If you don't have a Board of Directors, we recommend editing this control to better fit your structure.

The main goal is to show that there's a designated person or group ultimately responsible for monitoring your organization's security and privacy. If there's no Board, this responsibility typically shifts to your Executive Management team (or someone they appoint). For smaller organizations, the "Executive Management team" typically refers to the CEO, Founders, or other senior leadership with direct oversight of company operations and strategy.

For this reason, we suggest changing the name of the control to:

- “**Management Oversight Briefings Conducted**.”

You should then update the Control Description to:

- **“The company's executive management team or a relevant appointee is briefed at least annually on the state of the company's cybersecurity and privacy risk. Executive management or their appointee provides feedback and direction as needed.**”

Evidence to support the implementation of this control would then be meeting minutes showing that your Executive Management (or their appointee) was briefed on your cybersecurity status, including results from your risk assessments, vulnerability scans, and penetration tests.

#### DCF-144: Board Charter Documented

This is another control we suggest modifying if your organization doesn't have a Board. The goal of DCF-144 is to show that you have formal documentation outlining who is responsible for overseeing your control environment. While a Board Charter usually handles this for companies with a Board, this documentation is still required even without one.

This documentation can take various forms, such as policies, job descriptions, or other official documents. For instance, this could include an organizational chart with clearly defined roles and responsibilities, an internal security committee charter (even if informal), or a dedicated section within your Information Security Policy that explicitly assigns oversight duties to Executive Management. If your organization doesn't have a Board of Directors, we recommend changing the Control Name to:

- **"Responsibility for Control Environment Documented"**

You should then modify the Control Description to:

- **"The responsibility for managing the controls in place within the organization has been formally documented."**

And the Control Question should read:

- **"Does the organization have formal documentation which outlines the responsibilities of executive management as they relate to internal control?"**

As mentioned, this documentation can be found in different places. For instance, your Information Security Policy might state that your Executive Management team is responsible for overseeing and managing all controls. Or, job descriptions for your Executive team members might include responsibilities related to overseeing controls. No matter where it's documented, you should link this documentation to DCF-144.

#### DCF-145: Board Expertise Developed

This control focuses on the Board's expertise in managing the control environment, even without day-to-day involvement. However, if your organization doesn't have a Board and your Executive Management team is handling this oversight, they already have daily responsibilities and a deep familiarity with your environment. This means they naturally possess the expertise needed.  In Drata, navigate to this control and select the option to mark it "Out of Scope," explaining that oversight responsibility rests with the Executive Management team who possess inherent operational expertise.

#### DCF-146: Board Meetings Conducted

The final control, Board Meetings Conducted, can also be marked out of scope. Similar to DCF-41 and DCF-145, mark this control "Out of Scope" in Drata. This control would be redundant given the modification of DCF-143.

### Conclusion

Even without a formal Board of Directors, your organization can effectively demonstrate compliance within Drata. By carefully reviewing and adjusting the specific controls outlined above – either by marking them out of scope or by reassigning their intent to your Executive Management team – you can ensure your Drata environment accurately reflects your company's governance structure. The key is to clearly document who is responsible for oversight and how that oversight is exercised, ensuring the spirit of each control is met.

### Key Considerations

While these adjustments can help your organization navigate Drata without a formal Board of Directors, it's crucial to understand a few key points:

- **Spirit of the Control:** Remember that the goal is to demonstrate that the *intent* of the control (e.g., oversight, documentation, expertise) is being met, even if the named entity (Board) isn't present.

- **Informed Counsel:** It is a best practice to actively seek informed guidance regarding your unique organizational structure and any applicable compliance frameworks (e.g., SOC 2, ISO 27001). This might involve leveraging existing internal expertise or engaging with a qualified compliance consultant or legal counsel as your needs and resources allow.

- **Regular Review:** As your company grows and evolves, or as compliance requirements change, regularly review and update these control adjustments and related documentation.

## Related articles

- [Example Evidence for Not Monitored GDPR Controls](example-evidence-for-not-monitored-gdpr-controls.md)
- [Example Evidence for Not Monitored Controls Linked to Policies](example-evidence-for-not-monitored-controls-linked-to-policies.md)
- [Example Evidence for Not Monitored Controls (HIPAA)](example-evidence-for-not-monitored-controls-hipaa.md)
- [The Drata Control Framework & Requirement Relationship](the-drata-control-framework-requirement-relationship.md)
- [Example Evidence for Not Monitored Controls (CPS 230)](example-evidence-for-not-monitored-controls-cps-230.md)
