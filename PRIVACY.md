# Privacy Policy for Tab Position Options Fork

*Last updated: September 25, 2026*

## Overview

Tab Position Options Fork lets you control where new tabs open, how tabs are activated, and how selected navigation features behave. The extension processes tab and browsing information locally to apply your settings. It stores settings on your device and, when the browser's extension sync service is available and enabled, synchronizes those settings through that service. The developer does not operate a server that receives your settings or browsing information.

This policy describes the extension's data handling. Browser-specific controls and policies also apply when you use the extension in a Chromium-based browser other than Chrome.

## Information the Extension Handles

### Settings and URL Patterns

The extension stores your preferences in `chrome.storage.local`. These include new-tab position and background behavior, URL rules for new tabs and Loading Page, behavior after a tab closes or becomes active, pop-up conversion and exceptions, and External Links settings and rules. The extension also saves small local metadata used to track the settings version and synchronization status.

The extension copies settings and user-entered URL patterns to `chrome.storage.sync`. In Google Chrome, Chrome Sync synchronizes this data between Chrome installations when sync is enabled. Chrome's sync controls and Google's privacy policy apply to that service. Another compatible browser may provide its own sync behavior and policies. The extension does not synchronize browsing URLs, tab titles, tab or window IDs, or session state.

Settings are synchronized as a whole rather than by merging individual rules. Unsynchronized local changes are kept on the device and retried when the browser or extension can sync again. If Chrome's sync storage capacity is exceeded or the sync service is unavailable, local settings remain available, but other installations may keep the last settings they received. Turning sync off does not make this extension delete a copy that was already synchronized; use the browser or account provider's controls to manage synchronized data.

### Importing and Exporting Settings

When you export settings, the extension creates a JSON file from the settings currently shown in the options page, including unsaved changes and URL patterns. The file does not include session tab state or browsing history. The file is downloaded to your device; the extension does not upload it.

When you import settings, the extension reads the JSON file you select, validates it, and places its settings in the options page. It does not save them until you click **Save Settings**. Importing a file does not request optional permissions. Any imported feature that needs an optional permission will not take effect until that permission has been granted. The extension does not upload the imported file.

### URLs Used for Tab Behavior

When a new tab is created, the extension uses its URL, when available, to match your new-tab URL rules and choose a position or foreground/background state. Adding a new-tab URL rule in the options page requests the optional `tabs` permission if it has not already been granted, so Chrome can provide the tab URL. The URL is used in memory for matching; it is not saved as browsing history or sent to the developer.

After `webNavigation` is granted, the extension receives navigation events. For top-level navigations, when Loading Page rules are configured, it uses destination URLs to match a rule and position the tab; for a server redirect, it can compare both the destination and the original navigation URL. Events that do not need to be processed by Loading Page or pop-up conversion are not kept as navigation history. A pending navigation URL, tab ID, timestamp, and restoration marker are temporarily held in `chrome.storage.session` so Loading Page behavior can survive a background-process restart. This data is removed when the navigation is handled or fails, or the tab closes. Session storage is cleared when the browser restarts or the extension is reloaded, disabled, or updated.

When pop-up conversion is enabled, the extension uses navigation URLs to check the pop-up exception patterns and moves the existing tab into a normal window when appropriate. It uses the window type and incognito status locally to select a compatible destination. Page contents are not read for these features.

When you invoke a tab-sorting shortcut, the extension reads the current window's tab titles, URLs, positions, pinned state, and group membership to sort tabs while preserving pinned tabs and group boundaries. These values are processed in memory for that operation and are not saved as browsing history or synchronized.

### External Links

External Links is disabled by default. The extension requests the optional `scripting` permission and access to HTTP and HTTPS sites only when you turn this feature on. After you grant access and save the setting, the extension dynamically registers its bundled content script for HTTP and HTTPS pages and frames. It also injects the script into already-open HTTP and HTTPS tabs so the feature can take effect without requiring those pages to be reopened.

