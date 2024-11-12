#!/bin/bash

source "$(dirname "${BASH_SOURCE[0]}")/project-utils.sh"

# Configuration
PROJECT_DIR="$(find_project_dir)"
MEDIA_DIR="${PROJECT_DIR}/downloads"

check_dependencies() {
    # Check mpv
    if ! command -v mpv >/dev/null 2>&1; then
        log_error "ERROR: Missing required package: mpv"
        if command -v pacman >/dev/null 2>&1; then
            log_info "Install with: pacman -S mpv"
        elif command -v apt-get >/dev/null 2>&1; then
            log_info "Install with: apt-get install mpv"
        else
            log_info "Please install mpv using your system's package manager"
        fi
        exit 1
    fi

    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        log_error "ERROR: Missing required package: npm"
        if command -v apt-get >/dev/null 2>&1; then
            log_info "Install with: apt-get install npm"
        else
            log_info "Please install npm using your system's package manager"
        fi
        exit 1
    fi
}

run_npm_commands() {
    log_info "Installing npm dependencies..."
    npm install || {
        log_error "npm install failed"
        exit 1
    }

    log_info "Starting development server..."
    npm run dev:server & # Run in background
}

run_slideshow() {
    log_info "Starting slideshow..."
    mpv --image-display-duration=5 --loop-playlist=inf --fullscreen --no-audio "$MEDIA_DIR"/*
}

cleanup() {
    log_info "Cleaning up..."
    pkill -f mpv
    pkill -f "npm run dev:server" # Kill dev server
    tput cnorm  # Show cursor
    exit 0
}

main() {
    init_project_logging "terminal_slideshow"
    # Run network manager and capture status
    "$SCRIPT_DIR/network-manager.sh"
    network_status=$?

    if [ $network_status -ne 0 ]; then
        log_error "Network setup failed with status $network_status"
        exit 1
    fi
    log_info "Network setup completed successfully"
    log_info "Starting kiosk mode..."

    check_dependencies
    
    # Create required directories
    mkdir -p "$MEDIA_DIR" "$LOG_DIR"

    # Set up signal handlers
    setup_signal_traps cleanup

    # Run npm commands before slideshow
    run_npm_commands

    # Start slideshow
    run_slideshow
}

main "$@"