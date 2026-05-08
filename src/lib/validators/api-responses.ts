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
        details: z.unknown().optional(),
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
  paginatedListings: createApiResponseSchema(
    z.object({
      listings: z.array(listingSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      hasMore: z.boolean(),
    })
  ),
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
  listingCreate: createApiResponseSchema(
    z.object({
      message: z.string(),
      listing: z.object({
        id: z.string(),
        slug: z.string(),
        status: z.string(),
      }),
    })
  ),
};
