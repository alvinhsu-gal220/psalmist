# Psalmist TypeScript Migration Plan

Version: 1.0  
Date: October 13, 2026  
Status: Proposed plan; migration has not started  
Baseline: current IndexedDB application, requirements version 1.17, and UX design version 1.0

## 1. Objective

Adopt TypeScript to make journal records, storage operations, backup compatibility, UI state, and future maintenance easier to check before the application runs.

Migrate in small, reviewable phases. Keep the working application available throughout the migration and verify each phase before proceeding. This is a source-code and development-tooling change, not a new product feature or a data-format redesign.

## 2. Compatibility commitments

The migration must preserve:

- The self-contained `psalmist.html` page and its exact embedded KJV Bible text.
- The launcher entry point, `Start-Psalmist.cmd`, and the established browser origin, `http://localhost:8765/psalmist.html`.
- Automatic first-use time-zone detection and journal initialization with no setup page.
- Existing IndexedDB name `psalmist`, schema version `2`, keys, indexes, stored record shapes, and scheduling settings.
- Portable backup format `psalmist-backup`, format version `1`, canonicalization rules, checksum calculation, and legacy journal import support.
- One entry per date, date-specific highlights, retained empty entries, and original timestamps during restoration.
- The 171-day sequence and all 22 eight-verse Psalm 119 sections.
- Calendar access rules, midnight behavior, past-highlight locking, draft preservation, transactional saves, and multiple-tab conflict protection.
- The visual design, including “One day at a time” and “Your data & backups.”

Do not bump the database or backup version simply because the source language changes. Any necessary behavioral or serialization change must be identified separately and given its own compatibility review.

Users will not need TypeScript or a compiler to launch the delivered application. Developers will compile sources when building a new release; the launcher will continue to serve already-built files.

## 3. Current inventory and migration scope

| Current file | Planned treatment |
| --- | --- |
| `src/storage.js` | Convert first to `src/storage.ts`; strongest benefit from typed records and repository contracts |
| `src/app.js` | Convert next to `src/app.ts`; type DOM access, state, dialogs, and asynchronous flows |
| `server.cjs` | Later move maintained source to `tooling/server.cts`; generate the root `server.cjs` runtime artifact |
| `work/verify.cjs` | Promote maintained regression coverage into `tests/`, then migrate to TypeScript |
| `work/verify-extra.cjs` | Promote recovery/concurrency/migration coverage into `tests/`, then migrate to TypeScript |
| `src/style.css`, `src/shell.html` | Retain CSS and HTML |
| `build.ps1` | Extend build orchestration; retain PowerShell |
| `Start-Psalmist.ps1`, `Start-Psalmist.cmd` | Retain their languages and readiness/reuse behavior |
| Diagnostic scripts, screenshots, old HTML, test backups in `work/` | Retain as reference or generated artifacts; do not convert archived files |

“All JavaScript source” means maintained application, server, and test sources. Generated JavaScript and historic snapshots remain JavaScript artifacts.

## 4. Technical approach

### Minimal compiler-based browser build

Use the TypeScript compiler without adding a framework or browser bundler during this migration. Retain the current two IIFE scripts and load storage before application code in the generated HTML.

Place shared type definitions in `src/types.d.ts` and browser globals in `src/browser-globals.d.ts`. Ambient declarations emit no JavaScript. A named type namespace can group models without introducing runtime dependencies. Declare `Window.PsalmistStorage` with an explicit repository interface.

Keep browser sources free of runtime imports/exports during this phase. The emitted code must remain valid as ordinary inline script elements: no `require`, unresolved imports, `export {}`, or module-loader requirement. Reject a build that violates this constraint.

TypeScript does not require us to rewrite the application as classes or replace its functional structure. Only extract small helpers where doing so makes a boundary safer or clearer.

### Separate browser and Node configurations

Create separate `tsconfig.browser.json` and `tsconfig.node.json` files so browser DOM globals and Node globals do not bleed into one another.

