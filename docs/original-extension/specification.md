# Tab Position Options - Original Extension Specification

## Overview

Tab Position Options is a Chrome extension that provides comprehensive control over tab behavior and positioning. This document describes the complete behavior specification, architectural design, and implementation considerations of the original extension based on the actual implementation analysis.

## Architecture Overview

### Component Structure

The extension consists of three main components that work together:

1. **Background Script (Persistent Background Page)**
   - Central hub for all tab management logic
   - Maintains persistent state across browser sessions
   - Handles all Chrome API events and coordinates responses
   - Manages complex state including tab activation history and parent-child relationships

2. **Content Script**
   - Injected into web pages to handle link behavior modification
   - Monitors DOM changes to dynamically update link behaviors
   - Communicates with background script for URL pattern matching
   - Handles click events for forced tab opening behaviors

3. **Options Page**
   - User interface for configuration management
   - Directly writes to Chrome Storage API
   - Provides import/export functionality for settings portability

### Data Flow and Communication

The extension uses a message-passing architecture where:
- Content scripts request configuration from the background script on page load
- Background script maintains authoritative state for all tab operations
- Options page changes are immediately reflected through storage listeners
- All components react to Chrome Storage changes for real-time updates

## Core Concepts and Design Philosophy

### Tab Activation History Management

The extension maintains a sophisticated activation history system:

**Purpose**: Enable intelligent tab switching when closing tabs, particularly for "In activated order" and "Source tab" options.

**Key Concepts**:
- Each window maintains an independent activation order list
- The list tracks the sequence in which tabs were activated (focused)
- Most recently activated tabs appear at the end of the list
- The currently active tab is always the last entry

**Implementation Considerations**:
- Must handle tab movements between windows
- Requires cleanup when tabs are closed or detached
- Performance impact with many tabs must be considered
- Race conditions during rapid tab switching need special handling

### Parent-Child Tab Relationships

The extension tracks which tab opened which (opener relationships):

**Purpose**: Support "Source tab (Open link)" functionality for returning to the originating tab when a child tab is closed.

**Tracking Mechanisms**:
- Monitors `chrome.webNavigation.onCreatedNavigationTarget` events
- Maintains mapping of child tab ID to parent tab ID (sourceTabId)
- Relationships are stored in memory only and not persisted
- Cleans up relationships when tabs are closed

**Behavior**:
- When closing a tab with tabfocus=7 (Source tab only), switches to parent tab if it exists
- When closing a tab with tabfocus=8 (Source tab & In activated order), tries parent tab first, then falls back to activation order
- If parent tab no longer exists, falls back to default behavior or activation order

### Window-Specific State Management

Each browser window maintains independent state:

**Rationale**: Users often use multiple windows for different tasks, requiring separate tab management contexts.

**Managed State per Window**:
- Tab activation order
- Currently active tab
- Recent tab removal flags for determining next active tab

**Synchronization Challenges**:
- State must be initialized when new windows are created
- Window focus changes don't affect internal window state
- Popup windows require special handling for conversion to tabs

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

Controls where tabs are positioned when navigating to specific URLs. This feature works with both direct navigation and server redirects.

#### Features:
- **Matching URLs**: URL patterns with position rules (loadingurl)
  - Each URL can be set to position the tab at:
    - **Always last**: At the end of the tab bar (sel: "last")
    - **Always middle**: In the middle of existing tabs (sel: "middle")
    - **Always first**: At the beginning of the tab bar (sel: "first")
  - Multiple URL patterns can be configured
  - Patterns are matched against the navigation target URL
  - Also matches against original URL for server redirects

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
- **Default**: No special positioning behavior (onactbutton1)
- **Last**: Moves the activated tab to the end of the tab bar (onactbutton2)
- **First**: Moves the activated tab to the beginning of the tab bar (onactbutton3)

### 5. External Links

Controls how external links (links to different domains) are handled.

