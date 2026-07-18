import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
import { logger } from '../utils/logger.js';

const { Client, LocalAuth } = pkg;

let whatsappClientState = 'initializing';

export function getWhatsAppClientState() {
  return whatsappClientState;
}

export function createWhatsAppClient(configuration) {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: configuration.whatsappClientId }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (qrCode) => {
    whatsappClientState = 'qr_required';
    qrcode.generate(qrCode, { small: true });
    logger.info('Scan the QR code to connect WhatsApp Web.');
  });

  client.on('ready', () => {
    whatsappClientState = 'ready';
    logger.info('WhatsApp client is ready.');
  });

  client.on('loading_screen', () => {
    whatsappClientState = 'loading';
  });

  client.on('disconnected', () => {
    whatsappClientState = 'disconnected';
  });

  client.on('auth_failure', () => {
    whatsappClientState = 'authentication_failed';
  });

  return client;
}
