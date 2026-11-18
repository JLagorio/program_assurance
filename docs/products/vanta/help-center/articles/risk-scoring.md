# Risk Scoring

Source: https://help.vanta.com/en/articles/15089318-risk-scoring
Collection: Risk, TPRM & AI Gov ; Risk, TPRM & AI Gov › Risk Management
Fetched: 2026-11-17

## Article text

✅ Feature availability: Vanta built-in risk scoring settings are included with Core Risk Management. Customizing risk scoring settings requires Advanced Risk Management. Refer to Vanta Plans and Pricing <https://www.vanta.com/pricing?utm_source=help_center&utm_campaign=hc_pricing_cta> for details.
 
Risk scoring determines how each risk is rated, scored, and grouped into a risk level. Vanta provides built-in risk scoring settings and a default risk rubric. With custom risk scoring, you can change those settings to match how your organization assesses risk, and create register-specific risk rubrics.
 
⚙️ User permissions: Editors and Admins can manage risk scoring settings. Collaborators assigned as Risk Scenario Owners can reference risk scoring definitions within risk assessments, but can't access risk settings. Learn more: User Permissions by Product Area <https://help.vanta.com/en/articles/11345590-understanding-user-roles-and-permissions-in-vanta>
 
 

## Getting started
In a risk assessment <https://help.vanta.com/en/articles/15089313-completing-risk-assessments>, you rate a risk across two dimensions. Your scoring definitions determine the number of risk scores you track, as well as their names and descriptions. Your risk rubric determines how Vanta calculates each score from your ratings and assigns it a risk level. Here are the key metrics:
 | 
Metric | 
How it’s determined
 | 
Dimension ratings | 
You select a rating for each dimension during a risk assessment. Your scoring method determines whether you select each rating directly or rate individual factors that roll up into it.
 | 
Risk scores | 
Vanta calculates each risk score by multiplying your two dimension ratings. Your scoring definitions determine how many risk scores you track for each risk.
 | 
Risk levels | 
Vanta maps each risk score to a risk level based on your risk level groups. Risk levels group and interpret how severe a score is.
💡 Tip: The risk scores you see in reports and snapshots are calculated from your dimension ratings. See examples
 
 

## Customizing risk scoring
Here’s how the built-in settings in Vanta risk scoring compare with custom risk scoring options:
 | 
Setting | 
Vanta built-in settings | 
Custom settings
 | 
Scoring definitions | 
2 scores with customizable names and definitions | 
2 or 3 scores with customizable names and definitions
 | 
Risk level groups | 
3 levels with preset score ranges | 
2 to 5 levels, with customizable score ranges, names, and descriptions
 | 
Dimensions | 
2 dimensions with fixed names and descriptions, each rated on a 5-point scale | 
2 dimensions with customizable names, descriptions, and rating scales
 | 
Scoring method | 
Simple scale for each dimension | 
Simple scale or aggregate factors for each dimension
 | 
Rubrics by register | 
One default rubric for all risks | 
One default rubric and register-specific rubrics
⚠️ Note: If you change how risks are calculated, risks you’ve already scored and approved may need to be reassessed, including:
- 
Switching between 2 and 3 risk scores
- 
Changing your scoring method
- 
Editing the range of a rating scale
- 
Adding or removing factors
- 
Switching your factor roll-up method
Edits to names, descriptions, and labels don’t require you to rescore or reapprove risks.
 
💡 Tip: You can ask the Vanta Agent to score your risks. It proposes ratings for your approval. Example prompt: “I updated our risk settings. Please propose new ratings for the risks that need rescoring.”
 
 

## Scoring definitions
Scoring definitions determine which risk scores you track for each risk and what each one means. They apply across all risk rubrics in your workspace and have two parts: a profile that sets whether you track two risk scores or three, and definitions that set the name and description of each risk score. 
 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777515666/6143b1131ec1a6e0c4f76551f74c/image.png?expires=1794967200&signature=3d83bf65a4cf5f7b848b10d056f89709db9fc24d15d8e4a8ababf7363c411e4f&req=dicgEcx%2FmIdZX%2FMW1HO4zS%2BshQOP2pGqpNFn%2B0tB5Ekdz70BLMApPnl%2B7ny4%0Ayw2MqWx%2Fb9bBhsH%2Fumk%3D%0A>
 
