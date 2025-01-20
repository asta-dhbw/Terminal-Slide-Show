#!/bin/bash
#
# Project utility functions for bash applications
# Provides common project-wide functionality and logging setup
#
# Author: Muddyblack
# Date: 11.11.2024
# Version: 1.0

# -----------------------------------------------------------------------------
# Dependencies
# -----------------------------------------------------------------------------

source "$(dirname "${BASH_SOURCE[0]}")/logger.sh" || {
    echo "Failed to source logger.sh" >&2
    exit 1
}

# -----------------------------------------------------------------------------
# Script location utilities 
# -----------------------------------------------------------------------------

# Get the absolute path of the script directory
get_script_dir() {
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
}

# Find the project root directory by looking for package.json
# Returns script directory as fallback if not found
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

# -----------------------------------------------------------------------------
# Logging initialization
# -----------------------------------------------------------------------------

# Initialize project-aware logging with sensible defaults
# Arguments:
#   $1 - Script name for log file
#   $2 - Optional: Custom log directory
#   $3 - Optional: Custom log level
init_project_logging() {
    local script_name="${1:?Script name is required}"
    local custom_log_dir="${2:-}"
    local custom_log_level="${3:-}"
    
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

# -----------------------------------------------------------------------------
# Exit and cleanup handling
# -----------------------------------------------------------------------------

# Cleanup and exit with proper signal handling
cleanup_and_exit() {
    local cleanup_function="$1"
    local exit_code="${2:-0}"
    
    # Remove existing traps to prevent recursive calls
    trap - EXIT SIGINT SIGTERM SIGHUP ERR

    # If cleanup function exists and is callable, run it
    if [ -n "$cleanup_function" ] && declare -F "$cleanup_function" >/dev/null; then
        "$cleanup_function"
    else
        echo "Warning: Cleanup function '$cleanup_function' not found" >&2
    fi
    
    exit "$exit_code"
}

# Set up signal traps with custom cleanup handler
# Arguments:
#   $1 - Cleanup function name to call on exit
#   $2 - Optional default exit code (default: 0)
setup_signal_traps() {
    local cleanup_function="${1}"
    local default_exit_code="${2:-0}"
    
    # Validate input
    if [ -z "$cleanup_function" ]; then
        echo "Error: Cleanup function name required" >&2
        return 1
    fi
    
    # Verify cleanup function exists
    if ! declare -F "$cleanup_function" >/dev/null; then
        echo "Error: Cleanup function '$cleanup_function' not found" >&2
        return 1
    fi
    
    # Set up traps for various signals
    trap 'cleanup_and_exit "$cleanup_function" "$default_exit_code"' EXIT
    trap 'cleanup_and_exit "$cleanup_function" 130' SIGINT  # Control-C
    trap 'cleanup_and_exit "$cleanup_function" 143' SIGTERM # Kill command
    trap 'cleanup_and_exit "$cleanup_function" 129' SIGHUP  # Terminal closed
    trap 'cleanup_and_exit "$cleanup_function" 1' ERR      # Error during execution
    
    return 0
}