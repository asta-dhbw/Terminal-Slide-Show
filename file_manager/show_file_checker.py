""" 
This module checks if a file is supposed to be displayed at the current time. 
It does this by checking the filename or metadata
"""
import os
import sys
import re
import logging
from datetime import datetime
from pathlib import Path

# pylint: disable=wrong-import-position
PARENT_DIRECTORY_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PARENT_DIRECTORY_PATH)
from MetaDataEditor.image_metadata_handler import read_metadata

SUPPORTED_DATE_FORMATS = [
    "%d_%m_%Y",
    "%d.%m.%Y",
    "%d-%m-%Y",
    "%d_%m_%y",
    "%d.%m.%y",
    "%d-%m-%y",
]


def convert_to_datetime(date):
    """This will convert the date to a datetime object if it is in the correct format"""

    for fmt in SUPPORTED_DATE_FORMATS:
        try:
            valid_date = datetime.strptime(date, fmt)
            return valid_date
        except ValueError:
            pass

    logging.warning("Date format not supported")
    return None


def check_for_event(file):
    """
    Checks if file is currently supposed to be displayed
    """
    start = None
    end = None

    file_name = Path(file).stem
    #  Check if the filename contains a date
    match = re.findall(
        r"(\d{1,2}[-._ ]\d{1,2}[-._ ]\d{2,4})@?(\d{1,2}[-._ ]\d{1,2}[-._ ]\d{2,4})?",
        file_name,
    )
    if match:
        # Check if event by using the filename
        logging.debug("Matched. Checking by filename")
        logging.debug("Date parts: %s", match)

        if match[0][0] and match[0][1]:
            start = convert_to_datetime(match[0][0])
            end = convert_to_datetime(match[0][1])
        elif match[0][0]:
            end = convert_to_datetime(match[0][0])
        elif not match[0][0] and not match[0][1]:
            logging.debug("Nothing useful in filename")
            match = False
    if not match:
        # Check by using the metadata
        data = read_metadata(file)
        try:
            start = convert_to_datetime(data["STARTDATE"])
        except KeyError:
            logging.debug("No start date in metadata")
        try:
            end = convert_to_datetime(data["ENDDATE"])
        except KeyError:
            logging.debug("No end date in metadata")

    logging.debug("Start: %s, End: %s", start, end)

    if (start is None and end is not None) and end >= datetime.now():
        logging.debug("Event is currently happening")
        return True
    if end is not None and end < datetime.now():
        logging.debug("End date is in the past: %s", end)
        return False
    if (start is not None and end is not None) and (
        start <= datetime.now() and end >= datetime.now()
    ):
        logging.debug("Event is currently happening")
        return True
    if (start is not None and end is not None) and (start > datetime.now()):
        logging.debug("Start date is in the future: %s", start)
        return False

    logging.warning("File %s does not match anything!", file)
    return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    TEST = check_for_event("../app_data/content/xx01.01.24@02.03.25.png")
    print(f"{TEST}")
