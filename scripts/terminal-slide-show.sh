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
    npm run dev & # Run in background
}

run_slideshow() {
    log_info "Starting slideshow..."
    monitor_backend &
    mpv --image-display-duration=5 --loop-playlist=inf --fullscreen --no-audio "$MEDIA_DIR"/*
}

cleanup() {
    log_info "Cleaning up..."
    pkill -f mpv
    pkill -f "npm run dev:server"
    pkill -f "monitor_backend"
    tput cnorm
    exit 0
}

check_backend_health() {
    local endpoint="http://127.0.0.1:3000/api/server-status"
    local status_code
    
    # Get HTTP status code using curl's -w option and silence other output
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    
    # Debug output
    echo "Status code: $status_code"
    
    # Check for 2xx status codes
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        return 0
    fi
    return 1
}

monitor_backend() {
    while true; do
        if ! check_backend_health; then
            log_error "Backend health check failed"
        else
            log_info "Backend health check passed"
        fi

        sleep 30 # Check every 30 seconds (fixed sleep value)
    done
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