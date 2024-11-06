#!/bin/bash

# Disclaimer: This script is provided as-is and without warranty. Use at your own risk.
# This script is intended to be run on a fresh Debian installation to set up a kiosk user.
# It will create a new user, set up autologin, and configure autostart of a kiosk script.
# The script should be run as root or with sudo privileges.

# Source the logger
[ ! -f "$(dirname "${BASH_SOURCE[0]}")/logger.sh" ] && { echo "logger.sh not found"; exit 1; }
source "$(dirname "${BASH_SOURCE[0]}")/logger.sh"

USER="kiosk"
PASSWORD='!SECURE@PASSWORD!'

# Get the directory where the installer script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/kiosk_installer.log"

# Initialize logging with custom settings
init_logging "$LOG_DIR" "$LOG_FILE" "DEBUG"

# Step 1: Check and install required packages
log_info "Checking and installing required packages..."
PACKAGES="xorg firefox-esr openbox x11-xserver-utils xdotool unclutter procps ncurses-bin xinit"
failed_packages=()

for pkg in $PACKAGES; do
    if ! dpkg -l | awk '{print $2}' | grep -q "^$pkg$"; then
        log_info "Installing $pkg..."
        if ! sudo apt-get install -y "$pkg"; then
            log_error "Failed to install package: $pkg"
            failed_packages+=("$pkg")
        fi
    fi
done

if [ ${#failed_packages[@]} -ne 0 ]; then
    log_error "Failed to install the following packages:"
    for pkg in "${failed_packages[@]}"; do
        log_error "  - $pkg"
    done
    log_error "Please check your internet connection and package repositories"
    exit 1
fi

log_info "All required packages installed successfully"

# Step 1.2: Check if user exists
if id "$USER" &>/dev/null; then
    log_warn "User $USER already exists"
else
    # Create the user with no password and no sudo privileges
    log_info "Creating user: $USER"
    sudo adduser --disabled-password --gecos "" "$USER"

    # Set the password using printf to handle special characters
    log_info "Setting password for user: $USER"
    printf "%s:%s" "$USER" "$PASSWORD" | sudo chpasswd
fi

# Step 2: Add the kiosk user to groups needed for network access
log_info "Adding user to groups: netdev, video, audio"
sudo usermod -aG netdev,video,audio "$USER"


# Step 3: Copy kiosk.sh from installer directory to user's home
if [ -f "$SCRIPT_DIR/kiosk.sh" ]; then
    log_info "Copying kiosk.sh to user's home directory"
    sudo cp "$SCRIPT_DIR/kiosk.sh" "/home/$USER/"
    sudo cp "$SCRIPT_DIR/logger.sh" "/home/$USER/"
    sudo chown "$USER:$USER" "/home/$USER/kiosk.sh"
    sudo chown "$USER:$USER" "/home/$USER/logger.sh"
    sudo chmod +x "/home/$USER/kiosk.sh"
else
    log_error "Error: kiosk.sh not found in $SCRIPT_DIR"
    exit 1
fi

# Step 4: Set up autologin for the kiosk user

#for auto login sudoer is required
sudo usermod -aG sudo "$USER"

# Edit the lightdm config for autologin (Debian typically uses LightDM for graphical login)
log_info "Configuring LightDM autologin for user: $USER"
if [ -f /etc/lightdm/lightdm.conf ]; then
    log_debug "Modifying existing LightDM configuration"
    sudo sed -i "s/^autologin-user=.*/autologin-user=$USER/" /etc/lightdm/lightdm.conf
    if [ $? -ne 0 ]; then
        log_error "Failed to update LightDM configuration"
        exit 1
    fi
else
    log_debug "Creating new LightDM configuration"
    echo "[Seat:*]" | sudo tee /etc/lightdm/lightdm.conf > /dev/null
    echo "autologin-user=$USER" | sudo tee -a /etc/lightdm/lightdm.conf > /dev/null
    if [ $? -ne 0 ]; then
        log_error "Failed to create LightDM configuration"
        exit 1
    fi
fi

# TTY Autologin Configuration
TTY_CONFIG_DIR="/etc/systemd/system/getty@tty1.service.d"
TTY_CONFIG_FILE="$TTY_CONFIG_DIR/autologin.conf"

# Only configure TTY autologin if the directory already exists
if [ -d "$TTY_CONFIG_DIR" ]; then
    log_debug "Configuring TTY autologin"

    # Create or update TTY autologin configuration
    cat << EOF | sudo tee "$TTY_CONFIG_FILE" > /dev/null
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I \$TERM
EOF

    if [ $? -ne 0 ]; then
        log_error "Failed to configure TTY autologin"
        exit 1
    fi

    # Reload systemd daemon and restart getty service
    log_debug "Reloading systemd configuration"
    sudo systemctl daemon-reload
    sudo systemctl restart getty@tty1.service
    
    log_info "TTY autologin configuration completed successfully"
fi

log_info "Autologin configuration completed successfully"

# Step 5: Configure autostart in user profile
log_info "Configuring autostart in user profile"
PROFILE_PATH="/home/$USER"
PROFILE_LINE="$PROFILE_PATH/kiosk.sh"

# Check which profile file exists and should be used
if [ -f "$PROFILE_PATH/.bash_profile" ]; then
    PROFILE_FILE="$PROFILE_PATH/.bash_profile"
elif [ -f "$PROFILE_PATH/.profile" ]; then
    PROFILE_FILE="$PROFILE_PATH/.profile"
else
    PROFILE_FILE="$PROFILE_PATH/.profile"
    log_info "Creating new .profile file"
    sudo touch "$PROFILE_FILE"
fi

# Check if startup command already exists
if ! grep -q "^$PROFILE_LINE" "$PROFILE_FILE"; then
    log_info "Adding kiosk startup to $PROFILE_FILE"
    echo "$PROFILE_LINE" | sudo tee -a "$PROFILE_FILE" > /dev/null
    sudo chown "$USER:$USER" "$PROFILE_FILE"
    sudo chmod 644 "$PROFILE_FILE"
else
    log_debug "Startup command already exists in $PROFILE_FILE"
fi

log_info "Kiosk user created successfully. Please reboot the system to apply changes."

#TODO:
# Step X:  remove more priviliges of kiosk user
#############
