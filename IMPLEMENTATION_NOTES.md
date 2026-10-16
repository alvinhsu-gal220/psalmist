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
