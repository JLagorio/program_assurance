# Connecting GCP Container Registry to Vanta

Source: https://help.vanta.com/en/articles/11345771-connecting-gcp-container-registry-to-vanta
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

To enable Vanta to fetch vulnerabilities surfaced by GCP Container Registry, enable both the Container Analysis API and Container Scanning API in GCP.
- 
The Container Analysis API lets Vanta fetch container metadata. This API is free.
- 
The Container Scanning API enables vulnerability scanning on each container. This may incur additional charges from GCP.
If you’re already doing container vulnerability scanning in GCP, both should be enabled already. If not, Vanta recommends you start container scanning; you can learn more about container scanning here <https://cloud.google.com/container-analysis/docs/enabling-disabling-container-analysis>. When you’re ready, follow the instructions below to enable each GCP project.
You can enable these APIs through either the online console or the gcloud terminal command.
Via the online console: Go to the following links and follow the instructions:
- 
Container analysis: https://console.cloud.google.com/flows/enableapi?apiid=containeranalysis.googleapis.com <https://console.cloud.google.com/flows/enableapi?apiid=containeranalysis.googleapis.com>
- 
Container scanning: https://console.cloud.google.com/flows/enableapi?apiid=containerscanning.googleapis.com <https://console.cloud.google.com/flows/enableapi?apiid=containerscanning.googleapis.com>
Via gcloud: Enter the following commands in your terminal:gcloud services enable containerscanning.googleapis.com

gcloud services enable containeranalysis.googleapis.com
Please note that enabling Container Scanning API will incur additional charges from GCP.
For additional information on GCP container analysis, please refer to: https://cloud.google.com/container-analysis/docs/container-analysis  <https://cloud.google.com/container-analysis/docs/container-analysis>

## Images

- none
