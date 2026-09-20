# Privacy Policy for Tab Position Options Fork

*Last updated: September 20, 2026*

## Overview

Tab Position Options Fork lets you customize tab positioning and activation behavior in Chrome. Tab and browsing information is processed locally on your device. Settings and user-entered URL rules are automatically synchronized through Google's Chrome Sync service when Chrome sync is enabled. The developer does not operate a server that receives your data.

## Information We Handle

### Settings and URL Rules

Your tab positioning, background-opening, activation, pop-up conversion, and external-link preferences are saved using `chrome.storage.local` and automatically copied to `chrome.storage.sync`. This includes URL patterns you enter in the extension's options page. When Chrome sync is enabled, Google synchronizes these settings between your Chrome installations using the same account. Chrome's sync settings and Google's privacy policy govern that service. There is no separate synchronization switch in this extension.

Local settings remain usable when sync is unavailable. Settings that exceed Chrome's sync storage capacity are kept locally; other devices may retain the last successfully synchronized settings. On startup, synchronized settings are used unless this device has unsent local changes. Settings are synchronized as a whole, rather than merging individual rules; concurrent edits on different devices may replace one another.

When you export settings, the extension downloads a JSON file containing the settings currently shown, including unsaved changes and user-entered URL patterns. It does not include session tab state or browsing history. Import reads only the file you select and processes it locally; imported settings are applied when you click **Save Settings**. The extension does not upload these files.

### New-Tab URLs

When a tab is created, the extension reads its URL, including its pending navigation URL when available, to check your URL rules. Matching rules determine the tab's position and whether it opens in the foreground or background.

The extension processes these URLs in memory. It does not save them as browsing history or send them to external servers. User-entered URL patterns are saved as settings, as described above.

### External Links

A bundled content script runs on HTTP and HTTPS pages, including frames. When **Open external links in new tabs** is enabled, it handles ordinary link clicks by reading the current page URL and the clicked link's URL and attributes, such as whether it is a download. It compares origins and your URL rules to choose whether to use the current tab/frame or create a foreground or background tab. The feature is disabled by default; its click handler returns without inspecting the link when disabled.

These values are processed in memory. For new tabs, the page and destination URLs are sent only to the extension's local background process. The extension does not store a click history, extract page text or form values, or send these values to external services. Following a link makes the normal browser request to the destination site.

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
- Restored tab and window IDs, including the initial selected tab, used to preserve restored positions and selection

This state is used only for tab positioning and activation, including choosing a tab after another tab closes and switching to the last active tab. Restored tab identities are retained until the tab closes or the browser restarts; initial selection markers are cleared when the selection event is handled. Tab snapshots do not contain page URLs, page titles, or page contents; pending navigation URLs are handled separately as described above. Session storage is temporary and is cleared when the browser restarts; it is separate from your persistent settings.

## Data Storage and Sharing

- Settings and user-entered URL patterns are stored locally and synchronized through Chrome Sync when enabled.
- Browsing URLs, titles, tab/window identifiers, activation order, and temporary navigation state are never included in synchronized settings.
- The extension does not use analytics, advertising, or tracking services.
- The extension does not sell data or send it to the developer. Automatic settings synchronization uses Google's browser service; there is no other external reporting.

## Permissions

- **storage**: Saves your preferences and URL rules locally and synchronizes them through Chrome Sync, and retains local session tab and pending navigation state across background-process restarts.
- **tabs**: Reads new-tab and pop-up URLs to apply your URL rules and pop-up exceptions. It also reads tab titles and URLs when you request sorting. This permission is used for local matching and sorting, not for uploading or maintaining a history of visited pages.
- **webNavigation**: Detects top-level navigation commits and server redirects to apply Loading Page URL rules, and provides navigation URLs for pop-up exception checks.
- **HTTP/HTTPS site access**: Requested at installation through the content script's URL matches so external-link handling can run on websites and their HTTP/HTTPS frames. It is used to inspect clicked links locally when the feature is enabled; it does not require the `scripting` permission.

## Your Controls

You can view and change preferences, and edit or remove URL rules, in the extension's options page. Click **Save Settings** to apply changes. Disable **Open external links in new tabs** to stop external-link handling; changes apply to already open pages that have the content script. Removing its rules alone leaves origin-based external-link handling enabled. Chrome's extension site-access controls can also restrict where the content script runs. Other tab settings continue to apply independently.

Use Chrome's sync settings to control synchronization between devices. Removing a saved URL rule also removes it from the next successfully synchronized settings snapshot. Disabling Chrome sync does not itself delete previously synchronized data; manage that data through Chrome and your Google account.

Restarting the browser clears session tab state. Uninstalling the extension removes its local extension data from that browser profile; do not rely on uninstalling one copy to erase settings already synchronized to other devices.

Exported files remain wherever you saved them, even after uninstalling the extension. You can delete them yourself when no longer needed.

## Changes to This Policy

We will update this policy when the extension's data handling changes and revise the date above. The policy available in the repository describes the corresponding source code; older installed versions may have fewer features or permissions.

## Contact

For questions about privacy or data handling, please open an issue at:
https://github.com/proshunsuke/tab-position-options-fork/issues
