# Part 3: Create, Run, and Map a Custom Test

Source: https://help.drata.com/en/articles/11825614-part-3-create-run-and-map-a-custom-test
Collection: Understand the Drata Platform › Connections › Custom Connections and Tests
Updated: 2026-06-12
Fetched: 2026-11-22

## Article text

After setting up a Custom Connection and submitting data, you can create custom tests to validate that data and map it to your controls. This guide walks you through the full lifecycle: building a test, reviewing results, managing exceptions, and mapping to controls.

## Create a Custom Test

1. **Go to the Monitoring tab.**
   This is where all custom tests associated with your Custom Connections are displayed.
2. **Select *Create test*.**
3. **Enter a name and description** for your test. Choose something clear and descriptive, especially if you plan to run multiple tests against the same data source.
4. **In the Test Builder, configure your logic:**
   - **Category**: Select `Custom`
   - **Provider**: Enter the name of your custom connection
   - **Condition Group**: Choose the resource (your data source) and define attributes for the test (e.g., `hasMFA = true`)
   💡 If your dataset includes **complex nested arrays**, you may need to use the **Advanced Editor** to write custom test logic.
5. **Save the test.**
   It will be saved as a draft until you’re ready to publish.

## Run or Publish the Test

You can run a draft test at any time to preview its behavior.

1. Go to the **Monitoring page** (or the Monitoring tab of your specific Custom Connection).
2. Use filters to find your test:
   - **Custom (Draft)** – tests not yet published
   - **Custom (Published)** – tests actively monitored
3. Select your draft test and run it manually to view the results.
4. When ready, **publish and run the test** to include it in monitoring and evidence collection.

Learn more about Drata's[Monitoring](https://help.drata.com/en/articles/4790546-monitoring) or[Custom Tests](https://help.drata.com/en/articles/8840053-create-custom-test).

## View and Mange the test results

1. On the **Monitoring **page, select the desired custom tests.
2. Under the **Last test **result, select **View event** to verify event tracking details and raw evidence.
3. To exclude a record from future tests.
   - Select the record.
   - Choose the Exclude option.

To learn more about exclusions, go to[Exclusions](https://help.drata.com/en/articles/4836280-exclusions).

## Map Tests to Controls

You can map a custom test to your controls.

1. In the test drawer, scroll to the** Control info **section.
2. Select **Map controls** to map the test to one or more controls.

To learn more, go to [Mapping Tests and Controls](https://help.drata.com/en/articles/6390282-mapping-tests-and-controls).

## Related articles

- [Common use cases for custom test](common-use-cases-for-custom-test.md)
- [Part 1: Custom Connections and Tests](part-1-custom-connections-and-tests.md)
- [Filter and search tests in Monitoring (New Experience)](filter-and-search-tests-in-monitoring-new-experience.md)
- [Map Tests to Controls](map-tests-to-controls.md)
- [Create and Publish Custom Tests](create-and-publish-custom-tests.md)
