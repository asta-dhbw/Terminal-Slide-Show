// utils/logger.js
export class Logger {
  constructor(context) {
    this.context = context;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg => 
      arg instanceof Error ? arg.stack : JSON.stringify(arg)
    ).join(' ');
    
    return `[${timestamp}] [${level}] [${this.context}] ${message} ${formattedArgs}`.trim();
  }

  debug(message, ...args) {
    console.debug(this.formatMessage('DEBUG', message, ...args));
  }

  info(message, ...args) {
    console.info(this.formatMessage('INFO', message, ...args));
  }

  warn(message, ...args) {
    console.warn(this.formatMessage('WARN', message, ...args));
  }

  error(message, ...args) {
    console.error(this.formatMessage('ERROR', message, ...args));
  }
}