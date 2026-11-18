# Missing Metrics for Load balancer server errors monitored (AWS) Test

Source: https://help.vanta.com/en/articles/11346031-missing-metrics-for-load-balancer-server-errors-monitored-aws-test
Collection: Optimizing your Workflow ; Optimizing your Workflow › Troubleshooting
Fetched: 2026-11-17

## Article text

When attempting to remediate the  Load balancer server errors monitored (AWS) <https://app.vanta.com/monitors#load-balancers-monitored-and-alarmed-config-servererrors>, administrators may notice that the metrics listed do not appear as selectable options when creating an Alarm. This is a blocker for creating the alarm, but the good news is administrators can get around this by adding the metric via JSON. This article will provide steps on how to do this for Applications and Classic load balancers.
 

## Steps for Application Load Balancers
- 
Head into EC2 and click Load Balancers on the left-hand menu
[image 01]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767335/284dd2efd0272d4c87456e81a14b/11966165923988?expires=1794967200&signature=98fade48b0e3f75c76c856dcc74df5b3851b3564864e81e8062262212ca76b4d&req=dSUmEM54moJcXPMW1HO4zY%2FUZOCbEQKGDT86LOMoiPl9KCOVUoo%2FoVbZpaho%0A%2Bjczqfju28jirpzha%2FM%3D%0A>
 
- 
Click into the load balancer you want to remediate
 
[image 02]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767302/c13900bb313773730d2fc37f4e9e/11966222745108?expires=1794967200&signature=d50dead71a65be05fd8e583b9c9b2bc8dc3f0b30cff434f6142ec24714bceb19&req=dSUmEM54moJfW%2FMW1HO4zfkmTPsXfYh1CXSn6RjF%2FNe7iWEaAHleQ5vFobar%0AsB0Kgtvak01XqmkaHmo%3D%0A>
 
- 
You should be taken to the details page for the selected load balancer, now copy the full name of the load balancer starting from 'app/' from under the Details drop-down box
 
[image 03]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767299/79b5c3f7608e2ff97f5cd5ef6156/11966229110420?expires=1794967200&signature=3d476eccf5b03b7a56dba4aa58b8991fb2766762cd1baa7662ba4e4cbf867a3d&req=dSUmEM54moNWUPMW1HO4zX7NSfD%2Fofd9zFpsKZgfedvAHauUjgbVpMl8n0VO%0A6iO0BHO2L2SdIBRNG1I%3D%0A>
 
- 
Also, make note of the region the load balancer exists in; if you are not sure about this, you can click on the item on the test page and see the region the load balancer exists in
 
[image 04]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767301/1f449888c4b02f290a4850f3956d/27565507861140?expires=1794967200&signature=ed51230d5bbf0b5dcf004fae900868bd16e9ffda5d01ba4fe55ac657492ff89f&req=dSUmEM54moJfWPMW1HO4zaZsnxG8E9w0RZP0RCgrSQIsmH2Q1xaL3%2BB6KJtk%0AQ2pZiBL8Q4dDAlsGNdE%3D%0A>
[image 05]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767342/03e43d096978f5ad32aa46096d1f/27565507875220?expires=1794967200&signature=f6eb31a2818600a0dbb6923b17b27810f6b1319f467271ba9b843399bae14442&req=dSUmEM54moJbW%2FMW1HO4ze7AGNohxyvqlulSHPJh56DXyG9D7cIkSI4Sc%2BDV%0AYcS%2FM%2B4c8XDl2QGj3PY%3D%0A>
- 
Now please open your text editor of choice and paste in the following JSON text:
​{

"metrics": [

[ "AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", "NAME", { "stat": "Average" } ]

],

"view": "timeSeries",

"stacked": false,

"period": 300,

"region": "REGION"

}
 
- 
Replace 'NAME' with the name of the load balancer you copied from the details section, and replace 'REGION' with the region the load balancer exists in:
​
​
[image 06]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767348/256d6cea1fd7ee317e0cf9a7022e/11966417334548?expires=1794967200&signature=dea962572aeb59b32be3e6757a1e5bf587c27efbce7f506bc68a091344e1858d&req=dSUmEM54moJbUfMW1HO4zRfsYmCS7AfGhWlRcpRVCuQK9jKcixquKxVod571%0A%2B6xW%0A>
 
- 
Once that is complete, now head back into AWS and go to Cloudwatch to create a new alarm
- 
Click Select Metric
 
[image 07]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767346/5aa8b9eb85f6dea425c4adb83060/11966502290964?expires=1794967200&signature=7e5491deebde710354d9965efe2a2f9c8a609a55fe2bab90865280a70220ed52&req=dSUmEM54moJbX%2FMW1HO4zepnXnW8kxle8ZwfDD79cS6hwtQunz6I2cOY%2Fb1i%0A7IJstvAAVaTQvdl9UiA%3D%0A>
 
