# pylint: disable=all
import __init__
import unittest
from unittest.mock import patch, MagicMock
from PIL import Image
from image_metadata_handler import read_metadata, write_metadata


class TestImageMetadataHandler(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.file_format = "JPEG"

    def setUp(self):
        self.mock_open = patch("image_metadata_handler.Image.open").start()
        self.mock_image = self.create_mock_image()
        self.mock_open.return_value = self.mock_image

    def tearDown(self):
        patch.stopall()

    def create_mock_image(self, format=None, exif=None, text=None, info=None):
        mock_image = MagicMock(spec=Image.Image)
        mock_image.format = format or self.file_format
        mock_image.getexif.return_value = exif or {}
        mock_image.text = text or {}
        mock_image.info = info or {}
        return mock_image

    def test_read_metadata(self):
        # Mock the Image object returned by Image.open
        exif_data = {274: 1}
        text_data = {"key": "value"}
        info_data = {"dpi": (72, 72)}
        self.mock_image = self.create_mock_image(
            exif=exif_data, text=text_data, info=info_data
        )
        self.mock_open.return_value = self.mock_image

        # Call the function and check the returned metadata
        metadata = read_metadata("test.jpg")
        expected_metadata = {"Orientation": 1, "key": "value", "dpi": (72, 72)}
        self.assertEqual(metadata, expected_metadata)

    def test_read_metadata_no_exif(self):
        # Mock the Image object returned by Image.open
        text_data = {"key": "value"}
        info_data = {"dpi": (72, 72)}
        self.mock_image = self.create_mock_image(text=text_data, info=info_data)
        self.mock_open.return_value = self.mock_image

        # Call the function and check the returned metadata
        metadata = read_metadata("test.jpg")
        expected_metadata = {"key": "value", "dpi": (72, 72)}
        self.assertEqual(metadata, expected_metadata)

    def test_write_metadata(self):
        # Call the function with some test metadata
        write_metadata("test.jpg", "./test", {"Orientation": 1})

        # Check that the image was saved with the correct metadata
        self.mock_image.save.assert_called_once_with(
            "./test.jpeg", exif={"Orientation": 1}
        )

    def test_write_metadata_no_exif(self):
        # Call the function with no metadata
        write_metadata("test.jpg", "./test", {})

        # Check that the image was saved with no metadata
        self.mock_image.save.assert_called_once_with("./test.jpeg", exif={})


if __name__ == "__main__":
    unittest.main()
