# Managing User Roles

Source: https://help.vanta.com/en/articles/11345385-managing-user-roles
Collection: Team Compliance ; Team Compliance › Managing Users
Fetched: 2026-11-17

## Article text

✅ Feature availability: All plans include standard built-in user roles. Additional scoped roles and custom role-based access controls depend on your plan and enabled features. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
User roles control access to the Vanta platform, ensuring that users only have access to what they need to complete their work. Roles range from broad platform access to focused product-area access, and you can create custom roles to fit your organization's needs. Who gets a user account and how those accounts are added or deactivated depends on your user provisioning setting.
 
⚙️ User permissions: Only Admins can manage users, create custom roles, and configure the user provisioning setting. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>
 
 

## Getting started
Each user account can be assigned one role which determines the following:
- 
Employee portal: Whether a user can log in to access the employee portal, where they can complete personnel tasks <https://help.vanta.com/en/articles/11345600-personnel-tasks>, access requests <https://help.vanta.com/en/articles/11345423-managing-access-requests-in-vanta>, and vendor requests <https://help.vanta.com/en/articles/13688317-managing-vendor-procurement#h_6c85434ee4>, if your organization has enabled these features. All user roles can access the employee portal.
- 
Product permissions: What a user can see and do across Vanta by default, before any object assignments are considered.
- 
Object assignments: Which specific objects a user can be assigned to and act on. These layer on top of product permissions, so a user can have access to specific objects even if their role doesn't grant broader platform access. All user roles except Employee can be assigned objects across the Vanta product.
​
💡 Tip: Assign users the Employee role if you only want them to be able to access the employee portal. Assign users the Collaborator role if you want them to have access to objects they've been assigned. For users who need broad access across Vanta, assign them the Editor role.
 
 

## Comparing user roles
Vanta has three types of roles: standard roles available to all customers, scoped roles that come with specific product areas included on your plan, and custom roles for bundling product area permissions.
 
Review the tables below to compare the default product permissions per user role. For a breakdown of what users can do in each product area, refer to User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>.
 

### Standard roles
 
Standard roles are built-in Vanta roles available on all Vanta plans:
 | 
Role | 
Default product permissions
 | 
Admin | 
Full access to everything in Vanta
 | 
View-only Admin | 
View-only access to everything in Vanta
 | 
Editor | 
Full access to everything in Vanta with exceptions, including billing, user management, sensitive data, and API tokens (see exceptions <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>)
 | 
Collaborator | 
Access only to objects they’re assigned to in Vanta
 | 
Employee (default role assigned) | 
No access except the employee portal
 

### Scoped roles
 
Scoped roles are built-in Vanta roles that appear when the related product area or feature is enabled for your organization:
 | 
Role | 
Default product permissions
 | 
Access Admin | 
Personnel access requests, and access reviews, and deprovision accounts across integrated applications
 | 
Audit Limited Editor | 
Same access as Editor, with restrictions for Audits (cannot add audits, edit audit settings from the Audits page, edit request metadata, mark requests ready for auditor review, or post auditor-facing comments)
 | 
Commitments Manager | 
Full access to Commitments (cannot access other areas of Customer Trust)
 | 
Privacy Manager | 
Full access to Privacy
 | 
Trust Admin | 
Full access to Customer Trust
 | 
Trust Collaborator | 
Limited access to Customer Trust
 

### Custom roles
 
Depending on your plan, you can create custom roles <https://help.vanta.com/en/articles/11345585-creating-custom-roles> to bundle product permissions for users who need access to specific parts of Vanta. They're built on the Collaborator role as a baseline, so users can still access the employee portal and be assigned objects across the product.
 
 

## Assigning user roles
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2381292182/b530b2b66f75b3b52c8849dbd1d8/image.png?expires=1794967200&signature=717da6a2ebed43e16c26b9e55bd41384777daf00ead7b88532954f416c4ff0ba&req=diMvF8t3n4BXW%2FMW1HO4zbTMwEbiv6g%2B2CHywKbkifJWZB3EIhURwrDw%2BeCg%0AqJIbC9KqSrKPS40lbuE%3D%0A>
 
To assign a role to user account:
- 
In your account header, click the Settings icon.
- 
Under Access, open the User permissions page.
- 
Each user account can be assigned one role.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2381278511/eb5fe84683621cf61d94167981dc/image.png?expires=1794967200&signature=f90d88046a2b342d7843e6afb7106d85da80001875f7b685efcf89c34b13abfd&req=diMvF8t5lYReWPMW1HO4zbxD7C3neiUgJPsP6Cn4Kn7UCOUkZ5ugUbdkoEbb%0AwEE6MfxmdPe9Gti6J9s%3D%0A>
 
To see the roles available to use:
- 
In your account header, click the Settings icon.
- 
Under Access, open the Roles page.
​
 

## Managing user provisioning
Who gets a user account, and how those accounts are added or deactivated, depends on your user provisioning setting—whether that's automatically from personnel records, synced via SCIM, or managed manually.
 | 
User provisioning setting | 
How provisioning works | 
How deprovisioning works
 | 
Personnel auto-provisioning | 
When a personnel record is added to your People page, a linked user account is automatically created with the Employee role. | 
Accounts are automatically deactivated when the linked personnel record is terminated, marked out of scope, or set as a service account.
 | 
User provisioning via SCIM | 
User accounts are created and managed from your IdP via SCIM. User roles are assigned in your IdP and synced to Vanta.  | 
Accounts are deprovisioned when deactivated in your IdP.
 | 
Manual provisioning | 
No user accounts are created automatically. | 
Offboarding personnel records does not automatically deactivate user accounts.
 

