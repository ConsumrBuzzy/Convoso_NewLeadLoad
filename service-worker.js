/**
 * Contact Center Productivity Add-On - Service Worker
 * 
 * This background script handles:
 * 1. Initialization of default configuration
 * 2. Message passing between content scripts and popup/options
 * 3. Storage management
 */

// Default configuration
const DEFAULT_CONFIG = {
  dispoScreenSelector: 'div.results_div',
  leadFieldSelector: 'li.active a[href*="/lead_info/"]',
  newLeadButtonSelector: 'button[ng-click*="createLead"]',
  leadIdDelayMs: 2000,
  domSettleDelayMs: 50,
  enabled: true
};

/**
 * Initialize the extension on install or update
 */
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('[Contact Center Extension] Extension installed');
    // Initialize default configuration in storage
    chrome.storage.sync.set(DEFAULT_CONFIG, function() {
      console.log('[Contact Center Extension] Default configuration saved');
    });
    // Open the options page on first install
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('[Contact Center Extension] Extension updated');
  }
});

/**
 * Listen for messages from content scripts or popup
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('[Contact Center Extension - Service Worker] Message received:', request);
  
  if (request.action === 'getConfig') {
    chrome.storage.sync.get(DEFAULT_CONFIG, function(items) {
      sendResponse(items);
    });
    return true; // Keep the message channel open for async response
  } else if (request.action === 'saveConfig') {
    chrome.storage.sync.set(request.config, function() {
      console.log('[Contact Center Extension - Service Worker] Configuration saved');
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log('[Contact Center Extension - Service Worker] Service worker loaded');
