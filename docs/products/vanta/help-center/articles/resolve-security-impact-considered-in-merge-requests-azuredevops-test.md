# Resolve 'Security impact considered in merge requests (AzureDevops)' test

Source: https://help.vanta.com/en/articles/11345539-resolve-security-impact-considered-in-merge-requests-azuredevops-test
Collection: Evidence Collection ; Evidence Collection › Tests ; Evidence Collection › Tests › Resolving Tests in Vanta
Fetched: 2026-11-17

## Article text

This article provides more information on how to resolve Security impact considered in merge requests (AzureDevOps) <https://app.vanta.com/monitors#code-review-template-present-azuredevops> test.
​
​

## How to Fix
- 
Set a default template for pull requests requiring committers and reviewers to evaluate the security impact of their changes.
​
Follow Azure's instructions for adding a default template here <https://docs.microsoft.com/en-us/azure/devops/repos/git/pull-request-templates?view=azure-devops#default-pull-request-templates>. You can use our recommended templates for pull requests and new tickets <https://github.com/VantaInc/sdlc-templates/tree/master/.github>, our use your own.

## Common Reasons For Failure:
Your AzureDevops pull requests don't include the security impact of feature changes.

## What Vanta is checking:
- 
Vanta is explicitly checking that one of the following exists in your Azure DevOps environment."/.azuredevops/pull_request_template.md"
"/.azuredevops/pull_request_template.txt"
"/.vsts/pull_request_template.md"
"/.vsts/pull_request_template.txt"
"/docs/pull_request_template.md"
"/docs/pull_request_template.txt"
"/pull_request_template.md"
"/pull_request_template.txt"
The file must exist in one of these locations. If having the templates in one of these locations does not work for your workflows, we recommend deactivating monitoring for this test, and providing manual evidence to show auditors where you are applying your default template for merge requests!

## Images

- none
