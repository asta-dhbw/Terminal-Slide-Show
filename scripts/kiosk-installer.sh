#!/bin/bash

# Disclaimer: This script is provided as-is and without warranty. Use at your own risk.
# This script is intended to be run on a fresh Debian installation to set up a kiosk user.
# It will create a new user, set up autologin, and configure autostart of a kiosk script.
# The script should be run as root or with sudo privileges.

# Source the logger
source "$(dirname "${BASH_SOURCE[0]}")/project-utils.sh"

# Get directory where script is located
SCRIPT_DIR="$(get_script_dir)"
PROJECT_DIR="$(find_project_dir)"
CONFIG_FILE="$PROJECT_DIR/config/config.js"


if [ -f "$CONFIG_FILE" ]; then
    # Extract values using grep and sed
    KIOSK_USER=$(grep -A 2 "kiosk: {" "$CONFIG_FILE" | grep "user:" | sed "s/.*user: '\([^']*\)'.*/\1/")
    KIOSK_PASSWORD=$(grep -A 3 "kiosk: {" "$CONFIG_FILE" | grep "password:" | sed "s/.*password: '\([^']*\)'.*/\1/")
    TARGET_URL=$(grep -A 1 "kiosk: {" "$CONFIG_FILE" | grep "targetUrl:" | sed "s/.*targetUrl: '\([^']*\)'.*/\1/")

fi

# Use config values if available, otherwise use defaults
KIOSK_USERNAME="${KIOSK_USER:-kiosk}"
PASSWORD="${KIOSK_PASSWORD:-!SECURE@PASSWORD!}"
TARGET_URL="${TARGET_URL:-https://www.google.com}"


# Initialize logging with custom settings
init_project_logging "kiosk_installer"


MODE_WEB="web"
MODE_TERMINAL="terminal"
SELECTED_MODE=""

