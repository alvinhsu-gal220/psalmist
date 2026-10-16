# Psalms Reading and Reflection Web App

## User Requirements Document

Status: Draft for review  
Version: 1.17

## 1. Purpose

Provide a focused web experience in which users can read a Psalm, highlight meaningful passages with colors, write their thoughts and responses, and revisit their recorded reflections through a calendar.

## 2. Scope

The application shall support:

- Displaying one Psalm chapter as a reading, except Psalm 119, which shall be divided into 22 readings.
- Assigning Psalm 1 on the first day of use and advancing one reading per calendar day, including days the user does not visit.
- Automatically detecting the browser's time zone and initializing the journal on first use, opening Psalm 1 directly without a setup page or manual time-zone selection.
- Repeating the 171-day reading sequence continuously, with Psalm 1 scheduled the day after Psalm 150.
- Applying colored highlights to text within the displayed reading.
- Recording written thoughts and responses associated with that reading.
- Saving written responses and highlights together in one response entry per calendar day, including entries containing only highlights, for later review.
- Using a calendar widget to navigate to dates and review previously recorded reflections.
- Persisting all saved application data locally in IndexedDB within the same browser profile and site origin.
- Exporting a complete backup of all saved application data as a separate JSON file.
- Restoring saved application data from a JSON backup file chosen by the user.

The requirements describe observable user behavior and expected outcomes. They require IndexedDB persistence with JSON backup export and restore but otherwise do not prescribe a technology stack, identity system, or visual design.

## 3. Users and Core Concepts

**Primary user:** A person reading Psalms and keeping personal reflections.

**Reading:** One complete Psalm chapter, except each of the 22 parts of Psalm 119 is a separate reading.

**Start date:** The calendar date on which the user first uses the application; this anchors their daily reading schedule.

**Response entry (also called a reflection entry):** A user's written thoughts, colored highlights, or both, associated with the scheduled reading for one calendar date. Written text is optional when highlights are present. An existing saved entry is retained even after all its written text and highlights have been removed. Each user has at most one entry per date.

**Highlight:** A selected portion of displayed Psalm text marked with a user-selected color and saved within a specific calendar day's response entry. It applies only to that date's reading, even when the same Psalm appears on other dates.

## 4. User Stories and Functional Requirements

### 4.1 Read a Psalm

**User story:** As a reader, I want to view a clearly identified Psalm reading so that I can focus on its content.

| ID | Requirement |
| --- | --- |
| FR-01 | The application shall display one reading at a time with a clear Psalm chapter identifier. |
| FR-02 | For every chapter other than Psalm 119, the reading shall contain the complete chapter. |
| FR-03 | Psalm 119 shall be presented as 22 distinct parts of eight verses each: part 1 covers verses 1–8, part 2 covers verses 9–16, continuing through part 22 covering verses 169–176. Each part shall be clearly identified by chapter, part number, and verse range. The parts shall collectively cover verses 1–176 without gaps or duplicated verses. |
| FR-04 | The application shall show Psalm 1 as the scheduled reading on the first day of use and advance one reading for each elapsed calendar day, regardless of visits or completion. Multiple visits on the same date shall show the same scheduled reading. |
| FR-33 | On first use, after successfully checking IndexedDB and establishing that no journal exists, the application shall automatically detect the browser's IANA time zone, set the start date to the current calendar date in that time zone, persist both in the new journal, and open Psalm 1 directly without displaying a setup page or requiring manual time-zone selection. Initializing the journal shall not create a saved response entry. Subsequent visits shall automatically load the existing journal and use its saved start date and time zone rather than reinitializing them from the browser. Restoring a backup shall use the backup's saved start date and time zone. |
| FR-05 | The application shall identify the Bible translation used and preserve the text and verse numbering of that translation. |
| FR-21 | The daily sequence shall run through Psalms 1–118, then Psalm 119 parts 1–22 on consecutive days, then Psalms 120–150. |
| FR-24 | After Psalm 150, the next calendar day shall begin again at Psalm 1. This 171-day cycle shall repeat continuously, including across missed days, without resetting the original start date or deleting prior reflections or highlights. |
| FR-22 | Missed days shall not pause, reset, or delay the schedule. Returning on day 3 after visiting on day 1 and missing day 2 shall display Psalm 3. |
| FR-23 | Reviewing earlier entries through the calendar shall not change the start date or current scheduled reading. A missed day shall not create a reflection entry automatically. |

