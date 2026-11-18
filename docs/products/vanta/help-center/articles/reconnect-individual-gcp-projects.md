# Reconnect individual GCP Projects

Source: https://help.vanta.com/en/articles/11345996-reconnect-individual-gcp-projects
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

There may be times when you need to reconnect your Projects in your GCP Integration or add new projects to an existing integration. Rather than deleting the Integration and starting over from scratch, potentially losing any ownership or scoping configuration, follow the guide below on reconnecting them.
 

## Prerequisites
- 
Currently connected GCP Integration
 

## Procedure
In order to reconnect your projects individually, You can attempt the following:
- 
Edit your GCP Connection
 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765131/57464f0c53d81bcd781f31393803/upload_13391901126737484873?expires=1794967200&signature=144177b171992356a5d6707c6bc6c5eb50693572156fe67fa24d13acf6f3e8cd&req=dSUmEM54mIBcWPMW1HO4zfIIuDjd8IxBxmmFOKd45418K6jypKZN%2FgMqBMCu%0Aamug%0A>
 
- 
Add a Project
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765137/259eba9686a0e93ec74f5538235b/upload_2924365889363792793?expires=1794967200&signature=74b8524299195dc37119c103b3b5f7bc470b006b300d22af962c30498033808f&req=dSUmEM54mIBcXvMW1HO4zTp5I2s8vtk4Iq05j%2FWf0uzcifrFO1Ud26kYnfL2%0AEwbQ%0A>
 
- 
Enter the same project you want to update, in this example: 'strange-radius-999991'
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765128/5e2d0dc78a375eb9368c214a3300/96121ace-30ea-4730-b51a-6c8177905e3c?expires=1794967200&signature=a40f46cf36a30119c356822c1a97c4c9d09bb2cd36041bb84b154e77a56a159b&req=dSUmEM54mIBdUfMW1HO4zYmLEEzJgZI7pmOegUvayzv20H%2F4o3BVuN8pRcIm%0Adexx%0A>
 
- 
Download the connection script, and copy the run command
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765138/125bb2810a5e9e6c04172ef82078/upload_10975794313273080639?expires=1794967200&signature=81dbbf17bb86bd168c5c5b60f63d3a635a54c800c5fdee5fe8baaa6190b5d20e&req=dSUmEM54mIBcUfMW1HO4zSU6e4uNMc9uvVDKblBwwGLEF7uUDzt4qcUTfq07%0As%2B%2Bh%0A>
 
- 
Make sure you don't have any existing downloaded scripts. Otherwise, the run command may not work correctly.
 
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765143/95375dfce182e119857bed28848f/upload_158564500342509203?expires=1794967200&signature=388118517c2b29fda125c9d310ad56c46641164c9939e2be257c46e494686d1c&req=dSUmEM54mIBbWvMW1HO4zfzuF4oBxisN0WKPnvb%2BRqNV3aAcxQaZ%2B6tIdUgm%0AAoeu7KjzwpBr53oPV%2Bs%3D%0A>
 
- 
Open your editor in the shell
 
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765145/4279113d9d4787269b9841b46f1d/3d4de4ae-ddf9-42ef-a00d-d82006727547?expires=1794967200&signature=25fa0c308ac30b3a9fd8f284b6b7c8d77f2523248992b9c649b839689c15c360&req=dSUmEM54mIBbXPMW1HO4zYBV9MwfruCYjiL5DxqPycaP3maVVxETA9zhjsVV%0A2jw4%0A>
 
- 
Delete any Existing Vanta individual project scripts and vanta-scanner-key.json
 
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765151/6f1abaf2ccd122a28f3fb88ade55/dcd12a9d-d738-43f1-8753-2decf835154c?expires=1794967200&signature=67d38f9165a5a0fa2f93f475a1114f7d674ffb2104913a293cc2316c4bb4e5a6&req=dSUmEM54mIBaWPMW1HO4zf2Gj2KNkg6O3K4l0qm6kZFCo1KCyJHs9ADbqdBo%0ApNlbPAggWUZm%2B3m0mJc%3D%0A>
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765152/1f0c35f24a22a645f277c07d6a9e/a39e94d0-f1c4-4750-b0f6-5f225c530a45?expires=1794967200&signature=7a722fc642e3c2f13c619cac2ef44c644cc9f9659c5d9a92dddfd226b5a1907c&req=dSUmEM54mIBaW%2FMW1HO4zZcApGU%2BuSCT5%2Foq3i3ubzVsxt3v1LJ%2FT07vdHFd%0Af9tUSlsPaIuOQRSs4RU%3D%0A>
 
- 
Drag and Drop the newly downloaded script
 
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765157/16b42079f5e5d7b81e7a2b83ce1c/a8e55029-1b54-4dee-8c33-c06e7b684e8c?expires=1794967200&signature=f6d0262f7b6aacad767e8a2c1e20029d9b9b65d9e890ec10008a2b27c43405f4&req=dSUmEM54mIBaXvMW1HO4zQ6xTAWJExO5belTAj05%2B4zRMTJ9Lz57UQICEU6z%0ABFUUoSD1rxuCIQJ0tB8%3D%0A>
- 
Now, open the terminal
 
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765160/91d7b51253f4c17377e8a510ad56/21b66b91-662b-46fb-8072-e972e370de7e?expires=1794967200&signature=7ed1423358a5b5912180929b95a3db9b6a3c1e5aa40e1a9d7df8086775339f15&req=dSUmEM54mIBZWfMW1HO4zcNho%2Flm3BUKPhs8l0R8dUPPd6fGsrh8prZGpnWt%0A6rsi%0A>
 
