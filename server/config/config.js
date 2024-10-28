export const config = {
  slideshow: {
    defaultDuration: 5000,
    transitionEffect: 'fade',
    autoPlay: true,
    shuffle: false,
    loop: true,
    showControls: true,
    errorRetryCount: 3,
    errorRetryDelay: 1000
  },
  google: {
    serviceAccountPath: './server/config/service-account.json',
    folderId: '1bCGQehPOsDEJiI7RzEAyVbSzngfQMpdf',
    cacheTimeout: 300000
  },
  security: {
    allowedOrigins: ['http://localhost:8080'],
    maxRetries: 3,
    retryDelay: 1000
  }
};