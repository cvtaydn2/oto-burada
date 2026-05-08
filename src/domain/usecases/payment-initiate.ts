import { initializePaymentCheckout } from "@/features/payments/services/payment-logic";
import { DOPING_PACKAGES } from "@/lib/doping";

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
    const result = await initializePaymentCheckout({
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
