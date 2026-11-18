# DocuSign permission-set

Source: https://help.vanta.com/en/articles/11345907-docusign-permission-set
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Administrators may notice that Vanta requires permission to create and send envelopes when connecting DocuSign. The following permissions are used:
- 
https://developers.docusign.com/docs/esign-rest-api/reference/users/users/list/ <https://developers.docusign.com/docs/esign-rest-api/reference/users/users/list/>
 
This API is only accessible with the eSignature API scope.
- 
https://developers.docusign.com/docs/admin-api/reference/usermanagement/users/getusers/ <https://developers.docusign.com/docs/admin-api/reference/usermanagement/users/getusers/>
This combination lets us get the complete user list for the organization. Vanta does not make any other API calls to your DocuSign account.

## Images

- none
