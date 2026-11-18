# Missing AWS EC2 Instances

Source: https://help.vanta.com/en/articles/11345864-missing-aws-ec2-instances
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

Administrators may notice that their servers (EC2 instances) from AWS autoscaling groups (ASG) are missing from the Compute instances section of the Inventory page <https://app.vanta.com/inventory#compute>. This is expected behavior. Vanta lists the autoscaling groups the instances belong to in the Autoscale section of the Inventory page:
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756440/b0238683bdd79c54f1b8b30afb73/29399448025108?expires=1794967200&signature=d21d749f865a60065a5a2ce1219dc34c977a56660a82dda90ad621ad545dd9fa&req=dSUmEM57m4VbWfMW1HO4zTrr1DBtjfeT33vKuLA5XZvq7YkEtU6YFlcfcDl%2B%0ALmykl6CnpUqQtLR8S%2BY%3D%0A>

There, administrators can click the purple instance link:
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756441/e2d400d28b7a08383b57a619ef8f/29399432776084?expires=1794967200&signature=d865f4c703c008fe1f35de13808bb9e0321471c081d9dbed9a9adc36abed914f&req=dSUmEM57m4VbWPMW1HO4zQwXRl9v%2FA8PgN8DdiIUuHPuhi2%2FlQ%2BBmrYWA9Oq%0A9asdS6EkWpc3Z9ln7Zg%3D%0A>
 
To view the instances in that autoscaling group:
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756448/391adadfa8ce0a89593927ba1d73/29399432776212?expires=1794967200&signature=0af761b1b4c93e54f5a53016360f23d27c0e6b3b67d5ce5c87d1cd70251cfa2d&req=dSUmEM57m4VbUfMW1HO4zTs2hbkjO7sdb0EmJuy43iyB4VooJfoOuv7i1Rs4%0Amb7pWToDQ50NPSDo%2Bv0%3D%0A>

​
This also means the Vulnerabilities page will display vulnerabilities for the autoscaling group rather than the individual instances:
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516756439/9e0bfdefc8fc67027306481ec64b/29399448025748?expires=1794967200&signature=efea9948fba242bde13ef5641e4ac53759bcbfebabab01f7d4e2dfe743087080&req=dSUmEM57m4VcUPMW1HO4zdETZQ9bie7UimLkAhr1Oue78ctSGglkhd7tdLPI%0AX3RzxZ%2FNHxijUAqDQfY%3D%0A>
 
Administrators would need to update the image being used on the auto-scaling group, and that should resolve the vulnerabilities for the nodes when they get redeployed.
 
If instances outside of autoscaling groups are missing, please go through the steps in How to troubleshoot AWS resources not Appearing in Inventory <https://help.vanta.com/en/articles/11345619> to further troubleshoot.

## Images

- [image 01] ../../images/ux/inventory/missing-aws-ec2-instances--01.png
- [image 02] ../../images/ux/inventory/missing-aws-ec2-instances--02.png
- [image 03] ../../images/ux/other/missing-aws-ec2-instances--03.png
- [image 04] ../../images/ux/vulnerabilities/missing-aws-ec2-instances--04.png
