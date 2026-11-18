# Creating Custom Tests

Source: https://help.vanta.com/en/articles/11345522-creating-custom-tests
Collection: Evidence Collection ; Evidence Collection › Tests
Fetched: 2026-11-17

## Article text

Feature availability: This article discusses Custom Tests, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Custom Tests lets Vanta users build and manage their own automated tests, map them to controls and frameworks, and validate security program requirements using their own integration data. If Custom Tests is not available on your plan, the Documents page can be used for similar purposes.
 
 

## Ways to Create Custom Tests
All of the options below are part of the Custom Tests feature. You can create custom tests in one of three ways:
- 
Configure a test parameter (on select Vanta-built tests)
- 
Copy an existing test (Vanta-built or custom)
- 
Create a Custom Test
 

## Configure a Test Parameter
Some Vanta-built tests allow you to customize a parameter like the number of days before an account should be deactivated or the branch name for production repositories.
- 
Go to the Tests page
- 
Open the test you’d like to configure
- 
Select the Evidence tab (formerly called Source Data)
- 
Adjust the available field(s) to match your policy
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/1776182145/d2ededab3106fe3fa757b3a273c6/image+%2810%29.png?expires=1794967200&signature=81cda1153508df24b559f742b404c79a8f9e7f53623fc9061dfb91e522e7a518&req=dScgEMh2n4BbXPMW1HO4zWmSJBRdV3HrwlQ4EYnLw4rZ1n2O00llCD%2B9t6xI%0AFDcxagvbuFcQWr8v%2F%2Fg%3D%0A>
 
Please note: Only a limited set of Vanta-built tests <https://help.vanta.com/en/articles/11345527-customizing-automated-tests> support configurable parameters. If you think a test would benefit from customization, you can provide feedback to your Customer Success team.
 

## Copy an Existing Test
Some Vanta-built and custom tests can be copied and modified to suit your needs.
- 
From the Tests page, select the test you want to copy
- 
Click the Evidence tab (formerly called Source Data)
- 
Choose Copy test
- 
Edit the name, logic, and details to create a new test
 
You can also copy your own existing custom tests to make variants.
Please note: When you copy a test in Vanta, there are a few important things to keep in mind. The new test won’t carry over any control mappings, so you’ll need to manually add those after copying. You’ll also need to assign an SLA category and test owner. And because custom tests can’t be edited after they’re created, any future changes will require making a new copy of the test.
 

## Create a Custom Test

## Single-resource custom test
- 
From the Tests page, select  + Create custom test
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768780/cb8bde4d1ad57cdb42a67ae27749/35424402326164?expires=1794967200&signature=f4edc4ada06a30440521cc0db75dc561c62c17e470e2ed6ab99449789c8c31dc&req=dSUmEM54lYZXWfMW1HO4zWcAYXZvqshC1cgnq8v2%2BGqtjZpDQLQcJ2IEgybK%0AF64UYTlUqMOtO8mXVW0%3D%0A>
- 
Add:
- 
Test name
- 
Description
- 
How to fix/remediate instructions
- 
From the drop-down, select the integration the custom test will be associated with, you cannot currently create a custom test that is not tied to an integration
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768770/6baade2bc2c1d9614a63e6e44d6e/28012720699156?expires=1794967200&signature=be6b09f49521f7eb6335d51ffa4502a9f2eaedbb787939cddfa5c41849e7afa6&req=dSUmEM54lYZYWfMW1HO4zVcSrJ2hP%2BInc%2BRe%2FHWXKFdbBhquTKG7G2bu5RW2%0AyntsjqlLG5oEGnq3dIc%3D%0A>
- 
Use the simple logic builder to build the test
- 
Select Create

## 2-resource custom test

### Overview
Custom tests now let you pull and join data from two resource types: a primary resource plus one secondary. The secondary can come from the same integration or a different one. You define a join condition (for example, User.email == GitHubMembership.user_email) that tells the Test Builder how to correlate records; the builder fetches and combines matching records so fields from both resources are available for scoping and pass/fail evaluation.
 
