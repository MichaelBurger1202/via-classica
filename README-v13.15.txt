Via Classica v13.15 — full source-bank training flow
Date: 2026-09-16

Purpose
- Remove the previous artificial bottleneck where only content-embedded records could enter an English session.
- All 1332 records from english-source-bank-v1.json are now eligible for the English training flow.
- No task text or answer is generated when the bank does not contain verified content.

Behavior
- Fully embedded records (currently 2) are rendered and checked inside Via Classica.
- Metadata/source records open their original source directly from the training screen.
- If a verified answer key exists in the bank, the user can enter the answer and Via Classica checks it.
- If no verified key exists, the user explicitly marks the source task as completed; no answer is invented.
- Source records are no longer silently excluded from adaptive/manual task selection.
- Existing no-repeat history logic applies to the whole 1332-record source bank.

Bank integrity
- Total records: 1332.
- Types: 1168 source-mcq, 115 source-input, 49 source-link.
- Fully content-embedded: 2.
- Metadata/source records: 1330.
- No generated tasks added.

This version is intentionally source-faithful: it makes every bank record reachable in the application without pretending that metadata-only records contain text that is not actually present in the bank.
