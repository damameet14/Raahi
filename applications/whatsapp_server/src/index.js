import express from 'express';
import { createWhatsAppServerConfiguration } from './config.js';
import { AgentServerClient } from './services/agentClient.js';
import { createWhatsAppClient, getWhatsAppClientState } from './whatsapp/client.js';
import { registerWhatsAppMessageHandlers } from './whatsapp/handlers.js';
import { RecentMessageDeduplicator } from './utils/deduplication.js';
import { logger } from './utils/logger.js';

const configuration = createWhatsAppServerConfiguration();
const application = express();
const agentServerClient = new AgentServerClient(configuration);
const whatsappClient = createWhatsAppClient(configuration);
const deduplicator = new RecentMessageDeduplicator();

application.use(express.json({ limit: '32kb' }));

application.get('/health', (_request, response) => {
  response.json({
    status: 'healthy',
    application: 'raahi-whatsapp-server',
    whatsappClientState: getWhatsAppClientState(),
  });
});

application.get('/ready', async (_request, response) => {
  const agentReadiness = await agentServerClient.checkReadiness();
  response.json({
    status: agentReadiness.reachable && getWhatsAppClientState() === 'ready' ? 'ready' : 'degraded',
    whatsappClientState: getWhatsAppClientState(),
    agentServerReachable: agentReadiness.reachable,
    agentServer: agentReadiness.data,
  });
});

application.post('/internal/send-welcome-message', async (request, response) => {
  const submittedApiKey = request.header('X-WhatsApp-Notification-Key') || '';
  if (submittedApiKey !== configuration.whatsappNotificationApiKey) {
    response.status(401).json({ sent: false, error: 'Unauthorized' });
    return;
  }
  const { phoneNumber, displayName, eventName } = request.body;
  const digitsOnly = String(phoneNumber || '').replace(/\D/g, '');
  if (!digitsOnly) {
    response.status(422).json({ sent: false, error: 'phoneNumber is required' });
    return;
  }
  const whatsappId = `${digitsOnly}@c.us`;
  const safeDisplayName = displayName || 'there';
  const welcomeMessage = eventName === 'login'
    ? `Welcome back to Raahi, ${safeDisplayName}! Your carpooling assistant is ready on WhatsApp.`
    : `Welcome to Raahi, ${safeDisplayName}! You can ask this WhatsApp assistant about supported carpooling information after login.`;
  try {
    await whatsappClient.sendMessage(whatsappId, welcomeMessage);
    response.json({ sent: true });
  } catch (error) {
    logger.warn({ errorMessage: error.message }, 'Welcome WhatsApp message failed safely');
    response.status(503).json({ sent: false, error: 'WhatsApp is not ready' });
  }
});

registerWhatsAppMessageHandlers({
  client: whatsappClient,
  agentServerClient,
  deduplicator,
});

application.listen(configuration.port, () => {
  logger.info({ port: configuration.port }, 'Raahi WhatsApp server listening');
});

whatsappClient.initialize();
