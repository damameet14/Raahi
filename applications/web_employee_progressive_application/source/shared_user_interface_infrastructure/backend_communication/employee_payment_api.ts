/** Fare payment and wallet API calls, mirroring the backend JSON contracts. */

import { employeeApiClient } from "./employee_api_client";

export type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET";
export type DirectPaymentMethod = "CASH" | "WALLET";
export type RazorpayPaymentMethod = "CARD" | "UPI";
export type PaymentStatus = "PENDING" | "CREATED" | "COMPLETED" | "FAILED";

export interface PaymentResponse {
  id: string;
  ride_booking_id: string;
  payer_employee_id: string;
  payee_employee_id: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface RazorpayOrderResponse {
  payment_id: string;
  ride_booking_id: string;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
  company_name: string;
  description: string;
  theme_color: string;
}

export interface RazorpayCheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export type WalletTransactionType = "RECHARGE" | "RIDE_PAYMENT" | "RIDE_EARNING";
export type WalletTransactionDirection = "CREDIT" | "DEBIT";
export type WalletTransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface WalletBalanceResponse {
  employee_id: string;
  balance_amount: number;
  currency: string;
}

export interface WalletTransactionResponse {
  id: string;
  transaction_type: WalletTransactionType;
  direction: WalletTransactionDirection;
  amount: number;
  balance_after: number | null;
  status: WalletTransactionStatus;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface WalletRechargeOrderResponse {
  transaction_id: string;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
  company_name: string;
  description: string;
  theme_color: string;
}

// ── Fare payments ──────────────────────────────────────────
export async function createRazorpayOrderForBooking(
  rideBookingId: string,
  method: RazorpayPaymentMethod,
): Promise<RazorpayOrderResponse> {
  const response = await employeeApiClient.post<RazorpayOrderResponse>(
    "/api/v1/payments/razorpay/orders",
    { ride_booking_id: rideBookingId, method },
  );
  return response.data;
}

export async function verifyRazorpayPayment(
  checkoutResult: RazorpayCheckoutResult,
): Promise<PaymentResponse> {
  const response = await employeeApiClient.post<PaymentResponse>(
    "/api/v1/payments/razorpay/verify",
    checkoutResult,
  );
  return response.data;
}

export async function payBookingDirectly(
  rideBookingId: string,
  method: DirectPaymentMethod,
): Promise<PaymentResponse> {
  const response = await employeeApiClient.post<PaymentResponse>(
    `/api/v1/payments/bookings/${rideBookingId}/pay`,
    { method },
  );
  return response.data;
}

export async function listMyPayments(): Promise<PaymentResponse[]> {
  const response = await employeeApiClient.get<PaymentResponse[]>(
    "/api/v1/payments/my-payments",
  );
  return response.data;
}

// ── Wallet ─────────────────────────────────────────────────
export async function getWalletBalance(): Promise<WalletBalanceResponse> {
  const response = await employeeApiClient.get<WalletBalanceResponse>(
    "/api/v1/wallet",
  );
  return response.data;
}

export async function listWalletTransactions(): Promise<
  WalletTransactionResponse[]
> {
  const response = await employeeApiClient.get<WalletTransactionResponse[]>(
    "/api/v1/wallet/transactions",
  );
  return response.data;
}

export async function createWalletRechargeOrder(
  amount: number,
): Promise<WalletRechargeOrderResponse> {
  const response = await employeeApiClient.post<WalletRechargeOrderResponse>(
    "/api/v1/wallet/recharge/orders",
    { amount },
  );
  return response.data;
}

export async function verifyWalletRecharge(
  checkoutResult: RazorpayCheckoutResult,
): Promise<WalletBalanceResponse> {
  const response = await employeeApiClient.post<WalletBalanceResponse>(
    "/api/v1/wallet/recharge/verify",
    checkoutResult,
  );
  return response.data;
}
