""" Unit tests for the drive_downloader module. """
import unittest
from unittest.mock import Mock, patch
from drive_downloader import download_file


class TestDriveDownloader(unittest.TestCase):
    """Unit tests for the drive_downloader module."""

    @patch("drive_downloader.MediaIoBaseDownload")
    @patch("drive_downloader.io.BytesIO")
    @patch("drive_downloader.os")
    def test_download_file(self, mock_os, mock_io, mock_media):
        # Mock the Google Drive service
        mock_service = Mock()
        mock_service.files.return_value.get_media.return_value = "media"

        # Mock the file item
        mock_file_item = {
            "name": "test_file",
            "id": "123",
            "mimeType": "application/vnd.google-apps.file",
        }

        # Mock the MediaIoBaseDownload instance
        mock_downloader = Mock()
        mock_downloader.next_chunk.return_value = (Mock(progress=lambda: 1), True)
        mock_media.return_value = mock_downloader

        # Mock the BytesIO instance
        mock_fh = Mock()
        mock_fh.getvalue.return_value = b"test data"
        mock_io.return_value = mock_fh

        # Mock os.path.exists to always return True
        mock_os.path.exists.return_value = True

        # Mock os.makedirs so it does nothing
        mock_os.makedirs.return_value = None

        # Call the function with the mocks
        download_file(mock_service, mock_file_item)

        # Assert that the necessary methods were called on the mocks
        mock_service.files.assert_called_once()
        mock_service.files.return_value.get_media.assert_called_once_with(fileId="123")
        mock_media.assert_called_once_with(mock_fh, "media")
        mock_downloader.next_chunk.assert_called()
        mock_fh.seek.assert_called_once_with(0)
        mock_os.path.join.assert_called_once_with("./temp", "test_file")

        # Remove the context manager and directly call the write method on the mock object
        mock_os.open.return_value.write.assert_called_once_with(b"test data")


if __name__ == "__main__":
    unittest.main()
