#!/bin/bash

# sudo apt-get install fbi mpv exiftool

source "$(dirname "${BASH_SOURCE[0]}")/project-utils.sh"

# Configuration
PROJECT_DIR="$(find_project_dir)"
MEDIA_DIR="${PROJECT_DIR}/downloads"

DISPLAY_TIME=5      # seconds between images
FADE_TIME=0.8     # seconds for transitions
PRELOAD_TIME=0.5  # seconds to preload next image

check_dependencies() {
    # Package to command name mapping 
    declare -A pkg_to_cmd=(
        ["fbi"]="fbi"
        ["mpv"]="mpv"
    )
    local missing=()
    
    # Function to check if command exists in any context
    check_cmd_exists() {
        local cmd="$1"
        # Try as regular user first
        if command -v "$cmd" >/dev/null 2>&1; then
            return 0
        fi
        # Try with expanded PATH
        if [ -x "/usr/bin/$cmd" ] || [ -x "/usr/local/bin/$cmd" ] || [ -x "/opt/bin/$cmd" ]; then
            return 0
        fi
        return 1
    }

    # Check each package
    for pkg in "${!pkg_to_cmd[@]}"; do
        local cmd="${pkg_to_cmd[$pkg]}"
        if ! check_cmd_exists "$cmd"; then
            missing+=("$pkg")
        fi
    done

    if [ ${#missing[@]} -ne 0 ]; then
        log_error "ERROR: Missing required packages: ${missing[*]}"
        # Detect package manager and provide appropriate install command
        if command -v pacman >/dev/null 2>&1; then
            log_info "Install them with: sudo pacman -S ${missing[*]}"
            log_info "For perl-image-exiftool: yay -S perl-image-exiftool"
        elif command -v apt-get >/dev/null 2>&1; then
            log_info "Install them with: sudo apt-get install ${missing[*]}"
        else
            log_info "Please install the missing packages using your system's package manager"
        fi
        exit 1
    fi

    # Ensure PATH includes common locations
    export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:$PATH"
    # Add Perl paths if exiftool is needed
    if [ -d "/usr/bin/site_perl" ]; then
        export PATH="/usr/bin/site_perl:$PATH"
    fi
    if [ -d "/usr/share/perl5/vendor_perl/bin" ]; then
        export PATH="/usr/share/perl5/vendor_perl/bin:$PATH"
    fi
}

# Find an unused virtual terminal
find_unused_tty() {
    current_tty=$(fgconsole)
    for tty in {1..12}; do
        # Skip current TTY
        [ "$tty" = "$current_tty" ] && continue
        
        # Check if TTY is free
        if ! ps -e | grep -q "tty$tty"; then
            echo "$tty"
            return 0
        fi
    done
    return 1
}

# Handle media display
display_media() {
    local file="$1"
    local type="$2"
    local tty="$3"

    case "$type" in
        image)
            pkill -f fbi >/dev/null 2>&1
            fbi -a -1 -t "$DISPLAY_TIME" --blend "$FADE_TIME" -noverbose -vt "$tty" "$file" &
            sleep "$DISPLAY_TIME"
            ;;
        video)
            pkill -f mpv >/dev/null 2>&1
            mpv --vo=drm --quiet --no-audio "$file"
            ;;
        *)
            log_error "ERROR: Unknown media type: $type"
            return 1
            ;;
    esac
}

# Get media type
get_media_type() {
    local file="$1"
    local ext="${file##*.}"
    
    case "${ext,,}" in
        jpg|jpeg|png|gif)
            echo "image"
            ;;
        mp4|mkv|avi|mov)
            echo "video"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Clean up processes on exit
cleanup() {
    log_info "Cleaning up..."
    pkill -f fbi
    pkill -f mpv
    chvt 1  # Switch back to main console
    tput cnorm  # Show cursor
    exit 0
}

# Main slideshow loop
run_slideshow() {
    local tty
    tty=$(find_unused_tty) || {
        log_info "ERROR: No available virtual terminal found"
        exit 1
    }

    # Switch to the virtual terminal
    chvt "$tty"
    
    # Hide cursor
    tput civis

    while true; do
        local files=()
        while IFS= read -r -d $'\0' file; do
            files+=("$file")
        done < <(find "$MEDIA_DIR" -type f -print0)

        if [ ${#files[@]} -eq 0 ]; then
            log_info "No media files found in $MEDIA_DIR"
            sleep 5
            continue
        fi

        for file in "${files[@]}"; do
            if [ ! -f "$file" ]; then
                continue
            fi

            local media_type
            media_type=$(get_media_type "$file")
            
            if [ "$media_type" = "unknown" ]; then
                continue
            fi

            log_info "Displaying: $file"
            display_media "$file" "$media_type" "$tty"
            
            # Check for user input (q to quit)
            read -t 0.1 -n 1 input
            if [[ $input = "q" ]]; then
                cleanup
            fi
        done
    done
}

# Main entry point
main() {
    init_project_logging "terminal_slideshow"
    check_dependencies

    # Create required directories
    mkdir -p "$MEDIA_DIR" "$LOG_DIR"

    # Set up signal handlers
    setup_signal_traps cleanup

    # Start slideshow
    run_slideshow
}

main "$@"