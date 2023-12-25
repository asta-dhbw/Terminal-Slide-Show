import os
import sys
from datetime import datetime, timedelta
from PyQt5.QtWidgets import (
    QApplication,
    QWidget,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QHBoxLayout,
    QTextEdit,
    QFileDialog,
)
from PyQt5.QtCore import Qt, QEvent
from PyQt5.QtGui import QPixmap, QIcon, QKeyEvent

from metadata_editor import read_metadata, write_metadata


# Constants
SCRIPT_DIR_PATH = os.path.dirname(os.path.abspath(__file__))
CURRENT_DATE = datetime.now().date()
ICON_PATH = f"{SCRIPT_DIR_PATH}/favicon.ico"
STANDARD_STYLE_SHEET = f"{SCRIPT_DIR_PATH}/styles.qss"

TEXT_FIELD_HEIGHT = 50

IMAGE_FORMATS = "Images (*.png *.jpg *.bmp)"


class TagTextEdit(QTextEdit):
    """
    Custom QTextEdit that allows tabbing between widgets
    """

    def keyPressEvent(self, event):
        if event.key() == Qt.Key_Tab and not event.modifiers():
            self.focusNextPrevChild(True)
        else:
            super().keyPressEvent(event)

    def event(self, event):
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
        self.remove_button.setStyleSheet("background-color: #FF0000; color: #FFFFFF;")

        tag_layout = QHBoxLayout()
        tag_layout.addWidget(self.tag_name_edit)
        tag_layout.addWidget(self.tag_value_edit)
        tag_layout.addWidget(self.remove_button)
        tag_layout.setSpacing(10)

        self.setLayout(tag_layout)

        self.remove_button.clicked.connect(self.remove_self)
        self.setTabOrder(self.tag_name_edit, self.tag_value_edit)

    def set_values(self, tag_name, tag_value):
        self.tag_name_edit.setPlainText(tag_name)
        self.tag_value_edit.setPlainText(tag_value)

    def clear_fields(self):
        try:
            self.tag_name_edit.clear()
            self.tag_value_edit.clear()
        except:
            pass

    def remove_self(self):
        try:
            self.deleteLater()
        except:
            pass

    def get_values(self):
        return self.tag_name_edit.toPlainText(), self.tag_value_edit.toPlainText()


class ImageEditorGUI(QWidget):
    """
    Main GUI for editing images MetaData
    """

    def __init__(self):
        super().__init__()

        self.setWindowIcon(QIcon(ICON_PATH))
        self.image_path = None
        self.tag_widgets = []

        self.initUI()

    def initUI(self):
        self.image_label = QLabel(self)
        self.image_label.setAlignment(Qt.AlignCenter)

        self.add_button = QPushButton("Add Tag", self)
        self.add_standard_button = QPushButton("Add Standard", self)
        self.load_button = QPushButton("Load Image", self)
        self.save_button = QPushButton("Save Image", self)

        # Add Buttons to the bottom of the layout
        button_layout = QVBoxLayout()
        button_layout.addWidget(self.add_button)
        button_layout.addWidget(self.add_standard_button)
        button_layout.addWidget(self.load_button)
        button_layout.addWidget(self.save_button)
        button_layout.setSpacing(15)

        # Add all to Mainlayout
        layout = QVBoxLayout()
        layout.addWidget(self.image_label)
        layout.addLayout(button_layout)

        # Connect Buttons to functions
        self.add_button.clicked.connect(self.add_tag)
        self.add_standard_button.clicked.connect(self.add_standard_tag)
        self.load_button.clicked.connect(self.load_image)
        self.save_button.clicked.connect(self.save_image)

        self.setLayout(layout)

    def add_tag(self):
        tag_widget = TagWidget()
        self.tag_widgets.append(tag_widget)

        layout = self.layout()
        layout.insertWidget(layout.count() - 1, tag_widget)

    def add_standard_tag(self):
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
        layout = self.layout()
        layout.insertWidget(layout.count() - 1, tag_widget)
        layout.insertWidget(layout.count() - 1, tag_widget2)

    def load_image(self):
        options = QFileDialog.Options()
        options |= QFileDialog.ReadOnly
        file_dialog = QFileDialog()
        file_dialog.setFileMode(QFileDialog.ExistingFile)
        file_dialog.setNameFilter(IMAGE_FORMATS)
        if file_dialog.exec_():
            selected_files = file_dialog.selectedFiles()
            if selected_files:
                self.image_path = selected_files[0]
                self.display_image(self.image_path)

                for tag_widget in self.tag_widgets:
                    tag_widget.remove_self()

        meta_datas = read_metadata(self.image_path)
        for key, value in meta_datas.items():
            tag_widget = TagWidget()
            tag_widget.set_values(key, value)
            self.tag_widgets.append(tag_widget)

            layout = self.layout()
            layout.insertWidget(layout.count() - 1, tag_widget)

    def save_image(self):
        if self.image_path is not None:
            options = QFileDialog.Options()
            options |= QFileDialog.DontUseNativeDialog
            file_dialog = QFileDialog.getSaveFileName(
                self, "Save Image", "", IMAGE_FORMATS, options=options
            )
            if file_dialog[0]:
                metadata_dict = {}
                for tag_widget in self.tag_widgets:
                    try:
                        tag_name, tag_value = tag_widget.get_values()
                        metadata_dict[tag_name] = tag_value
                    except:
                        pass
                print(metadata_dict)
                write_metadata(self.image_path, file_dialog[0], metadata_dict)

    def display_image(self, image_path):
        pixmap = QPixmap(image_path)
        pixmap = pixmap.scaledToWidth(self.image_label.width())
        self.image_label.setPixmap(pixmap)


if __name__ == "__main__":
    app = QApplication(sys.argv + ["-platform", "windows:darkmode=1"])
    # app.setStyle("Fusion")
    app_icon = QIcon(ICON_PATH)
    app.setWindowIcon(app_icon)

    with open(STANDARD_STYLE_SHEET, "r", encoding="UTF-8") as fh:
        app.setStyleSheet(fh.read())

    editor = ImageEditorGUI()
    editor.setWindowTitle("MetaData Editor")
    editor.setGeometry(100, 100, 800, 600)
    editor.show()
    sys.exit(app.exec_())
