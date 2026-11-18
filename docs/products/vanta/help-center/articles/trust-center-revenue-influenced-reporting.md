# Trust Center Revenue Influenced Reporting

Source: https://help.vanta.com/en/articles/11345466-trust-center-revenue-influenced-reporting
Collection: Trust Management ; Trust Management › Customer Trust ; Trust Management › Customer Trust › Trust Center Integrations
Fetched: 2026-11-17

## Article text

Feature availability: This article discusses Advanced Trust Center features, which may require an upgrade or add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
With the Vanta and Salesforce (SFDC) integration, Trust Center admins can report to their stakeholders the value that Trust Center brings for revenue impact.
Please note that to leverage revenue influence reporting, you must first have the Saleforce integration <https://help.vanta.com/en/articles/11345449> connected
 

## Enabling Revenue Tracking
- 
In your account header, click the Settings icon
- 
In the Settings page menu, scroll to the Features section, select Customer trust, and go to the Trust Center tab
- 
Scroll to the Configure Revenue Tracking section of the page
- 
Ensure that Track Revenue Influence is toggled on
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771709/687d8f118180adc792abf52bc269/27524469844884?expires=1794967200&signature=74a66a1a4e604f2b524929c642d0d85e92bf5b541727185cfc005e22818cb026&req=dSUmEM55nIZfUPMW1HO4zZgVC%2BFRNgJGDHd7zRAt2SQT89i5IeoredcGtf4j%0Aqho5mBkZQ27J1wIRJyA%3D%0A>
 

## Mapping Salesforce Fields to Revenue Tracking Reports
- 
In your account header, click the Settings icon
- 
In the Settings page menu, scroll to the Features section, select Customer trust, and go to the Trust Center tab
- 
Select Edit from the Configure revenue tracking section of the Trust Center settings page
- 
Map the categories to their respective Salesforce fields
- 
• Revenue: Opportunity.amount (default) or any currency type field.*
- 
Deal Stage: Opportunity.stageName (default) or any custom list with string as list item value
- 
Customer Type: Account.type (default) or any custom list with string as list item value
- 
Customer Name: Account.name or any string value field
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771707/f22ef9f18742823f4d0edca0d8e0/24809282680468?expires=1794967200&signature=09ede06c1f1879f62b8ee52cbfa406c304144b5f8b94e9043a0dd66ac4e36e99&req=dSUmEM55nIZfXvMW1HO4zS%2FmRy7rokrNeJV9fk7P8LMkcxVaOFiBqJdJ0Q8t%0AvwR0brd4Fga%2FMWM5iqY%3D%0A>
- 
Select Save
 

## Convert revenue in multiple currencies
If you track revenue in more than one currency, first convert all values to a single currency in Salesforce, then select that converted field as your Revenue field. For details on how Salesforce handles multiple currencies and how to use the DatedConversionRate object, see Salesforce’s documentation on multiple currencies <https://help.salesforce.com/s/articleView?id=sales.admin_enable_multicurrency.htm&type=5> and DatedConversionRate <https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_datedconversionrate.htm>.
- 
In your account header, click the Settings icon
- 
In the Settings page menu, scroll to the Features section, select Customer trust, and go to the Trust Center tab
- 
Toggle on Enable revenue-influenced reporting
- 
Select your Revenue field from the list of Salesforce fields
- 
Convert revenue in multiple currencies (see above)
- 
Save your changes
 
 

## Viewing Influenced Revenue
- 
From the left-hand navigation panel, select Customer Trust
- 
From the Trust Center page, select the Activity tab, followed by Revenue Influenced
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2113090763/e2684344f38d13eaddcc7bca6097/image.png?expires=1794967200&signature=6855bba3cd457fb3c1b3655af420607a52e793c30b85e55dbec14d1c7ec78c6b&req=diEmFcl3nYZZWvMW1HO4zQQcRQhQdGCUKrpdaXl8n6ilG6qXDseqy%2FenWnic%0AUSWm58gmGgm%2FpTeuXyA%3D%0A>
- 
Trust Center user activity is related to corresponding Salesforce accounts and opportunities and is presented in the total revenue influenced chart.
- 
This information can also be viewed from the Overview tab through the Total revenue influenced chart.
- 
The Revenue influenced chart will include any Salesforce opportunities that match a specific set of conditions:
- 
The Trust Center viewer's contact was created and associated to an account before they viewed the trust center
- 
There is a Trust Center viewer associated with the opportunity who viewed the Trust Center. 
- 
The Salesforce opportunity is closed as a won, and is closed after the first instance of associated viewer activity
**Note**
- 
All subsequent opportunities attached to the Trust Center viewer contact will be attributed as influenced revenue

## Images

- [image 01] ../../images/ux/trust-center/trust-center-revenue-influenced-reporting--01.png
- [image 02] ../../images/ux/trust-center/trust-center-revenue-influenced-reporting--02.png
- [image 03] ../../images/ux/trust-center/trust-center-revenue-influenced-reporting--03.png
