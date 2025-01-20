import { Logger } from '../utils/logger.js';

/**
 * @class PowerManager
 * @description Manages power-saving functionality by controlling service states based on activity
 */
export class PowerManager {
  /**
 * @constructor
 * @param {Object} options - Configuration options
 * @param {number} [options.inactivityTimeout=300000] - Timeout in ms before entering power-save mode
 */
  constructor(options = {}) {
    this.logger = new Logger('PowerManager');
    this.inactivityTimeout = options.inactivityTimeout || 5 * 60 * 1000; // Default 5 minutes
    this.services = new Map(); // Stores registered services
    this.isActive = true;     // Current power state
    this.inactivityTimer = null;
    this.initialized = false;
  }

  initialize() {
    this.initialized = true;
    this.logger.info('Power Manager initialized');
  }

  registerService(name, service) {
    if (!service.pause || !service.resume) {
      throw new Error(`Service ${name} must implement pause() and resume() methods`);
    }
    this.services.set(name, service);
    this.logger.info(`Registered service: ${name}`);
  }

  handleClientActivity() {
    if (!this.isActive) {
      this.resumeServices();
    }
    this.resetInactivityTimer();
  }

  resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.pauseServices();
    }, this.inactivityTimeout);
  }

  async pauseServices() {
    if (!this.isActive) return;

    this.logger.info('Entering power-saving mode');
    this.isActive = false;

    // Clear any existing timers in services before pausing
    for (const [name, service] of this.services) {
      if (service.stop) {
        service.stop();
      }
      try {
        await service.pause();
        this.logger.info(`Paused service: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to pause service ${name}:`, error);
      }
    }
  }

  async resumeServices() {
    if (this.isActive) return;

    this.logger.info('Resuming from power-saving mode');
    this.isActive = true;

    for (const [name, service] of this.services) {
      try {
        await service.resume();
        this.logger.info(`Resumed service: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to resume service ${name}:`, error);
      }
    }
  }

  stop() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}