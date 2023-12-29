#!/bin/bash

# Function to be executed when the script is terminated
cleanup() {
    kill_display_processes
    echo "Slideshow terminated."
}

# Trap the EXIT signal and execute the cleanup function
trap cleanup EXIT

# Configuration Variables
SCRIPT_PATH="./"
LOGO_PATH="$SCRIPT_PATH/LOGO.png"
UPDATE_CHECK_SCRIPT="$SCRIPT_PATH/drive_local_file_manager.py"
CURRENT_FILES_FILE="$SCRIPT_PATH/current_files.json"

OFF_TIME="23:00" #19:30
ON_TIME="07:30"

DISPLAYTIME=10 # in seconds
BLENDTIME=900  # in milliseconds

# Other Constants
DISPLAYPID=""
is_first_run=true

# Function to turn off the cursor
turn_off_cursor() {
    setterm -cursor off
    echo -e "\e[?25h"
}

# Function to kill display processes
kill_display_processes() {
    sudo pkill -x "fbi"  # >/dev/null 2>/dev/null
    sudo pkill -x "cvlc" # >/dev/null 2>/dev/null
}

# Function to check if drive folder has been updated
check_for_updates() {
    python "$SCRIPT_PATH/$UPDATE_CHECK_SCRIPT"
    return $?
}

# Function to display images and videos in terminal
display() {
    local image_files="$1"
    local video_files="$2"
    IMAGE_FILES_COUNT=$(echo "$image_files" | wc -w)
    kill_display_processes # >/dev/null 2>/dev/null

    if [[ -n "$image_files" && -n "$video_files" ]]; then
        while true; do
            sudo fbi -a -r 3 -t $DISPLAYTIME --blend $BLENDTIME -T 1 --noverbose -1 $image_files # >/dev/null 2>/dev/null &
            sleep $((IMAGE_FILES_COUNT * DISPLAYTIME))
            sudo pkill -x "fbi" # >/dev/null 2>/dev/null &
            cvlc "$video_files" # >/dev/null 2>/dev/null
        done
    elif [ -n "$image_files" ]; then
        #clear
        sudo fbi -a -r 5 -t $DISPLAYTIME --blend $BLENDTIME -T 1 --noverbose $image_files # >/dev/null 2>/dev/null &
    elif [ -n "$video_files" ]; then
        #clear
        cvlc --loop "$video_files" # >/dev/null 2>/dev/null &
    fi
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
    #clear
    sleep $seconds_until_target
}

# Function to handle the main loop
main_loop() {
    while true; do
        local current_time=$(date +"%H:%M")
        local changes_detected=0

        # Run Python file and get return value to check if drive folder has been updated (1 = yes, 0 = no)
        check_for_updates
        changes_detected=$?

        if [[ "$current_time" > "$OFF_TIME" || "$current_time" < "$ON_TIME" ]]; then
            #vcgencmd display_power 0
            echo "Exiting script as no one is here"
            calculate_and_sleep_until_target_time "$current_time"

        elif [[ "$is_first_run" = true || "$changes_detected" = 1 ]]; then
            vcgencmd display_power 1
            is_first_run=false

            # get from file the current images and videos to display
            mapfile -t current_images < <(jq -r '.IMAGES[]' "$CURRENT_FILES_FILE")
            mapfile -t current_videos < <(jq -r '.VIDEOS[]' "$CURRENT_FILES_FILE")
            wait
            echo "Images to display: ${current_images[*]}"
            echo "Videos to display: ${current_videos[*]}"

            # display images and videos if any or changed
            if [[ ${#current_images[@]} -gt 0 || ${#current_videos[@]} -gt 0 ]]; then
                sudo kill "$DISPLAYPID" # >/dev/null 2>/dev/null
                kill_display_processes  # >/dev/null 2>/dev/null
                display "${current_images[*]}" "${current_videos[*]}" &
                DISPLAYPID=$!
            else
                kill_display_processes # >/dev/null 2>/dev/null
                #vcgencmd display_power 0
                #clear
            fi
        fi
        sleep 10
    done
}

# Main scripts
#clear
turn_off_cursor
sudo fbi -a -r 5 -t 5 -T 1 --noverbose "$SCRIPT_PATH/LOGO.png" & # >/dev/null 2>/dev/null &
main_loop                                                        # >/dev/null 2>/dev/null