#### Features:
- **External Links in New Tab**: Main checkbox to enable the feature (exlnk)
  - When enabled, links to external domains open in new tabs instead of the current tab
- **Matching URLs**: Exception and override rules (expexlnkurl)
  - URL patterns with specific behaviors:
    - **Except (Page URL)**: Excludes pages matching this URL from external link handling (sel: "except")
    - **Force New Tab (Page URL)**: Forces all links from pages matching this URL to open in new tabs (sel: "forcenew")
    - **Force Background Tab (Page URL)**: Forces all links from pages matching this URL to open in background tabs (sel: "forcebg")
    - **Force Current Tab (Page URL)**: Forces all links from pages matching this URL to open in the current tab (sel: "forcecrnt")
    - **Force New Tab (A tag href)**: Forces links with hrefs matching this URL to open in new tabs (sel: "forcenewa")
    - **Force Background Tab (A tag href)**: Forces links with hrefs matching this URL to open in background tabs (sel: "forcebga")
    - **Force Current Tab (A tag href)**: Forces links with hrefs matching this URL to open in the current tab (sel: "forcecrnta")

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

## External Link Processing Mechanism

### Content Script Operation

The content script implements a sophisticated link monitoring system:

**Initial Processing**:
- Connects to background script on DOMContentLoaded event
- Reconnects on window load event
- Additional connection attempts at 400ms, 800ms, and 1200ms after load
- Scans all links and applies URL pattern rules from configuration
- Modifies link behavior based on matching rules

**Dynamic DOM Monitoring**:
- Uses MutationObserver to detect new links added to the page (10ms delay after initial setup)
- Monitors both childList and subtree changes
- Processes dynamically loaded content (AJAX, React, etc.)
- Maintains consistent behavior across page updates
- Also monitors target attribute changes on individual links

**Link Behavior Modification Strategies**:

1. **Target Attribute Control**: Modifies or removes the `target` attribute to control default browser behavior
2. **Event Handler Injection**: Attaches click handlers for forced behaviors that preventDefault and manually open tabs
3. **Priority-Based Rule Application**: Processes multiple matching rules with specific precedence

**URL Pattern Matching Hierarchy**:
- Exact URL matches take precedence
- Domain-level rules apply next
- Page URL rules vs. link href rules have different scopes
- RegExp patterns provide flexible matching

### Storage Management Strategy

The extension implements a sophisticated storage system to handle Chrome's sync limitations:

**Quota Management**:
- Chrome Sync API has strict quotas (102,400 bytes total, 8,192 bytes per item)
- Extension monitors storage usage before writes
- Implements automatic chunking for large data sets

**Data Chunking Algorithm**:
- URL lists are split into chunks when they exceed per-item limits
- Each chunk is stored with a numeric suffix
- Reconstruction happens transparently on read

**Fallback Strategy**:
- When sync quota is exceeded, falls back to local storage
- Maintains a flag to indicate storage mode
- Attempts to migrate back to sync storage when possible

**Backward Compatibility**:
- Supports migration from older storage formats
- Handles both chunked and non-chunked data
- Preserves user settings during extension updates

## Event Processing Considerations

### Race Condition Handling

The extension addresses several race conditions:

**Tab Closing Race Condition**:
- Problem: Multiple tab close events in rapid succession can cause incorrect tab activation
- Solution: Implements a debounce mechanism with a flag and timer system
- Timing: Uses a 180ms window to batch related close events

**Tab Creation and Positioning**:
- Problem: Tab position calculations may use stale window state
- Solution: Refreshes window object after each operation
- Consideration: Balance between accuracy and performance

### Event Sequencing

Critical event ordering that must be maintained:

1. **Tab Creation Flow**:
   - `onCreated` → Position calculation → Move operation → State update
   - Background/foreground decision must happen before positioning

2. **Tab Removal Flow**:
   - `onRemoved` → Activation history cleanup → Next tab selection → Focus change
   - Parent-child relationship cleanup must occur

