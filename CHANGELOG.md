# Changelog

## 1.1.0
- Made tab, navigation, and website access optional, requesting permissions only when you use the features that need them

## 1.0.0
- Added the remaining original Tab Position Options features, completing the Manifest V3 reimplementation
- Added Tab on Activate settings to move activated tabs to the first or last position
- Added URL-specific rules for new-tab position and foreground/background behavior, and Loading Page rules for navigation
- Added pop-up conversion to tabs with URL exceptions
- Added external-link handling with page exclusions and current-tab, foreground-tab, and background-tab rules
- Added keyboard shortcuts to sort tabs by title or URL and switch to the last active tab
- Added settings import/export and automatic Chrome Sync, with local fallback and synchronization failure notices
- Added options-page and store-description translations for 10 locales
- Updated the options page with category navigation, a persistent save bar, and dedicated settings-management and shortcut sections
- Added automatic settings display after installation and reuse of existing settings tabs
- Fixed tab positions and selection changing when Chrome restores the previous session

## 0.2.2
- Fixed tab closing behavior on Chrome 147.0.7727.56
- Fixed tab closing behavior to keep working even if Chrome changes tab-close event order in future updates

## 0.2.1
- Fixed new tab positioning and tab closing behavior using stale session state after a Service Worker restart

## 0.2.0
- Fixed tab closing behavior on Chrome 146 to keep the configured activation order working reliably
- Updated the extension to work with the latest development toolchain and browser support

## 0.1.0
- Added "New Tab Background" option to open new tabs in the background while keeping the current tab active

## 0.0.6
- Significantly improved performance for all tab operations

## 0.0.5
- Fixed tab position settings not being applied when opening links from external applications

## 0.0.4
- Fixed issues with Service Worker restart handling that were not fully resolved in version 0.0.3

## 0.0.3
- Fixed unexpected behavior when Service Worker restarts after 30 seconds of inactivity

## 0.0.2
- Fixed "Left Tab" setting not working correctly when closing tabs opened via target="_blank" links
- Fixed tab order preservation during browser session restore

## 0.0.1
- Initial release