- 
Then select the 'Source' tab:
 
[image 08]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767372/5ad605a51dc872db84fa9dced3b4/11966564964372?expires=1794967200&signature=13e7ca916a05df9039744fd5f9f088e4de239dda1fe2a6eb1974d99b53aa2297&req=dSUmEM54moJYW%2FMW1HO4zdPQVKeRDPGUSIutVwgQLjyb6t%2FAorVEcSy0AJWB%0AIIFyYlGsQXXgXVdVww8%3D%0A>
 
- 
Now Paste in the JSON from the text file with your load balancer name and region updated
 
[image 09]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767377/051beb321f5efe33efcef0eb0e0b/11966595662356?expires=1794967200&signature=77ec81b18b519882f30579d688ddc707b9e125690ee0cd694e60441546e548e0&req=dSUmEM54moJYXvMW1HO4zZs2%2BDXzKMGDBnXyoSXq6w%2Bg%2F7JawyTaRfGgSNd6%0Aij5mmqDAidKur%2FzLlc8%3D%0A>
 
- 
Now click Update on the top right under Add query
 
[image 10]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767373/befc2b51c669853f74d118a847b6/11966635645332?expires=1794967200&signature=45d6a5184cf4c34c8794fd2158329423b2c3e1a085d271cd28566b722dae53e8&req=dSUmEM54moJYWvMW1HO4zdKXIhgeoHBlrZ1EhSd6%2F1LjPWlPBsb2L%2F%2F4YTrN%0AQ7H20DPdenGfnEeuICQ%3D%0A>
 
- 
Then click Select Metric on the bottom right
 
[image 11]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767376/9ff834d20f3bf0488b9d3eb33b9f/11966640159124?expires=1794967200&signature=a3b461b6699ab930e1ba51d1a3fbae22d12b6fc242c48298d2e79f686fb69674&req=dSUmEM54moJYX%2FMW1HO4zeIWj8%2F95HY%2FkLQFTHfW7xqPp6h7zTavIhjuqViU%0AX9Y8%2BNnoTjCgkPN8r5U%3D%0A>
 
- 
You will be taken to a screen where you can now customize the statistic AWS will monitor by clicking the looking glass and choosing your desired stat
 
[image 12]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767391/263cba797ea715ec29f698955ed7/11966916736404?expires=1794967200&signature=a79fdfedf12ded8364457a258f1aaaa5dafe8a70bd572f09da96e5a686a1402a&req=dSUmEM54moJWWPMW1HO4zZt2vtvpm10%2FtLPxHYziG0IosJH4WHUOSgl2USch%0AqKQee0TjlPAAnZhKCmE%3D%0A>
[image 13]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767392/c1312329bb00f7203622e5c0e92e/11966964268180?expires=1794967200&signature=321100240998e3adaca85e90f992fa2222bc0baf6cfeb288165b71a545e66f5e&req=dSUmEM54moJWW%2FMW1HO4zdN1s1gSOzPirEAJlMJahXiIPKb6fBa9w2l8GS9F%0A04YAJOPGn8%2Bje%2BVMnw4%3D%0A>

You can also change the period, but the metric name and load balancer name should not be modified!
- 
You can scroll down and also specify the conditions to your liking and click next to finish
[image 14]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767396/810ac4f773b611a23be677735c01/11966903182740?expires=1794967200&signature=bc71e8e7a20099c103e2ebeab2609520061f63bcb4f7da2c8fd5d23281be201f&req=dSUmEM54moJWX%2FMW1HO4zRTkPtI%2FAVP5ybimem1qOtZnOs%2FmPW17mCT3BdSc%0AXa19MNwcbvm%2B%2F7yhVEs%3D%0A>
 
- 
You can finish creating the alarm as normal (provide name, description, and configure notifications settings). Once the alarm is created, Vanta should pick this up in an hour, and the load balancer should no longer be flagged on the test page.
​​

## Steps for Classic Load Balancer
- 
Head into EC2 and click Load Balancers on the left-hand menu
[image 15]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767335/284dd2efd0272d4c87456e81a14b/11966165923988?expires=1794967200&signature=98fade48b0e3f75c76c856dcc74df5b3851b3564864e81e8062262212ca76b4d&req=dSUmEM54moJcXPMW1HO4zY%2FUZOCbEQKGDT86LOMoiPl9KCOVUoo%2FoVbZpaho%0A%2Bjczqfju28jirpzha%2FM%3D%0A>
 
- 
Click into the load balancer you want to remediate
 
[image 16]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767404/bcae5454c56a5961a69af87f666a/11967846346132?expires=1794967200&signature=eceab881ef8e96803814d37154331ff310df4d17a73a3d6a7b2654808cf7b234&req=dSUmEM54moVfXfMW1HO4zbM%2FAJWCLvJIyNnLRRkRkAJ%2F0uy3UMdAqa4kh%2FBq%0A%2FZhGkGkTUbBuYXtoTqY%3D%0A>
 