- Browser: modern JavaScript target consistent with the current runtime APIs; DOM, iterable DOM, and required Intl library declarations; no Node ambient types.
- Node: Node-compatible module settings and pinned Node type declarations. Use `.cts` for server/CommonJS test sources where a `.cjs` output is required.
- Both: enable `strict` and prevent emission when type checking fails.
- Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` for migrated source; explicitly handle missing array elements and optional fields.
- Select and lock a supported TypeScript release during tooling setup. Validate the exact compiler configuration against that release rather than assuming every option combination is valid.

Keep browser and Node outputs in separate staging folders. Source files must never be overwritten by the compiler.

### Development dependencies

Add `package.json` and a lockfile with exact resolved versions for TypeScript, Node type declarations, and the existing browser-test tooling. Use development dependencies; the shipped page and server must not require installed npm packages to run.

Provide documented commands for type checking, building, and testing. Install dependencies explicitly during development; do not download compilers or packages automatically when the user launches Psalmist.

## 5. Phase 0 — Establish a verified baseline

1. Preserve the current working sources, built HTML, launcher, and server as a migration baseline using a Git checkpoint when available, otherwise a clearly named local snapshot.
2. Inventory the current repository API, persisted field names, and backup envelope. Pay particular attention to `text`, `modified`, and `createdAt`; do not rename them merely to match illustrative types.
3. Retain a supported legacy journal fixture and a current version-1 backup fixture created before conversion.
4. Run the existing two browser checks in isolated profiles; record their results and inspect representative desktop/mobile screenshots.
5. Record the embedded Bible text hash and journal/backup compatibility expectations.

Before testing, probe `http://127.0.0.1:8765/health` directly without a system proxy and verify the `psalmist-local-v2` response. Reuse a healthy matching server. If the port is occupied by another process, identify it and report the conflict; do not stop it or silently switch the application's browser origin.

Record whether a server was already running or was started by this test run. Stop only owned temporary test servers during teardown, then verify port release. A launcher error alone is not evidence that no server is listening.

**Exit criterion:** working baseline, compatibility fixtures, and reproducible isolated-browser checks are available.

## 6. Phase 1 — Add tooling and a safe build pipeline

1. Add pinned development dependencies, lockfile, and separate browser/Node configurations.
2. Introduce shared declaration files and type-check a small pilot without converting both application files at once.
3. Allow mixed JavaScript/TypeScript sources temporarily. During the storage-only phase, include `app.js` as transitional JavaScript with `allowJs`; defer strict checking of that file until its conversion. Do not disable strict checking for migrated TypeScript.
4. Extend `build.ps1` to check exit codes and compile into staging. If TypeScript fails, stop without modifying the working HTML or server.
5. Embed the newly compiled storage script and the transitional/compiled app script in their original order.
6. Check generated inline JavaScript syntax, placeholder completion, and unchanged Bible text before replacing `psalmist.html` through a same-directory temporary file.
7. When server compilation is introduced, stage the server and check it before copying the runtime artifact to the project root.

Do not rely on stale compiler outputs after a failed build. Compile into a fresh task-specific staging directory, and verify the resolved path is inside the project before cleaning generated files.

Keep the existing compiled page runnable without rebuilding on every launch. If tooling is missing, development commands should explain how to install it; the normal launcher should continue to use the delivered files.

**Exit criterion:** type-checking/build commands work, compiler errors block output replacement, and a successful build still opens the current application.

## 7. Phase 2 — Define the data and repository contracts

Define types corresponding to the actual implementation:

| Type | Key concerns |
| --- | --- |
| `JournalProfile` | Start date, saved time zone, sequence ID, text-pack ID, preferences |
| `Reading` / `ReadingIdentity` | Chapter, optional section, verse boundaries, reading ID |
| `HighlightColor` | Exactly `gold`, `sage`, `rose`, or `blue` |
| `HighlightSegment` / `Highlight` | Verse-local offsets, quoted text, highlight identity/color |
| `SavedEntry` | Date, `text`, highlights, reading identity, revision, `createdAt`, `modified` |
| `CalendarRecord` | Date, reading ID, text-presence flag, highlight count, saved timestamp |
| `TextPack` | Immutable text identity, translation, canonicalization, content hash, chapters/verses |
| `DatabaseState` | Generation ID and mutation sequence |
| `SaveCommand` | Discriminated text-save or highlight-save command |
| `BackupEnvelopeV1` | Format/version, export instant, payload, integrity metadata |
| `LegacyJournalV1` | Existing supported local-file format |
| `Snapshot`, `LoadedReading`, `SaveResult`, `RestorePreview` | Explicit repository results and UI handoffs |
| `JsonValue` | JSON-compatible preference values and canonicalization inputs |

