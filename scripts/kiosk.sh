#!/bin/bash
#
# Kiosk Mode Manager
# Manages a fullscreen Firefox browser in kiosk mode with automatic recovery
# Features X server management, Firefox profile configuration, and process monitoring
#
# Author: Muddyblack
# Date: 11.11.2024
# Version: 1.0

# -----------------------------------------------------------------------------
# Dependencies and initialization
# -----------------------------------------------------------------------------

source "$(dirname "${BASH_SOURCE[0]}")/project-utils.sh" || {
    echo "Failed to source project-utils.sh" >&2
    exit 1
}

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Environment variables with defaults
readonly TARGET_URL="${TARGET_URL:-https://www.google.com}"
readonly PROFILE_NAME="${PROFILE_NAME:-kiosk.default}"
readonly DISPLAY_NUM="${DISPLAY_NUM:-:0}"
readonly PROFILE_PATH="${PROFILE_PATH:-$HOME/.mozilla/firefox/${PROFILE_NAME}}"



# -----------------------------------------------------------------------------
# Firefox profile management
# -----------------------------------------------------------------------------

# Create fresh Firefox profile with kiosk-mode settings
# Detects pi by custom user agent
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
user_pref("general.useragent.override", "Mozilla/5.0 (TERMINAL-SLIDE-SHOW) Gecko/20100101 Firefox/123.0");
EOF

    cp "$PROFILE_PATH/prefs.js" "$PROFILE_PATH/user.js"
}

# -----------------------------------------------------------------------------
# Window manager configuration
# -----------------------------------------------------------------------------

# Set up minimal Openbox configuration for kiosk mode
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

# -----------------------------------------------------------------------------
# Display server management
# -----------------------------------------------------------------------------

# Start X server with retry logic
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

# -----------------------------------------------------------------------------
# Browser management
# -----------------------------------------------------------------------------

# Launch Firefox in kiosk mode with monitoring
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

# Hide mouse cursor for kiosk mode
disable_mouse_cursor() {
    log_info "Disabling mouse cursor..."
    DISPLAY=$DISPLAY_NUM unclutter -idle 0 -root &
}

# -----------------------------------------------------------------------------
# Cleanup and reset functions
# -----------------------------------------------------------------------------

# Reset terminal to normal state
reset_terminal() {
    tput cnorm
    tput sgr0
    tput rmcup
}

cleanup() {
    log_info "Performing cleanup..."
    
    # Use || true to prevent failures in strict mode
    pkill -f firefox || true
    pkill -f openbox || true
    pkill -f unclutter || true
    
    # Clean up X server locks
    for lock in /tmp/.X${DISPLAY_NUM#:}-lock /tmp/.X11-unix/X${DISPLAY_NUM#:}; do
        [ -e "$lock" ] && rm -f "$lock" || true
    done
    
    pkill Xorg || true
    reset_terminal || true
    sleep 2
}

# -----------------------------------------------------------------------------
# Main execution
# -----------------------------------------------------------------------------

main() {
    local network_status=0

    # Set up signal handlers
    setup_signal_traps cleanup

    clear
    init_project_logging "kiosk"
    cleanup

    # Run network manager and capture status
    if ! "$(get_script_dir)/network-manager.sh"; then
        log_error "Network setup failed"
        exit 1
    fi

    log_info "Starting kiosk mode..."

    create_firefox_profile
    setup_openbox
    
    start_x_server || {
        log_error "Failed to start X server"
        exit 1
    }
    
    sleep 3  # Give X server time to stabilize
    
    disable_mouse_cursor
    
    launch_firefox || {
        log_error "Failed to launch Firefox"
        cleanup
        exit 1
    }
    
    # Monitor and restart if needed
    while true; do
        if ! pgrep -x "firefox" > /dev/null; then
            log_warn "Firefox process died, restarting..."
            launch_firefox || {
                log_error "Firefox restart failed"
                cleanup
                exit 1
            }
        fi
        sleep 5
    done
}

[ "${BASH_SOURCE[0]}" = "$0" ] && main "$@"