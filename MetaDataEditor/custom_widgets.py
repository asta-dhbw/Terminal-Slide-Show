""" This module contains custom widgets for the MetaDataEditor """
from PyQt5.QtWidgets import (  # pylint: disable=no-name-in-module
    QApplication,
    QWidget,
    QTextEdit,
    QPushButton,
    QHBoxLayout,
)
from PyQt5.QtCore import Qt, QEvent
from PyQt5.QtGui import QKeyEvent


class TagTextEdit(QTextEdit):
    """
    Custom QTextEdit that allows tabbing between widgets
    """

    # pylint: disable=invalid-name
    def keyPressEvent(self, event):
        """Overwrite the keyPressEvent to allow tabbing between widgets"""
        if event.key() == Qt.Key_Tab and not event.modifiers():
            self.focusNextPrevChild(True)
        else:
            super().keyPressEvent(event)

    # pylint: enable=invalid-name
    def event(self, event):
        """Overwrite the event to allow tabbing between widgets"""
        if (
            event.type() == QEvent.KeyPress
            and event.key() == Qt.Key_Tab
            and not event.modifiers()
        ):
            QApplication.instance().sendEvent(
                self.parent(), QKeyEvent(QEvent.KeyPress, Qt.Key_Tab, Qt.NoModifier)
            )
            return True
        return super().event(event)

    # pylint: disable=invalid-name
    def focusInEvent(self, event):
        """Overwrite the focusInEvent to select all text"""
        super().focusInEvent(event)
        self.selectAll()

    # pylint: enable=invalid-name


class TagWidget(QWidget):
    """
    Custom widget for editing a single tag
    """

    def __init__(self, tag_name="", tag_value="", text_field_height=50, parent=None):
        super().__init__(parent)

        self.text_field_height = text_field_height

        self.tag_name_edit = TagTextEdit(self)
        if tag_name.strip() != "":
            self.tag_name_edit.setPlainText(tag_name)
        else:
            self.tag_name_edit.setPlaceholderText("Tag Name")
        self.tag_name_edit.setFixedHeight(self.text_field_height)

        self.tag_value_edit = TagTextEdit(self)
        if tag_value.strip() != "":
            self.tag_value_edit.setPlainText(tag_value)
        else:
            self.tag_value_edit.setPlaceholderText("Tag Value")
        self.tag_value_edit.setFixedHeight(self.text_field_height)

        self.remove_button = QPushButton("Remove", self)
        self.remove_button.setObjectName("removeButton")

        tag_layout = QHBoxLayout()
        tag_layout.addWidget(self.tag_name_edit)
        tag_layout.addWidget(self.tag_value_edit)
        tag_layout.addWidget(self.remove_button)
        tag_layout.setSpacing(10)

        self.setLayout(tag_layout)

        self.remove_button.clicked.connect(self.remove_self)
        self.setTabOrder(self.tag_name_edit, self.tag_value_edit)

    def set_values(self, tag_name, tag_value):
        """Sets the values of the tag_name_edit and tag_value_edit"""
        self.tag_name_edit.setPlainText(tag_name)
        self.tag_value_edit.setPlainText(tag_value)

    def clear_fields(self):
        """Clears the tag_name_edit and tag_value_edit"""
        try:
            self.tag_name_edit.clear()
            self.tag_value_edit.clear()
        except AttributeError:
            pass

    def remove_self(self):
        """Removes itself from the parent layout"""
        try:
            self.deleteLater()
        except RuntimeError as e:
            print(f"RuntimeError: {e}")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")

    def get_values(self):
        """Returns the values of the tag_name_edit and tag_value_edit"""
        return self.tag_name_edit.toPlainText(), self.tag_value_edit.toPlainText()
