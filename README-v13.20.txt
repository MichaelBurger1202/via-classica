Via Classica v13.20

Purpose
- Targeted English-module repair after user report, followed by repetitio 10.
- Base: v13.19 REAL archive.

10 real defects fixed
1. English module buttons navigated through showViaPage(), which always scrolled to the top. Fixed: same-page navigation preserves the current scroll position.
2. Topic picker exposed mostly exam-part labels rather than a pedagogical layer. Fixed: human-readable topic tracks are now presented separately from exam formats.
3. The topic picker mixed subject concepts and exam formats without distinction. Fixed: descriptions explicitly distinguish format-based tracks from subject/skill tracks.
4. The requested granular topics (present/past tenses, conditionals, passive, modals, etc.) had no verified mapping in the current source bank. Fixed: the UI now states this limitation instead of inventing mappings.
5. Source catalog showed only source-level cards, not individual bank records. Fixed: catalog now exposes individual records and can launch a selected task.
6. Source catalog had no search. Fixed: full-text search by ID, source, topic, level and question number.
7. Source catalog had no source/topic filters. Fixed: source and pedagogical-topic filters added.
8. Catalog-launched tasks had no dedicated return path. Fixed: catalog mode returns directly to the catalog after completion.
9. Cambridge PDF tasks depended on an embedded Google Viewer/direct PDF iframe that was blank/unreliable on the tested mobile browser path. Fixed: Cambridge PDF records now use the official Cambridge B2 First preparation page inside the training window, with the original PDF URL retained as the source fallback.
10. External source frames had no deterministic timeout fallback. Fixed: load/error handling shows retry + official-source fallback after 7 seconds.

Source policy
- No Cambridge/FIPI question text is fabricated or generated.
- Existing embedded FIPI records remain local and searchable.
- Metadata-only source records remain source-assisted.

Versioning
- Active runtime/cache/manifest version: 13.20.
