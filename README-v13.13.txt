Via Classica v13.13 — FIPI ingestion update

Date: 2026-09-16

What changed
- English source bank expanded from 1281 to 1330 records.
- Added 49 verified official FIPI external-source records from the 2025/2026 FIPI Navigator and the official 2026 English open KIM package.
- Added fipi-ingestion-2026.json with provenance, exact qid/zid/group URLs and ingestion policy.
- External records are deliberately not eligible for automatic in-app checking because their full task text/answer data has not been embedded and verified.
- The source catalog now distinguishes embedded, external, and trainable records.
- sourceReady now returns false for non-embedded source records, preventing source-link records from entering the training picker.
- No FIPI task text or answer was generated or guessed.

Official FIPI basis
- Open EGE bank: https://fipi.ru/ege/otkrytyy-bank-zadaniy-ege
- 2026 open KIM page: https://fipi.ru/ege/otkrytyy-bank-zadaniy-ege/otkrytyye-varianty-kim-ege
- FIPI Navigator 2026 Reading: https://doc.fipi.ru/navigator-podgotovki/navigator-ege/2026/aja-2-chtenie.pdf
- FIPI Navigator 2026 Grammar/Lexis: https://doc.fipi.ru/navigator-podgotovki/navigator-ege/2026/aja-3-grammatika-i-leksika.pdf
- FIPI Navigator 2026 Training Variant 2: https://doc.fipi.ru/navigator-podgotki/navigator-ege/2026/aja-tren.pdf

Current source-bank state
- Total records: 1330
- Embedded source tasks: 0
- FIPI external verified records: 49
- All external FIPI records remain inactive/non-trainable until permitted/verified content is available.

Next safe ingestion layer
The architecture is now ready for content-backed ingestion where the source permits local reuse. For copyrighted third-party materials, Via Classica must remain source-linked unless the user has a reuse licence/permission or the material is otherwise permitted for reproduction.
