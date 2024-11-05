#!/bin/bash

# Required packages installation commented out - uncomment if needed
# sudo apt install -y xorg firefox-esr openbox x11-xserver-utils

# Create Firefox preferences directory if it doesn't exist
mkdir -p ~/.mozilla/firefox/kiosk.default

# Create a Firefox profile with specific settings
cat > ~/.mozilla/firefox/kiosk.default/prefs.js << EOF
user_pref("browser.rights.3.shown", true);
user_pref("browser.startup.homepage", "http://shape-z.de:5173/");
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.sessionstore.enabled", false);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.tabs.warnOnClose", false);
user_pref("browser.startup.page", 1);
user_pref("browser.startup.homepage_override.mstone", "ignore");
EOF

# Get directory where script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/kiosk.log"

# Create timestamp function
timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log to both terminal and file
log_message() {
    echo "$(timestamp) $1" | tee -a "$LOG_FILE"
}

# Start X server with Openbox on virtual terminal 1
log_message "Starting X server with Openbox..."
startx /usr/bin/openbox-session -- vt1 2>&1 | tee -a "$LOG_FILE" &

# Wait for X server to start
log_message "Waiting for X server..."
sleep 3

# Launch Firefox in kiosk mode with the custom profile
log_message "Launching Firefox in kiosk mode..."
DISPLAY=:0 firefox --kiosk --profile ~/.mozilla/firefox/kiosk.default http://shape-z.de:5173/ 2>&1 | tee -a "$LOG_FILE"

log_message "Kiosk startup complete"