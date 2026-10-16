# Psalmist UX Design

Version: 1.0  
Date: October 13, 2026  
Status: Proposed implementation specification  
Requirements baseline: `psalms-web-app-user-requirements.md`, version 1.17

Past-entry design addendum (October 16, 2026): [PAST_ENTRY_DESIGN.md](design/past-entry/PAST_ENTRY_DESIGN.md) records the selected three-column journal view, Lucida Handwriting response, edit-before-typing interaction, and independent horizontally collapsible side panels with the right panel collapsed by default. For past-entry presentation, that addendum takes precedence over conflicting layout and typography guidance below. [Saved interactive reference](design/past-entry/past-entry-reference.html).

## 1. Purpose and design philosophy

Psalmist is a quiet place to read a Psalm, mark meaningful words, write a response, and return to saved moments. The interface should feel like a personal reading journal: warm, clear, and spacious.

The reading is the main event. Controls support it without competing with the text. A user should arrive at today's reading immediately, understand whether changes are saved, and find older entries or backup tools without a separate onboarding flow.

### Principles

| Principle | Application |
| --- | --- |
| Reading first | Give Scripture the largest area and strongest typographic hierarchy. Avoid dashboards and promotional banners. |
| Quiet continuity | Use consistent surfaces, modest borders, and restrained motion. Missed dates have neutral language and no penalty framing. |
| Immediate access | Automatically load or initialize the journal. No setup page, journal picker, sign-in, or manual time-zone choice is required on launch. |
| Honest saving | Distinguish unsaved writing, committed browser saves, and backup downloads. Do not announce success before persistence succeeds. |
| History belongs to its date | Clearly identify the selected date. Past writing can be edited; past highlights remain read-only. |
| Recovery is discoverable | Keep backup controls available in the main interface and applicable recovery controls available in error states. |
| Accessible restraint | Pair colors with labels, shapes, and status text. Provide keyboard and touch alternatives to text selection. |

The application does not introduce streaks, achievement badges, reminders, social features, or pressure to catch up. No new user-facing settings page is necessary for this design.

## 2. Scope and decision status

This document specifies the intended experience for the IndexedDB application. The current `psalmist.html` still uses local-file persistence; its appearance is the visual starting point, not evidence that the new workflows are implemented.

Confirmed behavior from the requirements and conversation:

- IndexedDB is the saved journal; JSON is used for backup and restore.
- First use automatically detects the browser's time zone and starts Psalm 1 on the current calendar date in that zone.
- Subsequent visits load the journal automatically and retain its saved time zone.
- The sequence repeats every 171 calendar days, including missed days.
- Psalm 119 uses 22 sections of eight verses, covering verses 1–176.
- There is one saved entry per date, including highlights-only entries and previously saved entries emptied by editing.
- Past saved entries are accessible; past missed dates and all future readings are unavailable.
- Past text is editable; past highlights are read-only.
- The sidebar retains “One day at a time” above “Your data & backups.”

Exact colors, component sizes, breakpoints, and interaction details below are proposed design defaults. They do not silently resolve outstanding product decisions about supported environments or legacy-file compatibility. Additional reliability behavior from the technical design is identified in section 13.

## 3. Visual identity and color system

### Main palette

Use these tokens consistently rather than introducing slightly different grays or greens per component.

| Token | Hex | Use |
| --- | --- | --- |
| `--color-page` | `#F6F4EF` | Warm page background |
| `--color-paper` | `#FFFEFB` | Reading card, secondary buttons, dialogs |
| `--color-sidebar` | `#EEEFE7` | Calendar, quotation, and backup panels |
| `--color-input` | `#FAFBF7` | Reflection textarea and form fields |
| `--color-ink` | `#293D35` | Body text, main headings |
| `--color-reading` | `#344139` | Scripture text |
| `--color-muted` | `#58665B` | Labels, dates, metadata, helper text, placeholders |
| `--color-primary` | `#344F40` | Primary buttons, selected calendar date, links |
| `--color-primary-hover` | `#293D35` | Primary button hover |
| `--color-on-primary` | `#FFFFFF` | Text on primary buttons and selected dates |
| `--color-border` | `#DCE0D6` | Decorative card boundaries and dividers |
| `--color-control-border` | `#72816E` | Required input/button outlines and today's calendar outline |
| `--color-accent` | `#BC9A64` | Short decorative rule under reading heading |
| `--color-focus` | `#806020` | Keyboard focus ring on light surfaces |
| `--color-error` | `#973F31` | Error message text and warning action outline |
| `--color-error-surface` | `#FAEEE9` | Error notice background |
| `--color-warning` | `#76591F` | Unsaved-change and recovery notice text |
| `--color-warning-surface` | `#F8F0DC` | Warning notice background |
| `--color-success` | `#344F40` | Successful-save icon and text |

