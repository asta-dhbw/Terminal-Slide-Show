# pylint: disable=all
import setup
import json
import unittest
from unittest.mock import patch, MagicMock
from googleapiclient.errors import HttpError
import drive_change_detector as dcd


class TestDriveChangeDetector(unittest.TestCase):
    @patch(
        "builtins.open",
        new_callable=unittest.mock.mock_open,
        read_data='{"key": "value"}',
    )
    def test_load_state(self, mock_open):
        result = dcd.load_state("dummy_path")
        self.assertEqual(result, {"key": "value"})
        mock_open.assert_called_once_with("dummy_path", "r", encoding="utf-8")

    @patch("builtins.open", new_callable=unittest.mock.mock_open)
    @patch("json.dump")
    def test_save_state(self, mock_dump, mock_open):
        dcd.save_state({"key": "value"}, "dummy_path")
        mock_open.assert_called_once_with("dummy_path", "w", encoding="utf-8")
        mock_dump.assert_called_once_with({"key": "value"}, mock_open.return_value)

    @patch("drive_change_detector.load_state", return_value={})
    @patch("drive_change_detector.save_state")
    def test_get_changes(self, mock_save_state, mock_load_state):
        mock_service = MagicMock()
        mock_service.files().list().execute.return_value = {
            "files": [{"id": "file1", "name": "file1", "createdTime": "time1"}]
        }

        new_files, deleted_files = dcd.get_changes(mock_service, "dummy_dir_id")

        mock_load_state.assert_called_once_with("./state.json")
        assert mock_service.files().list.call_count == 2
        mock_save_state.assert_called_once()
        self.assertEqual(
            new_files, [{"id": "file1", "name": "file1", "createdTime": "time1"}]
        )
        self.assertEqual(deleted_files, {})


if __name__ == "__main__":
    unittest.main()