### Personnel records vs. user accounts
 
Personnel records and user accounts are two different things in Vanta:
- 
Personnel records who have not been granted a user account cannot log in to Vanta.
- 
Personnel records who have been granted a user account can log in to Vanta, as well as any user accounts you add manually.
- 
Users assigned the Employee user role can log in to Vanta but can only access the employee portal.
- 
Users assigned the Collaborator user role or higher can access objects assigned to them across Vanta.
- 
Users assigned the Editor user role have broad access across Vanta.
 

### Personnel auto-provisioning
 
When user provisioning is enabled via personnel, user accounts are automatically created from personnel records. Then you manage Vanta platform access levels with user roles. To learn about how personnel are imported, see Adding and Managing Personnel <https://help.vanta.com/en/articles/11345379-adding-and-managing-personnel>.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2381371424/e67009a04bc612ba842a51759c7f/image.png?expires=1794967200&signature=a1cf790dce0e81c415167ef973af00a0034c3b183e959040dec4fb680319fb63&req=diMvF8p5nIVdXfMW1HO4za1hdfVqzeHGXmcOtFsa76jOQ6JOvLI%2BGuudGAZv%0AXGTs4zPohymeyRYViAw%3D%0A>
 
 | 
Action | 
How it works
 | 
Add user account | 
Provisioning: User accounts are created automatically when personnel records are added—regardless of how personnel were imported.
 | 
Edit user role | 
Access: Search for a user and use the dropdown menu to change their role. Select multiple users to make bulk changes.
 | 
Deactivate user account | 
Deprovisioning: Offboard the personnel record, mark them out of scope, or mark them as a service account—these actions automatically deactivate user accounts.
 
💡 Tip: To add a user account for someone who doesn't need a personnel record, click Add user account and leave the Monitor user for compliance option unchecked. User accounts added this way need to be deactivated manually.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2411114215/4fc3c39b54698bf84c41f238eb02/image.png?expires=1794967200&signature=e238474b58f52544f702e65428b8b3789a87fff10b79b298b4c8e89ded8fc9cf&req=diQmF8h%2FmYNeXPMW1HO4zXpqtrJttcPDolvwDA%2FLTWmtmCD0Klo1GvQK1orz%0A%2FJhkdjbIHYqO8VEbdDI%3D%0A>
 

### User provisioning via SCIM
 
If you’ve got SCIM enabled, user accounts are created and managed from your IdP. Roles are assigned to users in your IdP and synced to Vanta. 
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2381369034/905e3c61dba22f2557b398bcf411/image.png?expires=1794967200&signature=0e229a36aee5f2c8dd9fb251cd83f0639cadf98e84304af5d5d2dc1386d173d7&req=diMvF8p4lIFcXfMW1HO4zZ16byJwFX7NYHNXwL%2FnXK5AZwXvzsV39AOBrky9%0AgT%2FYCJaCs3Ei802n3qM%3D%0A>
 
📖 Learn more: Enabling SCIM in Vanta <https://help.vanta.com/en/articles/11345647-enabling-scim-in-vanta>
 

### Manual provisioning
 
When user provisioning is off, personnel records and user accounts are managed independently. You control exactly who gets access to Vanta by manually managing user accounts. Adding or offboarding a personnel record does not automatically add or deactivate a user account, and deactivating a user account does not affect the personnel record.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2381393109/e223d96cb58d63db06cad4e19b9f/image.png?expires=1794967200&signature=e4143fb1b686ecf74cffcc078308787886d1a86caa581f894dbb49d99e8b6428&req=diMvF8p3noBfUPMW1HO4zTh3I6xnONbzBGRt5w1cQ2G0c2VDavJ0gbKuV5Ye%0AOD4o0cylfpZ157T13jI%3D%0A>
 
 | 
Action | 
How it works
 | 
Add user account | 
Provisioning: Click Add user account, enter their details, select a role, and decide whether to also create a personnel record in Vanta.
 | 
Edit user role | 
Access: Search for a user and use the dropdown menu to change their role. Select multiple users to make bulk changes.
 | 
Deactivate user account | 
Deprovisioning: Click the ••• menu next to the user and select Deactivate. This removes their access to Vanta without affecting their personnel record.
 

### Changing your user provisioning setting
 
To change your user provisioning setting:
- 
Click the Settings icon from your account header
- 
Open the Login and security page.
- 
Scroll to the User provisioning section.
- 
Review the preview of what will happen to existing user accounts. Users may be added or deactivated, and access levels and how accounts are managed may change.
The confirmation modal may refer to accounts becoming manually managed. Here's what that means:
- 
An account is manually managed when it isn't linked to a personnel record, which can happen when: 
- 
User provisioning is turned off, meaning you’re manually provisioning users.
- 
You add a user account manually without linking it to a personnel record.
- 
Vanta can't match a user account to a personnel record by email address during a provisioning sync.
- 
Manually managed accounts aren't automatically provisioned or deprovisioned—changes to their personnel record won't affect their Vanta access.
- 
You can provision and deprovision manually managed user accounts directly from your user permissions settings in Vanta.

## Images

- [image 01] ../../images/ux/settings/managing-user-roles--01.png
- [image 02] ../../images/ux/settings/managing-user-roles--02.png
- [image 03] ../../images/ux/settings/managing-user-roles--03.png
- [image 04] ../../images/ux/settings/managing-user-roles--04.png
- [image 05] ../../images/ux/settings/managing-user-roles--05.png
- [image 06] ../../images/ux/settings/managing-user-roles--06.png
