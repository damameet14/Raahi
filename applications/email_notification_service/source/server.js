import express from 'express';
import {
  sendPaymentFailedEmail,
  sendPaymentPendingEmail,
  sendPaymentSuccessEmail,
  verifyEmailTransporterIfEnabled,
} from './paymentEmailService.js';

const application = express();
const port = Number(process.env.EMAIL_SERVICE_PORT || 8010);

application.use(express.json({ limit: '64kb' }));

function requireInternalEmailToken(request, response, next) {
  const configuredToken = process.env.INTERNAL_EMAIL_SERVICE_TOKEN || '';
  const submittedToken = request.header('X-Internal-Email-Token') || '';
  if (!configuredToken || submittedToken !== configuredToken) {
    response.status(401).json({ error: 'Unauthorized internal email request' });
    return;
  }
  next();
}

async function handlePaymentEmail(request, response, sendEmail) {
  try {
    const deliveryResult = await sendEmail(request.body);
    response.json(deliveryResult);
  } catch (error) {
    console.error('Payment email delivery failed safely:', error.message);
    response.status(502).json({
      sent: false,
      skipped: false,
      reason: 'SMTP delivery failed',
    });
  }
}

application.get('/health', (_request, response) => {
  response.json({ status: 'healthy', application: 'raahi-email-notification-service' });
});

application.post('/internal/payment-pending', requireInternalEmailToken, (request, response) => {
  // NODEMAILER_PAYMENT_EMAIL_INTEGRATION MASTER_AGENT_EMAIL_INTEGRATION_POINT
  handlePaymentEmail(request, response, sendPaymentPendingEmail);
});

application.post('/internal/payment-success', requireInternalEmailToken, (request, response) => {
  handlePaymentEmail(request, response, sendPaymentSuccessEmail);
});

application.post('/internal/payment-failed', requireInternalEmailToken, (request, response) => {
  handlePaymentEmail(request, response, sendPaymentFailedEmail);
});

verifyEmailTransporterIfEnabled()
  .then((result) => {
    if (result.verified) {
      console.log('Email transporter verified successfully.');
    } else {
      console.log('Email transporter skipped because email is disabled.');
    }
  })
  .catch((error) => {
    console.warn('Email transporter verification failed safely:', error.message);
  });

application.listen(port, () => {
  console.log(`Raahi email notification service listening on port ${port}`);
});
