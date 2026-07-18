import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  createRazorpayOrderForCompletedActivity,
  verifyRazorpayCheckoutPayment,
} from './paymentProcessingApiClient';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface RazorpayCheckoutButtonProps {
  activityId: string;
  activityType?: string;
  disabled?: boolean;
  onPaymentCompleted?: () => void;
}

function loadRazorpayCheckoutScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://checkout.razorpay.com/v1/checkout.js';
    scriptElement.onload = () => resolve(true);
    scriptElement.onerror = () => resolve(false);
    document.body.appendChild(scriptElement);
  });
}

export function RazorpayCheckoutButton({
  activityId,
  activityType = 'trip',
  disabled = false,
  onPaymentCompleted,
}: RazorpayCheckoutButtonProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  async function startCheckout() {
    if (isProcessingPayment) {
      return;
    }
    setIsProcessingPayment(true);
    try {
      const wasScriptLoaded = await loadRazorpayCheckoutScript();
      if (!wasScriptLoaded || !window.Razorpay) {
        toast.error('Unable to load Razorpay checkout.');
        return;
      }

      const order = await createRazorpayOrderForCompletedActivity(activityId, activityType);
      const checkout = new window.Razorpay({
        key: order.razorpay_key_id,
        amount: order.amount,
        currency: order.currency,
        name: order.company_name,
        description: order.description,
        order_id: order.razorpay_order_id,
        theme: { color: order.theme_color },
        handler: async (checkoutResult: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await verifyRazorpayCheckoutPayment(checkoutResult);
          toast.success('Payment verified successfully.');
          onPaymentCompleted?.();
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled. You can retry anytime.');
          },
        },
      });
      checkout.open();
    } catch (error) {
      toast.error('Payment could not be started. Please retry.');
    } finally {
      setIsProcessingPayment(false);
    }
  }

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={disabled || isProcessingPayment}
      className="rounded-full bg-raahi-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-raahi-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isProcessingPayment ? 'Processing...' : 'Pay Now'}
    </button>
  );
}

