/**
 * Convoso Auto Create Lead - Content Script
 * 
 * This script monitors the Convoso agent interface for disposition completion
 * and automatically clicks the "Create Lead" button when it becomes visible.
 * 
 * Detection Strategy:
 * 1. Watch for disposition button clicks (quick_dispo_btn class)
 * 2. Monitor for tab change from "Dispos" to "Leads" (indicates disposition completed)
 * 3. Detect when Create Lead button is visible on Leads tab
 * 4. Auto-click with debounce to prevent multiple triggers
 * 
 * Flow: Agent clicks dispo → "Saving..." appears → Tab switches to Leads → 
 *       Create Lead button is visible → Extension clicks it
 */

(function() {
    'use strict';

    // ===========================================
    // CONFIGURATION
    // ===========================================
    const CONFIG = {
        // Delay (ms) after detecting tab change before clicking
        CLICK_DELAY_MS: 300,
        
        // Cooldown (ms) between auto-clicks to prevent rapid firing
        COOLDOWN_MS: 3000,
        
        // Selector for the Create Lead button
        CREATE_LEAD_SELECTOR: 'button.btn-success[ng-click*="createLead"]',
        
        // Selector for disposition buttons
        DISPO_BUTTON_SELECTOR: '.quick_dispo_btn',
        
        // Selector for the Leads tab (to detect when it becomes active)
        LEADS_TAB_SELECTOR: 'li[ng-class*="currentTab == \'lead\'"]',
        
        // Selector for the Dispos tab
        DISPOS_TAB_SELECTOR: 'li[ng-if*="quick_dispositions_enabled"]',
        
        // Selector for the "Saving..." indicator
        SAVING_INDICATOR_SELECTOR: '#quick_dispo_save',
        
        // Debug mode - set to true for console logging
        DEBUG: true
    };

    // ===========================================
    // STATE MANAGEMENT
    // ===========================================
    let state = {
        enabled: true,              // Extension enabled/disabled
        lastClickTime: 0,           // Timestamp of last auto-click
        pendingClick: null,         // Timeout ID for pending click
        dispositionInProgress: false, // Flag to track if we're waiting for dispo to complete
        wasOnDisposTab: false,      // Track if we were on Dispos tab before
        lastTabState: null          // Track last known tab state
    };

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================
    
    /**
     * Logs debug messages to console when DEBUG mode is enabled
     * @param {string} message - Message to log
     * @param {any} data - Optional data to log
     */
    function log(message, data = null) {
        if (CONFIG.DEBUG) {
            const timestamp = new Date().toLocaleTimeString();
            if (data) {
                console.log(`[Convoso AutoLead ${timestamp}] ${message}`, data);
            } else {
                console.log(`[Convoso AutoLead ${timestamp}] ${message}`);
            }
        }
    }

    /**
     * Sends a message to the background script
     * @param {object} message - Message object to send
     */
    function sendMessage(message) {
        try {
            chrome.runtime.sendMessage(message);
        } catch (error) {
            log('Error sending message:', error);
        }
    }

    /**
     * Checks if the Create Lead button is currently visible
     * @returns {HTMLElement|null} The button element if visible, null otherwise
     */
    function getVisibleCreateLeadButton() {
        const button = document.querySelector(CONFIG.CREATE_LEAD_SELECTOR);
        
        if (!button) {
            return null;
        }

        // Check if button is hidden via ng-hide class or inline style
        const isHidden = button.classList.contains('ng-hide') || 
                         button.style.display === 'none' ||
                         window.getComputedStyle(button).display === 'none';

        return isHidden ? null : button;
    }

    /**
     * Checks if we're currently on the Leads tab
     * @returns {boolean}
     */
    function isOnLeadsTab() {
        // Look for the active Leads tab indicator
        const leadsTab = document.querySelector(CONFIG.LEADS_TAB_SELECTOR + '.active');
        return leadsTab !== null;
    }

    /**
     * Checks if we're currently on the Dispos tab
     * @returns {boolean}
     */
    function isOnDisposTab() {
        const disposTab = document.querySelector(CONFIG.DISPOS_TAB_SELECTOR + '.active');
        // Also check if the quick dispos panel is visible
        const quickDispoMain = document.querySelector('#quick_dispo_main');
        const isVisible = quickDispoMain && !quickDispoMain.classList.contains('ng-hide');
        return disposTab !== null || isVisible;
    }

    /**
     * Checks if the "Saving..." indicator is visible (disposition in progress)
     * @returns {boolean}
     */
    function isSavingDisposition() {
        const savingDiv = document.querySelector(CONFIG.SAVING_INDICATOR_SELECTOR);
        if (!savingDiv) return false;
        return !savingDiv.classList.contains('ng-hide');
    }

    /**
     * Gets the current tab state
     * @returns {string} 'dispos', 'leads', or 'other'
     */
    function getCurrentTabState() {
        if (isOnDisposTab()) return 'dispos';
        if (isOnLeadsTab()) return 'leads';
        return 'other';
    }

    // ===========================================
    // CORE FUNCTIONALITY
    // ===========================================

    /**
     * Attempts to click the Create Lead button with safety checks
     */
    function clickCreateLeadButton() {
        // Check if extension is enabled
        if (!state.enabled) {
            log('Extension disabled, skipping auto-click');
            return;
        }

        // Check cooldown period
        const now = Date.now();
        if (now - state.lastClickTime < CONFIG.COOLDOWN_MS) {
            log('Cooldown active, skipping auto-click');
            return;
        }

        // Get the visible button
        const button = getVisibleCreateLeadButton();
        if (!button) {
            log('Create Lead button not visible, skipping');
            return;
        }

        // Perform the click
        log('Auto-clicking Create Lead button');
        state.lastClickTime = now;
        state.dispositionInProgress = false;

        // Simulate a natural click
        button.click();

        // Notify background script for badge update
        sendMessage({ 
            action: 'buttonClicked',
            timestamp: now
        });

        // Visual feedback - briefly highlight the button
        const originalBackground = button.style.backgroundColor;
        button.style.backgroundColor = '#00ff00';
        setTimeout(() => {
            button.style.backgroundColor = originalBackground;
        }, 200);
    }

    /**
     * Schedules a click after the configured delay
     */
    function scheduleClick() {
        // Clear any pending click
        if (state.pendingClick) {
            clearTimeout(state.pendingClick);
        }

        log(`Scheduling click in ${CONFIG.CLICK_DELAY_MS}ms`);
        
        state.pendingClick = setTimeout(() => {
            state.pendingClick = null;
            clickCreateLeadButton();
        }, CONFIG.CLICK_DELAY_MS);
    }

    /**
     * Handles detection of tab change from Dispos to Leads
     */
    function onTabChangeToLeads() {
        // Only proceed if a disposition was in progress
        if (!state.dispositionInProgress) {
            log('Tab changed to Leads but no disposition in progress, skipping');
            return;
        }

        log('Tab changed from Dispos to Leads after disposition');
        
        // Check if Create Lead button is visible
        const button = getVisibleCreateLeadButton();
        if (button) {
            log('Create Lead button is visible, scheduling click');
            scheduleClick();
        } else {
            log('Create Lead button not found, will watch for it');
            // Set up a short polling to catch the button
            watchForCreateLeadButton();
        }
    }

    /**
     * Watches for the Create Lead button to appear (short polling fallback)
     */
    function watchForCreateLeadButton() {
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds max
        
        const checkInterval = setInterval(() => {
            attempts++;
            const button = getVisibleCreateLeadButton();
            
            if (button) {
                clearInterval(checkInterval);
                log('Create Lead button found after ' + attempts + ' attempts');
                scheduleClick();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                log('Create Lead button not found after max attempts');
                state.dispositionInProgress = false;
            }
        }, 100);
    }

    // ===========================================
    // MUTATION OBSERVER SETUP
    // ===========================================

    /**
     * Creates and starts the MutationObserver to watch for DOM changes
     * Primary focus: detecting tab changes and disposition completion
     */
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            // Check current tab state
            const currentTab = getCurrentTabState();
            
            // Detect tab transition: Dispos → Leads
            if (state.lastTabState === 'dispos' && currentTab === 'leads') {
                log('Detected tab change: Dispos → Leads');
                if (state.dispositionInProgress) {
                    onTabChangeToLeads();
                }
            }
            
            // Update last known tab state
            if (currentTab !== state.lastTabState) {
                log('Tab state changed:', state.lastTabState, '→', currentTab);
                state.lastTabState = currentTab;
            }

            // Also watch for the Create Lead button becoming visible directly
            for (const mutation of mutations) {
                // Check for class changes on tabs or the Create Lead button
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'class') {
                    
                    const target = mutation.target;
                    
                    // Check if Leads tab became active
                    if (target.matches && target.matches(CONFIG.LEADS_TAB_SELECTOR)) {
                        if (target.classList.contains('active') && state.dispositionInProgress) {
                            log('Leads tab became active');
                            setTimeout(() => {
                                const button = getVisibleCreateLeadButton();
                                if (button) {
                                    scheduleClick();
                                }
                            }, 100);
                        }
                    }
                    
                    // Check if this is the Create Lead button becoming visible
                    if (target.matches && target.matches(CONFIG.CREATE_LEAD_SELECTOR)) {
                        const wasHidden = mutation.oldValue && mutation.oldValue.includes('ng-hide');
                        const isNowVisible = !target.classList.contains('ng-hide');
                        
                        if (wasHidden && isNowVisible && state.dispositionInProgress) {
                            log('Create Lead button became visible (class change)');
                            scheduleClick();
                        }
                    }
                    
                    // Check if "Saving..." indicator appeared (disposition started server-side)
                    if (target.id === 'quick_dispo_save') {
                        if (!target.classList.contains('ng-hide')) {
                            log('Saving indicator appeared - disposition processing');
                        }
                    }
                }
            }
        });

        // Observe the entire document for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style'],
            attributeOldValue: true
        });

        log('MutationObserver started');
        return observer;
    }

    // ===========================================
    // DISPOSITION BUTTON TRACKING
    // ===========================================

    /**
     * Sets up click listeners on disposition buttons to track when dispo starts
     */
    function setupDispositionTracking() {
        // Use event delegation for dynamically loaded buttons
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Check if clicked element is a disposition button or inside one
            const dispoButton = target.closest(CONFIG.DISPO_BUTTON_SELECTOR);
            
            if (dispoButton) {
                const dispoText = dispoButton.textContent.trim();
                log('Disposition button clicked:', dispoText);
                
                // Mark disposition as in progress
                state.dispositionInProgress = true;
                
                // Record that we're on Dispos tab (ensures proper state tracking)
                state.lastTabState = 'dispos';
                
                // Notify background script
                sendMessage({
                    action: 'dispositionStarted',
                    disposition: dispoText
                });
                
                // Also start watching for the tab change immediately
                log('Watching for tab change to Leads...');
            }
        }, true); // Use capture phase to catch before Angular handles it

        log('Disposition tracking initialized');
    }

    // ===========================================
    // CHROME EXTENSION MESSAGING
    // ===========================================

    /**
     * Sets up message listener for communication with popup/background
     */
    function setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            log('Received message:', message);

            switch (message.action) {
                case 'getStatus':
                    sendResponse({
                        enabled: state.enabled,
                        dispositionInProgress: state.dispositionInProgress,
                        lastClickTime: state.lastClickTime
                    });
                    break;

                case 'setEnabled':
                    state.enabled = message.enabled;
                    log(`Extension ${state.enabled ? 'enabled' : 'disabled'}`);
                    sendResponse({ success: true });
                    break;

                case 'manualClick':
                    // Allow manual trigger from popup
                    state.dispositionInProgress = true;
                    clickCreateLeadButton();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }

            return true; // Keep channel open for async response
        });

        log('Message listener initialized');
    }

    /**
     * Loads saved settings from Chrome storage
     */
    function loadSettings() {
        chrome.storage.sync.get(['enabled'], (result) => {
            if (result.enabled !== undefined) {
                state.enabled = result.enabled;
            }
            log('Settings loaded:', { enabled: state.enabled });
        });
    }

    // ===========================================
    // INITIALIZATION
    // ===========================================

    /**
     * Main initialization function
     */
    function init() {
        log('Initializing Convoso Auto Create Lead extension');

        // Load saved settings
        loadSettings();

        // Set initial tab state
        state.lastTabState = getCurrentTabState();
        log('Initial tab state:', state.lastTabState);

        // Set up all listeners and observers
        setupMessageListener();
        setupDispositionTracking();
        setupObserver();

        // Check if we're already on Dispos tab (agent might be mid-workflow)
        if (state.lastTabState === 'dispos') {
            log('Currently on Dispos tab - ready to track disposition');
        }

        // Check if button is already visible on page load
        setTimeout(() => {
            const button = getVisibleCreateLeadButton();
            if (button) {
                log('Create Lead button already visible on page load');
            }
        }, 1000);

        log('Initialization complete');
        
        // Notify background that content script is ready
        sendMessage({ action: 'contentScriptReady' });
    }

    // Start the extension when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
