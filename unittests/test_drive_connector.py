""" Unit tests for drive_connector.py """
# pylint: disable=all
import setup
import unittest
from unittest.mock import patch, MagicMock
from google.auth.exceptions import GoogleAuthError
from googleapiclient.errors import HttpError

from drive_connector import connect_to_drive


class TestDriveConnector(unittest.TestCase):
    GOOGLE_API_ACCESS = "dummy.json"

    def setUp(self):
        self.mock_credentials = patch(
            "drive_connector.service_account.Credentials.from_service_account_file"
        ).start()
        self.mock_build = patch("drive_connector.build").start()

    def tearDown(self):
        patch.stopall()

    def test_connect_to_drive_success(self):
        self.mock_credentials.return_value = MagicMock()
        self.mock_build.return_value = MagicMock()
        result = connect_to_drive(self.GOOGLE_API_ACCESS)
        self.assertIsNotNone(result)

    def test_connect_to_drive_auth_error(self):
        self.mock_credentials.side_effect = GoogleAuthError("Auth error")
        result = connect_to_drive(self.GOOGLE_API_ACCESS)
        self.assertIsNone(result)

    def test_connect_to_drive_http_error(self):
        mock_response = MagicMock()
        mock_response.reason = "Http error"
        self.mock_build.side_effect = HttpError(mock_response, b"HttpError")
        result = connect_to_drive(self.GOOGLE_API_ACCESS)
        self.assertIsNone(result)

    def test_connect_to_drive_generic_error(self):
        self.mock_build.side_effect = Exception("Generic error")
        result = connect_to_drive(self.GOOGLE_API_ACCESS)
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
