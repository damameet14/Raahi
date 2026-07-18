import { createConversationIdentifier, normalizeWhatsAppPhoneNumber } from './messageNormalizer.js';
import { logger } from '../utils/logger.js';

export function registerWhatsAppMessageHandlers({ client, agentServerClient, deduplicator }) {
  client.on('message', async (message) => {
    if (message.fromMe || !message.body || message.type !== 'chat') {
      return;
    }
    const messageId = message.id?._serialized || message.id?.id || `${message.from}-${message.timestamp}`;
    if (deduplicator.hasAlreadyProcessed(messageId)) {
      logger.info({ messageId }, 'Duplicate WhatsApp message ignored');
      return;
    }

    const whatsappId = message.from;
    const chatRequest = {
      whatsapp_id: whatsappId,
      phone_number: normalizeWhatsAppPhoneNumber(whatsappId),
      message_id: messageId,
      message: message.body,
      timestamp: new Date((message.timestamp || Date.now() / 1000) * 1000).toISOString(),
      conversation_id: createConversationIdentifier(whatsappId),
    };

    logger.info({ whatsappId, messageId }, 'Forwarding WhatsApp message to agent server');
    const agentResponse = await agentServerClient.sendChatMessage(chatRequest);
    await message.reply(agentResponse.reply);
  });

  client.on('disconnected', (reason) => {
    logger.warn({ reason }, 'WhatsApp client disconnected');
  });

  client.on('auth_failure', (message) => {
    logger.error({ message }, 'WhatsApp authentication failed');
  });
}
