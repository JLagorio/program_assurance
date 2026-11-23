# Test 106: Has a Backup Policy

Source: https://help.drata.com/en/articles/4776867-test-106-has-a-backup-policy
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company records to determine if a Backup Policy is in place and is before the policy renewal date.

## Article text

## ASSOCIATED DRATA CONTROL

This test is part of the **Daily Database Backups **control that ensures your company performs backups daily and retains them in accordance with a predefined schedule in their Backup Policy.

## WHAT TO DO IF A TEST FAILS

If Drata finds that your Backup Policy is either not in Drata or the policy renewal date has passed, the test will fail. With a failed test you will receive messaging from Drata stating that a Backup Policy either does not exist or needs to be approved.

To remediate a failed test either create or upload a Backup Policy within Drata. Set a renewal date that aligns with your compliance program goals. If your Backup Policy exists but needs approval then you will need to notify the owner of the policy to click 'approve policy' as soon as possible.

## STEPS TO REMEDIATE

1. Navigate to the Policy Center page
2. Add a 'Backup Policy' and ensure that the newly added policy is approved
3. Set a policy renewal date that aligns with your compliance program goals. Many frameworks require that policies are reviewed/approved annually

## HELPFUL RESOURCES

- [Building Policies Within Drata](https://help.drata.com/en/articles/4826936-policy-builder)

## Related articles

- [Test 33: Incident Response Plan (IRP)](test-33-incident-response-plan-irp.md)
- [Test 44: Acceptable Use Policy](test-44-acceptable-use-policy.md)
- [Test 67: Cryptography Policy](test-67-cryptography-policy.md)
- [Test 89: Internal Password Policy for Employees](test-89-internal-password-policy-for-employees.md)
- [Test 143: Sensitive Data Disposal Policy](test-143-sensitive-data-disposal-policy.md)
