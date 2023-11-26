# Raspberry Pi Slide-Show

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Setting up Google Cloud Project](#setting-up-google-cloud-project)
4. [Fixing Display Power Issue](#fixing-display-power-issue)
5. [Auto-start Configuration](#auto-start-configuration)
6. [System Update and Package Installation](#system-update-and-package-installation)
7. [Restart System](#restart-system)

## Introduction

This README provides instructions for setting up a project using Python 3.9.2, installing necessary requirements, configuring a Google Cloud project, fixing display power issues, and setting up auto-start functionality.

## Prerequisites

- Python 3.9.2
- Install requirements using: `pip install -r requirements.txt`

## Setting up Google Cloud Project

Follow these steps to set up the Google Cloud project and obtain necessary credentials:

1. Create a new project on [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to "Service Accounts" on the left navbar and create a new service account with drive permissions.
3. Add a key in JSON format for the service account.
4. Use the email to grant permission to the target folder.

## Fixing Display Power Issue

To address the display power issue, refer to [this link](https://github.com/raspberrypi/firmware/issues/1224#issuecomment-).

## Auto-start Configuration

To configure auto-start:

- Open the rc.local file: `sudo nano /etc/rc.local`
- Add 'sudo reset' to an empty command line
- Go to the crontabs: `crontab -e`
- Add 'chmod' to set the script as always executable
- Add path to the script to crontab: `crontab -e`

## System Update and Package Installation

Execute the following commands:

```bash
# Update package information
sudo apt update

# Upgrade installed packages
sudo apt upgrade

# Install required packages: fbi and mpv
sudo apt install fbi mpv
```

## Restart System
```bash
sudo reboot now
```