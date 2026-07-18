import dotenv from 'dotenv';

dotenv.config();

export function createWhatsAppServerConfiguration() {
  return {
    port: Number(process.env.PORT || 8090),
    whatsappClientId: process.env.WHATSAPP_CLIENT_ID || 'raahi-notifications',
    whatsappNotificationApiKey:
      process.env.WHATSAPP_NOTIFICATION_API_KEY || 'replace_with_notification_key',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
