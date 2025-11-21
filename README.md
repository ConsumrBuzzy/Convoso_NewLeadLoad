# Contact Center Productivity Add-On

A Chrome Extension that automates the transition to a new lead after a disposition screen closes in your CRM system.

## Overview

This extension monitors your CRM interface and automatically clicks the "New Lead" button if a new lead doesn't load automatically after completing a call disposition. This eliminates the manual step and improves agent productivity.

## Features

- **Automatic Lead Transition:** Detects when a disposition is complete and automatically loads the next lead if needed
- **Configurable Selectors:** Customize CSS selectors to match your CRM's HTML structure
- **Adjustable Timing:** Fine-tune the delays to match your CRM's performance
- **Non-Invasive:** Operates entirely on the client-side without modifying the underlying CRM
- **Easy Configuration:** Simple settings interface for customization

## Project Structure

```
contact-center-extension/
├── manifest.json                 # Chrome Extension manifest (Manifest V3)
├── README.md                     # This file
├── src/
│   ├── background/
│   │   └── service-worker.js    # Background service worker
│   ├── content/
│   │   └── content.js           # Content script (main logic)
│   ├── options/
│   │   ├── popup.html           # Extension popup UI
│   │   ├── popup.js             # Popup logic
│   │   ├── options.html         # Settings page
│   │   ├── options.js           # Settings logic
│   │   └── help.html            # Help documentation
│   └── assets/
│       ├── icon-16.png          # Extension icon (16x16)
│       ├── icon-48.png          # Extension icon (48x48)
│       └── icon-128.png         # Extension icon (128x128)
└── docs/
    └── SDD.md                   # Software Design Document
```

## Installation

### For Development

1. Clone or extract this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked"
5. Select the `contact-center-extension` folder
6. The extension should now appear in your extensions list

### For Production

Package the extension as a `.crx` file and distribute through the Chrome Web Store or your organization's internal distribution method.

## Configuration

### Quick Setup

1. Click the extension icon in your Chrome toolbar
2. Click "Configure" to open the settings page
3. Enter the CSS selectors for your CRM:
   - **Disposition Screen Selector:** The element containing the disposition modal/screen
   - **Lead Field Selector:** The element displaying the current lead ID
   - **New Lead Button Selector:** The button to click to load a new lead
4. Adjust timing parameters if needed (optional)
5. Click "Save Settings"

### Finding CSS Selectors

To find the correct CSS selectors for your CRM:

1. Open your CRM page in Chrome
2. Right-click on the target element
3. Select "Inspect" to open Developer Tools
4. Look at the HTML structure and identify a unique selector
5. Test in the browser console: `document.querySelector('your-selector')`

**Example selectors from the provided HTML:**
- Disposition Screen: `div.results_div`
- Lead Field: `li.active a[href*="/lead_info/"]`
- New Lead Button: `button[ng-click*="createLead"]`

## How It Works

The extension performs the following sequence:

1. **Monitor Disposition Screen:** A `MutationObserver` watches the DOM for changes indicating the disposition screen has closed
2. **Capture Initial Lead ID:** When the disposition screen closes, the extension reads the current lead ID from the Lead Field
3. **Wait for Lead Change:** After a configurable delay (default 2 seconds), the extension checks if the lead ID has changed
4. **Trigger Action:**
   - If the lead ID has changed → A new lead loaded automatically (no action needed)
   - If the lead ID hasn't changed → The extension clicks the "New Lead" button

## Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dispoScreenSelector` | String | `div.results_div` | CSS selector for the disposition screen element |
| `leadFieldSelector` | String | `li.active a[href*="/lead_info/"]` | CSS selector for the lead ID field |
| `newLeadButtonSelector` | String | `button[ng-click*="createLead"]` | CSS selector for the "New Lead" button |
| `domSettleDelayMs` | Number | 50 | Time (ms) to wait after disposition closes before checking lead field |
| `leadIdDelayMs` | Number | 2000 | Time (ms) to wait before checking if lead has changed |

## Troubleshooting

### Extension not working