3. **Navigation Flow**:
   - `onBeforeNavigate` → Store original URL → `onCommitted` → Check for redirects
   - Redirect detection requires correlation between events

### Popup Window Handling

Special considerations for popup windows:

**Detection**:
- Monitors window creation with type "popup"
- Must distinguish between user popups and extension popups

**Conversion Timing**:
- Popup to tab conversion happens after window creation
- Requires tracking the previously focused normal window
- Must handle cases where conversion is rejected

**Exception Management**:
- URL-based exceptions prevent conversion
- Must check exception list before attempting conversion
- Handles both successful and failed conversions gracefully

## Technical Implementation Details

### Chrome API Event Handling

The extension coordinates multiple Chrome APIs:

**Essential Events**:
- `chrome.tabs.*`: Core tab manipulation and monitoring
- `chrome.windows.*`: Window state and focus tracking
- `chrome.webNavigation.*`: Navigation tracking for parent-child relationships and redirects
- `chrome.storage.*`: Configuration persistence and synchronization
- `chrome.runtime.*`: Message passing between components
- `chrome.commands.*`: Keyboard shortcut handling

### State Persistence Strategies

**In-Memory State**:
- Tab activation history (performance-critical)
- Window-tab relationships (frequently accessed)
- Temporary flags for race condition handling

**Persistent Storage**:
- User configuration settings
- URL pattern rules
- Feature toggles

**Session-Based State**:
- Recent tab removal flags
- Redirect tracking information
- Parent-child tab mappings

### Performance Optimization Techniques

**Batch Operations**:
- Groups multiple tab operations when possible
- Delays non-critical updates to reduce API calls
- Implements write coalescing for storage operations

**Caching Strategies**:
- Caches window and tab states to reduce queries
- Implements TTL for cached data
- Invalidates cache on relevant events

**Efficient Data Structures**:
- Uses object maps for O(1) lookups
- Maintains sorted arrays for ordered operations
- Implements cleanup routines to prevent memory leaks

## Default Behaviors

When no custom settings are configured:
- New tabs use Chrome's default positioning
- Tab closing follows Chrome's default behavior
- External links open in the current tab
- Popups open as separate windows
- No URL-specific rules are applied

## Special Behaviors and Edge Cases

### Pinned Tab Handling

- Pinned tabs always appear before regular tabs in Chrome
- When "Always first" is selected, new tabs are placed after pinned tabs
- Tab sorting operations (Alt+T, Alt+U) unpin all tabs before sorting

### Browser Startup and Installation Behavior

- Extension opens the options page automatically on first installation
- Extension initializes with a 600ms delay after window load event
- Tab and window states are cached for performance optimization
- Settings are loaded from Chrome Storage Sync API on startup
- Falls back to local storage if sync quota is exceeded
- Attempts to migrate old storage format to new chunked format if needed

### Redirect Handling

- Extension tracks original URLs before redirects occur
- Server redirects are detected via `server_redirect` transition qualifier
- URL matching rules apply to the original URL, not the redirected URL
- Redirect tracking information is cleaned up when tabs are closed

### Tab Movement and Timing

- Tab activation events have a 1ms delay before processing
- Tab closing events use a 180ms debounce window for race condition prevention
- Tab on Activate movement has a 260ms delay after activation
- Window object is refreshed after tab operations to maintain accuracy

## Limitations and Notes

1. **Loading Page** feature is implemented and works with navigation events but has limited UI exposure
2. **Tab on Activate** feature moves tabs when they are focused, which can be disorienting
3. URL pattern matching uses partial string matching and regular expressions internally
4. Settings sync may fail if too many URL rules are configured due to Chrome Storage Sync API quota (102,400 bytes total, 8,192 bytes per item)
5. The extension requires the "tabs" permission to function
6. Keyboard shortcuts are global and may conflict with other extensions or applications
7. The extension does not persist tab activation history across browser restarts
8. Tab IDs and parent-child relationships are lost when browser restarts