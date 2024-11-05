#!/bin/bash

#usage: sudo ./install.sh "http://your-url-here"

# Configuration variables
KIOSK_URL=${1:-"http://195.90.223.88:5173/"}  # Default URL if none provided
KIOSK_USER="kiosk-user"
INSTALL_DIR="/usr/bin"
LOG_DIR="/var/log"

# File paths
LOG_FILE="${LOG_DIR}/kiosk_setup.log"
KIOSK_LOG="${LOG_DIR}/kiosk.log"
KIOSK_SCRIPT="${INSTALL_DIR}/kiosk.sh"
UNINSTALL_SCRIPT="${INSTALL_DIR}/uninstall-kiosk.sh"
OPENBOX_CONFIG_DIR="/home/${KIOSK_USER}/.config/openbox"

# Package dependencies
PACKAGES="chromium-browser xserver-xorg x11-xserver-utils xinit openbox unclutter"

# Logging function
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Validate URL
if [[ ! $KIOSK_URL =~ ^https?:// ]]; then
    log "Error: Invalid URL format. Please provide a URL starting with http:// or https://"
    exit 1
fi

# Start installation
log "Starting kiosk installation..."

# Update system
log "Updating system packages..."
sudo apt update >> "$LOG_FILE" 2>&1
sudo apt install -y $PACKAGES >> "$LOG_FILE" 2>&1

# Create kiosk launcher with logging
log "Creating kiosk launcher..."
sudo tee "$KIOSK_SCRIPT" > /dev/null << EOF
#!/bin/bash

# Setup logging
KIOSK_LOG="${KIOSK_LOG}"

log() {
    local timestamp=\$(date '+%Y-%m-%d %H:%M:%S')
    echo "[\$timestamp] \$1" >> "\$KIOSK_LOG"
}

log "Starting kiosk..."

# Wait for X server to be ready
sleep 10
log "X server wait complete"

# Disable screen blanking and power management
xset -dpms
xset s off
xset s noblank
log "Screen settings configured"

# Hide mouse cursor
unclutter -idle 0 &
log "Mouse cursor hidden"

# Launch Chromium in kiosk mode
log "Launching Chromium..."
chromium-browser \\
  --noerrdialogs \\
  --disable-infobars \\
  --kiosk \\
  --disable-features=TranslateUI \\
  --disable-pinch \\
  --overscroll-history-navigation=0 \\
  --disable-features=TouchpadOverscrollHistoryNavigation \\
  "${KIOSK_URL}" >> "\$KIOSK_LOG" 2>&1
EOF

# Create uninstall script
log "Creating uninstall script..."
sudo tee "$UNINSTALL_SCRIPT" > /dev/null << EOF
#!/bin/bash

LOG_FILE="${LOG_DIR}/kiosk_uninstall.log"
PACKAGES="${PACKAGES}"
KIOSK_SCRIPT="${KIOSK_SCRIPT}"
OPENBOX_CONFIG_DIR="${OPENBOX_CONFIG_DIR}"
KIOSK_LOG="${KIOSK_LOG}"
LOG_FILE="${LOG_FILE}"

log() {
    local timestamp=\$(date '+%Y-%m-%d %H:%M:%S')
    echo "[\$timestamp] \$1" | tee -a "\$LOG_FILE"
}

log "Starting kiosk uninstallation..."

# Disable and remove service
log "Stopping and removing kiosk service..."
sudo systemctl stop kiosk.service
sudo systemctl disable kiosk.service
sudo rm /etc/systemd/system/kiosk.service

# Remove scripts and configs
log "Removing kiosk files..."
sudo rm "\$KIOSK_SCRIPT"
sudo rm -rf "\$OPENBOX_CONFIG_DIR"
sudo rm "\$KIOSK_LOG"
sudo rm "\$LOG_FILE"

# Optional: Remove installed packages
read -p "Remove installed packages? (y/n) " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]$ ]]
then
    log "Removing installed packages..."
    sudo apt remove -y \$PACKAGES
    sudo apt autoremove -y
fi

log "Uninstallation complete"
echo "Please reboot the system to complete uninstallation"
EOF

# Make scripts executable
log "Setting permissions..."
sudo chmod +x "$KIOSK_SCRIPT"
sudo chmod +x "$UNINSTALL_SCRIPT"

# Create systemd service
log "Creating systemd service..."
sudo tee /etc/systemd/system/kiosk.service > /dev/null << EOF
[Unit]
Description=Chromium Kiosk
Wants=graphical.target
After=graphical.target

[Service]
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/${KIOSK_USER}/.Xauthority
User=${KIOSK_USER}
ExecStart=/usr/bin/startx ${KIOSK_SCRIPT}
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

# Enable service
log "Enabling kiosk service..."
sudo systemctl enable kiosk.service

log "Installation complete"
echo "Kiosk installed with URL: ${KIOSK_URL}"
echo "To uninstall later, run: sudo ${UNINSTALL_SCRIPT}"
echo "Rebooting in 5 seconds..."
echo "Please reboot the system to start the kiosk"