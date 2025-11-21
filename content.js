/**
 * Contact Center Productivity Add-On - Content Script
 * 
 * This script runs in the context of the CRM web page and handles:
 * 1. Detecting disposition screen closure
 * 2. Monitoring lead field changes
 * 3. Triggering the "New Lead" action if needed
 */

// Configuration object - will be loaded from chrome.storage
let config = {
  dispoScreenSelector: 'div.results_div',
  leadFieldSelector: 'li.active a[href*="/lead_info/"]',
  newLeadButtonSelector: 'button[ng-click*="createLead"]',
  leadIdDelayMs: 2000,
  domSettleDelayMs: 50,
  enabled: true
};

// State tracking
let state = {
  isMonitoring: false,
  lastLeadId: null,
  dispositionObserver: null,
  pendingLeadCheckTimeout: null
};

/**
 * Initialize the extension by loading configuration from storage
 */
function initializeExtension() {
  chrome.storage.sync.get(config, function(items) {
    config = items;
    console.log('[Contact Center Extension] Configuration loaded:', config);
    
    if (config.enabled) {
      setupDispositionMonitoring();
    }
  });
}

/**
 * Setup MutationObserver to detect disposition screen closure
 */
function setupDispositionMonitoring() {
  // Target the body or a specific container for DOM changes
  const targetElement = document.body;
  
  const observerOptions = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'aria-hidden', 'ng-show']
  };
  
  state.dispositionObserver = new MutationObserver(function(mutations) {
    // Check if disposition screen is no longer visible
    const dispoScreen = document.querySelector(config.dispoScreenSelector);
    
    if (!dispoScreen || !isElementVisible(dispoScreen)) {
      console.log('[Contact Center Extension] Disposition screen closure detected');
      onDispositionScreenClosed();
    }
  });
  
  state.dispositionObserver.observe(targetElement, observerOptions);
  console.log('[Contact Center Extension] Disposition monitoring initialized');
}

/**
 * Check if an element is visible in the DOM
 */
function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  const isHidden = style.display === 'none' || 
                   style.visibility === 'hidden' || 
                   style.opacity === '0';
  
  return !isHidden && element.offsetParent !== null;
}

/**
 * Called when the disposition screen is detected as closed
 */
function onDispositionScreenClosed() {
  // Clear any pending timeout
  if (state.pendingLeadCheckTimeout) {
    clearTimeout(state.pendingLeadCheckTimeout);
  }
  
  // Wait a bit for the DOM to settle, then capture the initial lead ID
  state.pendingLeadCheckTimeout = setTimeout(function() {
    const initialLeadId = getLeadId();
    console.log('[Contact Center Extension] Initial lead ID:', initialLeadId);
    state.lastLeadId = initialLeadId;
    
    // Now wait for the configured delay to check if the lead has changed
    state.pendingLeadCheckTimeout = setTimeout(function() {
      checkLeadChange();
    }, config.leadIdDelayMs);
  }, config.domSettleDelayMs);
}

/**
 * Extract the lead ID from the lead field
 * Returns the numeric ID from the href attribute (e.g., "1837017" or "new")
 */
function getLeadId() {
  const leadElement = document.querySelector(config.leadFieldSelector);
  
  if (!leadElement) {
    console.warn('[Contact Center Extension] Lead field element not found');
    return null;
  }
  
  const href = leadElement.getAttribute('href');
  if (!href) {
    console.warn('[Contact Center Extension] Lead field href not found');
    return null;
  }
  
  // Extract the lead ID from the href (e.g., "/lead_info/1837017" -> "1837017")
  const match = href.match(/\/lead_info\/(.+)/);
  return match ? match[1] : null;
}

/**
 * Check if the lead has changed; if not, trigger the "New Lead" action
 */
function checkLeadChange() {
  const currentLeadId = getLeadId();
  console.log('[Contact Center Extension] Current lead ID:', currentLeadId);
  
  if (currentLeadId && currentLeadId !== state.lastLeadId) {
    // New lead has loaded automatically - no action needed
    console.log('[Contact Center Extension] New lead detected. No action required.');
  } else {
    // Lead has not changed - click the "New Lead" button
    console.log('[Contact Center Extension] Lead has not changed. Triggering "New Lead" action.');
    triggerNewLeadAction();
  }
}

/**
 * Programmatically click the "New Lead" button
 */
function triggerNewLeadAction() {
  const newLeadButton = document.querySelector(config.newLeadButtonSelector);
  
  if (!newLeadButton) {
    console.error('[Contact Center Extension] "New Lead" button not found with selector:', config.newLeadButtonSelector);
    return;
  }
  
  if (!newLeadButton.disabled) {
    console.log('[Contact Center Extension] Clicking "New Lead" button');
    newLeadButton.click();
  } else {
    console.warn('[Contact Center Extension] "New Lead" button is disabled');
  }
}

/**
 * Listen for messages from the background script or popup
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('[Contact Center Extension] Message received:', request);
  
  if (request.action === 'getStatus') {
    sendResponse({
      enabled: config.enabled,
      lastLeadId: state.lastLeadId,
      isMonitoring: state.isMonitoring
    });
  } else if (request.action === 'updateConfig') {
    config = { ...config, ...request.config };
    chrome.storage.sync.set(config);
    console.log('[Contact Center Extension] Configuration updated:', config);
    sendResponse({ success: true });
  } else if (request.action === 'toggleEnabled') {
    config.enabled = request.enabled;
    chrome.storage.sync.set({ enabled: config.enabled });
    
    if (config.enabled && !state.dispositionObserver) {
      setupDispositionMonitoring();
    }
    
    console.log('[Contact Center Extension] Extension toggled:', config.enabled);
    sendResponse({ success: true, enabled: config.enabled });
  }
});

/**
 * Initialize the extension when the content script loads
 */
console.log('[Contact Center Extension] Content script loaded');
initializeExtension();
