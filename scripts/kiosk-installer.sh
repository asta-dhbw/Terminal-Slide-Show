#!/bin/bash
#
# Kiosk System Installer
# Sets up a secure kiosk environment on Debian-based systems
# Features user creation, autologin, and mode-specific configurations
#
# Author: Muddyblack
# Date: 11.11.2024
# Version: 1.0

# -----------------------------------------------------------------------------
# Dependencies and initialization
# -----------------------------------------------------------------------------

source "$(dirname "${BASH_SOURCE[0]}")/project-utils.sh" || {
    echo "Failed to source project-utils.sh" >&2
    exit 1
}


# -----------------------------------------------------------------------------
# Constants and defaults
# -----------------------------------------------------------------------------
readonly MODE_WEB="web"
readonly MODE_TERMINAL="terminal"
readonly WEB_PACKAGES="xorg firefox openbox x11-xserver-utils xdotool unclutter procps ncurses-bin xinit"
readonly TERMINAL_PACKAGES="mpv socat inotify-tools nodejs jq npm curl"


# -----------------------------------------------------------------------------
# Configuration management
# -----------------------------------------------------------------------------
load_config() {
    local config_file="${1:?Config file path required}"
    if [ ! -f "$config_file" ]; then
        log_error "Config file not found: $config_file"
        return 1
    fi

    # Extract configuration values
    KIOSK_USER=$(grep "^KIOSK_USER=" "$config_file" | cut -d'=' -f2)
    KIOSK_PASSWORD=$(grep "^KIOSK_PASSWORD=" "$config_file" | cut -d'=' -f2)
    TARGET_URL=$(grep "^KIOSK_URL=" "$config_file" | cut -d'=' -f2)

    # Set defaults if values not found
    KIOSK_USERNAME="${KIOSK_USER:-kiosk}"
    PASSWORD="${KIOSK_PASSWORD:-!SECURE@PASSWORD!}"
    TARGET_URL="${TARGET_URL:-https://www.google.com}"
}


