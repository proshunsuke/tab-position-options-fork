# Privacy Policy for Tab Position Options Fork

*Last updated: September 20, 2026*

## Overview

Tab Position Options Fork lets you customize tab positioning and activation behavior in Chrome. The extension processes the information described below locally on your device. It does not transmit this information to external servers or share it with third parties.

## Information We Handle

### Settings and URL Rules

Your tab positioning, background-opening, activation, and pop-up conversion preferences are saved using `chrome.storage.local`. This includes URL patterns you enter in the extension's options page. Settings remain on your device until changed, removed, or deleted by uninstalling the extension.

When you export settings, the extension downloads a JSON file containing the settings currently shown, including unsaved changes and user-entered URL patterns. It does not include session tab state or browsing history. Import reads only the file you select and processes it locally; imported settings are applied when you click **Save Settings**. The extension does not upload these files.

### New-Tab URLs

When a tab is created, the extension reads its URL, including its pending navigation URL when available, to check your URL rules. Matching rules determine the tab's position and whether it opens in the foreground or background.

The extension processes these URLs in memory. It does not save them as browsing history or send them to external servers. User-entered URL patterns are saved as settings, as described above. The extension does not read the contents of web pages.

### Page Navigation URLs

When Loading Page rules are configured, the extension checks the destination URL when a top-level navigation commits. For server redirects, it also checks the original navigation URL if the destination does not match.

The pending navigation URL and its tab ID, timestamp, and restoration flag are temporarily retained in `chrome.storage.session` so matching can survive a background-process restart. They are removed when the navigation commits or fails, or the tab closes. Browser restart clears this storage. This is temporary navigation state, not a history of visited pages. Page contents are not read and URLs are not transmitted externally.

### Pop-up URLs

When pop-up conversion is enabled, the extension checks new pop-up URLs against your exception patterns. These URLs are processed in memory. It moves the existing tab to a normal window without reading page contents or sending URLs externally. Window type and incognito status are used locally to select a compatible destination.

### Keyboard Shortcuts

When you request tab sorting, the extension reads the current window’s tab titles, URLs, and group membership. These values are used in memory to sort tabs while preserving pinned tabs and group boundaries; they are not stored or transmitted. Switching to the last active tab uses the session activation order described below.

### Session Tab State

To maintain tab behavior when Chrome stops and restarts the extension's background process, the extension stores the following information in `chrome.storage.session`:

- Window and tab IDs
- The last focused normal window ID and window IDs for pending pop-up conversions
- Tab positions and active/pinned state
- IDs identifying which tabs opened other tabs
- The order in which tabs became active
- Tab IDs whose initial restored navigation should not change their position

This state is used only for tab positioning and activation, including choosing a tab after another tab closes and switching to the last active tab. Tab snapshots do not contain page URLs, page titles, or page contents; pending navigation URLs are handled separately as described above. Session storage is temporary and is cleared when the browser restarts; it is separate from your persistent settings.

## Data Storage and Sharing

- Settings and session tab state remain on your device.
- The extension does not use Chrome storage sync to synchronize this data between devices.
- The extension does not use analytics, advertising, or tracking services.
- The extension does not sell, transmit, or share the information described above with third parties.

## Permissions

- **storage**: Saves your preferences and URL rules locally, and retains session tab and pending navigation state across background-process restarts.
- **tabs**: Reads new-tab and pop-up URLs to apply your URL rules and pop-up exceptions. It also reads tab titles and URLs when you request sorting. This permission is used for local matching and sorting, not for uploading or maintaining a history of visited pages.
- **webNavigation**: Detects top-level navigation commits and server redirects to apply Loading Page URL rules, and provides navigation URLs for pop-up exception checks.

## Your Controls

You can view and change preferences, and edit or remove URL rules, in the extension's options page. Click **Save Settings** to apply changes. Removing all URL rules stops URL-based matching; other tab settings continue to apply.

Restarting the browser clears session tab state. Uninstalling the extension removes its stored settings and extension data from that browser profile.

Exported files remain wherever you saved them, even after uninstalling the extension. You can delete them yourself when no longer needed.

## Changes to This Policy

We will update this policy when the extension's data handling changes and revise the date above. The policy available in the repository describes the corresponding source code; older installed versions may have fewer features or permissions.

## Contact

For questions about privacy or data handling, please open an issue at:
https://github.com/proshunsuke/tab-position-options-fork/issues
