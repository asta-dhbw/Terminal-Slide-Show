// src/services/slideshowManager.js
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { DateParser } from '../utils/dateParser.js';
import { config } from '../../../config/config.js';
import { isValidFile } from '../utils/fileValidator.js';

export class SlideshowManager {
  constructor() {
    this.logger = new Logger('SlideshowManager');
    this.downloadPath = config.paths.downloadPath;
    this.mediaPath = path.join(process.cwd(), this.downloadPath);
    this.mediaFiles = [];
    this.watchInterval = null;
    this.initialized = false;
    this.isPaused = false;
    this.clientSessions = new Map();
    this.dynamicView = {
      name: 'dynamic-view',
      path: null,
      isDynamicView: true
    };
  }

  async initialize() {
    await fs.ensureDir(this.mediaPath);
    await this.updateMediaList();
    this.startWatching(config.slideshow.watchInterval);
    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

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
  
      // Add dynamic view at the middle of the sequence
      const midPoint = Math.floor(fileMedias.length / 2);
      this.mediaFiles = [
        ...fileMedias.slice(0, midPoint),
        this.dynamicView,
        ...fileMedias.slice(midPoint)
      ];
  
      this.logger.info(`Updated media list: ${this.mediaFiles.length} files`);
    } catch (error) {
      this.logger.error('Failed to update media list:', error);
    }
  }

  // Get or create client session
  getClientSession(clientId) {
    if (!this.clientSessions.has(clientId)) {
      this.clientSessions.set(clientId, {
        currentIndex: 0,
        lastAccessed: Date.now()
      });
    }
    return this.clientSessions.get(clientId);
  }

  // Clean up old sessions periodically
  cleanupSessions() {
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [clientId, session] of this.clientSessions.entries()) {
      if (now - session.lastAccessed > expirationTime) {
        this.clientSessions.delete(clientId);
      }
    }
  }

  getCurrentMedia(clientId) {
    if (this.mediaFiles.length === 0) return null;
    const session = this.getClientSession(clientId);
    session.lastAccessed = Date.now();
    return this.mediaFiles[session.currentIndex];
  }

  nextMedia(clientId) {
    if (this.mediaFiles.length <= 1) return this.getCurrentMedia(clientId);
    const session = this.getClientSession(clientId);
    session.currentIndex = (session.currentIndex + 1) % this.mediaFiles.length;
    session.lastAccessed = Date.now();
    return this.getCurrentMedia(clientId);
  }

  previousMedia(clientId) {
    if (this.mediaFiles.length <= 1) return this.getCurrentMedia(clientId);
    const session = this.getClientSession(clientId);
    session.currentIndex = (session.currentIndex - 1 + this.mediaFiles.length) % this.mediaFiles.length;
    session.lastAccessed = Date.now();
    return this.getCurrentMedia(clientId);
  }

  startWatching(interval = 1000) {
    if (this.isPaused) return;

    this.watchInterval = setInterval(async () => {
      if (!this.isPaused) {
        await this.updateMediaList();
        this.cleanupSessions(); // Cleanup old sessions periodically
      }
    }, interval);
  }

  stop() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  async pause() {
    this.logger.info('Pausing Slideshow Manager');
    this.isPaused = true;
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  async resume() {
    this.logger.info('Resuming Slideshow Manager');
    this.isPaused = false;
    await this.updateMediaList();
    this.startWatching(config.slideshow.watchInterval);
  }
}