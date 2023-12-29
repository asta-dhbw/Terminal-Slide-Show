""" This module contains the functions to download files and folders from Google Drive. """
import os
import io
import sys
import time
import logging
from googleapiclient.http import MediaIoBaseDownload
from googleapiclient.errors import HttpError

# pylint: disable=broad-except


def download_file(service, file_item, target_directory="./temp"):
    """Download an item from Google Drive. (file or entire folder)"""
    file_name = file_item["name"]
    file_id = file_item["id"]
    file_type = file_item["mimeType"]
    file_path = os.path.join(target_directory, file_name)

    # Check if the target directory exists, if not, create it
    if not os.path.exists(target_directory):
        os.makedirs(target_directory)

    if file_type == "application/vnd.google-apps.folder":
        # It's a folder, download each item one by one
        children = service.files().list(q=f"'{file_id}' in parents").execute()
        for child in children["files"]:
            download_file(service, child, file_path)
    else:
        # It's a file, download it
        try:
            request = service.files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)

            done = False
            while not done:
                status, done = downloader.next_chunk()
                progress = int(status.progress() * 100)
                sys.stdout.write(
                    f"\rDownloading {file_name}: [{'=' * int(progress / 5):<20}] {progress}%"
                )
                sys.stdout.flush()
                time.sleep(0.1)
            fh.seek(0)
            print("")
            with open(file_path, "wb") as f:
                f.write(fh.getvalue())
        except HttpError as http_error:
            logging.warning(
                "HTTP error at GDrive change detection:\n%s\n------------------",
                http_error,
            )
        except Exception as error:
            logging.warning(
                "An unexpected error occurre at GDrive change detection:\n%s\n------------------",
                error,
            )