Here are the built-in names and descriptions Vanta provides out of the box:
 | 
Default name | 
Description | 
Profile eligibility
 | 
Inherent risk | 
Risk score before considering controls or actions that reduce this risk | 
This first risk score is available in the three-score profile only
 | 
Residual risk | 
Risk score based on the controls and actions currently in place, and how well they are working | 
This second risk score is available in both two-score and three-score profiles
 | 
Target risk | 
Risk score expected after all planned treatment actions are complete | 
This third risk score is available in both two-score and three-score profiles
ℹ️ Note: You might be using our legacy scoring definitions, a two-score profile with the defaults Inherent risk and Residual risk. There’s no change to product behavior, only to the names and definitions of the two risk scores. 
 
To use the new built-in scoring definitions instead, go to your risk settings and ask the Vanta Agent to help. Example prompt: “Please update my risk score names and definitions to the new Vanta built-in settings.”
 

### Updating your scoring profile
 
Update your profile to change whether you track two risk scores or three.
 
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777518296/097adbb0ec057ba2767c2204513c/image.png?expires=1794967200&signature=dd4450f1f59bbc27279a092f936af5c122bdb16335cf6922eee4cc91724578a8&req=dicgEcx%2FlYNWX%2FMW1HO4zTmvQi05f9czBL7qnNJTKejH31jgJvUkq7toEEuI%0AlGOFIcWpCc0ZR2d1Ozs%3D%0A>
 
To update your profile:
- 
Go to Settings.
- 
From the page menu, select Risk and go to the Scoring tab.
- 
In the Scoring definition section, click Edit.
- 
Under Profile, select the option with the number of risk scores you want to track:
- 
Select Two-score profile to track risk after controls and after treatment.
- 
Select Three-score profile to track risk before controls, after controls, and after treatment.  
- 
Click Help me choose if you’d like to compare both options with the Vanta Agent.
- 
Click Save—changes apply across all risk rubrics, including register-specific rubrics.
​
⚠️ Note: If you switch to a three-score profile, you’ll need to reassess impacted risks to account for the new risk score. If you switch to a two-score profile, the first of the three risk scores is removed from your risks, and your remaining risk scores stay unchanged.
 

### Editing scoring definitions
 
Edit definitions to change the name and description of each risk score.
 
To edit definitions:
- 
Go to Settings.
- 
From the page menu, select Risk and go to the Scoring tab.
- 
In the Scoring definition section, click Edit.
- 
Under Definitions, edit the name and description for each risk score.
- 
Click Save—changes apply across all risk rubrics, including register-specific rubrics.
 
 

## Risk rubric
A risk rubric is made up of dimensions and risk level groups. Dimensions are what you rate a risk on during a risk assessment to calculate risk scores. Risk level groups map each risk score to a risk level.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777507767/48287f8ceba769ff2ed8255ecd27/image-2.png?expires=1794967200&signature=10cffbd41d0aa3494c12ca38709d399a0df174c39e62bcc16b9b6735637c930e&req=dicgEcx%2BmoZZXvMW1HO4zc6lXE178Hdg05J4DMztyL3w5ESoHK6G9YF9Esw7%0AQNt3WmjypcWuyVVdmXY%3D%0A>
 
Every workspace has a default rubric. With custom risk scoring, you can edit the default rubric settings and create register-specific rubrics to use different settings for a single register.
 

### Default rubric
 
Your default rubric applies to every risk register that doesn’t have its own register-specific rubric.
 
[image 04]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777506495/1144d23e3ebf64abb6368deeb118/image.png?expires=1794967200&signature=130b940479aecab4e53d2ae14760965456fbd9f19c463e12ec930d2c488796a0&req=dicgEcx%2Bm4VWXPMW1HO4zUGw9uNizPFGHbYAWG8ckgdrAST0uroKnVp4OZIC%0AzJ1pz%2Bx4BdxN5ibwQDc%3D%0A>
 
