#!/bin/bash

# Function to be executed when the script is terminated
cleanup() {
    killer
    echo "Slideshow terminated."
}

# Trap the EXIT signal and execute the cleanup function
trap cleanup EXIT

# Configuration Variables
SCRIPT_PATH="./"
MEDIA_FOLDER="$SCRIPT_PATH/content/"
DISPLAYTIME=10 # in seconds
BLENDTIME=900  # in milliseconds
LOGO_PATH="$SCRIPT_PATH/LOGO.png"
UPDATE_CHECK_SCRIPT="$SCRIPT_PATH/drive_local_file_manager.py"

OFF_TIME="23:00" #19:30
ON_TIME="07:30"

# Other Constants
DISPLAYPID=""
FIRST_RUN=true

# Function to turn off the cursor
turn_off_cursor() {
    setterm -cursor off
    echo -e "\e[?25h"
}

# Function to kill display processes
killer() {
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
    killer # >/dev/null 2>/dev/null

    if [[ -n "$image_files" && -n "$video_files" ]]; then
        while true; do
            sudo fbi -a -r 3 -t $DISPLAYTIME --blend $BLENDTIME -T 1 --noverbose -1 $image_files # >/dev/null 2>/dev/null &
            sleep $((IMAGE_FILES_COUNT * DISPLAYTIME))
            sudo pkill -x "fbi" # >/dev/null 2>/dev/null &
            cvlc "$video_files" # >/dev/null 2>/dev/null
        done
    elif [ -n "$image_files" ]; then
        clear
        sudo fbi -a -r 5 -t $DISPLAYTIME --blend $BLENDTIME -T 1 --noverbose $image_files # >/dev/null 2>/dev/null &
    elif [ -n "$video_files" ]; then
        clear
        cvlc --loop "$video_files" # >/dev/null 2>/dev/null &
    fi
}

# Function to handle the main display logic
handle_display() {
    shopt -s nocaseglob
    local image_files=$(find "$MEDIA_FOLDER" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \))
    local video_files=$(find "$MEDIA_FOLDER" -type f \( -iname "*.mp4" -o -iname "*.mkv" -o -iname "*.avi" -o -iname "*.ogg" \))
    shopt -u nocaseglob
    display "$image_files" "$video_files"
}

# Function to handle the main loop
main_loop() {
    while true; do
        local current_time=$(date +"%H:%M")
        local changes_detected=0

        changes_detected=$(check_for_updates)

        if [[ "$current_time" > "$OFF_TIME" || "$current_time" < "$ON_TIME" ]]; then
            #vcgencmd display_power 0
            echo "Exiting script as no one is here"

            # Calculate seconds until ON_TIME of the next day
            local target_time=""
            if [[ "$current_time" < "$ON_TIME" ]]; then
                target_time=$ON_TIME
            else
                target_time="$ON_TIME tomorrow"
            fi

            local target_timestamp=$(date -d "$target_time" +"%s")
            local current_timestamp=$(date -d "$current_time" +"%s")
            local seconds_until_target=$((target_timestamp - current_timestamp))

            killer # >/dev/null 2>/dev/null
            clear
            sleep $seconds_until_target

        elif [[ "$FIRST_RUN" = true || "$changes_detected" = 1 ]]; then
            vcgencmd display_power 1
            FIRST_RUN=false
            wait
            if [ -d "$MEDIA_FOLDER" ] && [ "$(ls -A "$MEDIA_FOLDER")" ]; then
                sudo kill "$DISPLAYPID" # >/dev/null 2>/dev/null
                killer                  # >/dev/null 2>/dev/null
                handle_display &
                DISPLAYPID=$!
            else
                killer # >/dev/null 2>/dev/null
                #vcgencmd display_power 0
                clear
            fi
        fi
        sleep 10
    done
}

# Main scripts
clear
turn_off_cursor
sudo fbi -a -r 5 -t 5 -T 1 --noverbose "$SCRIPT_PATH/LOGO.png" & # >/dev/null 2>/dev/null &
main_loop                                                        # >/dev/null 2>/dev/null
