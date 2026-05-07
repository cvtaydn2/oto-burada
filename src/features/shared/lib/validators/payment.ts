import { z } from "zod";

export const initiatePaymentSchema = z.object({
  listingId: z.string().uuid(),
  packageId: z.string(),
});

export const iyzicoCallbackSchema = z.object({
  token: z.string(),
});

export const dopingPurchaseSchema = z.object({
  listingId: z.string().uuid(),
  packageId: z.string(),
  paymentId: z.string().optional(),
});
