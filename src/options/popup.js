/**
 * Popup Script - Handles user interactions in the extension popup
 */

document.addEventListener('DOMContentLoaded', function () {
  loadStatus();
  setupEventListeners();
});

/**
 * Load and display the current extension status
 */
function loadStatus() {
  chrome.storage.sync.get(['enabled', 'lastLeadId'], function (items) {
    const enableToggle = document.getElementById('enableToggle');
    const statusIndicator = document.getElementById('statusIndicator');

    if (items.enabled) {
      enableToggle.classList.add('enabled');
      statusIndicator.classList.remove('disabled');
    } else {
      enableToggle.classList.remove('enabled');
      statusIndicator.classList.add('disabled');
    }

    if (items.lastLeadId) {
      document.getElementById('lastLeadId').textContent = items.lastLeadId;
    }
  });
}

/**
 * Setup event listeners for popup controls
 */
function setupEventListeners() {
  const enableToggle = document.getElementById('enableToggle');
  const openOptions = document.getElementById('openOptions');
  const openDocs = document.getElementById('openDocs');

  enableToggle.addEventListener('click', function () {
    chrome.storage.sync.get(['enabled'], function (items) {
      const newState = !items.enabled;
      chrome.storage.sync.set({ enabled: newState }, function () {
        loadStatus();
        // Notify content scripts of the change
        chrome.tabs.query({}, function (tabs) {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'toggleEnabled',
              enabled: newState
            }).catch(() => {
              // Ignore errors for tabs where content script isn't loaded
            });
          });
        });
      });
    });
  });

  openOptions.addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
  });

  openDocs.addEventListener('click', function () {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/help.html')
    });
  });
}