To edit the default rubric:
- 
Go to Settings.
- 
From the page menu, select Risk and go to the Scoring tab.
- 
Under Default rubric, click Edit.
- 
Edit the risk level groups and dimensions.
- 
Click Save:
- 
Select which registers to apply your changes to.
- 
Registers you exclude from the update will use their own register-specific rubric going forward.
 

### Rubrics by register
 
Each risk register <https://help.vanta.com/en/articles/12005142-managing-risks-and-risk-registers> uses either the default rubric or its own register-specific rubric. New registers use the default rubric, and you can give a register its own rubric when it needs different scoring criteria.
 
[image 05]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777574128/855389ed6a782cb734086071aff4/image-3.png?expires=1794967200&signature=65028cd90b6769d1103a1286f8ec76cd8cb3a8d1e3868cba1a1de750398f7bd6&req=dicgEcx5mYBdUfMW1HO4zYUD0U8R3hsWX1xYEtB9CCrXeM%2Bayz%2BifECvihUj%0A%2FU8IO5bD46DsZJObVP4%3D%0A>
 
To edit a register-specific rubric:
- 
Go to Settings.
- 
From the page menu, select Risk and go to the Scoring tab.
- 
Under Rubrics by register, find the register you want to update. 
- 
The Default badge means the register uses the default rubric.
- 
The Register-specific badge means it has its own rubric.
- 
Open a register:
- 
Click Edit to create or update a register-specific rubric.
- 
Click ••• and select Use default to go back to the default rubric.
- 
Click Save.
Keep these points in mind when using register-specific rubrics:
- 
If your registers use different rating scales or risk level groups, you need to filter by register in your risk reports <https://help.vanta.com/en/articles/11345504-creating-risk-snapshots-and-reports>. Charts can’t combine registers that use different risk rubrics into a single view.
- 
CSV import and export across all registers are disabled when you use register-specific rubrics. You need to import or export one register at a time.
- 
Register-specific rubrics are managed one register at a time. Edits to one register’s rubric don’t apply to any other register. Changes you make to the default rubric apply to the registers you select when updating it.
​
💡 Tip: To give a register the same risk rubric settings as another register, ask the Vanta Agent. The registers stay independent, so later edits to one don’t change the other. Example prompt: “Please update [Register A] to use the same risk rubric settings as [Register B].”
 
 

## Risk level groups
Risk level groups map each risk score to a risk level. Each group is made up of a score range, a name, and a description. When a risk score falls within a score range, the risk gets that risk level. You can customize the number of risk levels and how risk scores map to each one. Changing score ranges can move risks into different risk levels, but it doesn’t change their risk scores.
 
[image 06]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777509746/e21da9f270f7df53134078f8d76b/image-4.png?expires=1794967200&signature=ba36c6f8fe4327536fb3abc4bdf47242238720a48b30109357fbcd3f7ae590e0&req=dicgEcx%2BlIZbX%2FMW1HO4zWbWdGl3CNufIkE6UCpcH8R%2Bq1z%2FC68MVc8mtEXE%0AWX3%2FRZAeIByXsnHdnu0%3D%0A>
 
Here are the three built-in risk levels and score ranges Vanta provides out of the box:
 | 
Risk level | 
Score range
 | 
Low | 
1–4
 | 
Med | 
5–14
 | 
High | 
15–25
💡 Tip: You can choose between two color palettes to change how risk levels are displayed in reports and snapshots. Learn more <https://help.vanta.com/en/articles/11345504-risk-snapshots-and-reports>
 

### Editing score ranges
 
Score ranges determine where each risk level starts and ends.
 
To edit score ranges:
- 
Open the risk rubric you want to edit.
- 
Go to the Risk level groups section.
- 
Use the Range slider to determine the ranges:
- 
The available range depends on the rating scales in your dimension settings. 
- 
If a risk score falls exactly on the boundary between two risk levels, it’s grouped into the higher risk level.
- 
Click Save.
 

