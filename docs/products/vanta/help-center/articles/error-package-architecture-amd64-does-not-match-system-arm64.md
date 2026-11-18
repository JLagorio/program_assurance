# Error: “package architecture (amd64) does not match system (arm64)”

Source: https://help.vanta.com/en/articles/11345973-error-package-architecture-amd64-does-not-match-system-arm64
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When installing the Vanta Device Monitor, you may come across a specific error that says:
 
"package architecture (amd64) does not match system (arm64)"
 * Downloading the Vanta Agent
######################################################################### 100.0%

* Ensuring checksums match
Checksums match.

* Installing the Vanta Agent. You might be asked for your password...
dpkg: error processing archive /tmp/tmp/vanta.deb (--install):
package architecture (amd64) does not match system (arm64)
Errors were encountered while processing:
/tmp/tmp/vanta.deb

Something went wrong while installing the Vanta agent.

If you're having trouble installing, please send an email to [email protected], and we'll help you fix it!
 

## Cause
Vanta does not currently support ARM-based operating systems for Windows or Linux. If you are running Windows for Arm or Debian/Ubuntu ARM, the Vanta Device Monitor install log will return this error.
 

## Resolution
- 
You must use a non-arm-based operating system to successfully install the Vanta Device Monitor.
 

## Alternate Resolution (OPTIONAL)
- 
If ARM-based operating systems are required for your business, you will not be able to monitor them automatically with the Vanta Device Monitor, but an MDM provider may be able to fill the gap.
​
- 
If an MDM is not an option, then providing manual screenshot evidence of the devices will enable automated monitoring.
 

## Additional Resources
- 
Vanta Device Monitor & Unsupported Operating Systems  <https://help.vanta.com/en/articles/11345402>
- 
Supported operating systems for the Vanta Device Monitor <https://help.vanta.com/en/articles/11345400>
- 
Evidence Collection for Unmonitored Laptops <https://help.vanta.com/en/articles/11345596-evidence-collection-for-unmonitored-laptops>

## Images

- none
