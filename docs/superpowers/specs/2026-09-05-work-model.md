# The work model: records, tasks, activity, stages

2026-09-05. What Josef and the session agreed about how work gets done in the product, and what was built for it in one uncommitted batch. The talk came first; the build followed it.

## 1. The problem Josef named

The platform had states but no tasks, so every screen was a reading and not a to-do. It had information everywhere, so the reader's eyes scanned for what mattered. Controls were assigned to engineers, which nobody does. The road from a brand-new system to a package ready for authorization was not visible. And the model had to stay modular: a business function should be assessable on the same engine as a weapons system.

## 2. The frame: a CRM

Every CRM has the same constructs and it does not matter what business you are in. Account, contact, opportunity, activity, campaign. Types on each. Stages per pipeline that the customer decides. A record page that shows only what is critical, the rest in a rail. The work happens outside and is brought back in.

The mapping is one to one. The program is the account. People and teams are the contacts. Controls in scope are the opportunities, each on a pipeline. Requirements are the line items. Evidence is the attachment. The activity feed is the activity. Assessment events and gates are the campaign.

## 3. Two owners, one atom

- **Control owner**: accountable, one of the assurance team, per control per scope. Never an engineer. They make sure the control is met by chasing whoever implements it.
- **Implementation owner**: responsible, the engineer or team on a requirement on a component. The allocation already records this. They may never log in.
- **Task**: the atom. A verb and an object, a subject record, an assignee, a requester, a due date, and a state: Open, Waiting on someone, Blocked, Done. A task born from a control's gate closes when the gate is met: done by artifact, not by a tick.

## 4. One log

Every mutation is an entry: a note, a comment, a task asked or closed, a request to a person, a link to evidence, a field changed, a stage moved, an owner taken. A record's feed is the log filtered by subject; a person's queue is the log filtered by their mentions; a program's Activity tab is the log filtered by program. Nothing is edited or removed. "Two weeks later it's all tracked" comes for free because there is no other way to change anything.

The log bar is the whole idea: on every record, Note, Task, Request, Evidence. Request records that you asked someone for something and sits as Waiting on them until you log what came back.

## 5. Stages, not RMF

RMF's seven steps are the default template and nothing more. A program has a stage set: names in an order, from a template, renamed or extended per program. The strip on the overview says where the program is; moving it is an act with a confirmation and a log entry. No gates, at Josef's "don't force stages".

## 6. Where words are allowed

A title, a requirement's shall text, a narrative, an evidence description, a comment. Everything else is a field, a count, a name, a date or a status. The header is the trail, the name and the actions; everything not needed on every load is the rail's. Reference prose folds in the rail.

## 7. What was built

### Product compositions (`src/components/app`)

Boundary revised after review: these workflows belong to the prototype. Their thin wrappers consume shared Ledger patterns (`Composer`, `TaskRow`, `Timeline.Item`) and are documented in the application Storybook under Product/Workflows. Mention serialization lives in `src/lib/mentions.ts`.

- `Activity`: the feed on a large Timeline; `Activity.Item` with a face or the kind's icon; `Activity.Group`; `Activity.Text` drawing `@[Full Name]` mentions as `Activity.Mention`; `Activity.Composer` with `@` completion over `people`, Up/Down, Enter or Tab to write the mention, ⌘↵ to post; `Activity.LogBar`. `parseMentions`.
- `Task`: one row on the shared TaskRow (the box, the ask, the subject when the list spans records, the assignee, the due, the Waiting or Blocked badge; done is a line through the title) and `Task.List`.
- Shared-package changes: generic `Composer` and `TaskRow` contracts and neutral stories; `Timeline.Item` already handles feed presentation. Product adapters supply event mappings, task status content and mention serialization. `RecordHeader` `facts` deprecated.
- Both workflow families retain their docs, matrices and interaction coverage in the app test suite.

### Model (`src/lib`)

- `activity.ts`: `record`, `activityFor`, `activityForProgram`, `activityByActor`, `mentionsOf`, `relativeTime`, `groupByWhen`, the dataset clock.
- `tasks.ts`: create, complete, reopen, state, reassign, due; `tasksFor`, `tasksForProgram`, `tasksAssignedTo`, `tasksWaitingOn`; `resolveGateTasks` and `gateTaskFor`; `askFor` (the imperative behind each gate); seeds.
- `stages.ts`: stage sets, `stagesFor`, `stageOf`, `setStage`, `setStages`.
- `control-work.ts` forwards every work event into the log as a sentence after the actor's name.
- `requirements.ts` gains `mapRequirementToControl`; `people.ts` gains `mentionablePeople` and `personByName`.

### Prototype

- Control record: header (trail, title, Assign to me, the primary verb, More), rail (Details with the owner editable, Linked, Catalog folded), body (Next from the unmet gates with one-click gate tasks, Implementation, Requirements with Map requirements, Evidence, Tasks, Assessment, Activity with the log bar).
- Program record: nine tabs; Overview is the stage strip, the coverage band, open tasks and the recent feed; Tasks tab by state; Activity tab with kind filters; rail Details, Team, Categorization, Authorization, Inherits from.
- Node and requirement records: facts to the rail, Tasks and Activity sections.
- `/work`, My work: assigned to you, waiting on others, mentions, your recent activity; the nav's count is the open tasks.
- The task table (2026-09-06, `src/components/app/task-table.tsx`): the program's Tasks tab and My work on the kit's DataTable, banded by when, who, record or state; saved views with counts; assignee, due and state edited in the row; a row opening in a panel beside the list, ⌘↑ ⌘↓ stepping through it; the task as a record at `/tasks/$taskId` with its own log. The compact list under a record stays a list.

### Verified with real input

Assign to me sets the owner and removes the button. `@Joe` opens the people list, Enter writes `@[Joel Barrantes]`, Post puts the entry in the feed with the mention drawn. Add task on the narrative gate creates the task and the gate row says who has it. Writing the statement closes that task by artifact and the feed says so. Moving the program to Assess asks, moves, and logs.

## 8. Not built, decided later

Objective-level derivation. Attestations for organisational and inherited controls. Exit criteria on stages. A response link for people outside the platform. Control titles beside ids in forwarded entries. The old modules the re-cut left unrouted, listed in `docs/next.md`.
