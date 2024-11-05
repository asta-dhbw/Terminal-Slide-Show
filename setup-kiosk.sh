#!/bin/bash

# Install required packages
apt-get update
apt-get install -y \
    xorg \
    openbox \
    chromium \
    unclutter \
    x11-xserver-utils \
    lightdm

# Create a kiosk user without password
useradd -m kiosk
passwd -d kiosk

# Create autostart script for Openbox
mkdir -p /home/kiosk/.config/openbox
cat > /home/kiosk/.config/openbox/autostart << EOF
# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide mouse cursor after 3 seconds of inactivity
unclutter -idle 3 &

# Start Chromium in kiosk mode
chromium --kiosk --noerrdialogs --disable-translate --no-first-run \
    --disable-infobars --disable-suggestions-service --disable-save-password-bubble \
    --disable-session-crashed-bubble --disable-features=TranslateUI \
    --disable-popup-blocking --no-sandbox \
    "https://your-website-url.com" &
EOF

# Set permissions
chown -R kiosk:kiosk /home/kiosk
chmod +x /home/kiosk/.config/openbox/autostart

# Configure LightDM for autologin
cat > /etc/lightdm/lightdm.conf << EOF
[Seat:*]
autologin-user=kiosk
autologin-session=openbox
EOF

# Create Xsession file
cat > /home/kiosk/.xsession << EOF
exec openbox-session
EOF

# Set proper ownership
chown kiosk:kiosk /home/kiosk/.xsession

# Enable lightdm service
systemctl enable lightdm

# Create a service to start X on boot
cat > /etc/systemd/system/kiosk.service << EOF
[Unit]
Description=Kiosk Mode Service
After=network.target

[Service]
User=kiosk
Environment=DISPLAY=:0
ExecStart=/usr/bin/startx
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable the kiosk service
systemctl enable kiosk.service

# Set proper permissions
chmod 644 /etc/systemd/system/kiosk.service