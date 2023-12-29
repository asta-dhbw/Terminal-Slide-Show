""" Main GUI for editing images MetaData """
import os
import sys
import logging
from datetime import datetime, timedelta
from PyQt5.QtWidgets import (  # pylint: disable=no-name-in-module
    QApplication,
    QWidget,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QHBoxLayout,
    QTextEdit,
    QScrollArea,
    QSizePolicy,
    QFileDialog,
)
from PyQt5.QtCore import Qt, QEvent
from PyQt5.QtGui import QMovie, QPixmap, QIcon, QKeyEvent

from image_metadata_handler import read_metadata, write_metadata


# Constants
SCRIPT_DIR_PATH = os.path.dirname(os.path.abspath(__file__))
CURRENT_DATE = datetime.now().date()
ICON_PATH = f"{SCRIPT_DIR_PATH}/favicon.ico"
STANDARD_STYLE_SHEET = f"{SCRIPT_DIR_PATH}/styles.qss"

TEXT_FIELD_HEIGHT = 50

IMAGE_FORMATS = "Images (*.png *.jpg *.bmp *.jpeg *.gif)"
VIDEO_FORMATS = "Videos (*.mp4 *.avi *.mkv *.flv *.mov)"


def load_styles(self):
    """Loads the styles from the styles.qss file"""
    with open(STANDARD_STYLE_SHEET, "r", encoding="utf-8") as file:
        style = file.read()
        self.setStyleSheet(style)


class TagTextEdit(QTextEdit):
    """
    Custom QTextEdit that allows tabbing between widgets
    """

    def keyPressEvent(self, event):
        """Overwrite the keyPressEvent to allow tabbing between widgets"""
        if event.key() == Qt.Key_Tab and not event.modifiers():
            self.focusNextPrevChild(True)
        else:
            super().keyPressEvent(event)

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

    def focusInEvent(self, event):
        """Overwrite the focusInEvent to select all text"""
        super().focusInEvent(event)
        self.selectAll()


class TagWidget(QWidget):
    """
    Custom widget for editing a single tag
    """

    def __init__(self, tag_name="", tag_value="", parent=None):
        super(TagWidget, self).__init__(parent)

        self.tag_name_edit = TagTextEdit(self)
        if tag_name.strip() != "":
            self.tag_name_edit.setPlainText(tag_name)
        else:
            self.tag_name_edit.setPlaceholderText("Tag Name")
        self.tag_name_edit.setFixedHeight(TEXT_FIELD_HEIGHT)

        self.tag_value_edit = TagTextEdit(self)
        if tag_value.strip() != "":
            self.tag_value_edit.setPlainText(tag_value)
        else:
            self.tag_value_edit.setPlaceholderText("Tag Value")
        self.tag_value_edit.setFixedHeight(TEXT_FIELD_HEIGHT)

        self.remove_button = QPushButton("Remove", self)
        self.remove_button.setObjectName("removeButton")

        # self.remove_button.setStyleSheet("background-color: #FF0000; color: #FFFFFF;")

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
        except:
            pass

    def remove_self(self):
        """Removes itself from the parent layout"""
        try:
            self.deleteLater()
        except:
            pass

    def get_values(self):
        """Returns the values of the tag_name_edit and tag_value_edit"""
        return self.tag_name_edit.toPlainText(), self.tag_value_edit.toPlainText()