### 4.2 Highlight Text with Colors

**User story:** As a reader, I want to highlight meaningful words or passages in different colors so that I can recognize them when reviewing a reading.

| ID | Requirement |
| --- | --- |
| FR-06 | The user shall be able to select a portion of displayed Psalm text and apply a highlight color from multiple available colors. |
| FR-30 | Highlights within a calendar day's response shall not overlap: no portion of text may belong to more than one highlight, regardless of color. An attempt to add a highlight that overlaps an existing highlight shall be prevented with a clear explanation, leaving existing highlights unchanged. Adjacent selections that share no text may both be highlighted. Changing the color of an existing current-day highlight shall update that highlight rather than create another. |
| FR-07 | The application shall visibly distinguish highlighted text while keeping the underlying text readable. |
| FR-08 | For the current calendar day only, the user shall be able to add highlights, change their colors, and remove them without changing the Psalm text. Highlights on past dates shall be read-only: users shall not be able to add, recolor, or remove them through any interaction. This restriction shall take effect when the date becomes past under the application's date and time-zone policy, including for an already-open reading. |
| FR-09 | Saved highlights shall reappear on the correct text when the user returns to that specific calendar day's response. Highlights shall not carry over to, or alter, any past or future date's reading of the same Psalm or Psalm 119 part. |
| FR-26 | Applying any highlight for a calendar day shall save it as part of that day's response entry, creating the entry if needed, even when no written response is entered. Adding text or further highlights shall update the same entry. |

### 4.3 Record Thoughts and Responses

**User story:** As a reader, I want to write and save my thoughts about a reading so that I can revisit my response later.

| ID | Requirement |
| --- | --- |
| FR-10 | The application shall provide a writing area associated with the displayed reading. |
| FR-11 | The user shall be able to save a reflection and subsequently view and edit it, including responses recorded on past dates. |
| FR-12 | Each saved reflection shall retain its reading identifier and calendar date. |
| FR-25 | Each response entry shall record a last-modified date and time, set on its first successful save and updated whenever changes to that entry are successfully saved, including adding, recoloring, or removing current-day highlights and editing text in past responses. Blocked attempts to change past highlights shall not change the saved entry or its last-modified timestamp. Viewing an entry or a failed save shall not change this value. |
| FR-13 | The application shall clearly communicate whether changes are saved, unsaved, or could not be saved. The saving interaction for written text may be explicit or automatic; applying highlights shall save them without requiring written text or a separate text-submission action. |
| FR-14 | Each user shall have at most one reading response entry per calendar date, associated with that date's scheduled reading. Further saving or editing for that date shall update the existing entry rather than create another. Responses to the same reading on different dates shall remain separate. |
| FR-34 | When an edit leaves an existing saved response entry with no written text and no highlights, successfully saving that edit shall retain the entry with its original calendar date and reading association and update its last-modified timestamp. The calendar shall continue to mark that date as having a saved entry and permit access under the existing date-access rules, including after the date becomes past. The user shall be able to add or edit written text in the retained entry; highlight changes remain permitted only on the current date. The retained empty entry shall be included in JSON backup export and restored from a valid backup. |

### 4.4 Review through a Calendar

**User story:** As a returning reader, I want to use a calendar to find earlier reflections so that I can review my responses over time.

