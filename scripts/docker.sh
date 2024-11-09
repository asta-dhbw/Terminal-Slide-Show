#!/bin/bash

# Stop and remove all containers defined in docker-compose.yml
docker compose down

# Set merge as default pull strategy and configure automatic merge message
git config pull.rebase false
git config pull.ff false
git config merge.commit no-edit

# Modified fetch and pull command
git stash && git pull --no-edit && chmod +x docker.sh

# Build/rebuild containers defined in docker-compose.yml without using cache
docker compose build --no-cache

# Start containers in detached mode (-d flag runs them in background)
docker compose up -d
