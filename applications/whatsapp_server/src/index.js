import express from 'express';
import { createWhatsAppServerConfiguration } from './config.js';
import { createWhatsAppClient, getWhatsAppClientState } from './whatsapp/client.js';
import { logger } from './utils/logger.js';

const configuration = createWhatsAppServerConfiguration();
const application = express();
const whatsappClient = createWhatsAppClient(configuration);

application.use(express.json({ limit: '32kb' }));

function isAuthorized(request) {
  const submittedApiKey = request.header('X-WhatsApp-Notification-Key') || '';
  return submittedApiKey === configuration.whatsappNotificationApiKey;
}

function toWhatsAppId(phoneNumber) {
  const digitsOnly = String(phoneNumber || '').replace(/\D/g, '');
  return digitsOnly ? `${digitsOnly}@c.us` : '';
}

application.get('/health', (_request, response) => {
  response.json({
    status: 'healthy',
    application: 'raahi-whatsapp-server',
    whatsappClientState: getWhatsAppClientState(),
  });
});

// Generic outbound send used by the FastAPI notification dispatcher for every
// ride-lifecycle and reminder message.
application.post('/internal/send-message', async (request, response) => {
  if (!isAuthorized(request)) {
    response.status(401).json({ sent: false, error: 'Unauthorized' });
    return;
  }
  const { phoneNumber, message } = request.body || {};
  const whatsappId = toWhatsAppId(phoneNumber);
  if (!whatsappId) {
    response.status(422).json({ sent: false, error: 'phoneNumber is required' });
    return;
  }
  if (!message || !String(message).trim()) {
    response.status(422).json({ sent: false, error: 'message is required' });
    return;
  }
  if (getWhatsAppClientState() !== 'ready') {
    response.status(503).json({ sent: false, error: 'WhatsApp is not ready' });
    return;
  }
  try {
    await whatsappClient.sendMessage(whatsappId, String(message));
    response.json({ sent: true });
  } catch (error) {
    logger.warn({ errorMessage: error.message }, 'WhatsApp message failed safely');
    response.status(503).json({ sent: false, error: 'WhatsApp send failed' });
  }
});

application.listen(configuration.port, () => {
  logger.info({ port: configuration.port }, 'Raahi WhatsApp server listening');
});

whatsappClient.initialize();