- 
You should be taken to the details page for the selected load balancer, now copy the full name of the load balancer:
​
​
[image 17]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767410/1b5d24b93c26431a39e9c927c914/11967865470868?expires=1794967200&signature=a1fb7c04f7321f1b7d0edacdd28cb0ca7aad6ba1f57245b81d283284a620c46d&req=dSUmEM54moVeWfMW1HO4zSHj1IrmDUuVm9%2BDN2iuv7ViVeg%2FM8l5QsYMKOXS%0Aj6Fn%0A>
 
- 
Also, make note of the region the load balancer exists in; if you are not sure about this, you can click on the item on the test page and see the region the load balancer exists in
​
​
[image 18]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767301/1f449888c4b02f290a4850f3956d/27565507861140?expires=1794967200&signature=ed51230d5bbf0b5dcf004fae900868bd16e9ffda5d01ba4fe55ac657492ff89f&req=dSUmEM54moJfWPMW1HO4zaZsnxG8E9w0RZP0XiwtQDjeKXN0l5U8sq6%2BdWqK%0A%2B99r%0A>
[image 19]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767342/03e43d096978f5ad32aa46096d1f/27565507875220?expires=1794967200&signature=f6eb31a2818600a0dbb6923b17b27810f6b1319f467271ba9b843399bae14442&req=dSUmEM54moJbW%2FMW1HO4ze7AGNohxyvqlulSBvZn7ppPyJHJodzCd3EqgJNn%0AIzcU%0A>
 
- 
then, please open your text editor of choice and paste in the following JSON text
 {

"metrics": [

[ "AWS/ELB", "HTTPCode_Backend_5XX", "LoadBalancerName", "ENTER_NAME_HERE", { "stat": "Average" } ]

],

"view": "timeSeries",

"stacked": false,

"period": 300,

"region": "ENTER_REGION_HERE"

}
 
- 
Replace 'ENTER_NAME_HERE' with the name of the load balancer you copied from the details section, and replace 'ENTER_REGION_HERE' with the region the load balancer exists in
 
[image 20]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767414/6debe668851ea8fdaf1014dfaad4/11967992768916?expires=1794967200&signature=27426b33a90eb0f50be21d642ab94095e29bccc902f90821ebb2bc177a2baf5d&req=dSUmEM54moVeXfMW1HO4zZtZRzBhjCb2QFgHzGIAHxVTDp1DNXzs7HILTQTq%0AXnsjXbRwbWOado9kVqY%3D%0A>
 
- 
Once that is complete, now head back into AWS and go to Cloudwatch to create a new alarm
- 
Click Select Metric
 
[image 21]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767346/5aa8b9eb85f6dea425c4adb83060/11966502290964?expires=1794967200&signature=7e5491deebde710354d9965efe2a2f9c8a609a55fe2bab90865280a70220ed52&req=dSUmEM54moJbX%2FMW1HO4zepnXnW8kxle8ZwfDD79cS6hwtQunz6I2cOY%2Fb1i%0A7IJstvAAVaTQvdl9UiA%3D%0A>
 
- 
Then select the Source tab
 
[image 22]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767372/5ad605a51dc872db84fa9dced3b4/11966564964372?expires=1794967200&signature=13e7ca916a05df9039744fd5f9f088e4de239dda1fe2a6eb1974d99b53aa2297&req=dSUmEM54moJYW%2FMW1HO4zdPQVKeRDPGUSIutVwgQLjyb6t%2FAorVEcSy0AJWB%0AIIFyYlGsQXXgXVdVww8%3D%0A>
 
- 
Paste in the JSON from the text file with your load balancer name and region updated
 
[image 23]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767422/c1b7345609cf85c5de7f5fdf29af/11968053922964?expires=1794967200&signature=65608666b837d35fb682434b14a559a9a0d02635c484ba4db5facb677f4a5d21&req=dSUmEM54moVdW%2FMW1HO4zRpsvRMzi4WxBz3RmDQ1mIPiL7LEGF55zgvQ1AU4%0AEVrAzBgmt4BPmzwflt0%3D%0A>
 
- 
Click Update on the top right under Add query
 
[image 24]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767426/f69a6581ae264e4b2d1bb4bae2a3/11968063248276?expires=1794967200&signature=d0c53862ca9844dbdea3f9c4df65e8b9027a103b491456f82fc2acb67d59998f&req=dSUmEM54moVdX%2FMW1HO4zcddd3KgXJeVPfYsB6hrs8Lmu5ZFUjLuxiV6IhBW%0Am7M9KqR3krqAQObPh9Q%3D%0A>
 