This enables tests that require correlated data across resources (for example, IdP user data joined to cloud access records). The Test Builder currently supports exactly one primary + one secondary resource per custom test (maximum of 2 data sources).
 

### Setup guide
The creation wizard in Vanta has four steps: Test data, Match data sources, Evaluation logic, and Test details. 

### Step 1: Test data
- 
From the Tests page, click + Create test 
- 
Select the integration and primary resource type 
- 
Click +Add data source to add a second integration and resource type
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226612586/5bcdecf910064e3d157723c5aa10/a8cdb7de-f36f-4e45-848d-147c4d0c93cd?expires=1794967200&signature=bb618654c2944a148a38bcb2ea557fa660c339306fdcf7d9df5d412cf820ccad&req=diIlEM9%2Fn4RXX%2FMW1HO4zWLh0QTLZASF890ysN%2FBPbJk4Hhnw08h%2B3%2FLIjBW%0A2k2As3V5Itk3IUDF4tI%3D%0A>
 
Scoping conditions (optional): Under each selected data source, you can click + Add condition to narrow the resources in scope for that data source. You can also click Show available fields to browse the fields you can filter on.
Note: Scoping conditions on the secondary resource are applied before the join. Only secondary resources that pass their scoping filter will be available for matching with the primary resource. 
- 
Click Continue

### Step 2: Match data source
This step only appears when you have two data sources selected
- 
Pick a property from each resource type to define how records should be matched. The join is equality-based (i.e. a primary record matches a secondary record when the selected fields have the same value). 
Important join behavior to be aware of: 
- 
Join matching is type-strict: the number 1 will not match the string "1", and the boolean true will not match the string "true".
- 
Null, undefined, or missing values on either side will not produce a match.
- 
Only scalar values (strings, numbers, booleans, and dates) are supported as join fields. Objects and arrays will not match.
- 
If a primary resource has no matching secondary resources, it will still be evaluated — but with an empty set of secondary data. How this affects the outcome depends on your evaluation logic (see below).
- 
Click Continue
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226618405/59e3a49ad44fca6856692f8d7cd1/a724c31c-394b-4e8e-be7b-92c9a41c763f?expires=1794967200&signature=3ebeece339e11bc205da865387a67e5370eb8f710f9a92a44dfd7a6ff760a6ea&req=diIlEM9%2FlYVfXPMW1HO4zd9DDrDe327aVM8z4M2I32Rh8wsdTPVpKQ3r1djX%0AeuDCaQcsLWszmFR9gjE%3D%0A>

### Step 3: Evaluation logic 
This step has 3 sections: 
- 
Test outcome (reducer strategy) - Choose whether the overall test passes based on all or any primary resources: 
- 
All - The test passes only if every in-scope primary resource passes the evaluation logic. If any single resource fails, the overall test fails.
- 
Any - The test passes if at least one in-scope primary resource passes. Resources that don't pass are marked as N/A rather than Fail.
- 
Resource outcome (pass/fail rules) - Use the logic builder to define the conditions that determine whether each individual primary resource passes or fails. The field picker shows fields from both the primary and secondary resources, so you can reference either in your conditions. When referencing secondary resource data in your conditions, you can also specify whether the condition should be met by any or all of the matched secondary resources for a given primary.
- 
Evaluation preview - Review the evaluation preview to validate the join and evaluation behavior against your actual data. The preview displays: the overall test outcome (pass/fail), counts of total primary resources matched, passing, failing, and N/A, and a table of individual resource-level outcomes showing how each primary resource would be evaluated. 
Tip: If a primary resource has no matching secondary records after the join, a condition checking for "at least one matching secondary where…" will cause that primary to fail. Keep this in mind when designing your logic.
 
If no resources appear in the preview, try adjusting your data source selections or scoping conditions. 
- 
Click Continue
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226625761/e4277cfc7814c6c6dd64690303f7/896e07e2-a295-4f2d-bbca-0d9471c6cf5f?expires=1794967200&signature=651be719d80ef2c871d9113fdeb6ba5f160ce2d8f6ff92c50b86b859fcfe28ae&req=diIlEM98mIZZWPMW1HO4zTMoYy60pxwCAC2ThwAROLtEIY6cST329R8TPWxu%0AtnSFijsSmt0iEm7XWPc%3D%0A>
 

