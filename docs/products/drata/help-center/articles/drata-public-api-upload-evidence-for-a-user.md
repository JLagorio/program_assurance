# Drata Public API: Upload Evidence for a User

Source: https://help.drata.com/en/articles/7213389-drata-public-api-upload-evidence-for-a-user
Collection: Connection Support › Drata API
Updated: 2026-11-14
Fetched: 2026-11-22
Description: This article shows how to upload training-related evidence (for example, Security, HIPAA, or NIST AI training) for a specific Drata user.

## Article text

The [Drata Public API](https://developers.drata.com/docs/) allows you to upload documents as evidence directly to a specific personnel record. You can leverage the available GET and POST endpoints to automate and streamline the way your team demonstrates compliance for personnel in Drata.

## Prerequisites

- See our full API developer documentation at [https://developers.drata.com/docs/](https://developers.drata.com/docs/).
- See this [help article](drata-public-api.md) on how to generate an API key. Scope the key for both read and write access for the user and personnel data entities.
- A rate limit of 500 requests / minute will be enforced per unique source IP.
- Identify the email address of the existing personnel record in Drata.
- Save the compliance evidence as a document that is an accepted file type.

## Automate evidence upload for a user

1. Create a directory for development of scripts for Drata
2. Run `npm i form-data` in terminal ([npm form-data](https://www.npmjs.com/package/form-data))
3. Run `npm i node-fetch` in terminal ([npm fetch](https://www.npmjs.com/package/fetch))
4. Run `npm i lodash` in terminal ([npm lodash](https://www.npmjs.com/package/lodash))
5. Add `"type": "module”` to package.json in order for this script to run, due to the use of `“import”`
6. Optional: `dotenv` to import the API key from environment variables, else write the API key strings in the code samples below, run `npm i dotenv` ([npm dotenv](https://www.npmjs.com/package/dotenv))
7. Example script:
   1. Get request: Retrieve the personnel record by email. Use the personnel record to find the user id.
   2. Post request: Using the user id, upload external evidence, ensure the proper file type and file path are inputted in the code

**This script is intended to serve as an example template. You will need to configure your local environment and adjust the code to fit your specific use case.**

```
import FormData from 'form-data';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import _ from 'lodash';

dotenv.config()

async function run() {
    // 1. Get personnel record by email to identify userId
    const query = new URLSearchParams({
        q: 'sally@drata.co',
    });
    query.toString();

    let userId;
    try {
        const resp = await fetch(
            `https://public-api.drata.com/public/personnel?${query}`,
            {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.API_KEY}`
            }
            }
        );
        const data = await resp.json();
        userId = _.get(data, 'data.0.user.id');
    } catch (e) {
        console.log(e);
    }

		// 2. Upload file evidence for user by userId
    const form = new FormData();
    form.append('type', 'SEC_TRAINING');

    // 3. Add your file here. If the file exists in the same directory as this script, add only the file name. Else, add the file path.
    const file = fs.createReadStream('/Users/username/Desktop/evidence.png');
    form.append('file', file);

    try {
        const resp = await fetch(
            `https://public-api.drata.com/public/users/${userId}/documents`,
            {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.API_KEY}`
            },
            body: form,
            }
        );
        const data = await resp.json();
        console.log(data);
    } catch (e) {
        console.log(e);
    }
}

run();
```

**Note:**

- Set `type` to one of the supported user document types, such as `SEC_TRAINING`, `HIPAA_TRAINING_EVIDENCE`, or `NIST_AI_TRAINING_EVIDENCE`.
   - To upload NIST AI training evidence specifically, set:
      `form.append('type', 'NIST_AI_TRAINING_EVIDENCE');`

For the full, up-to-date list of allowed values, refer to:

- **[User documents (list + upload) – including the `type` enum with `NIST_AI_TRAINING_EVIDENCE`](https://developers.drata.com/openapi/reference/v1/tag/Users/)**
- **[Find personnel by search terms and filters](https://developers.drata.com/openapi/reference/v1/tag/Personnel/)**[(GET `/personnel`)](https://developers.drata.com/openapi/reference/v1/tag/Personnel/)
- **[Developer portal home](https://developers.drata.com/docs/)**

## Related articles

- [Drata Public API: Get Event Data from Drata](drata-public-api-get-event-data-from-drata.md)
- [Drata Public API: Get All Controls](drata-public-api-get-all-controls.md)
- [Example Evidence for Not Monitored Controls (HIPAA)](example-evidence-for-not-monitored-controls-hipaa.md)
- [Drata Evidence Library Sync](drata-evidence-library-sync.md)
- [Manually Export Evidence Data from Drata](manually-export-evidence-data-from-drata.md)
