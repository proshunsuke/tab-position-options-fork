# Privacy Policy for Tab Position Options Fork

*Last updated: September 19, 2026*

## Overview

Tab Position Options Fork lets you customize tab positioning and activation behavior in Chrome. The extension processes the information described below locally on your device. It does not transmit this information to external servers or share it with third parties.

## Information We Handle

### Settings and URL Rules

Your tab positioning, background-opening, and activation preferences are saved using `chrome.storage.local`. This includes URL patterns you enter in the extension's options page. Settings remain on your device until changed, removed, or deleted by uninstalling the extension.

### New-Tab URLs

When a tab is created, the extension reads its URL, including its pending navigation URL when available, to check your URL rules. Matching rules determine the tab's position and whether it opens in the foreground or background.

The extension processes these URLs in memory. It does not save them as browsing history or send them to external servers. User-entered URL patterns are saved as settings, as described above. The extension does not read the contents of web pages.

### Session Tab State

To maintain tab behavior when Chrome stops and restarts the extension's background process, the extension stores the following information in `chrome.storage.session`:

- Window and tab IDs
- Tab positions and active/pinned state
- IDs identifying which tabs opened other tabs
- The order in which tabs became active

This state is used only for tab positioning and activation, including choosing a tab after another tab closes. It does not contain saved page URLs, page titles, or page contents. Session storage is temporary and is cleared when the browser restarts; it is separate from your persistent settings.

## Data Storage and Sharing

- Settings and session tab state remain on your device.
- The extension does not use Chrome storage sync to synchronize this data between devices.
- The extension does not use analytics, advertising, or tracking services.
- The extension does not sell, transmit, or share the information described above with third parties.

## Permissions

- **storage**: Saves your preferences and URL rules locally, and retains session tab state across background-process restarts.
- **tabs**: Reads new-tab URLs to apply your URL rules. This permission is used for local matching, not for uploading or maintaining a history of visited pages.

## Your Controls

You can view and change preferences, and edit or remove URL rules, in the extension's options page. Click **Save Settings** to apply changes. Removing all URL rules stops URL-based matching; other tab settings continue to apply.

Restarting the browser clears session tab state. Uninstalling the extension removes its stored settings and extension data from that browser profile.

## Changes to This Policy

We will update this policy when the extension's data handling changes and revise the date above. The policy available in the repository describes the corresponding source code; older installed versions may have fewer features or permissions.

## Contact

For questions about privacy or data handling, please open an issue at:
https://github.com/proshunsuke/tab-position-options-fork/issues
