Via Classica v13.1 — stability hotfix

Based on v13. Fixes:
- safer localStorage parsing for core app and English module;
- validates/restores malformed English sessions instead of getting stuck;
- English module renders when the English menu page is opened;
- guards empty/invalid manual task pools and completed sessions;
- service worker registration/cache bumped to v13.1 to prevent mixed cached files;
- manual dictionary phrases are stored as the full phrase key;
- existing user data is preserved whenever it is valid.

Replace the site files in GitHub Pages with this archive. After deployment, reload once.
