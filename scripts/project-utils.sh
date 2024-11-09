#!/bin/bash

# project-utils.sh - Common utility functions for the project

# Get the absolute path of the script directory
get_script_dir() {
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
}

# Find the project root directory (where package.json exists)
find_project_dir() {
    local dir="$(get_script_dir)"
    while [[ "$dir" != "/" ]]; do
        if [[ -f "$dir/package.json" ]]; then
            echo "$dir"
            return
        fi
        dir="$(dirname "$dir")"
    done
    echo "$(get_script_dir)"  # Fallback to script directory if marker not found
}

# Initialize logging with defaults derived from project structure
init_project_logging() {
    local script_name="$1"
    local custom_log_dir="$2"
    local custom_log_level="$3"
    
    # Source the logger if not already sourced
    if ! declare -F log_info >/dev/null; then
        local logger_path="$(get_script_dir)/logger.sh"
        [ ! -f "$logger_path" ] && { echo "logger.sh not found"; exit 1; }
        source "$logger_path"
    fi
    
    # Set up logging with project-aware defaults
    local project_dir="$(find_project_dir)"
    local log_dir="${custom_log_dir:-$project_dir/logs}"
    local log_file="$log_dir/${script_name}.log"
    
    init_logging "$log_dir" "$log_file" "${custom_log_level:-INFO}"
}

# Clean up resources and exit
cleanup_and_exit() {
    local cleanup_function="$1"
    local exit_code="${2:-0}"
    
    # If a cleanup function is provided, run it
    if [ -n "$cleanup_function" ] && declare -F "$cleanup_function" >/dev/null; then
        "$cleanup_function"
    fi
    
    exit "$exit_code"
}

# Set up signal trapping with custom cleanup
setup_signal_traps() {
    local cleanup_function="$1"
    
    trap 'cleanup_and_exit "$cleanup_function" 0' SIGINT SIGTERM EXIT
}