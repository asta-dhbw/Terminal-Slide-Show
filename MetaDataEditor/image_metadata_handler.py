"""Module for reading and writing metadata to image files"""
import json
import logging
from PIL import Image
from PIL.PngImagePlugin import PngInfo
from PIL.ExifTags import TAGS


def read_metadata(image_path):
    """Reads the metadata from an image file and returns it as a dictionary"""
    image = Image.open(image_path)
    file_format = image.format.lower()

    metadata_dict = {}

    if file_format in ("jpeg", "jpg", "png"):
        # Check if the image has Exif data (common for JPEG)
        exif_data = image.getexif()
        if exif_data is not None:
            for tag, value in exif_data.items():
                tag_name = TAGS.get(tag, tag)
                metadata_dict[tag_name] = value

        # Check if the image has PNG text data
        if hasattr(image, "text"):
            for key, value in image.text.items():
                metadata_dict[key] = value

        # Check if the image has BMP info data
        if hasattr(image, "info"):
            for key, value in image.info.items():
                metadata_dict[key] = value
    elif file_format == "gif":
        metadata_str = image.info.get("comment")
        print(metadata_str)
        if metadata_str:
            try:
                metadata_dict = json.loads(metadata_str)
            except json.JSONDecodeError:
                logging.warning("Could not decode metadata")
    else:
        logging.warning("Format not supported")

    # Add support for other formats as needed
    # IN PROGRESS

    image.close()

    return metadata_dict


def write_metadata(image_path, out_path="./", metadata=None):
    """Writes the metadata to an image file"""
    image = Image.open(image_path)
    file_format = image.format.lower()

    # Check image format and apply metadata accordingly
    if file_format.lower() in ("jpeg", "jpg"):
        image.save(f"{out_path}.{file_format}", exif=metadata)
    elif file_format.lower() == "png":
        png_info = PngInfo()
        for key, value in metadata.items():
            png_info.add_text(key, str(value))
        image.save(f"{out_path}.{file_format}", pnginfo=png_info)
    elif file_format.lower() == "gif":
        metadata_str = str(metadata)
        image.save(
            out_path, "GIF", save_all=True, append_images=[image], comment=metadata_str
        )
    else:
        logging.warning("Format not supported")

    # Add support for other formats as needed
    # IN PROGRESS

    image.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    read_metadata("giphy.gif")
