# Connecting Vanta & Grafana

Source: https://help.vanta.com/en/articles/11345747-connecting-vanta-grafana
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Access and Additional Integrations
Fetched: 2026-11-17

## Article text

Vanta allows connecting both a Grafana Cloud Account and a Grafana Stack. You may need to connect both or just one, depending on your needs:
- 
Connect a Grafana Cloud Account to see who has access to Grafana on the Access page and satisfy controls around access management. Also, Vanta will remind you to remove access when an employee leaves your company
- 
Connect a Grafana stack to pull in alerts from Vanta and satisfy controls around monitoring
- 
Vanta does not currently support self-hosted Grafana

## Connecting Grafana
- 
In Vanta, go to the Integrations page, click Add integration, and search for Grafana. For help, see our guide to the Integrations Page <https://help.vanta.com/en/articles/11345761-integrations-page>.
- 
Click Connect.
- 
Choose the type of account you would like to connect
- 
Cloud Account: Use this option if you want to connect your cloud account to Vanta.
- 
Stack: Use this option if you want to connect to Vanta using a Service Account.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762603/7ae3a3fd322d957b4912c52f2703/15147236455316?expires=1794967200&signature=c16b2a0f8a40f14186094f778f6f870f00748ffa35abed6be62a73890aac9c62&req=dSUmEM54n4dfWvMW1HO4zarsuD%2FGIKspG%2FGZ3oq6lICYVMHQ%2FrKqoPwcXPns%0ADhcJ7CKtlP9JDhiygkA%3D%0A>
- 
Each account type has it's own set of connection requirements. Follow the instructions present to create the necessary API credentials or Service account tokens.

## Grafana Stack & Permissions
In order to connect to Grafana Stack, you will need to provide a service account. Depending on your Grafana license, Vanta will require the following permissions for this service account:
- 
If you have Grafana Cloud Advanced or Grafana Enterprise, the minimum permissions  <https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/custom-role-actions-scopes/>required are:
- alert.provisioning:read
- users:read
- 
If you do not have Grafana Cloud Advanced or Grafana Enterprise, the service account must have admin permissions.

## Can you connect multiple Grafana Cloud Accounts and Grafana Stack?
- 
You can only connect 1 Grafana Cloud Account and/or 1 Grafana Stack

## Images

- [image 01] ../../images/ux/integrations/connecting-vanta-grafana--01.png
