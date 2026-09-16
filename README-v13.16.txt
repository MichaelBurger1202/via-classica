Via Classica v13.16 — full repetitio release
Date: 2026-09-16

Purpose
- Полный технический аудит v13.15 с исправлением найденных ошибок.
- Сохранена source-faithful модель: 1332 записи банка остаются доступны как реальные записи; встроенными считаются только записи с реально присутствующим и проверенным содержимым.
- Никакие вопросы или ответы не генерируются для metadata-only записей.

Important bank status
- Total records: 1332.
- Types: 1168 source-mcq, 115 source-input, 49 source-link.
- Fully embedded and verified: 2.
- Source-assisted / metadata-only: 1330.

Key correctness fixes in v13.16
- External source completion is now stored as neutral (not correct), so it cannot inflate accuracy or create false error statistics.
- Profile and adaptive statistics count only explicit true/false results.
- English module is labeled adaptive rather than AI where no AI service is actually running.
- Release/cache asset versions synchronized to 13.16.
- Removed unverified hard-coded exact dates for individual HSE/VSOSH attempts from the planner's month fallback; retained only verified planning-window reminders.
- Source catalog now explicitly distinguishes fully embedded records from source-assisted records.

Copyright/source handling
- Third-party Cambridge/IELTS material is not copied into the site merely from metadata. The site opens the original source when embedded text is not already present and verified.


SOURCE-BANK COMPLETION UPDATE
- All 1332 source-bank records are eligible for the English training flow.
- Metadata-only records are no longer presented merely as a link: their original source is rendered inside the training screen in an iframe, with an external-open fallback.
- Where a verified answer key exists in the bank, the learner can enter the answer in Via Classica and it is checked against that key.
- Where no verified key exists, the task can still be completed as source study, but is not scored as correct/incorrect.
- No task text is AI-generated or reconstructed without a source.