| ID | Requirement |
| --- | --- |
| FR-15 | The application shall provide a calendar widget that defaults to the current calendar month and year when first opened. It shall support navigation across months and years sufficient to reach all recorded responses. |
| FR-27 | The calendar shall provide a quick-access option to open the previous calendar month relative to the current date, including December of the preceding year when the current month is January. |
| FR-28 | The user shall be able to select a specific year and month combination and navigate directly to that month without stepping through intervening months. The displayed month and year shall be clearly identified. |
| FR-16 | The calendar shall distinguish dates that have saved response entries from dates without them, including dates whose entries contain only highlights. |
| FR-17 | Selecting a date shall show the user's single saved response entry for that date, if present, with its associated reading clearly identified. |
| FR-18 | The user shall be able to open a saved entry and review its written content and date-specific highlights together with the associated reading, including entries containing only highlights. Written content shall remain editable on past dates; past highlights shall be viewable but not editable. Editing a past response shall update that original entry without changing its date or reading association or creating an entry for today. |
| FR-19 | Past calendar dates without a saved response entry shall be visibly unavailable and shall not be selectable. The user shall not be able to open the missed reading or create a response for that past date through the calendar or another navigation route. A saved entry containing only highlights shall make its date accessible. |
| FR-29 | Future readings shall be inaccessible through the calendar or any other navigation route. Future calendar dates shall be visibly unavailable and not selectable; users shall not be able to open their readings or create responses or highlights for them. A scheduled reading becomes accessible on its assigned calendar date under the application's date and time-zone policy. |
| FR-20 | Saving or editing an entry shall make the current saved content available through the calendar. |

### 4.5 Export and Restore JSON Backups

**User story:** As a reader, I want to export a complete JSON backup of my saved journal and restore a backup file of my choosing so that I can keep and recover my records.

| ID | Requirement |
| --- | --- |
| FR-31 | The user shall be able to export a complete backup of all saved application data as a separate JSON file, including the original start date, scheduling and time-zone context, saved preferences if any, and all dated response entries with their written content, reading identifiers, highlights, and last-modified timestamps. The backup shall retain sufficient reading and translation identification to restore highlights accurately. Exporting a backup shall not alter the journal's saved data or reading schedule. |
| FR-32 | The user shall be able to choose a JSON backup file and restore its saved application data, including the original start date, scheduling and time-zone context, saved preferences if any, and all dated response entries with their written content, reading identifiers, highlights, and last-modified timestamps. Before replacing the current journal, the application shall validate the selected backup, explain that restoration replaces the current saved data, and obtain the user's confirmation. An invalid or unsupported backup, cancellation, or failed restoration shall leave the current saved data unchanged. Restoration shall be reported as successful only after the restored data has been successfully persisted. |

## 5. Data and Persistence Expectations

| ID | Requirement |
| --- | --- |
| DP-01 | All saved application data shall persist locally in IndexedDB, which shall be the authoritative saved record. Saved data shall remain available after page refreshes and closing and reopening the application within the same browser profile and site origin, provided the browser's site data has not been cleared or otherwise removed. JSON files shall serve as portable backups for export and restore. |
| DP-02 | Each reflection shall retain its optional written content, date-specific highlights, reading association, calendar date, last-modified date and time, and sufficient identity to retrieve and edit the correct entry. At most one response entry shall be retained per user per calendar date, including after repeated saves or edits. |
| DP-03 | Each highlight shall retain its owning response entry and calendar date, reading association, selected text location, and color so that it can be restored accurately for that date only. Saving, recoloring, or removing highlights for one date shall not change highlights for another date, even for the same reading. |
| DP-04 | Editing one reflection or highlight shall not unintentionally alter unrelated saved content. |
| DP-05 | A failed save shall not be presented as successful. The application shall preserve the user's current input where possible and provide a way to retry. |
| DP-06 | Calendar dates and last-modified timestamps shall use a documented, consistent date and time-zone policy. The last-modified timestamp shall identify an unambiguous point in time and remain distinct from the entry's calendar date. Editing a past entry shall update its last-modified timestamp without changing its original calendar date or reading association. |
| DP-07 | The application shall clearly communicate that saved data is stored locally in this browser profile for this site. A saved status shall be shown only after the IndexedDB transaction has successfully completed. Backup export status shall be displayed separately from the journal's saved status, so users can distinguish saving in the browser from exporting a JSON backup. |
| DP-08 | Personal reflections shall not be publicly exposed by default. If multiple users are supported, their saved content shall be separated. |
| DP-09 | The application shall retain the user's start date and the date/time-zone context needed to determine the scheduled reading consistently across visits within the supported persistence environment. The schedule shall use elapsed calendar dates, not visit counts or completed readings. |
| DP-10 | A JSON backup shall contain all information needed to restore the saved journal, including the original start date, scheduling and time-zone context, saved preferences if any, and all dated response entries with their written content, reading identifiers, highlights, and last-modified timestamps. It shall include sufficient reading, translation, text-version, and text-location information, and any required source text, to restore highlights accurately. |
| DP-11 | Saving an entry shall atomically update the entry and its saved calendar representation in one IndexedDB transaction, without altering unrelated entries or resetting the reading schedule. A failed or interrupted transaction shall leave the previous saved entry and calendar representation unchanged and shall not be reported as successful. |
| DP-12 | If browser storage or recovery is unavailable or fails, automatic first-use time-zone detection or journal initialization fails, or a selected backup is unreadable, invalid, or unsupported, the application shall explain the problem and provide an applicable recovery action, such as retrying or choosing another backup. It shall not silently discard saved history, overwrite existing data, or reset the start date. A storage read failure shall not be treated as evidence that no journal exists. Automatic journal creation is permitted only for first-use initialization under FR-33; replacing or resetting an existing journal shall require an explicit user action. |

