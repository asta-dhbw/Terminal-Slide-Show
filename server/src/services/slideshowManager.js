/**
 * @fileoverview Manages slideshow media files and client sessions
 * @module SlideshowManager
 */

import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { DateParser } from '../utils/dateParser.js';
import { config } from '../../../config/config.js';
import { isValidFile } from '../utils/fileValidator.js';

/**
 * @typedef {Object} MediaFile
 * @property {string} name - File name
 * @property {string} path - Full file path
 * @property {Object} [dates] - Parsed dates from filename
 * @property {boolean} [isDynamicView] - Whether this is a dynamic view
 */

/**
 * @typedef {Object} ClientSession
 * @property {number} currentIndex - Current media index
 * @property {number} lastAccessed - Timestamp of last access
 */


/**
 * Manages slideshow media files and client sessions
 * @class SlideshowManager
 */
export class SlideshowManager {
  /**
   * Creates a new SlideshowManager instance
   * @constructor
   */
  constructor() {
    /** @private @type {Logger} */
    this.logger = new Logger('SlideshowManager');
    /** @private @type {string} */
    this.downloadPath = config.paths.downloadPath;
    /** @private @type {string} */
    this.mediaPath = path.join(process.cwd(), this.downloadPath);
    /** @private @type {MediaFile[]} */
    this.mediaFiles = [];
    /** @private @type {NodeJS.Timeout|null} */
    this.watchInterval = null;
    /** @private @type {boolean} */
    this.initialized = false;
    /** @private @type {boolean} */
    this.isPaused = false;
    /** @private @type {Map<string, ClientSession>} */
    this.clientSessions = new Map();
    /** @private @type {MediaFile} */
    this.dynamicView = {
      name: 'dynamic-view',
      path: null,
      isDynamicView: true
    };
  }

    /**
   * Initializes the slideshow manager
   * @async
   * @returns {Promise<void>}
   */
    async initialize() {
      await fs.ensureDir(this.mediaPath);
      await this.updateMediaList();
      this.startWatching(config.slideshow.watchInterval);
      this.initialized = true;
      return;
    }

  /**
   * Checks if manager is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized;
  }

    /**
   * Updates the list of available media files
   * @async
   * @private
   * @returns {Promise<void>}
   */
async updateMediaList() {
  if (this.isPaused) return;

  try {
    const files = await fs.readdir(this.mediaPath);
    const fileMedias = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return config.mediaTypes.imageTypes.includes(ext) || config.mediaTypes.videoTypes.includes(ext);
      })
      .map(file => ({
        name: file,
        path: path.join(this.mediaPath, file),
        dates: DateParser.parseFileName(file)
      }))
      .filter(file => isValidFile(file.name));

    // Create new media list
    const newMediaList = [
      ...fileMedias.slice(0, Math.floor(fileMedias.length / 2)),
      this.dynamicView,
      ...fileMedias.slice(Math.floor(fileMedias.length / 2))
    ];

    // Check if media list has changed
    const hasChanged = JSON.stringify(this.mediaFiles) !== JSON.stringify(newMediaList);

    if (hasChanged) {
      this.mediaFiles = newMediaList;
      this.logger.info(`Updated media list: ${this.mediaFiles.length} files`);
      
      // Broadcast update to all connected clients
      if (global.webSocketManager) {
        global.webSocketManager.broadcastUpdate(this.mediaFiles);
      }
    }
  } catch (error) {
    this.logger.error('Failed to update media list:', error);
  }
}

  /**
   * Gets or creates a client session
   * @private
   * @param {string} clientId - Unique client identifier
   * @returns {ClientSession} Client session object
   */
  getClientSession(clientId) {
    if (!this.clientSessions.has(clientId)) {
      this.clientSessions.set(clientId, {
        currentIndex: 0,
        lastAccessed: Date.now()
      });
    }
    return this.clientSessions.get(clientId);
  }

    /**
   * Removes expired client sessions
   * @private
   */
  cleanupSessions() {
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [clientId, session] of this.clientSessions.entries()) {
      if (now - session.lastAccessed > expirationTime) {
        this.clientSessions.delete(clientId);
      }
    }
  }

    /**
   * Gets current media for a client
   * @param {string} clientId - Client identifier
   * @returns {MediaFile|null} Current media file or null if none available
   */
  getCurrentMedia(clientId) {
    if (this.mediaFiles.length === 0) return null;
    const session = this.getClientSession(clientId);
    session.lastAccessed = Date.now();
    return this.mediaFiles[session.currentIndex];
  }

    /**
   * Advances to next media for a client
   * @param {string} clientId - Client identifier
   * @returns {MediaFile|null} Next media file or null if none available
   */
  nextMedia(clientId) {
    if (this.mediaFiles.length <= 1) return this.getCurrentMedia(clientId);
    const session = this.getClientSession(clientId);
    session.currentIndex = (session.currentIndex + 1) % this.mediaFiles.length;
    session.lastAccessed = Date.now();
    return this.getCurrentMedia(clientId);
  }

    /**
   * Moves to previous media for a client
   * @param {string} clientId - Client identifier
   * @returns {MediaFile|null} Previous media file or null if none available
   */
  previousMedia(clientId) {
    if (this.mediaFiles.length <= 1) return this.getCurrentMedia(clientId);
    const session = this.getClientSession(clientId);
    session.currentIndex = (session.currentIndex - 1 + this.mediaFiles.length) % this.mediaFiles.length;
    session.lastAccessed = Date.now();
    return this.getCurrentMedia(clientId);
  }

    /**
   * Starts watching for media changes
   * @param {number} [interval=1000] - Watch interval in milliseconds
   */
  startWatching(interval = 1000) {
    if (this.isPaused) return;

    this.watchInterval = setInterval(async () => {
      if (!this.isPaused) {
        await this.updateMediaList();
        this.cleanupSessions(); // Cleanup old sessions periodically
      }
    }, interval);
  }

    /**
   * Stops watching for media changes
   */
  stop() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

    /**
   * Pauses slideshow manager operations
   * @async
   * @returns {Promise<void>}
   */
  async pause() {
    this.logger.info('Pausing Slideshow Manager');
    this.isPaused = true;
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

    /**
   * Resumes slideshow manager operations
   * @async
   * @returns {Promise<void>}
   */
  async resume() {
    this.logger.info('Resuming Slideshow Manager');
    this.isPaused = false;
    await this.updateMediaList();
    this.startWatching(config.slideshow.watchInterval);
  }

  /**
   * Gets all available media files
   * @returns {MediaFile[]} Array of media files
   */
  getAllMedia() {
    return this.mediaFiles;
  }
}