const winston = require('winston');

// Custom log format to ensure level, timestamp, and message are in specific order
const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  return JSON.stringify({ level, timestamp, message });
});

const logger = winston.createLogger({
  level: 'info',  // Default log level
  format: winston.format.combine(
    winston.format.timestamp(),   // Add timestamp
    customFormat                  // Apply custom format
  ),  
  transports: [
    // Log to error.log only for error level messages
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),

    // Log to warn.log only for warn level messages
    new winston.transports.File({ filename: 'logs/warn.log', level: 'warn' }),

    // Log to info.log only for info level messages
    new winston.transports.File({ filename: 'logs/info.log', level: 'info' }),

    // Log error messages to the console (without colorization for JSON format)
    new winston.transports.Console({
      level: 'warn',
      format: winston.format.combine(
        winston.format.simple(),  // Simple format for console without colorization
        winston.format.timestamp(),  // Add timestamp to console logs
        customFormat  // Use custom format
      )
    }),
  ],
});

module.exports = logger;