Illustrative command contract:

```ts
type SaveCommand =
  | { type: "text"; text: string }
  | { type: "highlights"; highlights: Highlight[] };
```

Represent dates and timestamps as distinct documented types or validated branded strings. A type name is not date/time-zone validation. Keep runtime checks for real dates, valid zones, content hashes, text offsets, and non-overlap.

Parse backup JSON into `unknown`; validate and reconstruct known fields before returning a typed record. Avoid assertions such as `JSON.parse(text) as BackupEnvelopeV1`. Apply the same principle at persisted-data and cross-tab-message boundaries: types must describe validated values, not replace validation.

**Exit criterion:** models match existing serialized fields and no persisted-data change is required.

## 8. Phase 3 — Migrate the storage layer

1. Convert `src/storage.js` to `src/storage.ts`.
2. Type the exported `PsalmistStorage` API and all repository inputs/results.
3. Add typed helpers for IndexedDB requests and transactions. Use a store-to-record mapping where practical; treat native request results as untrusted until checked or constrained by the repository boundary.
4. Distinguish missing entries, missing profiles, and failed requests. Keep automatic initialization separate from recovery of expected existing data.
5. Type transaction callbacks without making them asynchronous or introducing unrelated awaits inside a live transaction.
6. Narrow errors from `unknown` before reading `.message` or other properties.
7. Preserve canonical JSON output, checksum coverage, immutable text versions, legacy conversion, and atomic replacement behavior exactly.
8. Compile and run the storage-related regression cases before converting the UI.

Retain runtime validation for corrupted IndexedDB records and imported JSON. Where TypeScript reveals a previously possible bug, document the correction and add a focused regression case; do not hide it with `any` or a broad cast.

**Exit criterion:** strict storage checks pass, old backups restore, new backups remain compatible, and transaction failures still leave saved data unchanged.

## 9. Phase 4 — Migrate the UI layer

1. Convert `src/app.js` to `src/app.ts`.
2. Replace the untyped DOM lookup helper with checked element-specific accessors, or an explicit element-ID/type map. Validate the expected element class at initialization.
3. Type event targets, file inputs, selection/range operations, dialog choices, and BroadcastChannel messages.
4. Make loading, loaded, failed, busy, and stale states explicit. Prefer a discriminated state model where it prevents invalid combinations; avoid a broad UI redesign.
5. Handle the absence of profile, pack, entry, draft, selection, and preview through control-flow narrowing. Do not rely on pervasive non-null assertions.
6. Preserve the separation between unsaved reflection text and immediate highlight saves.
7. Preserve accessible announcements, focus movement, unsaved-change prompts, responsive layout, and the absence of a setup page.
8. Remove transitional `allowJs` coverage for application sources after conversion.

**Exit criterion:** browser sources pass strict checks and the complete user workflow matches the baseline.

## 10. Phase 5 — Migrate maintained server and tests

1. Move maintained server source to `tooling/server.cts`; compile it and deliver the output as root-level `server.cjs` so the launcher path stays unchanged.
2. Preserve runtime `__dirname` behavior at the final root location. Do not accidentally serve files from the compiler's staging directory.
3. Preserve IPv4 loopback binding, port, application health identity, explicit content types, server reuse, and startup logs.
4. Promote the existing regression scripts from `work/` into `tests/` and migrate the maintained test sources to TypeScript. Keep old work files as snapshots until the replacements are verified.
5. Replace machine-specific Playwright imports and hard-coded browser paths with project-local development dependencies and a documented optional executable-path override.
6. Give compiled tests an explicit project-root configuration so moving them changes neither fixture locations nor screenshots/download paths.
7. Keep fault-injection hooks in test code only. Type temporary monkey patches carefully and restore them in `finally` blocks.
8. Run the launcher with `-NoBrowser` for readiness checks, then verify the actual default-browser launch separately.

