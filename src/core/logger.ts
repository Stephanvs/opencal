import { createLogger, format, transports } from 'winston';
import path from 'path';
import os from 'os';
import fs from 'fs';

const logDir = path.join(os.homedir(), '.opencal', 'logs');
const logFile = path.join(logDir, 'app.log');

// Ensure log directory exists
fs.mkdirSync(logDir, { recursive: true });

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // File transport for persistent logging
    new transports.File({
      filename: logFile,
      format: format.json()
    })
  ]
});

export default logger;