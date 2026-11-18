# Reconnecting your GCP integration

Source: https://help.vanta.com/en/articles/11346083-reconnecting-your-gcp-integration
Collection: Optimizing your Workflow ; Optimizing your Workflow › Frequently Asked Questions
Fetched: 2026-11-17

## Article text

Vanta has changed our GCP integration to reduce permissions, reduce required APIs, and streamline the GCP setup and scoping experience. Due to these changes, you will need to reconnect your GCP integration.
- 
To reconnect your GCP integration, navigate to the Integrations Page <https://app.vanta.com/integrations> and click the Reconnect button on the banner.
- 
Please do not delete your credentials, as it may cause loss of data.
There are changes to the cloud shell script we provide, please re-download the cloud shell script as part of the flow instead of using any existing one you may have!
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763126/ad8b32fb36bd6c309716ace0f530/15212926072084?expires=1794967200&signature=091b55dbd54f2ce19286acb945b9f40a9bb005ae7069bd1854e98ad6acadf654&req=dSUmEM54noBdX%2FMW1HO4zVkMiHPQkbIIevU0Otue%2BoQfv3wHD%2FU%2BTPj5qmCk%0ARMQoCWvW2brukKUwcwQ%3D%0A>
- 
If you are reconnecting individual GCP projects, click Add Project, and re-add all your existing projects.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763127/2c9c2679f06a49d0e8432524bcd2/15212961615124?expires=1794967200&signature=e899691f60b19752995d3e4211f42afe8864aed51e014df33727828440e6daf0&req=dSUmEM54noBdXvMW1HO4zfOXE7MvHM3IFx0BZau9OgKuCBd%2Fclxj8VOeUVXB%0AU91%2FH8k9jbIT2QDo%2B8E%3D%0A>
If reconnecting a GCP organization, you can simply follow the steps after clicking reconnect.
- 
With this change, you may see new resources being pulled into Vanta and, consequently, new monitors for those resources. If you are currently in an audit, please make sure to address the monitors before the due date, which is based on your organization’s SLAs.
- 
If you want to exclude these new resources from your audit, you may deactivate the related monitors and/or scope out those resources.
- 
To deactivate monitors, follow the steps in this help article <https://help.vanta.com/en/articles/11345420>.
- 
To scope out resources, follow the steps in this help article <https://help.vanta.com/en/articles/11346114>.

## Images

- [image 01] ../../images/ux/integrations/reconnecting-your-gcp-integration--01.png
- [image 02] ../../images/integrations/gcp/reconnecting-your-gcp-integration--02.png
