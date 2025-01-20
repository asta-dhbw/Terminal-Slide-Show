#!/bin/bash
#
# Logging utility script for bash applications
# Provides configurable logging levels and file output
#
# Author: Muddyblack
# Date: 11.11.2024
# Version: 1.0

set -euo pipefail  # Strict error handling

# -----------------------------------------------------------------------------
# Constants and defaults
# -----------------------------------------------------------------------------
declare -A -r LOG_LEVELS=(
    ["ERROR"]=0
    ["WARN"]=1 
    ["INFO"]=2
    ["DEBUG"]=3
)
readonly DEFAULT_LOG_LEVEL="INFO"
readonly DEFAULT_LOG_FILE="application.log"

# Get the absolute path of the script directory
get_script_dir() {
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
}

find_project_dir() {
    local dir="$(get_script_dir)"
    while [[ "$dir" != "/" ]]; do
        if [[ -f "$dir/package.json" ]]; then
            echo "$dir"
            return
        fi
        dir="$(dirname "$dir")"
    done
      echo "$(get_script_dir)"  # Fallback
}

# -----------------------------------------------------------------------------
# Configuration with validation
# -----------------------------------------------------------------------------
LOG_LEVEL="${LOG_LEVEL:-$DEFAULT_LOG_LEVEL}"
LOG_DIR="${LOG_DIR:-$(find_project_dir)/logs}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/${DEFAULT_LOG_FILE}}"

validate_log_level() {
    local level="$1"
    if [[ ! -v LOG_LEVELS[$level] ]]; then
        printf 'Invalid log level: %s\n' "$level" >&2
        return 1
    fi
}

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

should_log() {
    local msg_level=$1
    [[ ${LOG_LEVELS[$LOG_LEVEL]} -ge ${LOG_LEVELS[$msg_level]} ]]
}

log() {
    local level=$1
    local message=$2
    
    if should_log "$level"; then
        echo -e "$(timestamp) [$level] $message" | tee -a "$LOG_FILE"
    fi
}

# Convenience functions
log_error() { log "ERROR" "$1"; }
log_warn()  { log "WARN"  "$1"; }
log_info()  { log "INFO"  "$1"; }
log_debug() { log "DEBUG" "$1"; }

# Initialize logging
init_logging() {
    local log_dir=$1
    local log_file=$2
    local log_level=$3
    
    if [[ -n "$log_dir" ]]; then
        if ! mkdir -p "$log_dir"; then
            printf 'Failed to create log directory: %s\n' "$log_dir" >&2
            return 1
        fi
        LOG_DIR="$log_dir"
    fi
    
    if [[ -n "$log_file" ]]; then
        LOG_FILE="$log_file"
    fi
    
    if [[ -n "$log_level" ]]; then
        if ! validate_log_level "$log_level"; then
            return 1
        fi
        LOG_LEVEL="$log_level"
    fi
    
    log_debug "Logging initialized - DIR: $LOG_DIR, FILE: $LOG_FILE, LEVEL: $LOG_LEVEL"
}