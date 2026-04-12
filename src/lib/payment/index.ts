import type { PaymentRequest, PaymentResponse, PaymentProvider } from "./types";
import { IyzicoProvider } from "./iyzico";

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
      console.error("Payment Manager Error:", error);
      return { success: false, status: "failure", error: "Ödeme işlemi sırasında bir sistem hatası oluştu." };
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    return await this.provider.verifyPayment(transactionId);
  }
}

export const payment = new PaymentManager();
