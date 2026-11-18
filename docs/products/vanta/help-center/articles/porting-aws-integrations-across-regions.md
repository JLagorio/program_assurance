# Porting AWS Integrations Across Regions

Source: https://help.vanta.com/en/articles/11345698-porting-aws-integrations-across-regions
Collection: Integrations ; Integrations › Integrations by Type ; Integrations › Integrations by Type › Cloud Providers
Fetched: 2026-11-17

## Article text

Vanta users with an AWS integration must create an IAM role granting permissions to a Vanta AWS account. Vanta has different AWS accounts across regions, any customer migrating from one region to another region will need to update their IAM role. If this is not done, Vanta cannot integrate with AWS post-migration, resulting in potentially incorrect data and test results.

## Instructions
- 
Open the AWS console and navigate to the vanta-auditor IAM role (https://console.aws.amazon.com/iamv2/home#/roles/details/vanta-auditor <https://us-east-1.console.aws.amazon.com/iamv2/home#/roles/details/vanta-auditor?section=trust_relationships>). This role should have been created when the Vanta integration was first set up.
- 
Open the Trust relationships tab and click the Edit trust policy button. The trust policy should look something like:{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::XXXXXXXXXXXX:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "XXXXXXXXXXXXXXX"
        }
      }
    }
  ]
}
- 
The Principal AWS value should be replaced like in the following example. Only the Principal AWS should be updated; the ExternalId should be left intact.{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Effect":"Allow",
      "Principal":{
         "AWS":[
            "arn:aws:iam::956993596390:root",
            "arn:aws:iam::850507053895:root",
            "arn:aws:iam::654654195764:root"
         ]
      },
      "Action":"sts:AssumeRole",
      "Condition":{
        "StringEquals":{
           "sts:ExternalId":"XXXXXXXXXXXXXXX"
        }
      }
    }
  ]
}
- 
Repeat steps 1, 2 and 3 for every AWS account you have integrated with Vanta.

## Images

- none
