# Chrome Web Store — Tab Position Options Fork

Last updated: 2026-09-19

This file is the repository source of truth for submission information and copy for the Developer Dashboard. Update and verify the repository documents first, then apply the corresponding content to the dashboard. It is not uploaded automatically. Keep it aligned with user-facing features, permissions, data handling, and release assets when these change. See the [release procedure](.agents/skills/tab-position-release/SKILL.md).

## Sources and publication state

- [Developer Dashboard](https://chrome.google.com/webstore/devconsole/8009c97a-122b-4cb9-abdd-a961267915fc/bimiahgcjenkoacmdfggckkaflnnebki/edit): inspected in Brave on 2026-09-19 (listing, privacy, distribution, and package pages).
- [Store listing](https://chromewebstore.google.com/detail/tab-position-options-fork/bimiahgcjenkoacmdfggckkaflnnebki)
- Extension ID: `bimiahgcjenkoacmdfggckkaflnnebki`
- Published package: **0.2.2**, with `storage` permission only.
- Dashboard draft package: **0.2.2**, with `storage` permission only.
- Current source: still version **0.2.2**, but includes unreleased Tab on Activate and Matching URLs features, and requests `storage` and `tabs`. It is not the same package as the published 0.2.2.
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

Tab Position Options Fork lets you choose tab positions, open new tabs in the background, and control which tab is selected after closing the current one. You can also move tabs when they become active and set URL-specific rules for new tabs.

HOW TO USE
1. Open the extension from Chrome's Extensions menu or its toolbar icon.
2. Choose your tab preferences and add URL rules if needed.
3. Click Save Settings.

PRIVACY
Settings are stored locally on your device. New-tab URLs are processed locally to apply your URL rules; they are not sent to external servers. The extension does not use analytics or tracking services.

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
Customize Chrome tab positioning and activation behavior, including where new tabs open, which tab is selected after closing a tab, where activated tabs move, and URL-specific rules for new tabs.
```

## Permissions justification

Source of truth: [wxt.config.ts](wxt.config.ts). Current source requests `storage` and `tabs`; host permissions are empty. There are no optional permissions or content scripts.

### storage — Current dashboard text

```text
This extension uses the storage permission to save user preferences for tab positioning behavior locally on the user's device. All settings are stored using chrome.storage.local API and include:
- New tab position preferences (first, last, right, left, or default)
- Tab closing behavior preferences
No data is transmitted to external servers. All data remains on the user's local device.
```

### storage — Draft for next release

```text
The storage permission saves tab positioning and activation preferences, including user-defined URL rules, locally using chrome.storage.local. The extension also uses chrome.storage.session to retain tab activation order and tab snapshots across service worker restarts so tab positioning and closing behavior remain consistent. This state contains tab IDs and tab metadata, not a saved list of visited URLs. Data stays on the user's device and is not transmitted to external servers.
```

Evidence: [settings](src/settings/state/appData.ts), [activation history](src/tabs/state/activationHistory.ts), [tab snapshots](src/tabs/state/tabSnapshot.ts).

### tabs — Draft for next release; absent from current dashboard package

```text
The tabs permission is required to read the URL of newly created tabs (Tab.pendingUrl or Tab.url) and match it against user-defined URL rules. These rules determine the new tab's position and whether it opens in the foreground or background. Matching applies automatically to newly created tabs without requiring the user to click the extension for each tab. URLs are processed locally and are not transmitted externally or saved as browsing history. The extension does not read page contents.
```

Evidence: [new-tab handler](src/tabs/handleNewTab.ts), [URL matching](src/tabs/newTabUrlRules.ts). Unlike position-only tab operations, these properties require URL access. See the [Tabs API permission documentation](https://developer.chrome.com/docs/extensions/reference/api/tabs).

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
| Preferences and user-entered URL patterns | Saved in `chrome.storage.local`; editable in options | No / No |
| Newly created tab URL | Read to evaluate matching rules; not saved as visited-URL history | No / No |
| Tab IDs and activation order | Stored in `chrome.storage.session` for tab closing behavior | No / No |
| Tab IDs, positions, active/pinned state, opener IDs | Stored in `chrome.storage.session` for tab positioning and restart recovery | No / No |

The debug utility can store local diagnostic logs when explicitly instrumented; no production call sites of `debugLog` were found during this review. There is no extension telemetry or external reporting in the reviewed source. Developer tooling is separate from the shipped extension.

### Privacy policy

- Registered URL: https://github.com/proshunsuke/tab-position-options-fork/blob/main/PRIVACY.md
- Local file: [PRIVACY.md](PRIVACY.md), updated September 19, 2026, to describe user-entered URL rules, transient URL matching, and session-only tab metadata/activation order.
- The public policy URL must serve this updated text before submission. A local edit alone does not update the published policy.
- Reconcile the dashboard data-use answers with that updated policy and the then-current Chrome Web Store definitions. The recorded unchecked boxes above must not be treated as a substitute for reviewing the latest URL-handling behavior.

## Graphics and assets

Dashboard uploads were observed; exact byte-for-byte identity with local files has not been verified.

| Asset | Local file / dimensions | Dashboard and preparation status |
| --- | --- | --- |
| Store icon | [public/icon-128.png](public/icon-128.png), 128×128 | Uploaded |
| Screenshot 1 | [screenshot-1.png](store-assets/screenshots/screenshot-1.png), 1280×800 | Uploaded; review against the new options UI |
| Screenshot 2 | [screenshot-2.png](store-assets/screenshots/screenshot-2.png), 1280×800 | Uploaded; review against the new options UI |
| Small promo tile | [promotional-440x280.png](store-assets/promotional-440x280.png), 440×280 | Uploaded |
| Marquee promo tile | Local source not identified | Uploaded; dashboard specifies 1400×560 |

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
| Next version not assigned | Not submitted | Tab on Activate; URL rules; `tabs` permission | Source only; release preparation pending |
| 0.2.2 | Publication date not checked | Tab closing fixes for Chrome 147 and varying event order | Published; also present as dashboard draft |

Older changes are in [CHANGELOG.md](CHANGELOG.md) and the current listing below. Submission/publication dates were not inferred from commit dates.

### Rejection history

The developer reports that an earlier submission requesting `tabs` was rejected because the code at that time did not need it. The date, version, and original rejection text have not been verified. The current URL-rule implementation now reads `pendingUrl`/`url`; the justification above explains this concrete new use. Approval is not assumed until the next submission is reviewed.

### Remaining release preparation

- Assign the next version through the existing release workflow.
- Publish the updated privacy policy at its registered URL and reconcile data-use disclosures with the repository text.
- Upload the new package before entering the new `tabs` justification; the inspected draft still requests only `storage`.
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
