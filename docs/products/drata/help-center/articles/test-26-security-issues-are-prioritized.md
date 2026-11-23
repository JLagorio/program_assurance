# Test 26: Security Issues are Prioritized

Source: https://help.drata.com/en/articles/4776916-test-26-security-issues-are-prioritized
Collection: Monitoring Test Guidance
Updated: 2026-08-11
Fetched: 2026-11-22
Description: Drata inspects your company task tracking system to determine if security issues are being tagged and prioritized accordingly.

## Article text

**BEFORE DIVING IN**

This automated test is only available for the following ticketing integrations at this time: Asana, Azure Board, ClickUp, GitHub Issues, GitLab Issues, Jira, Linear, Shortcut, Trello, Zoho Bug Tracker.

**ASSOCIATED DRATA CONTROL**

This test is part of the **Security Issues are Prioritized **control that ensures your company tracks, assigns, and prioritizes security deficiencies through internal tools according to their severity, by an independent technical resource.

**WHAT TO DO IF A TEST FAILS**

If Drata finds that you have security issues in your ticketing system that are not properly categorized and assigned to an owner, the test will fail. With a failed test you will receive a list of tickets that have either not been assigned or properly categorized with a 'security' or priority label.

To remediate a failed test, you will need to review the reported tickets and ensure that they are properly categorized, assigned, and addressed within an acceptable timeframe, according to your Security Vulnerability Policy.

**STEPS TO REMEDIATE**

1. Log in to your task tracking system
2. Navigate to the project(s) that manage and receive security issues
3. Ensure that all your relevant Security issues are tagged with a Security type/label/component. This should match the Security label you chose when first setting up your ticketing connection in Drata.
   1. If you’re using Jira for your ticketing system, you can also use JQL to have Drata identify tickets that should be evaluated as security issues.
4. Within that set of issues, ensure a priority label is assigned to all of them. These should match the priority labels you chose when first setting up your ticketing connection in Drata.
   1. Certain ticketing connections, such as Jira and ServiceNow, do not ask for a priority value to be configured in the connection drawer since the test reads the native priority field within those systems.
   2. Other ticketing connections, such as Asana and GitLab Issues, will require you to configure priority values in the connection drawer.
5. Ensure all of these issues have an assigned owner.
   Note: For security issues that are closed, having an owner is not a requirement. For closed security issues, Drata checks that it is properly categorized and prioritized.

## Related articles

- [Test: Has Security Policies](test-has-security-policies.md)
- [Test 65: Security Patches Auto-Applied](test-65-security-patches-auto-applied.md)
- [Test: Policies for a Security Team](test-policies-for-a-security-team.md)
- [Jira security tickets: Label vs JQL](jira-security-tickets-label-vs-jql.md)
- [ClickUp Integration Guide](clickup-integration-guide.md)
