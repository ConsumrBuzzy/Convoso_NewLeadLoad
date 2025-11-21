# Software Design Document (SDD): Contact Center Productivity Add-On

## 1. System Overview & Goals

### 1.1. Goal
The primary goal of the Contact Center Productivity Add-On Chrome Extension is to enhance agent efficiency by automating the transition to a new lead following the completion of a call disposition. This automation is designed to eliminate the manual step of clicking a "New Lead" button when the underlying CRM system fails to automatically load the next lead after the disposition process.

### 1.2. Target System and User
*   **Target User:** Contact Center Phone Agents.
*   **Environment:** Google Chrome browser, interacting with a proprietary or third-party CRM/Contact Management System via a web interface.
*   **Constraint:** The solution must be non-invasive to the underlying CRM page and rely entirely on client-side observation and interaction.

### 1.3. Core Functionality (The 3 Key Actions)
The extension will execute the following sequence of actions on the agent's main CRM interface:
1.  **Monitor/Detect Disposition Screen Closure:** Reliably detect the moment the disposition screen/modal/dialog is no longer visible on the Document Object Model (DOM).
2.  **Monitor/Detect Lead Field Change:** Watch a specific Lead Identification Field (e.g., Account ID, Lead Name) for a value change.
3.  **Execute "New Lead" Action:**
    *   If the Lead Field value **has changed** (indicating a new lead loaded automatically), the extension takes **no action**.
    *   If the Lead Field value has **NOT changed** after a 2-second delay, the extension programmatically clicks a specific "New Lead" button/link on the page.

## 2. Architecture (High-Level)

The extension will adhere to the **Manifest V3 (MV3)** architecture, utilizing a separation of concerns between the background process and the page-specific interaction logic.

| Component | Role | MV3 Implementation | Communication |
| :--- | :--- | :--- | :--- |
| **Content Script** | Interacts directly with the CRM's DOM. Responsible for observation (detecting screen closure, monitoring the lead field) and action (clicking the "New Lead" button). | Injected script (`content.js`) specified in the manifest. | Message passing to the Service Worker. |
| **Service Worker** | Handles background tasks, state management, and API calls (though minimal in this design). It is an event-driven, non-persistent script. | Background script (`service-worker.js`) specified in the manifest. | Message passing to the Content Script and access to Chrome APIs (e.g., `chrome.storage`). |
| **Chrome Storage API** | Stores configuration data, such as the CSS selectors for the Dispo Screen, Lead Field, and "New Lead" button, allowing for easy configuration and persistence. | `chrome.storage.sync` or `chrome.storage.local`. | Accessed by the Service Worker and potentially the Content Script via message passing. |

## 3. Data Structures & DOM Interaction

The core challenge is reliably identifying and interacting with the target elements. This requires robust selectors and a sophisticated observation mechanism.

### 3.1. Configuration Data Structure (Stored in `chrome.storage`)
The extension will store the critical selectors as configuration, making the extension adaptable to changes in the CRM's DOM structure without requiring a code update.

| Key | Type | Description | Example Selector |
| :--- | :--- | :--- | :--- |
| `dispoScreenSelector` | String | CSS selector for the disposition screen/modal element. (Requires manual identification) | `div.results_div` (or similar container that hides the content) |
| `leadFieldSelector` | String | CSS selector for the Lead Identification Field. (Targeting the `href` attribute of the lead tab link) | `li.active a[href*="/lead_info/"]` |
| `newLeadButtonSelector` | String | CSS selector for the "New Lead" button/link. (Targeting the specific `ng-click` attribute) | `button[ng-click*="createLead"]` |}],path:

### 3.2. DOM Interaction Strategy

#### 3.2.1. Detecting Disposition Screen Closure
*   **Mechanism:** **MutationObserver**
*   **Details:** The Content Script will initialize a `MutationObserver` targeting the parent container of the disposition screen (or the `<body>` if the screen is a top-level element). The observer will watch for changes in the `attributes` (e.g., `style="display: none;"` or `aria-hidden="true"`) or the `childList` (if the element is removed from the DOM).
*   **Detection Logic:** The closure is detected when the element matching `dispoScreenSelector` is either removed from the DOM or its visibility/display attribute changes to hidden/none.

#### 3.2.2. Monitoring Lead Field Change
*   **Mechanism:** **Polling with Initial Value Capture**
*   **Details:** Upon detecting the Dispo Screen closure, the Content Script will immediately read and store the current value of the element matching `leadFieldSelector`.
*   **Monitoring Logic:** A `setTimeout` of 2000ms (2 seconds) will be initiated. When the timeout expires, the script will read the current value of the lead field again.
    *   If `currentValue !== initialValue`, a new lead has loaded.
    *   If `currentValue === initialValue`, the lead has not changed, and the "New Lead" action is required.

#### 3.2.3. Executing "New Lead" Action
*   **Mechanism:** **Programmatic Click**
*   **Details:** The Content Script will locate the element matching `newLeadButtonSelector` and execute a native DOM click event using `element.click()`. This is the most reliable way to trigger the page's built-in event handlers.

