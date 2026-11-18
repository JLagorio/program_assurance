# Access reviews

Source: https://help.vanta.com/en/articles/11345416-access-reviews
Fetched: 2026-11-17

## Purpose

- Confirm who should keep access to each application, record a decision per account, and collect evidence of each access change.
- Flow: create (Draft) → Start review (In review) → review accounts per application → Submit each → add access-change evidence → Complete.
- Vanta records decisions; it does not change access in the applications.

## Layout

- Access page (Personnel > Access): title "Access", settings gear at the end; tabs Suggestions, Accounts, Requests, Reviews, Deprovisioning tasks.
- Reviews tab, two cards:
  - "Applications by inherent risk score": donut "201 Total applications"; Critical 34, High 69, Medium 33, Low 9, Unscored 56.
  - "To-do list": rows with an empty circle, the task, the schedule name and a due date: Complete access review (Due Nov 24), Start review · All systems annual (Due Nov 15), Complete review · All systems annual (Due Nov 29), Start review · Critical Systems (Due Apr 1).
- Reviews toolbar: Search; Owner, Status; primary Create (menu: Create review, Create schedule); table settings.
- Reviews table: Name (with "Adhoc review" or the schedule name under it), Owner, Date created (sorted descending), Date started, Date completed, Status, row "⋯". Footer "1 to 5 of 997 results", Show per page.
- Create a schedule (full-screen): Close, title; top progress bar; left steps 1 Select a starting point, 2 Configure settings, 3 Define applications in scope, 4 Finalize schedule; main "Configure settings": Schedule owner, Schedule name (placeholder "High-risk applications quarterly"), Schedule timing as sentences ("Scheduled access reviews begin on [December 1, 2026]", "Each access review takes [14] days to complete", "Repeats [quarterly]") with notes; right "Preview": PROJECTED UPCOMING REVIEWS (Dec 1, 2026 - Dec 15, 2026 "Review will be auto-created on Nov 24, 2026", then Mar and Jun 2027); Back, Next.
- Review page (Draft): breadcrumb "Access Reviews"; title (date "Nov 13, 2026") + Draft badge; "Draft created: Nov 13, 2026"; at the end a three-step tracker Draft → In review → Completed, More, primary Start review.
  - Dismissible checklist "Before starting your review": 1 Assign reviewers; 2 Upload access data (Optional).
  - Card "Access data status": donut "2 Applications"; Applications requiring access file 0, requiring connection 1, ready to review 1.
  - Table: Application (logo, name, domain), Reviewer, Access Data (Synced + time, or Needs access data + "Connect or upload data to review ac…"), Status (Not started), upload icon, "⋯".
- Review page (In review): title + "In review" badge; "Draft created: Nov 11, 2026 / Started on: Nov 11, 2026 / Complete by: Nov 25, 2026"; tracker with Draft done; More, primary Complete; tabs Applications, Access changes (2) with a dot.
  - Access changes: info banner "Remove access or modify access levels for each account"; Search, Application, Account name filters; table Application, Account name, Reviewed by, Review decision (Deny ac…, Change …), Note, Task, Remediation Status ("Evidence added", date).
- Application review page: breadcrumb "Access Reviews / Access Review Test"; logo + "Asana"; Export, Submit (disabled), reviewer icon.
  - Card "Vanta AI Recommendations" (Preview): Approve 4, Deny 1, Needs review 0, No insight 0, with bars.
  - Card "Conduct your user access review": checklist with counts: Assign an owner to each account 5/5 (struck through when done), indicate approve/deny/change roles 3/5, add a note for denied accounts 0/2.
  - Toolbar: Search; Role, AI recommendation, Status; + Add filter.
  - Table: ACCOUNT NAME (link), ACCOUNT OWNER (name, title, pencil), ROLE (Member), AI RECOMMENDATION (Approve / Deny, dotted underline), REVIEW DECISION (three buttons Approve, Deny, Change roles; chosen one filled green / red / orange), STATUS (green check, amber warning, empty ring). Footer "1-5 of 5 results", Show 100, Previous, Next.
- Settings > Features > Personnel, tabs SLAs, Security tasks, Access reviews, Setup: cards Access review schedules (Active / Archived; SCHEDULE with owner under it, RECURRENCE, START DATE; + Create a schedule), Admin point of contact, Due date ("Adhoc access reviews are due [14] days after clicking 'Start review'"), Reminders (two "[3] days before…" sentences), External notifications.

## How you get here / where it leads

- → Personnel > Access > Reviews.
- → Create > Create review (name, applications, Create draft review) → Draft review page.
- → Create > Create schedule → four-step schedule wizard → Save schedule (first review created 7 days before the start date).
- → review → an application → account review page → Submit.
- → review → Access changes tab → add evidence → Complete → list of document tests holding the review file.
- → linked task in the task tracker (Remediation task tracking, article 11345754).
- → Vendors (applications are vendors; reviewers default to each vendor's Security owner).
- → Personnel records (account owners link to them).
- → Settings > Features > Personnel > Access reviews.

## Actions

- Create review; Create schedule; Create draft review; Save schedule; Edit / Archive / Unarchive schedule.
- Start review; Complete; Submit (per application); Export (XLSX); Rename; Delete; More.
- Assign reviewer (user or team); upload access data (screenshots via AI parser, or CSV / XLS / XLSX template).
- Per account: assign owner (pencil), Assign to external person, Mark as service account; Approve, Deny, Change roles; add decision note; create linked task.
- Evidence: remediation note, evidence file, or close the linked task.

## States and numbers

- Review status: Draft, In review, Completed (no changes after).
- Application status: Not started, Processing, In progress, Completed.
- Access data: Synced, Needs access data, File uploaded.
- Decision rules: Deny needs a note or linked task; Change roles needs a note; a self-review needs another reviewer or a reason.
- Submit when every account has an owner and a decision; Complete when every application is Completed and every Deny / Change roles has evidence.
- Counts seen: 997 reviews; 201 applications; owners 5/5, decisions 3/5, notes 0/2; up to 150 applications per schedule.
- Due date = start + days (settings 14; schedule's own).

## Vocabulary

- Access review, one-time (Adhoc) review, schedule, Review Owner, Schedule Owner, Application Reviewer, Account Owner.
- Application, access data, account, role, review decision (Approve, Deny, Change roles), decision note, linked task.
- Access changes, remediation status, evidence, AI recommendation, service account, external person.
- Applications by inherent risk score, To-do list, Due date, reminders.

## Screenshots

- `access-reviews-01.png`: Access > Reviews tab: risk-score donut, To-do list, reviews table.
- `access-reviews-02.png`: Create a schedule wizard, step 2, with projected upcoming reviews.
- `access-reviews-03.png`: Draft review: status tracker, before-you-start checklist, access-data donut, applications.
- `access-reviews-04.png`: Account review for Asana: AI recommendations, checklist with counts, Approve/Deny/Change roles per row.
- `access-reviews-05.png`: In-review review, Access changes tab with remediation evidence.
- `access-reviews-06.png`: Access review settings: schedules, point of contact, due date, reminders.

## For Program Assurance

- A three-step tracker (Draft → In review → Completed) beside the one primary that moves it (Start review, Complete) fits an assessment campaign's plan → execution → results.
- A checklist card whose lines carry counts ("5/5", "3/5", "0/2") and strike through when done says what blocks Submit without prose; fits an assessor's control sheet.
- Decision buttons inline per row with rules that require a note for the negative outcomes map to recording determinations (Other than satisfied needs a rationale).
