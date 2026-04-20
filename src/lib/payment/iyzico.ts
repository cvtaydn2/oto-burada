import type { PaymentRequest, PaymentResponse, PaymentProvider } from "./types";
import { logger } from "@/lib/utils/logger";
import { isPaymentEnabled } from "./config";
import Iyzipay from "iyzipay";

export class IyzicoProvider implements PaymentProvider {
  private iyzipay: InstanceType<typeof Iyzipay> | undefined;

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
    const buyer = request.buyer;

    if (!buyer) {
      return { success: false, status: "failure", error: "Müşteri bilgileri eksik (iyzico)." };
    }

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
          id: buyer.id,
          name: buyer.name,
          surname: buyer.surname,
          gsmNumber: buyer.gsmNumber,
          email: buyer.email,
          identityNumber: buyer.identityNumber || "11111111111",
          lastLoginDate: buyer.lastLoginDate,
          registrationDate: buyer.registrationDate,
          registrationAddress: buyer.address,
          ip: buyer.ip,
          city: buyer.city,
          country: buyer.country,
          zipCode: buyer.zipCode
        },
        shippingAddress: {
          contactName: `${buyer.name} ${buyer.surname}`,
          city: buyer.city,
          country: buyer.country,
          address: buyer.address,
          zipCode: buyer.zipCode
        },
        billingAddress: {
          contactName: `${buyer.name} ${buyer.surname}`,
          city: buyer.city,
          country: buyer.country,
          address: buyer.address,
          zipCode: buyer.zipCode
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

      // @ts-expect-error - iyzipay types are incorrectly requiring paymentCard for checkoutFormInitialize
      this.iyzipay?.checkoutFormInitialize.create(data, (err: Error | null, result: {
        status: string;
        token?: string;
        paymentPageUrl?: string;
        errorMessage?: string;
      }) => {
        if (err || result.status !== "success") {
          logger.payments.error("Iyzico checkoutFormInitialize failed", err || result);
          resolve({ 
            success: false, 
            status: "failure", 
            error: result.errorMessage || "Ödeme bağlantısı oluşturulamadı." 
          });
        } else {
          // Iyzico returns HTML and URL for the checkout form
          resolve({ 
            success: true, 
            status: "success", 
            transactionId: result.token as string, 
            paymentUrl: result.paymentPageUrl as string
          });
        }
      });
    });
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    if (!isPaymentEnabled()) return { success: false, status: "failure" };

    return new Promise((resolve) => {
      this.iyzipay?.checkoutForm.retrieve({
        locale: "TR",
        token: transactionId
      }, (err: Error | null, result: {
        status: string;
        paymentStatus?: string;
        paymentId?: string;
      }) => {
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
