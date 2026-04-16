import type { PaymentRequest, PaymentResponse, PaymentProvider } from "./types";
import { logger } from "@/lib/utils/logger";
import { isPaymentEnabled } from "./config";

export class IyzicoProvider implements PaymentProvider {
  // In a real scenario, we'd use 'iyzipay' npm package.
  // For MVP, we'll implement the logic flow.
  private apiKey = process.env.IYZICO_API_KEY;
  private secretKey = process.env.IYZICO_SECRET_KEY;
  private baseUrl = process.env.IYZICO_BASE_URL;

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!isPaymentEnabled()) {
      return { success: false, status: "failure", error: "Iyzico keys missing." };
    }

    try {
      // Real Iyzico integration logic would go here
      // const iyzico = new Iyzico({...});
      // const result = await iyzico.payment.create({...});
      
      return { success: true, status: "success", transactionId: "real_tx_id" };
    } catch (error) {
      logger.payments.error("Iyzico processPayment failed", error, { listingId: request.listingId, amount: request.amount });
      return { success: false, status: "failure", error: "Ödeme geçidi hatası." };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
     return { success: true, status: "success", transactionId };
  }
}
