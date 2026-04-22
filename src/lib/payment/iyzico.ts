import Iyzipay from "iyzipay";

import { getAppUrl } from "@/lib/seo";
import { logger } from "@/lib/utils/logger";

import { isPaymentEnabled } from "./config";
import type { PaymentProvider, PaymentRequest, PaymentResponse } from "./types";

/** Iyzico için zorunlu buyer alanlarını doğrular. Eksik/bozuk alanda hata döner. */
function validateBuyer(buyer: NonNullable<PaymentRequest["buyer"]>): string | null {
  if (!buyer.name?.trim()) return "Alıcı adı eksik.";
  if (!buyer.surname?.trim()) return "Alıcı soyadı eksik.";
  if (!buyer.email?.trim()) return "Alıcı e-posta adresi eksik.";
  if (!buyer.gsmNumber?.trim()) return "Alıcı GSM numarası eksik.";
  if (!buyer.address?.trim()) return "Alıcı adresi eksik.";
  if (!buyer.city?.trim()) return "Alıcı şehri eksik.";
  if (!buyer.country?.trim()) return "Alıcı ülkesi eksik.";
  if (!buyer.ip?.trim()) return "Alıcı IP adresi eksik.";
  // identityNumber Türkiye TC kimlik numarası — 11 haneli rakam olmalı.
  // Sahte fallback ("11111111111") kesinlikle gönderilmez.
  if (!buyer.identityNumber?.trim()) return "TC kimlik numarası zorunludur.";
  if (!/^\d{11}$/.test(buyer.identityNumber.trim()))
    return "TC kimlik numarası 11 haneli rakam olmalıdır.";
  return null;
}

export class IyzicoProvider implements PaymentProvider {
  private iyzipay: InstanceType<typeof Iyzipay> | undefined;

  constructor() {
    if (isPaymentEnabled()) {
      this.iyzipay = new Iyzipay({
        apiKey: process.env.IYZICO_API_KEY as string,
        secretKey: process.env.IYZICO_SECRET_KEY as string,
        uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
      });
    }
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const buyer = request.buyer;

    if (!buyer) {
      return { success: false, status: "failure", error: "Müşteri bilgileri eksik (iyzico)." };
    }

    const validationError = validateBuyer(buyer);
    if (validationError) {
      logger.payments.error("Iyzico buyer validation failed", { error: validationError });
      return { success: false, status: "failure", error: validationError };
    }

    if (!isPaymentEnabled()) {
      return { success: false, status: "failure", error: "Iyzico keys missing." };
    }

    // Callback URL tek kaynaktan — getAppUrl() production domain'i garanti eder.
    const callbackUrl = `${getAppUrl()}/api/payments/webhook`;

    return new Promise((resolve) => {
      const data = {
        locale: "tr",
        conversationId: request.orderId,
        price: Number(request.amount).toFixed(2),
        paidPrice: Number(request.amount).toFixed(2),
        currency: "TRY",
        basketId: request.listingId,
        paymentGroup: "PRODUCT",
        callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: buyer.id,
          name: buyer.name.trim(),
          surname: buyer.surname.trim(),
          gsmNumber: buyer.gsmNumber.trim(),
          email: buyer.email.trim(),
          identityNumber: buyer.identityNumber!.trim(),
          lastLoginDate: buyer.lastLoginDate,
          registrationDate: buyer.registrationDate,
          registrationAddress: buyer.address.trim(),
          ip: buyer.ip.trim(),
          city: buyer.city.trim(),
          country: buyer.country.trim(),
          zipCode: buyer.zipCode,
        },
        shippingAddress: {
          contactName: `${buyer.name.trim()} ${buyer.surname.trim()}`,
          city: buyer.city.trim(),
          country: buyer.country.trim(),
          address: buyer.address.trim(),
          zipCode: buyer.zipCode,
        },
        billingAddress: {
          contactName: `${buyer.name.trim()} ${buyer.surname.trim()}`,
          city: buyer.city.trim(),
          country: buyer.country.trim(),
          address: buyer.address.trim(),
          zipCode: buyer.zipCode,
        },
        basketItems: [
          {
            id: request.listingId,
            name: "OtoBurada Hizmet",
            category1: "Classifieds",
            itemType: "VIRTUAL",
            price: Number(request.amount).toFixed(2),
          },
        ],
      };

      // @ts-expect-error - iyzipay types are incorrectly requiring paymentCard for checkoutFormInitialize
      this.iyzipay?.checkoutFormInitialize.create(
        data,
        (
          err: Error | null,
          result: {
            status: string;
            token?: string;
            paymentPageUrl?: string;
            errorMessage?: string;
          }
        ) => {
          if (err || result.status !== "success") {
            logger.payments.error("Iyzico checkoutFormInitialize failed", err || result);
            resolve({
              success: false,
              status: "failure",
              error: result.errorMessage || "Ödeme bağlantısı oluşturulamadı.",
            });
          } else {
            // Iyzico returns HTML and URL for the checkout form
            resolve({
              success: true,
              status: "success",
              transactionId: result.token as string,
              paymentUrl: result.paymentPageUrl as string,
            });
          }
        }
      );
    });
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    if (!isPaymentEnabled()) return { success: false, status: "failure" };

    return new Promise((resolve) => {
      this.iyzipay?.checkoutForm.retrieve(
        {
          locale: "TR",
          token: transactionId,
        },
        (
          err: Error | null,
          result: {
            status: string;
            paymentStatus?: string;
            paymentId?: string;
          }
        ) => {
          if (err || result.status !== "success") {
            resolve({ success: false, status: "failure" });
          } else {
            resolve({
              success: result.paymentStatus === "SUCCESS",
              status: result.paymentStatus === "SUCCESS" ? "success" : "failure",
              transactionId: result.paymentId,
            });
          }
        }
      );
    });
  }
}
