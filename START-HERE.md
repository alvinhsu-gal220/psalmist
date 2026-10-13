# Psalmist

## Open the app

1. Double-click **Start-Psalmist.cmd** in this folder.
2. The launcher starts a local server and opens **http://localhost:8765/psalmist.html** in your default browser.
3. Psalmist opens today's reading immediately. On first use, it detects the browser's time zone and saves the start date automatically. No setup page, journal picker, sign-in, or time-zone choice is required.

Use the **same browser profile and address** on later visits. Changing the hostname, port, or profile creates a different storage location. Directly opening the HTML file shows instructions to use the launcher.

The launcher uses Node.js already available on this computer. It installs no packages and uploads no data. If it cannot locate Node.js, it shows an error. Alternatively, run `node server.cjs` from this folder and open the same address.

The local server listens only on this computer and serves the page, not the journal database. It continues running after the browser closes and is reused by the launcher. To stop it, identify the Node.js process whose command line ends in this folder's `server.cjs` in Task Manager and end that specific process. Restarting the computer also stops it. Stopping the server does not erase browser-saved data.

## Read and respond

- Reading starts with Psalm 1 and advances by calendar date in the journal's saved time zone, including missed days. Psalm 119 uses 22 sections of eight verses; the 171-day sequence repeats after Psalm 150.
- Select text and choose Gold, Sage, Rose, or Blue. Highlight changes save immediately, even without writing.
- Select a current-day highlight to recolor or remove it. Overlapping highlights are rejected. Select passage with keyboard or touch provides an alternative to text dragging.
- Write a response and choose **Save response**. Saving a highlight preserves unsaved writing without silently committing that writing.
- Use the calendar to open saved dates. Past writing stays editable; past highlights are read-only. Missed dates and future readings are unavailable.
- This month, Last month, and the month/year picker navigate the calendar.
- Removing the final text or highlight retains the saved entry and its calendar marker. Empty entries remain in backups.
- One day at a time remains visible above Your data & backups, including on mobile layouts.

## Where records are saved

**IndexedDB is the authoritative journal.** It retains the start date, saved time zone, preferences, entries, highlights, original reading text, and timestamps within this browser profile and site origin. Reopening loads it automatically without choosing a file.

Saved in this browser appears only after the storage transaction completes. Backup download status is separate. Clearing site data, deleting the browser profile, or losing the device can remove the journal. Keep JSON backups somewhere recoverable. No cloud account or automatic cross-device sync is used.

If saving fails, keep the page open and retry: the draft remains available. Navigation with unsaved changes offers saving, keeping the draft, or explicitly discarding it. Stale saves cannot silently overwrite newer data. Preserve or copy unsaved writing before reloading when another tab restores a different journal.

## Download a backup

1. Find **Your data & backups** beneath the calendar and One day at a time.
2. Choose **Download JSON backup**.
3. If writing is unsaved, choose whether to save first or download saved data only.
4. Find `psalmist-backup-YYYY-MM-DD.json` in the browser's Downloads location, or the destination requested by your browser settings.

Backups contain the full saved journal, empty entries, and canonical KJV text needed to restore highlights. They include a format version and SHA-256 integrity checksum. The checksum detects corruption; it is not encryption or authentication. Backup files contain private journal text.

Psalmist reports that the download was initiated. Check the browser's downloads to confirm the file was retained. Device-local download history is reset when another journal is restored.

## Restore a backup or older journal

1. Choose **Restore from backup** and select a JSON file of your choosing.
2. Psalmist checks format/version, integrity, schedule, entries, and text anchors before changing saved data.
3. Review the filename, start date, time zone, saved-date range, and entry counts.
4. Optionally choose Download current backup, then **Replace journal** to confirm. Cancel preserves the current journal.

Restoration replaces the journal; it does not merge entries. Original dates, highlight ownership, empty entries, and modification timestamps are retained. The backup's saved time zone defines the restored schedule. A failed replacement transaction retains the previous journal. The source backup file is never modified.

Existing **psalmist-data.json** files from the previous application are supported when they use format `psalmist`, version `1`, KJV translation, and text version `aruljohn-kjv-2026-09-24`. Choose the old file through Restore from backup. Its conversion is previewed and does not change the original file. These older files have no integrity checksum; structural and text-range validation is applied during conversion.

Current portable backup format: `psalmist-backup`, format version `1`. Unrecognized or newer formats are rejected with an explanation. Supported input limit: **25 MiB**, up to **20,000 dated entries**, with bounded text/highlight sizes.

## Source and maintenance

`psalmist.html` is a self-contained page containing all 150 Psalms and 2,461 verses. It needs a local server for a consistent browser origin but no build step to use. The app uses plain JavaScript, CSS, and native IndexedDB.

Editable sources are in `src/`. Rebuild after source edits with `powershell -NoProfile -ExecutionPolicy Bypass -File build.ps1`. The build preserves the original embedded Bible text.

The database is named `psalmist`, schema version `2`. Structural migrations execute in an upgrade transaction. Older tabs close their connections on upgrade requests; blocked upgrades explain that other tabs should be closed. Compatibility must be verified in each supported browser; this guide does not claim universal browser support or accessibility conformance.

Bible translation: **King James Version**. Source: [Arul John's KJV Psalms dataset](https://github.com/aruljohn/Bible-kjv/blob/master/Psalms.json), originally retrieved September 24, 2026. This implementation retained the existing embedded text.

See `UX_DESIGN.md` for the visual specification and `psalms-web-app-user-requirements.md` for product requirements. The requirements document was not changed during implementation.
