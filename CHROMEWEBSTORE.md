# Chrome Web Store — Tab Position Options Fork

Last updated: 2026-09-20

This file is the repository source of truth for submission information and copy for the Developer Dashboard. Update and verify the repository documents first, then apply the corresponding content to the dashboard. It is not uploaded automatically. Keep it aligned with user-facing features, permissions, data handling, and release assets when these change. See the [release procedure](.agents/skills/tab-position-release/SKILL.md).

## Sources and publication state

- [Developer Dashboard](https://chrome.google.com/webstore/devconsole/8009c97a-122b-4cb9-abdd-a961267915fc/bimiahgcjenkoacmdfggckkaflnnebki/edit): inspected in Brave on 2026-09-19 (listing, privacy, distribution, and package pages).
- [Store listing](https://chromewebstore.google.com/detail/tab-position-options-fork/bimiahgcjenkoacmdfggckkaflnnebki)
- Extension ID: `bimiahgcjenkoacmdfggckkaflnnebki`
- Published package: **0.2.2**, with `storage` permission only.
- Dashboard draft package: **0.2.2**, with `storage` permission only.
- Current source: still version **0.2.2**, but includes unreleased Tab on Activate, new-tab URL rules, Loading Page URL rules, pop-up conversion, automatic settings sync, settings import/export, keyboard shortcuts, and options localized into 10 locales, and requests `storage`, `tabs`, and `webNavigation`. It is not the same package as the published 0.2.2.
- Dashboard fields were read only; no draft was saved or submitted during preparation of this document.

Sections marked **Draft for next release** are proposed replacements, not claims about what is currently registered. Choose a new version during release preparation; do not reuse the published version for these changes.

## Store listing

| Field | Current dashboard value |
| --- | --- |
| Extension name | Tab Position Options Fork |
| Short description | Fork of Tab Position Options - Select the tab opening position, new tab behavior and behavior after closing a tab |
| Category | Workflow & Planning (dashboard label: ワークフローと計画) |
| Primary language | English |
| Homepage | https://github.com/proshunsuke/tab-position-options-fork |
| Support URL | https://github.com/proshunsuke/tab-position-options-fork |
| Verified official website | None selected |
| Promotional video | Empty |

The current detailed description is preserved in the appendix. The draft below describes the latest implementation without maintaining a detailed feature matrix in the listing.

### Detailed description — Draft for next release

```text
Customize where tabs open and which tab becomes active when you close a tab.

Tab Position Options Fork lets you choose tab positions, open new tabs in the background, and control which tab is selected after closing the current one. You can also move tabs when they become active, set URL-specific rules for new tabs and page navigation, and open pop-up windows as tabs with URL exceptions.

The options page follows your browser’s UI language and supports English, Japanese, Simplified Chinese, Traditional Chinese, Korean, Spanish, French, German, Brazilian Portuguese, and Russian. Unsupported languages use English.

Use keyboard shortcuts to sort tabs or switch to the last active tab.

Optionally open external links in new tabs, with page exclusions and rules for foreground, background, or current-tab navigation.

Settings and user-entered URL rules sync automatically when Chrome sync is enabled. A local copy remains available if synchronization fails or the settings exceed Chrome's sync capacity. You can also export and import settings files to back up your configuration.

HOW TO USE
1. Open the extension from Chrome's Extensions menu or its toolbar icon.
2. Choose your tab preferences and add URL rules if needed.
3. Click Save Settings.

PRIVACY
Settings and user-entered URL rules are stored locally and synchronized through Google's Chrome Sync service when enabled. Browsing URLs and session tab state are not synchronized. New-tab and navigation URLs are processed locally to apply your URL rules. When external-link handling is enabled, a content script reads the clicked link and current page URL. These browsing values are not sent to external services; following a link makes the normal browser request to its destination. The extension does not use analytics or tracking services.

SUPPORT AND SOURCE CODE
https://github.com/proshunsuke/tab-position-options-fork
Report bugs or request features:
https://github.com/proshunsuke/tab-position-options-fork/issues

This is an independent community fork of the original Tab Position Options. Some original features are not yet available.
Original extension:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

## Single purpose

### Current dashboard text

```text
Single Purpose: Tab Position Management

This extension has one clear purpose: to provide users with customizable control over Chrome tab positioning and behavior. All features directly support this single purpose:
- Controlling where new tabs open
- Controlling which tab becomes active when closing tabs

The extension does not include any unrelated functionality such as ads, analytics, mining, or features outside of tab management.
```

### Draft for next release

```text
Customize Chrome tab positioning and activation behavior, including where new tabs open, which tab is selected after closing a tab, where activated tabs move, URL-specific rules for new tabs and page navigation, converting pop-up windows to tabs with URL exceptions, opening external links according to page and link rules, and sorting or switching tabs with keyboard shortcuts.
```

## Permissions justification

Sources of truth: [wxt.config.ts](wxt.config.ts) and [content script](entrypoints/externalLinks.content.ts). Current source requests `storage`, `tabs`, and `webNavigation`. WXT also generates a static content-script declaration matching `http://*/*` and `https://*/*`, including frames, at `document_start`. This requests site access at installation. `host_permissions` remains empty because static content-script matches provide the required access; there are no optional permissions or `scripting` permission.

### storage — Current dashboard text

```text
This extension uses the storage permission to save user preferences for tab positioning behavior locally on the user's device. All settings are stored using chrome.storage.local API and include:
- New tab position preferences (first, last, right, left, or default)
- Tab closing behavior preferences
No data is transmitted to external servers. All data remains on the user's local device.
```

### storage — Draft for next release

```text
The storage permission saves tab positioning and activation preferences, including user-defined URL rules, locally using chrome.storage.local and synchronizes those settings using chrome.storage.sync when Chrome sync is enabled. Settings remain locally available when sync fails or exceeds its capacity. The extension also uses chrome.storage.session to retain tab activation order and tab snapshots across service worker restarts so tab positioning and closing behavior remain consistent. Session storage also retains restored tab identities and initial selection markers to preserve restored positions, and temporarily retains pending navigation URLs and restoration markers for Loading Page rules; navigation URLs are removed on commit, error, or tab closure. The last focused normal window and pending pop-up window IDs are also retained to resume conversions after service worker restarts. Session state and browsing URLs stay on the device and are not included in synchronized settings.
```

Evidence: [settings](src/settings/state/appData.ts), [automatic sync](src/settings/sync.ts), [activation history](src/tabs/state/activationHistory.ts), [tab snapshots](src/tabs/state/tabSnapshot.ts), [restoration state](src/tabs/sessionRestoreDetector.ts), [pop-up state](src/tabs/state/popup.ts).

### tabs — Draft for next release; absent from current dashboard package

```text
The tabs permission is required to read the URL of newly created tabs (Tab.pendingUrl or Tab.url) and match it against user-defined URL rules. These rules determine the new tab's position and whether it opens in the foreground or background. Matching applies automatically to newly created tabs without requiring the user to click the extension for each tab. URLs are processed locally and are not transmitted externally or saved as browsing history. The same URL access is used to check pop-up exception patterns before moving an existing tab into a normal window. On an explicit sorting command, it also reads tab titles and URLs to order the current window’s tabs. Sorting data is used only in memory. These tab API operations do not read page contents; the separate external-link content script is described below.
```

Evidence: [new-tab handler](src/tabs/handleNewTab.ts), [pop-up handler](src/tabs/popup.ts), [URL matching](src/tabs/urlRules.ts), [shortcut handlers](src/commands/handler.ts). Unlike position-only tab operations, these properties require URL access. See the [Tabs API permission documentation](https://developer.chrome.com/docs/extensions/reference/api/tabs).

### webNavigation — Draft for next release; absent from current dashboard package

```text
The webNavigation permission is required to apply user-defined Loading Page positioning rules when a top-level navigation commits. The extension checks the destination URL first and, for server redirects without a destination match, the original navigation URL. Pending navigation state is retained temporarily in local session storage to survive background-process restarts, then removed when the navigation commits, fails, or its tab closes. Navigation target and before-navigation events also provide pop-up URLs early enough to check exceptions without waiting for page loading. These navigation API operations do not read page content, and no URLs are transmitted to external services. Tab update events alone do not provide the navigation commit and server-redirect information this behavior needs.
```

Evidence: [navigation handlers](src/tabs/loadingPage.ts), [temporary navigation state](src/tabs/state/loadingPage.ts), [Web Navigation API](https://developer.chrome.com/docs/extensions/reference/api/webNavigation).

### HTTP/HTTPS site access — Draft for next release

```text
The extension declares a bundled content script for all HTTP and HTTPS pages and their HTTP/HTTPS frames. When the user enables external-link handling, the script intercepts ordinary link clicks and reads the current page URL and clicked link URL/attributes to apply page exclusions, link rules, and exact-origin comparisons. It opens the destination in the current tab/frame or a new foreground/background tab. Site access is needed so this works on the websites chosen by the user without requiring the extension toolbar to be clicked for every link. The feature is off by default; when disabled, the click handler does not inspect links. Page and link URLs are processed locally and only passed to the extension background process when a new tab is requested. The extension does not extract page text, read form values, or retain a click history. No data is sent to external services. Normal link navigation contacts the destination website.
```

Evidence: [content script](entrypoints/externalLinks.content.ts), [rule matching](src/externalLinks/rules.ts), [tab creation](src/externalLinks/handler.ts). Browser-restricted pages and sites where the user withholds extension access are not covered. Pages open before installation or extension reload need reloading to receive the script. Enabling/disabling the setting itself updates pages that already have the script.

### Remote code

Current dashboard: **No, remote code is not used**. Current source bundles its extension code; no runtime remote-code loading was found in `src/` or `entrypoints/`.

## Privacy and data use

### Current dashboard declarations

All nine data-collection categories are unchecked: personally identifiable information, health information, financial/payment information, authentication information, personal communications, location, web history, user activity, and website content.

All three data-use certifications are checked:

- Data is not sold or transferred to third parties outside approved uses.
- Data is not used or transferred for purposes unrelated to the extension's single purpose.
- Data is not used or transferred for creditworthiness or lending purposes.

These are recorded dashboard values, not a new submission or certification.

### Current implementation data handling

| Data | Use and retention | Sent off device / shared |
| --- | --- | --- |
| Preferences and user-entered URL patterns | Saved in `chrome.storage.local` and `chrome.storage.sync`; editable in options; local fallback for sync failures or capacity limits | Google Chrome Sync when enabled; no developer-operated server |
| Settings files selected for import or downloaded on export | Processed locally on request; exports contain the current form settings and user-entered URL patterns, not session state; downloaded files remain until the user deletes them; imported settings join automatic sync when saved | Files are not uploaded; saved settings use Chrome Sync |
| Pending navigation URL, tab ID, timestamp and restoration flag | Temporarily stored in `chrome.storage.session` until commit, error or tab closure; cleared on browser restart | No / No |
| Restored tab and window IDs, including the initial selected tab | Stored in `chrome.storage.session` to preserve restored positions and selection across worker restarts; tab identities remain until tab closure or browser restart, selection markers until the selection event is handled, and navigation markers until the initial navigation ends or the tab closes | No / No |
| Pop-up URL and window type/incognito status | Checked in memory to apply exceptions and choose a compatible destination; pop-up URLs are not persisted by the conversion feature | No / No |
| Last focused normal window ID and pending pop-up window IDs | Stored in `chrome.storage.session` for conversion and worker restart recovery; cleared on browser restart | No / No |
| Clicked link URL/attributes and current page/frame URL | Read in memory only while external-link handling is enabled; page and destination URLs sent to the local extension background process for new-tab creation; no stored click history | No analytics or external reporting / No |
| Newly created tab URL | Read to evaluate matching rules; not saved as visited-URL history | No / No |
| Tab titles, URLs, and group membership for sorting | Read in memory only when a sorting command is invoked; not persisted | No / No |
| Tab IDs and activation order | Stored in `chrome.storage.session` for tab closing behavior and switching to the last active tab | No / No |
| Tab IDs, positions, active/pinned state, opener IDs | Stored in `chrome.storage.session` for tab positioning and restart recovery | No / No |

The debug utility can store local diagnostic logs when explicitly instrumented; no production call sites of `debugLog` were found during this review. There is no extension telemetry or external reporting in the reviewed source. Developer tooling is separate from the shipped extension.

### Privacy policy

- Registered URL: https://github.com/proshunsuke/tab-position-options-fork/blob/main/PRIVACY.md
- Local file: [PRIVACY.md](PRIVACY.md), updated September 20, 2026, to describe automatic Chrome Sync for settings and user-entered URL rules, transient URL matching, temporary navigation URLs, pop-up URL checks, external-link processing and site access, and session-only tab/window metadata and activation order.
- The public policy URL must serve this updated text before submission. A local edit alone does not update the published policy.
- Reconcile the dashboard data-use answers with that updated policy and the then-current Chrome Web Store definitions, including automatic transmission of user-entered URL patterns through Chrome Sync. The recorded unchecked boxes above must not be treated as a substitute for reviewing the current data handling.

## Graphics and assets

Dashboard uploads were observed; exact byte-for-byte identity with local files has not been verified.

| Asset | Local file / dimensions | Dashboard and preparation status |
| --- | --- | --- |
| Store icon | [public/icon-128.png](public/icon-128.png), 128×128 | Uploaded |
| Screenshot 1 — New Tab | [screenshot-1.png](store-assets/screenshots/screenshot-1.png), 1280×800 | Updated locally; not uploaded. Opening position and background behavior |
| Screenshot 2 — Tab Closing | [screenshot-2.png](store-assets/screenshots/screenshot-2.png), 1280×800 | Updated locally; not uploaded. Choosing the next active tab after closing |
| Screenshot 3 — Tab on Activate | [screenshot-3.png](store-assets/screenshots/screenshot-3.png), 1280×800 | Created locally; not uploaded. Activation position |
| Screenshot 4 — URL rules and pop-ups | [screenshot-4.png](store-assets/screenshots/screenshot-4.png), 1280×800 | Created locally; not uploaded. URL rules and pop-up exceptions with example.com patterns |
| Small promo tile | [promotional-440x280.png](store-assets/promotional-440x280.png), 440×280 | Uploaded |
| Marquee promo tile | Local source not identified | Uploaded; dashboard specifies 1400×560 |

Upload screenshots 1–4 in the order above. All four are direct captures of 1280×800 regions of the English settings page at its original scale, without added headings, backgrounds, or rearrangement. They are verified as 24-bit RGB PNG without alpha. The settings shown are illustrative. The dashboard still contains the previous screenshots until these replacements are uploaded.

[tab-behavior.png](store-assets/tab-behavior.png) is the separate 1280×1721 full-page image used in the READMEs; it is not a store screenshot.

`store-assets/social-preview-1280x640.png` is 1280×640 and must not be assumed to be the uploaded 1400×560 marquee asset.

## Distribution and developer information

- Pricing: free; no in-app purchases.
- Visibility: public.
- Regions: all regions.
- Dashboard publisher account label: `Shunsuke0901`.
- Public developer contact email: not verified on the inspected pages. Do not substitute the signed-in Google account email without checking the public contact settings.
- Support and homepage: https://github.com/proshunsuke/tab-position-options-fork

## Version history and review notes

| Version | Date | Changes | Status |
| --- | --- | --- | --- |
| Next version not assigned | Not submitted | Tab on Activate; new-tab and Loading Page URL rules; pop-up conversion; automatic settings sync; settings import/export; keyboard shortcuts; external-link rules and HTTP/HTTPS site access; `tabs` and `webNavigation` permissions | Source only; release preparation pending |
| 0.2.2 | Publication date not checked | Tab closing fixes for Chrome 147 and varying event order | Published; also present as dashboard draft |

Older changes are in [CHANGELOG.md](CHANGELOG.md) and the current listing below. Submission/publication dates were not inferred from commit dates.

### Rejection history

The developer reports that an earlier submission requesting `tabs` was rejected because the code at that time did not need it. The date, version, and original rejection text have not been verified. The current URL-rule implementation now reads `pendingUrl`/`url`; the justification above explains this concrete new use. Approval is not assumed until the next submission is reviewed.

### Remaining release preparation

- Assign the next version through the existing release workflow.
- Publish the updated privacy policy at its registered URL and reconcile data-use disclosures with the repository text.
- Upload the new package before entering the new `tabs`, `webNavigation`, and HTTP/HTTPS site-access justifications; the inspected draft still requests only `storage`.
- Finalize and verify the listing, single-purpose statement, permission explanations, disclosures, and screenshots in the repository first, then apply them to the dashboard and verify the saved result.
- Record actual submission and publication dates/status when they occur.

## Appendix: current dashboard detailed description

Copied from the listing editor on 2026-09-19; retained as the baseline, not rewritten to describe unreleased features.

```text
Tab Position Options - Manifest V3 Fork

A modern fork of the original Tab Position Options extension, updated for Chrome Manifest V3 with enhanced security and performance.

Take control of your browsing experience by customizing where new tabs open and which tab becomes active when closing tabs.

KEY FEATURES:
• New Tab Position - Choose where new tabs appear (first, last, right/left of current, or default)
• New Tab Background - Open new tabs in the background without losing focus on current tab
• Tab Closing Behavior - Control which tab activates after closing (first, last, right/left, activation order, or default)
• Privacy-Focused - All settings stored locally, no data collection
• Lightweight & Fast - Minimal permissions, maximum performance
• Manifest V3 Compliant - Built with latest Chrome security standards
• Open Source - Source code available on GitHub

CURRENT STATUS:
This is an early release focusing on core functionality. Some features from the original extension are still being implemented. We're actively working to bring full feature parity while maintaining Manifest V3 compliance.

OPEN SOURCE & COMMUNITY:
• Source code: https://github.com/proshunsuke/tab-position-options-fork
• Report issues or request features: https://github.com/proshunsuke/tab-position-options-fork/issues
• Contributions welcome!

This fork maintains the simplicity and functionality of the original Tab Position Options while ensuring compatibility with modern Chrome requirements. Perfect for power users who want precise control over their tab management.

Note: This is a community fork created to preserve the functionality of the original extension for Manifest V3. Original extension:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

CHANGELOG:
0.2.2
• Fixed tab closing behavior on Chrome 147.0.7727.56
• Fixed tab closing behavior to keep working even if Chrome changes tab-close event order in future updates

0.2.1
• Fixed new tab positioning and tab closing behavior using stale session state after a Service Worker restart

0.2.0
• Fixed tab closing behavior on Chrome 146 to keep the configured activation order working reliably
• Updated the extension to work with the latest development toolchain and browser support

0.1.0
• Added "New Tab Background" option to open new tabs in the background while keeping the current tab active

0.0.6
• Significantly improved performance for all tab operations

0.0.5
• Fixed tab position settings not being applied when opening links from external applications

0.0.4
• Fixed issues with Service Worker restart handling that were not fully resolved in version 0.0.3

0.0.3
• Fixed unexpected behavior when Service Worker restarts after 30 seconds of inactivity

0.0.2
• Fixed "Left Tab" setting not working correctly when closing tabs opened via target="_blank" links
• Fixed tab order preservation during browser session restore

0.0.1
• Initial release
```
