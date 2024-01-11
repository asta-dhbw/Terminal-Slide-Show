# pylint: disable=all

import setup
import logging
from datetime import datetime
import unittest
from unittest.mock import patch
from show_file_checker import check_for_event, convert_to_datetime


class TestShowFileChecker(unittest.TestCase):
    def setUp(self):
        self.mock_datetime = patch("show_file_checker.datetime").start()
        self.mock_read_metadata = patch("show_file_checker.read_metadata").start()
        self.mock_datetime.now.return_value = datetime(2022, 2, 2)
        self.mock_datetime.strptime.side_effect = datetime.strptime

    def tearDown(self):
        patch.stopall()

    def check_event(self, filename, metadata, expected_result):
        self.mock_read_metadata.return_value = metadata
        self.assertEqual(check_for_event(filename), expected_result)

    def test_check_for_event(self):
        self.check_event("./content/03_03_2022.png", {}, True)
        self.check_event("./content/03_03_2021.png", {}, False)
        self.check_event("./content/03_03_2024@02.04.22.png", {}, False)
        self.check_event("./content/03_03_2024@02.04.24.png", {}, False)
        self.check_event(
            "./content/OLA.png",
            {"STARTDATE": "01_01_2022", "ENDDATE": "04_04_2022"},
            True,
        )
        self.check_event(
            "./content/OLA.png",
            {"STARTDATE": "01_01_2021", "ENDDATE": "01_01_2021"},
            False,
        )
        self.check_event(
            "./content/OLA.png",
            {"STARTDATE": "01_01_2023", "ENDDATE": "01_01_2023"},
            False,
        )

    def test_convert_to_datetime(self):
        self.assertEqual(convert_to_datetime("01_01_2022"), datetime(2022, 1, 1))
        self.assertEqual(convert_to_datetime("01.01.2022"), datetime(2022, 1, 1))
        self.assertEqual(convert_to_datetime("01-01-2022"), datetime(2022, 1, 1))
        self.assertIsNone(convert_to_datetime("2022_01_01"))
        self.assertIsNone(convert_to_datetime("01-01_2022"))
        self.assertIsNone(convert_to_datetime("01_01_202asda2"))


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    unittest.main()
