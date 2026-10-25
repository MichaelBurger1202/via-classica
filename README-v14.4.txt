Via Classica v14.4 — planner chat and calendar polish
Revision: 2026-10-25

This is a separate controlled-install candidate. It does not publish or overwrite a live site.

What changed
- The weekly regular-schedule display is Monday-first. Stored weekday indices are unchanged (Sunday remains index 0), so existing data does not need conversion.
- The actual-duration control is shorter and clearer: “Записать факт” or “Факт: N мин”. Its explanation says the actual duration changes the available-time calculation.
- Planner chat accepts natural Russian sentences, not only the old colon/comma format: adding a session, adding to several weekdays, casual durations (полчаса, полтора часа, 1,5 часа), changing duration, moving, removing, asking what is scheduled on a particular day, and asking for a session’s duration.
- A bare weekly statement such as “Чтения по субботам” is interpreted as a schedule entry. If duration is omitted, 60 minutes is used and the reply says so.
- Repeating the same lesson/day updates the existing record instead of creating duplicates; ambiguous matches ask for clarification.
- A one-off task with a specific date keeps that date, even if the day is busy. A stated clock time (e.g. 19:00) is not stored; the chat explains that the planner currently uses date and duration only.
- The four example chips fill the composer; they do not send a message until the user chooses to submit it.
- Existing v14.3 storage keys and the English-training module are unchanged. The Service Worker cache is versioned to v14.4.

Files
- index.html, styles.css — layout and responsive styling
- planner.js — planner display, natural-language chat, scheduling and migration
- app.js, english.js — application navigation and English training (retained)
- sw.js, manifest.webmanifest — PWA versioning and cache behavior
- JSON banks/schedules, icons and backup-before-update.html — retained source assets

Pre-install QA
- 56 behavior checks passed: planner-chat logic 22/22; Chromium CDP DOM/interaction checks 23/23; migration checks 6/6; Service Worker logic 5/5.
- HTTP file smoke checks: 15/15 returned HTTP 200.
- JavaScript syntax: 5/5 files pass. 59 HTML IDs are unique, all 7 local HTML asset references resolve, all 5 JSON files parse, CSS braces balance, all 12 Service Worker asset references exist, and the English source bank has 1,342 records with unique IDs.

Important boundary
The browser manager blocks navigating Chromium directly to localhost/file URLs. The actual candidate HTML, CSS and JS were therefore loaded into Chromium using CDP with isolated in-memory storage. This verifies DOM rendering and tested event flows, but it does not verify the deployed origin, the real browser profile/localStorage, native Service Worker installation/update or offline behavior. Those checks belong after controlled installation.

Before replacing an existing deployment, export a full backup from the browser where the current data lives, keep the previous site files, and use DEPLOY-v14.4.txt. No production site was modified by this work.
