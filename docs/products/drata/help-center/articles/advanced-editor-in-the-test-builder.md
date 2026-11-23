# Advanced Editor in the Test Builder

Source: https://help.drata.com/en/articles/13403932-advanced-editor-in-the-test-builder
Collection: Understand the Drata Platform › Monitoring › Custom Tests
Updated: 2026-11-09
Fetched: 2026-11-22
Description: Use the Advanced editor to write complex test logic with nested properties, arrays, and JSON-based rules that go beyond the Builder tab's capabilities.

## Article text

The **Advanced editor** gives you greater flexibility when building custom tests, especially for evaluating **nested properties, arrays, and complex logic** that can't be expressed in the Builder tab.

You can:

- Build test logic entirely in the Advanced editor, or
- Start by selecting attributes, operators, and values in the Builder tab, then switch to the Advanced editor to refine or extend the logic

When you switch to the Advanced editor, Drata automatically converts your selected choices to the JSON-based rule set.

## When to Use the Advanced Editor

Use the Advanced editor when you need to:

- Evaluate nested objects or arrays
- Apply complex AND / OR logic
- Check multiple attributes within the same resource
- Match tag **key–value pairs** (not just keys)
- Build tests that go beyond the Builder tab's UI limitations

If you're new to custom tests, start with **Create a Custom Test** before using the Advanced editor.

## How the Advanced Editor Works

### Continuous Validation and Guidance

The editor provides **real-time validation** to help you build correct test logic:

- Syntax and logic errors are highlighted instantly
- Error messages identify the exact line and issue
- Suggestions may be provided to help fix the problem

You **cannot save** test logic until all validation errors are resolved.

The editor supports IntelliSense to speed up test creation:

- Press **Ctrl + Space** to view suggested values
- Type `""` and hover to see available options
- Select a value to auto-populate it

### Build Test Logic with the Advanced Editor

1. Go to **Monitoring**
2. Create or edit a custom test
3. Enable **Advanced editor** within the condition group

Each code block supports up to **70 lines**.

When starting from scratch, the editor displays this default structure:

```
{
  "all": [
    {
      "fact": "",
      "operator": "",
      "value": ""
    }
  ]
} 
```

## JSON Structure Explained

### Top-Level Logical Operators

- **`all`** → Logical AND — all conditions must evaluate to true
- **`any`** → Logical OR — at least one condition must evaluate to true

You can nest `all` and `any` operators to create complex logic.

### Condition Properties

Each condition includes:

- **fact**: The attribute being evaluated (Builder tab: Attribute)
- **operator**: How the value is compared
- **value**: The expected state

```
{
  "fact": "encryption.enabled",
  "operator": "equal",
  "value": true
}
```

### Filtering Criteria (Include / Exclude)

You can define **filtering criteria** to narrow which resources are evaluated **before** conditions run.

Examples:

- Exclude resources with a specific tag
- Include only production resources
- Ignore resources marked with `DrataExclude`

Filtering criteria can be edited or removed at any time.

## Advanced JSON Examples

### Multiple Conditions (AND logic)

Verify encryption is enabled **and** region is `us-west-2`:

```
{
  "all": [
    {
      "fact": "Encryption",
      "operator": "exist",
      "value": true
    },
    {
      "fact": "region",
      "operator": "equals",
      "value": "us-west-2"
    }
  ]
} 
```

### Nested Object Property

Evaluate a nested object property using `path`:

```
{
  "all": [
    {
      "fact": "MasterUserSecret",
      "path": "KmsKeyId",
      "operator": "equal",
      "value": "xyz"
    }
  ]
} 
```

### Array Evaluation (All Items)

Ensure **all** snapshots are encrypted:

```
{
  "all": [
    {
      "fact": "dbInstanceSnapshots",
      "operator": "all",
      "value": {
        "fact": "Encrypted",
        "operator": "equal",
        "value": true
      }
    }
  ]
}
```

### Array with Multiple Conditions

Require snapshots to be encrypted **and** use a specific KMS key:

```
{
  "all": [
    {
      "fact": "dbInstanceSnapshots",
      "operator": "all",
      "value": {
        "all": [
          {
            "fact": "Encrypted",
            "operator": "equal",
            "value": true
          },
          {
            "fact": "KmsKeyId",
            "operator": "equal",
            "value": "123"
          }
        ]
      }
    }
  ]
}
```

### Key Takeaways

- Advanced editor enables complex, audit-grade test logic
- Validation prevents broken or misleading tests
- Drafts protect your compliance posture
- Nested logic and arrays require the Advanced editor
- Builder and Advanced editor are interchangeable when possible

## Related articles

- [Asset Management Policy Guidance](asset-management-policy-guidance.md)
- [Software Development Lifecycle (SDLC) Policy Guidance](software-development-lifecycle-sdlc-policy-guidance.md)
- [Common use cases for custom test](common-use-cases-for-custom-test.md)
- [Controls and Tests Updated Between January 2024 and October 2025](controls-and-tests-updated-between-january-2024-and-october-2025.md)
- [Create and Publish Custom Tests](create-and-publish-custom-tests.md)
