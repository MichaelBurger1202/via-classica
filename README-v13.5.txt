Via Classica v13.5

Technical stability patch.

Fixes:
- restores navigation for English topic training, profile and dictionary;
- aligns all asset/cache versioning to 13.5 so GitHub Pages/PWA cannot keep the old v13.1 JS after deployment;
- preserves malformed English localStorage as a backup instead of deleting it silently;
- keeps dictionary delete controls working after search/filter rendering.

Replace the whole published site with this release. Existing localStorage data should remain because storage keys are unchanged.
