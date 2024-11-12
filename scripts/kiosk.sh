#!/bin/bash

# Required packages installation commented out - uncomment if needed
# sudo apt install -y xorg firefox openbox x11-xserver-utils xdotool unclutter procps ncurses-bin xinit

# Source the logger
source "$(dirname "${BASH_SOURCE[0]}")/project-utils.sh"

cleanup() {
    log_info "Performing cleanup..."
    
    # Kill processes
    pkill -f firefox
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

create_firefox_profile() {
    log_info "Creating fresh Firefox profile..."
    rm -rf "$PROFILE_PATH"
    mkdir -p "$PROFILE_PATH"

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
    log_info "Launching Firefox ..."

    DISPLAY=$DISPLAY_NUM firefox --kiosk --no-remote --profile "$PROFILE_PATH" "$TARGET_URL" &
    
    # Wait for Firefox process to start
    local max_attempts=10
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if pgrep -x "firefox" > /dev/null; then
            log_info "Firefox process started"
            sleep 2  # Give Firefox time to create window
            if xdotool search --onlyvisible --class "Firefox" >/dev/null 2>&1; then
                log_info "Firefox window detected"
                return 0
            else
                log_info "Firefox process running but window not detected"
                return 0
            fi
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_error "Failed to start Firefox after $max_attempts attempts"
    return 1
}

disable_mouse_cursor() {
    log_info "Disabling mouse cursor..."
    DISPLAY=$DISPLAY_NUM unclutter -idle 0 -root &
}

main() {
    # Get directory where script is located
    SCRIPT_DIR="$(get_script_dir)"

    TARGET_URL="https://www.google.com" 
    PROFILE_NAME="kiosk.default"
    PROFILE_PATH="$HOME/.mozilla/firefox/$PROFILE_NAME"
    DISPLAY_NUM=":0"

    clear
    # Initialize logging
    init_project_logging "kiosk"

    cleanup

    # Run network manager and capture status
    "$SCRIPT_DIR/network-manager.sh"
    network_status=$?

    if [ $network_status -ne 0 ]; then
        log_error "Network setup failed with status $network_status"
        exit 1
    fi

    log_info "Network setup completed successfully"
    log_info "Starting kiosk mode..."

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