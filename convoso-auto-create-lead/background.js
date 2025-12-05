/**
 * Convoso Auto Create Lead - Background Service Worker
 * 
 * Handles:
 * - Extension state management
 * - Badge updates for visual feedback
 * - Cross-tab communication
 */

// ===========================================
// STATE
// ===========================================
let clickCount = 0;

// ===========================================
// BADGE MANAGEMENT
// ===========================================

/**
 * Updates the extension badge to show status
 * @param {string} text - Badge text
 * @param {string} color - Badge background color
 */
function updateBadge(text, color) {
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
}

/**
 * Shows a brief "clicked" indicator on the badge
 */
function showClickFeedback() {
    clickCount++;
    updateBadge('✓', '#28a745');
    
    // Reset badge after 2 seconds
    setTimeout(() => {
        updateBadge('ON', '#28a745');
    }, 2000);
}

/**
 * Sets badge to show enabled/disabled state
 * @param {boolean} enabled 
 */
function setBadgeState(enabled) {
    if (enabled) {
        updateBadge('ON', '#28a745');
    } else {
        updateBadge('OFF', '#dc3545');
    }
}

// ===========================================
// MESSAGE HANDLING
// ===========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message);

    switch (message.action) {
        case 'contentScriptReady':
            console.log('[Background] Content script ready on tab:', sender.tab?.id);
            // Load and apply current enabled state
            chrome.storage.sync.get(['enabled'], (result) => {
                const enabled = result.enabled !== false; // Default to true
                setBadgeState(enabled);
            });
            break;

        case 'buttonClicked':
            console.log('[Background] Create Lead button was auto-clicked');
            showClickFeedback();
            break;

        case 'dispositionStarted':
            console.log('[Background] Disposition started:', message.disposition);
            // Could add analytics or logging here
            break;

        case 'setEnabled':
            // Save to storage and update badge
            chrome.storage.sync.set({ enabled: message.enabled }, () => {
                setBadgeState(message.enabled);
                console.log('[Background] Enabled state saved:', message.enabled);
            });
            
            // Forward to all Convoso tabs
            chrome.tabs.query({ url: '*://*.convoso.com/*' }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'setEnabled',
                        enabled: message.enabled
                    }).catch(() => {
                        // Tab might not have content script loaded
                    });
                });
            });
            break;

        case 'getClickCount':
            sendResponse({ clickCount: clickCount });
            break;

        default:
            console.log('[Background] Unknown action:', message.action);
    }

    return true;
});

// ===========================================
// INSTALLATION & STARTUP
// ===========================================

chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Background] Extension installed/updated:', details.reason);
    
    // Set default enabled state
    chrome.storage.sync.get(['enabled'], (result) => {
        if (result.enabled === undefined) {
            chrome.storage.sync.set({ enabled: true });
        }
        setBadgeState(result.enabled !== false);
    });
});

// Set initial badge state on startup
chrome.storage.sync.get(['enabled'], (result) => {
    setBadgeState(result.enabled !== false);
});

console.log('[Background] Service worker started');
