Via Classica v14.3 — UI Polish / controlled-install candidate
Audit revision: 2026-10-25

This archive contains the v14.3 app and the latest QA/deployment notes. It is ready for a controlled user-side installation; it does not automatically publish or overwrite a live site.

Main files:
- index.html — app shell, sections and current plan copy
- styles.css — visual design and responsive styling
- app.js — navigation, links and general state
- planner.js / planner-inline.js — planner, migration, backup and schedule import/export
- english.js — English training, grammar practice, dictionary and source routing
- sw.js — PWA cache/update logic
- JSON files — English source bank, FIPI data and example/current schedules

Current corrections:
- all six recurring sessions are seeded (including Saturday Readings 90 min and Saturday Speaking Club 90 min);
- migration adds missing defaults idempotently and preserves existing task/link/check/English data;
- full-backup restore reports rollback outcome clearly if storage writes fail;
- completed 2026 HSE first-round window is no longer worded as an upcoming registration window;
- planner redistribution, cache cleanup and v14.3 cache-busting fixes are retained.

Latest verification (2026-10-25):
- Chromium CDP DOM E2E: 32/32 and 27/27; data migration/idempotency: 7/7; isolated Service Worker logic: 6/6. Total 72/72 checks passed.
- No uncaught browser JS errors recorded; widths 1280/768/390/320 CSS px show no horizontal overflow.
- All five JavaScript files pass syntax checks; 60 static HTML IDs are unique; JSON/manifest and asset references pass; English source bank contains 1,342 unique records; local HTTP smoke test 14/14.

Important test boundary: browser policy prevents direct navigation to localhost in this environment. Actual candidate HTML/CSS/JS was loaded into Chromium with CDP `Page.setDocumentContent`, using isolated in-memory storage mocks. This verifies UI and event-flow logic but not the deployed origin, real user storage, or native browser Service Worker lifecycle/offline behavior.

Before updating an existing installation: export a full backup from the currently used browser, keep the old site files, install this build in a controlled way, and then verify the real-origin storage and Service Worker. Read TEST-REPORT-v14.3-repetitio.txt and DEPLOY-v14.3.txt first.
