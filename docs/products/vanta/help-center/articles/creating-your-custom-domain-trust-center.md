# Creating your Custom Domain: Trust Center

Source: https://help.vanta.com/en/articles/11345446-creating-your-custom-domain-trust-center
Collection: Trust Management ; Trust Management › Customer Trust ; Trust Management › Customer Trust › Trust Center
Fetched: 2026-11-17

## Article text

With Vanta Trust Center <https://help.vanta.com/en/articles/11345469>, admins can create a custom domain to link to and publicly display the organization's Trust Center. Using a custom domain to demonstrate a commitment to security and compliance allows you to:
- 
Satisfy security page requirements for SOC 2
- 
Get organic leads/inquiries from prospects researching your company
- 
Market your status as a secure and trusted vendor
Looking for inspiration? You can view Vanta’s Trust Center in the footer on our homepage <https://www.vanta.com/> or at trust.vanta.com <https://trust.vanta.com/>
 

## Create your Custom Domain
- 
In your account header, click the Settings icon
- 
In the Settings page menu, scroll to the Features section, select Customer Trust, and go to the Trust Center tab
- 
Locate the Use a custom domain section 
- 
Enter the desired domain where your report will be hosted
- 
Provide your domain name
- 
Select Next 
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771075/d74e9021ba27b597e6aa4aedfbc7/34822637730836?expires=1794967200&signature=36a90676d2d8b2a400d8c1c29b7fc30e6b52d41933f1939bddcff9534e7824ee&req=dSUmEM55nIFYXPMW1HO4zYyDIEy8%2FYoGHTpjQKdiyR6ifpUeRTT99ORPCqOc%0AcLlC6WFOlZ3E5Xp2w1M%3D%0A>
 
- 
Go to your website host provider's settings and enter the TXT and CNAME records.
- 
Then, come back to Vanta and refresh the page to view the domain's status.
- 
 
- 
AWS Route 53 Example:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771071/0e98e1cdb3fd58dd267bc6093c79/34964321821972?expires=1794967200&signature=d30f98be34b15cecf32df994449798fb1d3545dd030f7e3e530d4b5f0a2a0dad&req=dSUmEM55nIFYWPMW1HO4zTm9vExswjIcpLrtYDB5ple8nQ0XiK7ryHvX4sZL%0AdziWCi8ekriup22ljkI%3D%0A>
- 
 
- 
You’ll notice the suffix of .datastartup.net is auto-filled by route53.
- 
Add the CNAME record
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771077/5fad07a756a9bfe2a74b0f402624/34964321824020?expires=1794967200&signature=07776065cc4bde96950358b17b566c6651be77b7034e35ae4a3c476f3dd873d4&req=dSUmEM55nIFYXvMW1HO4zesdoSilrI7PRCDYVtrDyvs0MQe%2BjmSjQnnY89r9%0AuTe3uLkw0oD3%2FKC3nSw%3D%0A>
 
- 
Submit and wait for the new domain to be set up. This can take up to 10 minutes
- 
The custom domain show now shows the public Trust Center.
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516771073/292a733fe9e0f95f3b119b0b44b7/34964321825044?expires=1794967200&signature=5ec6c51854b8583dde9052a36f20c348051a19eb6211bb5a096e755726d3a8d8&req=dSUmEM55nIFYWvMW1HO4zZ7QRoRH8MYAeF2Z0OYTDQ5wnwGYHv2xu5HzM7m2%0Arj72mGAi%2Fv9CN%2F%2FlqTA%3D%0A>
 
CAA Records. A Certificate Authority Authorization (CAA) DNS record specifies which Certificate Authorities (CAs) are allowed to issue certificates for a domain. If your root domain uses CAA records, you'll need to add new records to allow us to issue certificates for the custom domain on your behalf.
 # CAA records added by DigiCert
0 issue "digicert.com; cansignhttpexchanges=yes"
0 issuewild "digicert.com; cansignhttpexchanges=yes" 

# CAA records added by Sectigo 
0 issue "sectigo.com" 
0 issuewild "sectigo.com" 

# CAA records added by Let's Encrypt 
0 issue "letsencrypt.org" 
0 issuewild "letsencrypt.org" 

# CAA records added by Google Trust Services 
0 issue "pki.goog; cansignhttpexchanges=yes" 
0 issuewild "pki.goog; cansignhttpexchanges=yes"

## Images

- [image 01] ../../images/ux/trust-center/creating-your-custom-domain-trust-center--01.png
- [image 02] ../../images/integrations/aws/creating-your-custom-domain-trust-center--02.png
- [image 03] ../../images/integrations/aws/creating-your-custom-domain-trust-center--03.png
- [image 04] ../../images/ux/trust-center/creating-your-custom-domain-trust-center--04.png
