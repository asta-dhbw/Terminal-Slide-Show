import os
import io
import shutil
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

# Specify the path to your service account JSON file and the target Google Drive folder ID.
GOOGLE_API_ACCESS = "/home/pi/Slide_Show/raspi.json"
DRIVE_DIR_ID = "xxx"
TARGET_DIR = "/home/pi/Slide_Show/content/"


def extract_date_from_filename(file_name):
    """
    Extract and return a datetime object from the given filename in various date formats.
    Returns None if the format is incorrect.
    """
    supported_formats = ["%Y_%m_%d", "%Y.%m.%d", "%Y-%m-%d"]

    # Iterate through all parts of the filename (split by '.'), excluding the last part (file extension)
    file_parts = file_name.split(".")[:-1]

    for date_format in supported_formats:
        try:
            # Join the file parts to get the potential date string
            date_str = ".".join(file_parts)
            date_obj = datetime.strptime(date_str, date_format)
            return date_obj
        except ValueError:
            pass  # Try the next format if the current one fails

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

                    # Extract date from the filename
                    date_from_filename = extract_date_from_filename(file_name)

                    # Check if the file has the correct format
                    if date_from_filename is None:
                        print(f"Ignoring file {file_name} with incorrect format.")
                        continue

                    # Remove files older than one day based on the name
                    if date_from_filename < (datetime.now() - timedelta(days=1)):
                        # Delete local and ignore
                        try:
                            os.remove(file_path)
                            print(f"Deleted local file: {file_name}")
                        except OSError as error:
                            print(
                                f"An error occurred while deleting file locally: {error}"
                            )
                        finally:
                            continue

                    # Download the file if it does not exist in the target directory.
                    if not os.path.exists(file_path):
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
