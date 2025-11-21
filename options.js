/**
 * Options Page Script - Handles settings management
 */

const DEFAULT_CONFIG = {
  dispoScreenSelector: 'div.results_div',
  leadFieldSelector: 'li.active a[href*="/lead_info/"]',
  newLeadButtonSelector: 'button[ng-click*="createLead"]',
  leadIdDelayMs: 2000,
  domSettleDelayMs: 50
};

document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  setupEventListeners();
});

/**
 * Load settings from chrome.storage and populate the form
 */
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_CONFIG, function(items) {
    document.getElementById('dispoScreenSelector').value = items.dispoScreenSelector || '';
    document.getElementById('leadFieldSelector').value = items.leadFieldSelector || '';
    document.getElementById('newLeadButtonSelector').value = items.newLeadButtonSelector || '';
    document.getElementById('domSettleDelayMs').value = items.domSettleDelayMs || '';
    document.getElementById('leadIdDelayMs').value = items.leadIdDelayMs || '';
  });
}

/**
 * Setup event listeners for the form
 */
function setupEventListeners() {
  const form = document.getElementById('settingsForm');
  const resetButton = document.getElementById('resetButton');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    saveSettings();
  });
  
  resetButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
      chrome.storage.sync.set(DEFAULT_CONFIG, function() {
        loadSettings();
        showAlert('Settings reset to defaults', 'success');
      });
    }
  });
}

/**
 * Save settings to chrome.storage
 */
function saveSettings() {
  const config = {
    dispoScreenSelector: document.getElementById('dispoScreenSelector').value,
    leadFieldSelector: document.getElementById('leadFieldSelector').value,
    newLeadButtonSelector: document.getElementById('newLeadButtonSelector').value,
    domSettleDelayMs: parseInt(document.getElementById('domSettleDelayMs').value) || 50,
    leadIdDelayMs: parseInt(document.getElementById('leadIdDelayMs').value) || 2000
  };
  
  // Validate inputs
  if (!config.dispoScreenSelector || !config.leadFieldSelector || !config.newLeadButtonSelector) {
    showAlert('Please fill in all CSS selector fields', 'error');
    return;
  }
  
  if (config.domSettleDelayMs < 0 || config.leadIdDelayMs < 100) {
    showAlert('Please check your timing values. DOM Settle Delay should be >= 0, Lead ID Check Delay should be >= 100', 'error');
    return;
  }
  
  chrome.storage.sync.set(config, function() {
    console.log('Settings saved:', config);
    showAlert('Settings saved successfully!', 'success');
    
    // Notify all tabs of the configuration change
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateConfig',
          config: config
        }).catch(() => {
          // Ignore errors for tabs where content script isn't loaded
        });
      });
    });
  });
}

/**
 * Display an alert message
 */
function showAlert(message, type) {
  const alertElement = document.getElementById('alert');
  alertElement.textContent = message;
  alertElement.className = 'alert ' + type;
  
  if (type === 'success') {
    setTimeout(function() {
      alertElement.className = 'alert';
    }, 3000);
  }
}
