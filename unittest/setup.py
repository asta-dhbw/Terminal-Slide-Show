""" This file is used to add the project path to the sys.path so that the tests can be run from the root directory. """
import os
import sys

PARENT_DIRECTORY_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PARENT_DIRECTORY_PATH)
