import dotenv from 'dotenv';

dotenv.config();

export function createWhatsAppServerConfiguration() {
  return {
    port: Number(process.env.PORT || 3001),
    agentServerUrl: process.env.AGENT_SERVER_URL || 'http://localhost:8001',
    agentServerApiKey: process.env.AGENT_SERVER_API_KEY || 'replace_with_internal_key',
    agentRequestTimeoutMilliseconds: Number(process.env.AGENT_REQUEST_TIMEOUT_MS || 65000),
    whatsappClientId: process.env.WHATSAPP_CLIENT_ID || 'raahi-hackathon-chatbot',
    whatsappNotificationApiKey: process.env.WHATSAPP_NOTIFICATION_API_KEY || 'replace_with_notification_key',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
