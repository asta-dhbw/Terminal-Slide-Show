import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { GoogleDriveService } from './services/googleDriveService.js';
import { SlideshowManager } from './services/slideshowManager.js';
import { PowerManager } from './services/powerManager.js';
import { Logger } from './utils/logger.js';
import { config } from '../../config/config.js';

const app = express();
const port = config.backend.port;
const host = config.backend.host;
const logger = new Logger('Main');

// Initialize services
const googleDriveService = new GoogleDriveService();
const slideshowManager = new SlideshowManager();
const powerManager = new PowerManager({
    inactivityTimeout: config.backendPowerSaving?.timeout || 5 * 60 * 1000 // 5 minutes default
});

async function initialize() {
    try {
        await googleDriveService.initialize();
        await googleDriveService.startSync();
        await slideshowManager.initialize();

        // Initialize power manager and register services
        powerManager.initialize();
        powerManager.registerService('googleDrive', googleDriveService);
        powerManager.registerService('slideshow', slideshowManager);

        await powerManager.pauseServices();

        logger.info('All services initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

const handleClientActivity = (req, res, next) => {
    powerManager.handleClientActivity();
    next();
};


// Serve static files - order matters!
// 1. Serve public files first
app.use(express.static(path.join(process.cwd(), 'client', 'public')));
// 2. Serve the client dist folder (for production)
app.use(express.static(path.join(process.cwd(), 'dist')));
// 3. Serve media files
app.use('/media', express.static(path.join(process.cwd(), config.paths.downloadPath)));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow any origin in development
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use('/api', handleClientActivity);
app.use('/api', (req, res, next) => {
    if (!req.headers['x-client-id']) {
      // Generate a random client ID if not provided
      req.clientId = Math.random().toString(36).substring(7);
      res.setHeader('X-Client-Id', req.clientId);
    } else {
      req.clientId = req.headers['x-client-id'];
    }
    next();
  });
  


// API endpoints
app.get('/api/current-media', (req, res) => {
    logger.debug(`Getting current media for client ${req.clientId}`);
    const media = slideshowManager.getCurrentMedia(req.clientId);
    res.json(media || { error: 'No media available' });
  });
  
  app.get('/api/next-media', (req, res) => {
    logger.debug(`Navigating to next media for client ${req.clientId}`);
    const media = slideshowManager.nextMedia(req.clientId);
    res.json(media || { error: 'No media available' });
  });
  
  app.get('/api/previous-media', (req, res) => {
    logger.debug(`Navigating to previous media for client ${req.clientId}`);
    const media = slideshowManager.previousMedia(req.clientId);
    res.json(media || { error: 'No media available' });
});

app.get('/api/server-status', (req, res) => {
    logger.debug('Checking server status');
    try {
        const isGoogleDriveInitialized = googleDriveService.isInitialized();
        const isSlideshowManagerInitialized = slideshowManager.isInitialized();

        if (isGoogleDriveInitialized && isSlideshowManagerInitialized) {
            res.status(200).send('OK');
        } else {
            res.status(503).send('Service Unavailable');
        }
    } catch (error) {
        logger.error('Error checking server status:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add this route before the wildcard route
app.get('/dynamic-view', (req, res) => {
    logger.debug('Serving dynamic view');
    res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
});

// NASA APOD endpoint
app.get('/api/nasa-apod', async (req, res) => {
    logger.debug('Fetching NASA APOD');
    try {
        const response = await fetch(
            `https://api.nasa.gov/planetary/apod?api_key=${config.apiKeys.NASA_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error('Failed to fetch NASA APOD:', error);
        res.status(500).json({ error: 'Failed to fetch NASA image' });
    }
});

// Weather endpoint
app.get('/api/weather', async (req, res) => {
    const location = req.query.location;
    logger.debug(`Fetching weather for location: ${location}`);

    try {
        // Get coordinates first
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
        );
        const geoData = await geoResponse.json();

        if (!geoData.results?.[0]) {
            return res.status(404).json({ error: 'Location not found' });
        }

        const { latitude, longitude } = geoData.results[0];

        // Get weather data
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&windspeed_unit=kmh&timezone=auto`
        );
        const weatherData = await weatherResponse.json();
        
        res.json(weatherData);
    } catch (error) {
        logger.error('Failed to fetch weather:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// Add these new endpoints
app.get('/api/quotes', async (req, res) => {
    logger.debug('Fetching random quote');
    try {
        const quotesData = await fs.readFile(path.join(process.cwd(), 'server', 'data', 'quotes.json'), 'utf8');
        const quotes = JSON.parse(quotesData).quotes;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        res.json(randomQuote);
    } catch (error) {
        logger.error('Failed to fetch quote:', error);
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});

app.get('/api/facts', async (req, res) => {
    logger.debug('Fetching random fact');
    try {
        const factsData = await fs.readFile(path.join(process.cwd(), 'server', 'data', 'facts.json'), 'utf8');
        const facts = JSON.parse(factsData);
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        res.json(randomFact);
    } catch (error) {
        logger.error('Failed to fetch fact:', error);
        res.status(500).json({ error: 'Failed to fetch fact' });
    }
});

app.get('/api/greetings', async (req, res) => {
    logger.debug('Fetching greetings');
    try {
        const greetingsData = await fs.readFile(path.join(process.cwd(), 'server', 'data', 'greetings.json'), 'utf8');
        const greetings = JSON.parse(greetingsData);
        res.json(greetings);
    } catch (error) {
        logger.error('Failed to fetch greetings:', error);
        res.status(500).json({ error: 'Failed to fetch greetings' });
    }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
});
// Start the server
app.listen(port, () => {
    logger.info(`Backend running at http://${host}:${port}/`);
    initialize();
});

// Handle shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down...');
    powerManager.stop();
    googleDriveService.stop();
    slideshowManager.stop();
    process.exit(0);
});