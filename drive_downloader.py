import os
import io
import shutil
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

# Specify the path to your service account JSON file and the target Google Drive folder ID.
GOOGLE_API_ACCESS = "./credentials/raspi.json"
DRIVE_DIR_ID = "1bCGQehPOsDEJiI7RzEAyVbSzngfQMpdf"
TARGET_DIR = "./content"


def is_supported_dateformat(date_text):
    """
    This will check if the file name is in the correct format
    """
    supported_formats = [
        "%d_%m_%Y",
        "%d.%m.%Y",
        "%d-%m-%Y",
        "%d_%m_%y",
        "%d.%m.%y",
        "%d-%m-%y",
    ]

    date = None

    for date_format in supported_formats:
        try:
            date = datetime.strptime(date_text, date_format)
            break
        except ValueError:
            pass

    if date is None:
        raise ValueError("Date format not supported")
    else:
        return date


def is_current_event(file_name):
    """
    Checks if file is currently supposed to be displayed
    """
    # Iterate through all parts of the filename (split by '.'), excluding the last part (file extension)
    file_parts = ".".join(file_name.split(".")[:-1])
    date_parts = file_parts.split("@")
    start = None
    end = None

    if len(date_parts) == 2:
        start = is_supported_dateformat(date_parts[0])
        end = is_supported_dateformat(date_parts[1])
    elif len(date_parts) == 1:
        end = is_supported_dateformat(date_parts[0])

    if end < datetime.now():
        return False
    if ((len(date_parts) == 2) and (start <= datetime.now())) or len(date_parts) == 1:
        return True

    # Return None if none of the formats match
    return None


def download_files_from_google_drive(
    service_account_file_path, folder_id, target_directory
):
    """
    Download files from a Google Drive folder using the Google Drive API.

    Parameters:
    - service_account_file_path (str): Path to the service account JSON file.
    - folder_id (str): ID of the Google Drive folder.
    - target_directory (str): Local directory where files will be downloaded.
    """
    try:
        # Authenticate and create a service object.
        credentials = service_account.Credentials.from_service_account_file(
            service_account_file_path
        )
        service = build("drive", "v3", credentials=credentials)

        # Retrieve the files from the folder.
        try:
            results = (
                service.files()
                .list(
                    q=f"'{folder_id}' in parents",
                    fields="nextPageToken, files(id, name)",
                )
                .execute()
            )
            items = results.get("files", [])

            if not items:
                print("No files found.")
                try:
                    shutil.rmtree(target_directory)
                    print(f"Deleted local folder: {target_directory}")
                except OSError as error:
                    print(f"An error occurred while deleting file locally: {error}")
            else:
                print("Files:")
                for item in items:
                    file_name = item["name"]
                    file_id = item["id"]
                    file_path = os.path.join(target_directory, file_name)

                    is_date_fine = is_current_event(file_name)

                    # Check if the file has the correct format
                    if is_date_fine is None:
                        print(f"Ignoring file {file_name} with incorrect format.")
                        continue

                    # Remove files older than one day based on the name
                    if not is_date_fine:
                        try:
                            os.remove(file_path)
                            print(f"Deleted local file: {file_name}")
                        except OSError as error:
                            print(
                                f"An error occurred while deleting file locally: {error}"
                            )
                        try:
                            service.files().delete(fileId=file_id).execute()
                            print(f"Deleted file in Google Drive: {file_name}")
                        except HttpError as error:
                            print(
                                f"An error occurred while deleting file in Google Drive: {error}"
                            )
                        finally:
                            continue

                    # Download the file if it does not exist in the target directory.
                    if (not os.path.exists(file_path)) and (is_date_fine):
                        try:
                            request = service.files().get_media(fileId=file_id)
                            fh = io.BytesIO()
                            downloader = MediaIoBaseDownload(fh, request)
                            done = False
                            while not done:
                                status, done = downloader.next_chunk()
                                print(
                                    f"Downloading {file_name}: {int(status.progress() * 100)}."
                                )
                            fh.seek(0)
                            with open(file_path, "wb") as f:
                                f.write(fh.read())
                        except HttpError as error:
                            print(f"An error occurred: {error}")
                        except Exception as error:
                            print(f"An error occurred: {error}")

                # Delete files in the target directory that are not in the Google Drive folder.
                local_files = os.listdir(target_directory)
                drive_files = [item["name"] for item in items]
                for local_file in local_files:
                    if local_file not in drive_files:
                        local_file_path = os.path.join(target_directory, local_file)
                        os.remove(local_file_path)
                        print(f"Deleted local file: {local_file}")

        except HttpError as error:
            print(f"An error occurred: {error}")
        except Exception as error:
            print(f"An error occurred: {error}")

    except Exception as error:
        print(f"Error: {error}")


if __name__ == "__main__":
    # Create the download folder if it doesn't exist
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)

    # Call the function to download files from Google Drive
    download_files_from_google_drive(GOOGLE_API_ACCESS, DRIVE_DIR_ID, TARGET_DIR)