While the feature is enabled, the script handles eligible link clicks by reading the current page URL, the link URL, and whether the link has a `download` attribute. It compares the page and destination with their origins and your URL rules to decide whether to leave the link alone, navigate in the current tab, or open a foreground or background tab. It does not read general page text, form values, or unrelated page data.

When the extension opens a new tab for a link, it sends the page and destination URLs to its own background process on the device. Those URLs are not sent to the developer or another external service. The browser makes its normal request to the destination site when the link is followed.

### Session Tab State

To maintain tab behavior across background-process restarts, the extension temporarily stores tab and window state in `chrome.storage.session`. This includes:

- Tab and window IDs, tab positions, active and pinned state, and opener tab IDs
- The order in which tabs became active
- The last focused normal window and pending pop-up conversion window IDs
- IDs used to identify restored tabs and the initially selected tab
- Pending top-level navigation URLs and the small amount of state needed to process them

This state supports tab placement, activation, restoration, and selection after a tab closes. Tab snapshots and activation history do not contain page URLs, titles, or page contents; pending navigation URLs are stored separately as described above. Session state is temporary, is not synchronized, and is cleared when the browser restarts or the extension is reloaded, disabled, or updated. Other short-lived coordination data is held only in memory and discarded when no longer needed.

## Permissions

The production extension declares only `storage` as a required permission. It declares the following permissions as optional and requests them from a relevant user action when they have not already been granted:

- **`tabs`**: Requested when you add a new-tab URL rule or invoke a title- or URL-sorting shortcut. It lets the extension read tab URLs or titles needed for those operations. Basic tab positioning and tab-closing behavior do not require access to all websites.
- **`webNavigation`**: Requested when you add a Loading Page rule or turn on pop-up conversion. It lets the extension observe navigation URLs needed to apply those features and check pop-up exceptions.
- **`scripting` and HTTP/HTTPS site access**: Requested when you turn on External Links. The site access covers HTTP and HTTPS pages and frames so the extension can run its bundled link-handling script. If you decline, External Links is not enabled by that action.

Importing settings does not request these permissions. Disabling a feature stops its behavior after the settings are saved, but does not automatically revoke permission that was already granted. The extension does not call the Permissions API to remove optional grants. Chrome lets you restrict or revoke HTTP/HTTPS site access in its extension settings; doing so can make External Links unavailable. Other browsers provide their own access controls. Uninstalling the extension removes its permissions from that browser profile.

## Data Storage and Sharing

- Settings and user-entered URL patterns are stored locally and synchronized only through the browser's extension sync service when it is available and enabled.
- URLs collected from browsing activity, tab titles, tab/window IDs, activation order, and temporary navigation state are not synchronized. URL patterns that you enter as settings are synchronized.
- The extension does not use analytics, advertising, or tracking services.
- The extension does not sell your data or send it to the developer. Apart from the browser's sync service and normal requests to websites you choose to visit, the extension does not transmit your data to external services.

## Your Controls and Data Retention

You can review and change preferences and URL rules in the options page. Click **Save Settings** to apply settings changes. Permission requests are initiated by the relevant feature control; the browser determines the prompt and lets you grant or deny access. Turning off **Open external links in new tabs** and saving stops External Links handling, but leaves its previously granted permissions in place. In Chrome, you can restrict or revoke its HTTP/HTTPS site access using the extension's site-access controls. Removing External Links URL rules alone does not disable origin-based handling while the feature remains enabled.

Use the browser's sync controls to manage synchronization. Removing a saved setting or URL rule is reflected in the next successful sync. Turning synchronization off does not necessarily remove data already held by the sync provider.

Uninstalling the extension removes its local extension data from that browser profile. Do not rely on uninstalling one copy to remove settings already synchronized to other devices. Exported JSON files remain wherever you saved them and can be deleted separately.

## Changes to This Policy

We will update this policy when the extension's data handling changes. This policy describes the corresponding source code; older installed versions may handle data or request permissions differently.

## Contact

For questions about privacy or data handling, please open an issue at:
https://github.com/proshunsuke/tab-position-options-fork/issues
