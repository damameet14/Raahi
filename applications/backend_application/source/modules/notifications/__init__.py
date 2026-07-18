"""Outbound notification delivery (email + WhatsApp) for Raahi.

This module owns how the platform reaches employees outside the app:
transactional email over SMTP and WhatsApp messages through the
whatsapp-web.js sidecar. Every send is best-effort — a delivery failure is
logged and never propagates, so notifications can never roll back ride,
payment, or account state.
"""
