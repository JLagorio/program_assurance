# Section B: where the workflows break (folder `flows`)

Question: where do the jobs a system security engineer does in this prototype break down, and how does
Vanta's equivalent go?

Walk each job by actually clicking in the prototype (a Playwright script that clicks what a person would
click, logging each step, with a screenshot at each break). Jobs:
1. Start a program: Create program → categorize (ITCSC) → baseline → team → Getting started.
2. A morning: land on Home or My work → act on the top item → come back.
3. A control from nothing to satisfied: implementation → requirement → evidence → assessment result.
4. Evidence: add or collect it, link it to a control, have it reviewed and accepted.
5. A finding → POA&M item → risk accepted.
6. An assessment campaign: plan → run → publish results.
7. The SSP: edit a narrative → review → submit to the AO.
8. A person: onboard, offboard, an access review.

For each job record: the steps and clicks it took; each break, typed as one of dead end (nowhere to go
next), fake (a control that only toasts or does nothing), wrong place (lands somewhere unexpected),
lost context (filters, the record or the program forgotten), contradiction (two screens disagree on a
number or a status), detour (more steps than needed), unclear next step (a person would not know what
to press); and Vanta's path for the same job from the notes and journey.md, with its step count.

Also list every visible control you met that does nothing, and any place two screens show the same fact
differently. Do not judge colours or looks; another agent does that.

report.md structure: a table (job · our steps · Vanta's steps · breaks by type) first, then a section per
job, then the cross-cutting breaks ranked by how often a person would hit them.
