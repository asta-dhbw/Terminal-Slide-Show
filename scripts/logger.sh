#!/bin/bash

# Default values
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_project_dir() {
    local dir="$SCRIPT_DIR"
    while [[ "$dir" != "/" ]]; do
        if [[ -f "$dir/package.json" ]]; then
            echo "$dir"
            return
        fi
        dir="$(dirname "$dir")"
    done
    echo "$SCRIPT_DIR"  # Fallback to script directory if marker not found
}

PROJECT_DIR="$(find_project_dir)"

LOG_LEVEL=${LOG_LEVEL:-"INFO"}  # Can be ERROR, WARN, INFO, DEBUG
LOG_DIR=${LOG_DIR:-"$PROJECT_DIR/logs"}   # Default log directory
LOG_FILE=${LOG_FILE:-"$LOG_DIR/application.log"}

# Log levels
declare -A LOG_LEVELS=( ["ERROR"]=0 ["WARN"]=1 ["INFO"]=2 ["DEBUG"]=3 )

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

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
    
    if [[ ! -z "$log_dir" ]]; then
        LOG_DIR=$log_dir
        mkdir -p "$LOG_DIR"
    fi
    
    if [[ ! -z "$log_file" ]]; then
        LOG_FILE=$log_file
    fi
    
    if [[ ! -z "$log_level" ]]; then
        LOG_LEVEL=$log_level
    fi
    
    log_debug "Logging initialized - DIR: $LOG_DIR, FILE: $LOG_FILE, LEVEL: $LOG_LEVEL"
}