IndexedDB is the authoritative store for normal loading and saving. JSON backup export and restore are separate user actions; normal saves do not require writing a JSON file. Backup file selection, default file name/location, and export/restore interactions remain implementation decisions. No sign-in method is prescribed.

## 6. Usability Requirements

| ID | Requirement |
| --- | --- |
| UX-01 | Reading text shall remain legible across supported desktop and mobile screen sizes, including when highlights are applied. |
| UX-02 | Reading identification, highlighting controls, the reflection writing area, and calendar navigation shall be easy to find and understand. |
| UX-03 | Core actions shall support keyboard operation, visible focus, and meaningful accessible labels. |
| UX-04 | Highlight color choices shall have understandable labels; save status, errors, and calendar entry indicators shall not rely on color alone. |
| UX-05 | Long reflections shall remain readable and editable without obscuring access to saving or navigation controls. |
| UX-06 | Navigation shall not silently discard unsaved writing or highlight changes. The application shall save it or provide an appropriate warning and opportunity to retain it. |
| UX-07 | Loading, empty, and error states shall explain what is happening and indicate any available next action. |

## 7. Assumptions and Open Decisions

The following are proposed interpretations, not additional requests confirmed by the original user.

| Topic | Assumption or decision needed |
| --- | --- |
| Psalm 119 boundaries | Confirmed: Psalm 119 uses 22 sections of eight verses each: part 1 covers verses 1–8, part 2 covers 9–16, continuing through part 22 covering 169–176. |
| Reading catalogue | Confirmed: the application contains 171 readings: 149 complete chapters plus the 22 eight-verse parts of Psalm 119. |
| Translation | The Bible translation, content source, and permission to display that text must be selected. Multiple translations are not assumed. |
| Schedule time zone | Confirmed: the browser's IANA time zone is detected automatically on first use and retained with the journal. Later browser or device time-zone changes shall not silently alter the saved time zone or start date. Restoration uses the backup's saved time zone. Advancement is based on calendar dates in the journal's saved time zone, not successive 24-hour periods after first use. Manual changes to an existing journal's time zone are not defined by this requirement. |
| Reading access | Confirmed: only today's scheduled reading and past dates with saved response entries are accessible. Future readings and missed past dates without saved responses are inaccessible. Saved entries containing only highlights remain available for review and for adding or editing written responses; past highlights remain read-only. |
| Reflection date | Confirmed: a new entry is assigned the current calendar date in the journal's saved time zone. Creating entries for missed past dates is not permitted; editing an existing past entry preserves its original date. |
| Empty entry after removal | Confirmed: an existing saved response entry is retained when its final written text or highlight is removed and the change is successfully saved, even when both text and highlights are empty. Its date remains marked as saved and accessible under the existing date-access rules. It remains part of backup export and restore. Removing content must not affect other dates. |
| Editing and removal | Editing saved written responses is permitted for current and past dates. Adding, changing, or removing highlights is permitted only for the current date. Deleting entire reflection entries requires a separate product decision. |
| Browser storage and backup setup | Confirmed: IndexedDB is the authoritative saved record within the same browser profile and site origin. First-use journal initialization is automatic and does not display a setup page. Existing journals load automatically on subsequent visits. Users can export a complete JSON backup and restore a JSON backup file of their choosing. Backup file name/location and backup export/restore interactions remain open implementation decisions. |
| Supported environments | Target browsers, devices, accessibility conformance target, and measurable performance expectations must be agreed before release. |

