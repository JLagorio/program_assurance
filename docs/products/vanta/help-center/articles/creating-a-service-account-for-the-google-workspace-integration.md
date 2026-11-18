# Creating a Service Account for the Google Workspace Integration

Source: https://help.vanta.com/en/articles/11345689-creating-a-service-account-for-the-google-workspace-integration
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Identity Providers
Fetched: 2026-11-17

## Article text

## 1. Create a New Admin
- 
Select Directory,  followed by Users.
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756673/59b5230fe585cef5831db1a520ef/35747937894932?expires=1794967200&signature=cf568fe56a124f8f236c631652c2134f6ab1f814bc195d8a1d745871cfc7f26e&req=dSUmEM57m4dYWvMW1HO4zcUK%2BbJ68ECvvU5I2yq8SfDbfrERr3EY1Kcs%2Fkia%0AnwC7fxX5qoqXidWPVts%3D%0A>
- 
Select Add new user
- 
Complete the required information. Select Add new user 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756670/3ff2c946aee4fec02b9affe453bc/35747937895444?expires=1794967200&signature=e0a2690c3364787faadc9d9246d1455c044ad62860b85cfefee622ce9999078a&req=dSUmEM57m4dYWfMW1HO4zQ1OVq6VF1wjARiUp8QjJ16oRDPiGVjI06OVIGFN%0A1uKxkYP3cAPWk7w6D2w%3D%0A>

## 2. Create a Custom Admin Role
- 
From the Admin console, select Account followed by Admin roles. 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756668/6cd0230be3250c68377a459d888e/35747950977044?expires=1794967200&signature=0e8bf6b87c65400992d89f7ea5f4e6c99f4e6b8fa5dd09a638120f78b4a2767d&req=dSUmEM57m4dZUfMW1HO4zaeF%2B0vQD292odOZILHtw1t35biGgcnwDlWqPhM7%0A3Y%2BcU4bqSVJrfgUUfEw%3D%0A>
- 
Select Create new role. 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756669/8d8a7061ff6bfccf8701fd37772c/35747950978964?expires=1794967200&signature=26787df2114b54bc6f278fd0a0590690f64ce8feb192f7a92e101c985d2fd86d&req=dSUmEM57m4dZUPMW1HO4zfFiVQxkiqD5NOa1maNaHsAfQbXvmUwoELxfWseI%0A3iZzGzKOqzf11wsjsFM%3D%0A>
- 
Give the role a name (e.g., “Vanta API Integration”) and an optional description, then click Continue.
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756688/69296410f1858ad1b76b53c4dd60/35747937898900?expires=1794967200&signature=ec6eed467b55069f0658fd21ece83d28f9af179e4d28ee5144db2a58ffddfee5&req=dSUmEM57m4dXUfMW1HO4zW0ebRqrH1zYytYoGWuKC%2F4hJriB6husmkkmRpUY%0An0mAMhUaZXTozkICzNQ%3D%0A>
On the Select Privileges screen, add the following permissions:
- 
- 
Admin console privileges:
- 
Users → Read privilege (this covers admin.directory.user.readonly)
- 
Security → User Security Management (this covers admin.directory.user.security)
- 
Admin API privileges:
- 
Groups → Read privilege (this covers admin.directory.group.readonly)
- 
Select Continue
- 
Select Create role 

## 3. Assign a User to the Custom Role
- 
From the admin roles section, select the Vanta API integration role
- 
Select Assign admin
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756689/53f6dd1827db1d28ccf8b5cd1339/35747937901844?expires=1794967200&signature=92559117fb0e29b1b44fa6277932b9d0ae95a5174e6efeddbe2004f966da52a1&req=dSUmEM57m4dXUPMW1HO4zSYsExhQZ9ezdw2vRUMcgRwpJXepTQ8%2FF0MCPV9R%0ArWmup%2BUjEaDeMfgLlG0%3D%0A>
- 
Select Assign Members 
- 
Assign the previously created admin from step 1.
- 
Select Assign role
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756694/9f6d64eb4a93a4f00da8ae1d8d8a/35747950983828?expires=1794967200&signature=304e72d395d21d73d3c54c7553ce4e648814919f6ecffc1ab9c5b4fba5df639c&req=dSUmEM57m4dWXfMW1HO4zbPFoQXzRPptiQkGXjPjyyndgYuJgD%2Fr3RblA09%2F%0AmLEtL4s30h7WyW8j9KU%3D%0A>

## Images

- [image 01] ../../images/integrations/google-workspace/creating-a-service-account-for-the-google-workspace-integration--01.png
- [image 02] ../../images/integrations/google-workspace/creating-a-service-account-for-the-google-workspace-integration--02.png
- [image 03] ../../images/integrations/google-workspace/creating-a-service-account-for-the-google-workspace-integration--03.png
- [image 04] ../../images/integrations/google-workspace/creating-a-service-account-for-the-google-workspace-integration--04.png
- [image 05] ../../images/integrations/google-workspace/creating-a-service-account-for-the-google-workspace-integration--05.png
- [image 06] ../../images/integrations/google-workspace/creating-a-service-account-for-the-google-workspace-integration--06.png
- [image 07] ../../images/integrations/google-workspace/creating-a-service-account-for-the-google-workspace-integration--07.png
