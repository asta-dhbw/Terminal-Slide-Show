#!/bin/bash

# Install all dependencies for python virtual environment
sudo apt update
sudo apt upgrade -y
sudo apt-get install python3-venv -y
python -m venv venv
source ./venv/bin/activate
# install dependencies for project
pip install -r requirements.txt

# Install all dependencies for bash script
sudo apt install fbi vlc jq dos2unix -y
sudo apt install libimage-exiftool-perl -y

sleep 5

# Define the default configuration
SCRIPT_PATH="$(realpath "$(dirname "$0")")"
CONFIG_FILE="$SCRIPT_PATH/app_config.json"
default_config=$(
    jq -n \
        --arg td "./app_data/content" \
        --argjson ug false \
        --arg ga "" \
        --arg dd "" \
        --arg ot "19:30" \
        --arg ont "07:30" \
        --arg dt "10" \
        --arg bt "900" \
        --arg py "./venv" \
        '{
        TARGET_DIR: $td,
        USE_GDRIVE: $ug,
        GOOGLE_API_ACCESS: $ga,
        DRIVE_DIR_ID: $dd,
        OFF_TIME: $ot,
        ON_TIME: $ont,
        DISPLAYTIME: $dt,
        BLENDTIME: $bt,
        PYENV: $py
    }'
)
echo "$default_config" >$CONFIG_FILE
echo -e "Finished installing dependencies\n-----------------------------\n"
