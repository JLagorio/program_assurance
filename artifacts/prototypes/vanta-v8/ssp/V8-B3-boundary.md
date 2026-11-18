# Builder 3: onboarding and the boundary (ITCSC, interconnections, ports and protocols)

Read `V8-COMMON.md` (same folder) first. Your files are `mod-v8-boundary.js` and `.css`, with the CSS prefix `v8b-`. You may also edit `PROTO/mod-program-new.js` (the Create program walkthrough) to add the ITCSC start. Keep its steps and buttons (`data-pn="next"`, `data-pn="create"`), and keep `node PROTO/../ssp/flows7.mjs PROTO/out/v8-boundary.html` passing.

## 1. The ITCSC (routes `itcsc` and `itcsc-import`)

The **IT Categorization and Selection Checklist (ITCSC)** is the Air Force RMF form a program completes to categorize its system and select its baseline and overlays. The AO and the PM sign it. Josef calls its import "important for program onboarding". The public AF ITCSC v2.0 form's text is at `PROTO/../dod/itcsc/af-itcsc-v2.0.txt`. Read it: its sections, questions, options and instructions are your structure.

- **§1 System identification:** name, acronym, version, ITIPS, DITPR and eMASS numbers.
- **§2 Technical description and purpose.**
- **§3 Authorizing official:** Weapons is one of its AO boundaries.
- **§4 Operational status.**
- **§5 Proposed IT and the authorization boundary:** for WS-X90, a PIT system. The boundary narrative names every external interface crossing it (removable media, RF, Ethernet, Wi-Fi).
- **§6 Overlays:** Intelligence, Cross Domain Solution, NC3, Space Platform, Classified Information, and mission or function specific.
- **§7 NSS designation (7A–7F):** 7D asks "equipment that is an integral part of a weapon or weapons system".
- **§8 Cloud:** impact levels IL2, IL4, IL5 and IL6.
- **§9 Privacy:** PII types and the PII confidentiality impact level.
- **§10 Categorization:** information types, each rated C, I and A, giving the final categorization.
- **§11 The RMF team:** AO, AODR, PM, SCA, ISSM, director of engineering or ISSE, user representative, requirements lead and primary POC.
- **Then:** the summary page and the AO and PM signatures.

### `itcsc`: WS-X90's ITCSC, a record (nav WS-X90 › ITCSC)

- **Header:** version (e.g. "Version 3, approved Sep 2, 2026", Example), status (approved and signed), owner, and facts.
- **Tabs: Checklist · Summary · Approval · History.**
- **Checklist:** the sections in order, answered from WS-X90's real data where it exists:
  - name, acronym and description;
  - its AO R. Calloway;
  - Platform IT;
  - NSS yes (7C and 7D);
  - categorization C High · I High · A Moderate;
  - overlays as WS-X90's baseline layers map onto §6: CNSSI 1253 is the NSS baseline, and Mission Assurance and Deployed Platform are mission or function specific. Say how they map;
  - the team from `PA.SSP` roles and people.
  - Check the database for program fields (categorization, description) with a SELECT. Where an answer isn't recorded, mark it Example.
- **Summary:** the form's summary page, filled in.
- **Approval:** AO and PM digital signature steps (`AK.approval`), with dates.
- **History:** earlier versions and what changed between them (e.g. availability raised from Low to Moderate, which changed the baseline: link `baseline`).
- **A banner where the program has moved since approval:** for example "2 external interfaces added since version 3: re-approval needed" (→ `interconnections`).
- **Actions:** Export as AF ITCSC (inert, toast) and Start a new version.

### `itcsc-import`: import a completed ITCSC

1. Upload a filled PDF or Word ITCSC.
2. The "ITCSC reader" agent reads it: "37 of 41 fields read", with what it couldn't read. Builder 1 lists this agent in AI agents (`ai-drafts`).
3. Review field by field:
   - the value read, with its confidence;
   - where it lands: program details, categorization, overlays → baseline layers, team → program roles, boundary narrative → composition notes, each external interface → a draft interconnection;
   - conflicts with what the program records, highlighted.
4. Then **Apply to WS-X90**, or **Create a program from this ITCSC** (→ the walkthrough, prefilled).

### Program creation (`mod-program-new.js`)

- **Step one:** offers "Start from an ITCSC" beside starting blank. It opens a compact import (upload → fields read), then continues.
- **The later steps:** show what came from the checklist ("From the ITCSC" on each prefilled field, and a count per step), on details, systems or boundary, baseline (categorization and overlays) and team.
- **The starter guide (`program-start`):** includes "ITCSC: approved" or "Sign the ITCSC" as a step.
- **Getting started:** add "Import or complete the ITCSC" with `PA.decorate("getting-started", …)`.

## 2. Interconnections (route `interconnections`, CA-3)

A register of the connections that cross WS-X90's boundary. Use the composition's real elements that sit on the boundary (the Protected Network Gateway, the Tactical Data Radio, the maintenance ports): grep `mod-v7-program.js` and `PA.SSP` elements.

- **Tabs:** All, Expiring in 90 days, No agreement, Expired.
- **Columns:**
  - the connection;
  - the connected system and its owning organization and AO;
  - the type (Ethernet, RF data link, removable media, maintenance port, VPN over DISN);
  - data (classification and direction);
  - encryption (NSA Type 1 such as a HAIPE device, FIPS 140-3, or CSfC);
  - the agreement (ISA, MOU or MOA, with status Signed, Draft, Expired or Not required);
  - expiry (`AK.due`);
  - owner.
- **A row's panel:**
  - the boundary element it crosses (→ `composition`);
  - the ports and protocols it uses (→ `ppsm`);
  - the agreement document (evidence), with renewal as an approval by both AOs;
  - controls CA-3, SC-7 and SC-8 with their WS-X90 status;
  - last review, and comments.
- **Data:** connected systems are Example unless the database or the old screens hold them; plausible ones are a mission planning system loader, a tactical data link, a SIPRNet gateway, a depot maintenance laptop by removable media, and a GPS receiver. Several agreements must be expiring or missing, so the tabs mean something.

## 3. Ports, protocols and services (route `ppsm`)

Today this is only text inside the SSP.

- **A register:** port, protocol, service, direction, the boundary it crosses (internal only, enclave, DISN), the interconnection or element using it, and its DoD PPSM Category Assurance List assessment. Verify the CAL terms (assurance categories under DoDI 8551.01) with one web search, and use them exactly.
  - Also show registration in the DoD PPSM registry (Registered, Pending, Not required for internal only) and the owner.
- **Tabs:** All, Crosses a DoD boundary, Not registered, Conditional.
- **A row's panel:** where it's used, the vulnerability assessment's conditions, the controls (CM-7, SC-7), and "Shown in SSP" (→ `ssp`).
- **Data:** grep the SSP data and editor for ports and services that WS-X90 already names (`mod-a-ssp-data.js`, `mod-ssp-editor.js`), and use them as real. The rest is Example.
