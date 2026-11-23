# Drata Public API: Get All Controls

Source: https://help.drata.com/en/articles/7213418-drata-public-api-get-all-controls
Collection: Connection Support › Drata API
Updated: 2026-11-14
Fetched: 2026-11-22
Description: This article shows how to retrieve all controls from Drata.

## Article text

## HERE'S WHAT

The [Drata Public API](https://developers.drata.com/docs/) allows you to pull control records from Drata to review all of the control data in a single document. You can leverage the available GET endpoint to automate a bulk export of control data from Drata.

## BEFORE DIVING IN

- See our full API developer documentation at [https://developers.drata.com/docs/](https://developers.drata.com/docs/).
- Review the **Find controls by search terms and filters **endpoint.
- See this [help article](drata-public-api.md) on how to generate an API key. The full API key will only be shown once when you create the key. You will not be able to access it again. Scope the key for read access of the events data entity.
- A rate limit of 500 requests / minute will be enforced per unique source IP.
- Identify the query parameters by which you would like to filter controls.
- The bulk `get` request aggregates all of the data entities and prints the raw data to a `.json` file.
- We recommend using a formatting tool to format the `.json` for readability.
- This request is made in sets of 50 items by default; adjust the request as needed.

## HERE'S HOW

### Bulk download control data in a .json file

1. Create a directory for development of scripts for Drata
2. Run `npm i node-fetch` in terminal ([npm fetch](https://www.npmjs.com/package/fetch))
3. Run `npm i lodash` in terminal ([npm lodash](https://www.npmjs.com/package/lodash))
4. Add `"type": "module”` to package.json in order for this script to run, due to the use of `“import”`
5. Optional: `dotenv` to import the API key from environment variables, else write the API key strings in the code samples below, run `npm i dotenv` ([npm dotenv](https://www.npmjs.com/package/dotenv))

**This script is intended to serve as an example template. You will need to configure your local environment and adjust the code to fit your specific use case.**

```
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import _, { isEmpty } from 'lodash';
import * as fs from 'fs';

dotenv.config();

async function run() {
    let page = 1;
    let totalReviewed = 0;
    let totalRecords = 0;
    const allControls = [];
    const limit = 50;

    do {
        const query = new URLSearchParams({
            page: page,
            limit: limit,
        });
        query.toString()
        let controlData;
        try {
            const resp = await fetch(
                `https://public-api.drata.com/public/controls?${query}`,
                {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`
                  }
                }
              );
            controlData = await resp.json();
        } catch (e) {
            console.log(e)
        }
        controlData = _.get(controlData, 'data');
        const controls = _.get(controlData, 'data');
        totalReviewed += controls.length
        ++page
        allControls.push(...controls);
    } while (totalReviewed  {
            if (err)
                console.log(err);
            else {
                console.log('File written successfully\n');
            }
        })
    } else {
        console.log('No data found, adjust get request parameters\n');
    }
}

run();
```

## Related articles

- [Drata Public API](drata-public-api.md)
- [Drata Public API: Upload Evidence for a User](drata-public-api-upload-evidence-for-a-user.md)
- [Drata Public API: Get Event Data from Drata](drata-public-api-get-event-data-from-drata.md)
- [The Drata Control Framework & Requirement Relationship](the-drata-control-framework-requirement-relationship.md)
- [Getting Started with Drata: Controls & Monitoring - Webinar Recording](getting-started-with-drata-controls-monitoring-webinar-recording.md)
