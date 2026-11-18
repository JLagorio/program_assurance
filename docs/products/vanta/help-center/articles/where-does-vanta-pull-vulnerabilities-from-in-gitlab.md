# Where does Vanta Pull Vulnerabilities from in Gitlab?

Source: https://help.vanta.com/en/articles/11345792-where-does-vanta-pull-vulnerabilities-from-in-gitlab
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Vulnerability Scanners
Fetched: 2026-11-17

## Article text

If you use the vulnerability scanning feature in GitLab and wish to configure it to work with Vanta, this is possible only if you're using the GitLab Security Dashboards and Security Center. <https://docs.gitlab.com/ee/user/application_security/security_dashboard/#:~:text=Note%3A%20The%20Security%20Dashboards%20show%20results%20of%20scans%20from%20the%20most%20recent%20completed%20pipeline%20on%20the%20default%20branch.%20Dashboards%20are%20updated%20with%20the%20result%20of%20completed%20pipelines%20run%20on%20the%20default%20branch%3B%20they%20do%20not%20include%20vulnerabilities%20discovered%20in%20pipelines%20from%20other%20un%2Dmerged%20branches.> The vulnerabilities must come from the default or main branch, as we are unable to pull vulnerabilities from side or feature branches.
​
If you do not use the Security Dashboards and Security Center feature but still utilize one of the scanning tools in GitLab, such as Static Application Security Testing (SAST), Infrastructure as Code (IaC) scanning, Secret detection, and Dependency scanning, these vulnerabilities will not be pulled into Vanta.
​
Please note: We make fetches every 6 hours. Also, Security Dashboards and Security Center are premium features in GitLab.
 

## Other Prerequisites
- 
You must have the GitLab Ultimate subscription tier
- 
Have a paid GitLab Duo Enterprise seat.
- 
GitLab Duo must be enabled for the group or instance
- 
The person who connected the Gitlab Integration in Vanta must be at minimum, a member of the project
- 
The vulnerability must be from a SAST scanner

## Images

- none
