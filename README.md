## Huge thank you to both Onur Menal the original developer and Oğuzhan Can whose fork I used as my base. Updated Node packages, all new theme for the UI, bunch of new features. 

## This extension was originally created by Onur Menal. I updated the Node.js packages to their latest versions to ensure compatibility with modern environments.

  
# CRM Power Pane

[![Build Status](https://dev.azure.com/powerpane/Dynamics%20365%20Power%20Pane/_apis/build/status/crm-power-pane-ci)](https://dev.azure.com/powerpane/Dynamics%20365%20Power%20Pane/_build/latest?definitionId=1)

[![Gitter](https://badges.gitter.im/power-pane/community.svg)](https://gitter.im/power-pane/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

  
  

The CRM Power Pane is a helper tool designed to integrate with Microsoft Dynamics 365 application and allow you to manipulate forms or perform actions faster throughout the Microsoft Dynamics 365 application.

  

*Disclaimer: This is as unsupported as it gets.*

  

## Usage

Click the CRM Power Pane icon next to the Microsoft Dynamics 365 logo, and select your action.

  

![CRM Power Pane Usage](./docs/assets/usage.png)

  

## Install

  

### Coming soon - links to chrome webstore listing  

## Build and Run

  

To build the repository, you need to have Node.js and `npm` installed.

  

1. Clone the repository

2. Run `npm install` to install the dependencies

3. Run `npm run build-chrome` to build for Google Chrome.

4. Run `npm run build-firefox` to build for Mozilla Firefox.

5. Run `npm run build-edge` to build for Microsoft Edge (experimental).

6. Alternatively, run `npm run build-all` to build for all three browsers. This script executes the former three scripts sequentially, provided as a shorthand.

  

The extensions will be built under `./dist/chrome/`, `./dist/firefox/` and `./dist/edge/` directories respectively.

  

## Contribute

  

All contributions are welcome. Please take a look at the [contributing guidelines](./.github/CONTRIBUTING.md) and [code of conduct](./.github/CODE_OF_CONDUCT.md) for more information.