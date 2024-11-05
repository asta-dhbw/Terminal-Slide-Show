#!/bin/bash

# Required packages installation commented out - uncomment if needed
# sudo apt install -y xorg firefox-esr openbox x11-xserver-utils

# Get directory where script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/kiosk.log"
mkdir -p "$LOG_DIR"

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# Function to log to both terminal and file
log_message() {
    echo "$(timestamp) $1" | tee -a "$LOG_FILE"
}

# Kill any existing Firefox processes
log_message "Cleaning up any existing Firefox processes..."
killall firefox firefox-esr 2>/dev/null


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
# Disable mouse cursor by hiding it
disable_mouse_cursor() {
    xdotool search --onlyvisible --name "Mozilla Firefox" windowfocus
    xinput set-prop "pointer:X Axis Mapping" 0  # Adjust this if specific device ID
}


# Start X server with Openbox 
startx /usr/bin/openbox-session 2>&1 | tee -a "$LOG_FILE" &

# Wait for X server to start
sleep 5

# Launch Firefox in kiosk mode with the custom profile
DISPLAY=:0 firefox --kiosk --profile ~/.mozilla/firefox/kiosk.default  # http://shape-z.de:5173/

# Hide mouse cursor
disable_mouse_cursor

log_message "Kiosk startup complete on display :$DISPLAY_NUM"