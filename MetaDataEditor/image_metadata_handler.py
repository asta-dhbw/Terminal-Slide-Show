from PIL import Image
from PIL.PngImagePlugin import PngInfo
from PIL.ExifTags import TAGS


def read_metadata(image_path):
    image = Image.open(image_path)

    metadata_dict = {}

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

    # Add support for other formats as needed
    # IN PROGRESS

    image.close()

    return metadata_dict


def write_metadata(image_path, out_path="./", metadata={}):
    image = Image.open(image_path)
    format = image.format.lower()

    # Check image format and apply metadata accordingly
    if format in ("jpeg", "jpg"):
        image.save(f"{out_path}.{format}", exif=metadata)
    elif format == "png":
        png_info = PngInfo()
        for key, value in metadata.items():
            png_info.add_text(key, str(value))
        image.save(f"{out_path}.{format}", pnginfo=png_info)

    # Add support for other formats as needed
    # IN PROGRESS

    image.close()
