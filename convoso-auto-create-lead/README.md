# Convoso Auto Create Lead - Chrome Extension

A Chrome extension that automatically clicks the "Create Lead" button after dispositioning a lead in Convoso.

## Features

- **Auto-Click**: Automatically clicks "Create Lead" after disposition completion
- **Safety Toggle**: Enable/disable via popup with visual feedback
- **Manual Trigger**: Force-click button when needed
- **Visual Feedback**: Badge shows ON/OFF status and click confirmations
- **Debounce Protection**: Prevents multiple rapid clicks

## Installation

### Developer Mode (Recommended for Testing)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `convoso-auto-create-lead` folder
5. The extension icon should appear in your toolbar

### Icons Setup

Replace the placeholder icon files in the `icons/` folder with actual PNG images:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

You can use any icon generator or create simple icons with a "+" and user symbol.

## Usage

1. **Navigate to Convoso** - The extension activates on `*.convoso.com` domains
2. **Check Status** - Click the extension icon to see if it's active
3. **Disposition a Lead** - Use the Quick Dispos panel as normal
4. **Auto-Click Happens** - The "Create Lead" button is clicked automatically when it appears

## How It Works

```text
Agent is on Dispos tab → clicks disposition button (e.g., "No Answer")
         ↓
Extension detects disposition click, marks "in progress"
         ↓
"Saving..." appears briefly while Convoso processes
         ↓
Tab automatically switches from Dispos → Leads
         ↓
Extension detects tab change, finds "Create Lead" button
         ↓
Waits 300ms (configurable debounce)
         ↓
Auto-clicks the "Create Lead" button
         ↓
New lead form opens with empty Primary Phone field
         ↓
Badge shows ✓ confirmation
```

## Configuration

Edit `content.js` to adjust these settings:

```javascript
const CONFIG = {
    CLICK_DELAY_MS: 300,      // Delay before clicking (ms)
    COOLDOWN_MS: 3000,        // Minimum time between clicks (ms)
    DEBUG: true               // Console logging (view in browser DevTools)
};
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not working | Reload the Convoso page after installing |
| Button not clicking | Check if extension is enabled in popup |
| Multiple clicks | Increase `COOLDOWN_MS` in config |
| No visual feedback | Check browser console for errors |

## Files

```text
convoso-auto-create-lead/
├── manifest.json      # Extension configuration
├── content.js         # Main logic (injected into Convoso pages)
├── background.js      # Service worker for state management
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── styles.css         # Popup styling
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Security Notes

- Extension only runs on `*.convoso.com` domains
- No data is sent externally
- All state is stored locally via `chrome.storage.sync`
- Toggle allows instant disable if needed

## Version History

- **1.0.0** - Initial release with auto-click functionality

## Support

For issues or feature requests, contact your system administrator.
