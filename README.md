# Terminal Slide Show

A modern, full-featured digital signage solution built with React and Node.js that automatically synchronizes and displays media content from Google Drive. Perfect for information displays, digital signage, and automated presentations.

## Features

- 🖼️ Seamless display of images and videos from Google Drive
- ⚡ Real-time updates via WebSocket connections
- 📦 Intelligent caching system for optimal performance
- 🔄 Automatic content synchronization with change detection
- 📅 Advanced scheduling with vacation periods and daily time windows
- ⌚ Configurable display times and operating days
- 🎯 Date-based content targeting through filename parsing
- 📱 Touch and swipe support for navigation
- 🖥️ Full kiosk mode support
- 🎨 Smooth transitions and animations
- 🌅 Dynamic day/night mode transitions
- 🌡️ Live weather updates and animations
- 🚀 NASA Astronomy Picture of the Day integration
- 💡 Power-saving mode with automatic service management
- 📊 Health monitoring and automatic recovery
- 🔒 Secure operation with minimal dependencies

## Real-Time Updates

The application uses WebSocket connections to provide real-time updates:
- Instant content updates when files change in Google Drive
- Live schedule status synchronization
- Immediate system health notifications
- Automatic reconnection handling
- Reduced server load compared to polling

## Caching System

Multi-level caching strategy for optimal performance:
- **Browser Cache**: 
  - Media files cached with appropriate headers
  - Conditional requests using ETags
  - Cache invalidation on content updates

- **Server-Side Cache**:
  - Efficient media file storage
  - Metadata caching for quick access
  - Automatic cache cleanup

## Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- A Google Cloud Platform account
- For kiosk mode: Debian-based Linux system (e.g., Raspberry Pi OS)
- WebSocket-capable browser

## Project Structure

```
terminal-slide-show/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── slideshow/      # Slideshow components
│   │   │   └── dynamic_daily_view/  # Dynamic view components
│   │   ├── hooks/        # Custom React hooks
│   │   │   └── useWebSocket.js # WebSocket connection hook
│   │   ├── utils/        # Utility functions
│   │   └── styles/       # CSS stylesheets
├── server/                # Backend application
│   ├── src/
│   │   ├── services/     # Core services
│   │   │   ├── websocket/     # WebSocket server
│   │   │   └── cache/         # Caching service
│   │   └── utils/        # Utility functions
│   └── data/             # Local data (quotes, facts)
├── config/               # Configuration files
│   ├── config.js        # Main configuration
│   └── frontend.config.js # Frontend-specific config
├── scripts/             # Shell scripts
└── downloads/           # Local media storage
```

## Setup Instructions

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/asta-dhbw/Terminal-Slide-Show.git
cd terminal-slide-show

# Install dependencies
npm install

# Create necessary directories
mkdir -p downloads logs cache

# Create configuration files
cp config/config.example.js config/config.js
cp config/.env.example config/.env
```

### 2. Cache Configuration

Configure caching behavior in `config.js`:

```javascript
cache: {
  // Browser cache settings
  browser: {
    maxAge: 86400,        // Cache lifetime in seconds
    revalidate: true,     // Enable revalidation
    etags: true           // Enable ETag support
  },
  // Server cache settings
  server: {
    mediaCache: {
      maxSize: '1GB',     // Maximum cache size
      cleanupInterval: '1h' // Cache cleanup interval
    },
    metadataCache: {
      ttl: 300,           // Time-to-live in seconds
      checkPeriod: 600    // Cleanup check interval
    }
  }
}
```

### 3. WebSocket Configuration

Configure WebSocket behavior in `config.js`:

```javascript
websocket: {
  // WebSocket server settings
  server: {
    port: 3001,
    heartbeat: 30000,     // Heartbeat interval
    reconnectTimeout: 5000 // Client reconnection timeout
  },
  // Client settings
  client: {
    reconnectAttempts: 5,
    reconnectInterval: 1000,
    messageTimeout: 5000
  }
}
```

[Previous sections remain the same...]

## WebSocket Events

The application supports the following WebSocket events:

```javascript
// Client-side subscription
ws.subscribe('media-update', (data) => {
  // Handle media updates
});

ws.subscribe('schedule-update', (data) => {
  // Handle schedule changes
});

ws.subscribe('system-health', (data) => {
  // Handle system health updates
});
```

## Cache Headers

The application sets appropriate cache headers for different types of content:

```javascript
// Example cache headers for media files
{
  'Cache-Control': 'public, max-age=86400',
  'ETag': true,
  'Last-Modified': timestamp
}

// Example cache headers for dynamic content
{
  'Cache-Control': 'no-cache, must-revalidate',
  'ETag': true
}
```

[Previous sections remain the same...]

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.