CommonJS remains a supported output choice. Converting the sources does not require switching the launcher or server to an ESM loader or requiring Node to execute raw TypeScript.

**Exit criterion:** server/test sources are typed, generated CommonJS runs correctly, and the actual launcher successfully starts or reuses the server.

## 11. Verification matrix

| Area | Required evidence |
| --- | --- |
| Build safety | A deliberately introduced type error fails the build and leaves delivered artifacts unchanged |
| Startup | Automatic initialization, no setup page, no entry created by opening, saved-zone reuse, and reopening persistence |
| Data compatibility | Pre-migration IndexedDB data opens; schema version stays 2; current and legacy backups restore |
| Backup compatibility | Version stays 1; prior checksums verify; newly exported data validates; unsupported/corrupt files are rejected |
| Calendar | Indexed month queries, current/last/direct navigation, saved empty/highlights-only dates, missed/future restrictions |
| Schedule | Missed-day advancement, saved-zone boundaries, all Psalm 119 sections, and repeated 171-day cycles |
| Highlights | Quotes/ranges, overlap blocking, recoloring/removal, independent text drafts, and past-date locking |
| Empty entries | Removal of final content retains identity, calendar access, timestamps, and backup inclusion |
| Failure recovery | Injected save/quota failure and interrupted restore preserve previously committed records |
| Concurrency | Two-tab edits, restore generation mismatch, atomic first-use initialization, and draft preservation |
| UI | Desktop/mobile screenshots, 320–1440 px reflow, retained quotation panel, keyboard focus, and error announcements |
| Launcher | Healthy-server reuse, port-conflict explanation, direct health probing, failed-start logs, and browser opening |

Use isolated test profiles and fixture copies. Do not delete, reset, or seed the user's real browser database for migration tests. A source-language migration should not require the user to restore a backup just to reopen their existing journal.

## 12. Rollback and release

- Keep a checkpoint after each passing phase, with sources and their matching generated artifacts.
- If a phase fails, restore the last verified source/build pair. Do not roll back by clearing browser storage.
- Because record shapes, database version, and backup version remain unchanged, the previously verified build should still read the same journal.
- If implementation discovers a necessary schema change, stop treating the work as a source-only migration and document the compatibility/rollback implications before proceeding.
- Release only after strict type checks, build validation, regression tests, and launcher checks pass.
- Update `START-HERE.md` and `IMPLEMENTATION_NOTES.md` with actual development commands, dependency requirements, and verification results. Product requirements need no change for TypeScript alone.

## 13. Completion checklist

- [ ] Baseline and compatibility fixtures retained.
- [ ] Development dependencies and compiler versions locked.
- [ ] Browser and Node type environments separated.
- [ ] Maintained browser, server, and test sources migrated.
- [ ] No broad `any`, unchecked JSON casts, or unexplained suppression directives used to bypass checking.
- [ ] Strict checks pass and a failed build cannot replace working artifacts.
- [ ] Generated browser scripts work inline and the page remains self-contained.
- [ ] Embedded Bible text, database schema, and backup format remain compatible.
- [ ] Existing journal opens without reinitialization or manual restoration.
- [ ] All verification gates pass, including port/readiness and actual launcher behavior.
- [ ] Usage and implementation documentation updated.

## 14. References

- Current project sources: `src/storage.js`, `src/app.js`, `build.ps1`, `server.cjs`, and `Start-Psalmist.ps1`.
- Product/UX references: `psalms-web-app-user-requirements.md`, `UX_DESIGN.md`, and `IMPLEMENTATION_NOTES.md`.
- [TypeScript: Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html) — supports gradual adoption and keeping emitted files separate from source.
- [TypeScript: Strict checking](https://www.typescriptlang.org/tsconfig/strict.html) — compiler checking configuration.
- [TypeScript: Modules reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html) — module output and Node/CommonJS considerations.

This document is the migration plan only. It does not install dependencies, convert sources, change the launcher, or modify journal data.
