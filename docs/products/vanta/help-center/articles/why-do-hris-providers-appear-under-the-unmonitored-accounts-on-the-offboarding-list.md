# Why do HRIS providers appear under the 'unmonitored accounts' on the offboarding list?

Source: https://help.vanta.com/en/articles/11345866-why-do-hris-providers-appear-under-the-unmonitored-accounts-on-the-offboarding-list
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

An HRIS provider is not considered an access integration in Vanta, so it will show up as an "unmonitored account" in Vanta. HRIS provider is considered a "people" integration in Vanta, meaning we pull in people users, and not access users. Access users are defined as users who have access as admin/editor to that integration.
 
The example below show the difference between an "access" integration and a "people" integrations.
 
Monitored account in Vanta will show an "access" tag on the integrations page, such as data dog:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756585/677ecf0eae53645c2dd10f899afd/upload_16183946047458038495?expires=1794967200&signature=d43ae5ffda5c71644b19c3ddbacc117b54fef2bd074e135b4562fbeec9c45cb4&req=dSUmEM57m4RXXPMW1HO4zYaeYvXzYRuEjw7f1FgeUDvSwh4rrGIJqrhZHf8k%0AxwW9L7MHP1YjXARsfng%3D%0A>
 
While you'll see Personio does not have this access tag:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756584/77adb254e1a7baa10485d4381cc1/upload_16549025109659462996?expires=1794967200&signature=9d048b84bac3fc514e3624f8fa828feafb8fcb767f64e09062eff2bbc403f67c&req=dSUmEM57m4RXXfMW1HO4zfRj%2B%2Fz73ONqMqkQphpCXHmBPhz5ik6tj37L2Sb2%0Ad642paOgiO4LYznkcLw%3D%0A>
 
You can remove unmonitored account from your offboarding task set: Edit Unmonitored Accounts Offboarding List <https://help.vanta.com/hc/en-us/articles/15200661194772--Edit-Unmonitored-Accounts-Offboarding-List?source=search&auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjo5MjkxNzYyLCJ1c2VyX2lkIjo4MjU4NjczMjI3MDI4LCJ0aWNrZXRfaWQiOjIzNjU1MywiY2hhbm5lbF9pZCI6NjMsInR5cGUiOiJTRUFSQ0giLCJleHAiOjE3MTA1MDc4MTB9.9bxz23eJeuib1qwgJcdysBGAHAlHOrViADCZacvL68o>

## Images

- [image 01] ../../images/ux/integrations/why-do-hris-providers-appear-under-the-unmonitored-accounts-on-the-offboarding-list--01.png
- [image 02] ../../images/ux/integrations/why-do-hris-providers-appear-under-the-unmonitored-accounts-on-the-offboarding-list--02.png
