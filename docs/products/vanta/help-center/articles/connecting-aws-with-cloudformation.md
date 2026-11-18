# Connecting AWS with CloudFormation

Source: https://help.vanta.com/en/articles/11345623-connecting-aws-with-cloudformation
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

When integrating an AWS account, customers have the option to connect using CloudFormation:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762543/4c49e066d2c2d196c7f966058ccb/15213712646036?expires=1794967200&signature=c7822b2d996f980ede0c690aea73c9308ecef9775ef4fadb3f53624354c10c59&req=dSUmEM54n4RbWvMW1HO4zelfdWlRt8GxFIOYO7mvFKmW9NXkuClpQ2aAjEhq%0ALqtqStaIh8klxWkjppI%3D%0A>
- 
Once you have selected the options above, select Next in the bottom right corner to continue with the next steps.
- 
On the next page, select if you will be integrating a standard AWS account or an AWS GovCloud account
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762544/5367898f6d7a2d782f61277111c9/15213850678420?expires=1794967200&signature=675336ba740b7845f63720d82af45669d0a486894b33f65690d231a58de2918f&req=dSUmEM54n4RbXfMW1HO4zWFMo4XHtO%2FSr4VV1Kc0BQta%2Bbx8ulI%2BRwxq%2FPx7%0A0oOGX3dknNbe7qYMpSQ%3D%0A>
- 
Next, select which AWS products that you would like Vanta to scan
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762541/a1efb5409c6d3f1102d170ff4940/15213914945812?expires=1794967200&signature=761b5038195e13f925ab6af6be0d1fcfbd1af8e65f50c05ae535245ba04411d7&req=dSUmEM54n4RbWPMW1HO4zaWjqtdKIg1ls8X9hCX0IcsyLZinb%2FPtcrns%2BAOO%0AB7VjvAp24Y8wVRrAD%2Fs%3D%0A>
- 
On the following screen, download the .yaml file
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762545/0cf40db860a034b1dc42e8744a73/15215029916820?expires=1794967200&signature=bfdc05b207cc91ba1a4de8ce203c61bda3654e0af64e114fe939e5014674cbec&req=dSUmEM54n4RbXPMW1HO4zfD2DowpyBcUCja0fiYi8Px%2BOAmIweUrfSmPKWp1%0ARE1TqPw2inBiPoyGd4g%3D%0A>
- 
Navigate to AWS CloudFormation <https://aws.amazon.com/cloudformation/> and create a new Stack using the "With new resources (standard)" option
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762553/b3d74783ac1b814d277eaf77390c/15231286709780?expires=1794967200&signature=e25d4bde81837c768507dfa28c89ce8ff1abfae12a8424f7855544cbc9ede66d&req=dSUmEM54n4RaWvMW1HO4zZgFiX2mHQmwUjZ2FxT1CvivIZ9z3zBTtYhwLNbT%0ACpupHUL5BZLcqzFfIp8%3D%0A>
- 
On the Create Stack page, select the following options and upload the .yaml file you downloaded from Vanta
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762552/599070e86ab86b5961b397b02827/15231380184084?expires=1794967200&signature=421fa6c19c0c2152f6aad04a2fba6b97556a8bf299e6c8814f7794f580709927&req=dSUmEM54n4RaW%2FMW1HO4zWnec8jQSkOTpMNvC4kbNiTE73plhDexHYr28OlQ%0AAX2nCyqE35ayM4hXHSc%3D%0A>
- 
On the Specify stack details page, provide a stack name, and the other parameters should be pre-filled based on the file you previously uploaded.
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762551/152598ee3a44595866256543502c/15231378288532?expires=1794967200&signature=24fa03dd868b09d4f8786f8ebbb6fd530066712b97dc5837df435f88514b47d6&req=dSUmEM54n4RaWPMW1HO4zWnCtay%2BRF62h%2F4%2BvjGEGTYYrzzPmL42JZxuXe4Z%0A2QlZssvTYCV0raxbgHk%3D%0A>
- 
There is no need to Configure stack options. You can leave the defaults or update them as you wish and move on to review.
- 
At the bottom of the Review page, ensure to select the acknowledgment at the bottom of page and hit Submit
- 
Once the stack completes, you can click on the "Outputs" tab and copy the role ARN that was created:
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762554/62caa8915e498778c12bd411d52f/15231420144148?expires=1794967200&signature=deaeffd849ff55312dabc899676874f3ec02ec0681512b06af7e16cbe50c9e41&req=dSUmEM54n4RaXfMW1HO4zaL1SqGqBUt1ipFtVLcbcdyPHA2RgCdJidJU%2Bn%2B9%0A0GST%2BFvJ0dB5KtLSz%2F0%3D%0A>
- 
After you've copied the role ARN, you can head back to Vanta and paste it here:
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516762562/3627fdc68988d005e833397cf1a3/15215634508308?expires=1794967200&signature=2a7e3440170b23a6b0bc325077a5faa5cfbd2515f0e302ec4522259d46ff7ea2&req=dSUmEM54n4RZW%2FMW1HO4zUkycidKkK9082zldVnIvbpkwxBw1VYeZQs%2Fy8vS%0AJL4QF6AK9PWxgqwOjzw%3D%0A>
- 
After clicking next, you can configure the regions that you would like Vanta to read in resources from and mark any resources out of scope as necessary

## Images

- [image 01] ../../images/ux/integrations/connecting-aws-with-cloudformation--01.png
- [image 02] ../../images/ux/integrations/connecting-aws-with-cloudformation--02.png
- [image 03] ../../images/ux/integrations/connecting-aws-with-cloudformation--03.png
- [image 04] ../../images/integrations/aws-with-cloudformation/connecting-aws-with-cloudformation--04.png
- [image 05] ../../images/integrations/aws-with-cloudformation/connecting-aws-with-cloudformation--05.png
- [image 06] ../../images/integrations/aws-with-cloudformation/connecting-aws-with-cloudformation--06.png
- [image 07] ../../images/integrations/aws-with-cloudformation/connecting-aws-with-cloudformation--07.png
- [image 08] ../../images/integrations/aws-with-cloudformation/connecting-aws-with-cloudformation--08.png
- [image 09] ../../images/ux/integrations/connecting-aws-with-cloudformation--09.png
