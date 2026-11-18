# Website TLS Tests

Source: https://help.vanta.com/en/articles/11346040-website-tls-tests
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Vanta has multiple tests that scan your websites TLS implementation to ensure that it is secure. These tests include:
 

## Checking that your site's certificate has not expired
- 
This test will fail as soon as the certificates expiration has been reached.
 

## Checking for valid TLS configuration
- 
This would include checking for valid certificates, valid certificate chains, and ensuring proper TLS versions are in use. You can validate TLS implementation by downloading openssl <https://www.openssl.org/source/> and running the following command:
- 
openssl s_client -connect example.com:443 
 

## Checking the all queries to your page redirect to HTTPS
- 
This test checks that when a query is made to your company's website explicitly using port 80 (http://yourdomain.com <http://yourdomain.com>), a 301 redirect is received and automatically redirects clients to use https on 443. You can confirm this by running the following command on your machine using cURL:curl -i http://yourdomain.com
 
See this example of a valid setup using google.com:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767796/5e8fc8932c26262a1390823fd2a7/19785141931284?expires=1794967200&signature=54afb5ff725f546c2d39872cd972db54d12c5841792c354f46bc3c6bce9e2c76&req=dSUmEM54moZWX%2FMW1HO4zb%2FU36MB7giGDWOSMx6%2FztUIVzdJj3MpqEc%2Bln34%0Ae2CaxPw%2FoFDWqs0Dl0Y%3D%0A>
 
If this command returns 200 OK, this means that your website can be accessed insecurely via http directly.
 

## Checking that there are no weak ciphers available for use
- 
This includes ciphers with known vulnerabilities, as well as ciphers that do not match or exceed the strength of the certificate key.
 

## Troubleshooting
If Vanta states that there was trouble getting data for any or all of these tests, please update your business URL on the settings page in Vanta <https://app.vanta.com/settings/business-information>. We recommend using the format "https://yourbusinesswebsite.com <https://yourbusinesswebsite.com>"
 
This is the URL that Vanta uses to check for TLS configuration. If you are looking for more information regarding why a certain TLS test may be failing, please use the SSL Labs test here <https://www.ssllabs.com/ssltest>, as it will provide much more detailed information on configuration issues in your environment. For example:
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767795/2479f7850598b39ac3bae67e7cf5/10599996166036?expires=1794967200&signature=95abdbf2f41208270ef23a865762a922c7de70a2114a6f4292aac9a7dc0d8a96&req=dSUmEM54moZWXPMW1HO4zVmzXpaEvOSZf764UPIjZ8mMMsulCuFLr%2FwDvV14%0AOTpiU0FMhL%2BuV%2BD86C8%3D%0A>

## Images

- [image 01] ../../images/documentation/website-tls-tests--01.png
- [image 02] ../../images/documentation/website-tls-tests--02.png
