Via Classica v13.14 — FIPI embedded ingestion continuation
Date: 2026-09-16

Changes from v13.13:
- Continued real FIPI ingestion from the verified 2025 FIPI corpus / public mirror where direct FIPI task pages are inaccessible to the build environment.
- Embedded two real Reading tasks with official FIPI qids and preserved official source URLs:
  - F719D4 — Taiga
  - A22095 — Coral reefs
- Added full visible task content, option lists, answer keys, provenance to the public mirror, and active=trainable status for these two records.
- Kept the remaining FIPI external records inactive until their actual task text and answer data can be verified.
- Synced english.js bank with english-source-bank-v1.json.
- Release version bumped to v13.14.

Current bank status:
- 1332 total records.
- 49 external FIPI pointer records.
- 2 embedded verified FIPI records.
- 2 active embedded FIPI records.
- 0 generated tasks.
- Unique IDs: required and checked.

Important limitation:
Direct container access to ege.fipi.ru/doc.fipi.ru is blocked by DNS/network restrictions in this environment. The official FIPI pages confirm the qids and open-bank provenance; embedded text for the two tasks above was checked against a public mirror of the FIPI 2025 open-bank corpus. No answer was invented.

The remaining external records are deliberately not activated. This prevents metadata-only or unverified tasks from entering the adaptive training picker.
