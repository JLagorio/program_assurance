# Test 89: Internal Password Policy for Employees

Source: https://help.drata.com/en/articles/4776975-test-89-internal-password-policy-for-employees
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company records to determine if a Password Policy is in place and is before the policy renewal date.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Password Policy **control that ensures your company has established formal guidelines for passwords to govern the management and use of authentication mechanisms.

**WHAT TO DO IF A TEST FAILS**

If Drata finds that a Password Policy either does not exist or has not been approved within the last 12 months the test will fail.

To remediate a failed test, you will need to either upload or build a Password Policy within Drata, set a renewal date that aligns with your compliance program goals, and notify the policy approver to click 'Approve Policy' as soon as possible.

**STEPS TO REMEDIATE**

1. Navigate to the Policy Center page
2. Add a 'Password Policy' and ensure that the newly added policy is approved
3. Set a renewal date that aligns with your compliance program goals. Many frameworks require policy review/approval annually

**HELPFUL RESOURCES**

- [Building Policies Within Drata](https://help.drata.com/en/articles/4826936-policy-builder)

## Related articles

- [Test 106: Has a Backup Policy](test-106-has-a-backup-policy.md)
- [Test 33: Incident Response Plan (IRP)](test-33-incident-response-plan-irp.md)
- [Test 44: Acceptable Use Policy](test-44-acceptable-use-policy.md)
- [Test 67: Cryptography Policy](test-67-cryptography-policy.md)
- [Test 143: Sensitive Data Disposal Policy](test-143-sensitive-data-disposal-policy.md)