Do not use the gold decorative accent for small informational text. Use `--color-muted` for verse numbers, footer text, and eyebrow labels instead of the lighter shades in the current HTML.

### Highlight palette

Retain the current four named colors; colors do not encode a prescribed theological meaning.

| Visible label / persisted UI color name | Hex | Scripture text color |
| --- | --- | --- |
| Gold / `gold` | `#F4DEA0` | `#344139` |
| Sage / `sage` | `#D8E5C8` | `#344139` |
| Rose / `rose` | `#F3D6CD` | `#344139` |
| Blue / `blue` | `#D4E6ED` | `#344139` |

Use these four names consistently in UI and storage validation. They replace the illustrative yellow/green/pink/purple names in the earlier technical examples. Any imported palette requires an explicit supported mapping; unsupported names must not silently change existing highlights.

Highlight chips show their names and a check mark when selected. The selected chip also has a 2 px forest-green outline. The text selection and the selected color are separate states.

### Contrast and focus

Calculated contrast for opaque token pairs, rounded for reporting:

| Foreground / background | Ratio |
| --- | --- |
| Ink / paper | 11.48:1 |
| Muted / paper | 6.01:1 |
| Muted / sidebar | 5.23:1 |
| White / primary | 8.98:1 |
| Reading / Gold | 8.06:1 |
| Reading / Sage | 8.14:1 |
| Reading / Rose | 7.81:1 |
| Reading / Blue | 8.33:1 |
| Focus / paper | 5.76:1 |
| Focus / sidebar | 5.02:1 |
| Control border / sidebar | 3.57:1 |

