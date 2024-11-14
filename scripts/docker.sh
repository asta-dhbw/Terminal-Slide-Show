#!/bin/bash
#
# Docker and Git setup automation script
# Handles container management and git configuration
#
# Author: Muddyblack
# Date: 11.11.2024
# Version: 1.0

# -----------------------------------------------------------------------------
# Check for remote changes
# -----------------------------------------------------------------------------
echo "Checking for remote changes..."
git stash && git fetch

UPSTREAM=${1:-'@{u}'}
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM")
BASE=$(git merge-base @ "$UPSTREAM")

if [ $LOCAL = $REMOTE ]; then
    echo "No updates available. Skipping container operations."
    exit 0
elif [ $LOCAL = $BASE ]; then
    echo "Updates found. Proceeding with container operations..."
else
    echo "Local changes exist. Please commit or stash them first."
    exit 1
fi

# -----------------------------------------------------------------------------
# Container cleanup
# -----------------------------------------------------------------------------
docker compose down

# -----------------------------------------------------------------------------
# Git configuration
# -----------------------------------------------------------------------------
# Configure git pull strategy to create merge commits
git config pull.rebase false
git config pull.ff false
git config merge.commit no-edit

# -----------------------------------------------------------------------------
# Update repository
# -----------------------------------------------------------------------------
# Stash changes, pull updates, and ensure script remains executable
git pull --no-edit && chmod +x docker.sh

# -----------------------------------------------------------------------------
# Container management
# -----------------------------------------------------------------------------
# Rebuild containers without using cache
docker compose build --no-cache

# Start containers in background mode
docker compose up -d