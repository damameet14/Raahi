import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';

export interface PaymentStatusResponse {
  id: string;
  employee_id: string;
  activity_id: string;
  activity_type: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  is_retry_available: boolean;
}

export interface RazorpayOrderResponse {
  payment_id: string;
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

export async function createRazorpayOrderForCompletedActivity(
  activityId: string,
  activityType = 'trip',
) {
  const response = await apiClient.post<RazorpayOrderResponse>(
    '/api/v1/payments/razorpay/orders',
    { activity_id: activityId, activity_type: activityType },
  );
  return response.data;
}

export async function verifyRazorpayCheckoutPayment(
  checkoutResult: RazorpayCheckoutResult,
) {
  const response = await apiClient.post<PaymentStatusResponse>(
    '/api/v1/payments/razorpay/verify',
    checkoutResult,
  );
  return response.data;
}

export async function listMyPayments() {
  const response = await apiClient.get<PaymentStatusResponse[]>(
    '/api/v1/payments/my-payments',
  );
  return response.data;
}

