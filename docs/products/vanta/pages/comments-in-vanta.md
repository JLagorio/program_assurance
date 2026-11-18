# Comments in Vanta

Source: https://help.vanta.com/en/articles/11408427-comments-in-vanta
Fetched: 2026-11-17

## Purpose

- One notification view for every comment a user is tagged in or that concerns them, across Audits, QAuto, Tests, Documents, Controls, Policies and Risks.
- Controls who sees a comment: the internal team only, or the auditor too.

## Layout

- Top bar: bell icon (with an unread dot) beside help, announcements, settings and the avatar.
- Comments popover (anchored under the bell): header "Comments" with an unread count badge (4) and a dropdown chevron; at the end a mark-all-read double check and Close "x".
- Popover list, one row per comment: author avatar (initials, or a clipboard icon for an auditor), "<Author> commented on <object>" (object in bold), a quoted excerpt truncated with "…", age at the end ("11d", "12d"). Unread rows have a purple bar at the start and bold text.
- Object's Comments tab (audit evidence panel): tabs Details, Related controls, Audit activity, Comments. Thread entries: author, "Auditor" badge where relevant, timestamp ("Nov 26, 7:15 AM"), text; @mentions as chips. A note "This is an external facing conversation." above the composer. Composer: "Comment or add others with @…", send button; checkbox "Request auditor review. Checking this box updates the evidence status to 'Ready for audit'".
- Behind the popover (Controls page, partial): "Completion" card with Controls OK 11%, progress bar, 510 controls; cards 269/510 53% and 64/2938 2%; an Owner column; Add control.

## How you get here / where it leads

- → bell icon in the top right.
- → a notification → the full comment thread on that object ("Go to Comment").
- → Audit Hub comment with Request auditor review → evidence status "Ready for audit".

## Actions

- Open notifications (bell); Mark as Read (clicking marks read, removes bold); mark all read (double check, inferred); Close.
- Go to Comment.
- Comment, @mention.
- Request auditor review (checkbox).

## States and numbers

- Visibility table:
  - Test & Documents: Admins, Editors & Owners; auditor: No (internal only).
  - Policies (Drafting): Admins & Editors; auditor: No (internal only).
  - Audit Hub: Admins, Editors & Auditors; auditor: Yes (if shared).
- Comments on a Test or Document page outside the Audit Hub are always internal.
- Notifications appear within 30 minutes of posting; no back-fill of older comments.
- Unread vs read: purple start bar + bold vs plain.
- Users without comment access see no bell.

## Vocabulary

- Comment, Comment Notifications, thread, tagged, owner.
- Audit Hub, auditor, internal only, external facing conversation.
- Request auditor review, evidence status, Ready for audit.
- Policy Editor, QAuto.

## Screenshots

- `comments-in-vanta-01.png`: Comments popover open under the bell, 4 unread, over the Controls page.
- `comments-in-vanta-02.png`: Evidence Comments tab with auditor thread and the Request auditor review checkbox.
- `comments-in-vanta-03.png`: Same Comments popover with all rows read (no count badge).

## For Program Assurance

- Comment visibility as a property of the place (internal record vs the assessor's audit space) maps to internal notes vs SCA/AO-facing discussion.
- A comment that flips evidence to "Ready for audit" ties conversation to workflow state: one checkbox, no second step.
- One inbox for every comment on records a person owns, not only @mentions.
