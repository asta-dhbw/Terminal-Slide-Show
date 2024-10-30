import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleDriveService } from './services/googleDriveService.js';
import { SlideshowManager } from './services/slideshowManager.js';
import { Logger } from './utils/logger.js';
import { config } from '../../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.backend.port;
const host = config.backend.host;
const logger = new Logger('Main');

// Initialize services
const googleDriveService = new GoogleDriveService();
const slideshowManager = new SlideshowManager();

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

async function initialize() {
    try {
        await googleDriveService.initialize();
        await googleDriveService.startSync();
        await slideshowManager.initialize();
        logger.info('All services initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

// API endpoints
app.get('/api/current-media', (req, res) => {
    const media = slideshowManager.getCurrentMedia();
    res.json(media || { error: 'No media available' });
});

app.get('/api/next-media', (req, res) => {
    const media = slideshowManager.nextMedia();
    res.json(media || { error: 'No media available' });
});

app.get('/api/previous-media', (req, res) => {
    const media = slideshowManager.previousMedia();
    res.json(media || { error: 'No media available' });
});

app.get('/api/server-status', (req, res) => {
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
    googleDriveService.stop();
    slideshowManager.stop();
    process.exit(0);
});