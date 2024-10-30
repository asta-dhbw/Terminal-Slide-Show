# Terminal Slide Show V2

A modern, lightweight digital signage solution built with Node.js that automatically synchronizes and displays media content from Google Drive. Perfect for information displays, digital signage, and automated presentations.

## Features

- 🖼️ Seamless display of images and videos from Google Drive
- 🔄 Real-time content synchronization
- 📅 Scheduling support with vacation periods
- ⌚ Configurable display times and days
- 🎯 Date-based content targeting
- 📱 Touch and swipe support
- 🖥️ Fullscreen mode
- 🎨 Smooth transitions and animations

## Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- A Google Cloud Platform account
- A Raspberry Pi or similar device for deployment (optional)

## Project Structure

```
terminal-slide-show/
├── client/                  # Frontend application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── styles/        # CSS stylesheets
├── server/                 # Backend application
│   └── src/
│       ├── services/      # Core services
│       └── utils/         # Utility functions
├── config/                # Configuration files
│   ├── config.js         # Main configuration
│   └── service-account.json  # Google Cloud credentials
└── downloads/            # Local media storage
```

## Setup Instructions

### 1. Google Cloud Project Setup

1. Create a new project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Drive API
3. Create a Service Account:
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Grant the role "Drive File Viewer" or necessary permissions
   - Create and download JSON key
4. Place the downloaded JSON key in `config/service-account.json`
5. Share your Google Drive folder with the service account email

### 2. Project Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/terminal-slide-show.git
cd terminal-slide-show

# Install dependencies
npm install

# Create necessary directories
mkdir downloads

# Configure the application
cp config/config.example.js config/config.js
# Edit config.js with your settings
```

### 3. Configuration

Edit `config/config.js` to set up:
- Google Drive folder ID
- Operating hours
- Display schedule
- Vacation periods
- Media types
- Update intervals

### 4. Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## File Naming Convention

Files in Google Drive should follow this naming pattern to enable scheduling:

- Single date: `filename_DD-MM-YYYY.ext`
- Date range: `filename_DD-MM-YYYY@DD-MM-YYYY.ext`
- Short format: `filename_DD-MM@DD-MM.ext`

It is possible to also use just `YY` and use any of these separators: `-._`

Examples:
```
banner_01-01-2024@31-01-2024.jpg  # Show in January 2024
notice_15-03.jpg                  # Show on March 15th (any year)
event_01-06@15-06.jpg            # Show June 1-15 (any year)
```

## Scheduling

Configure display times in `config.js`:

```javascript
schedule: {
  enabled: true,
  onTime: '06:30',      // Display start time
  offTime: '20:00',     // Display end time
  days: [1, 2, 3, 4, 5], // Monday to Friday
  vacationPeriods: [    // Optional vacation periods
    { start: '24.06.2024', end: '24.07.2024' }
  ]
}
```

## Auto-start Setup (Raspberry Pi)

1. Create a systemd service file:
```bash
sudo nano /etc/systemd/system/slideshow.service
```

2. Add the following content:
```ini
[Unit]
Description=Terminal Slide Show
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/terminal-slide-show
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:
```bash
sudo systemctl enable slideshow
sudo systemctl start slideshow
```

## Supported Media Types

- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Videos: `.mp4`, `.webm`, `.ogg`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.