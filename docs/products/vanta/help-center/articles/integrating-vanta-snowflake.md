# Integrating Vanta & Snowflake

Source: https://help.vanta.com/en/articles/11345629-integrating-vanta-snowflake
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Snowflake is a fully managed SaaS that provides a single platform for data warehousing, data lakes, data engineering, data science, data application development, and secure sharing and consumption of real-time / shared data. Snowflake features out-of-the-box features like separation of storage and compute, on-the-fly scalable compute, encryption, data sharing, data backups, data cloning, etc.

## Why Snowflake to Vanta integration?
- 
Admins can see who has access to Snowflake on the Access page and satisfy controls around access management. Also, Vanta will remind you to remove access when an employee leaves your company.
- 
Admins can see all the databases on the Inventory page and centralize the asset management in Vanta which is critical for the security and compliance program.

## Connecting Snowflake & Vanta
- 
In Vanta, go to the Integrations page, click Add integration, and search for Snowflake. For help navigating the Integrations page, see Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
After clicking Connect Snowflake, you will be prompted to enter Account URL and Default Warehouse name.
- 
Account URL is in the following format:
- 
https://<orgname>-<account_name>.snowflakecomputing.com <https://<orgname>-<account_name>.snowflakecomputing.com>
- 
To get the <orgname>-<account_name>, you can run the following SQL command in your SQL Worksheet:
- SELECT CURRENT_ORGANIZATION_NAME() || '-' || CURRENT_ACCOUNT_NAME();
- 
Default warehouse is the name of any warehouse available on the Warehouse page in Snowflake.
- 
You will only need to add 1 default Warehouse to Vanta. Vanta will then be able to pull in any relevant Databases and Users from that instance.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764479/a72f213225a289b47af8bf80981c/fa194ece-586d-4512-870d-6e8e29dfc758?expires=1794967200&signature=ff69e485561f0228f1e18894ff6c8f5c63501f899f099251fa189d546cc38bc0&req=dSUmEM54mYVYUPMW1HO4zRqCjqLFAGd3A7QjRKM2aIPKE6fkUoAjra5G8xIx%0AHXb6%2FFZ44JTcmnHwpbM%3D%0A>
- 
After clicking Connect Snowflake you will be prompted to copy a snippet. Paste it on a new worksheet in Snowflake, highlight it all and run the query.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764475/b63fe0d821f5bdf150ae8b28a0fc/34225839644308?expires=1794967200&signature=6d4899f9d52d932e617edcf575d2907f0a295a1a56d816fbe2312fca3d9f9f0d&req=dSUmEM54mYVYXPMW1HO4zfBODwzmjnK5OHVVz1QSsgdr5JBiXgXEi55w6nMS%0Ai5%2B27Gdspu7qcvCeEKs%3D%0A>
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764472/51e8e434776b8c61805792507059/34225849594132?expires=1794967200&signature=edd875804802eb1ce9bf36fa9d03391ee4d9008473badaf75e00751f8a9a0e38&req=dSUmEM54mYVYW%2FMW1HO4zZ81zyF%2FSfKO3KE5zuDgl367Wfagl2ASi1P8bZ8y%0A%2Fg0WWEjUMBqx67j27us%3D%0A>
- 
Upon successful query execution in Snowflake, click “Activate Connection” on this page in Vanta. This should complete the setup flow.
- 
Once the connection is complete, you can click on Configure Scope to configure the scope of databases you want to pull into Vanta. Ex: if you mark staging resources out of scope and it wouldn't show up in Vanta on the inventory page:
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764490/513377668a81ea2948143eb9a627/24324720591124?expires=1794967200&signature=7bdcfe3174129f1ad190016f5c2802cdd36d220c0a7c31134333fc1c666d05a5&req=dSUmEM54mYVWWfMW1HO4zZr8xaqQYyAxyMJg7oRvAB4KIK7BdIpLS%2FxHoD9M%0AhBUzid6brS7YEPwLgeU%3D%0A>
- 
Upon successful connection, verify access, inventory, and test pages.

## Access Page
You can view all the users who have access to Snowflake on the Access Page and a list of all databases on the Inventory Page in Vanta.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764494/b95f35d1dd05304aef470a89ae07/34225839652372?expires=1794967200&signature=ad495099df254cd56ea732cc9e9ac130bed7944077b3ea9bea383dd7b0cad061&req=dSUmEM54mYVWXfMW1HO4ze537f5GpVhgwNIl6NMCaZLRgGmSmRMV9mLlzKha%0AruawCgyePrk5tnYleMs%3D%0A>

## Inventory Page
You can view all the databases on the Inventory Page here <https://app.vanta.com/inventory#data-warehouse>:
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764491/f2c7277f7e0352ba51ded0e2d8e1/24324750528020?expires=1794967200&signature=e48ea73d22b49787ef28f8680180aa0ef4fb91b0e0fbe74654765c232f9bfd0c&req=dSUmEM54mYVWWPMW1HO4zTmJUa888bbztDlv4Gx6xOu5ssjZRoLdOaxCPj2m%0AU%2BVyvvmNQD79G3PVGBU%3D%0A>

## Tests page
On the tests page <https://app.vanta.com/tests>, you can see the following tests
- 
Snowflake accounts associated with users
- 
MFA on Snowflake
- 
Snowflake accounts are de-provisioned when employees leave
We didn’t write tests for the following configs as they are set out-of-the-box in Snowflake without the ability to turn them off.
- 
Data is encrypted at rest or in transit
- 
Backups are enabled
- 
Snowflake implements this via Timetravel. The default is 1 Day.
- 
Storage autoscaling is on
- 
Compute autoscaling is on
Can we connect multiple Snowflake accounts?
- 
 
- 
Yes, you can add additional accounts by selecting Manage>Edit for the integration and selecting Add Warehouse:
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764500/e818186cc4501a469000cc76fa59/24324720603796?expires=1794967200&signature=269af2e484b0acb24eb70c6790ac3c39d884806ad7d13ad32f395150a33206cb&req=dSUmEM54mYRfWfMW1HO4zZHwmO3eIzp6F2HpiO4E55KDdZWO42DyF6iC3Ku0%0ApsbrBJVYHIbkCWW7g68%3D%0A>

## Images

- [image 01] ../../images/integrations/snowflake/integrating-vanta-snowflake--01.png
- [image 02] ../../images/ux/integrations/integrating-vanta-snowflake--02.png
- [image 03] ../../images/integrations/snowflake/integrating-vanta-snowflake--03.png
- [image 04] ../../images/ux/integrations/integrating-vanta-snowflake--04.png
- [image 05] ../../images/ux/access/integrating-vanta-snowflake--05.png
- [image 06] ../../images/ux/inventory/integrating-vanta-snowflake--06.png
- [image 07] ../../images/ux/integrations/integrating-vanta-snowflake--07.png