### Step 4: Test details 
- 
Finally, complete the Test details section by creating a Test name, adding a Description, and providing Vanta with Remediation instructions (optional). 
- 
Click Save test.
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2226628393/2f5c5c3abd7c8be7d5d9cacb1d02/36b2f72c-52ef-41d1-bd66-d4fc3bcbcd95?expires=1794967200&signature=e32ea6087bd71d5203f8e8c4abb96f3429c8caf39097a5d48e6c2a5b7e22da16&req=diIlEM98lYJWWvMW1HO4zWwv2TscaQdoWyZJT%2Brf1K6Yk0pQ6mvHE2O%2F0AXh%0AvvzoeC0lxAfWcsQRESk%3D%0A>
 

### After creating a 2-resource test 
After saving, be sure to: 
- 
Map the test to controls (this is not automatic – see “Mapping the test to controls” section below) 
- 
Assign an SLA category
- 
Assign a test owner
- 
Deactivate the original test if this replaces one you no longer need
 

## Mapping the Test to Controls
- 
From the Tests page, select the Custom tab
- 
Search for your test
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768773/ce1353f63748c517f07819418f8c/28012704198676?expires=1794967200&signature=67c173ff2c7771fdb03ad9ca3f1692390dff3601e13a6a54cae8e67ffb222d83&req=dSUmEM54lYZYWvMW1HO4zXOfnKYGQz4%2FZaqvh3H2ocR8D62onrqXNG6S21%2Fu%0Aaf8G0GUjRQpCeShMiSM%3D%0A>
- 
Select the test
- 
Open the Controls tab
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768791/3bb7a442d5af27c6227649cb9b5b/28012720704532?expires=1794967200&signature=2de6113c7aac4df5a8fae878fbd3c2c71233820bac2078a8707836393ee74242&req=dSUmEM54lYZWWPMW1HO4zeVB4dLxXLDyc0ayTiWpGC4afIkivY%2FyeZOhpUs3%0AQUj3F73ZDd2f79tNwQA%3D%0A>
- 
Select Add control
- 
Choose the controls you would like mapped to this test, and click Add
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768792/cb196c94c06a3dcbbef211867bf0/28012704207508?expires=1794967200&signature=0d81b8dc83de42731278381fa9b4379bbe25ab4d92bb530a11c11ade2a40f084&req=dSUmEM54lYZWW%2FMW1HO4zYHrSHyUW2hIoe1%2FFx5rdv1GPQ9u86898GaJPG1O%0A2GcpnyryIdRsUPAvZ8c%3D%0A>
 
 

## Finalizing and Managing Custom Tests
After creating or copying a test, be sure to:
- 
Map it to controls (this is not automatic)
- 
Assign an SLA category
- 
Assign test owners
- 
Deactivate the original test if you no longer need it
These final steps ensure the test integrates into your program and is monitored properly.
 
Please note: Custom tests can now support both automated checks and manual inputs. This feature allows creating unique tests to validate security program elements either automatically or through manual evidence when required.

## Images

- [image 01] ../../images/ux/tests/creating-custom-tests--01.png
- [image 02] ../../images/ux/tests/creating-custom-tests--02.png
- [image 03] ../../images/ux/tests/creating-custom-tests--03.png
- [image 04] ../../images/ux/tests/creating-custom-tests--04.png
- [image 05] ../../images/ux/tests/creating-custom-tests--05.png
- [image 06] ../../images/ux/tests/creating-custom-tests--06.png
- [image 07] ../../images/ux/tests/creating-custom-tests--07.png
- [image 08] ../../images/ux/tests/creating-custom-tests--08.png
- [image 09] ../../images/ux/tests/creating-custom-tests--09.png
- [image 10] ../../images/ux/tests/creating-custom-tests--10.png