## 4. Flowchart/Sequence Diagram

The following sequence diagram visualizes the three-step decision and action process executed by the Content Script.

![Core Functionality Sequence Diagram](https://private-us-east-1.manuscdn.com/sessionFile/v2ZdN0eSQkjzWMo1ugywji/sandbox/wmsViM50uLxmukJS0fwhc3-images_1763738415150_na1fn_L2hvbWUvdWJ1bnR1L3NkZF9mbG93Y2hhcnQ.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvdjJaZE4wZVNRa2p6V01vMXVneXdqaS9zYW5kYm94L3dtc1ZpTTUwdUx4bXVrSlMwZndoYzMtaW1hZ2VzXzE3NjM3Mzg0MTUxNTBfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzTmtaRjltYkc5M1kyaGhjblEucG5nIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Drj3ymriBkI96hmxG-Jlp2fYI77Xvhuiz2b7anz7m8GA56wqzpAMLXiD85~RQ-qYiPTzQtR8gNS1CmiThOlUKk9nS5bDaA571CahwWl2Z8xRZW5KyOjU4oRfLwYwUBnfEFfQx9366NfUbPkiYtsB-Y1OUFiSNnBCK5RXm6iQ8~zViXmXYncmVjHoHnwH8ivWDLsvvsj6oiEVV4qbkIechaUFcMoOhKB~StwfXqTg46ebQ75yg7tBDW1JtMphOmt32nrL5D8fny5V9ZSPy6sbRKRv--8Vu58Ko-9AFUsMmfqrZqLrNxFZSXHaU8H18qUPUPycUD7AjYVDTNmlUypFLg__)

## 5. Technical Challenges & Mitigation

| Challenge | Description | Mitigation Strategy |
| :--- | :--- | :--- |
| **Selector Brittleness** | The CRM's developers may change element IDs, classes, or DOM structure, breaking the hardcoded CSS selectors. | **Configuration and Redundancy:** Store selectors in `chrome.storage` for easy updates. **Mitigation:** The current selectors target Angular attributes (`ng-click`, `href*`) which are generally more stable than generated class names, reducing brittleness. Use multiple, redundant selectors (e.g., `[data-testid="lead-id-field"]` if available, or a combination of tag and attribute) and fall back to less specific ones if the primary fails. |}],path:
| **Race Conditions** | The extension's observation logic might execute before the CRM's page-load or post-disposition logic has fully completed, leading to false negatives (e.g., checking the lead field before the CRM has a chance to load the new lead). | **Delayed Polling and Initial Value Capture:** The 2-second delay in Step 3 is a crucial mitigation. Additionally, the initial value capture should be wrapped in a small `setTimeout` (e.g., 50ms) after the Dispo Screen closure is detected to ensure the DOM has settled. |
| **Cross-Origin Security** | The Content Script is limited to the host page's DOM and cannot directly access iframes from different origins (e.g., a disposition screen hosted on a separate domain). | **Host Permissions and Iframe Strategy:** Ensure the manifest includes host permissions for all relevant domains. If the Dispo Screen is in a cross-origin iframe, the extension cannot directly observe it. The mitigation is to target an element *outside* the iframe that is affected by the iframe's closure (e.g., an overlay or the iframe's container). |
| **Agent Input Interference** | The agent might manually interact with the page during the 2-second delay. | **Idempotency and Minimal Impact:** The action is idempotent (clicking "New Lead" multiple times is generally safe). The script should be designed to execute only once per disposition closure event. |

## 6. Security & Permissions

The extension requires specific permissions to perform its intended function while adhering to the principle of least privilege.

| Permission | Justification |
| :--- | :--- |
| `scripting` | Required to inject the Content Script into the target CRM page(s) and execute programmatic DOM manipulation (e.g., `element.click()`). |
| `storage` | Required to read and write the configuration data (CSS selectors) to `chrome.storage.sync` or `chrome.storage.local`. |
| `activeTab` (Optional) | Can be used as a less invasive alternative to broad host permissions if the extension is triggered by a user action (e.g., clicking the extension icon) on the active tab. However, for continuous monitoring, **Host Permissions** are preferred. |
| **Host Permissions** | Required to specify the exact URLs where the Content Script should be injected (e.g., `https://crm.example.com/*`). This limits the extension's scope to only the necessary pages. |

### 6.1. Manifest V3 Configuration Snippet

```json
{
  "manifest_version": 3,
  "name": "Contact Center Productivity Add-On",
  "version": "1.0",
  "permissions": [
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://*.crm-provider.com/*"
  ],
  "background": {
    "service_worker": "service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["https://*.crm-provider.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

## 7. References

This document is a design proposal based on established best practices for Chrome Extension development (Manifest V3) and standard web development techniques (DOM manipulation, MutationObserver). No external sources were directly cited in the final text, but the architecture and technical decisions are informed by the official Chrome Extension documentation.
