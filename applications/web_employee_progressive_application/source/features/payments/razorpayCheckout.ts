/**
 * On-demand loader and typed wrapper for Razorpay Checkout.
 *
 * The Checkout script is fetched from Razorpay's CDN only when a payment
 * actually starts, so it never affects initial load. Callers hand us the
 * order details returned by the backend and a handler that verifies the
 * signed result server-side.
 */

import type { RazorpayCheckoutResult } from "../../shared_user_interface_infrastructure/backend_communication/employee_payment_api";

const RAZORPAY_CHECKOUT_SCRIPT_URL =
  "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayCheckoutInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayCheckoutInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export interface RazorpayCheckoutOrder {
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
  company_name: string;
  description: string;
  theme_color: string;
}

export interface RazorpayCheckoutHandlers {
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
  onVerified: (result: RazorpayCheckoutResult) => void | Promise<void>;
  onDismissed?: () => void;
}

function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const scriptElement = document.createElement("script");
    scriptElement.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
    scriptElement.onload = () => resolve(true);
    scriptElement.onerror = () => resolve(false);
    document.body.appendChild(scriptElement);
  });
}

/**
 * Open Razorpay Checkout for a backend-created order. Resolves once the modal
 * has opened; payment success flows through ``handlers.onVerified``. Throws if
 * the Checkout script cannot be loaded.
 */
export async function openRazorpayCheckout(
  order: RazorpayCheckoutOrder,
  handlers: RazorpayCheckoutHandlers,
): Promise<void> {
  const wasScriptLoaded = await loadRazorpayCheckoutScript();
  if (!wasScriptLoaded || !window.Razorpay) {
    throw new Error("Unable to load the Razorpay checkout");
  }

  const checkout = new window.Razorpay({
    key: order.razorpay_key_id,
    amount: order.amount,
    currency: order.currency,
    name: order.company_name,
    description: order.description,
    order_id: order.razorpay_order_id,
    theme: { color: order.theme_color },
    prefill: {
      name: handlers.prefillName,
      email: handlers.prefillEmail,
      contact: handlers.prefillContact,
    },
    handler: (checkoutResult: RazorpayCheckoutResult) => {
      void handlers.onVerified(checkoutResult);
    },
    modal: {
      ondismiss: () => handlers.onDismissed?.(),
    },
  });
  checkout.open();
}
