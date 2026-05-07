import { z } from "zod";

import { minimumListingImages } from "@/features/shared/lib/domain";
import type { ListingCreateFormValues } from "@/types";

import { baseListingFields } from "./fields";
import { listingImageSchema } from "./images";
import { expertInspectionSchema } from "./inspection";

export const listingCreateSchema = z.object({
  ...baseListingFields,
  images: z.array(listingImageSchema).min(minimumListingImages, "En az 3 fotoğraf eklemelisin"),
  expertInspection: expertInspectionSchema.optional(),
  turnstileToken: z.string().trim().min(1, "Güvenlik doğrulaması gerekli"),
});

// Lazy initialized schema for expensive superRefine blocks
let _listingCreateFormSchema: z.ZodType<ListingCreateFormValues> | null = null;
export const getListingCreateFormSchema = () => {
  if (!_listingCreateFormSchema) {
    _listingCreateFormSchema = listingCreateSchema.extend({
      images: z
        .array(
          z.object({
            fileName: z.string().trim().optional(),
            mimeType: z.string().trim().optional(),
            size: z.coerce.number().int().min(0).optional(),
            storagePath: z.string().trim().optional(),
            url: z.string().trim().optional(),
            placeholderBlur: z.string().trim().nullable().optional(),
            imageType: z.enum(["photo", "360"]).optional(),
          })
        )
        .superRefine((images, context) => {
          const populatedImages = images.filter(
            (image) =>
              image.url &&
              image.url.trim().length > 0 &&
              image.storagePath &&
              image.storagePath.trim().length > 0
          );

          if (populatedImages.length < minimumListingImages) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["images"],
              message: "En az 3 fotoğraf eklemelisin",
            });
          }

          images.forEach((image, index) => {
            const hasUrl = Boolean(image.url && image.url.trim().length > 0);
            const hasStoragePath = Boolean(
              image.storagePath && image.storagePath.trim().length > 0
            );

            if (!hasUrl && !hasStoragePath) {
              return;
            }

            if (!hasUrl || !hasStoragePath) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["images", index, "url"],
                message: "Fotoğrafı önce yüklemelisin",
              });
              return;
            }

            const parsedUrl = z
              .string()
              .trim()
              .url("Geçerli bir fotoğraf bağlantısı gir")
              .safeParse(image.url);

            if (!parsedUrl.success) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["images", index, "url"],
                message: "Geçerli bir fotoğraf bağlantısı gir",
              });
            }
          });
        }),
    });
  }
  return _listingCreateFormSchema;
};

// Maintain compatibility (deprecated)
export const listingCreateFormSchema = z.lazy(() => getListingCreateFormSchema());
