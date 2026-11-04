# IndexedDB implementation

Implemented October 13, 2026 against requirements version 1.17 and UX design version 1.0.

## Delivered

- Self-contained `psalmist.html`, rebuilt from editable files in `src/`, retaining the exact original embedded KJV corpus.
- Automatic first-use journal creation and subsequent loading with the journal's saved time zone.
- IndexedDB schema version 2 with profiles, entries, calendar projections, immutable text packs, and metadata.
- Atomic daily saves, per-entry revision checks, restore-generation checks, and live notifications between tabs.
- Indexed month queries; today's reading and historical saved-entry access rules.
- Immediate highlight saves independent of explicit reflection-text saves, overlap validation, midnight locking, and retained empty entries.
- Versioned JSON export with SHA-256 integrity validation, replacement preview, atomic restore, and validation limits.
- Conversion of the previous application's supported KJV `psalmist-data.json` format without modifying the source file.
- Updated visual tokens, responsive layouts, accessible labels/focus indicators, and the retained quotation panel.
- Local launcher and updated usage guide.

## Verification

The two automated browser checks in `work/verify.cjs` and `work/verify-extra.cjs` passed using an isolated Chromium profile. These scripts use the locally available Playwright/browser paths and may need path changes on another computer.

Verified behavior:

1. Automatic initialization, time-zone detection, and no automatically created response entry.
2. Highlights-only saving while retaining unsaved reflection text.
3. Browser saving, refresh, and automatic journal reopening.
4. Highlight overlap rejection, recoloring, removal, and empty-entry retention.
5. Complete versioned JSON download and restoration, including original timestamps and empty entries.
6. Restore preview/cancellation and unsupported-version/corruption rejection.
7. Legacy journal conversion, Psalm 119's eight-verse sections, historical text editing, and missed-date restrictions.
8. Reading boundaries at Psalm 118, all Psalm 119 boundaries, Psalm 120, Psalm 150, and recurring cycles.
9. Rejection of stale revisions and obsolete restore generations.
10. Injected save/quota failure with entry/calendar rollback, retained draft, and successful retry.
11. Injected restore failure after replacement begins, preserving the entire previous dataset.
12. Real two-tab conflict handling with draft retention and explicit review of the latest data.
13. Midnight state refresh, past-highlight locking, and future-reading rejection.
14. A real schema-version-1 fixture upgrade to version 2, retaining the journal and rebuilding its calendar.
15. No horizontal page overflow at 320, 390, 768, 1024, and 1440 px widths; quotation panel retained at each size.
16. No uncaught page-script errors in the main regression run.

Desktop and mobile screenshots were inspected for layout. JavaScript and launcher syntax checks passed. A direct comparison confirmed that the embedded Bible JSON was unchanged.

## Practical limits

- Launch through `Start-Psalmist.cmd` and consistently use `http://localhost:8765/psalmist.html`. Opening the HTML directly is intentionally blocked from creating a separate journal.
- The launcher needs Node.js; it locates the runtime already present on this computer. The generated HTML itself has no package dependencies.
- Tests used Chromium. A separate native Edge/Firefox/Safari compatibility pass and a full assistive-technology accessibility audit have not been performed.
- The launcher script was syntax-checked; the default-browser launch action was not exercised by the isolated browser tests.
- Persistent-storage requests are best-effort after saving. They do not guarantee recovery after clearing site data or device loss; use JSON backups.
- Backup format version 1 and the known legacy journal version 1 are supported. Newer formats are rejected until a corresponding converter is implemented.
- Test data remained in isolated browser profiles. No existing personal journal file was opened or modified by the checks.
- The product requirements were not changed during implementation. `UX_DESIGN.md` remains the design specification; the application and this note record implementation status.

## Past-entry journal UI — November 4, 2026

Implemented the selected past-entry addendum with Ink Free replacing the archived mock's Lucida Handwriting. The response is now a sibling of Scripture in `src/shell.html`. Historical entries use Scripture / response / journal-sidebar columns, independent horizontal collapse controls, and a right sidebar initially collapsed. Today's reading retains direct writing with Scripture above the response.

Past responses open in reading mode. Edit reveals a labeled textarea; Save returns to reading mode only after successful persistence, and Cancel restores the latest committed response without writing. Both response modes use Ink Free at 24 px / 1.95 desktop (20 px at widths up to 420 px). Historical responses use the selected unruled warm paper and procedural grain. Font delivery is system-local, with a cursive fallback where Ink Free is unavailable; no font file or external font service was added.

At widths up to 850 px, each side is a 44 px rail. Opening a side moves its existing content into a native modal drawer with Escape dismissal and focus return. The same DOM controls are reused, avoiding duplicate calendar or backup fields. Drawers close before navigation/restore confirmation dialogs. Notices are outside the collapsing panels, and backup failures remain visible even when the sidebar is hidden.

The IndexedDB schema, transaction layer, backup format, time-zone policy, and launch origin are unchanged. Panel toggles do not write journal data. The delivered `psalmist.html` was rebuilt through `build.ps1`; its Bible JSON is byte-for-byte identical to the pre-change version. The archived `design/past-entry/` reference remains an October 16 snapshot; its font and mock-only handlers are not used by the application.

Verification:

- `node --check src/app.js` and `git diff --check` passed.
- Existing `work/verify.cjs` passed (its historical-edit check now clicks Edit response).
- Existing `work/verify-extra.cjs` passed: quota rollback/retry, atomic restore failure, two-tab conflicts, midnight locking, and version-1 database migration.
- New maintained `work/verify-past-entry.cjs` passed: four panel combinations; read-before-edit; literal markup rendered as plain text; draft preservation; Cancel/no-op behavior; failed past saves and retry; original-date updates with preserved highlights; highlights-only/empty entries; navigation choices; rollover; real two-tab past-entry conflicts; long mobile drafts; and invalid-backup feedback outside the closed drawer.
- Responsive checks passed at 320, 390, 768, 1024, and 1440 px. Mobile drawer Escape/focus return and calendar target widths were checked. Desktop reading/editing and mobile screenshots in `work/` were visually inspected.
- Chromium's platform-font inspection confirmed Ink Free glyphs in displayed response text. The textarea's computed font and its rendered handwriting were checked separately because Chromium's font-node inspection does not expose its native shadow text.

These checks used isolated Chromium profiles and fixture journals, not the user's saved journal. Other browser/OS font availability and a full assistive-technology audit remain unverified. This change does not perform the separately planned TypeScript migration.
