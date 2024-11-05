#!/bin/bash

# Required packages installation commented out - uncomment if needed
# sudo apt install -y xorg firefox-esr openbox x11-xserver-utils xdotool

# Get directory where script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/kiosk.log"
TARGET_URL="http://shape-z.de:5173/"
PROFILE_NAME="kiosk.default"
PROFILE_PATH="$HOME/.mozilla/firefox/$PROFILE_NAME"

mkdir -p "$LOG_DIR"

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# Function to log to both terminal and file
log_message() {
    echo "$(timestamp) $1" | tee -a "$LOG_FILE"
}

cleanup() {
    log_message "Cleaning up processes..."
    killall firefox firefox-esr 2>/dev/null
    killall openbox 2>/dev/null
    killall Xorg 2>/dev/null
    reset_terminal
}

reset_terminal() {
    tput cnorm  # Make cursor visible
    tput sgr0   # Reset all terminal attributes
    tput rmcup  # Restore screen contents
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Create fresh Firefox profile
create_firefox_profile() {
    log_message "Creating fresh Firefox profile..."
    rm -rf "$PROFILE_PATH"
    mkdir -p "$PROFILE_PATH"

    # Create a Firefox profile with specific settings
    cat > "$PROFILE_PATH/prefs.js" << EOF
user_pref("browser.rights.3.shown", true);
user_pref("browser.startup.homepage", "$TARGET_URL");
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.sessionstore.enabled", false);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.tabs.warnOnClose", false);
user_pref("browser.startup.page", 1);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("browser.sessionstore.max_resumed_crashes", 0);
user_pref("browser.sessionstore.max_tabs_undo", 0);
user_pref("browser.sessionstore.max_windows_undo", 0);
user_pref("browser.cache.disk.enable", false);
user_pref("browser.cache.memory.enable", true);
user_pref("browser.cache.memory.capacity", 524288);
user_pref("browser.privatebrowsing.autostart", true);
user_pref("browser.startup.homepage_override.enabled", false);
EOF

    # Create user.js for persistent settings
    cp "$PROFILE_PATH/prefs.js" "$PROFILE_PATH/user.js"
}

# Disable mouse cursor
disable_mouse_cursor() {
    log_message "Attempting to disable mouse cursor..."
    sleep 2  # Wait for Firefox window
    window_id=$(xdotool search --onlyvisible --class "Firefox" | head -1)
    if [ -n "$window_id" ]; then
        xdotool windowfocus $window_id
        # Try multiple methods to hide cursor
        unclutter -idle 0 -root &
        xinput list --name-only | grep -i mouse | while read device; do
            xinput set-prop "$device" "Device Enabled" 0 2>/dev/null
        done
    else
        log_message "Warning: Firefox window not found for cursor disable"
    fi
}

# Start X server with Openbox
start_x_server() {
    log_message "Starting X server..."
    startx /usr/bin/openbox-session -- :0 &
    sleep 5  # Wait for X server to be ready
}

# Launch Firefox
launch_firefox() {
    log_message "Launching Firefox..."
    DISPLAY=:0 firefox --kiosk --no-remote --profile "$PROFILE_PATH" "$TARGET_URL" &
    
    # Wait for Firefox to actually start
    while ! pgrep -x "firefox" > /dev/null; do
        sleep 1
    done
    
    # Additional wait to ensure window is created
    sleep 3
    
    # Verify Firefox is running and showing correct URL
    window_id=$(xdotool search --onlyvisible --class "Firefox" | head -1)
    if [ -n "$window_id" ]; then
        log_message "Firefox window found with ID: $window_id"
        disable_mouse_cursor
    else
        log_message "Error: Firefox window not found after launch"
        cleanup
        exit 1
    fi
}

main() {
    cleanup
    create_firefox_profile
    start_x_server
    launch_firefox
    
    # Keep script running and monitor Firefox
    while true; do
        if ! pgrep -x "firefox" > /dev/null; then
            log_message "Firefox process died, restarting..."
            launch_firefox
        fi
        sleep 5
    done
}

main