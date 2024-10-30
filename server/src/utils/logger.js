// utils/logger.js
import { config } from '../../../config/config.js';

export class Logger {
  constructor(context) {
    this.context = context;
    this.level = config.logging.level;
    this.format = config.logging.format;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg => 
      arg instanceof Error ? arg.stack : JSON.stringify(arg)
    ).join(' ');

    if (this.format === 'json') {
      return JSON.stringify([
        timestamp,
        level,
        this.context,
        message
      ]);
    }

    return `${timestamp} ${level} ${this.context} ${message} ${formattedArgs}`.trim();
  }

  log(level, message, ...args) {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(this.level)) {
      console[level](this.formatMessage(level.toUpperCase(), message, ...args));
    }
  }

  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  error(message, ...args) {
    this.log('error', message, ...args);
  }
}