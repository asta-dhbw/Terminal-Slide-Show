// config/frontend.config.js
export const frontendConfig = {
    info: {
        location: "Friedrichshafen",
    },
    sync: {
        interval: 1000, // Default sync interval in milliseconds
        controlsInterval: 3000, // Interval for showing/hiding controls in milliseconds
        retryAttempts: 3, // Number of retry attempts for failed syncs
        retryDelay: 1 * 60 * 1000, // Delay between retry attempts in milliseconds
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
    },
};