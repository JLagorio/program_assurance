# Drata Public API: Get Event Data from Drata

Source: https://help.drata.com/en/articles/7213411-drata-public-api-get-event-data-from-drata
Collection: Connection Support › Drata API
Updated: 2026-11-14
Fetched: 2026-11-22
Description: This article shows how to retrieve event tracking data from Drata.

## Article text

## HERE'S WHAT

The [Drata Public API](https://developers.drata.com/docs/) allows you to pull event records from Drata to track how data was added and modified within Drata. You can leverage the available [GET endpoint](https://developers.drata.com/openapi/reference/v2/tag/Events/#tag/Events/operation/EventsPublicV2Controller_getEvent) to automate a bulk export of event data from Drata.

## BEFORE DIVING IN

- See our full API developer documentation at [https://developers.drata.com/docs/](https://developers.drata.com/docs/).
- Review the **[Find events by search terms and filters](https://developers.drata.com/openapi/reference/v2/tag/Events/#tag/Events/operation/EventsPublicV2Controller_listEvents)** endpoint.
- See this [help article](drata-public-api.md) on how to generate an API key. The full API key will only be shown once when you create the key. You will not be able to access it again. Scope the key for read access of the events data entity.
- A rate limit of 500 requests / minute will be enforced per unique source IP.
- Identify the query parameters by which you would like to filter events. Note there are thousands of events, so be specific about for which events you are looking.
- By default the script written below starts from the present date and time and continues pulling event data until the date you input into the script. Be sure to update your desired historical date.
- The bulk `get` request aggregates all of the data entities and prints the raw data to a `.json` file.
- We recommend using a formatting tool to format the `.json` for readability.
- This request is made in sets of 50 items by default; adjust the request as needed.

## HERE'S HOW

### Bulk download event data in a .json file

1. Create a directory for development of scripts for Drata
2. Run `npm i node-fetch` in terminal ([npm fetch](https://www.npmjs.com/package/fetch))
3. Run `npm i lodash` in terminal ([npm lodash](https://www.npmjs.com/package/lodash))
4. Add `"type": "module”` to package.json in order for this script to run, due to the use of `“import”`
5. Optional: `dotenv` to import the API key from environment variables, else write the API key strings in the code samples below, run `npm i dotenv` ([npm dotenv](https://www.npmjs.com/package/dotenv))

**This script is intended to serve as an example template. You will need to configure your local environment and adjust the code to fit your specific use case.**

```
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import moment from 'moment';
import _ from 'lodash';
import * as fs from 'fs';

dotenv.config();

async function run() {
    let page = 1;
    let totalReviewed = 0;
    let totalRecords = 0;
    const allEvents = [];
    const limit = 50;

    // Set targetDate as the start date from which to capture events from.
    const targetDate = '2023-03-28';
    let dateLastRetrieved;

    do {
        const query = new URLSearchParams({
            page: page,
            limit: limit,
            sort: 'CREATED',
            sortDir: 'DESC',
        });
        query.toString();
        let eventData;
        try {
            const resp = await fetch(
                `https://public-api.drata.com/public/events?${query}`,
                {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`
                  }
                }
              );
            eventData = await resp.json();
        } catch (e) {
            console.log(e);
        }
        totalRecords = _.get(eventData, 'total');
        const events = _.get(eventData, 'data');
        totalReviewed += events.length;
        ++page;
        allEvents.push(...events);
        const lastEvent = events[events.length - 1];
dateLastRetrieved = _.get(lastEvent, 'createdAt');
    } while (totalReviewed  0) {
        fs.writeFile('drata-events.json', JSON.stringify(allEvents), (err) => {
            if (err)
                console.log(err);
            else {
                console.log("File written successfully\n");
            }
        });
    } else {
        console.log('No data found, adjust get request parameters\n');
    }
}

run();
```

## Related articles

- [Drata Public API: Upload Evidence for a User](drata-public-api-upload-evidence-for-a-user.md)
- [Drata Public API: Workspace ID for POST or PUT Requests](drata-public-api-workspace-id-for-post-or-put-requests.md)
- [Drata Public API: Get All Controls](drata-public-api-get-all-controls.md)
- [Manually Export Evidence Data from Drata](manually-export-evidence-data-from-drata.md)
