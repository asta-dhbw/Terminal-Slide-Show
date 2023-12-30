""" Main GUI that helps editing images MetaData """
import os
import sys
import platform
import logging
from datetime import datetime, timedelta
from PyQt5.QtWidgets import (  # pylint: disable=no-name-in-module
    QApplication,
    QWidget,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QHBoxLayout,
    QScrollArea,
    QSizePolicy,
    QFileDialog,
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QMovie, QPixmap, QIcon

from custom_widgets import TagWidget

from image_metadata_handler import read_metadata, write_metadata

# Constants
SCRIPT_DIR_PATH = os.path.dirname(os.path.abspath(__file__))
CURRENT_DATE = datetime.now().date()
ICON_PATH = f"{SCRIPT_DIR_PATH}/favicon.ico"
DARKMODE_SYTLE_SHEET = f"{SCRIPT_DIR_PATH}/darkmode_style.qss"
LIGHTMODE_SYTLE_SHEET = f"{SCRIPT_DIR_PATH}/lightmode_style.qss"

IMAGE_FORMATS = "Images (*.png *.jpg *.bmp *.jpeg *.gif)"
VIDEO_FORMATS = "Videos (*.mp4 *.avi *.mkv *.flv *.mov)"


def load_styles(self, file):
    """Loads the styles from stylefiles to the application"""
    with open(file, "r", encoding="utf-8") as file:
        style = file.read()
        self.setStyleSheet(style)


class ImageEditorGUI(QWidget):
    """
    Main GUI Window for editing images MetaData
    """

    def __init__(self):
        """Initialize the GUI"""
        super().__init__()

        self.setWindowIcon(QIcon(ICON_PATH))
        self.image_path = None
        self.tag_widgets = []

        self.init_ui()

    def init_ui(self):
        """Setup the UI"""
        # Create a label for the image
        self.image_label = QLabel(self)
        self.image_label.setAlignment(Qt.AlignTop)

        # Create Buttons
        self.mode_switch = QPushButton("Switch Mode", self)
        self.add_button = QPushButton("Add Tag", self)
        self.add_standard_button = QPushButton("Add Standard", self)
        self.load_button = QPushButton("Load Image", self)
        self.save_button = QPushButton("Save Image", self)

        # Add Buttons to the bottom of the layout
        button_layout = QHBoxLayout()
        button_layout.addWidget(self.mode_switch)
        button_layout.addWidget(self.add_button)
        button_layout.addWidget(self.add_standard_button)
        button_layout.addWidget(self.load_button)
        button_layout.addWidget(self.save_button)
        button_layout.setSpacing(15)

        # Connect Buttons to functions
        self.mode_switch.clicked.connect(self.switch_mode)
        self.add_button.clicked.connect(self.add_tag)
        self.add_standard_button.clicked.connect(self.add_standard_tag)
        self.load_button.clicked.connect(self.load_image)
        self.save_button.clicked.connect(self.save_image)

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

        # Start GUI
        self.setLayout(layout)

    def update_window_title(self):
        """Updates the window-title-bar to include the image name"""
        if self.image_path is not None:
            filename = os.path.basename(self.image_path)
            self.setWindowTitle(f"MetaData Editor ({filename})")
        else:
            self.setWindowTitle("MetaData Editor")

    def switch_mode(self):
        """Switches between light and dark mode"""
        if self.mode_switch.text() == "Switch to Light Mode":
            load_styles(self, DARKMODE_SYTLE_SHEET)
            self.mode_switch.setText("Switch to Dark Mode")
        else:
            load_styles(self, LIGHTMODE_SYTLE_SHEET)
            self.mode_switch.setText("Switch to Light Mode")

    def add_tag(self):
        """Adds a new TagWidget to the ScrollArea"""
        tag_widget = TagWidget()
        # Insert at the beginning of the list
        self.tag_widgets.append(tag_widget)
        self.scroll_layout.insertWidget(1, tag_widget)

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

        # Insert the new TagWidget before the first items
        self.scroll_layout.insertWidget(1, tag_widget)
        self.scroll_layout.insertWidget(2, tag_widget2)

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

            # adding tags
            meta_datas = read_metadata(self.image_path)
            for key, value in meta_datas.items():
                tag_widget = TagWidget(tag_name=key, tag_value=value)
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

            # Get and save Metadata
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
            pixmap = pixmap.scaled(
                self.image_label.width(), self.height(), Qt.KeepAspectRatio
            )
            self.image_label.setPixmap(pixmap)
            self.image_path = image_path

    def resizeEvent(self, event):
        """Resizes the image when the window is resized"""
        if (
            hasattr(self, "image_path") and self.image_path
        ):  # Check if an image has been loaded
            pixmap = QPixmap(self.image_path)
            pixmap = pixmap.scaled(
                self.scroll_area.width(), self.scroll_area.height(), Qt.KeepAspectRatio
            )
            self.image_label.setPixmap(pixmap)
        super().resizeEvent(event)  # Call the parent class's resizeEvent method


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    if platform.system() == "Windows":
        app = QApplication(sys.argv + ["-platform", "windows:darkmode=1"])
    else:
        app = QApplication(sys.argv)
    # app.setStyle("Fusion")
    app_icon = QIcon(ICON_PATH)
    app.setWindowIcon(app_icon)

    load_styles(app, DARKMODE_SYTLE_SHEET)

    editor = ImageEditorGUI()
    editor.setWindowTitle("MetaData Editor")
    editor.setGeometry(100, 100, 800, 600)
    editor.show()
    sys.exit(app.exec_())
