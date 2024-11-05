#!/bin/bash


# Wenn Sie den Service später entfernen möchten, können Sie folgende Befehle ausführen:
# sudo systemctl stop kiosk.service
# sudo systemctl disable kiosk.service
# sudo rm /etc/systemd/system/kiosk.service
# sudo rm /etc/sudoers.d/kiosk-x
# sudo userdel -r kiosk-user
# sudo systemctl daemon-reload

# Get directory where script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/install.log"
KIOSK_SCRIPT="$SCRIPT_DIR/kiosk.sh"
SERVICE_NAME="kiosk.service"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME"
KIOSK_USER="kiosk-user"
KIOSK_HOME="/home/$KIOSK_USER"

# Create log directory
mkdir -p "$LOG_DIR"

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

log_message() {
    echo "$(timestamp) $1" | tee -a "$LOG_FILE"
}

cleanup_installation() {
    log_message "Cleaning up failed installation..."
    systemctl stop $SERVICE_NAME 2>/dev/null
    systemctl disable $SERVICE_NAME 2>/dev/null
    rm -f $SERVICE_PATH
    rm -f /etc/sudoers.d/kiosk-x
    userdel -r $KIOSK_USER 2>/dev/null
    systemctl daemon-reload
    log_message "Cleanup complete"
}

# Überprüfen ob Script als root läuft
if [ "$EUID" -ne 0 ]; then
    log_message "Error: Bitte als root ausführen (sudo)."
    exit 1
fi

# Überprüfen ob das Kiosk-Script existiert
if [ ! -f "$KIOSK_SCRIPT" ]; then
    log_message "Error: Kiosk-Script nicht gefunden in: $KIOSK_SCRIPT"
    exit 1
fi

# Installation starten
log_message "Starte Kiosk Installation..."

# Benötigte Pakete installieren
log_message "Installiere benötigte Pakete..."
if ! apt update && apt install -y xorg firefox-esr openbox x11-xserver-utils xdotool unclutter python3-xdg; then
    log_message "Error: Paketinstallation fehlgeschlagen"
    cleanup_installation
    exit 1
fi

# Erstelle restricted kiosk user
log_message "Erstelle restricted kiosk user..."
if id "$KIOSK_USER" &>/dev/null; then
    log_message "Benutzer $KIOSK_USER existiert bereits - wird neu erstellt"
    userdel -r $KIOSK_USER
fi

if ! useradd -m -s /usr/sbin/nologin $KIOSK_USER; then
    log_message "Error: Konnte Benutzer nicht erstellen"
    cleanup_installation
    exit 1
fi

# Erstelle notwendige Verzeichnisse und setze Berechtigungen
log_message "Konfiguriere Benutzerumgebung..."
mkdir -p $KIOSK_HOME/.mozilla
mkdir -p $KIOSK_HOME/.config
mkdir -p $KIOSK_HOME/logs

# Kopiere Kiosk-Script in das Home-Verzeichnis des Kiosk-Users
KIOSK_SCRIPT_DEST="$KIOSK_HOME/kiosk.sh"
cp "$KIOSK_SCRIPT" "$KIOSK_SCRIPT_DEST"
chmod 500 "$KIOSK_SCRIPT_DEST"  # nur ausführbar, nicht editierbar

# Erstelle und konfiguriere .Xauthority
touch $KIOSK_HOME/.Xauthority
chmod 600 $KIOSK_HOME/.Xauthority

# Setze Berechtigungen für alle Dateien
chown -R $KIOSK_USER:$KIOSK_USER $KIOSK_HOME
chmod 700 $KIOSK_HOME

# Konfiguriere sudo für spezifische X-Server Befehle
log_message "Konfiguriere sudo-Rechte..."
cat > /etc/sudoers.d/kiosk-x << EOF
$KIOSK_USER ALL=(root) NOPASSWD: /usr/bin/X
$KIOSK_USER ALL=(root) NOPASSWD: /usr/bin/pkill Xorg
$KIOSK_USER ALL=(root) NOPASSWD: /bin/rm -f /tmp/.X*-lock
$KIOSK_USER ALL=(root) NOPASSWD: /bin/rm -f /tmp/.X11-unix/X*
EOF
chmod 440 /etc/sudoers.d/kiosk-x

# Service-Datei erstellen
log_message "Erstelle systemd Service..."
cat > "$SERVICE_PATH" << EOF
[Unit]
Description=Kiosk Mode Service
After=network.target
After=systemd-logind.service
StartLimitIntervalSec=0

[Service]
Type=simple
User=$KIOSK_USER
Environment=DISPLAY=:0
Environment=XAUTHORITY=$KIOSK_HOME/.Xauthority
Environment=HOME=$KIOSK_HOME
ExecStart=/bin/bash $KIOSK_SCRIPT_DEST
Restart=always
RestartSec=10
TimeoutStartSec=60
KillMode=mixed
TimeoutStopSec=30

# Sicherheitseinschränkungen
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=yes
RestrictSUIDSGID=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
LockPersonality=yes
RestrictNamespaces=yes
RestrictRealtime=yes
ReadWritePaths=$KIOSK_HOME/logs

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$SERVICE_PATH"

# systemd neuladen und Service aktivieren
log_message "Aktiviere systemd Service..."
systemctl daemon-reload
if ! systemctl enable $SERVICE_NAME; then
    log_message "Error: Service konnte nicht aktiviert werden"
    cleanup_installation
    exit 1
fi

# Service starten
log_message "Starte Kiosk-Service..."
if ! systemctl start $SERVICE_NAME; then
    log_message "Error: Service konnte nicht gestartet werden"
    cleanup_installation
    exit 1
fi

# Status überprüfen
sleep 5
STATUS=$(systemctl is-active $SERVICE_NAME)
if [ "$STATUS" = "active" ]; then
    log_message "Kiosk-Service erfolgreich installiert und gestartet!"
    log_message "Status überprüfen: systemctl status $SERVICE_NAME"
    log_message "Logs ansehen: journalctl -u $SERVICE_NAME -f"
    log_message "Kiosk logs: $KIOSK_HOME/logs/kiosk.log"
else
    log_message "Error: Service ist nicht aktiv. Status: $STATUS"
    log_message "Überprüfen Sie die Logs: journalctl -u $SERVICE_NAME -f"
    cleanup_installation
    exit 1
fi

log_message "Installation abgeschlossen."

# Zeige Deinstallations-Hinweise
cat << EOF

Zum Deinstallieren folgende Befehle ausführen:
sudo systemctl stop $SERVICE_NAME
sudo systemctl disable $SERVICE_NAME
sudo rm $SERVICE_PATH
sudo rm /etc/sudoers.d/kiosk-x
sudo userdel -r $KIOSK_USER
sudo systemctl daemon-reload

EOF