export type PaymentStatus = "pending" | "success" | "failure";

export interface BuyerInfo {
  id: string;
  name: string;
  surname: string;
  gsmNumber: string;
  email: string;
  identityNumber?: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  ip: string;
  registrationDate: string;
  lastLoginDate: string;
}

export interface PaymentRequest {
  amount: number;
  orderId: string;
  listingId: string;
  userId: string;
  buyer?: BuyerInfo;
  conversationId?: string;
  callbackUrl?: string;
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
