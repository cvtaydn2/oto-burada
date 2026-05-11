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
  notifications: z.object({
    notifications: z.array(notificationSchema),
  }),
  listingDetail: listingSchema,
  listingsList: z.array(listingSchema),
  paginatedListings: z.object({
    listings: z.array(listingSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasMore: z.boolean(),
  }),
  genericMessage: z.object({
    message: z.string(),
  }),
  favoriteIds: z.object({
    favoriteIds: z.array(z.string()),
  }),
  listingCreate: z.object({
    message: z.string(),
    listing: z.object({
      id: z.string(),
      slug: z.string(),
      status: z.string(),
    }),
  }),
};