## 8. Acceptance Criteria

The following criteria define observable completion. Criteria that depend on assumptions shall be updated if those assumptions change.

| ID | Scenario and expected result | Coverage |
| --- | --- | --- |
| AC-01 | Opening any Psalm other than 119 displays its complete chapter, chapter identifier, and translation identification as one reading. | FR-01, FR-02, FR-05 |
| AC-02 | Psalm 119 is available as exactly 22 identified parts of eight verses each. Part 1 contains verses 1–8, part 2 contains verses 9–16, and part 22 contains verses 169–176. Each part contains its assigned consecutive verses, and the parts collectively cover verses 1–176 without gaps or duplicated verses. | FR-03 |
| AC-03 | On the first date of use, the scheduled reading is Psalm 1. On the next calendar date it is Psalm 2. Repeated visits on either date do not advance it. | FR-04 |
| AC-04 | On the current date, selecting text and choosing a color visibly highlights that selection. Another color can be applied, and the highlight can be removed without altering the source text. | FR-06–FR-08 |
| AC-05 | After saving highlights, navigating away and returning, refreshing, and reopening within the supported persistence environment restore the correct text selections and colors when reopening the same calendar day's entry. | FR-09, DP-01, DP-03 |
| AC-06 | A user can write and save a reflection, see confirmation of its saved state, reopen it, and edit it. The saved text remains associated with the correct reading and date. | FR-10–FR-13, DP-01, DP-02 |
| AC-07 | Saving a response and saving again for the same date leaves exactly one entry containing the updated content. A response to the same reading on a later date is retained separately from the earlier entry. | FR-14, DP-04 |
| AC-08 | Calendar dates containing reflections are identifiable. Selecting one shows the single saved entry for that date, and opening it displays its full content and associated reading. | FR-16–FR-18 |
| AC-09 | Calendar navigation can reach saved entries in earlier months and years. Past dates without entries are visibly unavailable and cannot be selected to open a reading. Past dates with highlights-only entries remain selectable. | FR-15, FR-19 |
| AC-10 | When a past response is edited and saved, the calendar opens the updated content under its original date and reading. Exactly one entry remains for that date; no new entry is created for today, and any existing response for today is unchanged. | FR-11, FR-14, FR-18, FR-20, DP-06 |
| AC-11 | If saving fails, the user sees a failure state rather than a success state and can retry. Navigating with unsaved writing or highlight changes does not silently discard them. | DP-05, UX-06 |
| AC-12 | On agreed supported screen sizes, users can read the Psalm, apply highlights, write and save a reflection, and use the calendar. Core controls are keyboard-operable and have accessible labels; status indicators are understandable without color alone. | UX-01–UX-05, UX-07 |
| AC-13 | Users can understand that their records persist locally in this browser profile for this site. Saving status and backup export status are shown separately. Reflections are not publicly visible by default, and, if accounts are supported, one user's records are not displayed to another user. | DP-07, DP-08 |
| AC-14 | A user who visits on day 1, misses day 2, and returns on day 3 sees Psalm 3. Longer gaps similarly advance by elapsed calendar days without requiring catch-up or completion. | FR-04, FR-22, DP-09 |
| AC-15 | Day 118 displays Psalm 118; days 119–140 display Psalm 119 parts 1–22 respectively; day 141 displays Psalm 120; day 171 displays Psalm 150. | FR-21 |
| AC-16 | Reopening the application preserves the original start date and displays the reading scheduled for the current calendar date. Reviewing an older reflection does not change the schedule, and missed dates do not gain automatic reflections. | FR-23, DP-09 |
| AC-17 | Day 171 displays Psalm 150, day 172 displays Psalm 1, and day 173 displays Psalm 2. Day 342 displays Psalm 150 and day 343 displays Psalm 1, confirming that the cycle continues to repeat. | FR-24 |
| AC-18 | A user who last visits on day 170 and returns on day 173 sees Psalm 2, even though the cycle boundary occurred during their absence. Earlier reflections and highlights remain available; a new reflection on a repeated reading does not overwrite a prior dated entry. | FR-14, FR-22, FR-24, DP-09 |
| AC-19 | On the first successful save, an entry retains its last-modified date and time. After a later edit is successfully saved, this value reflects the later save and persists after reopening. Editing a past response leaves its original calendar date and reading unchanged. Viewing the entry or a failed save does not alter its saved last-modified value. | FR-25, DP-01, DP-02, DP-06 |
| AC-20 | Applying a highlight with the writing area empty saves exactly one response entry for that date, with a last-modified timestamp. After refresh or reopening, the calendar marks that date as having a response and opens its saved highlights. Adding written text later updates that same entry. | FR-14, FR-16, FR-25, FR-26, DP-01, DP-02 |
| AC-21 | A highlight saved on day 1 for Psalm 1 does not appear in day 172's Psalm 1 reading. On day 172, adding, recoloring, or removing highlights affects only day 172's response and its last-modified timestamp. Day 1's highlights remain unchanged and read-only. Both dated entries retain their own highlights when reopened through the calendar. The same isolation applies to repeated Psalm 119 parts. | FR-09, FR-18, FR-25, DP-03 |
| AC-22 | When first opened, the calendar displays the current month and year according to the application's date and time-zone policy. | FR-15, DP-06 |
| AC-23 | Using the quick-access option displays last month. If the current date is in January 2027, it opens December 2026. | FR-27 |
| AC-24 | Selecting a specific month and year, such as March 2025, opens that month directly and clearly labels it. Saved response indicators and date selection work in the selected month, including for entries containing only highlights. Past dates without saved entries and all future dates remain unavailable. | FR-16, FR-17, FR-28 |
| AC-25 | A user saves a response on day 1, misses day 2, and returns on day 3. The current reading is Psalm 3; day 1 can be opened for review and editing, while day 2 is unavailable in the calendar. Attempts to open day 2 through another navigation route cannot display its missed reading or create a response for it. | FR-04, FR-19, FR-22 |
| AC-26 | On day 3, the user can access the scheduled Psalm 3 reading and past dates with saved responses. Day 4 and all later dates are visibly unavailable in the calendar. Attempts to open a future reading through any other navigation route are also blocked, and no response or highlight can be created for a future date. | FR-29 |
| AC-27 | When the calendar date advances from day 3 to day 4 under the application's date and time-zone policy, the scheduled Psalm 4 reading becomes accessible. Navigating to a future month or year does not grant access to any future reading. | FR-04, FR-28, FR-29, DP-06 |
| AC-28 | Opening a past saved entry displays its highlights but does not permit adding, recoloring, or removing highlights. Attempts to change them leave the saved highlights and last-modified timestamp unchanged. Editing and saving the written response remains permitted, updates the timestamp, and preserves the past highlights. | FR-08, FR-18, FR-25 |
| AC-29 | When an open current-day reading becomes a past date under the application's date and time-zone policy, further highlight changes for that date are blocked. Previously saved highlights remain available for review, and highlight editing is permitted for the new current day's scheduled reading. | FR-08, DP-06 |
| AC-30 | On the current date, attempting to add a highlight that partially overlaps, contains, falls within, or exactly duplicates an existing highlight is prevented, whether the colors match or differ. A clear explanation is shown; saved highlights and the entry's last-modified timestamp remain unchanged. Non-overlapping adjacent text can be highlighted, and recoloring an existing highlight updates it without creating an overlap. | FR-08, FR-25, FR-30 |
| AC-31 | After saving written text and highlights, refreshing or closing and reopening the application within the same browser profile and site origin reloads the saved journal from IndexedDB, including the original start date, schedule context, preferences if any, daily entries, highlight locations/colors, and last-modified timestamps. Highlights-only entries remain accessible. No JSON file selection or export is required for normal reopening, provided the browser's site data remains available. | DP-01, DP-09 |
| AC-32 | Editing a past written response or a current-day highlight updates the entry, its last-modified timestamp, and its saved calendar representation in one IndexedDB transaction while preserving unrelated dates, past highlights, and the original start date. The application reports success only after transaction completion. If the transaction fails or is interrupted before completion, neither the saved entry nor its calendar representation is partially updated, and no success is reported. | DP-05, DP-07, DP-11 |
| AC-33 | If IndexedDB cannot be opened, saved journal data cannot be loaded, or a save fails, the application shows an actionable error and an applicable retry or recovery option. It does not report a successful save, silently discard saved history, reset the start date, or initialize a replacement journal when existing journal data is expected. | DP-05, DP-12 |
| AC-34 | After saving responses on multiple dates, including a highlights-only response, the user can export a separate valid JSON backup containing the original start date, schedule and time-zone context, saved preferences if any, and every saved entry with its text, reading identification, highlights, and last-modified timestamp. The backup retains sufficient reading and translation identification to restore highlights accurately. Exporting does not change any saved entry, its last-modified timestamp, or the reading schedule. | FR-31, DP-10 |
| AC-35 | The user can choose a valid JSON backup, receive an explanation that it will replace the current saved journal, and confirm restoration. After successful persistence and reopening, the journal retains the backup's original start date, schedule and time-zone context, preferences if any, and all dated entries with their text, reading identification, highlights, and original last-modified timestamps. The calendar includes restored highlights-only entries, and the current reading follows the restored schedule. | FR-32, DP-01, DP-02, DP-03, DP-09 |
| AC-36 | Choosing an invalid or unsupported backup produces an actionable error without altering current saved data. Canceling restoration or a failure while persisting the restored data also leaves the current saved journal unchanged, and no restoration success is reported. | FR-32, DP-05, DP-12 |
| AC-37 | On first use with no existing journal and working browser storage, the application detects the browser's IANA time zone, persists it with the current calendar date as the start date, and opens Psalm 1 without showing a setup page or requesting a time-zone choice. No response entry is created until the user saves text or applies a highlight. Refreshing or reopening loads the same journal without setup or reinitialization. | FR-33, FR-23, FR-26, DP-01, DP-09 |
| AC-38 | After journal creation, changing the browser or device time zone and reopening the application leaves the journal's saved start date and time zone unchanged; the reading is calculated using the saved time zone. Restoring a valid backup uses its saved start date and time zone rather than the browser's currently detected time zone. | FR-33, FR-32, DP-06, DP-09 |
| AC-39 | If reading IndexedDB, detecting the first-use time zone, or persisting initial journal settings fails, the application shows an actionable error and does not report successful initialization. A failed storage read does not trigger creation of a replacement journal or a reset of saved history or scheduling settings. | FR-33, DP-05, DP-12 |
| AC-40 | Removing the last highlight from a current-day highlights-only entry, or clearing all written text from an entry with no highlights, and successfully saving leaves exactly one empty entry under its original date and reading with an updated last-modified timestamp. After refresh or reopening, its date remains marked as saved in the calendar and accessible when past; written text can be added again, while past highlights remain read-only. Unrelated entries remain unchanged. Exporting and restoring a JSON backup preserves the empty entry, its saved timestamp, and its calendar accessibility. | FR-34, FR-14, FR-16, FR-18, FR-25, FR-31, FR-32, DP-11 |

## 9. Out of Scope

The following are not required for the initial scope:

- Other books of the Bible, multiple translations, or translation comparison.
- Audio playback, voice recording, or speech-to-text input.
- AI-generated reflections, interpretation, commentary, or study guidance.
- Social sharing, public profiles, group study, or collaborative editing.
- Reading streaks, reminders, notifications, or user-customized reading schedules.
- Advanced search, tags, analytics, or reflection summaries.
- Rich-text formatting, attachments, or media inside reflections.
- Additional import/export formats, printing, or edit-version history within a response entry. Creating, reopening, and saving the journal in IndexedDB, exporting and restoring JSON backups, and retaining separate dated responses and their date-specific highlights remain in scope.
- Native mobile applications or guaranteed offline operation.
- Cloud storage, automatic cross-device synchronization, sign-in, or account-management features.

Any additions to these areas should be reviewed separately and reflected in revised requirements and acceptance criteria.
