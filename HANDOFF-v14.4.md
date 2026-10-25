# Via Classica v14.4 handoff

**Status:** candidate bundle prepared for controlled installation. Prior v14.3 archive and live deployment were left untouched.

## Changes
- Monday-first recurring-schedule display; weekday data encoding is unchanged.
- Clearer actual-duration control.
- Natural-language planner chat: add single/multiple weekdays, passive weekly schedule phrases, date-based one-off tasks, durations, move/edit/remove, weekday-filtered schedule and duration queries. Duplicate additions update the existing item; ambiguous matches ask for clarification.
- Explicit date requests remain on that date. Start time is not persisted; chat says so when a time is provided.
- New PWA cache namespace: `via-classica-v14.4`.

## Verification
- Unit chat/parser: 22/22.
- CDP Chromium DOM flows + responsive checks: 23/23.
- Migration/idempotency: 6/6.
- Service Worker logic: 5/5.
- HTTP resources: 15/15.
- Syntax/data/static checks are described in `TEST-REPORT-v14.4-repetitio.txt`.

## Safe next step
Before replacing a site, export a full backup from the currently used browser and retain the old deployment files. Upload the contents of `vc_design_review/` to the same origin. After deployment verify old data, Monday-first schedule, natural chat commands, actual duration, and real Service Worker state. The pre-install browser context uses mock storage; no real user data was tested or changed.
