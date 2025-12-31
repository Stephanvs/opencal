import path from "path";
import { createLogger, format, transports } from "winston";
import { Global } from "./global";

const logDir = Global.Path.log;
const logFile = path.join(logDir, "app.log");

export const logger = createLogger({
  level: "info",
  format: format.combine(format.errors({ stack: true }), format.json()),
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    // File transport for persistent logging
    new transports.File({
      filename: logFile,
      format: format.json(),
    }),
  ],
});
