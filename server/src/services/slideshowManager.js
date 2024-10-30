// src/services/slideshowManager.js
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { DateParser } from '../utils/dateParser.js';
import { config } from '../../../config/config.js';

export class SlideshowManager {
  constructor() {
    this.logger = new Logger('SlideshowManager');
    this.downloadPath = config.paths.downloadPath;
    this.mediaPath = path.join(process.cwd(), this.downloadPath);
    this.currentIndex = 0;
    this.mediaFiles = [];
    this.watchInterval = null;
    this.initialized = false;
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
    try {
      const files = await fs.readdir(this.mediaPath);
      this.mediaFiles = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.mp4'].includes(ext);
        })
        .map(file => ({
          name: file,
          path: path.join(this.mediaPath, file),
          dates: DateParser.parseFileName(file)
        }))
        .filter(file => this.isFileValid(file));

      this.logger.info(`Updated media list: ${this.mediaFiles.length} files`);
    } catch (error) {
      this.logger.error('Failed to update media list:', error);
    }
  }

  isFileValid(file) {
    if (!file.dates) return false; // Reject files without valid date format
    const now = new Date();
    
    if (file.dates.endDate) {
      return now >= file.dates.startDate && now <= file.dates.endDate;
    }
    
    return now >= file.dates.startDate;
  }

  getCurrentMedia() {
    if (this.mediaFiles.length === 0) return null;
    return this.mediaFiles[this.currentIndex];
  }

  nextMedia() {
    if (this.mediaFiles.length <= 1) return this.getCurrentMedia(); // Do not change if only one media file
    this.currentIndex = (this.currentIndex + 1) % this.mediaFiles.length;
    return this.getCurrentMedia();
  }

  previousMedia() {
    if (this.mediaFiles.length <= 1) return this.getCurrentMedia(); // Do not change if only one media file
    this.currentIndex = (this.currentIndex - 1 + this.mediaFiles.length) % this.mediaFiles.length;
    return this.getCurrentMedia();
  }

  startWatching(interval = 1000) { // Check every second
    this.watchInterval = setInterval(async () => {
      await this.updateMediaList();
    }, interval);
  }

  stop() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }
}