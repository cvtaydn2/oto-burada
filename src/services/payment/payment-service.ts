/* eslint-disable @typescript-eslint/no-explicit-any */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PaymentStatus } from "@/types/payment";

import { getIyzicoClient } from "./iyzico-client";

export class PaymentService {
  /**
   * Initializes a checkout form with Iyzico
   */
  static async initializeCheckoutForm(params: {
    userId: string;
    email: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    ip: string;
    price: number;
    basketItems: { id: string; name: string; category: string; price: number }[];
    callbackUrl: string;
    listingId?: string;
    planId?: string;
  }) {
    const iyzico = getIyzicoClient();
    const admin = createSupabaseAdminClient();

    // SECURITY: Validate required fields
    if (!params.fullName || params.fullName.trim() === "") {
      throw new Error("Ad Soyad bilgisi gereklidir");
    }

    if (!params.phone || params.phone.trim() === "") {
      throw new Error("Telefon numarası gereklidir");
    }

    // SECURITY: Get user's identity number from profile
    const { data: profile } = await admin
      .from("profiles")
      .select("identity_number")
      .eq("id", params.userId)
      .single();

    // KVKK Compliance: Identity number is required for Iyzico
    let identityNumber: string;

    if (process.env.NODE_ENV === "production") {
      // Production: Require real identity number
      if (!profile?.identity_number || profile.identity_number.length !== 11) {
        throw new Error(
          "Ödeme yapabilmek için TC Kimlik Numaranızı profil ayarlarınızdan eklemeniz gerekmektedir."
        );
      }
      identityNumber = profile.identity_number;
    } else {
      // Development/Test: Use test identity number
      identityNumber = profile?.identity_number || "11111111111";
    }

    // 1. Create a pending payment record in DB
    const { data: payment, error: dbError } = await admin
      .from("payments")
      .insert({
        user_id: params.userId,
        amount: params.price,
        currency: "TRY",
        provider: "iyzico",
        status: "pending",
        listing_id: params.listingId,
        plan_id: params.planId,
        package_id: params.basketItems[0]?.id, // SECURITY: Store package_id directly
        description: params.basketItems.map((i) => i.name).join(", "),
        metadata: {
          basketItems: params.basketItems,
        },
      })
      .select()
      .single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    const [name, ...surnameParts] = params.fullName.split(" ");
    const surname = surnameParts.join(" ") || "Soyisim";

    // 2. Prepare Iyzico request
    const request = {
      locale: "tr",
      conversationId: payment.id,
      price: params.price.toString(),
      paidPrice: params.price.toString(),
      currency: "TRY",
      basketId: payment.id,
      paymentGroup: "PRODUCT",
      callbackUrl: params.callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: params.userId,
        name: name || "İsim",
        surname: surname,
        gsmNumber: params.phone,
        email: params.email,
        identityNumber: identityNumber, // KVKK compliant - from user profile
        lastLoginDate: new Date().toISOString().split(".")[0].replace("T", " "),
        registrationDate: new Date().toISOString().split(".")[0].replace("T", " "),
        registrationAddress: params.address,
        ip: params.ip,
        city: params.city,
        country: "Turkey",
        zipCode: "34000",
      },
      shippingAddress: {
        contactName: params.fullName,
        city: params.city,
        country: "Turkey",
        address: params.address,
        zipCode: "34000",
      },
      billingAddress: {
        contactName: params.fullName,
        city: params.city,
        country: "Turkey",
        address: params.address,
        zipCode: "34000",
      },
      basketItems: params.basketItems.map((item) => ({
        id: item.id,
        name: item.name,
        category1: item.category,
        itemType: "VIRTUAL",
        price: item.price.toString(),
      })),
    };

    // 3. Call Iyzico
    return new Promise<{ paymentPageUrl: string; token: string }>((resolve, reject) => {
      iyzico.checkoutFormInitialize.create(request, async (err: any, result: any) => {
        if (err || result.status !== "success") {
          // Update payment record as failed
          await admin
            .from("payments")
            .update({ status: "failure", metadata: { error: err || result } })
            .eq("id", payment.id);

          reject(new Error(result.errorMessage || "Iyzico initialization failed"));
          return;
        }

        // Update payment with token
        await admin.from("payments").update({ iyzico_token: result.token }).eq("id", payment.id);

        resolve({
          paymentPageUrl: result.paymentPageUrl,
          token: result.token,
        });
      });
    });
  }

  /**
   * Retrieves checkout result from Iyzico
   */
  static async retrieveCheckoutResult(token: string) {
    const iyzico = getIyzicoClient();
    const admin = createSupabaseAdminClient();

    return new Promise<{ status: string; paymentId: string; conversationId: string }>(
      (resolve, reject) => {
        iyzico.checkoutForm.retrieve({ locale: "tr", token }, async (err: any, result: any) => {
          if (err || result.status !== "success") {
            reject(new Error(result.errorMessage || "Iyzico retrieval failed"));
            return;
          }

          // Update DB record
          const status: PaymentStatus = result.paymentStatus === "SUCCESS" ? "paid" : "failed";

          await admin
            .from("payments")
            .update({
              status: status === "paid" ? "success" : "failure",
              iyzico_payment_id: result.paymentId,
              processed_at: new Date().toISOString(),
              metadata: result,
            })
            .eq("iyzico_token", token)
            .select()
            .single();

          resolve({
            status: status,
            paymentId: result.paymentId,
            conversationId: result.conversationId,
          });
        });
      }
    );
  }
}
