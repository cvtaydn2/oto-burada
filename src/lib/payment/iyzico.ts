import type { PaymentRequest, PaymentResponse, PaymentProvider } from "./types";
import { logger } from "@/lib/utils/logger";
import { isPaymentEnabled } from "./config";
// @ts-ignore - iyzipay types might be tricky sometimes
import Iyzipay from "iyzipay";

export class IyzicoProvider implements PaymentProvider {
  private iyzipay: any;

  constructor() {
    if (isPaymentEnabled()) {
      this.iyzipay = new Iyzipay({
        apiKey: process.env.IYZICO_API_KEY as string,
        secretKey: process.env.IYZICO_SECRET_KEY as string,
        uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com"
      });
    }
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!isPaymentEnabled()) {
      return { success: false, status: "failure", error: "Iyzico keys missing." };
    }

    return new Promise((resolve) => {
      const data = {
        locale: "tr",
        conversationId: request.orderId,
        price: request.amount.toString(),
        paidPrice: request.amount.toString(),
        currency: "TRY",
        basketId: request.listingId,
        paymentGroup: "PRODUCT",
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: request.userId,
          name: "User",
          surname: "OtoBurada",
          gsmNumber: "+905320000000",
          email: "user@otoburada.com",
          identityNumber: "11111111111",
          lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          registrationDate: "2023-01-01 00:00:00",
          registrationAddress: "Sanal Adres",
          ip: "127.0.0.1",
          city: "Istanbul",
          country: "Turkey",
          zipCode: "34000"
        },
        shippingAddress: {
          contactName: "User",
          city: "Istanbul",
          country: "Turkey",
          address: "Sanal Adres",
          zipCode: "34000"
        },
        billingAddress: {
          contactName: "User",
          city: "Istanbul",
          country: "Turkey",
          address: "Sanal Adres",
          zipCode: "34000"
        },
        basketItems: [
          {
            id: request.listingId,
            name: "OtoBurada Hizmet",
            category1: "Classifieds",
            itemType: "VIRTUAL",
            price: request.amount.toString()
          }
        ]
      };

      this.iyzipay.checkoutFormInitialize.create(data, (err: any, result: any) => {
        if (err || result.status !== "success") {
          logger.payments.error("Iyzico checkoutFormInitialize failed", err || result);
          resolve({ 
            success: false, 
            status: "failure", 
            error: result?.errorMessage || "Ödeme bağlantısı oluşturulamadı." 
          });
        } else {
          // Iyzico returns HTML and URL for the checkout form
          resolve({ 
            success: true, 
            status: "success", 
            transactionId: result.token, 
            paymentUrl: result.paymentPageUrl 
          });
        }
      });
    });
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    if (!isPaymentEnabled()) return { success: false, status: "failure" };

    return new Promise((resolve) => {
      this.iyzipay.checkoutForm.retrieve({
        locale: "tr",
        token: transactionId
      }, (err: any, result: any) => {
        if (err || result.status !== "success") {
          resolve({ success: false, status: "failure" });
        } else {
          resolve({ 
            success: result.paymentStatus === "SUCCESS", 
            status: result.paymentStatus === "SUCCESS" ? "success" : "failure", 
            transactionId: result.paymentId 
          });
        }
      });
    });
  }
}
