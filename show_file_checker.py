""" 
This module checks if a file is supposed to be displayed at the current time. 
It does this by checking the filename or metadata
"""
import re
import logging
from datetime import datetime
from pathlib import Path
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
    match = re.search(r"(\d{1,2}[-._]\d{1,2}[-._]\d{2,4})", file_name)
    if match:
        # Check if event using the filename
        logging.debug("Matched. Checking by filename")
        date_parts = file_name.split("@")
        if len(date_parts) == 2:
            start = convert_to_datetime(match.group(1))
            end = convert_to_datetime(match.group(2))
        elif len(date_parts) == 1:
            end = convert_to_datetime(match.group(1))
        if start is None and end is None:
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

    logging.warning("File %s does not match anything!", file)
    return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    TEST = check_for_event("./content/OLAdasdF230.12.23eqwe.png")
    print(f"{TEST}")
