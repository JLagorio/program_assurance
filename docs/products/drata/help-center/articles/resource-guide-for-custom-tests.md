# Resource Guide for custom tests

Source: https://help.drata.com/en/articles/9415404-resource-guide-for-custom-tests
Collection: Understand the Drata Platform › Monitoring › Custom Tests
Updated: 2026-01-16
Fetched: 2026-11-22
Description: The Resource Guide provides detailed information about available attributes and the structure of your data when you are creating custom test

## Article text

Creating custom tests helps ensure your compliance checks reflect your real environment, but knowing *what* to test and *how* to structure a test can be challenging. The **Resource Guide** helps you understand what data is available, how it’s structured, and which attributes you can evaluate when building a custom test.

Use the Resource Guide to confidently design accurate tests and avoid unexpected results.

---

## Access the Resource Guide

While creating a custom test, you can open the Resource Guide at any time. From the Resource Guide:

1. Select a **Provider** (such as AWS, GCP, or Azure).
2. Select a **Service** to narrow the available resources.
3. Select a **Resource** to view its data structure and attributes.

This view shows exactly what data Drata can evaluate for the selected resource.

---

## Understand Attributes with the Attribute Dictionary

To learn what each attribute represents, select **View attribute dictionary**.

The Attribute Dictionary provides:

- Attribute name
- Data type
- Description
- Relationship to other attributes

You can use the search bar to find attributes by name or description, making it easier to locate the fields you need.

---

### Nested Attributes

Some attributes contain nested attributes. These are displayed with vertical lines to indicate hierarchy.

For example:

- `logAnalytics` is nested under `diagnostics`
- `workspaceId` is nested under `logAnalytics`

Each vertical line represents a deeper level of nesting.

### Access nested attributes

Use **dot notation** to reference nested attributes in the Test Builder:

- `diagnostics.logAnalytics`
- `diagnostics.logAnalytics.workspaceId`

---

### Attributes in Arrays

Some attributes belong to objects within an array rather than being nested directly. These are shown as grouped blocks in alternating gray and white sections.

To evaluate attributes inside arrays, you’ll need to use the **Advanced editor**, which supports more complex logic and array-based evaluations.

---

## When to Use the Advanced Editor

Use the Advanced editor when your test needs to:

- Evaluate nested attributes within arrays
- Apply complex logic
- Go beyond what the Builder tab supports

## External Resource

To learn more about GCP’s resources, go to [Resource hierarchy](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy).

To learn more about AWS’s resources, go to [What are resource groups?](https://docs.aws.amazon.com/ARG/latest/userguide/resource-groups.html#:~:text=In%20AWS%2C%20a%20resource%20is,to%20another%20for%20each%20task.)

To learn more about Azure’s resources, go to [What is Azure Resource Manager?](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview#terminology)

## Related articles

- [Test 69: Customer Data in Cloud Storage is Encrypted at Rest](test-69-customer-data-in-cloud-storage-is-encrypted-at-rest.md)
- [Common use cases for custom test](common-use-cases-for-custom-test.md)
- [Excluding Infrastructure resources](excluding-infrastructure-resources.md)
- [Create and Publish Custom Tests](create-and-publish-custom-tests.md)
- [Advanced Editor in the Test Builder](advanced-editor-in-the-test-builder.md)
