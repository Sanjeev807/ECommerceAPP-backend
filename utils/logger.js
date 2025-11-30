const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  writeToFile(level, message, data = null) {
    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  info(message, data = null) {
    const timestamp = this.formatTimestamp();
    this.writeToFile('INFO', message, data);
  }

  error(message, error = null) {
    const timestamp = this.formatTimestamp();
    this.writeToFile('ERROR', message, error ? {
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code })
    } : null);
  }

  warn(message, data = null) {
    const timestamp = this.formatTimestamp();
    this.writeToFile('WARN', message, data);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = this.formatTimestamp();
      this.writeToFile('DEBUG', message, data);
    }
  }

  request(req, res, duration) {
    const timestamp = this.formatTimestamp();
    const method = req.method;
    const url = req.url;
    const statusCode = res.statusCode;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown';
    const contentLength = res.getHeader('Content-Length') || 0; // Use getHeader instead of get

    const message = `${ip} "${method} ${url}" ${statusCode} ${contentLength} "${userAgent}" ${duration}ms`;
    
    this.writeToFile('REQUEST', message, {
      ip,
      method,
      url,
      statusCode,
      userAgent,
      duration,
      contentLength
    });
  }
}

module.exports = new Logger();