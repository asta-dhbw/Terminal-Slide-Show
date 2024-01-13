"""Module for reading and writing metadata to files"""
import os
import subprocess
import pickle
import base64
import logging

# Detect the operating system and set the exifToolPath accordingly
if os.name == "nt":  # For Windows
    EXIFTOOLPATH = "exifTool.exe"
else:  # For Mac and Linux
    EXIFTOOLPATH = "exiftool"


def read_metadata(image_path):
    """Reads the metadata from an image file and returns it as a dictionary"""
    with subprocess.Popen(
        [EXIFTOOLPATH, image_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
    ) as process:
        # get the tags in dict
        metadata = {
            line.split(":")[0].strip(): line.split(":")[1].strip()
            for line in process.stdout
        }

    return pickle.loads(base64.b64decode(metadata["Comment"]))


def write_metadata(image_path, out_path, metadata=None):
    """Writes the metadata to an image file using exiftool"""

    # Convert the metadata dictionary to a pickled bytes object
    meta_pickle = pickle.dumps(metadata)

    # Encode the pickled bytes object as a base64 string
    meta_base64 = base64.b64encode(meta_pickle).decode("utf-8")

    # Use exiftool to write the metadata to the Comment tag and overwrite the original file
    cmd = [
        "exiftool",
        "-Comment=" + f"{meta_base64}",
        "-o",
        out_path,
        image_path,
    ]

    if out_path == image_path:
        cmd.append("-overwrite_original")
    elif os.path.exists(out_path):
        os.remove(out_path)
    logging.info(
        "immage path: %s with metadata: %s and output: %s",
        image_path,
        metadata,
        out_path,
    )
    try:
        subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as e:
        logging.error("exiftool command failed. Return code: %s", {e.returncode})
        logging.error("Output: %s", {e.output.decode("utf-8")})
        logging.error("Error: %s", {e.stderr.decode("utf-8")})
        raise subprocess.CalledProcessError(
            e.returncode, e.cmd, e.output.decode("utf-8")
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    FILE = "C:/Users/Muddyblack/Downloads/ISD-00_7bbb.mp4"
    write_metadata(
        "C:/Users/Muddyblack/Downloads/ISD-00_7.mp4",
        FILE,
        metadata={"Copyright": "Test", "Author": "Test2"},
    )

    com = read_metadata(FILE)
    print(com)