- 
Paste the run script in the terminal and hit enter
 
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765173/37cebcfaa5165d41e53c01b12ae8/4cd2c2ad-828b-4094-aad1-980a8f2cd5df?expires=1794967200&signature=58b597622192bf0fabe51b36342d1da61c5eccd655da5439b7e64d3323e82655&req=dSUmEM54mIBYWvMW1HO4zYvAsWvH38RTMKK9NDXOp9CiNfbtmg0LFw66oMHu%0ANjln%0A>
 
- 
Agree to changes
 
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765172/da7767f465c25dd7a9a2ebd34efb/471c91c1-ba9e-429b-bbe0-c5f2bcb88391?expires=1794967200&signature=118abee546a444a96acfd0b5b8f979898a35f82fc50b64bc46ee4eb295e1b1d7&req=dSUmEM54mIBYW%2FMW1HO4zf9X%2F8dt4%2FKfKiZZLO2sahB%2F%2BwI0LanRsk9NnS7G%0Att3W%0A>
 
- 
Open the editor again after completed
 
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765179/3ffc017a1d334c5cfaa8d1b24b82/a5feeeac-a17b-4232-8cf7-9fe3ba49e99f?expires=1794967200&signature=427cdb972fedc7387e57c75495e70e32fc928d36c4abda79e8d6a834dac64c27&req=dSUmEM54mIBYUPMW1HO4zRvFZvvp4o%2B%2FCnIM2EOa9w9Uzy6%2BK30J8VEIXw2U%0A5KGs%0A>
 
- 
Download the newly generated vanta-scanner-key.json
 
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765181/3d9ab58fd7b8733c92a59aac6d58/aea4b9e0-fe33-4dcf-847f-1946390386ad?expires=1794967200&signature=c31d88af1b465448ab45e702fb4f0fe5fd04d56c4fe9cb0b5eebd0a5f9692202&req=dSUmEM54mIBXWPMW1HO4zVQUhdu3tr7eFI1Um2qQs9WsqWRxcOhyVf2XbaHL%0ACv%2By%0A>
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765186/7eecc7c8ac173a4a18691a6972fb/48030dad-7b62-487c-aec2-a834b56adcbe?expires=1794967200&signature=26e3bba0a06c11d6a5aaef4c31b67448f002c46c974a00e7131c98a7e8dcb100&req=dSUmEM54mIBXX%2FMW1HO4zQ4aiV3IBtZh3IkHRRNChFVnSAkkPu3YODStlx22%0AGTDF%0A>
 
- 
Drag and Drop into the Vanta GCP Connection Step
 
[image 16]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765191/5febc648c5116e700e78ee46b712/875954d1-9b71-4a72-ac0e-ba03a16b910b?expires=1794967200&signature=a540746c118a5258a10b36e2d02f9806ac8b8bb06b63a5285d0c72dd3915106b&req=dSUmEM54mIBWWPMW1HO4zV9UdG7Mad05Fi%2Bvez0gvfb8uAZEtlMcqK6fpUP2%0ATNvH%0A>
 
- 
When you click next and move to the next step, Vanta should start pulling your resources
 
[image 17]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765203/7cc11b1af2fa52567bea2b051c1a/4720e011-2222-47db-b98b-99620e1e27c7?expires=1794967200&signature=504e5c12d07294ca10385461efd2afa151abf902c36e7149816a60c4a1af6d20&req=dSUmEM54mINfWvMW1HO4zdXYHegKu5NBrpiFthazaF%2BZrTcXx4Y%2FZmyUrSg2%0AtDQj%0A>
 
- 
You'll notice that any existing scoping and ownership will retain its configuration
 
[image 18]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516765204/445ede3e56e3c8af21dad74e0bc0/88c89616-e168-4f29-b9f4-27e5eef4dc0f?expires=1794967200&signature=ddef1ef65c412fee7abe7f02f14671daeeb46e2e39591ca79f81d65d3462c143&req=dSUmEM54mINfXfMW1HO4zUaK%2FPbqCm1EY4AbGrnwZ2S8fez2bhHTxkJ8Odip%0AedkT%0A>
- 
Select Done, and you should see all your Resources from your previously integrated projects retained their scoping and ownership.

## Images

- [image 01] ../../images/ux/integrations/reconnect-individual-gcp-projects--01.png
- [image 02] ../../images/ux/integrations/reconnect-individual-gcp-projects--02.png
- [image 03] ../../images/ux/integrations/reconnect-individual-gcp-projects--03.png
- [image 04] ../../images/ux/integrations/reconnect-individual-gcp-projects--04.png
- [image 05] ../../images/integrations/gcp/reconnect-individual-gcp-projects--05.png
- [image 06] ../../images/integrations/gcp/reconnect-individual-gcp-projects--06.png
- [image 07] ../../images/integrations/gcp/reconnect-individual-gcp-projects--07.png
- [image 08] ../../images/integrations/gcp/reconnect-individual-gcp-projects--08.png
- [image 09] ../../images/integrations/gcp/reconnect-individual-gcp-projects--09.png
- [image 10] ../../images/integrations/gcp/reconnect-individual-gcp-projects--10.png
- [image 11] ../../images/integrations/gcp/reconnect-individual-gcp-projects--11.png
- [image 12] ../../images/integrations/gcp/reconnect-individual-gcp-projects--12.png
- [image 13] ../../images/integrations/gcp/reconnect-individual-gcp-projects--13.png
- [image 14] ../../images/integrations/gcp/reconnect-individual-gcp-projects--14.png
- [image 15] ../../images/integrations/gcp/reconnect-individual-gcp-projects--15.png
- [image 16] ../../images/ux/integrations/reconnect-individual-gcp-projects--16.png
- [image 17] ../../images/ux/integrations/reconnect-individual-gcp-projects--17.png
- [image 18] ../../images/ux/integrations/reconnect-individual-gcp-projects--18.png
