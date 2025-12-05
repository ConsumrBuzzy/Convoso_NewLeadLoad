/**
 * Convoso Auto Create Lead - Popup Script
 * 
 * Handles popup UI interactions and communication with content script
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===========================================
    // DOM ELEMENTS
    // ===========================================
    const enableToggle = document.getElementById('enableToggle');
    const statusText = document.getElementById('statusText');
    const pageStatus = document.getElementById('pageStatus');
    const manualTrigger = document.getElementById('manualTrigger');

    // ===========================================
    // INITIALIZATION
    // ===========================================

    /**
     * Load saved settings and update UI
     */
    function loadSettings() {
        chrome.storage.sync.get(['enabled'], (result) => {
            const enabled = result.enabled !== false; // Default to true
            enableToggle.checked = enabled;
            updateStatusDisplay(enabled);
        });
    }

    /**
     * Check if current tab is a Convoso page
     */
    function checkCurrentPage() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            
            if (currentTab && currentTab.url) {
                const isConvoso = currentTab.url.includes('convoso.com');
                
                if (isConvoso) {
                    pageStatus.textContent = 'Convoso Detected';
                    pageStatus.className = 'status-value status-active';
                    manualTrigger.disabled = false;
                    
                    // Try to get status from content script
                    getContentScriptStatus(currentTab.id);
                } else {
                    pageStatus.textContent = 'Not on Convoso';
                    pageStatus.className = 'status-value status-warning';
                    manualTrigger.disabled = true;
                }
            } else {
                pageStatus.textContent = 'Unknown';
                pageStatus.className = 'status-value status-inactive';
                manualTrigger.disabled = true;
            }
        });
    }

    /**
     * Get status from content script
     */
    function getContentScriptStatus(tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'getStatus' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Content script not responding:', chrome.runtime.lastError);
                pageStatus.textContent = 'Reload page';
                pageStatus.className = 'status-value status-warning';
                return;
            }

            if (response) {
                console.log('Content script status:', response);
                // Could show additional status info here
            }
        });
    }

    /**
     * Update the status display based on enabled state
     */
    function updateStatusDisplay(enabled) {
        if (enabled) {
            statusText.textContent = 'Active';
            statusText.className = 'status-value status-active';
        } else {
            statusText.textContent = 'Disabled';
            statusText.className = 'status-value status-inactive';
        }
    }

    // ===========================================
    // EVENT HANDLERS
    // ===========================================

    /**
     * Handle toggle switch change
     */
    enableToggle.addEventListener('change', () => {
        const enabled = enableToggle.checked;
        
        // Save to storage
        chrome.storage.sync.set({ enabled: enabled });
        
        // Update UI
        updateStatusDisplay(enabled);
        
        // Notify background script
        chrome.runtime.sendMessage({
            action: 'setEnabled',
            enabled: enabled
        });

        // Notify content script on current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('convoso.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'setEnabled',
                    enabled: enabled
                }).catch(() => {
                    // Content script might not be loaded
                });
            }
        });

        showToast(enabled ? 'Auto-click enabled' : 'Auto-click disabled');
    });

    /**
     * Handle manual trigger button click
     */
    manualTrigger.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('convoso.com')) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'manualClick' }, (response) => {
                    if (chrome.runtime.lastError) {
                        showToast('Error: Reload the Convoso page');
                        return;
                    }
                    
                    if (response && response.success) {
                        showToast('Trigger sent!');
                    } else {
                        showToast('Button not found');
                    }
                });
            }
        });
    });

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================

    /**
     * Show a toast notification
     */
    function showToast(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);

        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // ===========================================
    // INITIALIZE
    // ===========================================
    loadSettings();
    checkCurrentPage();
});
