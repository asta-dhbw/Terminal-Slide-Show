#!/bin/bash

# Configuration Variables
SCRIPT_PATH="/home/pi/Slide_Show/"
MEDIA_FOLDER="$SCRIPT_PATH/content/"
DISPLAYTIME=10 # in seconds
BLENDTIME=900  # in milliseconds
LOGO_PATH="$SCRIPT_PATH/LOGO.png"
DOWNLOADER_SCRIPT="drive_downloader.py"
UPDATE_CHECK_SCRIPT="drive_check_update.py"

OFF_TIME="19:30"
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
    sudo pkill -x "fbi" >/dev/null 2>/dev/null
    sudo pkill -x "mpv" >/dev/null 2>/dev/null
    sleep 2
}

# Function to download new content from G-Drive
download() {
    sudo fbi -a -r 5 -t 5 -T 1 --noverbose "/home/pi/Slide_Show/LOGO.png" &
    #cat "/home/pi/Slide_Show/LOGO.txt" &
    python "$SCRIPT_PATH$DOWNLOADER_SCRIPT" >/dev/null 2>/dev/null
    clear
    sleep 2
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
    killer >/dev/null 2>/dev/null

    if [[ -n "$image_files" && -n "$video_files" ]]; then
        while true; do
            sudo fbi -a -r 5 -t $DISPLAYTIME --blend $BLENDTIME -T 1 --noverbose -1 $image_files >/dev/null 2>/dev/null &
            sleep $((IMAGE_FILES_COUNT * DISPLAYTIME))                #-8 for smooth image to video
            (sleep 1 && sudo pkill -x "fbi") >/dev/null 2>/dev/null & #sleep 5 seconds
            mpv --fs --cache-secs=30 --fs-screen=1 --no-input-cursor "$video_files" >/dev/null 2>/dev/null
        done
    elif [ -n "$image_files" ]; then
        clear
        sudo fbi -a -r 5 -t $DISPLAYTIME --blend $BLENDTIME -T 1 --noverbose $image_files >/dev/null 2>/dev/null
    elif [ -n "$video_files" ]; then
        clear
        mpv --fs --cache-secs=30 --loop=inf --fs-screen=1 --no-input-cursor "$video_files" >/dev/null 2>/dev/null
    fi
}

# Function to handle the main display logic
handle_display() {
    local image_files=$(find "$MEDIA_FOLDER" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \))
    local video_files=$(find "$MEDIA_FOLDER" -type f \( -iname "*.mp4" -o -iname "*.mkv" -o -iname "*.avi" -o -iname "*.ogg" -o -iname "*.mov" \))
    display "$image_files" "$video_files"
}

# Function to handle the main loop
main_loop() {
    while true; do
        local current_time=$(date +"%H:%M")
        check_for_updates
        local changes_detected=$?

        if [[ "$current_time" > "$OFF_TIME" || "$current_time" < "$ON_TIME" ]]; then
            vcgencmd display_power 0
            echo "Exiting script as it's after 8pm or before 7:30am."

            # Calculate seconds until 07:20 AM of the next day
            local target_time=""
            if [[ "$current_time" < "$ON_TIME" ]]; then
                target_time=$ON_TIME
            else
                target_time="$ON_TIME tomorrow"
            fi

            local target_timestamp=$(date -d "$target_time" +"%s")
            local current_timestamp=$(date -d "$current_time" +"%s")
            local seconds_until_target=$((target_timestamp - current_timestamp))

            killer >/dev/null 2>/dev/null
            clear
            sleep $seconds_until_target

        elif [[ "$FIRST_RUN" = true || "$changes_detected" = 1 ]]; then
            vcgencmd display_power 1
            FIRST_RUN=false
            sudo kill "$DISPLAYPID"
            sleep 2
            killer >/dev/null 2>/dev/null
            download >/dev/null 2>/dev/null &
            wait
            if [ -d "$MEDIA_FOLDER" ] && [ "$(ls -A "$MEDIA_FOLDER")" ]; then
                handle_display &
                DISPLAYPID=$!
            else
                killer >/dev/null 2>/dev/null
                clear
                #cat "/home/pi/Slide_Show/LOGO.txt"
                sudo fbi -a -r 5 -t 5 -T 1 --noverbose "/home/pi/Slide_Show/LOGO.png" >/dev/null 2>/dev/null
            fi
        fi
        sleep 10
    done
}

# Main scripts
clear
turn_off_cursor
main_loop >/dev/null 2>/dev/null
