import { DOPING_PACKAGES } from "@/lib/constants/doping";
import { PaymentService } from "@/services/payments/payment-logic";

export async function initiatePaymentUseCase(params: {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  ip: string;
  listingId: string;
  packageId: string;
  callbackUrl: string;
}) {
  // 1. Validate package
  const pkg = DOPING_PACKAGES.find((p) => p.id === params.packageId);
  if (!pkg) {
    return { success: false, error: "Geçersiz paket." };
  }

  try {
    // 2. Delegate to service
    const result = await PaymentService.initializeCheckoutForm({
      ...params,
      price: pkg.price,
      basketItems: [
        {
          id: pkg.id,
          name: pkg.name,
          category: "Doping",
          price: pkg.price,
        },
      ],
    });

    return {
      success: true,
      paymentPageUrl: result.paymentPageUrl,
      token: result.token,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ödeme başlatılamadı.";
    return {
      success: false,
      error: message,
    };
  }
}
