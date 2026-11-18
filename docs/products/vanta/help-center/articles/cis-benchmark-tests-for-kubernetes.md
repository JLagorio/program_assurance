# CIS Benchmark Tests for Kubernetes

Source: https://help.vanta.com/en/articles/11345523-cis-benchmark-tests-for-kubernetes
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

CIS Benchmarks are a globally recognized best practice for securing IT systems and data. CIS offers a specific benchmark for configuring Kubernetes (K8s) securely. Within Vanta, you can automate the tests specific to AWS K8s. These tests work like all of Vanta’s other automated tests, continuously checking against your integrated tool (AWS in this instance) and the CIS benchmark, alerting you when items need attention along the way.
 

## Core CIS Amazon EKS Benchmarks Tests
- 
EKSClusters have audit logs enabled
- 
Cluster control plane endpoint public access is restricted
- 
Cluster control plane endpoint private access is enabled
- 
Cluster has a security group
Additional tests are available on Vanta's Growth, Scale, Enterprise packages.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516768927/6c433390a54b9cf2621b8dfd221b/24503634807188?expires=1794967200&signature=00e6d5d5b8da0ea8943ba7c35f74a6874071907e95304ad2ca15173788817d97&req=dSUmEM54lYhdXvMW1HO4zZUCzGjuRFkEL6aaHy6CIc5m7DPndu9xrWXkAHMh%0AwJHclfVw4dwoxqD8NUc%3D%0A>
 

## Complete Test set for CIS Benchmark for AWS EKS
- 
EKSClusters have audit logs enabled
- 
Cluster control plane endpoint public access is restricted
- 
Cluster control plane endpoint private access is enabled
- 
Cluster has a security group
- 
Roles rules definitions are restricted to certain verbs and resources
- 
Kubernetes nodes have anonymous request to the Kubelet server disabled
- 
Kubernetes nodes have explicit authorization mode
- 
Kubernetes nodes have client CA File configured
- 
Kubernetes nodes follow a certificate rotation policy
- 
Kubernetes nodes have timeouts on streaming connections enabled
- 
Kubernetes nodes allow kubelet to manage iptables
- 
Nodes have appropriate logging event capture settings
 

## Complete Test set for CIS Benchmark for GCP GKE
- 
Ensure Image Vulnerability Scanning is enabled
- 
Ensure GKE clusters are not running using the Compute Engine default service account
- 
Ensure Kubernetes Secrets are encrypted using keys managed in Cloud KMS
- 
Ensure legacy Compute Engine instance metadata APIs are Disabled
- 
Ensure the GKE Metadata Server is Enabled
- 
Ensure Container-Optimized OS (cos_containerd) is used for GKE node images
- 
Ensure Node Auto-Repair is enabled for GKE nodes
- 
Ensure Node Auto-Upgrade is enabled for GKE nodes
- 
Ensure Shielded GKE Nodes are Enabled
- 
Ensure Integrity Monitoring for Shielded GKE Nodes is Enabled
- 
Ensure Secure Boot for Shielded GKE Nodes is Enabled
- 
Enable VPC Flow Logs and Intranode Visibility
- 
Ensure use of VPC-native clusters
- 
Ensure Control Plane Authorized Networks is Enabled
- 
Ensure clusters are created with Private Endpoint Enabled and Public Access Disabled
- 
Ensure clusters are created with Private Nodes
- 
Ensure Network Policy is Enabled and set as appropriate
- 
Ensure Logging and Cloud Monitoring is Enabled
- 
Ensure authentication using Client Certificates is Disabled
- 
Ensure Legacy Authorization (ABAC) is Disabled
- 
Ensure Kubernetes Web UI is Disabled
- 
Ensure that Alpha clusters are not used for production workloads**
- 
Ensure use of Binary Authorization
 

## Complete Test set for CIS Benchmark for Azure AKS
- 
Ensure that the --anonymous-auth argument is set to false
- 
Ensure that the --authorization-mode argument is not set to AlwaysAllow
- 
Ensure that the --client-ca-file argument is set as appropriate
- 
Ensure that the --streaming-connection-idle-timeout argument is not set to 0
- 
Ensure that the --make-iptables-util-chains argument is set to true
- 
Ensure that the --eventRecordQPS argument is set to 0 or a level which ensures appropriate event capture
- 
Ensure that the --rotate-certificates argument is not set to false

## Images

- [image 01] ../../images/ux/tests/cis-benchmark-tests-for-kubernetes--01.png
