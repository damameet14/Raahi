/**
 * Fare payment method chooser for a completed, unpaid booking.
 *
 * Cash and wallet settle directly through the backend; card and UPI open
 * Razorpay Checkout and then verify the signed result server-side. On success
 * the parent refreshes so the paid booking drops off the "to pay" list.
 */

import { useState } from "react";
import { Banknote, CreditCard, Loader2, Smartphone, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { BottomSheet } from "../../shared_user_interface_infrastructure/reusable_components/BottomSheet";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";
import {
  createRazorpayOrderForBooking,
  payBookingDirectly,
  verifyRazorpayPayment,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_payment_api";
import type {
  PaymentMethod,
  RazorpayPaymentMethod,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_payment_api";
import { openRazorpayCheckout } from "./razorpayCheckout";

interface PayFareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rideBookingId: string;
  fareAmount: number;
  currency: string;
  onPaid: () => void;
  prefill?: { name?: string; email?: string; phone?: string | null };
}

const PAYMENT_METHOD_OPTIONS: {
  method: PaymentMethod;
  label: string;
  helper: string;
  icon: typeof Wallet;
}[] = [
  {
    method: "WALLET",
    label: "Raahi Wallet",
    helper: "Pay instantly from your wallet balance",
    icon: Wallet,
  },
  {
    method: "UPI",
    label: "UPI",
    helper: "Pay via any UPI app through Razorpay",
    icon: Smartphone,
  },
  {
    method: "CARD",
    label: "Card",
    helper: "Debit or credit card through Razorpay",
    icon: CreditCard,
  },
  {
    method: "CASH",
    label: "Cash",
    helper: "Confirm you paid the driver in cash",
    icon: Banknote,
  },
];

export function PayFareDialog({
  isOpen,
  onClose,
  rideBookingId,
  fareAmount,
  currency,
  onPaid,
  prefill,
}: PayFareDialogProps) {
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);

  async function handleDirectPayment(method: "CASH" | "WALLET") {
    setPendingMethod(method);
    try {
      await payBookingDirectly(rideBookingId, method);
      toast.success(
        method === "WALLET" ? "Paid from your wallet" : "Cash payment recorded",
      );
      onPaid();
      onClose();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Payment could not be completed"));
    } finally {
      setPendingMethod(null);
    }
  }

  async function handleRazorpayPayment(method: RazorpayPaymentMethod) {
    setPendingMethod(method);
    try {
      const order = await createRazorpayOrderForBooking(rideBookingId, method);
      await openRazorpayCheckout(order, {
        prefillName: prefill?.name,
        prefillEmail: prefill?.email,
        prefillContact: prefill?.phone ?? undefined,
        onVerified: async (checkoutResult) => {
          try {
            await verifyRazorpayPayment(checkoutResult);
            toast.success("Payment verified");
            onPaid();
            onClose();
          } catch (verificationError) {
            toast.error(
              extractApiErrorMessage(
                verificationError,
                "We could not verify the payment",
              ),
            );
          } finally {
            setPendingMethod(null);
          }
        },
        onDismissed: () => {
          toast("Payment cancelled. You can retry anytime.");
          setPendingMethod(null);
        },
      });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Payment could not be started"));
      setPendingMethod(null);
    }
  }

  function handleMethodSelected(method: PaymentMethod) {
    if (pendingMethod) {
      return;
    }
    if (method === "CASH" || method === "WALLET") {
      void handleDirectPayment(method);
    } else {
      void handleRazorpayPayment(method);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Pay your fare">
      <p className="mb-4 text-sm text-text-secondary">
        Amount due:{" "}
        <span className="font-bold text-text-primary">
          {currency} {fareAmount.toFixed(2)}
        </span>
      </p>
      <div className="flex flex-col gap-2">
        {PAYMENT_METHOD_OPTIONS.map((option) => {
          const isPending = pendingMethod === option.method;
          return (
            <button
              key={option.method}
              type="button"
              onClick={() => handleMethodSelected(option.method)}
              disabled={pendingMethod !== null}
              className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border-primary)] bg-white p-3 text-left transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-raahi-700">
                {isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <option.icon size={18} />
                )}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">
                  {option.label}
                </span>
                <span className="block text-xs text-text-muted">
                  {option.helper}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
