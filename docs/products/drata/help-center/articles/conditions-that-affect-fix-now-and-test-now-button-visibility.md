# Conditions That Affect 'Fix Now' and 'Test Now' Button Visibility

Source: https://help.drata.com/en/articles/12418345-conditions-that-affect-fix-now-and-test-now-button-visibility
Collection: Understand the Drata Platform › Monitoring
Updated: 2026-07-07
Fetched: 2026-11-22
Description: Fix Now and Test Now Button Visibility in Drata Explained

## Article text

In Drata, the **Fix Now** and **Test Now** buttons help you take immediate action on automated tests. However, there are specific cases where these buttons may not appear. This article explains when and why these buttons may be hidden.

## Fix Now Button

The Fix Now button appears when:

- **Test is failing**: The button is only shown if a test has failed. If the test passes, Drata hides the button because no remediation is needed.
- **Direct remediation is supported**: Some tests cannot be fixed within Drata. In these cases, the **Fix Now** button is not displayed. Instead, a **Learn More** button may appear to guide you to external help resources.

## Test Now Button

The **Test Now** button is limited to the **Monitoring page**. If you are viewing the **Controls page** or another section of the platform, this button will not be visible. You must navigate to the **Monitoring page** to access the **Test Now** functionality.

## Use Cases / Best Practices

If you do not see the **Fix Now** or **Test Now** buttons, follow these best practices:

- **Confirm test status**: Ensure the test is currently failing. Passed tests do not show the **Fix Now** button.
- **Check test type**: Determine whether the test supports in-app remediation. If it does not, look for a **Learn More** button for guidance.
- **Review navigation path**: Make sure you are on the correct page. The **Test Now** button only appears on the **Monitoring page**, not on the **Controls page**.

## Related articles

- [Test 51: Independent Board of Directors](test-51-independent-board-of-directors.md)
- [Test 64: Malware Detection Software Installed](test-64-malware-detection-software-installed.md)
- [Filter and search tests in Monitoring (New Experience)](filter-and-search-tests-in-monitoring-new-experience.md)
- [View and Manage Test Details (New Experience)](view-and-manage-test-details-new-experience.md)
- [Understanding Monitoring in Drata Training Video (New Experience)](understanding-monitoring-in-drata-training-video-new-experience.md)
