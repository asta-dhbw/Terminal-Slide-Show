# pylint: disable=C
# pylint: disable=unused-import
import setup
import os
import unittest
from unittest.mock import MagicMock, patch
from googleapiclient.errors import HttpError
import drive_downloader


class TestDownloadFile(unittest.TestCase):
    def setUp(self):
        self.service = MagicMock()
        self.file_item = {
            "name": "test_file",
            "id": "test_id",
            "mimeType": "application/vnd.google-apps.file",
        }
        self.target_directory = "./temp"

    @patch("drive_downloader.os.path.exists", return_value=False)
    @patch("drive_downloader.os.makedirs")
    @patch("drive_downloader.io.BytesIO")
    @patch("drive_downloader.MediaIoBaseDownload")
    @patch("drive_downloader.open", new_callable=unittest.mock.mock_open())
    def test_download_file_for_file(
        self, mock_open, mock_download, mock_bytesio, mock_makedirs, mock_exists
    ):
        self.file_item["mimeType"] = "application/vnd.google-apps.file"
        mock_request = self.service.files().get_media.return_value
        mock_fh = mock_bytesio.return_value
        mock_downloader = mock_download.return_value
        mock_downloader.next_chunk.side_effect = [
            (MagicMock(), False),
            (MagicMock(), True),
        ]

        drive_downloader.download_file(
            self.service, self.file_item, self.target_directory
        )

        mock_exists.assert_called_once_with(self.target_directory)
        mock_makedirs.assert_called_once_with(self.target_directory)
        self.service.files().get_media.assert_called_once_with(
            fileId=self.file_item["id"]
        )
        mock_bytesio.assert_called_once()
        mock_download.assert_called_once_with(mock_fh, mock_request)
        mock_open.assert_called_once_with(
            os.path.join(self.target_directory, self.file_item["name"]), "wb"
        )

    @patch("drive_downloader.os.path.exists", return_value=True)
    @patch("drive_downloader.os.makedirs")
    @patch("drive_downloader.logging.warning")
    def test_download_file_http_error(self, mock_warning, mock_makedirs, mock_exists):
        self.service.files().get_media.side_effect = HttpError(
            resp=MagicMock(), content=b""
        )

        drive_downloader.download_file(
            self.service, self.file_item, self.target_directory
        )

        mock_exists.assert_called_once_with(self.target_directory)
        mock_makedirs.assert_not_called()
        self.service.files().get_media.assert_called_once_with(
            fileId=self.file_item["id"]
        )
        mock_warning.assert_called_once()


if __name__ == "__main__":
    unittest.main()
