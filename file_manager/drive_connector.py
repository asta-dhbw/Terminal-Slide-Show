""" Connect to Google Drive API using a json file with credentials """
import logging
from google.auth.exceptions import GoogleAuthError
from google.oauth2 import service_account
from googleapiclient.errors import HttpError
from googleapiclient.discovery import build

# pylint: disable=broad-except


def connect_to_drive(access_file):
    """
    Connect to Google Drive API using a json file with credentials

    Returns:
    - service: Google Drive API service object
    """
    try:
        # Authenticate and create a service object.
        credentials = service_account.Credentials.from_service_account_file(access_file)
        service = build("drive", "v3", credentials=credentials)
        logging.info("Connected to Google Drive API")
        return service
    except GoogleAuthError as auth_error:
        logging.error(
            "Authentication error at G-API connection:\n%s\n------------------",
            auth_error,
        )
    except HttpError as http_error:
        logging.error(
            "HTTP error at G-API connection:\n%s\n------------------", http_error
        )
    except Exception as other_error:
        logging.error(
            "An unexpected error occurred at G-API connection:\n%s\n------------------",
            other_error,
        )
    return None


if __name__ == "__main__":
    DRIVE = connect_to_drive("../app_data/raspi.json")
    print(DRIVE)
