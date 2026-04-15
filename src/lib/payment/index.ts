import type { PaymentRequest, PaymentResponse, PaymentProvider } from "./types";
import { IyzicoProvider } from "./iyzico";
import { logger } from "@/lib/utils/logger";

class PaymentManager {
  private provider: PaymentProvider;

  constructor() {
    // Default to Iyzico
    this.provider = new IyzicoProvider();
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      return await this.provider.processPayment(request);
    } catch (error) {
      logger.payments.error("Payment processing failed", error, { amount: request.amount });
      return { success: false, status: "failure", error: "Ödeme işlemi sırasında bir sistem hatası oluştu." };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    return await this.provider.verifyPayment(transactionId);
  }
}

export const payment = new PaymentManager();
