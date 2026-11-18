# Vendor Risk Scoring

Source: https://help.vanta.com/en/articles/11345560-vendor-risk-scoring
Collection: Risk, TPRM & AI Gov ; Risk, TPRM & AI Gov › Third-Party Risk Management
Fetched: 2026-11-17

## Article text

✅ Feature availability: Some features (like automated and customized inherent risk scoring) may require a TPRM add-on. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Vendor risk scores help you prioritize vendors, tailor assessments (such as security assessments), and make consistent decisions across vendor onboarding, monitoring, and remediation. We calculate an inherent risk score for each vendor using your inherent risk rubric in vendor settings, and you can assign a residual risk score after you review a vendor’s assessments.
 
⚙️ User permissions: Editors and Admins can edit the inherent risk rubric and manage risk scores for all vendors. Collaborators assigned as a Business Owner or Assessment Owner on a vendor can set risk scores for that vendor and its assessments. Learn more <https://help.vanta.com/en/articles/11345590-user-permissions-by-product-area>
 
 

## Inherent risk rubric settings
Your inherent risk rubric defines how to calculate inherent risk scores. It’s made up of sections, which group related attributes. An attribute is a risk factor, like a type of data a vendor handles. You assign each attribute an inherent risk score, which we use to calculate each vendor’s inherent risk score. You also map each attribute to the vendor categories it applies to. You can start with our default rubric and edit it to fit how you assess vendors.
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2790868632/83ca887c107c1ba5e27625c2faac/image.png?expires=1794967200&signature=b454111428b67c257b5245fb7f8af90b4124c2d6c82daa52f468ee1de8e1cdb8&req=dicuFsF4lYdcW%2FMW1HO4zYOozBe5rmoKr%2Fnav%2BdWFLGaf6E8YvfhazPcwWfM%0AEUQccFg9SAoQD%2Bipn7Y%3D%0A>
 
⚠️ Note: If auto-scoring is on, saving changes to the inherent risk rubric can recalculate the inherent risk scores of your vendors. Learn more
 

### Editing your risk rubric
 
To edit your inherent risk rubric:
- 
Go to Settings.
- 
In the page menu, scroll to Features and select Vendors > Inherent risk rubric.
- 
Click Edit this rubric.
- 
Click a section to expand it and review its attributes.
- 
To change a section:
- 
To edit a section, click the pencil icon next to it.
- 
To add a custom attribute, click the + icon next to it.
- 
To edit an attribute:
- 
Click the pencil icon next to the attribute.
- 
In Mapped to, select the vendor categories the attribute applies to. The list includes built-in and custom categories. Learn more <https://help.vanta.com/en/articles/11345559-adding-and-managing-vendors>
- 
Click Done.
- 
Click Save.
 

### Editing custom attributes
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2790870818/9fa26d27016bec7a2467f24ad5c5/image.png?expires=1794967200&signature=85137ea73a55a115573a52977f1077c1b9876cb0cdb7fd537b6d3f22e6af8aeb&req=dicuFsF5nYleUfMW1HO4zeuf3aGuFIPO5yHZAyslYUnWPkjdC%2FbKHR%2F3r%2Fap%0AM4u%2BhoCjdkVAefsmk%2Fc%3D%0A>
 
To add a custom attribute:
- 
Go to Settings.
- 
In the page menu, scroll to Features and select Vendors > Inherent risk rubric.
- 
Click Edit this rubric.
- 
Click a section to review the current attributes.
- 
Click the + icon next to the section where you want to add the attribute.
- 
In the modal:
- 
Enter a Name.
- 
Use the Status toggle to turn the attribute on or off.
- 
Enter a Description.
- 
Select an Inherent risk score: Critical, High, Medium, or Low.
- 
In Mapped to, select the vendor categories the attribute applies to. The list includes built-in and custom categories.
- 
Click Done.
- 
Click Save.
To rename or delete an attribute, click the pencil icon next to it. Update the Name and click Done, or click Delete. Then click Save. (You cannot delete an attribute that’s connected to an automated test.)
 

### Editing custom sections
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2790871069/79f8bafedb2c9e8484622113817b/image.png?expires=1794967200&signature=25938d72fc339ecaa6706e1c1923a7e501b5cba623e541a4a9267776fbed1cff&req=dicuFsF5nIFZUPMW1HO4za5XCn%2BK%2BH59UYgbGagIltKu9ECfoFvo13ivvsh5%0AdIRkWHrbVB%2FCGD2Itso%3D%0A>
 
To manage custom sections:
- 
Go to Settings.
- 
In the page menu, scroll to Features and select Vendors > Inherent risk rubric.
- 
Click Edit this rubric.
- 
In the rubric editor:
- 
To add a section, click Add new section.
- 
To rename, enable, disable, or delete a section, click the pencil icon next to it.
- 
In the modal:
- 
Enter or update the section Name.
- 
To disable an existing section, use the Status toggle. This turns off every attribute in the section.
- 
To delete an existing section, click Delete. This also deletes every attribute in the section.
- 
Click Done.
- 
Click Save.
 
 

## Inherent risk scoring
Inherent risk represents the risk a vendor poses before any mitigating controls are considered. Each vendor has an inherent risk score of Critical, High, Medium, Low, or Unscored. The score appears in the vendor detail page header, and you can filter the vendor table by it. Individual assessments do not change a vendor’s inherent risk score.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2790875377/6a8c18fa82a01ee6619f7a66a2c3/image.png?expires=1794967200&signature=c3190d9219827c3014b4e0903a70491152be02fed554d52b7e1787d6b13c1c1c&req=dicuFsF5mIJYXvMW1HO4zUk751blUJpROFqkMQsJ%2BhNUIXmlFqr1pxYZETlr%0AydMUul5oQZUX3Mee6ow%3D%0A>
 

