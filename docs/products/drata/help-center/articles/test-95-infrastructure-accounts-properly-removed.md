# Test 95: Infrastructure Accounts Properly Removed

Source: https://help.drata.com/en/articles/4777040-test-95-infrastructure-accounts-properly-removed
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company records to determine if terminated employee accounts are removed from the infrastructure provider.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Terminated Employee Access Revoked Within One Business Day** control that ensures access to infrastructure and code review tools is removed from terminated employees within one business day.

**WHAT TO DO IF A TEST FAILS**

First, you must ensure that you have approved at least one version of your System Access Control Policy. This policy contains SLAs that govern how long your business has to remove access from accounts that belong to separated employees. Alternatively, you are able to define a custom policy with these SLAs, and replace Drata's template System Access Control Policy.

Drata will then evaluate the relationship between infrastructure accounts that have access to your systems, and former personnel who are mapped to these accounts. You should review these mappings on the [Managed Accounts page for your connected infrastructure](https://help.drata.com/en/articles/4673960-manage-connected-infrastructure-accounts). If Drata finds that there is at least one terminated/separated employee that still has access to company infrastructure the test will fail. With a failed test you will receive a list of terminated/separated employees that still have access to infrastructure systems.

To remediate a failed test you will either need to manually remove their access, or if an employee has been mislabeled as terminated/separated but is still currently active you will need to mark them as a current employee/contractor on the 'Personnel' page.

## Related articles

- [Test: Policies are Acknowledged](test-policies-are-acknowledged.md)
- [Test 45: Employees Acknowledge the Acceptable Use Policy](test-45-employees-acknowledge-the-acceptable-use-policy.md)
- [Test 94: Version Control Accounts Removed Properly](test-94-version-control-accounts-removed-properly.md)
- [Test 98: Employees have Unique Infrastructure Accounts](test-98-employees-have-unique-infrastructure-accounts.md)
- [Test 124: Root Infrastructure Account Unused](test-124-root-infrastructure-account-unused.md)
