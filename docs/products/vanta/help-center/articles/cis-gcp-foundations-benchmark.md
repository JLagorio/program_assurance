# CIS GCP Foundations Benchmark

Source: https://help.vanta.com/en/articles/11647393-cis-gcp-foundations-benchmark
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Vanta now offers full out-of-the-box support for the CIS Google Cloud Platform (GCP) Foundations Benchmarks, providing a more seamless experience for maintaining compliance and monitoring your cloud infrastructure. With comprehensive mapping of all relevant CIS controls to automated tests and manual checks, Vanta continuously monitors your GCP environment for deviations, providing real-time visibility into your compliance posture. Each failing control includes step-by-step remediation instructions, best practices, and links to official Google Cloud documentation, helping you take immediate action. You can also export detailed, audit-ready reports to streamline reviews and demonstrate compliance with confidence.
 

## CIS GCP Foundations Benchmark
Identity and Access Management
- 
Ensure that Corporate Login Credentials are Used
- 
Ensure that Multi-Factor Authentication is 'Enabled' for All Non-Service Accounts
- 
Ensure that Security Key Enforcement is Enabled for All Admin Accounts
- 
Ensure That There Are Only GCP-Managed Service Account Keys for Each Service Account
- 
Ensure That Service Account Has No Admin Privileges
- 
Ensure That IAM Users Are Not Assigned the Service Account User or Service Account Token Creator Roles at Project Level
- 
Ensure User-Managed/External Keys for Service Accounts Are Rotated Every 90 Days or Fewer
- 
Ensure That Separation of Duties Is Enforced While Assigning Service Account Related Roles to Users
- 
Ensure That Cloud KMS Cryptokeys Are Not Anonymously or Publicly Accessible
- 
Ensure KMS Encryption Keys Are Rotated Within a Period of 90 Days
- 
Ensure That Separation of Duties Is Enforced While Assigning KMS Related Roles to Users
- 
Ensure API Keys Only Exist for Active Services
- 
Ensure API Keys Are Restricted To Use by Only Specified Hosts and Apps
- 
Ensure API Keys Are Restricted to Only APIs That Application Needs Access
- 
Ensure API Keys Are Rotated Every 90 Days
- 
Ensure Essential Contacts is Configured for Organization
- 
Ensure Secrets are Not Stored in Cloud Functions Environment Variables by Using Secret Manager
Logging and Monitoring
- 
Ensure That Cloud Audit Logging Is Configured Properly
- 
Ensure That Sinks Are Configured for All Log Entries
- 
Ensure That Retention Policies on Cloud Storage Buckets Used for Exporting Logs Are Configured Using Bucket Lock
- 
Ensure Log Metric Filter and Alerts Exist for Project Ownership Assignments/Changes
- 
Ensure That the Log Metric Filter and Alerts Exist for Audit Configuration Changes
- 
Ensure That the Log Metric Filter and Alerts Exist for Custom Role Changes
- 
Ensure That the Log Metric Filter and Alerts Exist for VPC Network Firewall Rule Changes
- 
Ensure That the Log Metric Filter and Alerts Exist for VPC Network Route Changes
- 
Ensure That the Log Metric Filter and Alerts Exist for VPC Network Changes
- 
Ensure That the Log Metric Filter and Alerts Exist for Cloud Storage IAM Permission Changes
- 
Ensure That the Log Metric Filter and Alerts Exist for SQL Instance Configuration Changes
- 
Ensure That Cloud DNS Logging Is Enabled for All VPC Networks
- 
Ensure Cloud Asset Inventory Is Enabled
- 
Ensure 'Access Transparency' is 'Enabled'
- 
Ensure 'Access Approval' is 'Enabled'
- 
Ensure Logging is enabled for HTTP(S) Load Balancer
Networking
- 
Ensure That the Default Network Does Not Exist in a Project
- 
Ensure Legacy Networks Do Not Exist for Older Projects
- 
Ensure That DNSSEC Is Enabled for Cloud DNS
- 
Ensure That RSASHA1 Is Not Used for the Key-Signing Key in Cloud DNS DNSSEC
- 
Ensure That RSASHA1 Is Not Used for the Zone-Signing Key in Cloud DNS DNSSEC
- 
Ensure That SSH Access Is Restricted From the Internet
- 
Ensure That RDP Access Is Restricted From the Internet
- 
Ensure that VPC Flow Logs is Enabled for Every Subnet in a VPC Network
- 
Ensure No HTTPS or SSL Proxy Load Balancers Permit SSL Policies With Weak Cipher Suites
- 
Use Identity Aware Proxy (IAP) to Ensure Only Traffic From Google IP Addresses are 'Allowed'
Virtual Machines
- 
Ensure That Instances Are Not Configured To Use the Default Service Account
- 
Ensure That Instances Are Not Configured To Use the Default Service Account With Full Access to All Cloud APIs
- 
Ensure “Block Project-Wide SSH Keys” Is Enabled for VM Instances
- 
Ensure Oslogin Is Enabled for a Project
- 
Ensure ‘Enable Connecting to Serial Ports’ Is Not Enabled for VM Instance
- 
Ensure That IP Forwarding Is Not Enabled on Instances
- 
Ensure VM Disks for Critical VMs Are Encrypted With Customer-Supplied Encryption Keys (CSEK)
- 
Ensure Compute Instances Are Launched With Shielded VM Enabled
- 
Ensure That Compute Instances Do Not Have Public IP Addresses
- 
Ensure That App Engine Applications Enforce HTTPS Connections
- 
Ensure That Compute Instances Have Confidential Computing Enabled
- 
Ensure the Latest Operating System Updates Are Installed On Your Virtual Machines in All Projects
Storage
- 
Ensure That Cloud Storage Bucket Is Not Anonymously or Publicly Accessible
- 
Ensure That Cloud Storage Buckets Have Uniform Bucket-Level Access Enabled
Cloud SQL Database Services
- 
Ensure That the Cloud SQL Database Instance Requires All Incoming Connections To Use SSL
- 
Ensure That Cloud SQL Database Instances Do Not Implicitly Whitelist All Public IP Addresses
- 
Ensure That Cloud SQL Database Instances Do Not Have Public IPs
- 
Ensure That Cloud SQL Database Instances Are Configured With Automated Backups
MySQL Database
- 
Ensure That a MySQL Database Instance Does Not Allow Anyone To Connect With Administrative Privileges
- 
Ensure ‘Skip_show_database’ Database Flag for Cloud SQL MySQL Instance Is Set to ‘On’
- 
Ensure That the ‘Local_infile’ Database Flag for a Cloud SQL MySQL Instance Is Set to ‘Off’
PostgreSQL Database
- 
Ensure ‘Log_error_verbosity’ Database Flag for Cloud SQL PostgreSQL Instance Is Set to ‘DEFAULT’ or Stricter
- 
Ensure That the ‘Log_connections’ Database Flag for Cloud SQL PostgreSQL Instance Is Set to ‘On’
- 
Ensure That the ‘Log_disconnections’ Database Flag for Cloud SQL PostgreSQL Instance Is Set to ‘On’
- 
Ensure ‘Log_statement’ Database Flag for Cloud SQL PostgreSQL Instance Is Set Appropriately
- 
Ensure that the ‘Log_min_messages’ Flag for a Cloud SQL PostgreSQL Instance is set at minimum to 'Warning'
- 
Ensure ‘Log_min_error_statement’ Database Flag for Cloud SQL PostgreSQL Instance Is Set to ‘Error’ or Stricter
- 
Ensure That the ‘Log_min_duration_statement’ Database Flag for Cloud SQL PostgreSQL Instance Is Set to '-1' (Disabled)
- 
Ensure That 'cloudsql.enable_pgaudit' Database Flag for each Cloud Sql Postgresql Instance Is Set to 'on' For Centralized Logging
SQL Server
- 
Ensure 'external scripts enabled' database flag for Cloud SQL SQL Server instance is set to 'off'
- 
Ensure that the 'cross db ownership chaining' database flag for Cloud SQL SQL Server instance is set to 'off'
- 
Ensure 'user Connections' Database Flag for Cloud Sql Sql Server Instance Is Set to a Non-limiting Value
- 
Ensure 'user options' database flag for Cloud SQL SQL Server instance is not configured
- 
Ensure 'remote access' database flag for Cloud SQL SQL Server instance is set to 'off'
- 
Ensure '3625 (trace flag)' database flag for all Cloud SQL Server instances is set to 'on'
- 
Ensure that the 'contained database authentication' database flag for Cloud SQL on the SQL Server instance is not set to 'on'
BigQuery
- 
Ensure That BigQuery Datasets Are Not Anonymously or Publicly Accessible
- 
Ensure That All BigQuery Tables Are Encrypted With Customer-Managed Encryption Key (CMEK)
- 
Ensure That a Default Customer-Managed Encryption Key (CMEK) Is Specified for All BigQuery Data Sets
- 
Ensure all data in BigQuery has been classified
Dataproc
- 
Ensure that Dataproc Cluster is encrypted using Customer-Managed Encryption Key

## Images

- none
