import winston from 'winston';
import { getEnvVariable } from '../config/env';

const logLevel = getEnvVariable('LOG_LEVEL', 'info');
const logToFile = getEnvVariable('LOG_TO_FILE', 'false') === 'true';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(
        ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
      )
    ),
  }),
];

if (logToFile) {
  transports.push(
    new winston.transports.File({
      filename: 'tokenizer.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  transports,
  handleExceptions: true,
  handleRejections: true,
});

export function logSecurityEvent(message: string, meta?: any) {
  logger.warn(`SECURITY: ${message}`, meta);
}

export function logTokenOperation(operation: string, token: string, meta?: any) {
  logger.info(`TOKEN ${operation}: ${token.substring(0, 8)}...`, {
    ...meta,
    tokenPrefix: token.substring(0, 8),
  });
}