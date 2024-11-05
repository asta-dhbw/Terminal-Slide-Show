#!/bin/bash

# Required packages installation commented out - uncomment if needed
# sudo apt install -y xorg firefox-esr openbox x11-xserver-utils

# Function to reset terminal display properties
reset_terminal() {
    tput cnorm  # Make cursor visible
    tput sgr0   # Reset all terminal attributes
    tput rmcup  # Restore screen contents
}

# Set up trap for Ctrl+C
trap reset_terminal SIGINT

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

# Create Openbox autostart file
mkdir -p ~/.config/openbox
cat > ~/.config/openbox/autostart << EOF
# Wait a moment for the X server to be fully ready
sleep 2

# Start Firefox in kiosk mode
firefox --kiosk --profile ~/.mozilla/firefox/kiosk.default "http://shape-z.de:5173/" &
EOF

# Make autostart executable
chmod +x ~/.config/openbox/autostart

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

# Function to check if X is running
check_x_server() {
    for i in {1..10}; do
        if xdpyinfo >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    return 1
}

# Kill any existing Firefox processes
log_message "Cleaning up any existing Firefox processes..."
killall firefox firefox-esr 2>/dev/null

# Start X server with Openbox
log_message "Starting X server with Openbox..."
startx /usr/bin/openbox-session 2>&1 | tee -a "$LOG_FILE"

reset_terminal

log_message "Kiosk startup complete"