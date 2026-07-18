import pino from 'pino';
import { createWhatsAppServerConfiguration } from '../config.js';

const configuration = createWhatsAppServerConfiguration();

export const logger = pino({
  level: configuration.logLevel,
  redact: ['*.apiKey', '*.token', '*.password', '*.secret'],
});
