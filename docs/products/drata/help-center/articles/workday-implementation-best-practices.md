# Workday Implementation Best Practices

Source: https://help.drata.com/en/articles/14092393-workday-implementation-best-practices
Collection: Connection Support
Updated: 2026-03-17
Fetched: 2026-11-22

## Article text

## Data Requirements and Best Practices

Retrieves HR data using read-only access without modifying information in the HRIS system. Use HRIS data to detect hire and termination events that support onboarding and off-boarding compliance requirements. Sync employment status, hire dates, and key personnel attributes from the HRIS.

### How it works

1. The initial connection of the HRIS system in Drata establishes the authentication.
2. Once the connection is generated, Drata makes a small number of API requests to your HRIS to source updated employee data every 24 hours.
3. Drata makes a standardized request to the HRIS system and leverages a common data model that Drata has narrowed down to a few key data points to limit the scope of data.
4. The HRIS system sends the requested data back to Drata.
5. The only data points that Drata stores in its secure, single-tenant databases are work email, personal email, employment start and end dates, first and last name, job title, and employment status.

### What employee data is accessed by Drata?

1. Drata is granted **read-only access **and cannot alter any employee data in the HRIS system.
2. You can learn more about the data access requested by logging into Drata, visiting the connections page and selecting the HRIS connection. From there, a modal will open.
3. Hover over “Read employees” in the HRIS connection modal to see the specific employee data points in scope.
4. Employee data points that **are enabled **include avatar, company, employee number, employment status, first name, last name, groups, hire date, start date, team, termination date, work email, personal email, manager.
   - These data points are specific to the employment journey of the individual.
   - Personal email addresses are captured to support mapping personnel to their profiles sourced from other integrations where personal emails are used (such as background check provider and version control profiles).
   - Personal email addresses are not displayed in the user’s profile within Drata.
5. The **disabled **data points include employee social security number, date of birth, ethnicity, gender, home location, marital status, phone number, pay group and work location. These data points are never requested from the HRIS system and never reach Drata’s systems and are therefore never stored or utilized by Drata.

### How does Drata store customer data?

Drata uses single-tenant database architecture, where each customer has their own private database (tenant) within that server, totally isolated from other customer data.

Each customer database is essentially its own universe and will not be mixed with other customer data.

### What does Drata use the employee data pulled from the HRIS system for?

1. Drata maps the personnel records from the identity provider connection to the employee records from the HRIS system. The HRIS data is the source of truth for start date, separation date, and employment status. Any changes to these values should originate in the connected HRIS.
2. Incorporating employee data from the HRIS system adds vital employment details for evaluating the employees’ security and compliance. The HRIS connection establishes who the in-scope personnel are for the purposes of an audit and a potential random sample selection by the auditor.
3. For example, hire date and termination date are key to identify current vs. terminated employees.
   - Current employment statuses establish who needs to be monitored for onboarding and app access.
   - Former employment statuses enable the system to track those that have left the company and check for completed off-board processes.
4. Drata will automatically map HRIS records to IdP records based on matching emails or standalone first and last name. In the event a match cannot be made, Drata will mark these records with an employment status of “Unknown” on the Drata Personnel page.

