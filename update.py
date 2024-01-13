""" Update script for TerminalSlideShow """
# pylint: disable=all
import os
import sys
import json
import logging
from shutil import rmtree, move
from subprocess import call
from typing import Union
from argparse import ArgumentParser
from requests import get, exceptions

# get args
parser = ArgumentParser(description="TerminalSlideShow, use '--update'.")
parser.add_argument("--update", action="store_true", help="Update.", required=False)
parser.add_argument("--debug", action="store_true", help="Debug mode.", required=False)
parser.add_argument(
    "-y", action="store_true", help="Will automatically say yes.", required=False
)
args = parser.parse_args()

# setup
if args.debug:
    logging.basicConfig(level=logging.DEBUG)
else:
    logging.basicConfig(level=logging.INFO)

# important settings
PROJECT_PATH = os.path.join(__file__.replace(os.path.basename(__file__), ""))
TEMP_DIR = PROJECT_PATH + "/" + "temp"
ignore_files = [
    "LICENSE",
    ".gitignore",
    ".github",
    ".pylintrc",
    ".unittests",
    "app_config.json",
    "update.py",
    "black.png",
    "LOGO.png",
]
repository = {
    "name": "Muddyblack",
    "repo": "Terminal-Slide-Show",
    "branch": "master",
}


def create_dir(path: str) -> str:
    """Create directory"""
    os.mkdir(path)
    logging.info(f"Directory created: {path}")

    return path


def delete_dir(path: str) -> None:
    """Delete directory"""
    rmtree(path)
    logging.info(f"Directory deleted: {path}")


def user_permissions() -> Union[str, bool]:
    """Ask user if he wants to continue with the update."""
    if not args.y:
        rights = input(
            "Automatic installer will download and update your program files. If you have the appropriate file, and download rights please continue by entering 'Y'. [y/N] "
        )
        if rights.lower() not in ["y", "yes"]:
            logging.info("Exiting script...")
            sys.exit(1)
        return rights
    return args.y


def validate(repo, specific_file="", api=False) -> str:
    """Create a link to the file in the repo.
    example.com (repo) + directory = example.com/directory if API then
    https://api.github.com/repos/USER/REPO/git/trees/BRANCH?recursive=1
    """
    if api:
        return rf'https://api.github.com/repos/{repo["name"]}/{repo["repo"]}/git/trees/{repo["branch"]}?recursive=1'
    repo_link = rf'https://raw.githubusercontent.com/{repo["name"]}/{repo["repo"]}/{repo["branch"]}'
    return (
        f"{repo_link}{specific_file}"
        if repo_link[-1] == "/"
        else f"{repo_link}/{specific_file}"
    )


def fetch_and_decode(url, action, json_decode=True) -> str:
    """return GET of url. action is only for exit() not anything important"""
    # Attempt to downloaded_file
    try:
        downloaded_file = get(url, timeout=10)
    except exceptions.RequestException as exc:
        logging.info(f"[UPDATER] Unable to {action}. ")
        sys.exit(exc)

    # Error handling
    if downloaded_file.status_code != 200:
        sys.exit(
            f"[UPDATER] Unable to {action} (Status: {downloaded_file.status_code})"
        )

    # if need be - decode json
    if json_decode:
        try:
            response = json.loads(downloaded_file.text)
            return response
        except json.JSONDecodeError:
            sys.exit(f"[UPDATER] Unable to {action} (JSONDecodeError)")
    return downloaded_file.text


def extract_file_paths(data) -> list:
    """Appends GitHub API file paths to dictionary if not in ignore_files"""
    stripped, files, dirs = [], [], []

    # strip unnecessary data
    for file_path in data["tree"]:
        if not any(file_path["path"].startswith(ignore) for ignore in ignore_files):
            stripped.append(file_path)

    # separate files and directories
    for _, value in enumerate(stripped):
        if value["type"] == "blob":
            files.append(value["path"])
        elif value["type"] == "tree":
            dirs.append(value["path"])

    return {"files": sorted(files), "directories": sorted(dirs)}


