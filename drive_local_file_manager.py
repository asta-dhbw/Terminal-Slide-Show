""" This script is used to manage the files that are displayed on the screen."""
import os
import sys
import json
import shutil
import logging
import argparse

from drive_connector import connect_to_drive
from drive_change_detector import get_changes
from drive_downloader import download_file
from show_file_checker import check_for_event

logging.basicConfig(level=logging.INFO)

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument(
    "--use_google_drive",
    type=bool,
    default=True,
    help="A boolean that says if we use google drive or not (default: True)",
)
args = parser.parse_args()

# Specify the path to your service account JSON file and the target Google Drive folder ID.
TARGET_DIR = "./content"
CURRENT_FILES = "./current_files.json"

IMAGE_FORMATS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"]
VIDEO_FORMATS = [".mp4", ".avi", ".mov", ".flv", ".wmv", ".mkv", "ogg"]

# If using Google Drive, download new files and delete deleted files.
if args.use_google_drive:
    GOOGLE_API_ACCESS = "./credentials/raspi.json"
    DRIVE_DIR_ID = "1bCGQehPOsDEJiI7RzEAyVbSzngfQMpdf"
    DRIVE = connect_to_drive(GOOGLE_API_ACCESS)

    # Retrieve files from the Google Drive folder.
    new_items, deleted_items = get_changes(DRIVE, DRIVE_DIR_ID)

    # Download new_items to the local folder.
    for file in new_items:
        download_file(DRIVE, file, TARGET_DIR)

    # Delete deleted_items from the local folder.
    for file in deleted_items:
        file_name = file["name"]
        file_path = os.path.join(TARGET_DIR, file_name)
        if os.path.exists(file_path):
            if os.path.isfile(file_path):
                os.remove(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)

# Get all files that are currently supposed to be displayed
current_files = {"IMAGES": [], "VIDEOS": []}
for root, dirs, files in os.walk(TARGET_DIR):
    for file in files:
        file_path = os.path.join(root, file)
        absolute_file_path = os.path.abspath(file_path)
        file_extension = os.path.splitext(file)[1].lower()
        if check_for_event(absolute_file_path):
            # Append to the appropriate list based on the file extension
            if file_extension in IMAGE_FORMATS:
                current_files["IMAGES"].append(absolute_file_path)
            elif file_extension in VIDEO_FORMATS:
                current_files["VIDEOS"].append(absolute_file_path)
logging.info("Current files: %s", current_files)

with open(CURRENT_FILES, "w", encoding="utf-8") as f:
    json.dump(current_files, f)


# If there are changes, return signal to restart the slideshow
if args.use_google_drive and (len(new_items) > 0 or len(deleted_items) > 0):
    logging.info("New items: %s", new_items)
    logging.info("Deleted items: %s", deleted_items)
    sys.exit(1)
else:
    logging.info("No changes")
    sys.exit(0)
