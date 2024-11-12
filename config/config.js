import dotenv from 'dotenv';
dotenv.config();

export const config = {
  info: {
    location: process.env.LOCATION || 'LOCATION',
  },
  apiKeys: {
    NASA_API_KEY: process.env.NASA_API_KEY
  },
  google: {
    useServiceAccount: true, // Set to false to use public folder access
    serviceAccountPath: process.env.GOOGLE_SERVICE_ACCOUNT ,
    apiKey: process.env.GOOGLE_API_KEY,
    folderId: process.env.GOOGLE_FOLDER_ID,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'], // Google Drive API scopes
    apiVersion: 'v3' // Google Drive API version
  },
  kiosk: {
    targetUrl: process.env.KIOSK_URL, // Target URL for the kiosk
    user: process.env.KIOSK_USER || 'kiosk',                         
    password: process.env.KIOSK_PASSWORD,
  },
  backendPowerSaving: {
    timeout: 5 * 60 * 1000 // standard 5 minutes in milliseconds
  },
  sync: {
    interval: 1000, // Default sync interval in milliseconds
    controlsInterval: 3000, // Interval for showing/hiding controls in milliseconds
    retryAttempts: 3, // Number of retry attempts for failed syncs
    retryDelay: 1 * 60 * 1000, // Delay between retry attempts in milliseconds
  },
  paths: {
    downloadPath: './downloads', // Path to download files from Google Drive
    archivePath: './archive', // Path to archive old files
  },
  logging: {
    level: 'debug', // Logging level (debug, info, warn, error)
    format: 'json' // Logging format (text, json)
  },
  backend: {
    port: process.env.BACKEND_PORT || 3000,
    host: process.env.BACKEND_HOST || '127.0.0.1'
  },
  frontend: {
    port: process.env.FRONTEND_PORT || 5173,
    host: process.env.FRONTEND_HOST || '127.0.0.1'
  },
  slideshow: {
    watchInterval: 1000, // Interval for watching media files in downloadPath in milliseconds
    defaultSlideDuration: 5000, // Default slide duration in milliseconds
  },
  polling: {
    serverStatusInterval: 5000, // Interval for polling server status in milliseconds
    mediaLoaderInterval: 5000, // Interval for polling media loader in milliseconds
    initLoadDuration: 2000 // Initial load duration in milliseconds
  },
  schedule: {
    enabled: true, // Enable or disable the schedule feature
    onTime: '07:30', // Time to turn on the slideshow (24-hour format)
    offTime: '20:00', // Time to turn off the slideshow (24-hour format)
    days: [1, 2, 3, 4, 5], // Days to run the slideshow (1 for Monday, ..., 7 for Sunday)
    vacationPeriods: [
      { start: '24.06.2024', end: '24.07.2024' }, // Example vacation period
    ],
  },
  mediaTypes: {
    imageTypes: ['.jpg', '.jpeg', '.png', '.gif'], // Supported image types
    videoTypes: ['.mp4', '.webm', '.ogg'], // Supported video types
    loop: false, // Loop media files
    autoplay: true, // Autoplay media files
    muted: true // Mute media files
  }
};

export default config;