Target at least 4.5:1 for ordinary text and 3:1 for essential control boundaries against their adjacent background. These targets follow the W3C guidance for [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Token checks alone do not establish application accessibility conformance.

Focus ring: 3 px solid `--color-focus`, offset 3 px. On dark surfaces, add a 2 px paper-colored separating ring so the focus indicator remains distinct. Never reduce opacity on enabled informational text. Decorative borders may be subtle; essential controls use the stronger control-border token.

## 4. Typography

Use system-installed fonts so reading does not wait for an external font download.

| Element | Font | Desktop size / line height | Mobile size / line height |
| --- | --- | --- | --- |
| Brand | Georgia, Times New Roman, serif | 30 px / 1.2 | 26 px / 1.2 |
| Page introduction | Georgia, Times New Roman, serif | 40 px / 1.2 | 30 px / 1.25 |
| Psalm heading | Georgia, Times New Roman, serif | 34 px / 1.25 | 28 px / 1.3 |
| Scripture | Georgia, Times New Roman, serif | 21 px / 1.9 | 20 px / 1.8 |
| Panel / response heading | Georgia, Times New Roman, serif | 23 px / 1.3 | 22 px / 1.35 |
| Quote | Georgia, Times New Roman, serif; italic | 23 px / 1.6 | 21 px / 1.6 |
| Body, forms, buttons | system-ui, Segoe UI, sans-serif | 16 px / 1.6 | 16 px / 1.6 |
| Metadata and helper text | system-ui, Segoe UI, sans-serif | 14 px / 1.5 | 14 px / 1.5 |
| Verse numbers / weekday labels | system-ui, Segoe UI, sans-serif | 12 px / 1.5 | 12 px / 1.5 |

Implement sizes in rem, based on a 16 px root. Do not override the user's browser text-size preference. Body weight is 400; button labels and compact headings use 600. Avoid all-caps for long labels. Eyebrow labels may use short uppercase text with 0.1 em spacing.

Keep Scripture to approximately 55–70 characters per line where the available width permits. Display verse numbers in a separate narrow column; selections should contain verse text rather than decorative numbering. Preserve the actual translation's text and verse numbers.

The current application displays King James Version. Keep its translation label when displaying that text; any translation change requires a separate content decision. Do not label KJV text as another translation.

## 5. Layout, spacing, and responsive behavior

### Desktop: viewport width 960 px and above

- Header: 88 px minimum height, centered contents aligned with the main container.
- Main container: maximum width 1220 px, 28 px side padding, 40 px top margin.
- Two columns: flexible reading column and 330 px sidebar, separated by 30 px.
- Reading card: 16 px corner radius, 40 px padding, subtle decorative border.
- Sidebar panels: 14 px radius, 24 px padding, 20 px gap between panels.
- Shadow: `0 8px 30px rgb(41 61 53 / 3%)`; no large elevation effects.

```text
┌───────────────────────────────────────────────────────────────┐
│ ✳ Psalmist       A daily place to pause       Today's reading │
└───────────────────────────────────────────────────────────────┘
  Tuesday, October 13, 2026
  A moment in the Psalms.

┌─────────────────────────────────┐  ┌──────────────────────────┐
│ Today's reading                 │  │ Your days, remembered.   │
│ Psalm 1                         │  │ Month navigation         │
│ King James Version              │  │ Calendar + legend        │
│                                 │  └──────────────────────────┘
│ Scripture and saved highlights  │  ┌──────────────────────────┐
│                                 │  │ One day at a time        │
│ Highlight controls              │  │ “He restoreth my soul.”  │
│                                 │  │ Existing description     │
│ Your response                   │  └──────────────────────────┘
│ [Writing area]                  │  ┌──────────────────────────┐
│ Save status    [Save response]  │  │ Your data & backups      │
│ Last modified                   │  │ Storage / time zone      │
└─────────────────────────────────┘  │ Download / restore       │
                                     └──────────────────────────┘
```

### Tablet and mobile: below 960 px

Use one column in this order: header, date/introduction, reading and response, calendar, “One day at a time,” then “Your data & backups.” This keeps the reading immediately available on first use. Desktop sidebar panels become ordinary stacked panels and retain their internal order.

- Side padding: 24 px on tablets; 16 px below 600 px.
- Reading-card padding: 24 px on tablets; 20 px below 600 px.
- Header may wrap and grow in height. Hide the decorative tagline when space is limited, keeping the brand and Today's reading action.
- Keep all three support panels, including the quotation, visible on mobile; remove the existing CSS that hides the quotation panel.
- All buttons have at least a 44 px interaction height. Calendar cells have at least a 44 px interaction height and fit seven columns at 320 px viewport width.
- Wrap highlight chips. Stack backup buttons vertically. Stack status and save button when required.
- Avoid sticky panels or controls that cover Scripture, the textarea, or the mobile keyboard.
- The page and dialogs must reflow without horizontal scrolling at 320 px width. Long time-zone names and filenames wrap.

Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, and 48 px. Use 8 px button radii and 10 px input radii. Section separators have at least 24 px vertical separation.

## 6. Startup and daily reading

### Launch flow

1. Render the normal header and a short “Opening your journal…” loading state.
2. Successfully read IndexedDB before deciding whether a journal exists.
3. If a journal exists, load its saved start date and time zone and display today's scheduled reading.
4. If no journal exists, automatically detect the browser's IANA time zone, atomically initialize the journal with today's date in that zone, and display Psalm 1.
5. Recheck journal existence within the initialization transaction so simultaneous tabs do not create competing journals.

There is no setup page, welcome dialog, required permission walkthrough, journal picker, or time-zone selector. Initialization creates no response entry and does not mark today as saved in the calendar.

If loading, detection, or initialization fails, show an error state with Retry. Never substitute a new journal for unreadable existing data. Where applicable, offer Restore from backup; persistent browser-storage failure must be resolved before restoration can succeed.

### Reading identity

Display the selected calendar date and the reading together. For today, use “Today's reading.” For an earlier entry, use “Saved entry · February 8, 2027.” Psalm 119 uses a title such as “Psalm 119 · Section 1 of 22” with “Verses 1–8” beneath it.

Today's reading returns to the currently scheduled date without changing the start date or saved history. Before leaving a dirty response, follow the unsaved-change flow in section 8.

At midnight in the saved time zone, refresh today's schedule and calendar availability. If the user is viewing yesterday, keep the selected entry visible and show: “A new day has begun. Highlights for this date are now read-only.” Offer Today's reading. Retain any draft text. Do not silently move the user to another reading or discard unsaved highlights; explain that highlight changes for a past date cannot be saved.

## 7. Highlighting

On today's reading, expose Gold, Sage, Rose, Blue, and Remove controls below Scripture. Allow mouse/touch text selection, followed by choosing a color. Preserve the selection while the user operates the toolbar.

Each existing current-day highlight can be selected to recolor or remove it. Selection must be visible beyond color alone: use an outline and a toolbar message such as “Selected highlight · Gold.” Keyboard users can focus and activate highlights.

Retain the expandable “Select passage with keyboard or touch” alternative with labeled start/end verse and word controls, color selection, and an Apply highlight button. It must map to canonical text without changing Scripture.

An overlapping selection is rejected with: “This selection overlaps an existing highlight. Choose another passage or edit the existing highlight.” Existing highlights and timestamps remain unchanged. Adjacent selections are allowed.

Highlight changes save immediately. While saving, prevent duplicate actions affecting the same entry. Show success only after the transaction completes. Failed changes remain identifiable as unsaved and can be retried while the date is still current.

Reflection text uses explicit saving. Applying a highlight does not silently discard or commit an unrelated draft response; preserve the draft and continue to show its unsaved state. Reconcile the committed entry revision after a highlight save so a later text save uses the updated entry.

For a past entry, display its highlights and replace editing controls with: “Highlights are read-only for past dates. You can still edit your response.” No interaction path permits recoloring or removal.

## 8. Reflection, saving, and empty entries

Label: “Your response.” Prompt: “What speaks to you in this reading?” Placeholder: “A thought, a prayer, a word to carry with you…” The label remains visible when text is present.

Textarea: full width, minimum 180 px height, vertical resize, 16 px text, 1.7 line height, visible control border. Long content can grow or scroll without making the save action unreachable.

Use an explicit Save response button. Enable it for actual draft changes, including clearing an existing response. On a never-saved date, an empty writing area and no highlights do not create an entry. A saved highlight can create the entry without reflection text.

| State | Visible status | Behavior |
| --- | --- | --- |
| Never saved, no draft | “No response saved yet” | No saved calendar marker |
| Dirty draft | “Unsaved changes” | Save action available |
| Highlight committed, text dirty | “Highlights saved · Response has unsaved changes” | Preserve text draft |
| Saving | “Saving…” | Prevent competing saves for this entry |
| Committed | “Saved in this browser” | Update calendar and saved timestamp |
| Failed | “Not saved — retry” | Keep draft; offer Retry |
| Retained empty entry | “Saved entry · No text or highlights” | Keep calendar marker and access |

Display “Last modified” beneath the save row with the date, time, and journal time-zone context. It changes only after a successful content change; viewing, rejected operations, and no-op saves do not change it.

Removing the final content and successfully saving retains exactly one entry with the same date and reading. It remains accessible, can receive new text later, and participates in backup/restore. Do not introduce a Delete entry action.

### Unsaved-change flow

When calendar navigation, Today's reading, or restoration would leave a dirty draft, show a compact dialog with Save and continue, Keep editing, and Discard changes. Make Keep editing the initial focus. If saving fails, remain on the entry with the draft intact. Do not offer a successful save path for past highlight changes; retain any recoverable text and explain the restriction.

Use a browser unload warning only while changes are unsaved. Do not claim that drafts survive a browser crash unless that behavior is separately implemented and verified.

## 9. Calendar

Title: “Your days, remembered.” Helper: “Return to a response you've saved.” Default to the current month in the journal's saved time zone.

Provide This month, Last month, and a labeled month/year selector. Direct navigation must reach any saved month without repeated stepping. Last month is relative to today's month, not whichever month is currently displayed.

| Date state | Appearance | Interaction |
| --- | --- | --- |
| Today, unsaved | Forest outline; date number | Open today's reading |
| Saved, including highlights-only or retained empty | Dot beneath date; accessible label includes “saved entry” | Open entry if not future |
| Selected accessible date | Forest fill, white number; selected-state semantics | Display selected reading/entry |
| Today and selected | Forest fill plus distinct outer outline; accessible “today” label | Same as selected |
| Missed past date | Muted number; no dot | Unavailable |
| Future date | Muted number; no dot | Unavailable, even if a restored record exists |
| Before start date | Muted number; no dot | Unavailable |

Legend: “● Saved entry · Outline: Today. Missed and future readings are unavailable.” Saved dots follow entry existence, not whether text/highlights are nonempty.

Use real buttons for selectable dates. Support Tab and Enter/Space; provide understandable accessible labels such as “February 8, 2027, saved entry, selected.” Include today and unavailable reasons as applicable. Do not use ARIA grid semantics without implementing the associated keyboard behavior. Recheck access when a date is opened, not only when the calendar renders.

On selecting an entry, update the heading and announce the selected date. Move focus to the reading heading without creating a full-page reload. Never expose a future or missed reading through a URL, shortcut, or other control.

## 10. “One day at a time”

Retain this panel between the calendar and backups on desktop and in the same support-panel order on mobile.

- Heading: “One day at a time”
- Quote: “He restoreth my soul.”
- Description: “A new reading each day. Room to notice, reflect, and return.”

This is a quiet, static panel. It contains no action, carousel, rotating quote, or progress indicator.

## 11. Your data & backups

Replace the old filename/status area and Open another journal button with this panel:

```text
Your data & backups

Saved on this device, in this browser.
Journal time zone: America/Los_Angeles
Days change at midnight in this time zone.

[ Download JSON backup ]
[ Restore from backup  ]

Last backup download initiated: Never

Clearing this site's browser data can remove your journal.
Keep a JSON backup to recover it.
```

Allow the time-zone value to wrap. It is informational, not a required editable setting. Browser saving and backup status remain distinct. Do not claim cloud storage or automatic cross-device sync.

### Download flow

1. Activate Download JSON backup.
2. If writing is unsaved, offer Save and download, Download saved data only, or Cancel. If a save fails, do not silently proceed as though the draft was included.
3. Wait for pending saves and capture one consistent snapshot of committed journal data.
4. Prepare the versioned JSON file, including empty saved entries and all text needed to restore highlights accurately.
5. Initiate download with `psalmist-backup-YYYY-MM-DD.json`, using the date in the journal's saved time zone.
6. Update status to “Backup download started. Check your browser's downloads.”

The browser controls whether the file goes to its default Downloads location or prompts for a destination. Do not display a hard-coded filesystem path or claim the download completed merely because it was initiated. Multiple exports may receive browser-generated filename suffixes.

Show progress such as “Preparing backup…” and an actionable error if export cannot be prepared. Keep the saved journal unchanged.

### Restore flow

1. Activate Restore from backup and choose a JSON file. Canceling file selection changes nothing.
2. Resolve unsaved input before replacement without discarding it silently.
3. Validate format, supported version, integrity, journal records, and text anchors before any replacement.
4. Show a preview containing filename, backup creation time, start date, time zone, saved-entry count, and saved-date range. Include empty and highlights-only entries in the count.
5. State: “This will replace the journal saved in this browser with the selected backup. Entries will not be merged.”
6. Offer Download current backup, Cancel, and Replace journal. Initial focus goes to Cancel. Backing up current data leaves the preview open and does not confirm replacement.
7. After confirmation, persist the replacement atomically. Show “Restoring your journal…” and prevent conflicting mutations.
8. On transaction completion, reload the restored journal's current reading and month, using its saved time zone. Announce “Journal restored.” Preserve historical timestamps.

If data changes after the preview, stop and refresh the preview before accepting replacement. If validation or persistence fails, retain the previous saved journal and report the failure. The source backup file is never modified.

For a supported older format, say “This backup will be converted to the current format.” For an unsupported format/version, explain the compatibility problem and offer Choose another file. Never partially import unsupported records.

## 12. Errors, accessibility, and motion

### Error and recovery language

| Situation | Suggested copy / action |
| --- | --- |
| Journal cannot open | “Your journal couldn't be opened. Your saved data has not been replaced.” Retry; applicable recovery action |
| First-use initialization fails | “We couldn't prepare your journal. Please try again.” Retry |
| Browser time zone cannot be detected | “We couldn't detect your browser's time zone.” Retry; do not silently choose UTC |
| Save fails | “Your changes aren't saved. Your draft is still here.” Retry |
| Storage full | “There isn't enough browser storage to save these changes.” Keep draft; offer applicable recovery/backup actions |
| Overlapping highlight | “This selection overlaps an existing highlight.” Keep existing marks; choose another passage |
| Another tab changed the entry | “This entry changed in another tab. Your draft is still here.” Compare/reload with draft protection |
| Another tab restored the journal | “The journal was restored in another tab. Reload before saving.” Preserve draft before reload |
| Upgrade blocked by another tab | “Close other Psalmist tabs, then try again.” Retry without resetting data |
| Invalid backup | “This file isn't a valid supported Psalmist backup.” Choose another file |
| Restore fails | “The backup couldn't be restored. Your previous saved journal is unchanged.” Retry or choose another file |

Only use preservation claims when the corresponding transaction guarantee is verified. Avoid displaying raw exception stacks, database keys, or internal counters to ordinary users.

### Accessibility implementation

- Provide a skip link to the reading, semantic header/main/aside landmarks, and logical heading levels.
- Associate visible labels with every form field. Use text plus icons for save, warning, error, and calendar states.
- Announce ordinary saves and date changes through a polite live region; announce blocking errors appropriately without repeating them on every render.
- Keep focus visible and unobscured. Dialogs contain focus while open and return it to their trigger when closed.
- Support Escape to cancel a dismissible dialog before replacement begins. During a committed restore operation, do not offer a misleading cancellation control.
- Preserve normal text selection, browser zoom, and user font-size settings. Test keyboard highlighting and touch alternatives.
- Support browser forced-colors mode with outlines and text labels that remain meaningful without palette colors.
- Use 120 ms color/border transitions only. No animated page entrance, parallax, pulsing saved indicators, or celebratory motion. Honor reduced-motion preferences by removing nonessential transitions.

Accessibility targets are design goals, subject to rendered UI, keyboard, touch, and assistive-technology verification. This document does not certify WCAG conformance.

## 13. Requirements traceability and remaining decisions

| Experience | Requirements |
| --- | --- |
| Automatic startup and retained time zone | FR-33, DP-01, DP-09, DP-12; AC-37–AC-39 |
| Reading identity and 171-day sequence | FR-01–FR-05, FR-21–FR-24 |
| Highlighting and past-date locking | FR-06–FR-09, FR-26, FR-30; DP-03 |
| Response saving and timestamps | FR-10–FR-14, FR-25; DP-05–DP-07, DP-11 |
| Retained empty entries | FR-34; AC-40 |
| Calendar access and navigation | FR-15–FR-20, FR-27–FR-29 |
| Backup download and restore | FR-31, FR-32; DP-10, DP-12; AC-34–AC-36 |
| Responsive accessible controls and draft protection | UX-01–UX-07 |

The following remain proposals from the technical design or unresolved implementation decisions; record formal requirements before treating them as approved scope additions:

- Explicit backup format-version handling and supported older-format conversion.
- Database schema migration guarantees and multiple-tab conflict protection.
- Import compatibility for the existing local-file `psalmist-data.json`; the current journal format differs from the proposed backup envelope. A recognized legacy-file adapter should use the same validation/preview flow and preserve the original record.
- Supported browsers, stable site origin/launch method, and file-picker fallbacks. The UX does not assume that double-clicking a local HTML file provides the final supported persistence environment.
- Final translation/content-source approval. The visual design preserves the current KJV identity but does not independently select a new translation.
- Performance thresholds, size limits, and whether device-local backup-download history is retained across visits. Such UI history must not modify response timestamps or be presented as proof of a completed file download.

No manual time-zone editing, journal-reset button, multiple-journal selector, theme switcher, or additional import/export format is introduced by this design.

## 14. UX review checklist

- [ ] First use opens Psalm 1 without a setup screen or manual time-zone choice.
- [ ] Reopening loads the saved journal without choosing a file.
- [ ] Concurrent first-use tabs cannot overwrite initialized settings.
- [ ] Full readings and all 22 Psalm 119 sections are clearly identified.
- [ ] Highlight names, selected marks, overlap errors, and keyboard/touch selection work consistently.
- [ ] Past highlights stay read-only, including after midnight with a reading already open.
- [ ] Saving highlights preserves an unrelated unsaved writing draft and reports both states accurately.
- [ ] Failed saves and navigation retain drafts and provide an understandable next action.
- [ ] Empty saved entries remain marked, accessible, and included in backup/restore.
- [ ] Current month, last month, and direct month/year navigation enforce date-access rules.
- [ ] “One day at a time” remains between the calendar and backups on desktop and mobile.
- [ ] Backup status is separate from browser-save status; download initiation is not presented as confirmed completion.
- [ ] Restore shows validation, a replacement preview, cancellation, and failure protection.
- [ ] Actual rendered colors, focus rings, keyboard paths, zoom/reflow, and assistive-technology announcements are verified.
- [ ] Layout works at 320, 390, 768, 1024, and 1440 px widths without clipping or hidden required controls.

## 15. Source references

- `psalms-web-app-user-requirements.md`, version 1.17: current product requirements.
- `psalmist.html`: existing visual palette, typography, text, and component inventory.
- Proposed IndexedDB architecture and subsequent confirmed decisions in this conversation.
- [W3C: Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [W3C: Understanding Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

The contrast table was calculated from the specified opaque foreground/background colors. No application screenshots or implemented workflows were visually verified as part of creating this document.
