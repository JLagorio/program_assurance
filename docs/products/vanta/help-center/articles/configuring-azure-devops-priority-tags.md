# Configuring Azure DevOps Priority Tags

Source: https://help.vanta.com/en/articles/11345979-configuring-azure-devops-priority-tags
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When using Azure DevOps to track and monitor security issues, Vanta detects the priority from the Azure DevOps Priority field. <https://docs.microsoft.com/en-us/azure/devops/reference/xml/reportable-fields-reference?view=azure-devops-2020>
 
Azure DevOps indicates priority value as “1, 2, 3, 4,” etc. Vanta handles priority values as P0, P1, P2, and P3.
 
Since Azure DevOps does not have an equivalent P0 option, Vanta accounts for this offset by mapping the priorities from Azure DevOps as follows:
- 
Priority 1 = P0 in Vanta (High)
- 
Priority 2 = P1 in Vanta (Medium)
- 
Priority 3 = P2 in Vanta (Low)
- 
Priority 4 = P3 in Vanta (Lowest)
 

## Common Issues
If you notice security issues in a test that do not represent their intended security priority, we suggest testing setting the Azure DevOps Priority field as the value that best matches the mapping above.
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516763959/b09be1c3d47b1f93516f0cab58fd/18256988198548?expires=1794967200&signature=38bb268e5342255b2d84b6138344787bd61b74c3a5bc3aadc32e6a2a263bdd56&req=dSUmEM54nohaUPMW1HO4zTpzb2VSeI6RSTjogrTJRlefGhzkJuHciXFjPrxT%0AgtNWn27rIIPAA5bJ9Tk%3D%0A>

## Images

- [image 01] ../../images/integrations/azure-devops/configuring-azure-devops-priority-tags--01.png