1. **Check if enabled:** Click the extension icon and verify the toggle is ON
2. **Verify selectors:** Open Developer Console (F12) and test selectors:
   ```javascript
   document.querySelector('your-selector')
   ```
3. **Check console logs:** Look for messages starting with `[Contact Center Extension]`

### "New Lead" button not being clicked

- Verify the CSS selector is correct
- Ensure the button is visible and not disabled
- Check if the button requires specific conditions to be clickable
- Review console logs for error messages

### Lead ID not being detected

- Ensure the Lead Field Selector points to an element with an `href` attribute
- Verify the URL pattern matches the expected format (e.g., `/lead_info/{id}`)
- Test the selector in the console

## Debugging

Enable console logging to see what the extension is doing:

1. Open Developer Console (F12)
2. Look for messages starting with `[Contact Center Extension]`
3. These logs show:
   - When the extension loads
   - Configuration being used
   - When disposition screen closes
   - Lead ID changes
   - Actions taken

Example output:
```
[Contact Center Extension] Content script loaded
[Contact Center Extension] Configuration loaded: {...}
[Contact Center Extension] Disposition monitoring initialized
[Contact Center Extension] Disposition screen closure detected
[Contact Center Extension] Initial lead ID: 1837017
[Contact Center Extension] Current lead ID: 1837018
[Contact Center Extension] New lead detected. No action required.
```

## Development

### Adding Features

The extension is modular and can be extended with additional features:

- **Content Script** (`src/content/content.js`): Main logic for DOM monitoring and interaction
- **Service Worker** (`src/background/service-worker.js`): Background tasks and storage
- **Options Page** (`src/options/options.html` & `options.js`): Settings UI
- **Popup** (`src/options/popup.html` & `popup.js`): Quick access UI

### Key Functions

**Content Script:**
- `initializeExtension()` - Loads configuration and starts monitoring
- `setupDispositionMonitoring()` - Sets up MutationObserver
- `onDispositionScreenClosed()` - Handles disposition screen closure
- `getLeadId()` - Extracts lead ID from the page
- `checkLeadChange()` - Checks if lead has changed
- `triggerNewLeadAction()` - Clicks the "New Lead" button

## Browser Compatibility

- **Chrome:** 88+ (Manifest V3 support required)
- **Edge:** 88+ (Chromium-based)
- **Other Chromium browsers:** May work with Manifest V3 support

## Permissions

The extension requests the following permissions:

| Permission | Purpose |
|-----------|---------|
| `storage` | Store and retrieve configuration settings |
| `scripting` | Inject content script and manipulate the DOM |
| `<all_urls>` | Run on any website (can be restricted to specific domains) |

## Security & Privacy

- The extension operates entirely on the client-side
- No data is sent to external servers
- Configuration is stored locally in `chrome.storage`
- The extension only interacts with the DOM of pages you specify

## License

This extension is provided as-is for use within your organization.

## Support

For issues, questions, or feature requests, please contact the extension developer or refer to the included help documentation (accessible via the extension popup).

## Changelog

### Version 1.0.0
- Initial release
- Core functionality: disposition detection, lead monitoring, automatic "New Lead" action
- Configurable CSS selectors and timing parameters
- Settings page and help documentation
- Popup UI for quick access and status

## Next Steps

1. **Configure Selectors:** Update the CSS selectors in the settings to match your CRM
2. **Test:** Verify the extension works with your CRM's disposition and lead flow
3. **Adjust Timing:** Fine-tune the delay parameters if needed
4. **Deploy:** Distribute to your team or organization

## Notes

- The extension uses `MutationObserver` to detect DOM changes, which is efficient and non-blocking
- CSS selectors targeting Angular attributes (`ng-click`, `ng-show`) are more stable than class-based selectors
- The 2-second default delay is a good starting point but can be adjusted based on your CRM's performance
- The extension is designed to be idempotent (clicking "New Lead" multiple times is safe)

---

**Created by:** Manus AI  
**Version:** 1.0.0  
**Last Updated:** November 2025
