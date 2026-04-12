export type PaymentStatus = "pending" | "success" | "failure";

export interface PaymentRequest {
  amount: number;
  orderId: string;
  listingId: string;
  userId: string;
}

export interface PaymentResponse {
  success: boolean;
  status: PaymentStatus;
  transactionId?: string;
  error?: string;
  paymentUrl?: string; // For redirect-based payments
}

export interface PaymentProvider {
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<PaymentResponse>;
}
