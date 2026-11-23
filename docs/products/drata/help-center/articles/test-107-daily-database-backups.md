# Test 107: Daily Database Backups

Source: https://help.drata.com/en/articles/4777050-test-107-daily-database-backups
Collection: Monitoring Test Guidance
Updated: 2026-08-05
Fetched: 2026-11-22
Description: Drata inspects your company backup configuration from its infrastructure provider to determine if the backup schedule is set to daily.

## Article text

**ASSOCIATED DRATA CONTROL**

This test is part of the **Daily Database Backups **control that ensures your company performs backups daily and retains them in accordance with a predefined schedule in their Backup Policy.

**WHAT TO DO IF A TEST FAILS**

If Drata finds that your databases have not been configured for automatic daily backups the test will fail. With a failed test you will receive a list of databases and corresponding backup configurations/scheduled outlining those that do not have daily backups set up.

To remediate a failed test you will need to update the database backup configuration and establish daily automated backups for the databases flagged.

**STEPS FOR PASSING**

To ensure a validated state when testing for daily backups, please follow the steps listed in the table below. Once the provider steps have been completed, navigate back to Drata and execute the test.

| **Provider / Technology** | **Provider Steps** |
|---|---|
| **Atlas - Projects** | For an M10+<br>1. Connect IDP and Atlas<br>2. Create a production-level cluster<br>   1. Enable Cloud Backup<br>      - If you enable "Continuous Cloud Backup" as well, you're done!<br>   2. If "Continuous Cloud Backup" is disabled, go to your backup policy and make sure you have at either an hourly or daily backup snapshot schedule<br>3. Save any changes |
| **AWS - RDS - Amazon Aurora, Amazon DocumentDB** | All of the clusters will pass by default as clusters must have a retention of 1 - so will pass the tests |
| **AWS - RDS - MySQL** | 1. Within AWS, go to the RDS service<br>2. Create a Database<br>3. Click on Additional configuration<br>   1. Click on Enable automatic backups<br>   2. Set a backup retention period more than 0 days<br>4. Save Database |
| **Azure - MySQL, Postgres, MSSQL, MariaDB, SQL Managed Instances** | Within Azure, all managed databases are backed up by default. |
| **Digital Ocean - Postgres, MySQL** | When you create a Managed DB, the wizard will choose a daily backup window for you by default. |
| **Digital Ocean - Redis** | Redis DBs do not support daily backups and will always fail this monitor. You will need to exclude these from the test. |
| **GCP - SQL** | 1. Within GCP, go to the SQL service<br>2. Create an instance<br>3. Click on a database engine<br>   1. Enter an Instance ID<br>   2. Set a password for the root user<br>   3. Select a region<br>   4. Select any zone<br>   5. Database version<br>   6. Click on Show configuration options<br>   7. Open the "Backups, recovery, and high availability"<br>      1. Make sure to click on Automate backups<br>   8. Open the "Machine type and storage"<br>   9. Select a machine size<br>   10. Disable the "Enable automatic storage increases"<br>4. Click on Create button |
| **Heroku** | This monitoring test currently only tests for `Heroku Postgres` pricing tier and not for a DB backup schedule. These schedules are not exposed over Heroku's API.<br>A database will fail if it is on the `hobby-dev` or `hobby-basic` tier. If the database is on the `standard`, `premium`, or `enterprise` tier, it should pass, because “Every professional tier Heroku Postgres database comes with a behind-the-scenes [Continuous Protection](https://devcenter.heroku.com/articles/heroku-postgres-data-safety-and-continuous-protection) mechanism for disaster recovery” (documented [here](https://devcenter.heroku.com/articles/heroku-postgres-backups)). |

## Related articles

- [Test 106: Has a Backup Policy](test-106-has-a-backup-policy.md)
- [Test 30: Availability Zones Used](test-30-availability-zones-used.md)
- [Test 112: Database CPU Monitored](test-112-database-cpu-monitored.md)
- [Test 113: Database Free Storage Space Monitored](test-113-database-free-storage-space-monitored.md)
- [Test 114: Database Read I/O Monitored](test-114-database-read-i-o-monitored.md)
