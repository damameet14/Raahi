export function normalizeWhatsAppPhoneNumber(whatsappId) {
  const rawPhoneNumber = String(whatsappId || '').split('@')[0];
  const digitsOnly = rawPhoneNumber.replace(/\D/g, '');
  return digitsOnly ? `+${digitsOnly}` : '';
}

export function createConversationIdentifier(whatsappId) {
  return String(whatsappId || '').replace(/[^a-zA-Z0-9_@.-]/g, '_');
}