class ImageEditorGUI(QWidget):
    """
    Main GUI for editing images MetaData
    """

    def __init__(self):
        """Initialize the GUI"""
        super().__init__()

        self.setWindowIcon(QIcon(ICON_PATH))
        self.image_path = None
        self.tag_widgets = []

        self.initUI()

    def initUI(self):
        """Initialize the UI"""
        self.image_label = QLabel(self)
        self.image_label.setAlignment(Qt.AlignCenter)

        self.add_button = QPushButton("Add Tag", self)
        self.add_standard_button = QPushButton("Add Standard", self)
        self.load_button = QPushButton("Load Image", self)
        self.save_button = QPushButton("Save Image", self)

        # Add Buttons to the bottom of the layout
        button_layout = QHBoxLayout()
        button_layout.addWidget(self.add_button)
        button_layout.addWidget(self.add_standard_button)
        button_layout.addWidget(self.load_button)
        button_layout.addWidget(self.save_button)
        button_layout.setSpacing(15)

        # Create a ScrollArea
        self.scroll_area = QScrollArea(self)
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)

        # Create a widget for the ScrollArea
        self.scroll_widget = QWidget()
        self.scroll_area.setWidget(self.scroll_widget)

        # Create a layout for the ScrollArea widget
        self.scroll_layout = QVBoxLayout(self.scroll_widget)
        self.scroll_layout.addWidget(self.image_label)

        # Add all to Mainlayout
        layout = QVBoxLayout()
        layout.addLayout(button_layout)
        layout.addWidget(self.scroll_area)

        # Connect Buttons to functions
        self.add_button.clicked.connect(self.add_tag)
        self.add_standard_button.clicked.connect(self.add_standard_tag)
        self.load_button.clicked.connect(self.load_image)
        self.save_button.clicked.connect(self.save_image)

        self.setLayout(layout)

    def update_window_title(self):
        """Updates the window title to include the image name"""
        if self.image_path is not None:
            filename = os.path.basename(self.image_path)
            self.setWindowTitle(f"MetaData Editor ({filename})")
        else:
            self.setWindowTitle("MetaData Editor")

    def add_tag(self):
        """Adds a new TagWidget to the ScrollArea"""
        tag_widget = TagWidget()
        self.tag_widgets.append(tag_widget)

        self.scroll_layout.addWidget(tag_widget)

    def add_standard_tag(self):
        """Adds a new TagWidget with standard values to the ScrollArea"""
        # Create a TagWidget with standard values
        tag_widget = TagWidget(
            tag_name="STARTDATE", tag_value=CURRENT_DATE.strftime("%d.%m.%Y")
        )

        tag_widget2 = TagWidget(
            tag_name="ENDDATE",
            tag_value=(CURRENT_DATE + timedelta(days=7)).strftime("%d.%m.%Y"),
        )

        self.tag_widgets.append(tag_widget)
        self.tag_widgets.append(tag_widget2)

        # Insert the new TagWidget before the last item (save_button)
        self.scroll_layout.addWidget(tag_widget)
        self.scroll_layout.addWidget(tag_widget2)

    def load_image(self):
        """Opens a file dialog to select an image and adds it with metadata to the ScrollArea"""
        try:
            options = QFileDialog.Options()
            options |= QFileDialog.ReadOnly
            file_dialog = QFileDialog()
            file_dialog.setFileMode(QFileDialog.ExistingFile)
            file_dialog.setNameFilter(f"{IMAGE_FORMATS};;{VIDEO_FORMATS}")
            if file_dialog.exec_():
                selected_files = file_dialog.selectedFiles()
                if selected_files:
                    self.image_path = selected_files[0]
                    self.display_image(self.image_path)

                    for tag_widget in self.tag_widgets:
                        tag_widget.remove_self()

                    self.update_window_title()

            meta_datas = read_metadata(self.image_path)
            for key, value in meta_datas.items():
                tag_widget = TagWidget()
                tag_widget.set_values(key, value)
                self.tag_widgets.append(tag_widget)

                self.scroll_layout.addWidget(tag_widget)
        except:
            pass

    def save_image(self):
        """Opens a file dialog to select a location to save the image with metadata"""
        if self.image_path is not None:
            options = QFileDialog.Options()
            file_dialog = QFileDialog.getSaveFileName(
                self,
                "Save Image",
                "",
                f"{IMAGE_FORMATS};;{VIDEO_FORMATS}",
                options=options,
            )
            if file_dialog[0]:
                metadata_dict = {}
                for tag_widget in self.tag_widgets:
                    try:
                        tag_name, tag_value = tag_widget.get_values()
                        metadata_dict[tag_name] = tag_value
                    except:
                        pass
                write_metadata(self.image_path, file_dialog[0], metadata_dict)

    def display_image(self, image_path):
        """Displays the image in the image_label"""
        if image_path.lower().endswith(".gif"):
            movie = QMovie(image_path)
            self.image_label.setMovie(movie)
            movie.start()
        else:
            pixmap = QPixmap(image_path)
            pixmap = pixmap.scaledToWidth(self.image_label.width())
            self.image_label.setPixmap(pixmap)


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    app = QApplication(sys.argv + ["-platform", "windows:darkmode=1"])
    # app.setStyle("Fusion")
    app_icon = QIcon(ICON_PATH)
    app.setWindowIcon(app_icon)

    load_styles(app)

    editor = ImageEditorGUI()
    editor.setWindowTitle("MetaData Editor")
    editor.setGeometry(100, 100, 800, 600)
    editor.show()
    sys.exit(app.exec_())