### Auto-scoring
 
By default, each vendor is auto-scored. A vendor starts with the attributes mapped to its category in your inherent risk rubric, and you can adjust its attributes in its inherent risk score settings. The inherent risk score for a vendor is the highest inherent risk score among its attributes. Only enabled attributes count.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2790877371/5858a2075774c95cb00508de4b8f/image.png?expires=1794967200&signature=a8e361561c757931ee6e6b8c251d1ef6180696ce71f53f068c3e981af82cc1cb&req=dicuFsF5moJYWPMW1HO4zcqgmO34hNSYAOscKmG8VERXlReJaoyx6QFzHEOD%0ADzUhSXYzGq80D%2Bi5%2Bys%3D%0A>
 
To see how a vendor’s inherent risk score was calculated:
- 
From the Vendors page, open a vendor.
- 
In the vendor header, click the inherent risk score.
- 
A vendor is Unscored when no attributes apply to it. To score it, select a Vendor category that’s mapped to attributes in your inherent risk rubric.
- 
In the Configure inherent risk score modal:
- 
Click Scoring explanation. It lists the vendor’s category, then the attributes that apply to the vendor in each section and the inherent risk score of each. The highest inherent risk score in the list is the vendor’s overall score.
- 
Go to Risk attributes. It shows the vendor category and the attributes selected for each section. Select or clear attributes to customize them for this vendor. Your changes don’t affect your rubric.
​
⚠️ Note: Updates to the inherent risk rubric or vendor categories can change the inherent risk scores of vendors using auto-scoring:
- 
Changing the inherent risk score for an attribute.
- 
Adding, deleting, enabling, or disabling an attribute or section.
- 
Changing the category a vendor is mapped to.
- 
Deleting a category mapped to vendors. If you choose a replacement category, scores recalculate. If you clear the category, vendors become unscored.
 

### Manual scoring
 
You can set a vendor’s inherent risk score yourself. A manually set score doesn’t change when you change the vendor’s category, save changes to the inherent risk rubric, or delete the vendor’s category.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2790878354/edd72d5909d9cece1a8e12d9aa11/image.png?expires=1794967200&signature=8f47d89a2be6c7fdc6e19c548856d0c74605a7a104e24724745d190a19a4e87e&req=dicuFsF5lYJaXfMW1HO4zXm0EOHszP%2FwWt%2FcxWhToN41HoNzTuECHyLb987L%0A7LE12iy3SAJzr8La%2FLI%3D%0A>
 
To manually score vendor inherent risk:
- 
From the Vendors page, open a vendor.
- 
In the vendor header, click the inherent risk score.
- 
In the Configure inherent risk score modal:
- 
To set a score manually, turn off Auto-score based on risk attributes. We keep the vendor’s current score until you choose a new one.
- 
To change a manual score, select a score under Manually set inherent risk score.
- 
To customize the attributes for this vendor, go to Risk attributes and select or clear attributes under each section. Your changes don’t affect your rubric.
- 
To go back to auto-scoring, turn on Auto-score based on risk attributes. We recalculate the score right away from the vendor’s current attributes.
 
ℹ️ Note: The risk matrix color palette setting also applies to vendor risk scores. You'll see either a green-to-red scale or a purple gradient, depending on your selection. Learn more <https://help.vanta.com/en/articles/11345504-risk-snapshots-and-reports>
 
 

## Residual risk scoring
There are two residual risk scores: one at the vendor level and one at the assessment level. You choose both manually: Critical, High, Medium, Low, or Unscored. Assessment-level and vendor-level scores are independent from each other.
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2790875872/54ab06330096b41cd5d93aec19b2/image.png?expires=1794967200&signature=ae5df7761620610c89a05cd30e7d01dc090cf12b63ff5d5f1d228552038fbd7f&req=dicuFsF5mIlYW%2FMW1HO4zZiHVlfDIfXxlC3gS8nROS9%2BDNqUJ%2BMKw7zGafyF%0ADErcI6hJr8ScR0lm%2BCA%3D%0A>
 

### Vendor-level residual risk
 
The vendor residual risk score is the vendor’s remaining risk after you account for its assessment findings and the controls in place. You can edit it at any time from the vendor header. You must select a score when you make a vendor decision.
 

### Assessment-level residual risk
 
The assessment residual risk score is the risk remaining from that assessment’s findings and the vendor’s controls, separate from the vendor’s own residual risk score. You can edit it from the assessment header while the assessment is in progress. You must select a score to finalize the assessment when you make a recommendation.

## Images

- [image 01] ../../images/ux/settings/vendor-risk-scoring--01.png
- [image 02] ../../images/ux/settings/vendor-risk-scoring--02.png
- [image 03] ../../images/ux/settings/vendor-risk-scoring--03.png
- [image 04] ../../images/ux/vendors/vendor-risk-scoring--04.png
- [image 05] ../../images/ux/vendors/vendor-risk-scoring--05.png
- [image 06] ../../images/ux/vendors/vendor-risk-scoring--06.png
- [image 07] ../../images/ux/vendors/vendor-risk-scoring--07.png