# -----------------------------------------------------------------------------
# Mode selection menu
# -----------------------------------------------------------------------------
select_mode() {
    local selected=0
    local -r options=("Web Browser Kiosk" "Terminal Only")
    
    tput civis  # Hide cursor
    
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
            '') # Enter
                printf "\033[%dB\n" $((${#options[@]} + 2))
                tput cnorm   # Show cursor
                SELECTED_MODE=$([ $selected -eq 0 ] && echo "$MODE_WEB" || echo "$MODE_TERMINAL")
                return 0
                ;;
        esac
    done
}

# -----------------------------------------------------------------------------
# Package management
# -----------------------------------------------------------------------------
install_packages() {
    local -r packages="$1"
    local failed_packages=()

    for pkg in $packages; do
        if ! dpkg -l | awk '{print $2}' | grep -q "^$pkg$"; then
            log_info "Installing $pkg..."
            if ! sudo apt-get install -y "$pkg"; then
                log_error "Failed to install package: $pkg"
                failed_packages+=("$pkg")
            fi
        fi
    done

    if [ ${#failed_packages[@]} -ne 0 ]; then
        log_error "Failed to install packages: ${failed_packages[*]}"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# User management
# -----------------------------------------------------------------------------
create_kiosk_user() {
    local username="$1"
    local password="$2"

    if id "$username" &>/dev/null; then
        log_warn "User $username already exists"
    else
        log_info "Creating user: $username"
        sudo adduser --disabled-password --gecos "" "$username"
        printf "%s:%s" "$username" "$password" | sudo chpasswd
    fi

    #for auto login sudoer is required
    log_info "Adding user to required groups"
    sudo usermod -aG netdev,video,audio,sudo "$username"
}

# -----------------------------------------------------------------------------
# File management
# -----------------------------------------------------------------------------
copy_kiosk_files() {
    local username="$1"
    local script_name="$2"
    local script_dir="$3"
    local home_dir="/home/$username"

    # Copy main script and utilities
    local files=(
        "$script_name"
        "logger.sh"
        "network-manager.sh"
        "project-utils.sh"
    )

    for file in "${files[@]}"; do
        if [ ! -f "$script_dir/$file" ]; then
            log_error "Required file not found: $file"
            return 1
        fi
        sudo cp "$script_dir/$file" "$home_dir/"
        sudo chown "$username:$username" "$home_dir/$file"
        [ -x "$script_dir/$file" ] && sudo chmod +x "$home_dir/$file"
    done

        # Handle web mode specific configurations
    if [ "$SELECTED_MODE" = "$MODE_WEB" ]; then
        log_info "Updating TARGET_URL in $script_name to: $TARGET_URL"
        if ! sudo sed -i "s|^readonly TARGET_URL=.*|readonly TARGET_URL=\"$TARGET_URL\"|" "$home_dir/$script_name"; then
            log_error "Failed to update TARGET_URL in $script_name"
            return 1
        fi
    fi

    # Copy additional files for terminal mode
    if [ "$SELECTED_MODE" = "$MODE_TERMINAL" ]; then
        for dir in "server" "config"; do
            sudo cp -r "$script_dir/$dir" "$home_dir/"
            sudo chown -R "$username:$username" "$home_dir/$dir"
        done
        sudo cp "$script_dir/package.json" "$home_dir/"
        sudo chown "$username:$username" "$home_dir/package.json"

        # Run npm install as kiosk user
        log_info "Installing npm dependencies..."
        if ! sudo -u "$username" bash -c "cd $home_dir && npm install"; then
            log_error "Failed to install npm dependencies"
            return 1
        fi
        log_info "npm dependencies installed successfully"
    fi
}

# -----------------------------------------------------------------------------
# Autologin configuration
# -----------------------------------------------------------------------------
configure_lightdm_autologin() {
    local username="$1"
    local config_file="/etc/lightdm/lightdm.conf"
    log_debug "Modifying existing LightDM configuration"

    if [ -f "$config_file" ]; then
        sudo sed -i "s/^autologin-user=.*/autologin-user=$username/" "$config_file"
    else
        echo "[Seat:*]" | sudo tee "$config_file" > /dev/null
        echo "autologin-user=$username" | sudo tee -a "$config_file" > /dev/null
    fi
}

configure_tty_autologin() {
    local username="$1"
    local config_dir="/etc/systemd/system/getty@tty1.service.d"
    local config_file="$config_dir/autologin.conf"
    log_debug "Configuring TTY autologin"

    sudo mkdir -p "$config_dir"
    cat << EOF | sudo tee "$config_file" > /dev/null
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $username --noclear %I \$TERM
EOF

    log_debug "Reloading systemd configuration"
    sudo systemctl daemon-reload
    sudo systemctl restart getty@tty1.service
}

# -----------------------------------------------------------------------------
# Profile configuration
# -----------------------------------------------------------------------------
configure_autostart() {
    local username="$1"
    local script_path="$2"
    local home_dir="/home/$username"

    local profile_file
    for file in ".bash_profile" ".profile"; do
        if [ -f "$home_dir/$file" ]; then
            profile_file="$home_dir/$file"
            break
        fi
    done

    # Create .profile if neither exists
    profile_file="${profile_file:-$home_dir/.profile}"
    [ ! -f "$profile_file" ] && sudo touch "$profile_file"

    if ! grep -q "^$script_path" "$profile_file"; then
        echo "$script_path" | sudo tee -a "$profile_file" > /dev/null
        sudo chown "$username:$username" "$profile_file"
        sudo chmod 644 "$profile_file"
    fi
}

# -----------------------------------------------------------------------------
# Main execution
# -----------------------------------------------------------------------------
main() {
    # Initialize
    local script_dir="$(get_script_dir)"
    local project_dir="$(find_project_dir)"
    init_project_logging "kiosk_installer"

    # Load configuration
    load_config "$project_dir/config/.env"

    # Select installation mode
    select_mode
    log_info "Selected mode: $SELECTED_MODE"

    # Install required packages
    local packages="$([[ $SELECTED_MODE = $MODE_WEB ]] && echo "$WEB_PACKAGES" || echo "$TERMINAL_PACKAGES")"
    install_packages "$packages"

    # Create and configure kiosk user
    create_kiosk_user "$KIOSK_USERNAME" "$PASSWORD"

    # Determine script name based on mode
    local kiosk_script="$([[ $SELECTED_MODE = $MODE_WEB ]] && echo "kiosk.sh" || echo "terminal-slide-show.sh")"
    
    # Copy required files
    copy_kiosk_files "$KIOSK_USERNAME" "$kiosk_script" "$script_dir"

    # Configure autologin
    configure_lightdm_autologin "$KIOSK_USERNAME"
    configure_tty_autologin "$KIOSK_USERNAME"

    # Configure autostart
    configure_autostart "$KIOSK_USERNAME" "/home/$KIOSK_USERNAME/$kiosk_script"

    log_info "Kiosk installation completed successfully. Please reboot to apply changes."
}

# Execute main if script is run directly
[[ "${BASH_SOURCE[0]}" == "$0" ]] && main "$@"