Source: [Drata Help Article](https://help.drata.com/en/articles/13216678-drata-hris-data)

## HRIS Implementation Options

## Good → Utilizing IDP only

Without an HRIS connection, Drata relies on IdP account activation and deactivation dates as the employee’s start and separation dates. These dates are used to infer employment status as either Current or Former. If IdP activation or deactivation dates differ from official HR records, hire and termination dates may require manual adjustment.

There are six employment statuses in Drata:

1. Current Employee
2. Former Employee
3. Current Contractor
4. Former Contractor
5. Out of Scope
6. Unknown

Note: Contractor employment status is not inferred automatically and must be updated manually.

When you only have your IdP connected, Drata imports everyone as a current employee, unless the email is an obvious alias (admin@, marketing@, info@, etc.). Drata will then rely on the deactivation dates from the IDP to determine if users are **former**.

Source: [Drata Help Article](https://help.drata.com/en/articles/13216678-drata-hris-data)

## Better → Utilizing Drata API

Utilize the Drata API to update Personnel via endpoints. Update a single Personnel record by adding and updating attributes to the established IDP personnel record/object. These values include `startedAt`, `separatedAt`, `employmentStatus` and custom fields.

Note: Once fields are manually updated, automatic updates from identity providers (IDP) and HRIS systems will be ignored for those fields. Use the resync endpoint to restore automatic updates.

Source: [Drata API](https://developers.drata.com/openapi/reference/v2/tag/Personnel/#tag/Personnel/operation/PersonnelPublicV2Controller_modifyPerson)

### API Development / Integration Engineering

You will build and maintain services or scripts that:

- Pull evidence from Workday.
- Transform your source data into agreed Drata JSON schemas.’
- Send evidence to Drata via the Personnel endpoints.
- Maintain integrations over time as schemas and source tools evolve.

## Best → Utilizing Workday Connection

The IdP connection is the only required connection on Drata, which will pull in your personnel and allow them to authenticate into their[My Drata](https://help.drata.com/en/articles/4836250-employee-onboarding) page. The HRIS connection will enrich the personnel records with audit-ready "source of truth" data to better paint a picture of your personnel during your audit period. The attributes utilized are an employee or contractor's name, start/separation date, and employment status.  Merge is translating the customer’s data regardless of HRIS tool into a consistent format, or “Common Model”, for us (Drata) to read via our API connection.

This connection requires a Workday administrator to set up an Integration System User (ISU) and an Integration System Security Group (Unconstrained). Utilizing both Soap and a 3rd party middleware Merge.

### Enabled Values in Merge

Employee data points that are enabled in Merge: include avatar, company, employee number, employment status, first name, last name, hire date, start date, team, termination date, work email, personal email. These data points are specific to the employment journey of the individual.

### Disabled Values in Merge

The disabled data points include employee social security number, date of birth, ethnicity, gender, home location, marital status, phone number, pay group and work location. These data points never reach Drata’s system and are therefore never stored or utilized by Drata.

## Field Mappings for Drata <> Merge

Please see below for the fields Merge is pulling from Workday and how they map to Drata’s personnel fields.

- If the row is empty or with a dash, Drata is not utilizing or pulling that attribute from Workday or Merge.
- Items marked with an * are optional for Drata personnel records.

| **Merge** | **Drata** |
|---|---|
| first_name | First Name |
| last_name | Last Name |
| work_email | Work Email |
| Avatar Image | Avatar Image* |
| Job_title | Job Title* |
| Start_date | Start Date |
| Termination_date | Termination Date |
| Employment_status | Employment Status |
| Employee Number | - |
| Personal Email | *Internal value for User Record* |
| Display_full_name | - |
| manager | Manager* |
| id | *Internal ID for User Record* |

### Permissions

| **Permission / Scope** | **Why It’s Needed** | **Data Accessed (Read Only)** |
|---|---|---|
| Worker Data: Public Worker Reports | Minimum required HRIS visibility | Worker identifiers |
| Worker Data: Employment Data | Determine hire and termination dates | Hire date, termination date, status |
| Worker Data: Current Staffing Information | Determine current employment state | Active/inactive status |
| Worker Data: Workers | Retrieve personnel records | Worker metadata |
| Worker Data: All Positions | Retrieve job and position details | Job title, position |
| Worker Data: Organization Information | Surface org hierarchy | Department, manager |
| Person Data domains | Retrieve identity and contact details | Name, work email |

Source: [Drata Help Article](workday-integration-guide-hris.md#h_8cb9f3f8a9)

**Functional Areas:**

- Person Data: Personal Data

- Person Data: Work Contact Information

- Person Data: Private Work Email Integration

- This is required to surface work email of Employees if private

- Person Data: Public Work Email Address Integration

- This is required to surface work email of Employees

- Worker Data: Workers

- Worker Data: All Positions

- Worker Data: Public Worker Reports

- Worker Data: Employment Data

- Worker Data: Organization Information

- Worker Data: Current Staffing Information

## Subdomain Specific Permissions

Drilled down SOAP permissions used in conjunction with the high level domain security policy permissions.

| **Data (* required)** | **Parent Domain** | **Subdomain** |  |
|---|---|---|---|
| start_date* | Worker_Data: Employment_Data | wd:Worker_Data.wd:Employment_Data.wd:Worker_Status_Data.wd:First_Day_of_Work |  |
| id | Worker_Data:Worker_Reference | Worker_Data.wd:Worker_Reference.wd:ID [WID] |  |
| personal_email | Person Data: Home Email | - wd:Worker/wd:Worker_Data/wd:Personal_Data/wd:Contact_Data/<br>- wd:Email_Address_Data |  |
| work_email* | Worker_Data: Person_Data | Worker_Data.wd:Personal_Data.wd:Contact_Data.wd:Email_Address_Data |  |
| display_full_name | Worker_Data: Personal_Data | Worker_Data.wd:Personal_Data.wd:Name_Data.wd:Preferred_Name_Data.wd:Name_Detail_Data.@wd:Formatted_Name |  |
| first_name* | Worker_Data: Personal_Data | Worker_Data.wd:Personal_Data.wd:Name_Data.wd:Preferred_Name_Data.wd:Name_Detail_Data.wd:First_Name |  |
| last_name* | Worker_Data: Personal_Data | Worker_Data.wd:Personal_Data.wd:Name_Data.wd:Preferred_Name_Data.wd:Name_Detail_Data.wd:Last_Name |  |
| termination_date* | Worker_Data: Employment_Data | Worker_Data.wd:Employment_Data.wd:Worker_Status_Data.wd:Termination_Date |  |
| manager | Worker_Data: Employment_Data | Worker_Data.wd:Employment_Data.wd:Worker_Job_Data.wd:Position_Data.wd:Manager_as_of_last_detected_manager_change_Reference |  |
| employment_status* | Worker Data: Employment Data | Worker_Status_Data → Worker_Status_Reference/@wd:Descriptor |  |
| job_title | Worker Data: Employment Data | Worker_Data.wd:Employment_Data.wd:Worker_Job_Data.wd:Position_Data.wd:Position_Title |  |
| employment_type* | Worker_Data:Worker_Reference | Worker_Status_Data → Worker_Type_Reference/@wd:Descriptor |  |
| group.name | Worker Data: Organization Information | wd:Organization_Data.wd:Organization_Name |  |
| group.type | Worker Data: Organization Information | wd:Organization_Data.wd:Organization_Type_Reference.@wd:Descriptor |  |

## What Drata Provides vs. What You Build

### Drata Provides

Drata supplies the platform capabilities required for ingestion and monitoring:

- **Personnel endpoints** hosted by Drata accepting structured JSON.
- **Auth + endpoint setup support** (guidance on payload format and validation).
- **General guidance** for schema design and test creation.

### Your Development Responsibilities

Drata does not provide host-side collectors, prebuilt scripts, or on-prem packages. Your team may need to build and support:

- **Extraction logic** from your target systems* if needed* (proprietary, or on-prem environments).
- **Transformation layer** to normalize outputs into JSON *if needed* (proprietary, or on-prem environments).
- **Automation/orchestration** for scheduled or event-based submissions.
- **Ongoing maintenance** as APIs, schemas, auth methods, and tools evolve.
- **Webhook receiver configuration and middleware** in your tools.

![image 01](../../images/not-product/workday-implementation-best-practices--01.png)

## Engagement Expectations & Deliverables

Your team should plan to deliver:

### Discovery & Design

- Evidence requirements and target system inventory.
- Proposed JSON schemas per resource type.
- Extraction approach per system (API, export, CLI, DB, logs, agent).

### Implementation

- Collector/middleware code or low-code flows.
- Automated delivery to Drata.
- Sample payloads validated in Drata.

### Operations Handoff

- Runbook (monitoring, secret rotation, schema updates, troubleshooting).
- Ownership + maintenance plan.
- Known limitations and backlog.

![image 02](../../images/not-product/workday-implementation-best-practices--01.png)

## Drata Responsibilities

Drata supports your team by providing platform capabilities, enablement, and validation.

### Platform & Feature Enablement

Drata provides:

- Data-hosted endpoints for POSTing structured JSON evidence.
- Schema definition interface.

### Schema & Payload Guidance

Drata will guide you on:

- Recommended JSON structure patterns.
- Aligning schema to monitoring intent and audit expectations.
- Structuring identifiers and relationships for testing.
- Required vs optional fields, data types, nesting.
- Payload size and batching considerations.

### Endpoint Setup & Authentication Support

Drata supports:

- Credential generation/management.
- Secure authentication patterns.
- Validation of first successful submissions.

### Validation & Troubleshooting (Drata Side Only)

Drata will:

- Validate sample payloads for schema match and ingestion success.
- Troubleshoot Drata platform issues tied to:
   - Endpoint behavior
   - Ingestion errors originating in Drata

**Note:** Drata can help diagnose ingestion and schema alignment using payloads you provide but does not debug or maintain customer-side extraction/automation beyond high-level guidance.

### Boundaries of Drata Support

Drata will not:

- Build/maintain your extraction logic (collectors, scripts, agents, ETL).
- Provide custom on-prem scripts/packages.
- Configure your third-party tools or webhook receivers.
- Operate or monitor your automation pipelines.

## Images

- [image 01] ../../images/not-product/workday-implementation-best-practices--01.png
- [image 02] ../../images/not-product/workday-implementation-best-practices--01.png

## Related articles

- [Populating and Managing Personnel Data in Drata (Concept Guide)](populating-and-managing-personnel-data-in-drata-concept-guide.md)
- [Connect your HRIS to Drata](connect-your-hris-to-drata.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)
- [Troubleshoot employment status issues in Drata](troubleshoot-employment-status-issues-in-drata.md)
- [Troubleshooting Identity Sync Issues in Drata](troubleshooting-identity-sync-issues-in-drata.md)
