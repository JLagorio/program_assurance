# User Access Reviews for Microsoft 365

Source: https://help.drata.com/en/articles/8895962-user-access-reviews-for-microsoft-365
Collection: Understand the Drata Platform › Access Review
Updated: 2026-05-21
Fetched: 2026-11-22
Description: Ensure the following prerequisites are met before setting up Microsoft 365 for user access reviews.

## Article text

User access reviews for Microsoft 365 must have the following prerequisites:

- Drata pulls user access review applications from Microsoft Entra applications in Azure. These applications are typically located under “[Enterprise Applications](https://portal.azure.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade/~/AppAppsPreview/menuId~/null)” in Azure.
- Verify which applications Drata can automatically pull from Microsoft 365. For more details on these applications, refer to the [Azure Application Gallery](https://portal.azure.com/#view/Microsoft_AAD_IAM/AppGalleryBladeV2) in your Azure instance.
- Microsoft Entra provides user attribute data based on how SSO apps are configured in Azure; this data may not be available for all applications.
- If your IT team has chosen to provision access outside of Microsoft 365 (most likely directly in the source application), you can manually upload user data.
- Drata’s user access review functionality also supports Microsoft 365 GCC High.

Now, you can [set up your user access review.](run-an-access-review.md)

## Related articles

- [Microsoft 365 Integration Guide](microsoft-365-integration-guide.md)
- [Azure Integration Guide](azure-integration-guide.md)
- [Legacy: Microsoft Intune Integration Guide (Mac Devices)](legacy-microsoft-intune-integration-guide-mac-devices.md)
- [Azure Management Groups Integration Guide](azure-management-groups-integration-guide.md)
- [Understanding Azure Permissions and How Drata Integrates with Azure (Concept Guide)](understanding-azure-permissions-and-how-drata-integrates-with-azure-concept-guide.md)
