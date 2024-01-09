#!/bin/bash

# Function to be executed when the script is terminated
cleanup() {
    kill_display_processes
    echo "Slideshow terminated."
}

# Trap the EXIT signal and execute the cleanup function
trap cleanup EXIT

# Configuration Variables
SCRIPT_PATH="$(realpath "$(dirname "$0")")"
CONFIG_FILE="$SCRIPT_PATH/app_config.json"
LOGO_PATH="$SCRIPT_PATH/LOGO.png"
UPDATE_CHECK_SCRIPT="$SCRIPT_PATH/drive_local_file_manager.py"
CURRENT_FILES_FILE="$SCRIPT_PATH/app_data/current_files.json"
BLACK_IMAGE_FILE="$SCRIPT_PATH/black.png"

OFF_TIME=$(jq -r '.OFF_TIME' $CONFIG_FILE)
ON_TIME=$(jq -r '.ON_TIME' $CONFIG_FILE)

DISPLAYTIME=$(jq -r '.DISPLAYTIME' $CONFIG_FILE) # in seconds
BLENDTIME=$(jq -r '.BLENDTIME' $CONFIG_FILE)     # in milliseconds

# Other Constants
DISPLAYPID=""a
is_first_run=true

# Function to turn off the cursor
turn_off_cursor() {
    setterm -cursor off
    echo -e "\e[?25h"a
}

# Function to kill display processes
kill_display_processes() {
    sudo pkill -x "fbi"
    sudo pkill -x "cvlc"
}

# Function to check if drive folder has been updated
check_for_updates() {
    python "$UPDATE_CHECK_SCRIPT"
    return $?
}

# Function to display images and videos in terminal
display() {
    local -n image_files=$1
    local -n video_files=$2
    IMAGE_FILES_COUNT=${#image_files[@]}

    kill_display_processes

    if [[ ${#image_files[@]} -gt 0 && ${#video_files[@]} -gt 0 ]]; then
        while true; do
            sudo fbi -a -r 3 -t $DISPLAYTIME --blend $BLENDTIME -T 1 --noverbose -1 "${image_files[@]}"
            sleep $((IMAGE_FILES_COUNT * DISPLAYTIME))
            sudo pkill -x "fbi"
            cvlc "$video_files"
        done
    elif [ -n "$image_files" ]; then
        sudo fbi -a -r 5 -t $DISPLAYTIME --blend $BLENDTIME -T 1 --noverbose "${image_files[@]}"
    elif [ -n "$video_files" ]; then
        #clear
        cvlc --loop "$video_files"
    fi
}

# Function to display black screen
display_black_screen() {
    kill_display_processes
    sudo fbi -a -r 5 -T 1 --noverbose "$BLACK_IMAGE_FILE" &
}

# Function to calculate and sleep until target time
calculate_and_sleep_until_target_time() {
    local current_time="$1"
    local target_time=""
    if [[ "$current_time" < "$ON_TIME" ]]; then
        target_time=$ON_TIME
    else
        target_time="$ON_TIME tomorrow"
    fi

    local target_timestamp=$(date -d "$target_time" +"%s")
    local current_timestamp=$(date -d "$current_time" +"%s")
    local seconds_until_target=$((target_timestamp - current_timestamp))

    kill_display_processes
    sleep $seconds_until_target
}

# Function to handle the main loop
main_loop() {
    display_off=false
    while true; do
        local current_time=$(date +"%H:%M")
        local changes_detected=0

        # Run Python file and get return value to check if drive folder has been updated (1 = yes, 0 = no)
        check_for_updates
        changes_detected=$?

        if [[ "$current_time" > "$OFF_TIME" || "$current_time" < "$ON_TIME" ]]; then
            echo "Going to sleep as no one is here"
            display_black_screen
            display_off=true
            calculate_and_sleep_until_target_time "$current_time"

        elif [[ "$is_first_run" = true || "$changes_detected" = 1 ]]; then
            is_first_run=false

            # get from file the current images and videos to display
            mapfile -t current_images < <(jq -r '.IMAGES[]' "$CURRENT_FILES_FILE")
            mapfile -t current_videos < <(jq -r '.VIDEOS[]' "$CURRENT_FILES_FILE")
            wait
            echo "Images to display: ${current_images[*]}"
            echo "Videos to display: ${current_videos[*]}"

            # display images and videos if any or changed
            if [[ ${#current_images[@]} -gt 0 || ${#current_videos[@]} -gt 0 ]]; then
                sudo kill "$DISPLAYPID"
                kill_display_processes
                display_off=false
                display "current_images" "current_videos" &
                DISPLAYPID=$!
            elif [[ "$display_off" = false ]]; then
                kill_display_processes
                display_black_screen
                display_off=true
            fi
        fi
        sleep 10
    done
}

# Main scripts
clear
sudo fbi -a -r 5 -t 5 -T 1 --noverbose "$SCRIPT_PATH/LOGO.png" &
main_loop #>/dev/null 2>/dev/null
