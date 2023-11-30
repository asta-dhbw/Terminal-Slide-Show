import json
import os
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

GOOGLE_API_ACCES = "./credentials/raspi.json"  # json_file
DRIVE_DIR_ID = "1bCGQehPOsDEJiI7RzEAyVbSzngfQMpdf"
TARGET_DIR = "./content"

STATE_FILE_PATH = "./state.json"


def load_state():
    """
    Load the state from the saved state file.

    Returns:
    - dict: The loaded state.
    """
    try:
        with open(STATE_FILE_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_state(state):
    """
    Save the state to the state file.

    Parameters:
    - state (dict): The state to be saved.
    """
    with open(STATE_FILE_PATH, "w") as f:
        json.dump(state, f)


def check_files_state(service_account_file_path, folder_id, target_directory):
    """
    Check if the state of files in the Google Drive folder has changed since the last scan.

    Parameters:
    - service_account_file_path (str): The path to the service account JSON file.
    - folder_id (str): The ID of the Google Drive folder.
    - target_directory (str): The local directory where files are stored.

    Returns:
    - bool: True if there are changes (new files or modified files in the Drive), False otherwise.
    """
    try:
        # Authenticate and create a service object.
        credentials = service_account.Credentials.from_service_account_file(
            service_account_file_path
        )
        service = build("drive", "v3", credentials=credentials)

        # Load the previous state
        previous_state = load_state()

        # Retrieve the current state from the Google Drive folder.
        results = (
            service.files()
            .list(
                q=f"'{folder_id}' in parents",
                fields="nextPageToken, files(id, name, modifiedTime)",
            )
            .execute()
        )
        current_state = {
            item["name"]: item["modifiedTime"] for item in results.get("files", [])
        }
        print(current_state)

        # Check for new files, modified files, or deleted files in the Drive
        for file_name, drive_modified_time in current_state.items():
            if (
                file_name not in previous_state
                or previous_state[file_name] != drive_modified_time
            ):
                # There is a new file or a modified file in the Drive
                save_state(current_state)
                return True

        # Check for deleted files in the Drive
        for file_name in previous_state:
            if file_name not in current_state:
                # A file that was present in the previous state is not in the current state (deleted)
                save_state(current_state)
                return True
        # If no changes found
        return False

    except Exception as error:
        print(f"Error: {error}")
        return False


if __name__ == "__main__":
    # Create Download-folder if it doesn't exist
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)

    # Check if there are changes in the files
    changes_detected = check_files_state(GOOGLE_API_ACCES, DRIVE_DIR_ID, TARGET_DIR)

    if changes_detected:
        # print("Changes detected. Do something.")
        sys.exit(1)
    else:
        # print("No changes detected.")
        sys.exit(0)
