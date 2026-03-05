# Privacy Disclosure (Power Pane Returns)

## Summary

Power Pane Returns is a client-side browser extension for Dynamics 365/Dataverse pages. It does not include built-in analytics or telemetry collection.

## Data Processed

- In-page CRM data is accessed only to execute user-triggered actions in the current browser session.
- User settings are stored locally in browser extension storage.

## Local Storage Usage

- Storage API: `chrome.storage.local` / `browser.storage.local`
- Keys:
  - `powerPaneOptions`: stores action visibility preferences from the options UI.

## Data Sharing and Transmission

- No telemetry or analytics endpoint is used by the extension.
- No user preference data is transmitted to a vendor-controlled backend by this extension.

## User Controls

- Users can modify preferences through the options page.
- Users can clear extension data by removing/reinstalling the extension or clearing extension storage.
