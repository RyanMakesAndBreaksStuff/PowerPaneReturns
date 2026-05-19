## MAJOR REFACTOR

Version 1.4.1 adds 8 additional theme choices. 4 light, 4 dark.

But wait! Somehow I found a way to pack even more goodness into this release! An entirely new UI that you can flip between in real time. 

Check commit notes for the boring stuff like adding testings and making user info requests async.

Power Pane Returns

Power Pane Returns is a browser extension for Microsoft Dynamics 365 that adds a quick-action pane to speed up common form and record workflows.

## Support Status

This is a community-maintained project and is not an official Microsoft product. It is provided as-is, without support guarantees.

## Privacy

Power Pane Returns stores extension preferences in browser extension storage. It does not include built-in telemetry or analytics.

For full disclosure details, see `docs/privacy.md`.

## Usage

1. Install the extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/power-pane-returns/npegkibkaodgpiboiilfodmhgafegiml).
2. Open Microsoft Dynamics 365 in Chrome.
3. Click the Power Pane Returns icon and choose an action from the pane.

## Local Build (Node.js 22.x)

1. Install Node.js `22.x`.
2. Install dependencies:
   - `npm ci`
3. Build extension outputs:
   - `npm run build-all`

Build artifacts are generated in:
- `dist/chrome`
- `dist/firefox`
- `dist/edge-chromium`

# Contribute

All contributions are welcome. Please take a look at the [contributing guidelines](./.github/CONTRIBUTING.md) and [code of conduct](./.github/CODE_OF_CONDUCT.md) for more information.
