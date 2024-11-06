#!/bin/bash

# Source the logger
source "$(dirname "${BASH_SOURCE[0]}")/logger.sh"


# Required packages installation commented out - uncomment if needed
# sudo apt install -y xorg firefox-esr openbox x11-xserver-utils xdotool unclutter procps ncurses-bin xinit

# Get directory where script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/kiosk.log"
TARGET_URL="http://shape-z.de:5173/"
PROFILE_NAME="kiosk.default"
PROFILE_PATH="$HOME/.mozilla/firefox/$PROFILE_NAME"
DISPLAY_NUM=":0"

# Initialize logging with custom settings
init_logging "$LOG_DIR" "$LOG_FILE" "DEBUG"

cleanup() {
    log_info "Performing cleanup..."
    
    # Kill processes
    pkill -f firefox-esr
    pkill -f openbox
    pkill -f unclutter
    
    # Clean up X server
    for lock in /tmp/.X${DISPLAY_NUM#:}-lock /tmp/.X11-unix/X${DISPLAY_NUM#:}; do
        if [ -e "$lock" ]; then
            log_info "Removing X lock file: $lock"
            rm -f "$lock" # sudo rm -f "$lock"
        fi
    done
    
    # Kill any remaining X server
    pkill Xorg # sudo pkill Xorg
    
    reset_terminal
    
    # Wait for processes to fully terminate
    sleep 2
}

reset_terminal() {
    tput cnorm
    tput sgr0
    tput rmcup
}

trap cleanup SIGINT SIGTERM EXIT

create_firefox_profile() {
    log_info "Creating fresh Firefox profile..."
    rm -rf "$PROFILE_PATH"
    mkdir -p "$PROFILE_PATH"

    cat > "$PROFILE_PATH/prefs.js" << EOF
user_pref("browser.startup.homepage", "$TARGET_URL");
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.sessionstore.enabled", false);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.sessionstore.", 0);
user_pref("browser.startup.page", 1);
user_pref("browser.cache.disk.enable", false);
user_pref("browser.cache.memory.enable", true);
user_pref("browser.cache.memory.capacity", 524288);
user_pref("browser.rights.3.shown", true);
user_pref("browser.startup.homepage_override.enabled", false);
user_pref("browser.download.enabled", false);
user_pref("browser.contentblocking.category", "strict");
user_pref("dom.event.contextmenu.enabled", false);
user_pref("browser.urlbar.enabled", false);
user_pref("browser.link.open_newwindow.restriction", 0);
user_pref("browser.link.open_newwindow", 1);
user_pref("xpinstall.enabled", false);
user_pref("extensions.enable", false);
user_pref("browser.fullscreen.autohide", false);
user_pref("full-screen-api.enabled", true);
user_pref("full-screen-api.warning.enabled", false);
user_pref("full-screen-api.warning.timeout", 0);
user_pref("browser.tabs.createFileDropIndicator", false);
user_pref("browser.tabs.closeWindowWithLastTab", false);
user_pref("browser.keywordList.enabled", false);
user_pref("dom.disable_window_move_resize", true);
user_pref("dom.disable_window_flip", true);
user_pref("dom.disable_window_open_feature.location", true);
user_pref("dom.disable_window_open_feature.menubar", true);
user_pref("dom.disable_window_open_feature.toolbar", true);
user_pref("dom.disable_window_print", true);
user_pref("dom.disable_window_status", true);
user_pref("dom.allow_scripts_to_close_windows", false);
user_pref("security.fileuri.strict_origin_policy", true);
user_pref("ui.key.menuAccessKeyFocuses", false);
user_pref("browser.casting.enabled", false);
EOF

    cp "$PROFILE_PATH/prefs.js" "$PROFILE_PATH/user.js"
}

setup_openbox() {
    log_info "Setting up Openbox configuration..."
    mkdir -p "$HOME/.config/openbox"
    
    # Create minimal Openbox config
    cat > "$HOME/.config/openbox/rc.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<openbox_config xmlns="http://openbox.org/3.4/rc">
  <applications>
    <application class="*">
      <decor>no</decor>
      <focus>yes</focus>
      <fullscreen>yes</fullscreen>
      <maximized>true</maximized>
    </application>
  </applications>
</openbox_config>
EOF
}

start_x_server() {
    log_info "Starting X server..."
    
    # Ensure no X server is running
    cleanup
    
    # Start X server with specific display
    xinit /usr/bin/openbox-session -- $DISPLAY_NUM vt1 -nolisten tcp &
    
    # Wait for X server to start
    local max_attempts=10
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if xdpyinfo -display $DISPLAY_NUM >/dev/null 2>&1; then
            log_info "X server started successfully on $DISPLAY_NUM"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_error "Failed to start X server after $max_attempts attempts"
    return 1
}

launch_firefox() {
    log_info "Launching Firefox ESR..."
    
    DISPLAY=$DISPLAY_NUM firefox-esr --kiosk --no-remote --profile "$PROFILE_PATH" "$TARGET_URL" &
    
    # Wait for Firefox to start
    local max_attempts=20
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if pgrep -x "firefox-esr" > /dev/null; then
            log_info "Firefox ESR process started"
            sleep 2
            if xdotool search --onlyvisible --class "Firefox" >/dev/null 2>&1; then
                log_info "Firefox ESR window detected"
                return 0
            else
                log_info "Firefox ESR process running but window not detected"
                return 0
            fi
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_error "Failed to start Firefox ESR after $max_attempts attempts"
    return 1
}

disable_mouse_cursor() {
    log_info "Disabling mouse cursor..."
    DISPLAY=$DISPLAY_NUM unclutter -idle 0 -root &
}

main() {
    cleanup
    create_firefox_profile
    setup_openbox
    
    if ! start_x_server; then
        log_error "Failed to start X server. Exiting."
        exit 1
    fi
    
    sleep 3  # Give X server time to stabilize
    
    disable_mouse_cursor
    
    if ! launch_firefox; then
        log_error "Failed to launch Firefox. Exiting."
        cleanup
        exit 1
    fi
    
    # Monitor and restart if needed
    while true; do
        if ! pgrep -x "firefox" > /dev/null; then
            log_warn "Firefox process died, restarting..."
            launch_firefox || {
                log_error "Failed to restart Firefox. Cleaning up..."
                cleanup
                exit 1
            }
        fi
        sleep 5
    done
}

main