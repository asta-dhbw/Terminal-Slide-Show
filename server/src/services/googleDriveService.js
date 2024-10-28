// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { config } from '../../config/config.js';

export class GoogleDriveService {
  constructor() {
    this.logger = new Logger('GoogleDriveService');
    this.downloadPath = path.join(process.cwd(), 'downloads');
    this.syncInterval = null;
  }

  async initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: config.google.serviceAccountPath,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      this.drive = google.drive({ version: 'v3', auth });
      await fs.ensureDir(this.downloadPath);
      this.logger.info('Google Drive service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  async startSync(interval = 300000) { // 5 minutes default
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
      const response = await this.drive.files.list({
        q: `'${config.google.folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        spaces: 'drive'
      });

      const files = response.data.files;
      this.logger.info(`Found ${files.length} files in Google Drive`);

      for (const file of files) {
        const localPath = path.join(this.downloadPath, file.name);
        
        // Skip if file already exists
        if (await fs.pathExists(localPath)) {
          continue;
        }

        await this.downloadFile(file.id, localPath);
        this.logger.info(`Downloaded: ${file.name}`);
      }

      return files;
    } catch (error) {
      this.logger.error('Failed to sync files:', error);
      throw error;
    }
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