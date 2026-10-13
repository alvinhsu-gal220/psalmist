# Psalmist

## Open the app

1. Open **psalmist.html** in desktop **Microsoft Edge** or **Google Chrome**. No installation, build step, server, or internet connection is needed.
2. Choose **Create new journal**. Confirm your calendar time zone, then save **psalmist-data.json** in a local folder of your choice, such as the Psalmist folder.
3. On later visits, choose **Open existing JSON file** and grant file access if the browser requests it.

Your start date is recorded when you create the journal. The first reading is Psalm 1. The schedule advances every calendar day in the journal's fixed time zone, including missed days. Psalm 119 occupies 22 days of eight verses each; after Psalm 150 the 171-day cycle repeats.

## Read and respond

- Select text, including across verses, and choose a highlight color. Highlights save immediately to your JSON file, including when there is no written response.
- Click or keyboard-focus a highlight to select it, then recolor or remove it. Overlapping highlights are blocked. The **Select passage** controls provide an alternative for keyboard and touch use.
- Write your response and click **Save response**. Each date has one entry containing its written text and highlights.
- Use the calendar to reopen saved dates. Past written responses can be edited; past highlights are read-only. Missed dates without entries and future dates cannot be opened.
- **This month**, **Last month**, and the month/year picker let you navigate your history.

## Your data

The JSON file is the authoritative record of your start date, fixed time zone, preferences, daily written responses, highlight ranges/colors, reading identities, and last-modified timestamps. After a refresh or reopening the app, select your JSON file again. No application data or file handles are stored in browser storage.

The app reports a save only after the file write completes. If a save fails, keep the page open and use **Save response** to retry. If the file changed outside the app, copy unsaved writing before reopening the latest file. Existing nonempty files are never replaced by the Create new journal action.

Keep the JSON file somewhere you can find it. You may back it up using your normal computer backup process. No cloud service or account is used by the app. Files in a folder managed by OneDrive or another sync service may still be synchronized by that service.

Removing the last highlight retains that date's existing entry, even if its text is empty. Starting a new journal creates a separate schedule; it does not reset another journal.

## Browser support and implementation choices

This is one self-contained HTML file with plain CSS and JavaScript and all 150 Psalms embedded. Direct local-file writing uses the browser's File System Access API, supported by desktop Edge and Chrome. Browsers that lack the required file pickers show a compatibility message instead of claiming to save locally. See [Chrome's File System Access documentation](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

The app uses the King James Version, matching the mock. Text source: [Arul John's KJV Psalms dataset](https://github.com/aruljohn/Bible-kjv/blob/master/Psalms.json), retrieved September 24, 2026. The chosen text version is recorded in the data file so highlight ranges remain consistent.

Calendar boundaries use the time zone selected when the journal is created; last-modified timestamps record the time of successful saves. The original requirements and design mock remain separate files.

