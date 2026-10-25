# Via Classica v14.6 — handoff

## Project status
Candidate fixes recurrence resurrection, natural-alias matching, and storage-write error handling. Archive root is flat for deployment into the site root.

## Key code changes
- `planner.js`: introduces `removedRecurringDefaults` tombstones, transaction rollback on failed writes, migration recovery from recent v14.4 chat deletion history, activity-aware natural-language matching, and tombstone-aware schedule export/import.
- `app.js`: renames selector helpers to `vcQuery`/`vcQueryAll`; in the isolated Chromium context this avoids a parser-level identifier collision encountered by the previous test harness and restores `window.showViaPage`.
- `index.html`, `sw.js`, `manifest.webmanifest`: cache/resource version v14.6; supported backup copy list updated.

## Validation
- `/mnt/data/vc146_cdp_test_v8.cjs`: 23/23 interaction tests pass.
- `/mnt/data/vc146_sw_test.cjs`: 8 Service Worker lifecycle/fetch assertions pass.
- JS syntax, JSON, ID uniqueness, refs, SW assets and 13 local HTTP smoke requests pass.
- The report is `TEST-REPORT-v14.6-repetitio.txt`.

## Data migration caveat
v14.4 can reseed a standard recurring item at the next startup. If the user removed it by the × button and it has already reappeared, old storage no longer proves that deletion was intentional. After deploying v14.6, delete that item one more time. For a delete confirmed through chat, migration scans the retained chat history for the matching assistant response and tries to preserve the deletion.

## Not yet verified
Actual deployed production version, live-origin localStorage, and real PWA Service Worker activation have not been inspected. User must run the post-deploy checks in `DEPLOY-v14.6.txt`; do not claim full release acceptance before then.
