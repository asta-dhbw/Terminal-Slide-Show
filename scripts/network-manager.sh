#!/bin/bash
# Wireless network reconnection script - connects to visible networks by signal strength

source "$(dirname "${BASH_SOURCE[0]}")/project-utils.sh"

spinner() {
    local message="${1:-Loading...}"
    local pid=$2
    local delay=0.15
    local spinstr='▁▂▃▄▅▆▇█▇▆▅▄▃▂▁'
    # Color definitions
    local GREEN=$(tput setaf 2)
    local CYAN=$(tput setaf 6)
    local YELLOW=$(tput setaf 3)
    local NC=$(tput sgr0)
    local msg_length=${#message}
    local box_width=$((msg_length + 6))

    tput civis
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf "\n${CYAN}╭%*s╮${NC}\n" "$box_width" "" | sed 's/ /─/g'
        printf "${CYAN}│${NC} ${GREEN}%s${NC} %-*s ${CYAN}│${NC}\n" "${spinstr:0:1}" "$((box_width-4))" "$message"
        printf "${CYAN}╰%*s╯${NC}" "$box_width" "" | sed 's/ /─/g'
        spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\033[3A"
    done
    tput cnorm
}

check_connection() {
    ping -c 1 8.8.8.8 >/dev/null 2>&1
    return $?
}

# Get current wireless connection info
get_current_wifi() {
    nmcli -t -f ACTIVE,SSID dev wifi | grep '^yes' | cut -d: -f2
}

# Get list of currently visible networks sorted by signal strength
get_visible_networks() {
    # Get networks sorted by signal strength (RATE), with strongest first
    nmcli -f SIGNAL,SSID dev wifi list | tail -n +2 | sed 's/^ *//' | \
    sort -nr | awk '{$1=""; print substr($0,2)}' | \
    while read -r line; do
        echo "${line}" | sed 's/^ *//'
    done
}

# Get signal strength for a specific SSID
get_signal_strength() {
    local ssid=$1
    nmcli -f SIGNAL,SSID dev wifi list | grep "$ssid" | sort -nr | head -1 | awk '{print $1}'
}

reconnect_wifi() {
    local current_ssid=$(get_current_wifi)
    log_info "📡 Current SSID: $current_ssid"

    # Forget and reconnect to current network
    if [ ! -z "$current_ssid" ]; then
        local current_signal=$(get_signal_strength "$current_ssid")
        log_info "🔄 Reconnecting to $current_ssid (Signal: $current_signal%)"
        # Turn off WiFi radio
        nmcli radio wifi off
        sleep 2
        # Turn on WiFi radio
        nmcli radio wifi on
        sleep 3
        # Scan for networks
        nmcli dev wifi rescan
        sleep 2
        # Try to connect to the last known SSID if it's visible
        if nmcli dev wifi list | grep -q "$current_ssid"; then
            nmcli dev wifi connect "$current_ssid"
            return 0
        fi
    fi

    # If no current SSID or it's not visible, try visible networks
    log_info "🔍 Searching for visible networks..."
    # Get list of known connections (configurations)
    local known_networks=$(nmcli -g name connection show)
    # Get list of currently visible networks sorted by signal strength
    local visible_networks=$(get_visible_networks)

    # Try to connect only to networks that are both known and currently visible
    log_info "📊 Available networks by signal strength:"
    while IFS= read -r network; do
        if [ ! -z "$network" ] && echo "$known_networks" | grep -q "^$network$"; then
            local signal=$(get_signal_strength "$network")
            log_info "📶 $network (Signal: $signal%)"
            log_info "🔄 Trying to connect to $network..."
            nmcli dev wifi connect "$network" 2>/dev/null
            sleep 3
            if check_connection; then
                log_info "✅ Connected to $network"
                return 0
            fi
        fi
    done <<< "$visible_networks"
    return 1
}

check_ethernet() {
    local device=$1
    
    # First check if device exists and is in "connected" state
    if ! nmcli dev status | grep "^$device" | grep -q "connected"; then
        return 1
    fi

    # Then verify we have an IP address that's not link-local
    local ip=$(ip addr show dev "$device" | grep "inet " | grep -v "169.254" | awk '{print $2}')
    if [ -z "$ip" ]; then
        return 1
    fi

    # Finally check internet connectivity through this device
    timeout 3 ping -I "$device" -c 1 8.8.8.8 >/dev/null 2>&1
    return $?
}

connect_ethernet() {
    log_info "🔌 Checking Ethernet connection..."
    
    local ethernet_devices=$(nmcli -t -f DEVICE,TYPE dev status | grep ":ethernet$" | cut -d: -f1)
    
    if [ -z "$ethernet_devices" ]; then
        log_warn "❌ No Ethernet devices found"
        return 1
    fi

    while IFS= read -r device; do
        log_info "🔍 Checking ethernet device: $device"
        
        # Skip virtual devices
        if [[ "$device" == *"veth"* ]]; then
            log_info "⏭️ Skipping virtual device: $device"
            continue
        fi

        # Check if device is already connected with internet access
        if check_ethernet "$device"; then
            log_info "✅ Connected to internet via $device"
            return 0
        fi

        # Enable device if disabled
        if nmcli dev status | grep "^$device" | grep -q "unavailable"; then
            log_info "🔄 Enabling Ethernet device $device"
            nmcli dev set "$device" managed yes
            sleep 2
        fi

        # Try to connect
        log_info "🔄 Attempting Ethernet connection on $device"
        if nmcli dev connect "$device" 2>/dev/null; then
            sleep 3
            if check_ethernet "$device"; then
                log_info "✅ Connected to internet via $device"
                return 0
            fi
        fi
        log_info "⚠️ Failed to connect using $device"
    done <<< "$ethernet_devices"
    
    log_warn "❌ Failed to connect via any Ethernet device"
    return 1
}


# Initialize logging
init_project_logging "network_manager" 

# Main loop
attempt=1

while ! check_connection; do
    log_info "⚠️ Attempt $attempt"
    (sleep 1) &
    spinner "Checking connection" $!
    
    if ! check_connection; then
        log_warn "❌ No connection detected"
        
        # Try Ethernet first
        if connect_ethernet; then
            log_info "🌐 Internet connection established via Ethernet"
            exit 0
        fi
        
        # Fall back to WiFi if Ethernet fails
        log_info "📡 Falling back to WiFi..."
        reconnect_wifi
        sleep 5 # Wait for connection to establish
        attempt=$((attempt + 1))
    fi
done

log_info "🌐 Internet connection established successfully"