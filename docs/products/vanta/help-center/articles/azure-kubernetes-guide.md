# Azure Kubernetes Guide

Source: https://help.vanta.com/en/articles/11345694-azure-kubernetes-guide
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Vanta lists and can perform tests on Azure Kubernetes Service clusters and individual nodes, but this requires specific cluster configurations.
 

## How Does the Integration Work?
Azure Kubernetes Service clusters are listed by Vanta and shown in inventory. They don’t require additional configuration and act as any other Vanta resource. Vanta can also list Azure Kubernetes Service individual nodes, and several specific tests have been performed on them. Specific cluster settings are required so that the nodes can be listed. In the Vanta app, the listing of the nodes can be enabled or disabled by toggling the corresponding product. Clusters will always be listed regardless of this setting.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757567/e573532f74e6054e6be9b4671954/30068357702292?expires=1794967200&signature=db26d2ef20cbeacdbaf036e1acd90c46ee261cb8d2c6220f893fd7d9cbda2c9b&req=dSUmEM57moRZXvMW1HO4zUt3e9dcY5QsyArCTtMV8H1Rngldxi7Q7YldZPLg%0ACjOcQhP1VKdyApa%2Fg4A%3D%0A>

## Requirements to list Individual Kubernetes Nodes
Vanta’s servers perform Kubernetes API requests <https://kubernetes.io/docs/concepts/overview/kubernetes-api/> to a cluster’s control plane API to list individual Kubernetes nodes and get their configuration. There are some extra requirements for Vanta to be able to do so.
- 
Enable access to the cluster’s control plane API from the IP Vanta uses for its scanners.
- 
This requires that the cluster enables public access to its control plane API (in other words, it is not a private cluster <https://learn.microsoft.com/en-gb/azure/aks/private-clusters?tabs=azure-portal>). Node configuration scanning of private clusters is not supported in Vanta since their control API can only be accessed from within the cluster’s private network, rendering simple remote node configuration scanning impossible.
- 
To secure a cluster with public access to its control API, a CIDR range filter containing at least the Vanta IP range should be added to its control plane API networking restrictions.
- 
If the cluster is private, Vanta will skip listing its nodes. The cluster will be listed properly in Inventory, and no errors will appear in the Vanta app. The tests specific to Kubernetes nodes won’t apply to these clusters, and custom tests won’t be used either since the nodes are not listed for that cluster.
- 
Assign the 'Azure Kubernetes Service Cluster User Role' to the Application linked in Vanta.
- 
This is required to fetch the cluster certificate authority, which is required to list nodes and their configuration using the Kubernetes API. If this role is not assigned, a specific error will show in the Kubernetes nodes with the errors section in Inventory.
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757559/6f020affaeb173d9398798301087/30068357709588?expires=1794967200&signature=0ad023b1cff7d083e602aff4335b199f5add66fc512158125b2f7d0bdae33ce5&req=dSUmEM57moRaUPMW1HO4zZzFuRgdA4CsxHMzpGPvIXx%2BhmOalENT18dbLSL4%0AF9Qz6FmEHJm%2BY2gDJx0%3D%0A>
- 
Set the cluster to use Microsoft Entra ID for RBAC. This is needed so that the application linked in Vanta Azure credentials can be used to authenticate to the cluster control plane.
- 
Grant permissions in the cluster control plane to the Azure Application linked in Vanta to list and get individual Kubernetes nodes, by adding the required YAML to create a clusterrole with the required permissions in each cluster and a clusterrolebinding to bind it to the Application. If the clusterrole or the clusterrolebinding is missing or wrong, a generic authentication error will be shown.
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757557/1724b68196c31b1bafede725164e/30068363667092?expires=1794967200&signature=099afe199c35af3255f52013794f9de8870ead04830a1d5ee5ae469035296df1&req=dSUmEM57moRaXvMW1HO4zYFa57ASt3a3vl4A36yopm40Wrm%2BMQJ5pvm4MPmP%0ACHAZqHsf73pat9Y%2Fd6g%3D%0A>
- 
The steps to fulfill each requirement are described in detail in the Vanta Azure integration linking flow. They can be accomplished through the Azure portal or a script provided to run from the Azure Cloud Shell.
- 
In addition to the specific errors in Kubernetes nodes with errors section in Inventory, if some of the requirements are not fulfilled, the integration page may show an error for the Azure Kubernetes Service nodes
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516757555/7d84cfcab8e7663fa370ac262783/30068448038292?expires=1794967200&signature=1ff2d716d93c4762f86eaa62691b895ad84eca6f335db97919f0b247e74ab6b1&req=dSUmEM57moRaXPMW1HO4zTqkbGsXJI6yUwP58X%2BFmu9IHHwzpubgEN0ROZNZ%0ASKuICwNOhYxEap3UqBc%3D%0A>

## Images

- [image 01] ../../images/ux/integrations/azure-kubernetes-guide--01.png
- [image 02] ../../images/ux/inventory/azure-kubernetes-guide--02.png
- [image 03] ../../images/ux/inventory/azure-kubernetes-guide--03.png
- [image 04] ../../images/ux/integrations/azure-kubernetes-guide--04.png
