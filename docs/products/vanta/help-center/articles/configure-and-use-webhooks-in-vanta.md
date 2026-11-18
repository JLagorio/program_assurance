# Configure and Use Webhooks in Vanta

Source: https://help.vanta.com/en/articles/13909210-configure-and-use-webhooks-in-vanta
Collection: Integrations ; Integrations › Other Integrations & Connections
Fetched: 2026-11-17

## Article text

## Overview 
Webhooks allow Vanta to notify your application in real time when events occur in your account. Instead of polling the API for changes, you can register an HTTPS endpoint and Vanta will send an HTTP POST request to your endpoint whenever a subscribed event occurs.
 
Webhooks are powered by Svix, which provides automatic retries, delivery guarantees, and built-in signature verification. 
 

## Who this feature is for
This feature is designed for: 
- 
Developers building custom integrations 
- 
Security engineers automating workflows
- 
Infrastructure teams integrating Vanta with internal systems 
​
⚙️ User permissions: Only Admins can access Settings > Webhooks.
 

## What webhooks enable 
Without webhooks, teams typically need to: 
- 
Manually monitor activity in Vanta
- 
Poll the API for changes
- 
Rely on email notifications
- 
Maintain custom scripts for automation
With webhooks: 
- 
Vanta sends HTTP POST requests to your endpoint when subscribed events occur
- 
Deliveries are retried automatically using an exponential backoff schedule (up to ~5 days)
- 
Each message includes signed headers for verification
- 
Delivery attempts are logged in the Vanta dashboard
- 
Failed events can be retried individually or in bulk

## Example use cases 
You can use webhooks to automate workflows such as: 
- 
Logging Trust Center access requests in an internal system
- 
Triggering workflows when access is approved or denied
- 
Creating tickets when a vendor is created
- 
Syncing questionnaire status changes to another platform
To implement this, you could register a webhook endpoint. Then subscribe to relevant event types. And then automatically process incoming webhook events in your system. 
 

## Set up a webhook endpoint
To begin receiving webhooks, you must register at least one endpoint.
An endpoint is a publicly accessible HTTPS URL on your server that will receive webhook POST requests from Vanta.
 

## Add an endpoint
- 
Go to Settings (the gear icon). Then click Webhooks on the lefthand menu. 
[image 01]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2317520801/a3326f42b4c54af105a3c3ff7a06/image.png?expires=1794967200&signature=5b10fdae303859fb512f194cc75ec1235f563829022f0ab863f9f7aac709ec34&req=diMmEcx8nYlfWPMW1HO4zbDXPEaddVSxr9Dn3a2VySMdPA5qb5rSXLGBf2%2By%0A6fK89y%2BxFgoFDwfRl2s%3D%0A>
- 
Click Add Endpoint.
[image 02]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2317527521/bf5dcf954c41aa7cf54ce43e80d5/image.png?expires=1794967200&signature=45f13c8c116b773f466ac55ac4229304de25d724a09f0b8ba5f67ec0183d212d&req=diMmEcx8moRdWPMW1HO4zVE95DZk5fg8sZLK4BVIcjvzF9P%2B0nXe5iNm8g40%0Ar%2F6ntQVT8OIBheOoDGk%3D%0A>
- 
Enter your endpoint URL (must be HTTPS).
- 
Select the event types you want to subscribe to
- 
Leave blank to receive all events.
- 
Click Create.
You can browse all available event types and view their descriptions and payload schemas directly in the dashboard.
 
[image 03]
 <https://downloads.intercomcdn.com/i/o/t4a8cs4z/2317532337/7eb5873ce9b813e761a69f9681d2/image.png?expires=1794967200&signature=c2ae3005c4822afad1d034bf5bdc2666ea68e18928350f2c5a20e950993412f4&req=diMmEcx9n4JcXvMW1HO4zbuYw79hdKL2XTBkALCUzgCaXl%2Fm9IHxwc70Xshb%0Ahl4AfO5tGPX3VDQBvJM%3D%0A>
 
 

## Test your endpoint
Before using webhooks in production, verify that your endpoint can receive and process events correctly.
- 
Go to Settings > Webhooks.
- 
Select the endpoint you want to test.
- 
Open the Testing tab.
- 
Choose an event type.
- 
Click Send Example.
This sends a sample payload to your endpoint so you can confirm it handles events as expected.
 

## Webhook delivery behavior

## Delivery method
- 
Vanta sends an HTTP POST request to your endpoint.
- 
Your endpoint must return a 2xx status code within 15 seconds to acknowledge receipt.
- 
If a 2xx response is not received within 15 seconds, the delivery attempt is marked as failed and retried according to the retry schedule.

## Retry schedule
If a delivery attempt fails, Vanta retries the message automatically using exponential backoff. Vanta continues retrying until all scheduled attempts are exhausted (approximately 5 days total). Only after all retry attempts fail is the message marked as permanently failed.
 
See the Developer Docs <https://developer.vanta.com/docs/webhooks> for the full retry schedule and timing details.
 

## Manual retry and recovery
You can retry failed deliveries from the webhook dashboard:
- 
Go to Settings > Webhooks.
- 
Select the endpoint.
- 
Browse message history.
- 
Click Retry on individual messages
- 
Or use Bulk Retry to replay failed messages within a selected time range.
This allows you to recover missed events if your endpoint was temporarily unavailable.
 

## Signature verification
Each webhook includes headers that allow you to verify the request originated from Vanta:
- 
svix-id – Unique message identifier
- 
svix-timestamp – Timestamp of the delivery attempt
- 
svix-signature – Base64-encoded signature(s)
We strongly recommend verifying webhook signatures in production. You can retrieve your endpoint’s Signing Secret in the webhook dashboard under the endpoint details. Vanta recommends using the official Svix libraries to verify signatures.
 
See the developer documentation <https://developer.vanta.com/docs/webhooks> for implementation examples.
 

## Best practices for webhook endpoints
To ensure reliable processing:
- 
Your endpoint must be publicly accessible over HTTPS.
- 
Return a 2xx status code within 15 seconds.
- 
Process events asynchronously (acknowledge immediately, then handle in a background job).
- 
Disable CSRF protection for the webhook route.
- 
Implement idempotent handling. Delivery is “at least once,” so duplicate events are possible.
- 
Preserve the raw request body when verifying signatures (do not parse or re-serialize before verification).

## Troubleshooting

## 4xx errors
- 
Confirm the endpoint URL is correct and publicly accessible over HTTPS.
- 
Ensure CSRF protection is disabled for the webhook route.
- 
Verify your endpoint returns a 2xx status code.

## Signature verification failures 
- 
Confirm you are using the raw request body.
- 
Ensure the signing secret matches the one in the dashboard.
- 
Verify the request body has not been modified before verification.

## Timeouts
Your endpoint must respond within 15 seconds. If processing takes longer, return a 200 response immediately and process the event asynchronously. 
 

## Limitations
- 
Webhooks are not supported in FedRAMP environments.
- 
Updating event subscriptions affects future deliveries only.
- 
Delivery is at-least-once, so duplicate events are possible.

## Related resources
- 
Developer documentation <https://developer.vanta.com/docs/webhooks>

## Images

- [image 01] ../../images/ux/settings/configure-and-use-webhooks-in-vanta--01.png
- [image 02] ../../images/ux/settings/configure-and-use-webhooks-in-vanta--02.png
- [image 03] ../../images/ux/settings/configure-and-use-webhooks-in-vanta--03.png