def download_online_files(online_files, path) -> list:
    """download files from the internet world-wide-web"""
    downloaded_file = []
    files = online_files["files"]
    folders = online_files["directories"]
    for folder in folders:
        os.mkdir(path + "/" + folder)
    for file in files:
        downloaded_file.append(file)
        print(f"Attempting to download {file}.")

        try:
            downloaded_text = fetch_and_decode(
                validate(repository, file), f"downloading {file}", False
            )
            with open(rf"{path}/{file}", "wb") as temp_file:
                temp_file.write(
                    downloaded_text.encode(sys.stdout.encoding, errors="replace")
                )
        except Exception as exc:  # skipcq
            locals.debug(exc)
            logging.info(
                f"Failed to download {file}.\nError occurred whilst downloading files.\n"
                "Before reporting this as an issue on github please run --debug and report the result."
            )
            delete_dir(TEMP_DIR)
            sys.exit(1)
        logging.info(f"Successfully downloaded {file}.")
    return downloaded_file


def delete_files(online_files, dir_path: str = "./"):
    """Delete files"""
    files = online_files["files"]
    folders = online_files["directories"]
    for file in files:
        try:
            os.remove(dir_path + file)
        except FileNotFoundError:
            continue


def move_files_and_folders(src_dir: str, dest_dir: str):
    """Move files and folders from src_dir to dest_dir."""
    for item in os.listdir(src_dir):
        try:
            s = os.path.join(src_dir, item)
            d = os.path.join(dest_dir, item)
            move(s, d)
        except Exception as exc:
            logging.error(exc)


def pip_install():
    """runs: pip install -r requirements.txt"""
    try:
        call("pip install -r requirements.txt", shell=True)
    except Exception as exc:  # skipcq
        logging.debug(exc)
        logging.warning(
            "Pip was unable to automatically update your modules."
            "\nPlease manually update your modules by using: 'pip install -r requirements.txt'."
        )
        return
    logging.info("Updated pip modules.")


if __name__ == "__main__":
    # Force users to use --update
    if not args.update:
        logging.info("Use 'py %s --update' to update.", os.path.basename(__file__))
        sys.exit(0)

    # Check for the latest version
    logging.info("Checking latest version online.")
    check_version = fetch_and_decode(
        validate(repository, "version.json"), "check latest version"
    )
    logging.info(
        "Found a version online! Attempting to update to %s.", check_version["version"]
    )
    logging.debug(check_version)

    # Get online files
    logging.info("Finding list of online files.")
    online_files = extract_file_paths(
        fetch_and_decode(validate(repository, api=True), "check file directory")
    )
    logging.info("Found list of online files.")
    logging.debug(online_files)

    # Check for user permissions
    user_perm = user_permissions()
    logging.debug(user_perm)

    # Create temp directory
    # check if folder exists, if so deleted L
    if os.path.isdir(TEMP_DIR):
        delete_dir(TEMP_DIR)
    create_dir(TEMP_DIR)

    # Download all files to local device
    logging.info("Attempting to download files.")
    download_online_files(online_files, TEMP_DIR)
    logging.info("Successfully downloaded files")

    # Delete local files
    logging.info("Deleting local files.")
    delete_files(online_files, PROJECT_PATH)
    logging.info("Deleted local files.")

    # Move files in temp to main directory
    logging.info("Moving downloaded files to local directory.")
    move_files_and_folders(TEMP_DIR, PROJECT_PATH)
    logging.info("Moved downloaded files to local directory.")

    # Delete downloaded/temp folder
    logging.info("Deleting temp folder.")
    delete_dir(TEMP_DIR)
    logging.info("Deleted temp folder.")

    # Updating pip
    logging.info("Updating pip modules.")
    pip_install()

    logging.info(f"Successfully updated your script to {check_version['version']}.")
