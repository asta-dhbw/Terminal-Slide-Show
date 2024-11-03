#!/bin/bash

# Stop and remove all containers defined in docker-compose.yml
docker compose down

# Fetch updates from remote repository
git fetch

# Pull latest changes from current branch
git pull

# Build/rebuild containers defined in docker-compose.yml
docker compose build

# Start containers in detached mode (-d flag runs them in background)
docker compose up -d
