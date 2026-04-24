import { z } from "zod";

import { listingSchema } from "./listing";
import { notificationSchema } from "./notification";

/**
 * Standard API Response Wrapper Schema
 */
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        message: z.string(),
        code: z.string().optional(),
      })
      .optional(),
  });
}

/**
 * Common Response Schemas
 */
export const apiResponseSchemas = {
  notifications: createApiResponseSchema(
    z.object({
      notifications: z.array(notificationSchema),
    })
  ),
  listingDetail: createApiResponseSchema(listingSchema),
  listingsList: createApiResponseSchema(z.array(listingSchema)),
  genericMessage: createApiResponseSchema(
    z.object({
      message: z.string(),
    })
  ),
  favoriteIds: createApiResponseSchema(
    z.object({
      favoriteIds: z.array(z.string()),
    })
  ),
};
