# Raspberry Pi Slide-Show

## Table of Contents

1. [Introduction](#introduction)
2. [Setting up Google Cloud Project](#setting-up-google-cloud-project)
3. [Prerequisites and Packages Installation](#prerequisites-and-packages-installation)
4. [Project Setup](#project-setup)
5. [Meta-Data-Editor](#metadataeditor)
6. [Allowed File Formats](#allowed-file-formats)
7. [Allowed Date Formats for Google Drive](#allowed-date-formats-for-google-drive)
8. [Auto-start Configuration](#auto-start-configuration)

## Introduction

Welcome to the TerminalSlideShow repository. This project is a lightweight, non-GUI slideshow that fetches new files from Google Drive, allowing you to update the slideshow remotely. 
This README provides instructions for setting up the project using Python, installing necessary requirements, configuring a Google Cloud project, and setting up auto-start functionality.

### Structure:

```
// Project structure
digital-signage/
  ├── src/
  │   ├── core/                     # Core functionality
  │   │   ├── MediaManager.js       # Media handling & processing
  │   │   ├── ScheduleManager.js    # Scheduling & timing
  │   │   └── GoogleDriveSync.js    # Google Drive integration
  │   │
  │   ├── display/                  # Display adapters
  │   │   ├── TerminalDisplay.js    # Terminal-based display
  │   │   ├── BrowserDisplay.js     # Browser-based display
  │   │   └── DisplayFactory.js     # Display mode selection
  │   │
  │   ├── utils/                    # Utility functions
  │   │   ├── dateParser.js         # Date format parsing
  │   │   ├── fileUtils.js          # File operations
  │   │   └── logger.js             # Logging functionality
  │   │
  │   ├── config/                   # Configuration
  │   │   ├── default.js            # Default settings
  │   │   └── schema.js             # Config validation
  │   │
  │   ├── web/                      # Web server (optional)
  │   │   ├── server.js             # Express server
  │   │   └── routes.js             # API routes
  │   │
  │   └── index.js                  # Main entry point
  │
  ├── public/                       # Web assets
  │   ├── index.html
  │   └── styles.css
  │
  ├── scripts/                      # Installation scripts
  │   ├── install.js               # Main installer
  │   └── platform-detect.js       # Platform detection
  │
  └── package.json
```

## Setting up Google Cloud Project

Follow these steps to set up the Google Cloud project and obtain necessary credentials:

1. Create a new project on [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to "Service Accounts" on the left navbar and create a new service account with drive permissions.
3. Add a key in JSON format for the service account.
4. Use the email to grant permission to the target folder.

## Prerequisites and Packages Installation
XXXX

#### Easy-Way-Install
xxxx

#### Update
xxxx

#### Manual-Way-Install:
xxxx

## Project-Setup
xxxx

