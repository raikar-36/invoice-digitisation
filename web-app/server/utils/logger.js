/**
 * Logger utility with conditional logging based on environment
 * Only logs in development mode to avoid performance impact in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isVerbose = process.env.LOG_VERBOSE === 'true';

const logger = {
  // Always log errors
  error: (...args) => {
    console.error(...args);
  },

  // Always log warnings
  warn: (...args) => {
    console.warn(...args);
  },

  // Only log info in development
  info: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // Only log debug in development with verbose flag
  debug: (...args) => {
    if (isDevelopment && isVerbose) {
      console.log(...args);
    }
  },

  // Transaction logs (only in verbose mode)
  transaction: (...args) => {
    if (isDevelopment && isVerbose) {
      console.log(...args);
    }
  },

  // Success messages (only in development)
  success: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  }
};

module.exports = logger;
