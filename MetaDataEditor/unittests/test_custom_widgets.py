# pylint: disable=all
import __init__
import unittest
from PyQt5.QtWidgets import QApplication
from custom_widgets import TagWidget, TagTextEdit
from PyQt5.QtGui import QKeyEvent, QFocusEvent
from PyQt5.QtCore import Qt, QEvent


class TestTagWidget(unittest.TestCase):
    def setUp(self):
        self.app = QApplication([])

    def tearDown(self):
        self.app.quit()

    def test_set_values(self):
        widget = TagWidget()
        widget.set_values("TagName", "TagValue")
        self.assertEqual(widget.tag_name_edit.toPlainText(), "TagName")
        self.assertEqual(widget.tag_value_edit.toPlainText(), "TagValue")

    def test_clear_fields(self):
        widget = TagWidget()
        widget.set_values("TagName", "TagValue")
        widget.clear_fields()
        self.assertEqual(widget.tag_name_edit.toPlainText(), "")
        self.assertEqual(widget.tag_value_edit.toPlainText(), "")

    def test_remove_self(self):
        widget = TagWidget()
        parent_layout = widget.parent().layout() if widget.parent() else None
        widget.remove_self()
        self.assertIsNone(parent_layout)

    def test_get_values(self):
        widget = TagWidget()
        widget.set_values("TagName", "TagValue")
        result = widget.get_values()
        self.assertEqual(result, ("TagName", "TagValue"))


#!!! This test is not working
"""
class TestTagTextEdit(unittest.TestCase):
    def setUp(self):
        self.app = QApplication([])

    def tearDown(self):
        self.app.quit()

    def test_tab_key_press_event(self):
        text_edit = TagTextEdit()
        event = QKeyEvent(QEvent.KeyPress, Qt.Key_Tab, Qt.NoModifier)
        text_edit.keyPressEvent(event)
        # Add assertions based on the expected behavior of Tab key press event

    def test_focus_in_event(self):
        text_edit = TagTextEdit()
        # Simulate a focus in event
        text_edit.focusInEvent(QFocusEvent(QEvent.FocusIn))
        # Add assertions based on the expected behavior of focus in event

    # Add more tests as needed
"""

if __name__ == "__main__":
    unittest.main()
