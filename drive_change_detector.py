"""This module contains the functions for detecting changes in a Google Drive folder."""
import json
import logging
from googleapiclient.errors import HttpError

# pylint: disable=broad-except


def load_state(file_path):
    """
    Load the state from the saved state file.

    Returns:
    - dict: The loaded state.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_state(new_state, file_path):
    """
    Save the state to the state file.

    Parameters:
    - new_state (dict): The state to be saved.
    - file_path (str): The path to the state file.
    """
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(new_state, f)


def get_changes(service, drive_dir_id, state_file="./state.json"):
    """Retrieve NEW files from the Google Drive folder."""
    old_state = load_state(state_file)
    results = {}

    try:
        # pylint: disable=no-member
        results = (
            service.files()
            .list(
                q=f"'{drive_dir_id}' in parents",
                fields="nextPageToken, files(id, name, mimeType, modifiedTime, createdTime)",
                orderBy="createdTime desc",
            )
            .execute()
        )
    except HttpError as http_error:
        logging.error(
            "HTTP error at GDrive change detection:\n%s\n------------------", http_error
        )
        return [], []
    except Exception as error:
        logging.error(
            "An unexpected error occurre at GDrive change detection:\n%s\n------------------",
            error,
        )
        return [], []

    current_state = results.get("files", [])
    new_files = []
    deleted_files = []

    # check for changes or errors
    if len(old_state) == 0:
        new_files = current_state
        deleted_files = {}
    elif len(current_state) >= 0:
        new_files = [file for file in current_state if file not in old_state]
        deleted_files = [file for file in old_state if file not in current_state]
    else:
        logging.warning("Error occurred in %s.", drive_dir_id)

    if len(new_files) == 0 and len(deleted_files) == 0:
        logging.info("No changes in the folder with ID %s.", drive_dir_id)
        return [], []

    if new_files:
        logging.info("New files in the folder with ID %s:", drive_dir_id)
        for file in new_files:
            logging.info(
                "%s (%s) - Created at %s",
                file["name"],
                file["id"],
                file["createdTime"],
            )

    if deleted_files:
        logging.info("Deleted in the folder with ID %s:", drive_dir_id)

        for file in deleted_files:
            logging.info("%s (%s) - Deleted", file["name"], file["id"])

    save_state(current_state, state_file)
    return new_files, deleted_files
