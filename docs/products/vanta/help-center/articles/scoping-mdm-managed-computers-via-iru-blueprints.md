# Scoping MDM Managed Computers via Iru Blueprints

Source: https://help.vanta.com/en/articles/11345782-scoping-mdm-managed-computers-via-iru-blueprints
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Endpoint and Device Management (MDM)
Fetched: 2026-11-17

## Article text

You can choose which Iru (formerly Kandji) devices Vanta monitors by excluding the Blueprints they belong to. How you do this depends on when you connected Iru. 
 
If your setup includes a Set sync filters step, follow the steps under New connections. If you connected earlier and your setup looks different, follow the steps under Existing connections.
 

## New connections
When you connect Iru, you can exclude devices in specific Blueprints before the first sync. For example, you can exclude test or lab fleets.
- 
Create your Iru API token with the optional List Blueprints permission. For the full list of permissions, see Connecting Vanta & Iru <https://help.vanta.com/en/articles/11345787-connecting-vanta-iru>.
- 
In Vanta, go to the Integrations page, click Add integration, search for Iru, and click Connect. Follow the setup steps until you reach Set sync filters.
- 
Select Exclude devices in selected Blueprints.
- 
In Blueprints to exclude, choose one or more Blueprints. Once the checkbox is selected, you must choose at least one Blueprint.
- 
Complete setup.
We remove devices in the selected Blueprints from your Computers list on the next sync without changing anything in Iru. Exclusions are saved by Blueprint ID, so renaming a Blueprint in Iru does not change them.
 
For new connections, you set Blueprint exclusions in the Set sync filters step, not in the Configure Scope modal.
⚠️ Note: This option requires the List Blueprints permission on your API token. Without it, we show a message instead of the Blueprint picker and sync every device. To use this option, include List Blueprints when you create your token. If you remove the permission later, your saved exclusions keep applying, but you cannot view, change, or turn them off until you add the permission back.
 
 

## Existing connections
If you connected Iru before the updated setup was available, follow these steps.
 
If you want to scope Iru (formerly Kandji)-managed computers by which blueprints they belong to, First go to your Integrations <https://app.vanta.com/integrations> page. Find your Iru connection under the Mobile Device Management Tools section, and click Configure Scope
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764141/fdfa018dcc84123eb5bd3c687638/8476503366676?expires=1794967200&signature=e84dfe8e7f3a4e10f7547fa6515a39cb32199d1c1ea69d7d3b96d4a1b3b305b1&req=dSUmEM54mYBbWPMW1HO4zQh%2BQ5Oj4yqIaoM2WkMpdp7HC0kfrgLxtpoay2c0%0AcXKKzTALZrSHo3OSEK4%3D%0A>
- 
Inside the modal, enable the toggle
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764116/984cbd1d90465c33d917074d3055/s_26B74F69F30523DA52277C6A2C67BB2BD009B56880BFCFAE84CA8A511AFFA9FE_1659991079137_image.png-?expires=1794967200&signature=c2e0c2839a81f1d109b3d8e18f1a09ff07813a9cf7091a4e5218f56f811c807d&req=dSUmEM54mYBeX%2FMW1HO4zST05SEUt7r1aVGon7niYUSi5p1YuAiUDeCQcurX%0ASqewKB059pP1SrBiv5k%3D%0A>
- 
You can then see a list of Iru blueprints and the list of devices Vanta detects for each blueprint:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516764124/92153c5bbc1fe5c7cdf7e4e2722e/s_26B74F69F30523DA52277C6A2C67BB2BD009B56880BFCFAE84CA8A511AFFA9FE_1659991101374_image.png-?expires=1794967200&signature=d6c58513742b39c898123a0191db7d6394c0709afa744b4581e1fbb4fce89aec&req=dSUmEM54mYBdXfMW1HO4zdfXtPcfJlk3W1Rz5viG5M8uF2vry05hYvA2GSvu%0A7kxr5evSG1O33zN23yQ%3D%0A>
- 
Disable the blueprints that should be out-of-scope. After Vanta refreshes its data on these devices from Iru, only devices that belong to in-scope blueprints will be monitored in Vanta. Please note: This may take a few minutes or up to an hour.

## Images

- [image 01] ../../images/ux/integrations/scoping-mdm-managed-computers-via-iru-blueprints--01.png
- [image 02] ../../images/ux/integrations/scoping-mdm-managed-computers-via-iru-blueprints--02.png
- [image 03] ../../images/ux/integrations/scoping-mdm-managed-computers-via-iru-blueprints--03.png
