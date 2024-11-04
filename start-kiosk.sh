#!/bin/bash

# sudo apt install -y xorg firefox-esr openbox x11-xserver-utils

startx /usr/bin/openbox-session -- vt1 &
sleep 3
DISPLAY=:0 firefox --kiosk http://shape-z.de:5173/
