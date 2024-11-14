#!/bin/bash
#
# Docker and Git setup automation script
# Handles container management and git configuration
#
# Author: Muddyblack
# Date: 11.11.2024
# Version: 1.0

# -----------------------------------------------------------------------------
# Git configuration
# -----------------------------------------------------------------------------
# Configure git pull strategy to create merge commits
git config pull.rebase false
git config pull.ff false
git config merge.commit no-edit

# -----------------------------------------------------------------------------
# Check for remote updates
# -----------------------------------------------------------------------------
echo "Checking for updates from remote..."

# Fetch the latest changes from remote
git fetch origin

# Check if remote has new commits
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "Remote is up to date. Exiting script."
    exit 0
fi

echo "New updates available on remote. Starting update process..."

# -----------------------------------------------------------------------------
# Container cleanup and update process
# -----------------------------------------------------------------------------
echo "Stopping containers..."
docker compose down

# -----------------------------------------------------------------------------
# Update repository
# -----------------------------------------------------------------------------
echo "Pulling latest changes..."
# Stash changes, pull updates, and ensure script remains executable
git stash && git pull --no-edit && chmod +x docker.sh

# -----------------------------------------------------------------------------
# Container management
# -----------------------------------------------------------------------------
echo "Rebuilding containers..."
# Rebuild containers without using cache
docker compose build --no-cache

echo "Starting containers..."
# Start containers in background mode
docker compose up -d

echo "Update process completed successfully."