// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { config } from '../../../config/config.js';
import { DateParser } from '../utils/dateParser.js';

export class GoogleDriveService {
  constructor() {
    this.logger = new Logger('GoogleDriveService');
    this.downloadPath = path.join(process.cwd(), config.paths.downloadPath);
    this.syncInterval = config.sync.interval;
    this.initialized = false;
  }

  async initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: config.google.serviceAccountPath,
        scopes: [config.google.scopes]
      });

      this.drive = google.drive({ version: config.google.apiVersion, auth });
      await fs.ensureDir(this.downloadPath);
      this.logger.info('Google Drive service initialized');
      this.initialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async startSync(interval = config.sync.interval) {
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncFiles();
      } catch (error) {
        this.logger.error('Sync failed:', error);
      }
    }, interval);

    // Initial sync
    await this.syncFiles();
  }

  async syncFiles() {
    try {
      const files = await this.listFiles();
      this.logger.info(`Found ${files.length} valid files in Google Drive`);

      const localFiles = await fs.readdir(this.downloadPath);

      // Download new files
      for (const file of files) {
        const localPath = path.join(this.downloadPath, file.name);
        
        // Skip if file already exists
        if (await fs.pathExists(localPath)) {
          continue;
        }

        await this.downloadFile(file.id, localPath);
        this.logger.info(`Downloaded: ${file.name}`);
      }

      // Remove local files that are no longer on Google Drive
      for (const localFile of localFiles) {
        if (!files.some(file => file.name === localFile)) {
          const localPath = path.join(this.downloadPath, localFile);
          await fs.remove(localPath);
          this.logger.info(`Removed local file: ${localFile}`);
        }
      }

      return files;
    } catch (error) {
      this.logger.error('Failed to sync files:', error);
      throw error;
    }
  }

  async listFiles() {
    const files = await this.fetchFilesFromDrive();
    const validFiles = files.filter(file => this.isValidFile(file.name));
    return validFiles;
  }

  async fetchFilesFromDrive() {
    try {
      const response = await this.drive.files.list({
        q: `'${config.google.folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        spaces: 'drive'
      });
      return response.data.files;
    } catch (error) {
      this.logger.error('Failed to fetch files from Google Drive:', error);
      throw error;
    }
  }

  isValidFile(filename) {
    const parsedDate = DateParser.parseFileName(filename);
    return parsedDate !== null;
  }

  async downloadFile(fileId, localPath) {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const dest = fs.createWriteStream(localPath);
      response.data.pipe(dest);

      return new Promise((resolve, reject) => {
        dest.on('finish', resolve);
        dest.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Failed to download file ${fileId}:`, error);
      throw error;
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}