- 
Then click Select Metric on the bottom right
 
[image 25]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767429/6f8a861633ea99bef176712ebfd6/11968057912084?expires=1794967200&signature=f6a96d31c557fd90ad79ed90edc61f2ef09ff121a7f722522b7ad4c227be4146&req=dSUmEM54moVdUPMW1HO4zYuqdVOMurjkTztsd1ACJAFE8x1rNn0AEBCMOTZJ%0ANdWM%2FTpuOCeDdcFwn4M%3D%0A>
 
- 
You will be taken to a screen where you can now customize the statistic AWS will monitor by clicking the looking glass and choosing your desired stat
 
[image 26]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767433/b621bb577f23e9465c8d3c945da2/11968145169812?expires=1794967200&signature=09339e491a82299335f1f0a85626c6fa811fdf9f91403a06a84b9cea7c4f77bd&req=dSUmEM54moVcWvMW1HO4zTKG6rNbSAfjaQbvsjzkMnednLzJVRNrLHMFQ6r1%0AidoTeXx%2BzEK1rMH5vxQ%3D%0A>
[image 27]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767392/c1312329bb00f7203622e5c0e92e/11966964268180?expires=1794967200&signature=321100240998e3adaca85e90f992fa2222bc0baf6cfeb288165b71a545e66f5e&req=dSUmEM54moJWW%2FMW1HO4zdN1s1gSOzPirEAJlMJahXiIPKb6fBa9w2l8GS9F%0A04YAJOPGn8%2Bje%2BVMnw4%3D%0A>
 
- 
You can also change the period, but the metric and load balancer names should not be modified
- 
You can scroll down and also specify the conditions to your liking and click next to finish
 
[image 28]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767396/810ac4f773b611a23be677735c01/11966903182740?expires=1794967200&signature=bc71e8e7a20099c103e2ebeab2609520061f63bcb4f7da2c8fd5d23281be201f&req=dSUmEM54moJWX%2FMW1HO4zRTkPtI%2FAVP5ybimem1qOtZnOs%2FmPW17mCT3BdSc%0AXa19MNwcbvm%2B%2F7yhVEs%3D%0A>
 
- 
You can finish creating the alarm as normal (provide name, description, and configure notifications settings). Once the alarm is created, Vanta should pick this up in an hour, and the load balancer should no longer be flagged on the test page.
 

## How Can I Change the Metric in The JSON?
If you prefer to use a different metric, then you can replace the metric name in the JSON (highlighted below)
​
​
[image 29]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767444/4ac3881b8d05c4e8a1cb8b8362c1/11969052319252?expires=1794967200&signature=e8c02f8462b0d31df02587e8ec3cc90a632662b2b43398eedbb8821755f424d6&req=dSUmEM54moVbXfMW1HO4zcDrjJAQ3V2G0VmdIAnWgfYQLBEzzNuLalc5axd2%0A4AXyOLPaL3rw6AbEqxc%3D%0A>
 
With one of the other supported metrics listed on the test page How to fix section: 
​
​
[image 30]
 <https://vanta-e0817867462a.intercom-attachments-7.com/i/o/t4a8cs4z/1516767446/140b16d29f8dd8b268bee7bb1f06/27573618782100?expires=1794967200&signature=4e607d21a5fc0374168ec3cc345a98d49ff78baa0e8d0f827378f98af6a8a1cd&req=dSUmEM54moVbX%2FMW1HO4zZA%2FmpQrc10F4ifjO3dlwZtmdkCTC5l8bd1VGt78%0Audj3yU1aHJdDY2vU2R0%3D%0A>

## Images

- [image 01] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--01.png
- [image 02] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--02.png
- [image 03] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--03.png
- [image 04] ../../images/ux/tests/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--04.png
- [image 05] ../../images/ux/inventory/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--05.png
- [image 06] ../../images/documentation/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--06.png
- [image 07] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--07.png
- [image 08] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--08.png
- [image 09] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--09.png
- [image 10] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--10.png
- [image 11] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--11.png
- [image 12] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--12.png
- [image 13] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--13.png
- [image 14] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--14.png
- [image 15] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--01.png
- [image 16] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--16.png
- [image 17] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--17.png
- [image 18] ../../images/ux/tests/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--04.png
- [image 19] ../../images/ux/inventory/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--05.png
- [image 20] ../../images/documentation/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--20.png
- [image 21] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--07.png
- [image 22] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--08.png
- [image 23] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--23.png
- [image 24] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--24.png
- [image 25] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--25.png
- [image 26] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--26.png
- [image 27] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--13.png
- [image 28] ../../images/integrations/aws/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--14.png
- [image 29] ../../images/documentation/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--29.png
- [image 30] ../../images/ux/tests/missing-metrics-for-load-balancer-server-errors-monitored-aws-test--30.png