select_mode() {
    local selected=0
    local options=("Web Browser Kiosk" "Terminal Only")
    
    # Hide cursor
    tput civis
    
    while true; do
        # Clear previous menu
        printf "\033[2K\r"
        echo "Select kiosk mode:"
        echo
        
        # Display options
        for i in "${!options[@]}"; do
            if [ $i -eq $selected ]; then
                echo "→ ${options[$i]}"
            else
                echo "  ${options[$i]}"
            fi
        done
        
        # Move cursor up to redraw menu
        printf "\033[%dA" $((${#options[@]} + 2))
        
        # Read single character
        read -rsn1 key
        
        case "$key" in
            $'\x1B')  # ESC sequence
                read -rsn2 key
                case "$key" in
                    '[A') # Up arrow
                        ((selected--))
                        [ $selected -lt 0 ] && selected=$((${#options[@]} - 1))
                        ;;
                    '[B') # Down arrow
                        ((selected++))
                        [ $selected -ge ${#options[@]} ] && selected=0
                        ;;
                esac
                ;;
            '') # Enter key
                printf "\033[%dB\n" $((${#options[@]} + 2))
                tput cnorm   # Show cursor
                if [ $selected -eq 0 ]; then
                    SELECTED_MODE=$MODE_WEB
                else
                    SELECTED_MODE=$MODE_TERMINAL
                fi
                return
                ;;
        esac
    done
}

select_mode

log_info "Selected mode: $SELECTED_MODE"

# Step 1: Check and install required packages
log_info "Checking and installing required packages..."

# Modify package installation based on mode
if [ "$SELECTED_MODE" = "$MODE_WEB" ]; then
    PACKAGES="xorg firefox openbox x11-xserver-utils xdotool unclutter procps ncurses-bin xinit"
else
    PACKAGES="mpv socat inotify-tools nodejs jq"
fi

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
if id "$KIOSK_USERNAME" &>/dev/null; then
    log_warn "User $KIOSK_USERNAME already exists"
else
    # Create the user with no password and no sudo privileges
    log_info "Creating user: $KIOSK_USERNAME"
    sudo adduser --disabled-password --gecos "" "$KIOSK_USERNAME"

    # Set the password using printf to handle special characters
    log_info "Setting password for user: $KIOSK_USERNAME"
    printf "%s:%s" "$KIOSK_USERNAME" "$PASSWORD" | sudo chpasswd
fi

# Step 2: Add the kiosk user to groups needed for network access
log_info "Adding user to groups: netdev, video, audio"
sudo usermod -aG netdev,video,audio "$KIOSK_USERNAME"
if [ "$SELECTED_MODE" = "$MODE_WEB" ]; then
    kiosk_script="kiosk.sh"
elif [ "$SELECTED_MODE" = "$MODE_TERMINAL" ]; then
    kiosk_script="terminal-slide-show.sh"
    
    # Copy additional files needed for terminal mode
    log_info "Copying server folder, package.json and config folder"
    sudo cp -r "$SCRIPT_DIR/server" "/home/$KIOSK_USERNAME/"
    sudo cp "$SCRIPT_DIR/package.json" "/home/$KIOSK_USERNAME/"
    sudo cp -r "$SCRIPT_DIR/config" "/home/$KIOSK_USERNAME/"
    
    # Set permissions for additional files
    sudo chown -R "$KIOSK_USERNAME:$KIOSK_USERNAME" "/home/$KIOSK_USERNAME/server"
    sudo chown "$KIOSK_USERNAME:$KIOSK_USERNAME" "/home/$KIOSK_USERNAME/package.json"
    sudo chown -R "$KIOSK_USERNAME:$KIOSK_USERNAME" "/home/$KIOSK_USERNAME/config"
else
    log_error "Invalid mode selected: $SELECTED_MODE"
    exit 1
fi

# Step 3: Copy and modify $kiosk_script from installer directory to user's home
if [ -f "$SCRIPT_DIR/$kiosk_script" ]; then
    log_info "Copying $kiosk_script to user's home directory"
    sudo cp "$SCRIPT_DIR/$kiosk_script" "/home/$KIOSK_USERNAME/"
    sudo cp "$SCRIPT_DIR/logger.sh" "/home/$KIOSK_USERNAME/"
    sudo cp "$SCRIPT_DIR/network-manager.sh" "/home/$KIOSK_USERNAME/"
    sudo cp "$SCRIPT_DIR/project-utils.sh" "/home/$KIOSK_USERNAME/"
    
    # Update TARGET_URL in $kiosk_script
    log_info "Updating TARGET_URL in $kiosk_script to: $TARGET_URL"
    sudo sed -i "s|^TARGET_URL=.*|TARGET_URL=\"$TARGET_URL\"|" "/home/$KIOSK_USERNAME/$kiosk_script"
    
    # Set correct permissions
    sudo chown "$KIOSK_USERNAME:$KIOSK_USERNAME" "/home/$KIOSK_USERNAME/$kiosk_script"
    sudo chown "$KIOSK_USERNAME:$KIOSK_USERNAME" "/home/$KIOSK_USERNAME/logger.sh"
    sudo chown "$KIOSK_USERNAME:$KIOSK_USERNAME" "/home/$KIOSK_USERNAME/network-manager.sh"
    sudo chown "$KIOSK_USERNAME:$KIOSK_USERNAME" "/home/$KIOSK_USERNAME/project-utils.sh"
    sudo chmod +x "/home/$KIOSK_USERNAME/$kiosk_script"
    sudo chmod +x "/home/$KIOSK_USERNAME/network-manager.sh"
else
    log_error "Error: $kiosk_script script not found in $SCRIPT_DIR"
    exit 1
fi

# Step 4: Set up autologin for the kiosk user

#for auto login sudoer is required
sudo usermod -aG sudo "$KIOSK_USERNAME"

# Edit the lightdm config for autologin (Debian typically uses LightDM for graphical login)
log_info "Configuring LightDM autologin for user: $KIOSK_USERNAME"
if [ -f /etc/lightdm/lightdm.conf ]; then
    log_debug "Modifying existing LightDM configuration"
    sudo sed -i "s/^autologin-user=.*/autologin-user=$KIOSK_USERNAME/" /etc/lightdm/lightdm.conf
    if [ $? -ne 0 ]; then
        log_error "Failed to update LightDM configuration"
        exit 1
    fi
else
    log_debug "Creating new LightDM configuration"
    echo "[Seat:*]" | sudo tee /etc/lightdm/lightdm.conf > /dev/null
    echo "autologin-user=$KIOSK_USERNAME" | sudo tee -a /etc/lightdm/lightdm.conf > /dev/null
    if [ $? -ne 0 ]; then
        log_error "Failed to create LightDM configuration"
        exit 1
    fi
fi

# TTY Autologin Configuration
TTY_CONFIG_DIR="/etc/systemd/system/getty@tty1.service.d"
TTY_CONFIG_FILE="$TTY_CONFIG_DIR/autologin.conf"

log_debug "Configuring TTY autologin"
sudo mkdir -p "$TTY_CONFIG_DIR"

# Create or update TTY autologin configuration
cat << EOF | sudo tee "$TTY_CONFIG_FILE" > /dev/null
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $KIOSK_USERNAME --noclear %I \$TERM
EOF

if [ $? -ne 0 ]; then
    log_error "Failed to configure TTY autologin"
    exit 1
fi

# Reload systemd daemon and restart getty service
log_debug "Reloading systemd configuration"
sudo systemctl daemon-reload
sudo systemctl restart getty@tty1.service

log_info "Autologin configuration completed successfully"

# Step 5: Configure autostart in user profile
log_info "Configuring autostart in user profile"
PROFILE_PATH="/home/$KIOSK_USERNAME"
PROFILE_LINE="$PROFILE_PATH/$kiosk_script"

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
if ! grep -q "^$PROFILE_LINE" "$PROFILE_FILE"; then sudo sed -i "s|^TARGET_URL=.*|TARGET_URL=\"$TARGET_URL\"|" "/home/$KIOSK_USERNAME/$kiosk_script"
    log_info "Adding kiosk startup to $PROFILE_FILE"
    echo "$PROFILE_LINE" | sudo tee -a "$PROFILE_FILE" > /dev/null
    sudo chown "$KIOSK_USERNAME:$KIOSK_USERNAME" "$PROFILE_FILE"
    sudo chmod 644 "$PROFILE_FILE"
else
    log_debug "Startup command already exists in $PROFILE_FILE"
fi

log_info "Kiosk user created successfully. Please reboot the system to apply changes."