function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatMoney(amount, currency) {
  return `${escapeHtml(currency)} ${Number(amount || 0).toFixed(2)}`;
}

function renderBaseTemplate({ title, preview, bodyHtml, actionUrl, actionLabel, platformName }) {
  const safePlatformName = escapeHtml(platformName || 'Raahi');
  const safeActionUrl = escapeHtml(actionUrl || '#');
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f8f4;font-family:Arial,sans-serif;color:#17251b;">
    <div style="max-width:640px;margin:0 auto;padding:28px;">
      <div style="background:#ffffff;border:1px solid #dce6dc;border-radius:18px;overflow:hidden;">
        <div style="background:#2fb86f;color:#ffffff;padding:24px;">
          <div style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;">${safePlatformName}</div>
          <h1 style="margin:8px 0 0;font-size:26px;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:26px;">
          <p style="margin-top:0;color:#4d5b52;">${escapeHtml(preview)}</p>
          ${bodyHtml}
          <p style="margin:28px 0;">
            <a href="${safeActionUrl}" style="display:inline-block;background:#2fb86f;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 20px;font-weight:700;">${escapeHtml(actionLabel)}</a>
          </p>
          <p style="font-size:12px;color:#6b786e;">This is an automated transactional email. Please do not share payment details with anyone.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function createPaymentPendingEmailTemplate(paymentData) {
  const bodyHtml = `
    <p>Hello ${escapeHtml(paymentData.employeeName)},</p>
    <p>Your completed ${escapeHtml(paymentData.activityType)} is ready for payment.</p>
    <ul>
      <li><strong>Activity:</strong> ${escapeHtml(paymentData.activityReference)}</li>
      <li><strong>Route:</strong> ${escapeHtml(paymentData.routeSummary || 'Not available')}</li>
      <li><strong>Amount:</strong> ${formatMoney(paymentData.amount, paymentData.currency)}</li>
      <li><strong>Status:</strong> ${escapeHtml(paymentData.paymentStatus)}</li>
    </ul>`;
  return {
    subject: 'Payment Pending for Your Completed Ride',
    html: renderBaseTemplate({
      title: 'Payment Pending',
      preview: 'A completed ride payment is waiting for you.',
      bodyHtml,
      actionUrl: paymentData.paymentPageUrl,
      actionLabel: 'Pay Now',
      platformName: paymentData.platformName,
    }),
    text: `Payment pending for ${paymentData.activityReference}. Amount: ${paymentData.currency} ${paymentData.amount}. Pay: ${paymentData.paymentPageUrl}`,
  };
}

export function createPaymentSuccessEmailTemplate(paymentData) {
  const bodyHtml = `
    <p>Hello ${escapeHtml(paymentData.employeeName)},</p>
    <p>Your payment was verified successfully.</p>
    <ul>
      <li><strong>Activity:</strong> ${escapeHtml(paymentData.activityReference)}</li>
      <li><strong>Amount paid:</strong> ${formatMoney(paymentData.amount, paymentData.currency)}</li>
      <li><strong>Razorpay payment ID:</strong> ${escapeHtml(paymentData.razorpayPaymentId || 'Recorded')}</li>
      <li><strong>Paid at:</strong> ${escapeHtml(paymentData.paidAt || 'Just now')}</li>
    </ul>`;
  return {
    subject: 'Payment Successful - Carpooling Platform',
    html: renderBaseTemplate({
      title: 'Payment Successful',
      preview: 'Your completed ride payment was confirmed.',
      bodyHtml,
      actionUrl: paymentData.paymentPageUrl,
      actionLabel: 'View Payments',
      platformName: paymentData.platformName,
    }),
    text: `Payment successful for ${paymentData.activityReference}. Amount: ${paymentData.currency} ${paymentData.amount}. Razorpay payment: ${paymentData.razorpayPaymentId || 'recorded'}.`,
  };
}

export function createPaymentFailedEmailTemplate(paymentData, supportEmail) {
  const bodyHtml = `
    <p>Hello ${escapeHtml(paymentData.employeeName)},</p>
    <p>Your payment attempt could not be completed. Please retry from your payment page.</p>
    <ul>
      <li><strong>Activity:</strong> ${escapeHtml(paymentData.activityReference)}</li>
      <li><strong>Amount:</strong> ${formatMoney(paymentData.amount, paymentData.currency)}</li>
      <li><strong>Status:</strong> ${escapeHtml(paymentData.paymentStatus)}</li>
      <li><strong>Support:</strong> ${escapeHtml(supportEmail || 'Contact your administrator')}</li>
    </ul>`;
  return {
    subject: 'Payment Failed - Please Retry',
    html: renderBaseTemplate({
      title: 'Payment Failed',
      preview: 'Your payment remains retryable.',
      bodyHtml,
      actionUrl: paymentData.paymentPageUrl,
      actionLabel: 'Retry Payment',
      platformName: paymentData.platformName,
    }),
    text: `Payment failed for ${paymentData.activityReference}. Retry: ${paymentData.paymentPageUrl}`,
  };
}

export { escapeHtml };