### Editing risk levels
 
Edit risk levels to change how many risk levels you use and how each one is described.
 
To edit risk levels:
- 
Open the risk rubric you want to edit.
- 
Go to the Risk level groups section.
- 
Under Level groups:
- 
Use the + and x icons to choose the number of risk levels (from 2–5).
- 
Click the ✎ pencil icon to edit the name and description of each level.
- 
Click Save.
 
 

## Dimensions
Dimensions are what you rate a risk on during a risk assessment. Each dimension is made up of a definition, which is a name and description, and a scoring method. The scoring method determines how the dimension rating is set: you either select it directly, or rate individual factors that roll up into it.
 
[image 07]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777490137/6b0e116b2fe53a61a481648d6453/image-5.png?expires=1794967200&signature=194d94331d8e15cfad72d0a5c0b53f5f0421a27382d8d5cb1dd9fe37c868a740&req=dicgEc13nYBcXvMW1HO4zUTYGxuV49WEfeCIUOrkfY85T%2F%2BQcuxpVca2bMOD%0AP4sw4fZD20siw0%2FnSHM%3D%0A>
 
Here are the two built-in dimensions and scoring method Vanta provides out of the box:
 | 
Name | 
Scoring method
 | 
Likelihood | 
Simple scale with a 5-point rating scale
 | 
Impact | 
Simple scale with a 5-point rating scale
 

### Editing dimension definitions
 
Edit a dimension’s name and description to change how it appears in a risk assessment.
 
To edit the dimensions:
- 
Open the risk rubric you want to edit.
- 
Scroll to Dimensions.
- 
For each dimension, update the Name and Description.
- 
Click Save.
 

### Simple scale scoring method
 
With the simple scale scoring method, you select each dimension rating directly from a rating scale during a risk assessment. A rating scale is a set of numbered ratings, and each rating has a name and description.
 
[image 08]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777489214/2de5d79ec76202c5b8709265a540/image-6.png?expires=1794967200&signature=6828cb3a1f8092ef5af97696fcfb47e0aac930d99e2fe4a9ac2a74293f74b219&req=dicgEc12lINeXfMW1HO4zdxW7c4mq11FfFFwwLiEw3DYTRUGQi6qPULqk9Tu%0AEwOE%2Buw2yyaEyH1D0iE%3D%0A>
 
To use a simple scale:
- 
Open the risk rubric you want to edit.
- 
Under Scoring method for a dimension, select Simple scale.
- 
Set the Scale range to determine the number of ratings to use (from 2–10).
- 
Next to each rating, click the ✎ pencil icon to add a Name and Description to guide consistent scoring.
- 
At the top of the page, review your Risk level groups to make sure the score ranges fit your rating scales.
- 
Click Save.
 

### Aggregate factors scoring method
 
With the aggregate factors scoring method, you rate individual factors during a risk assessment, and those factor ratings roll up into the dimension rating. Each factor has its own rating scale. Your roll-up method determines how the dimension rating is calculated:
 | 
Roll-up method | 
How dimension rating is calculated
 | 
Average | 
Sum of all factor ratings divided by the total number of factors is used as the dimension rating (can be a decimal value, shown to two decimal places).
 | 
Max | 
Highest factor rating is used as the dimension rating.
 | 
Sum | 
Sum of all factor ratings is used as the dimension rating.
[image 09]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777491641/89b0071a78792dc8f9aa56ed32db/image-7.png?expires=1794967200&signature=e7bb754a8525a69e923eeca8098fb181ac3dd311e629e37faaa542518bfa3c93&req=dicgEc13nIdbWPMW1HO4zSyHtWz%2Fy7VZseadRqsCS9D%2BXdLd2JrsNYsl7aI4%0ADD38XqkXOHgHJkLhE7k%3D%0A>
 
