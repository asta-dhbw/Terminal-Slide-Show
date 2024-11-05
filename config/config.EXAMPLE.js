export const config = {
  info: {
    location: 'LOCATION',
  },
  apiKeys: {
    NASA_API_KEY: 'API' // https://api.nasa.gov/
  },
  google: {
    serviceAccountPath: './config/service-account.json', // Path to Google Drive service account file
    folderId: 'ID', // Google Drive folder ID
    scopes: ['https://www.googleapis.com/auth/drive.readonly'], // Google Drive API scopes
    apiVersion: 'v3' // Google Drive API version
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
    port: 3000, // Server port
    host: '127.0.0.1' // Server host
  },
  frontend: {
    port: 5173, // Client port
    host: '127.0.0.1' // Client host
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
    enabled: false, // Enable or disable the schedule feature
    onTime: '07:30', // Time to turn on the slideshow (24-hour format)
    offTime: '20:00', // Time to turn off the slideshow (24-hour format)
    days: [1, 2, 3, 4, 5], // Days to run the slideshow (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
    vacationPeriods: [
      { start: '23.12.2024', end: '06.01.2025' }, // Example vacation period
    ],
  },
  mediaTypes: {
    imageTypes: ['.jpg', '.jpeg', '.png', '.gif'], // Supported image types
    videoTypes: ['.mp4', '.webm', '.ogg'], // Supported video types
    loop: true, // Loop media files
    autoplay: true, // Autoplay media files
    muted: true // Mute media files
  }
};