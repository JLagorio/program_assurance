# Future Hire Personnel

Source: https://help.drata.com/en/articles/13612293-future-hire-personnel
Collection: Personnel Management › Employee Onboarding
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Track future employees in Drata without impacting compliance by using Future Hire status based on start dates.

## Article text

Future Hire status lets you track employees who have a **confirmed start date in the future** without including them in your current compliance posture.

This is useful when you want visibility into upcoming hires without triggering personnel-related compliance checks before their first day.

---

## What happens when someone is a Future Hire

- Future hires are **excluded from personnel compliance checks**
- They are **not evaluated by monitoring tests**
- They are treated the same as **Out of Scope** personnel until their start date is reached
- You **cannot directly change employment status** to Future Hire

---

## Prerequisites

- You must have permission to edit personnel records
- If using HRIS or IdP integrations, understand how start dates are sourced

---

## Manually set a Future Hire start date

1. Go to **Governance → Personnel**.
2. Select the person you want to update.
3. In the **Details** section, select **Edit**.
4. Choose a start date in the future.
5. Select **Submit**.

The person's employment status updates automatically to **Future Hire**. This may take a couple of minutes to be updated.

## Update a Future Hire to active employment

To remove Future Hire status:

1. Change the start date to **today or a past date**
2. Then update employment status if needed

You cannot change employment status while the start date is still in the future.

---

## HRIS and IdP sync behavior

### HRIS sync

- If a future start date exists in your HRIS, Drata will automatically set the person as a **Future Hire**.
- This sync happens during the daily HRIS sync.

### Manual overrides and sync impact

- If you manually change a start date in Drata, HRIS hire date sync for that person stops.
- To restore HRIS control, reset the HRIS sync for that person.

---

## View Future Hire personnel

1. Go to **Personnel**
2. Select **Future Hire** for Employment status

## Related articles

- [Populating and Managing Personnel Data in Drata (Concept Guide)](populating-and-managing-personnel-data-in-drata-concept-guide.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)
- [Personnel Overview](personnel-overview.md)
- [Troubleshoot employment status issues in Drata](troubleshoot-employment-status-issues-in-drata.md)
- [Troubleshooting Identity Sync Issues in Drata](troubleshooting-identity-sync-issues-in-drata.md)
