# Part 2: Automate Evidence Submission

Source: https://help.drata.com/en/articles/11825486-part-2-automate-evidence-submission
Collection: Understand the Drata Platform › Connections › Custom Connections and Tests
Updated: 2026-07-23
Fetched: 2026-11-22

## Article text

Once you’ve set up your [Custom Connection and submitted initial data successfully](https://help.drata.com/en/articles/11117161-custom-connections-and-tests), the next step is to automate the process of getting data from your third party platform and sending the data into Drata. This helps ensure continuous monitoring without manual effort.

Depending on your team’s technical setup, you can choose from several ways to automate this data delivery. Some options require no code, while others offer deeper flexibility through scripts or cloud functions.

Here are the most common options:

1. Use a No-Code Automation Platform
2. Custom Script + Cron Job
3. Cloud Function
4. Internal Integration Platform

## Option 1: Use a No-Code Automation Platform

Platforms like **Torq**, **Tines**, **Make**, and **Zapier** allow you to create automated workflows that fetch data from your system and send it to Drata via API — without writing code.

**Best for**:
Teams without engineering support or those who want to get started quickly.

**Getting Started:**

1. Choose an automation platform (e.g.,[Torq](https://torq.io/),[Tines](https://www.tines.com/),[Make](https://www.make.com/), [Zapier](https://zapier.com/)).
2. Set up a new workflow that pulls data from your third-party system.
3. Add an HTTP module or connector to send a POST request to the Drata API.
4. Authenticate using your **Drata Public API Key**.
5. Format your payload using Drata’s required JSON structure.

**Example**:

```
POST https://public-api.drata.com/public/custom-connections/{connectionId}/resources/{resourceId}/records
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
{
  "data": {
    "email": "jane.doe@example.com",
    "status": "active"
  }
}
```

---

## Option 2: Custom Script + Cron Job

For engineering teams, a simple script in Python, Node.js, or another language can be scheduled to run regularly and push data to Drata.

**Best for**:
Customers who want full control over the logic and timing of data syncs.

**Getting Started:**

1. Write a script to:
   - Fetch data from your third-party system’s API.
   - Format the data according to Drata’s `POST /records` API.
   - Send the data using an HTTP request (e.g., using requests or axios).
2. Choose a hosting method (view the “Hosting Option for Scripts” section).
3. Schedule it on a regular interval (e.g., daily or hourly).

**Example (Python)**:

```
import requests

headers = {

  "Authorization": "Bearer YOUR_API_KEY",

  "Content-Type": "application/json"

}

data = {

  "data": {

    "email": "jane.doe@example.com",

    "status": "active"

  }

}

requests.post(

  "https://public-api.drata.com/public/custom-connections/1234/resources/5678/records",

  headers=headers,

  json=data

)
```

### Set up a Docker Container

You can run the script you created in the previous section through Docker container.

1. **Build the Docker Image**
   ```
docker build -t my-custom-connection .
   ```
2. **Run the Container**
   To run the container **one time** and **have it exit after completing the job**:
   ```
docker run --rm --name my-custom-connection my-custom-connection
   ```
   - `--rm` cleans up the container after it finishes.
   - `--name` gives it an optional name for easier tracking.
3. (Optional) Add environment variables for your secrets.
   1. With `--rm`, the container will disappear after running.
      ```
docker run --rm \
  --name my-custom-connection \
  -e DRATA_API_KEY=your_api_key \
  my-custom-connection
      ```
4. Check Running Containers (if needed).
   ```
docker ps
   ```
5. **Stop and Remove the Container (for long-running containers)**
   - Only needed if you **run the container in detached mode** (-d), which is **not typical** for cron-driven jobs.
      ```
docker stop my-custom-connection
docker rm my-custom-connection
      ```

---

## Option 3: Use a Cloud Function

Deploy a cloud function that runs on a schedule or is triggered by an event (e.g., webhook, user update). It pulls data from your system and sends it to Drata.

**Best for:**

Cloud-native teams who want lightweight, scalable, and automated data delivery.

**AWS Lambda Example (Python):**

```
import json
import requests

DRATA_API_URL = "https://public-api.drata.com/public/custom-connections/{connectionId}/resources/{resourceId}/records"
API_KEY = "your_drata_public_api_key"

def lambda_handler(event, context):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "data": {
            "email": "jane.doe@example.com",
            "status": "active"
        }
    }

    response = requests.post(DRATA_API_URL, headers=headers, json=payload)

    return {"status": "success" if response.ok else "error", "details": response.text}
```

---

### Option 4: Internal Integration Platform or Middleware

If you have an internal data pipeline or middleware platform like Airflow, Workato, or Mulesoft, you can extend your existing workflows to push data to Drata.

**Best for:**

Enterprise customers with centralized data pipelines and internal engineering teams.

**Python Example:**

```
import requests
import os

DRATA_API_URL = "https://public-api.drata.com/public/custom-connections/{connectionId}/resources/{resourceId}/records"
API_KEY = os.environ.get("DRATA_API_KEY")

def push_to_drata(user_data):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    for record in user_data:
        payload = {
            "data": {
                "email": record["email"],
                "status": record["status"],
                "role": record["role"]
            }
        }
        response = requests.post(DRATA_API_URL, headers=headers, json=payload)
        if not response.ok:
            print(f"Error for {record['email']}: {response.text}")
```

## Hosting Options for Scripts

If you're using a script (Options 2–4), it must be hosted somewhere that can run on a schedule or based on triggers.

Here are common options:

| **Hosting Option** | **Description** | **Best For** |
|---|---|---|
| **On-Prem Server or VM** | Use cron on a Linux server or virtual machine. | Simpler IT environments |
| **Dockerized Script** | Package your script in a Docker container and run it on a schedule. | Portability and dev/prod parity |
| **Serverless Function** | Use AWS Lambda, GCP Cloud Functions, or Azure Functions with a scheduler. | Cloud-native teams |
| **CI/CD Platform (e.g. GitHub Actions)** | Run scheduled workflows that trigger your script. | Teams already using GitHub/GitLab |
| **Internal ETL Tool (e.g. Airflow)** | Add Drata as a destination in your pipeline. | Centralized data integration teams |

💡 **Tip**: Make sure your hosting option includes secure storage of the Drata API key (e.g., using environment variables or a secrets manager).

---

### Next Steps

- **Want to create a test and map the results to controls?**
   → [Create, Run, and Map a Custom Test](part-3-create-run-and-map-a-custom-test.md)

## Related articles

- [Drata Public API: Upload Evidence for a User](drata-public-api-upload-evidence-for-a-user.md)
- [Drata Public API: Get Event Data from Drata](drata-public-api-get-event-data-from-drata.md)
- [Drata Public API: Get All Controls](drata-public-api-get-all-controls.md)
- [Part 1: Custom Connections and Tests](part-1-custom-connections-and-tests.md)
- [Create Workflow for Evidence](create-workflow-for-evidence.md)
