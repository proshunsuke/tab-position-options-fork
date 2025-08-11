# Tab Position Options - Original Extension Specification

## Overview

Tab Position Options is a Chrome extension that provides comprehensive control over tab behavior and positioning. This document describes the complete behavior specification of the original extension based on the actual implementation.

## Settings Categories

### 1. New Tab

Controls the position where new tabs are opened when using browser's new tab button (Ctrl+T, plus button, etc.).

#### Options:
- **Always first**: New tabs always open at the beginning of the tab bar
- **Always last**: New tabs always open at the end of the tab bar
- **Right of current tab**: New tabs open immediately to the right of the currently active tab
- **Left of current tab**: New tabs open immediately to the left of the currently active tab
- **Default**: Uses Chrome's default behavior

#### Additional Features:
- **New Tab Background**: Checkbox option to open new tabs in the background (tab opens but doesn't become active)
- **Matching URLs**: Advanced URL-based positioning rules
  - Each URL pattern can have its own position setting (first/last/right/left/default)
  - Each URL pattern can specify foreground/background opening behavior
  - Multiple URL patterns can be configured
  - URL patterns are matched against the page from which the new tab is opened

### 2. Loading Page

Controls where tabs open when loading new pages from links or programmatic navigation. This feature allows URL-specific tab positioning rules.

#### Features:
- **Matching URLs**: URL patterns with position rules
  - Each URL can be set to open in:
    - **Always last**: At the end of the tab bar
    - **Always middle**: In the middle of existing tabs
    - **Always first**: At the beginning of the tab bar
  - Multiple URL patterns can be configured
  - Patterns are matched against the target URL being loaded

### 3. Activate Tab After Tab Closing

Determines which tab becomes active when the current tab is closed.

#### Options:
- **First tab**: Activates the first tab in the window
- **Last tab**: Activates the last tab in the window
- **Right tab**: Activates the tab to the right of the closed tab
- **Left tab**: Activates the tab to the left of the closed tab
- **In activated order**: Activates the most recently used tab based on activation history
- **Source tab (Open link)**: Returns to the tab that opened the closed tab (parent tab)
- **Source tab (Open link) & In activated order**: Combines source tab and activation order logic
- **Default**: Uses Chrome's default behavior

### 4. Tab on Activate

Controls the positioning behavior when tabs are activated (brought to focus).

#### Options:
- **Default**: No special positioning behavior
- **Last**: Moves the activated tab to the end of the tab bar
- **First**: Moves the activated tab to the beginning of the tab bar

### 5. External Links

Controls how external links (links to different domains) are handled.

#### Features:
- **External Links in New Tab**: Main checkbox to enable the feature
  - When enabled, links to external domains open in new tabs instead of the current tab
- **Matching URLs**: Exception and override rules
  - URL patterns with specific behaviors:
    - **Except (Page URL)**: Excludes the page URL from external link handling
    - **Force New Tab (Page URL)**: Forces links from this page to open in new tabs
    - **Force Background Tab (Page URL)**: Forces links from this page to open in background tabs
    - **Force Current Tab (Page URL)**: Forces links from this page to open in the current tab
    - **Force New Tab (A tag href)**: Forces specific link URLs to open in new tabs
    - **Force Background Tab (A tag href)**: Forces specific link URLs to open in background tabs
    - **Force Current Tab (A tag href)**: Forces specific link URLs to open in the current tab

### 6. Pop-up

Controls how JavaScript popup windows are handled.

#### Features:
- **Open pop-up window as new tab**: Main checkbox
  - When enabled, popup windows open as regular tabs instead of separate windows
- **Exceptions**: URL patterns that bypass the popup-to-tab conversion
  - Allows specific sites to still open actual popup windows
  - Multiple exception URLs can be configured

## Additional Features

### Keyboard Shortcuts

The extension provides keyboard shortcuts for tab management:
- **Alt+T**: Sort tabs by title
- **Alt+U**: Sort tabs by URL
- **Alt+C**: Switch between current and last active tab

Note: Shortcuts can be customized through Chrome's extension keyboard shortcut configuration page.

### Import/Export Settings

The extension provides data portability:
- **Export Settings**: Saves all configuration to a `tabposition.txt` file
- **Import Settings**: Loads configuration from a previously exported file
- Settings are stored in JSON format

## Data Storage

### Storage Structure

The extension uses Chrome's storage APIs with the following data structure:

```javascript
{
  // Basic tab positioning
  osel: "openbutton1-5",        // New tab position selection
  actb: "activebutton1-8",      // Tab closing behavior
  onactvtb: "onactbutton1-3",   // Tab on activate behavior
  
  // Feature toggles
  newt: "true/false",            // New tab background
  popt: "true/false",            // Popup as new tab
  exlnk: true/null,              // External links in new tab
  
  // URL-based rules
  openurl: [                     // New tab URL rules
    {
      url: "example.com",
      sel: "first/last/right/left/default",
      act: "fore/back"
    }
  ],
  
  expurl: [                      // Popup exception URLs
    {
      url: "example.com",
      sel: "1"
    }
  ],
  
  expexlnkurl: [                 // External link exceptions
    {
      url: "example.com",
      sel: "except/forcenew/forcebg/forcecrnt/forcenewa/forcebga/forcecrnta"
    }
  ],
  
  loadingurl: [                  // Loading page URL rules
    {
      url: "example.com",
      sel: "last/middle/first"
    }
  ]
}
```

### Storage Sync

The extension implements sophisticated storage synchronization:
- Uses Chrome Storage Sync API for cross-device synchronization
- Falls back to Local Storage when sync quota is exceeded
- Implements chunking for large URL lists to work within Chrome's sync limits
- Maintains backward compatibility with older storage formats

## UI Components

### Main Settings Page

The options page provides a comprehensive interface with:
- Section headers with blue background (#ebeff9)
- Radio button groups for mutually exclusive options
- Checkboxes for feature toggles
- Dynamic URL list management with add/remove functionality
- Dropdown selects for URL-specific behaviors
- Visual feedback on focus (blue glow effect)
- Scrollable containers for long URL lists

### URL List Management

Each URL list section features:
- "Add" button (blue pill-shaped button) to add new rules
- Text input for URL patterns with placeholder text
- Dropdown select for behavior selection
- Close button (X) for removing entries
- Gray background for list items
- Auto-scrolling containers when lists exceed visible area

## Technical Implementation Details

### Event Handling

The extension listens for:
- Tab creation events
- Tab removal events  
- Tab activation events
- Navigation events
- Window popup requests

### URL Pattern Matching

URL patterns in the extension:
- Support partial domain matching
- Are case-insensitive
- Match against full URLs including protocol
- Process rules in the order they are defined

### Performance Considerations

The original extension:
- Maintains tab activation history in memory
- Processes URL rules synchronously
- Updates settings immediately on change
- Reloads configuration from storage on startup

## Default Behaviors

When no custom settings are configured:
- New tabs use Chrome's default positioning
- Tab closing follows Chrome's default behavior
- External links open in the current tab
- Popups open as separate windows
- No URL-specific rules are applied

## Limitations and Notes

1. **Loading Page** feature appears to be partially implemented in the UI but may not be fully functional
2. **Tab on Activate** feature moves tabs when they are focused, which can be disorienting
3. URL pattern matching is basic string matching, not regex or glob patterns
4. Settings sync may fail if too many URL rules are configured due to Chrome sync quota limits
5. The extension requires the "tabs" permission to function
6. Keyboard shortcuts are global and may conflict with other extensions or applications