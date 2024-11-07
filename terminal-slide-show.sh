#!/bin/bash

# Configuration Variables
SCRIPT_PATH="$(realpath "$(dirname "$0")")"
CONFIG_FILE="$SCRIPT_PATH/config/config.json"
LOGO_PATH="$SCRIPT_PATH/assets/logo.png"
BLACK_IMAGE_FILE="$SCRIPT_PATH/assets/black.png"

# Function to be executed when the script is terminated
cleanup() {
    kill_display_processes
    echo "Slideshow terminated."
}

# Trap the EXIT signal
trap cleanup EXIT

# Load config using node
load_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        node "$SCRIPT_PATH/scripts/create-default-config.js"
    fi
    
    # Parse times from config
    OFF_TIME=$(node -e "console.log(require('$CONFIG_FILE').slideshow.offTime)")
    ON_TIME=$(node -e "console.log(require('$CONFIG_FILE').slideshow.onTime)")
    DISPLAY_TIME=$(node -e "console.log(require('$CONFIG_FILE').slideshow.defaultSlideDuration)")
    BLEND_TIME=$(node -e "console.log(require('$CONFIG_FILE').slideshow.transitionDuration)")
}

# Find unused TTY
setup_display() {
    for tty in {1..7}; do
        if ! who | grep -q "tty$tty"; then
            unused_tty=$tty
            break
        fi
    done

    if [ -z "$unused_tty" ]; then
        echo "No unused TTY found!"
        exit 1
    fi
    echo "Using TTY $unused_tty"
}

# Process management
kill_display_processes() {
    sudo pkill -x "fbi"
    sudo pkill -x "cvlc"
}

# Display functions
display_media() {
    local media_list=$1
    local media_type=$2
    
    case $media_type in
        "image")
            sudo fbi -a -r 5 -t "$DISPLAY_TIME" --blend "$BLEND_TIME" -vt "$unused_tty" --noverbose "$media_list"
            ;;
        "video")
            cvlc --loop "$media_list"
            ;;
    esac
}

display_black_screen() {
    kill_display_processes
    sudo fbi -a -r 5 -vt "$unused_tty" --noverbose "$BLACK_IMAGE_FILE" &
}

# Main loop
main_loop() {
    while true; do
        # Get current media from Node.js server
        MEDIA_INFO=$(node "$SCRIPT_PATH/scripts/get-current-media.js")
        
        if [ -n "$MEDIA_INFO" ]; then
            # Parse media info JSON
            MEDIA_TYPE=$(echo "$MEDIA_INFO" | jq -r '.type')
            MEDIA_PATH=$(echo "$MEDIA_INFO" | jq -r '.path')
            
            if [ "$MEDIA_TYPE" != "null" ] && [ "$MEDIA_PATH" != "null" ]; then
                display_media "$MEDIA_PATH" "$MEDIA_TYPE"
            else
                display_black_screen
            fi
        fi
        
        sleep 5
    done
}

# Check dependencies
check_deps() {
    node "$SCRIPT_PATH/scripts/check-dependencies.js"
    if [ $? -ne 0 ]; then
        exit 1
    fi
}

# Main execution
clear
check_deps
load_config
setup_display
sudo fbi -a -r 5 -t 5 -vt "$unused_tty" --noverbose "$LOGO_PATH" &
main_loop