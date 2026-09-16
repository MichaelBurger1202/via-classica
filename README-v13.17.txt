Via Classica v13.17 — release integrity + full repetitio
Date: 2026-09-16

Release purpose
- Finalize the current Via Classica tree as a coherent continuation of the live v13.8 baseline through v13.16.
- Re-audit the assembled release rather than mixing files from unrelated intermediate versions.
- Preserve all accumulated planner, English source-bank, FIPI, PWA, storage, dictionary, import/export, navigation and mobile fixes.

Continuity check
- Baseline checked: v13.8 archive.
- Intermediate release notes present in this tree: v13.8.1, v13.8.2, v13.9.2, v13.11, v13.12, v13.13, v13.14, v13.15, v13.16.
- v13.17 is built from the audited v13.16 release tree, not by cherry-picking files from older releases.
- Historical README and test-report files are retained as documentation only; runtime files use the single 13.17 release/cache version.

English source bank
- Total records: 1332.
- Types: 1168 source-mcq, 115 source-input, 49 source-link.
- Unique IDs: 1332/1332.
- Records with HTTP(S) source URLs: 1332/1332.
- Fully embedded and verified local tasks: 2.
- Source-assisted records: 1330.
- No task text or answer is generated for metadata-only records.
- Source-assisted records are reachable in training and use the original source in an in-session frame with an external-open fallback.
- Neutral completion is stored as correct=null; it is excluded from wrong-answer/adaptive-error statistics.

v13.17 corrections found during the final audit
1. Fixed an adaptive-picker regression where neutral source-assisted completions (correct=null) were being counted as errors because of a truthiness check. Only explicit correct=false results now increase error pressure.
2. Removed the stale "AI training" label from the main English training entry point; the local flow is deterministic/adaptive and is now labelled accordingly.
3. Updated the source-bank catalog label, CSS comment, manifest, service-worker cache name and all runtime asset query strings from 13.16 to 13.17.
4. Updated the service-worker registration version to 13.17 so an installed v13.16 PWA is invalidated by the new release.
5. Removed stale v13.16 runtime references from active application files. Historical documentation remains versioned and unchanged.

Integrity checks
- app.js: syntax PASS
- planner.js: syntax PASS
- english.js: syntax PASS
- sw.js: syntax PASS
- index.html static IDs: 67 unique / 67
- Local runtime asset references: resolved
- Bank IDs: 1332 unique / 1332
- Bank source URLs: 1332 valid HTTP(S) strings / 1332
- Release/runtime version consistency: 13.17
- PWA cache/query version consistency: 13.17
- Source-assisted null-result handling: PASS
- No-repeat pool: uses the complete 1332-record eligible bank and recycles only after exhaustion
- Manual topic pool: uses the same source bank and does not write long-term correct/incorrect results by itself
- Corrupt localStorage normalization/backups: retained from v13.16
- Planner/import/export/navigation/mobile fixes: retained from v13.16

Important source-faithfulness limitation
The release does not claim that 1332 records have their full task text copied into local files. Only two records are locally embedded and verified. The remaining 1330 are source-assisted because their current bank records contain metadata/source references rather than reusable task text. This is intentional: Via Classica does not fabricate or reconstruct missing copyrighted content.