To use aggregate factors:
- 
Open the rubric you’d like to edit.
- 
Under Scoring method, select Aggregate factors.
- 
Next to Roll up with, select Average, Max, or Sum.
- 
Under Add or remove factors, choose the factors for the dimension:
- 
Select a factor template to use as a baseline.
- 
Type a name to create a factor from scratch.
- 
Under Factor order, drag the factors into the order they should appear on risk details, or use the move buttons.
- 
Scroll down to Factors used in this rubric and edit each factor:
- 
Update the Name and Description.
- 
Set the Scale range to determine the number of ratings to use (from 2–10).
- 
Next to each rating, click the ✎ pencil icon to add a Name and Description to guide consistent scoring.
- 
Turn on Allow assessors to mark this factor N/A to allow people to skip the factor during a risk assessment. A factor marked N/A is excluded from the dimension rating calculation.
- 
At the top of the page, review your Risk level groups to make sure the score ranges fit your rating scales.
- 
Click Save.
​
ℹ️ Note: Factors aren’t shared across risk rubrics. If you edit a factor in one risk rubric, other risk rubrics don’t change. Registers that use the default rubric share one set of factors, because they use one shared risk rubric.
 
 

## Example calculations
Risk scores are calculated by multiplying the two dimension ratings, which are Likelihood and Impact by default. Your scoring method determines how each dimension rating is set, either by selecting it directly or by rating factors that roll up into it. Each risk score then falls into a risk level. Risk scores and risk levels are tracked in reports and snapshots <https://help.vanta.com/en/articles/11345504-risk-snapshots-and-reports>.
 

### Example: Simple scale
 
With a simple scale, you select each dimension rating directly. In this example, both dimensions use a 1–5 scale.
 
[image 10]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777552359/6f446d9112bc0df5315fc87014d3/image.png?expires=1794967200&signature=d0e4d7053fe32b10b831fac55569dc1180c1fc45a50feaa2869aa73442de187c&req=dicgEcx7n4JaUPMW1HO4zfbUdUykbMg3d0B1GzD3KHYAofoBl%2FQ0IG7wqLq6%0AZ8qqa02cjB%2Bju05Z3JM%3D%0A>
 | 
Dimension | 
Dimension ratings you selected
 | 
Likelihood | 
4
 | 
Impact | 
3
Vanta multiplies the two dimension ratings: 4 × 3 = 12. The risk score is 12.
 
 

### Example: Aggregate factors
 
With aggregate factors, you rate each factor, and the factor ratings roll up into the dimension rating. In this example, each dimension has two factors rated on a 1–5 scale, and both dimensions use the Average roll-up method.
 
[image 11]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2777554517/e93d6aa1ff46412880cef98f658d/image.png?expires=1794967200&signature=5ecaefb3781e37a0884b6466e576ca7065b2a298a9e3a539650c569080a9b49d&req=dicgEcx7mYReXvMW1HO4zbjdlksYuFZ37%2BxP0IwAmXLx%2BCsB0On%2BYKoWsD4y%0A7rn0AefIwBU6hy5AuUw%3D%0A>
 | 
Dimension | 
Factor ratings you selected | 
Dimension rating calculation
 | 
Likelihood | 
Threat: 3
Vulnerability: 5 | 
(3 + 5) ÷ 2 = 4
 | 
Impact | 
Financial: 2
Operational: 4 | 
(2 + 4) ÷ 2 = 3
Vanta multiplies the two dimension ratings: 4 × 3 = 12. The risk score is 12.

## Images

- [image 01] ../../images/ux/settings/risk-scoring--01.png
- [image 02] ../../images/ux/settings/risk-scoring--02.png
- [image 03] ../../images/ux/settings/risk-scoring--03.png
- [image 04] ../../images/ux/settings/risk-scoring--04.png
- [image 05] ../../images/ux/settings/risk-scoring--05.png
- [image 06] ../../images/ux/settings/risk-scoring--06.png
- [image 07] ../../images/ux/settings/risk-scoring--07.png
- [image 08] ../../images/ux/settings/risk-scoring--08.png
- [image 09] ../../images/ux/settings/risk-scoring--09.png
- [image 10] ../../images/ux/risk/risk-scoring--10.png
- [image 11] ../../images/ux/risk/risk-scoring--11.png
